import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import fs from 'fs';
import path from 'path';
import weaviate, {
  type WeaviateClient,
  configure,
  ApiKey,
  type WeaviateObject,
  type DataObject,
} from 'weaviate-client';
import { consola } from 'consola';
import {
  generateObject,
  RetryError,
  NoObjectGeneratedError,
} from 'ai';
import { openai } from '@ai-sdk/openai';
import { performance } from 'perf_hooks';
import { z } from 'zod';
import pLimit from 'p-limit';

// --- Constants ---
const PRODUCTS_COLLECTION_NAME = 'Products';
const dataFilePath = path.join(
  process.cwd(),
  'data',
  'supermarkets.json'
);

// --- Interfaces for JSON data ---
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

// --- Zod Schema for AI ---
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

// --- Interface for Weaviate Product Properties ---
interface ProductProperties {
  name: string;
  link: string;
  price: number;
  amount: string | null;
  standardizedPricePerUnit: number | null;
  standardizedUnit: 'kg' | 'liter' | 'piece' | null;
  createdAt: Date;
  updatedAt: Date;
  supermarketName: string; // Store supermarket name directly
}

// --- Helper Function for Standardized Price Calculation (Copied from ingest-dataset.ts) ---
async function calculateStandardizedPrice(
  name: string,
  price: number,
  amount: string | undefined
): Promise<{
  standardized_price_per_unit: number | null;
  standardized_unit: 'kg' | 'liter' | 'piece' | null;
}> {
  try {
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

    const { object: standardizedInfo } = await generateObject({
      model: openai('gpt-4.1-nano-2025-04-14'), // Using a slightly cheaper model
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
        ),
        standardized_unit: standardizedInfo.unit,
      };
    } else {
      return {
        standardized_price_per_unit: null,
        standardized_unit: null,
      };
    }
  } catch (error: unknown) {
    if (RetryError.isInstance(error)) {
      consola.warn(
        `AI calculation failed for product "${name}" after retries: ${error.reason}. Cause: ${error.cause}`
      );
    } else if (NoObjectGeneratedError.isInstance(error)) {
      consola.warn(
        `AI calculation failed for product "${name}", no object generated: ${error.response}. Cause: ${error.cause}`
      );
    } else {
      consola.warn(
        `AI calculation failed for product "${name}": ${error}. Returning nulls.`
      );
    }
    return {
      standardized_price_per_unit: null,
      standardized_unit: null,
    };
  }
}

// --- Weaviate Setup Function ---
async function setupWeaviate(): Promise<WeaviateClient | null> {
  try {
    const client = await weaviate.connectToWeaviateCloud(
      process.env.WEAVIATE_URL as string,
      {
        authCredentials: new ApiKey(
          process.env.WEAVIATE_API_KEY as string
        ),
        headers: {
          'X-OpenAI-Api-Key': process.env.OPENAI_API_KEY as string,
        },
      }
    );

    if (await client.isLive()) {
      consola.success('Weaviate client is up and running');

      // === Ensure Products Collection Exists ===
      const productsExists = await client.collections.exists(
        PRODUCTS_COLLECTION_NAME
      );
      if (!productsExists) {
        consola.info(
          `Creating collection: ${PRODUCTS_COLLECTION_NAME}`
        );
        await client.collections.create({
          name: PRODUCTS_COLLECTION_NAME,
          properties: [
            { name: 'name', dataType: configure.dataType.TEXT },
            {
              name: 'link',
              dataType: configure.dataType.TEXT,
              skipVectorization: true,
            },
            {
              name: 'price',
              dataType: configure.dataType.NUMBER,
              skipVectorization: true,
            },
            {
              name: 'amount',
              dataType: configure.dataType.TEXT,
              skipVectorization: true,
            },
            {
              name: 'standardizedPricePerUnit',
              dataType: configure.dataType.NUMBER,
              skipVectorization: true,
            },
            {
              name: 'standardizedUnit',
              dataType: configure.dataType.TEXT,
              skipVectorization: true,
            },
            {
              name: 'createdAt',
              dataType: configure.dataType.DATE,
              skipVectorization: true,
            },
            {
              name: 'updatedAt',
              dataType: configure.dataType.DATE,
              skipVectorization: true,
            },
            // Add supermarketName as a text property
            {
              name: 'supermarketName',
              dataType: configure.dataType.TEXT,
              skipVectorization: true,
            },
          ],
          // Use vectorizers field - correct field name
          vectorizers: configure.vectorizer.text2VecOpenAI(),
          // Define the generative module if needed for RAG later
          generative: configure.generative.openAI(),
        });
        consola.success(
          `Collection ${PRODUCTS_COLLECTION_NAME} created.`
        );
      } else {
        consola.info(
          `Collection ${PRODUCTS_COLLECTION_NAME} already exists.`
        );
      }

      return client;
    } else {
      consola.error('Weaviate client is not live.');
      return null;
    }
  } catch (error) {
    consola.error('Failed to connect or setup Weaviate:', error);
    return null;
  }
}

// --- Main Ingestion Function ---
async function ingestData() {
  const startTime = performance.now();
  consola.info('Starting Weaviate data ingestion...');
  consola.warn(
    'AI-based standardized price calculation is enabled. This may increase processing time and cost.'
  );

  const client = await setupWeaviate();
  if (!client) {
    consola.error('Could not establish Weaviate client. Aborting.');
    process.exit(1);
  }

  // --- Concurrency and Batch Settings ---
  const WEAVIATE_BATCH_SIZE = 100; // Weaviate recommended batch size
  const CONCURRENT_AI_LIMIT = 50; // Adjusted AI concurrency limit
  const aiLimiter = pLimit(CONCURRENT_AI_LIMIT);

  try {
    // Optional: Clear existing data (Use with caution!)
    consola.warn(
      `Deleting existing data from ${PRODUCTS_COLLECTION_NAME}...`
    );
    // await client.collections.delete(PRODUCTS_COLLECTION_NAME);
    // await client.collections.delete(SUPERMARKETS_COLLECTION_NAME);
    // consola.info('Existing collections deleted.');
    // await setupWeaviate(); // Re-run setup if collections were deleted

    // Read and parse the JSON file
    const jsonData = fs.readFileSync(dataFilePath, 'utf-8');
    const supermarketsData: SupermarketData[] = JSON.parse(jsonData);

    const totalProductsToProcess = supermarketsData.reduce(
      (acc, supermarket) =>
        acc +
        (supermarket?.d?.filter(
          (p) => p && p.n && p.l && p.p !== undefined
        ).length || 0),
      0
    );

    consola.info(
      `Found ${supermarketsData.length} supermarkets and ${totalProductsToProcess} valid products.`
    );

    let totalProductsAdded = 0;
    let totalProductsSkipped = 0;
    let totalProductsProcessed = 0;
    let totalFailures = 0;

    const productsCollection = client.collections.get(
      PRODUCTS_COLLECTION_NAME
    );

    // --- Process Supermarkets and Products ---
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

      // --- Process Products for this Supermarket ---
      const validProductsData = supermarket.d.filter(
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
        `Processing ${validProductsData.length} products for "${supermarketName}"...`
      );

      // Prepare product objects in batches
      let productBatch: DataObject<ProductProperties>[] = [];

      for (const product of validProductsData) {
        totalProductsProcessed++;
        const progressPercentage =
          totalProductsToProcess > 0
            ? (totalProductsProcessed / totalProductsToProcess) * 100
            : 0;

        // Calculate ETA
        let etaString = 'ETA: Calculating...';
        if (totalProductsProcessed > 10) {
          // Start calculating ETA after a few items
          const elapsedTime = performance.now() - startTime;
          const avgTimePerProduct =
            elapsedTime / totalProductsProcessed;
          const remainingProducts =
            totalProductsToProcess - totalProductsProcessed;
          const estimatedRemainingTimeMs =
            remainingProducts * avgTimePerProduct;
          const etaMinutes = Math.floor(
            estimatedRemainingTimeMs / 60000
          );
          const etaSeconds = Math.floor(
            (estimatedRemainingTimeMs % 60000) / 1000
          );
          etaString = `ETA: ${etaMinutes}m ${etaSeconds}s`;
        }

        // Updated log message with ETA and failure count
        consola.info(
          `Processing ${totalProductsProcessed}/${totalProductsToProcess} (${progressPercentage.toFixed(1)}%) | Failures: ${totalFailures} | ${etaString} | Product: ${product.n}`
        );

        // Calculate Standardized Price (Concurrently via Limiter)
        const standardizedResult = await aiLimiter(() =>
          calculateStandardizedPrice(product.n, product.p, product.s)
        );

        if (
          standardizedResult.standardized_price_per_unit === null ||
          standardizedResult.standardized_unit === null
        ) {
          totalFailures++;
        }

        // Prepare properties object, matching the ProductProperties interface
        const productProperties: ProductProperties = {
          name: product.n,
          link: product.l,
          price: product.p,
          amount: product.s || null,
          standardizedPricePerUnit:
            standardizedResult.standardized_price_per_unit,
          standardizedUnit: standardizedResult.standardized_unit,
          createdAt: new Date(),
          updatedAt: new Date(),
          // Add the supermarket name directly
          supermarketName: supermarketName,
        };

        // Push object with properties field
        productBatch.push({ properties: productProperties });

        // Insert batch when full or at the end of the supermarket's products
        if (
          productBatch.length >= WEAVIATE_BATCH_SIZE ||
          totalProductsProcessed === totalProductsToProcess ||
          validProductsData.indexOf(product) ===
            validProductsData.length - 1
        ) {
          // Include last product name in batch insert log
          const lastProductNameInBatch = product.n; // Get name of the last product processed
          consola.info(
            `Inserting batch of ${productBatch.length} products for "${supermarketName}" (last: ${lastProductNameInBatch})...`
          );
          try {
            // Pass the array of property objects to insertMany
            const batchResult =
              await productsCollection.data.insertMany(productBatch);
            const insertedCount = Object.keys(
              batchResult.uuids || {}
            ).length;
            totalProductsAdded += insertedCount;

            // Handle errors reported in the batch result
            if (
              batchResult.errors &&
              Object.keys(batchResult.errors).length > 0
            ) {
              const errorCount = Object.keys(
                batchResult.errors
              ).length;
              totalProductsSkipped += errorCount;
              consola.warn(
                `  ${errorCount} errors during batch insert for "${supermarketName}".`
              );
            } else {
              consola.success(
                `  Batch inserted successfully (${insertedCount} products).`
              );
            }
          } catch (batchError) {
            consola.error(
              `Critical error during batch insert for "${supermarketName}":`,
              batchError
            );
            // Assume all items in the current batch failed if the request itself failed
            totalProductsSkipped += productBatch.length;
          } finally {
            // Clear the batch for the next iteration
            productBatch = [];
          }
        }
      }
    }

    // --- Final Summary ---
    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    consola.success('--- Weaviate Ingestion Summary ---');
    consola.info(`Duration: ${duration} seconds`);
    consola.info(`Products Added: ${totalProductsAdded}`);
    consola.info(
      `Products Skipped (errors): ${totalProductsSkipped}`
    );
    consola.info(`Products Failed Standardization: ${totalFailures}`);
    consola.info(
      `Total Products Processed: ${totalProductsProcessed}`
    );
    consola.info('------------------------------------');
  } catch (error: any) {
    consola.error(
      'Failed to ingest data into Weaviate:',
      error.message
    );
    if (error.code === 'ENOENT') {
      consola.error(`Error: Data file not found at ${dataFilePath}`);
    } else if (error instanceof SyntaxError) {
      consola.error(
        `Error: Failed to parse JSON data in ${dataFilePath}. Check format.`
      );
    } else {
      consola.error(error);
    }
    process.exitCode = 1;
  } finally {
    if (client) {
      consola.info('Closing Weaviate client.');
      await client.close();
    }
    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    if (process.exitCode === 1) {
      consola.error(
        `Script finished with errors in ${duration} seconds.`
      );
    } else {
      consola.success(
        `Script completed successfully in ${duration} seconds.`
      );
    }
  }
}

// Run the ingestion function
ingestData();
