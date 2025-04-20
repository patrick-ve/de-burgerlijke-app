import { type WeaviateClient } from 'weaviate-client';

// Define the structure of the properties we expect from Weaviate
interface ProductProperties {
  name: string;
  link: string;
  price: number;
  amount: string | null;
  supermarketName: string;
  // Add index signature to satisfy Weaviate's Properties constraint
  [key: string]: any;
  // Add other properties if needed, e.g., standardizedPricePerUnit, standardizedUnit
}

// Define the structure of the final response (grouping by supermarket)
interface GroupedSearchResults {
  [supermarketName: string]: ProductProperties[];
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

  const weaviateClient = event.context
    .weaviate as WeaviateClient | null;

  if (!weaviateClient) {
    console.error(
      'Weaviate client is not available in event context.'
    );
    throw createError({
      statusCode: 500,
      statusMessage: 'Search service unavailable',
    });
  }

  // --- Configuration for Search ---
  const collectionName = 'Products';
  const searchLimit = 100; // How many results to fetch from Weaviate initially
  const limitPerSupermarket = 10; // How many results per supermarket in the final output
  // Explicitly type as string[] to match Weaviate options
  const returnProperties: string[] = [
    'name',
    'link',
    'price',
    'amount',
    'supermarketName',
  ];

  try {
    const productsCollection =
      weaviateClient.collections.get<ProductProperties>(
        collectionName
      );

    console.log(`Performing nearText search for: "${searchTerm}"`);

    const result = await productsCollection.query.nearText(
      searchTerm,
      {
        limit: searchLimit,
        returnProperties: returnProperties,
        // Optionally add metadata if needed, e.g., for distance/similarity
        // returnMetadata: ['distance'],
      }
    );

    console.log(
      `Weaviate query returned ${result.objects.length} results.`
    );

    // Group results by supermarketName
    const groupedResults: GroupedSearchResults = {};

    for (const item of result.objects) {
      const product = item.properties;

      // Basic validation
      if (!product || !product.supermarketName) {
        console.warn('Skipping item with missing properties:', item);
        continue;
      }

      const supermarketName = product.supermarketName;

      // Initialize array for supermarket if it doesn't exist
      if (!groupedResults[supermarketName]) {
        groupedResults[supermarketName] = [];
      }

      // Add product to the group if the limit per supermarket is not reached
      if (
        groupedResults[supermarketName].length < limitPerSupermarket
      ) {
        // Assert type here to satisfy the GroupedSearchResults structure
        groupedResults[supermarketName].push(
          product as ProductProperties
        );
      }
    }

    return groupedResults;
  } catch (error: any) {
    console.error(
      `Error searching products in Weaviate for term "${searchTerm}":`,
      error
    );
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to search products: ${error.message || 'Unknown error'}`,
    });
  }
});
