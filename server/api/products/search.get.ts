import { db } from '~/server/utils/db';
import { products, supermarkets } from '~/server/db/schema';
import { sql, like, eq } from 'drizzle-orm';

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
  const limit = 50; // Limit results to avoid overwhelming the browser

  try {
    const results = await db
      .select({
        id: products.id,
        name: products.name,
        link: products.link,
        price: products.price,
        amount: products.amount,
        supermarketName: supermarkets.name, // Select supermarket name from joined table
      })
      .from(products)
      .leftJoin(
        supermarkets,
        eq(products.supermarketId, supermarkets.id)
      ) // Join products with supermarkets
      .where(like(products.name, searchPattern)) // Case-insensitive search using LIKE
      // Note: For true case-insensitivity with LIKE in standard SQLite, often requires `lower()`
      // .where(sql`lower(${products.name}) like lower(${searchPattern})`)
      // Consider using a more robust FTS (Full-Text Search) setup for better performance/relevance if needed.
      .limit(limit);

    return results;
  } catch (error: any) {
    console.error('Error searching products:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to search products',
    });
  }
});
