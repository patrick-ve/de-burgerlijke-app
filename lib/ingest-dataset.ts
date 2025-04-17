import fs from 'fs';
import path from 'path';
import { db } from '../server/utils/db'; // Adjust path if your script location is different
import { supermarkets, products } from '../server/db/schema';
import { eq } from 'drizzle-orm';
import { consola } from 'consola';
import { createId } from '@paralleldrive/cuid2'; // Import cuid2
import { embedMany } from 'ai'; // Import embedMany
import { openai } from '@ai-sdk/openai'; // Import openai
import { performance } from 'perf_hooks'; // Import performance

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

const dataFilePath = path.join(
  process.cwd(),
  'data',
  'supermarkets.json'
);

async function ingestData() {
  const startTime = performance.now(); // Record start time
  consola.info('Starting data ingestion...');

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

      // --- Insert Products for the current supermarket ---
      if (productsData.length === 0) {
        consola.info(
          `Supermarket "${supermarketName}" has no products.`
        );
        continue;
      }

      let productsToInsert = productsData
        .filter(
          (product) =>
            product &&
            product.n &&
            product.l &&
            product.p !== undefined
        ) // Basic validation
        .map((product) => ({
          id: createId(), // Generate CUID for each product
          name: product.n,
          link: product.l,
          price: product.p, // Drizzle handles number to REAL conversion
          amount: product.s || null, // Use null if 's' is missing or empty
          supermarketId: supermarketId!, // Non-null assertion as we check above
          nameEmbedding: [], // Initialize with empty array, will be filled in batch
          // createdAt/updatedAt will use defaults
        }));

      if (productsToInsert.length === 0) {
        consola.info(
          `No valid products to insert for supermarket "${supermarketName}".`
        );
        continue;
      }

      // --- Batch Insertion & Embedding Logic ---
      const batchSize = 100; // Process 100 products per batch
      let productsInsertedInSupermarket = 0;
      let productsSkippedInSupermarket = 0;
      let cumulativeEmbeddingCost = 0; // Initialize cumulative cost for the supermarket

      const totalBatches = Math.ceil(
        productsToInsert.length / batchSize
      );

      consola.info(
        `Attempting to insert/embed ${productsToInsert.length} products for "${supermarketName}" in ${totalBatches} batches of ${batchSize}...`
      );

      for (let i = 0; i < productsToInsert.length; i += batchSize) {
        const batchRawData = productsToInsert.slice(i, i + batchSize);
        const currentBatchNumber = i / batchSize + 1;
        consola.info(
          `  Processing batch ${currentBatchNumber} of ${totalBatches} (${batchRawData.length} products)`
        );

        // --- Generate Embeddings for the current batch ---
        let batchWithEmbeddings;
        try {
          consola.info(`    Generating embeddings for batch...`);
          const productNamesInBatch = batchRawData.map((p) => p.name);

          const { embeddings, usage } = await embedMany({
            model: openai.embedding('text-embedding-3-small'),
            values: productNamesInBatch,
          });

          // Combine raw data with embeddings
          batchWithEmbeddings = batchRawData.map(
            (product, index) => ({
              ...product,
              nameEmbedding: embeddings[index],
            })
          );

          // Calculate and log embedding cost for the batch
          const tokensUsed = usage?.tokens;
          if (tokensUsed !== undefined && tokensUsed !== null) {
            const pricePerMillionTokens = 0.02;
            const cost =
              (tokensUsed / 1000000) * pricePerMillionTokens;
            consola.info(
              `      Embedding token usage: ${tokensUsed} tokens`
            );
            consola.info(
              `      Estimated embedding cost for batch: $${cost.toFixed(8)}`
            );
            cumulativeEmbeddingCost += cost; // Add batch cost to cumulative total
            consola.info(
              `      Cumulative embedding cost for "${supermarketName}": $${cumulativeEmbeddingCost.toFixed(8)}`
            );
          } else {
            consola.info('      Embedding token usage: N/A');
          }
          consola.info(
            `    Embeddings generated successfully for batch.`
          );
        } catch (embeddingError: any) {
          consola.error(
            `    Error generating embeddings for batch ${i / batchSize + 1}: ${embeddingError.message}`
          );
          consola.warn(
            `    Skipping insertion for this batch due to embedding error.`
          );
          continue; // Skip to the next batch if embeddings fail
        }
        // --- End Generate Embeddings ---

        // --- Insert the batch with embeddings ---
        if (!batchWithEmbeddings) {
          // Should not happen if embedding succeeded, but safety check
          consola.error(
            `    Skipping insertion for batch ${i / batchSize + 1} due to missing embedding data.`
          );
          continue;
        }

        try {
          const insertedProducts = await db
            .insert(products)
            .values(batchWithEmbeddings) // Use the batch with embeddings
            .onConflictDoNothing({ target: products.link })
            .returning({ id: products.id });

          const insertedCount = insertedProducts.length;
          const skippedCount = batchRawData.length - insertedCount;

          productsInsertedInSupermarket += insertedCount;
          productsSkippedInSupermarket += skippedCount;
          totalProductsInserted += insertedCount; // Update overall total
          totalProductsSkipped += skippedCount; // Update overall total
        } catch (error: any) {
          consola.error(
            `  Error inserting batch ${i / batchSize + 1} for supermarket "${supermarketName}": ${error.message}`
          );
          // Decide whether to skip this batch or stop entirely
        }
      }
      consola.info(
        `Finished inserting products for "${supermarketName}". Inserted: ${productsInsertedInSupermarket}, Skipped (duplicate link): ${productsSkippedInSupermarket}.`
      );
      consola.info(
        `Total estimated embedding cost for "${supermarketName}": $${cumulativeEmbeddingCost.toFixed(8)}`
      );
      // --- End Batch Insertion Logic ---
    }

    // Add total embedding cost accumulation here if needed for overall summary
    let grandTotalEmbeddingCost = 0; // Initialize outside the supermarket loop
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
      `Products Skipped (duplicate link): ${totalProductsSkipped}`
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
ingestData().catch((err) => {
  consola.error('Unhandled error during ingestion:', err);
  process.exit(1);
});
