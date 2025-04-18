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
import pLimit from 'p-limit'; // Import p-limit for concurrency control

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

// --- Helper Function for delays ---
const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

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

// --- Test Function for Single Product AI Call

// --- Main Ingestion Function ---
async function ingestData() {
  const startTime = performance.now(); // Record start time
  consola.info('Starting data ingestion...');
  consola.warn(
    'AI-based standardized price calculation is enabled. This may increase processing time and cost.'
  );

  // --- Concurrency and Batch Settings ---
  const BATCH_SIZE = 50; // Number of products to process in parallel for AI calls and DB inserts
  const CONCURRENT_AI_LIMIT = 10; // Max concurrent generateObject calls (adjust based on rate limits)
  const DELAY_BETWEEN_BATCHES_MS = 500; // Delay between processing batches
  const aiLimiter = pLimit(CONCURRENT_AI_LIMIT);
  // --- End Settings ---

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

      // --- Process Products in Batches ---
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
        `  Processing ${validProductsData.length} products in batches of ${BATCH_SIZE} for "${supermarketName}"...`
      );

      let productsInsertedInSupermarket = 0;
      let productsSkippedInSupermarket = 0;
      let cumulativeEmbeddingCost = 0;

      for (let i = 0; i < validProductsData.length; i += BATCH_SIZE) {
        const batch = validProductsData.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(
          validProductsData.length / BATCH_SIZE
        );

        consola.info(
          `\n--- Processing Batch ${batchNumber}/${totalBatches} for "${supermarketName}" (Size: ${batch.length}) ---`
        );

        // Step 1: Calculate Standardized Prices Concurrently (with limit)
        consola.info(
          `  [1/3] Calculating standardized prices for batch ${batchNumber}...`
        );
        const standardizedPricePromises = batch.map((product) =>
          aiLimiter(() =>
            // Use p-limit to control concurrency
            calculateStandardizedPrice(
              product.n,
              product.p,
              product.s
            ).catch((err) => {
              // Catch individual errors
              consola.warn(
                `Error calculating standardized price for "${product.n}": ${err.message}. Using nulls.`
              );
              return {
                standardized_price_per_unit: null,
                standardized_unit: null,
              };
            })
          )
        );
        const standardizedResults = await Promise.all(
          standardizedPricePromises
        );
        consola.success(
          `  [1/3] Standardized prices calculated for batch ${batchNumber}.`
        );

        // Step 2: Generate Embeddings for the Batch
        consola.info(
          `  [2/3] Generating embeddings for batch ${batchNumber}...`
        );
        const productNames = batch.map((p) => p.n);
        let batchEmbeddings: number[][] = [];
        let batchCost = 0;
        try {
          const { embeddings, usage } = await embedMany({
            model: openai.embedding('text-embedding-3-small'),
            values: productNames,
          });
          batchEmbeddings = embeddings;

          const tokensUsed = usage?.tokens;
          if (tokensUsed !== undefined && tokensUsed !== null) {
            const pricePerMillionTokens = 0.02;
            batchCost =
              (tokensUsed / 1000000) * pricePerMillionTokens;
            cumulativeEmbeddingCost += batchCost;
            consola.info(
              `    Batch embedding token usage: ${tokensUsed} tokens`
            );
            consola.info(
              `    Estimated embedding cost for batch: $${batchCost.toFixed(8)}`
            );
            consola.info(
              `    Cumulative embedding cost for "${supermarketName}": $${cumulativeEmbeddingCost.toFixed(8)}`
            );
          } else {
            consola.info('    Batch embedding token usage: N/A');
          }
          consola.success(
            `  [2/3] Embeddings generated for batch ${batchNumber}.`
          );
        } catch (embeddingError: any) {
          consola.error(
            `  [2/3] Error generating embeddings for batch ${batchNumber}: ${embeddingError.message}`
          );
          consola.warn(
            `    Proceeding without embeddings for batch ${batchNumber}.`
          );
          // Create an array of empty arrays if embedding fails
          batchEmbeddings = batch.map(() => []);
        }

        // Step 3: Prepare and Insert Products Batch
        consola.info(
          `  [3/3] Preparing and inserting batch ${batchNumber}...`
        );
        const productsToInsert = batch.map((product, index) => {
          const stdResult = standardizedResults[index] || {
            standardized_price_per_unit: null,
            standardized_unit: null,
          };
          const embedding = batchEmbeddings[index] || [];
          return {
            id: createId(),
            name: product.n,
            link: product.l,
            price: product.p,
            amount: product.s || null,
            supermarketId: supermarketId!,
            standardized_price_per_unit:
              stdResult.standardized_price_per_unit,
            standardized_unit: stdResult.standardized_unit,
            nameEmbedding: embedding,
          } as typeof products.$inferInsert;
        });

        try {
          const insertedResult = await db
            .insert(products)
            .values(productsToInsert)
            .onConflictDoNothing({ target: products.link }) // Assumes link is unique constraint
            .returning({ id: products.id }); // Only return id to potentially count success

          const insertedCount = insertedResult.length;
          const skippedCount = batch.length - insertedCount;

          productsInsertedInSupermarket += insertedCount;
          productsSkippedInSupermarket += skippedCount;
          totalProductsInserted += insertedCount;
          totalProductsSkipped += skippedCount;

          consola.success(
            `  [3/3] Batch ${batchNumber} inserted: ${insertedCount} success, ${skippedCount} skipped (duplicate link).`
          );
        } catch (dbError: any) {
          consola.error(
            `--- Critical error inserting batch ${batchNumber}: ${dbError.message} ---`
          );
          consola.error(dbError);
          // Mark all products in this batch as skipped if the entire batch insert fails
          const skippedCount = batch.length;
          productsSkippedInSupermarket += skippedCount;
          totalProductsSkipped += skippedCount;
        }

        // Optional delay between batches to manage rate limits further
        if (i + BATCH_SIZE < validProductsData.length) {
          consola.info(
            `--- Waiting ${DELAY_BETWEEN_BATCHES_MS}ms before next batch ---`
          );
          await wait(DELAY_BETWEEN_BATCHES_MS);
        }
      } // End batch loop for supermarket

      // --- Logging for the Supermarket ---
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

// --- Add p-limit import correction if needed ---
// If 'p-limit' causes issues with default import, try:
// import * as pLimitModule from 'p-limit';
// const pLimit = pLimitModule.default;
// Or check your tsconfig.json for "esModuleInterop": true
