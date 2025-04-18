import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import { db } from '../server/utils/db'; // Adjust path if your script location is different
import { supermarkets, products } from '../server/db/schema';
import { eq } from 'drizzle-orm';
import { consola } from 'consola';
import { createId } from '@paralleldrive/cuid2'; // Import cuid2
import {
  embedMany,
  generateObject,
  generateText,
  RetryError,
  NoObjectGeneratedError,
} from 'ai'; // Import embedMany and generateObject
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
    const prompt = `You must analyze product information and determine the standard unit (kg, liter, or piece) and the quantity in that unit. Follow these steps:

      Determine the standard unit (kg, liter, or piece) and the quantity in that unit. Follow these steps:
      1.  **Prioritize the amount:** If it clearly specifies a weight (e.g., "500g", "1 kg", "2x250g"), volume (e.g., "750ml", "1.5L", "6x330ml"), or number of pieces (e.g., "6 stuks", "12 rollen"), use that information directly. Calculate the total quantity in kg, liter, or pieces respectively.
      2.  **If amount is generic or missing:** If the amount is generic (e.g., "per stuk", "zak", "pak", "ca. 500g") or missing, **analyze the 'Name'** to determine the unit and quantity.
          - Look for weight indicators (g, kg) -> use 'kg'.
          - Look for volume indicators (ml, l) -> use 'liter'.
          - Look for explicit piece counts or terms suggesting countability (e.g., "Avocado", "Eieren", "Rollen") -> use 'piece'. Assume 1 piece if no specific count is found in the name.
      3.  **Ambiguity:** If neither the amount nor the name allows for reliable determination of both unit and quantity, return null for both 'unit' and 'quantity'.

      Provide the result as a JSON object matching the provided schema.
    `;

    const startTime = Date.now(); // Timestamp start
    /* // Removing individual product call logging
    consola.info(
      `[${startTime}] Calling generateObject for: "${name}" - ${price} - ${amount}`
    );
    */
    const { object: standardizedInfo } = await generateObject({
      model: openai('gpt-4.1-nano-2025-04-14'),
      schema: StandardizedUnitSchema,
      mode: 'json',
      messages: [
        {
          role: 'system',
          content: prompt,
        },
        {
          role: 'user',
          content: `
            Name and/or amount: ${name} ${amount}
            Price: €${price}
          `,
        },
      ],
      maxRetries: 10,
    });
    const endTime = Date.now(); // Timestamp end
    /* // Removing verbose logging for individual product AI calls
    consola.info(
      `[${endTime}] Standardized Info for "${name}":`,
      standardizedInfo
    );
    consola.success(
      `[${endTime}] Received response for "${name}" (took ${endTime - startTime}ms)`
    );
    */

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
  } catch (error: unknown) {
    if (RetryError.isInstance(error)) {
      consola.warn(
        `AI calculation failed for product "${name}": ${error.reason}. ${error.cause}`
      );
    } else if (NoObjectGeneratedError.isInstance(error)) {
      consola.warn(
        `AI calculation failed for product "${name}": ${error.response}. ${error.cause}`
      );
    } else {
      consola.warn(
        `AI calculation failed for product "${name}": ${error}. Returning nulls.`
      );
    }

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
  const BATCH_SIZE = 500; // Number of products to process in parallel for AI calls and DB inserts
  // Target ~90% of 20,000 RPM = 18,000 RPM = 300 RPS - Reducing to 200 RPS
  const CONCURRENT_AI_LIMIT = 200; // Max concurrent generateObject calls
  // const DELAY_BETWEEN_BATCHES_MS = 500; // Delay is removed as we target higher throughput
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

    // Calculate total products upfront for accurate progress reporting
    const totalProductsToProcess = supermarketsData.reduce(
      (acc, supermarket) =>
        acc +
        (supermarket?.d?.filter(
          (p) => p && p.n && p.l && p.p !== undefined
        ).length || 0),
      0
    );

    consola.info(
      `Found ${supermarketsData.length} supermarkets and ${totalProductsToProcess} valid products to process in the JSON file.`
    );

    let totalProductsInserted = 0;
    let totalSupermarketsInserted = 0;
    let totalSupermarketsSkipped = 0;
    let totalProductsSkipped = 0;
    let totalProductsProcessed = 0; // Counter for overall progress
    let grandTotalEmbeddingCost = 0; // Initialize grand total cost tracker
    let totalFailures = 0; // Track total failed standardizations

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
        const batchStartTime = performance.now(); // Start timer for batch

        consola.info(
          `\n--- Starting Batch ${batchNumber}/${totalBatches} for "${supermarketName}" (Size: ${batch.length}) ---`
        );

        // Step 1: Calculate Standardized Prices Concurrently (with limit)
        // Removing verbose per-call logging
        consola.info(`  [1/3] Calculating standardized prices...`);
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
        // Calculate failures in this batch
        const batchFailures = standardizedResults.filter(
          (result) =>
            result.standardized_price_per_unit === null ||
            result.standardized_unit === null
        ).length;
        totalFailures += batchFailures; // Update total failures

        consola.success(`  [1/3] Standardized prices calculated.`);

        // Step 2: Generate Embeddings for the Batch
        consola.info(`  [2/3] Generating embeddings...`);
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
            grandTotalEmbeddingCost += batchCost; // Add to grand total
            /* // Removing verbose cost logging per batch - will log per supermarket
            consola.info(
              `    Batch embedding token usage: ${tokensUsed} tokens`
            );
            consola.info(
              `    Estimated embedding cost for batch: $${batchCost.toFixed(8)}`
            );
            consola.info(
              `    Cumulative embedding cost for "${supermarketName}": $${cumulativeEmbeddingCost.toFixed(8)}`
            );
            */
          } else {
            consola.info('    Batch embedding token usage: N/A');
          }
          consola.success(`  [2/3] Embeddings generated.`);
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

        // Step 3: Prepare and Insert Products Batch (Simplified: Direct Insert)
        consola.info(
          `  [3/3] Preparing and inserting all products directly...`
        );

        let productsToInsert: (typeof products.$inferInsert)[] = [];
        let batchSkippedCount = 0; // Will remain 0 unless the entire insert fails
        let actualInsertedCount = 0;

        try {
          // Prepare data for ALL products in the batch
          productsToInsert = batch.map((product, index) => {
            const stdResult = standardizedResults[index] || {
              standardized_price_per_unit: null,
              standardized_unit: null,
            };
            const embedding = batchEmbeddings[index] || [];
            return {
              id: createId(), // Still generate unique ID for each row
              name: product.n,
              link: product.l,
              price: product.p,
              amount: product.s || null,
              supermarketId: supermarketId!,
              standardized_price_per_unit:
                stdResult.standardized_price_per_unit,
              standardized_unit: stdResult.standardized_unit,
              nameEmbedding: embedding,
            };
          });

          // Attempt to insert all prepared products directly
          if (productsToInsert.length > 0) {
            const insertedResult = await db
              .insert(products)
              .values(productsToInsert)
              // No ON CONFLICT clause
              .returning({ id: products.id }); // Still return IDs to confirm count

            actualInsertedCount = insertedResult.length;

            // Basic check: Did the DB report inserting as many rows as we sent?
            if (actualInsertedCount < productsToInsert.length) {
              consola.warn(
                `  Batch ${batchNumber}: DB reported inserting ${actualInsertedCount} rows, but ${productsToInsert.length} were sent. Potential constraint violation or other issue.`
              );
              // We don't know exactly which ones failed, so we update skipped based on the difference
              batchSkippedCount =
                productsToInsert.length - actualInsertedCount;
            } else {
              // All rows inserted successfully according to the DB
              batchSkippedCount = 0;
            }
          } else {
            // This case should theoretically not happen if batch has items, but safe to keep
            consola.info(
              `  Batch ${batchNumber}: No products prepared for insertion.`
            );
            actualInsertedCount = 0;
            batchSkippedCount = 0;
          }

          // Update counts
          productsInsertedInSupermarket += actualInsertedCount;
          productsSkippedInSupermarket += batchSkippedCount;
          totalProductsInserted += actualInsertedCount;
          totalProductsSkipped += batchSkippedCount;

          // --- Update Progress Logic (mostly unchanged) ---
          totalProductsProcessed += batch.length; // Progress based on total batch items processed
          const percentage =
            totalProductsToProcess > 0
              ? (totalProductsProcessed / totalProductsToProcess) *
                100
              : 0;
          const failurePercentage =
            totalProductsProcessed > 0
              ? (totalFailures / totalProductsProcessed) * 100
              : 0; // Calculate failure percentage
          const batchEndTime = performance.now();
          const batchDuration = (
            (batchEndTime - batchStartTime) /
            1000
          ).toFixed(2);
          const elapsedTime = (
            (batchEndTime - startTime) /
            1000
          ).toFixed(2);
          const elapsedTimeSec = parseFloat(elapsedTime);

          let etaString = 'ETA: ---';
          if (
            totalProductsProcessed > 0 &&
            totalProductsProcessed < totalProductsToProcess
          ) {
            const avgTimePerProduct =
              elapsedTimeSec / totalProductsProcessed;
            const remainingProducts =
              totalProductsToProcess - totalProductsProcessed;
            const etaSeconds = Math.round(
              avgTimePerProduct * remainingProducts
            );
            const etaMinutes = Math.floor(etaSeconds / 60);
            const etaRemainingSeconds = etaSeconds % 60;
            etaString = `ETA: ${etaMinutes}m ${etaRemainingSeconds}s`;
          }

          consola.start(
            `Processed: ${totalProductsProcessed}/${totalProductsToProcess} (${percentage.toFixed(1)}%) | Failed Labeling: ${failurePercentage.toFixed(1)}% | Elapsed: ${elapsedTime}s | ${etaString} | Batch ${batchNumber}/${totalBatches} (${supermarketName}) done in ${batchDuration}s | Inserted: ${actualInsertedCount}, Skipped: ${batchSkippedCount}`
          );
        } catch (dbError: any) {
          consola.error(
            `--- Critical error during Step 3 (Direct Insert) for batch ${batchNumber}: ${dbError.message} ---`
          );
          consola.error(dbError);
          // If the entire insert operation fails, assume all products in the batch were skipped
          actualInsertedCount = 0; // None were inserted in this scenario
          batchSkippedCount = batch.length; // All products in the batch are considered skipped

          productsSkippedInSupermarket += batchSkippedCount; // Add only newly skipped
          totalProductsSkipped += batchSkippedCount; // Add only newly skipped

          // Update progress indicator to show failure for this batch
          totalProductsProcessed += batch.length;
          const percentage =
            totalProductsToProcess > 0
              ? (totalProductsProcessed / totalProductsToProcess) *
                100
              : 0;
          consola.error(
            `Batch ${batchNumber} failed insertion. Processed: ${totalProductsProcessed}/${totalProductsToProcess} (${percentage.toFixed(1)}%). Skipped ${batchSkippedCount} in this batch.`
          );
        }

        // Optional delay between batches to manage rate limits further
        /* // Removing delay as we aim for higher throughput
        if (i + BATCH_SIZE < validProductsData.length) {
          consola.info(
            `--- Waiting ${DELAY_BETWEEN_BATCHES_MS}ms before next batch ---`
          );
          await wait(DELAY_BETWEEN_BATCHES_MS);
        }
        */
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

    // --- Overall Summary ---
    // Clear the status line before showing the final summary
    consola.success(
      `All ${totalProductsToProcess} products processed.`
    );

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
    consola.info(
      `Products Failed Standardization: ${totalFailures}` // Add total failures to summary
    );
    consola.info(
      `Total Products Processed: ${totalProductsProcessed}`
    ); // Add total processed count
    consola.info(
      `Grand Total Estimated Embedding Cost: $${grandTotalEmbeddingCost.toFixed(8)}`
    ); // Log grand total cost
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
