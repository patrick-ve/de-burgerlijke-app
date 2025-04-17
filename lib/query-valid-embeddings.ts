/**
 * Utility script to query the database and retrieve products that have
 * non-null embedding data stored in the nameEmbedding column.
 */

import { db } from '../server/utils/db';
import { products } from '../server/db/schema';
import { isNotNull } from 'drizzle-orm';
import { consola } from 'consola';

interface ProductWithEmbedding {
  id: string;
  name: string;
  link: string;
  price: number;
  amount: string | null;
  supermarketId: string;
  createdAt: Date;
  updatedAt: Date;
  nameEmbedding: number[] | object; // Allowing object for ArrayBuffer case
}

/**
 * Fetches products from the database that have a non-null value
 * in the nameEmbedding column.
 *
 * @returns {Promise<ProductWithEmbedding[]>} A promise that resolves to an array of products with embeddings.
 * @throws {Error} If fetching products fails.
 */
export async function getProductsWithValidEmbeddings(): Promise<
  ProductWithEmbedding[]
> {
  consola.info(
    'Querying database for products with non-null embeddings...'
  );
  try {
    const productsWithEmbeddings = await db
      .select()
      .from(products)
      .where(isNotNull(products.nameEmbedding)); // Filter for non-null embeddings
    // Note: Depending on the DB/vector extension, a check for non-empty or specific dimension might be more robust
    // e.g., using a specific SQL function if available.

    consola.success(
      `Found ${productsWithEmbeddings.length} products with non-null embeddings.`
    );

    // Basic check on the first result if available
    if (productsWithEmbeddings.length > 0) {
      const firstEmbedding = productsWithEmbeddings[0].nameEmbedding;
      consola.log(
        'Data type of first embedding:',
        typeof firstEmbedding
      );
      if (Array.isArray(firstEmbedding)) {
        // Check length specifically
        if (firstEmbedding.length === 1536) {
          consola.success(
            'First embedding is an array with the expected length (1536).'
          );
          // Optional: check element types if needed
          // if (firstEmbedding.every(item => typeof item === 'number')) { ... }
        } else {
          consola.warn(
            `First embedding is an array, but has unexpected length: ${firstEmbedding.length} (expected 1536).`
          );
        }
      } else if (
        typeof firstEmbedding === 'object' &&
        firstEmbedding !== null
      ) {
        // Keep the ArrayBuffer-like check, but add a note
        if ('byteLength' in firstEmbedding) {
          consola.warn(
            'First embedding is an object with a byteLength property (like ArrayBuffer), not the expected number array format.'
          );
        } else {
          consola.warn(
            'First embedding is an object, but not an array and does not have byteLength.'
          );
        }
        // You might add more specific checks here if needed
      } else {
        consola.warn(
          'First embedding is neither an array nor a recognized object format.'
        );
      }
    }

    return productsWithEmbeddings as ProductWithEmbedding[]; // Cast might be needed depending on exact schema/return type
  } catch (error: any) {
    consola.error(
      'Failed to fetch products with embeddings:',
      error.message
    );
    throw new Error('Failed to query products with embeddings.');
  }
}

// Self-executing part for testing
(async () => {
  try {
    const validProducts = await getProductsWithValidEmbeddings();
    // Optionally log the first few products found
    if (validProducts.length > 0) {
      consola.log('\nSample of products found:');
      consola.log(validProducts.slice(0, 3)); // Log first 3
    }
  } catch (err) {
    consola.error('Error running query script:', err);
    process.exit(1);
  }
})();
