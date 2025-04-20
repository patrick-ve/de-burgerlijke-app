import type { WeaviateProductResult } from './query-products';

/**
 * Selects the top N product matches from a list based on Weaviate distance.
 *
 * @param products - The list of Weaviate product results.
 * @param count - The number of top matches to return.
 * @returns An array containing the top N product matches, sorted by distance (ascending).
 */
export function selectBestMatches(
  products: WeaviateProductResult[],
  count: number = 3
): WeaviateProductResult[] {
  if (!products || products.length === 0) {
    return [];
  }

  // Sort products by distance (ascending). Lower distance is better.
  // Handle cases where metadata or distance might be undefined.
  const sortedProducts = [...products].sort((a, b) => {
    const distanceA = a.metadata?.distance ?? Infinity;
    const distanceB = b.metadata?.distance ?? Infinity;
    return distanceA - distanceB;
  });

  // Return the top N products
  return sortedProducts.slice(0, count);
}
