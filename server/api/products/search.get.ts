import { db } from '~/server/utils/db';
import { products, supermarkets } from '~/server/db/schema';
import { sql, like, eq, asc } from 'drizzle-orm';

// Define the expected structure for a single result row before grouping
interface ProductQueryResult {
  id: string;
  name: string;
  link: string;
  price: number;
  amount: string | null;
  supermarketId: string; // Keep for potential future use
  supermarketName: string;
}

// Define the structure of the final response
interface GroupedSearchResults {
  [supermarketName: string]: Omit<
    ProductQueryResult,
    'supermarketId' | 'supermarketName'
  >[];
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const searchTerm = query.term as string;

  if (
    !searchTerm ||
    typeof searchTerm !== 'string' ||
    searchTerm.trim().length === 0
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Search term is required',
    });
  }

  const searchPattern = `%${searchTerm.trim()}%`;
  const initialFetchLimit = 1000; // Increased limit from 200
  const limitPerSupermarket = 10;

  try {
    // Fetch a larger set of results, ordered to potentially help grouping
    const flatResults = await db
      .select({
        id: products.id,
        name: products.name,
        link: products.link,
        price: products.price,
        amount: products.amount,
        supermarketId: supermarkets.id, // Keep the ID temporarily if needed
        supermarketName: supermarkets.name,
      })
      .from(products)
      .leftJoin(
        supermarkets,
        eq(products.supermarketId, supermarkets.id)
      )
      .where(like(products.name, searchPattern))
      .orderBy(supermarkets.name, asc(products.name)) // Order results
      .limit(initialFetchLimit);

    // Group results in code
    const groupedResults: GroupedSearchResults = {};

    for (const product of flatResults) {
      // Ensure supermarketName exists (should due to LEFT JOIN and schema)
      if (!product.supermarketName) continue;

      // Initialize array for supermarket if it doesn't exist
      if (!groupedResults[product.supermarketName]) {
        groupedResults[product.supermarketName] = [];
      }

      // Add product to the group if the limit per supermarket is not reached
      if (
        groupedResults[product.supermarketName].length <
        limitPerSupermarket
      ) {
        // Omit supermarketId and supermarketName from the final product object in the array
        const { supermarketId, supermarketName, ...productData } =
          product;
        groupedResults[product.supermarketName].push(productData);
      }
    }

    return groupedResults;
  } catch (error: any) {
    console.error('Error searching products:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to search products',
    });
  }
});
