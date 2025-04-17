import fs from 'fs';
import path from 'path';
import { db } from '../server/utils/db'; // Adjust path if your script location is different
import { supermarkets, products } from '../server/db/schema';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2'; // Import cuid2

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
  console.log('Starting data ingestion...');

  try {
    // Read and parse the JSON file
    const jsonData = fs.readFileSync(dataFilePath, 'utf-8');
    const supermarketsData: SupermarketData[] = JSON.parse(jsonData);

    console.log(
      `Found ${supermarketsData.length} supermarkets in the JSON file.`
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
        console.warn(
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
          console.log(
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
            console.log(
              `Inserted supermarket: ${supermarketName} (ID: ${supermarketId})`
            );
            totalSupermarketsInserted++;
          } else {
            console.error(
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
        console.error(
          `Error processing supermarket "${supermarketName}": ${error.message}`
        );
        // Decide if you want to continue with the next supermarket or stop
        continue;
      }

      if (!supermarketId) {
        console.error(
          `Could not obtain ID for supermarket "${supermarketName}". Skipping its products.`
        );
        continue;
      }

      // --- Insert Products for the current supermarket ---
      if (productsData.length === 0) {
        console.log(
          `Supermarket "${supermarketName}" has no products.`
        );
        continue;
      }

      const productsToInsert = productsData
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
          // createdAt/updatedAt will use defaults
        }));

      if (productsToInsert.length === 0) {
        console.log(
          `No valid products to insert for supermarket "${supermarketName}".`
        );
        continue;
      }

      // --- Batch Insertion Logic ---
      const batchSize = 100; // Process 100 products per batch
      let productsInsertedInSupermarket = 0;
      let productsSkippedInSupermarket = 0;

      console.log(
        `Attempting to insert ${productsToInsert.length} products for "${supermarketName}" in batches of ${batchSize}...`
      );

      for (let i = 0; i < productsToInsert.length; i += batchSize) {
        const batch = productsToInsert.slice(i, i + batchSize);
        // console.log(`  Processing batch ${i / batchSize + 1} (${batch.length} products)`); // Optional detailed logging

        try {
          const insertedProducts = await db
            .insert(products)
            .values(batch)
            .onConflictDoNothing({ target: products.link })
            .returning({ id: products.id });

          const insertedCount = insertedProducts.length;
          const skippedCount = batch.length - insertedCount;

          productsInsertedInSupermarket += insertedCount;
          productsSkippedInSupermarket += skippedCount;
          totalProductsInserted += insertedCount; // Update overall total
          totalProductsSkipped += skippedCount; // Update overall total
        } catch (error: any) {
          console.error(
            `  Error inserting batch ${i / batchSize + 1} for supermarket "${supermarketName}": ${error.message}`
          );
          // Decide whether to skip this batch or stop entirely
        }
      }
      console.log(
        `Finished inserting products for "${supermarketName}". Inserted: ${productsInsertedInSupermarket}, Skipped (duplicate link): ${productsSkippedInSupermarket}.`
      );
      // --- End Batch Insertion Logic ---
    }

    console.log('\n--- Ingestion Summary ---');
    console.log(
      `Supermarkets Inserted: ${totalSupermarketsInserted}`
    );
    console.log(
      `Supermarkets Skipped (already exist): ${totalSupermarketsSkipped}`
    );
    console.log(`Products Inserted: ${totalProductsInserted}`);
    console.log(
      `Products Skipped (duplicate link): ${totalProductsSkipped}`
    );
    console.log('-------------------------');
    console.log('Data ingestion finished.');
  } catch (error: any) {
    console.error('Failed to ingest data:', error.message);
    if (error.code === 'ENOENT') {
      console.error(`Error: Data file not found at ${dataFilePath}`);
    } else if (error instanceof SyntaxError) {
      console.error(
        `Error: Failed to parse JSON data in ${dataFilePath}. Check the file format.`
      );
    } else {
      console.error(error); // Log the full error for other cases
    }
    process.exit(1); // Exit with error code
  }
}

// Run the ingestion function
ingestData().catch((err) => {
  console.error('Unhandled error during ingestion:', err);
  process.exit(1);
});
