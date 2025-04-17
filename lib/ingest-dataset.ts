import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import { db } from '../server/utils/db'; // Adjust path if your script location is different
import { supermarkets, products } from '../server/db/schema';
import { eq } from 'drizzle-orm';
import { consola } from 'consola';
import { createId } from '@paralleldrive/cuid2'; // Import cuid2
import { embedMany, generateObject, generateText } from 'ai'; // Import embedMany and generateObject
import { openai } from '@ai-sdk/openai'; // Import openai
import { performance } from 'perf_hooks'; // Import performance
import { z } from 'zod'; // Import zod for schema validation

// Define interfaces for the JSON data structure
interface ProductData {
  n: string; // name
  l: string; // link
  p: number; // price
  s?: string; // amount (optional)
}

interface SupermarketData {
  n: string; // name
  d: ProductData[]; // products data
}

// Zod schema for the AI model's structured output
const StandardizedUnitSchema = z.object({
  unit: z
    .enum(['kg', 'liter', 'piece'])
    .nullable()
    .describe(
      "The standardized unit ('kg', 'liter', 'piece'). Use null if it cannot be determined."
    ),
  quantity: z
    .number()
    .nullable()
    .describe(
      'The quantity in the specified standardized unit. Use null if it cannot be determined.'
    ),
});

const dataFilePath = path.join(
  process.cwd(),
  'data',
  'supermarkets.json'
);

// --- Helper Function for Standardized Price Calculation ---
async function calculateStandardizedPrice(
  name: string,
  price: number,
  amount: string | undefined
): Promise<{
  standardized_price_per_unit: number | null;
  standardized_unit: 'kg' | 'liter' | 'piece' | null;
}> {
  try {
    // Construct the prompt for the AI model
    const prompt = `Analyze the following product information:
      Name: ${name}
      Price: €${price}
      Amount String: ${amount || 'N/A'}

      Determine the standard unit (kg, liter, or piece) and the quantity in that unit based *only* on the provided 'Amount String' and 'Name' if the amount string is unclear or missing.
      - If the amount and/or name clearly indicates volume (e.g., "750ml", "1.5L", "6x330ml"), use 'liter' and calculate the total liters.
      - If the amount and/or name clearly indicates weight (e.g., "500g", "1 kg", "2x250g"), use 'kg' and calculate the total kilograms.
      - If the amount and/or name indicates a number of items (e.g., "6 stuks", "per stuk", "12 rollen", "zakjes"), or if no specific weight/volume is given but the name implies a countable item (e.g., "Avocado"), use 'piece' and determine the number of pieces (default to 1 if unclear).
      - If the unit or quantity cannot be reliably determined from the amount string or name, return null for both 'unit' and 'quantity'. Prioritize information in the 'Amount String'.

      Provide the result as a JSON object matching the provided schema.
    `;

    const startTime = Date.now(); // Timestamp start
    consola.info(
      `[${startTime}] Calling generateObject for: "${name}" - ${price} - ${amount}`
    );
    const { object: standardizedInfo } = await generateObject({
      model: openai('gpt-4.1-nano-2025-04-14'),
      schema: StandardizedUnitSchema,
      mode: 'json',
      prompt: prompt,
    });
    const endTime = Date.now(); // Timestamp end
    consola.info(
      `[${endTime}] Standardized Info for "${name}":`,
      standardizedInfo
    );
    consola.success(
      `[${endTime}] Received response for "${name}" (took ${endTime - startTime}ms)`
    );

    // Calculate standardized price
    if (
      standardizedInfo.unit &&
      standardizedInfo.quantity &&
      standardizedInfo.quantity > 0
    ) {
      const standardized_price_per_unit =
        price / standardizedInfo.quantity;
      return {
        standardized_price_per_unit: parseFloat(
          standardized_price_per_unit.toFixed(4)
        ), // Store with reasonable precision
        standardized_unit: standardizedInfo.unit,
      };
    } else {
      // Could not determine or quantity is zero/invalid
      return {
        standardized_price_per_unit: null,
        standardized_unit: null,
      };
    }
  } catch (error: any) {
    consola.warn(
      `AI calculation failed for product "${name}": ${error}. Returning nulls.`
    );
    // Just return nulls on error
    return {
      standardized_price_per_unit: null,
      standardized_unit: null,
    };
  }
}

// --- Test Function for Single Product AI Call ---
/* // Removing the test function
async function testSingleProductAI() {
  consola.info('Starting single product AI test...');

  // Example product data (using the one that failed)
  const testProduct = {
    name: 'Nestlé Crunch melkchocolade reep',
    price: 1.25,
    amount: '100g', // Example amount, adjust if needed
  };

  try {
    const result = await calculateStandardizedPrice(
      testProduct.name,
      testProduct.price,
      testProduct.amount
    );
    consola.success('AI Calculation Result:', result);
  } catch (error: any) {
    consola.error('Single product AI test failed:', error.message);
    // Log the full error if needed for more details
    // consola.error(error);
  }
}
*/

// --- Main Ingestion Function ---
async function ingestData() {
  const startTime = performance.now(); // Record start time
  consola.info('Starting data ingestion...');
  consola.warn(
    'AI-based standardized price calculation is enabled. This may increase processing time and cost.'
  );

  try {
    // --- Empty Tables ---
    consola.info(
      'Emptying existing products and supermarkets tables...'
    );
    await db.delete(products); // Delete all products first due to foreign key constraint
    await db.delete(supermarkets);
    consola.info('Tables emptied successfully.');
    // --- End Empty Tables ---

    // Read and parse the JSON file
    const jsonData = fs.readFileSync(dataFilePath, 'utf-8');
    const supermarketsData: SupermarketData[] = JSON.parse(jsonData);
    const totalProducts = supermarketsData.reduce(
      (acc, supermarket) => acc + supermarket.d.length,
      0
    );

    consola.info(
      `Found ${supermarketsData.length} supermarkets and ${totalProducts} products in the JSON file.`
    );

    let totalProductsInserted = 0;
    let totalSupermarketsInserted = 0;
    let totalSupermarketsSkipped = 0;
    let totalProductsSkipped = 0;

    // Iterate over each supermarket in the JSON data
    for (const supermarket of supermarketsData) {
      if (
        !supermarket ||
        !supermarket.n ||
        !Array.isArray(supermarket.d)
      ) {
        consola.warn(
          'Skipping invalid supermarket entry:',
          supermarket
        );
        continue;
      }

      const supermarketName = supermarket.n;
      const productsData = supermarket.d;

      // --- Insert Supermarket ---
      let supermarketId: string | undefined;
      try {
        // Check if supermarket already exists
        const existingSupermarket = await db
          .select({ id: supermarkets.id })
          .from(supermarkets)
          .where(eq(supermarkets.name, supermarketName))
          .limit(1);

        if (existingSupermarket.length > 0) {
          supermarketId = existingSupermarket[0].id;
          consola.info(
            `Supermarket "${supermarketName}" already exists. Skipping insertion.`
          );
          totalSupermarketsSkipped++;
        } else {
          const newId = createId(); // Generate CUID
          const inserted = await db
            .insert(supermarkets)
            .values({
              id: newId,
              name: supermarketName,
              // createdAt will use default
            })
            .returning({ id: supermarkets.id }); // Return the inserted ID

          if (inserted.length > 0) {
            supermarketId = inserted[0].id;
            consola.info(
              `Inserted supermarket: ${supermarketName} (ID: ${supermarketId})`
            );
            totalSupermarketsInserted++;
          } else {
            consola.error(
              `Failed to insert supermarket: ${supermarketName}`
            );
            // Attempt to fetch again in case of race condition (unlikely here but safe)
            const possiblyInserted = await db
              .select({ id: supermarkets.id })
              .from(supermarkets)
              .where(eq(supermarkets.name, supermarketName))
              .limit(1);
            if (possiblyInserted.length > 0)
              supermarketId = possiblyInserted[0].id;
          }
        }
      } catch (error: any) {
        consola.error(
          `Error processing supermarket "${supermarketName}": ${error.message}`
        );
        // Decide if you want to continue with the next supermarket or stop
        continue;
      }

      if (!supermarketId) {
        consola.error(
          `Could not obtain ID for supermarket "${supermarketName}". Skipping its products.`
        );
        continue;
      }
      // --- End Insert Supermarket ---

      // --- Process Products Individually ---
      if (productsData.length === 0) {
        consola.info(
          `Supermarket "${supermarketName}" has no products.`
        );
        continue;
      }

      const validProductsData = productsData.filter(
        (product) =>
          product && product.n && product.l && product.p !== undefined
      );

      if (validProductsData.length === 0) {
        consola.info(
          `No valid products to process for supermarket "${supermarketName}".`
        );
        continue;
      }

      consola.info(
        `  Processing ${validProductsData.length} products individually for "${supermarketName}"... (This will take a long time)`
      );

      let productsInsertedInSupermarket = 0;
      let productsSkippedInSupermarket = 0;
      let cumulativeEmbeddingCost = 0; // Initialize cumulative cost for the supermarket

      // Process products one by one
      for (const [index, product] of validProductsData.entries()) {
        const productIdentifier = `"${product.n}" (Product ${index + 1} of ${validProductsData.length})`;
        consola.info(`\n--- Processing ${productIdentifier} ---`);

        try {
          // Step 1: Calculate Standardized Price
          consola.info(
            `  [1/3] Calculating standardized price for ${productIdentifier}...`
          );
          const { standardized_price_per_unit, standardized_unit } =
            await calculateStandardizedPrice(
              product.n,
              product.p,
              product.s
            ); // Errors handled within the function, returns nulls on failure
          consola.success(
            `  [1/3] Standardized price calculated for ${productIdentifier}.`
          );

          // Step 2: Generate Embedding
          let embedding: number[] = [];
          let cost = 0;
          consola.info(
            `  [2/3] Generating embedding for ${productIdentifier}...`
          );
          try {
            const { embeddings, usage } = await embedMany({
              model: openai.embedding('text-embedding-3-small'),
              values: [product.n], // Embed only the current product name
            });
            embedding = embeddings[0]; // Get the single embedding

            const tokensUsed = usage?.tokens;
            if (tokensUsed !== undefined && tokensUsed !== null) {
              const pricePerMillionTokens = 0.02;
              cost = (tokensUsed / 1000000) * pricePerMillionTokens;
              cumulativeEmbeddingCost += cost;
              consola.info(
                `    Embedding token usage: ${tokensUsed} tokens`
              );
              consola.info(
                `    Estimated embedding cost for product: $${cost.toFixed(8)}`
              );
              consola.info(
                `    Cumulative embedding cost for "${supermarketName}": $${cumulativeEmbeddingCost.toFixed(8)}`
              );
            } else {
              consola.info('    Embedding token usage: N/A');
            }
            consola.success(
              `  [2/3] Embedding generated for ${productIdentifier}.`
            );
          } catch (embeddingError: any) {
            consola.error(
              `  [2/3] Error generating embedding for ${productIdentifier}: ${embeddingError.message}`
            );
            consola.warn(
              `    Proceeding without embedding for ${productIdentifier}.`
            );
            // Keep embedding as empty array []
          }

          // Step 3: Prepare and Insert Product
          const productToInsert = {
            id: createId(), // Generate CUID here
            name: product.n,
            link: product.l,
            price: product.p,
            amount: product.s || null,
            supermarketId: supermarketId!, // Already checked supermarketId exists
            standardized_price_per_unit,
            standardized_unit,
            nameEmbedding: embedding, // Use the generated embedding (or [] if failed)
          } as typeof products.$inferInsert; // Type assertion

          consola.info(
            `  [3/3] Attempting to insert ${productIdentifier}...`
          );
          const insertedProduct = await db
            .insert(products)
            .values(productToInsert)
            .onConflictDoNothing({ target: products.link })
            .returning({ id: products.id });

          if (insertedProduct.length > 0) {
            productsInsertedInSupermarket++;
            totalProductsInserted++;
            consola.success(
              `  [3/3] Successfully inserted ${productIdentifier}.`
            );
          } else {
            productsSkippedInSupermarket++;
            totalProductsSkipped++;
            consola.warn(
              `  [3/3] Skipped insertion for ${productIdentifier} (likely duplicate link).`
            );
          }
        } catch (error: any) {
          // Catch errors during the overall processing of a single product (e.g., db connection issues)
          consola.error(
            `--- Critical error processing ${productIdentifier}: ${error.message} ---`
          );
          consola.error(error); // Log full error
          productsSkippedInSupermarket++;
          totalProductsSkipped++;
          // Continue to the next product
        }
      } // End individual product loop

      // --- Logging for the Supermarket (Adjusted) ---
      consola.info(
        `\n--- Finished processing products for "${supermarketName}" ---`
      );
      consola.info(
        `  Inserted: ${productsInsertedInSupermarket}, Skipped: ${productsSkippedInSupermarket}.`
      );
      consola.info(
        `  Total estimated embedding cost for "${supermarketName}": $${cumulativeEmbeddingCost.toFixed(8)}`
      );
      // --- End Adjusted Logging ---
    } // End supermarket loop

    // --- Overall Summary (Remains Largely the Same) ---
    // Add total embedding cost accumulation here if needed for overall summary
    // let grandTotalEmbeddingCost = 0; // Initialize outside the supermarket loop
    // (Need to lift cumulativeEmbeddingCost or recalculate based on logs/data)
    // For now, we'll just show per-supermarket totals.
    // A more robust way would be to accumulate grandTotalEmbeddingCost inside the loop:
    // grandTotalEmbeddingCost += cumulativeEmbeddingCost; // Add supermarket total to grand total

    consola.info('\n--- Ingestion Summary ---');
    consola.info(
      `Supermarkets Inserted: ${totalSupermarketsInserted}`
    );
    consola.info(
      `Supermarkets Skipped (already exist): ${totalSupermarketsSkipped}`
    );
    consola.info(`Products Inserted: ${totalProductsInserted}`);
    consola.info(
      `Products Skipped (duplicate link or processing error): ${totalProductsSkipped}`
    );
    // consola.info(`Grand Total Estimated Embedding Cost: $${grandTotalEmbeddingCost.toFixed(8)}`); // Log grand total
    consola.info('-------------------------');
    consola.info('Data ingestion finished.');
  } catch (error: any) {
    consola.error('Failed to ingest data:', error.message);
    if (error.code === 'ENOENT') {
      consola.error(`Error: Data file not found at ${dataFilePath}`);
    } else if (error instanceof SyntaxError) {
      consola.error(
        `Error: Failed to parse JSON data in ${dataFilePath}. Check the file format.`
      );
    } else {
      consola.error(error); // Log the full error for other cases
    }
    const endTime = performance.now(); // Record end time in case of error
    const duration = ((endTime - startTime) / 1000).toFixed(2); // Calculate duration in seconds
    consola.info(
      `Script finished with errors in ${duration} seconds.`
    );
    process.exit(1); // Exit with error code
  } finally {
    // This block executes regardless of whether an error occurred or not (except for process.exit)
    // However, process.exit() in the catch block will terminate before this runs.
    // So, we need to log success duration separately.
    // If the process didn't exit due to an error, log success duration.
    if (process.exitCode !== 1) {
      const endTime = performance.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2); // Calculate duration in seconds
      consola.info(
        `Script completed successfully in ${duration} seconds.`
      );
    }
  }
}

// Run the ingestion function
// /* Commenting out the full ingestion for testing // Re-enabling full ingestion
ingestData().catch((err) => {
  consola.error('Unhandled error during ingestion:', err);
  process.exit(1);
});
// */

// Run the single product test function instead
/* // Removing the test function call
testSingleProductAI().catch((err) => {
  consola.error('Unhandled error during single product test:', err);
  process.exit(1);
});
*/
