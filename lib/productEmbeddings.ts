import dotenv from 'dotenv';
dotenv.config();

import { db } from '../server/utils/db';
import { products } from '../server/db/schema';
import { sql } from 'drizzle-orm';
import { embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';
import { consola } from 'consola';

// Define the structure for the product data returned by the database query
interface ProductData {
  id: string;
  name: string;
  link: string;
  price: number;
  amount: string | null;
  supermarketId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define the structure for the final output, including the embedding
interface ProductWithEmbedding extends ProductData {
  nameEmbedding: number[];
}

/**
 * Fetches 10 random products from the database, generates embeddings for their names,
 * and returns the products along with their embeddings.
 *
 * @returns {Promise<ProductWithEmbedding[]>} A promise that resolves to an array of 10 random products with name embeddings.
 * @throws {Error} If fetching products or generating embeddings fails.
 */
export async function getRandomProductsWithEmbeddings(): Promise<
  ProductWithEmbedding[]
> {
  consola.log('getRandomProductsWithEmbeddings');
  try {
    consola.log('Attempting to fetch random products...');
    // 1. Fetch 10 random products from the database
    // Using ORDER BY RANDOM() is generally suitable for moderate datasets in SQLite.
    // For very large tables, consider alternative sampling methods if performance becomes an issue.
    const randomProducts = await db
      .select()
      .from(products)
      .orderBy(sql`RANDOM()`)
      .limit(9000);

    consola.log(
      `Fetched ${randomProducts?.length ?? 0} products from DB.`
    );

    if (!randomProducts || randomProducts.length === 0) {
      consola.warn(
        'No products found in the database. Exiting function.'
      );
      return [];
    }

    // 2. Extract product names for embedding
    const productNames = randomProducts.map((p) => p.name);

    consola.log('Attempting to generate embeddings...');
    // 3. Generate embeddings for the product names using Vercel AI SDK
    const { embeddings, usage } = await embedMany({
      model: openai.embedding('text-embedding-3-small'), // Use the specified model
      values: productNames,
    });

    // Calculate and log embedding cost
    const tokensUsed = usage?.tokens;
    if (tokensUsed !== undefined && tokensUsed !== null) {
      const pricePerMillionTokens = 0.02;
      const cost = (tokensUsed / 1000000) * pricePerMillionTokens;
      consola.log(`Embedding token usage: ${tokensUsed} tokens`);
      consola.log(`Estimated embedding cost: $${cost.toFixed(8)}`); // Log cost with high precision
    } else {
      consola.log('Embedding token usage: N/A');
    }

    // 4. Combine product data with their corresponding embeddings
    const productsWithEmbeddings: ProductWithEmbedding[] =
      randomProducts.map((product, index) => {
        // Handle potential null or number types for dates from the database
        const createdAtDate = product.createdAt
          ? new Date(product.createdAt)
          : new Date(); // Fallback to now if null/undefined
        const updatedAtDate = product.updatedAt
          ? new Date(product.updatedAt)
          : new Date(); // Fallback to now if null/undefined

        return {
          ...product,
          createdAt: createdAtDate,
          updatedAt: updatedAtDate,
          nameEmbedding: embeddings[index],
        };
      });

    return productsWithEmbeddings;
  } catch (error) {
    consola.error(
      'Failed inside getRandomProductsWithEmbeddings:',
      error
    );
    // Re-throw the error or handle it as appropriate for your application
    throw new Error('Failed to process products with embeddings.');
  }
}

getRandomProductsWithEmbeddings();
