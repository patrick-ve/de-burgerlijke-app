/**
 * Utility script to query the database and retrieve products that have
 * non-null embedding data stored in the nameEmbedding column.
 */

import { db } from '../server/utils/db';
import { products } from '../server/db/schema';
import { isNotNull, sql } from 'drizzle-orm';
import { consola } from 'consola';
import OpenAI from 'openai';

// Ensure OPENAI_API_KEY is set in your environment variables
const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'],
});

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

// Define a type for the product returned by the similarity search
interface ProductWithDistance extends ProductWithEmbedding {
  distance: number;
}

/**
 * Generates an embedding vector for a given text using OpenAI API.
 *
 * @param {string} text - The text to embed.
 * @returns {Promise<number[]>} A promise that resolves to the embedding vector.
 * @throws {Error} If embedding generation fails.
 */
async function getEmbedding(text: string): Promise<number[]> {
  consola.info(`Generating embedding for: "${text}"`);
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small', // Or your preferred embedding model
      input: text.replace(/\n/g, ' '), // API recommendation: replace newlines
    });

    if (
      !response.data ||
      !response.data[0] ||
      !response.data[0].embedding
    ) {
      throw new Error('Invalid response structure from OpenAI API');
    }

    const embedding = response.data[0].embedding;
    consola.success(
      `Generated embedding with dimension: ${embedding.length}`
    );
    return embedding;
  } catch (error: any) {
    consola.error('Failed to generate embedding:', error.message);
    if (error.response) {
      consola.error('OpenAI API Error Details:', error.response.data);
    }
    throw new Error(`Failed to generate embedding for "${text}".`);
  }
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

/**
 * Finds products similar to a given keyword using vector similarity search.
 * It first fetches a larger set of candidates based on similarity (`candidateLimit`)
 * and then sorts these candidates by price, returning the top `finalLimit` cheapest products.
 * Assumes the `nameEmbedding` column is of a vector type and the database
 * supports vector operations (e.g., using pgvector extension).
 *
 * @param {string} keyword - The keyword to search for similar products.
 * @param {number} [candidateLimit=20] - The number of similar candidates to fetch initially.
 * @param {number} [finalLimit=5] - The final number of cheapest products to return.
 * @returns {Promise<ProductWithDistance[]>} A promise that resolves to an array of the cheapest similar products with their distance.
 * @throws {Error} If fetching the embedding or querying the database fails.
 */
export async function findSimilarProducts(
  keyword: string,
  candidateLimit: number = 20, // Renamed from limit, potentially increased default
  finalLimit: number = 5 // New parameter for final result size
): Promise<ProductWithDistance[]> {
  consola.info(
    `Finding top ${finalLimit} cheapest products similar to "${keyword}" (searching ${candidateLimit} candidates)...`
  );
  try {
    // 1. Get the embedding for the keyword
    const keywordEmbedding = await getEmbedding(keyword);
    const embeddingString = JSON.stringify(keywordEmbedding);

    consola.info(
      `Querying database for top ${candidateLimit} similar product candidates...`
    );
    // 2. Perform similarity search for the top `candidateLimit` candidates
    const similarCandidates = await db
      .select({
        id: products.id,
        name: products.name,
        link: products.link,
        price: products.price,
        amount: products.amount,
        supermarketId: products.supermarketId,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        nameEmbedding: products.nameEmbedding, // Keep embedding if needed later
        distance:
          sql<number>`vector_distance_cos(name_embedding, ${embeddingString})`.as(
            'distance'
          ), // Calculate and alias distance (removed ::vector cast)
      })
      .from(products)
      .where(isNotNull(products.nameEmbedding)) // Ensure embedding exists
      .orderBy(sql`distance`) // Order by the calculated distance ASC (lower is better for similarity)
      .limit(candidateLimit); // Fetch more candidates initially

    consola.success(
      `Found ${similarCandidates.length} candidates similar to "${keyword}". Sorting by price...`
    );

    // 3. Sort the candidates by price (ascending)
    similarCandidates.sort((a, b) => a.price - b.price);

    // 4. Take the top `finalLimit` cheapest products from the candidates
    const cheapestSimilarProducts = similarCandidates.slice(
      0,
      finalLimit
    );

    consola.success(
      `Returning top ${cheapestSimilarProducts.length} cheapest products.`
    );

    // Explicit selection makes the cast safer, but still needed due to raw SQL
    return cheapestSimilarProducts as unknown as ProductWithDistance[];
  } catch (error: any) {
    consola.error(
      `Failed to find similar products for "${keyword}":`,
      error.message
    );
    throw new Error(
      `Failed to find similar products for "${keyword}".`
    );
  }
}

// Self-executing part for testing
(async () => {
  const keyword = 'Volle melk';
  const initialCandidates = 50; // Fetch more candidates
  const finalResults = 10; // Show the top 10 cheapest

  try {
    console.time('Similarity Search'); // Start timer
    const similarItems = await findSimilarProducts(
      keyword,
      initialCandidates,
      finalResults
    );
    console.timeEnd('Similarity Search'); // End timer and log duration

    if (similarItems.length > 0) {
      consola.log(
        `
Top ${
          similarItems.length
        } cheapest products similar to "${keyword}" (from ${initialCandidates} candidates):`
      );
      // Log name, price, and corrected similarity percentage
      similarItems.forEach((product, index) => {
        // Corrected Similarity % = (1 - distance / 2) * 100
        // distance: 0 (identical) => 100%
        // distance: 1 (orthogonal) => 50%
        // distance: 2 (opposite) => 0%
        const similarityPercent = (1 - product.distance / 2) * 100;
        consola.log(
          `${index + 1}. ${product.name} (€${
            product.price
          }) - Similarity: ${similarityPercent.toFixed(1)}% (dist: ${product.distance.toFixed(3)})`
        );
      });
    } else {
      consola.log(`No similar products found for "${keyword}".`);
    }
  } catch (err) {
    consola.error('Error running similarity search script:', err);
    process.exit(1);
  }
})();
