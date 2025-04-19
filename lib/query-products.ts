import {
  type WeaviateClient,
  type WeaviateObject,
} from 'weaviate-client';

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' }); // Assuming you use dotenv

// Define the structure of the properties returned by Weaviate
// Adjust based on your actual Weaviate schema
export interface WeaviateProductProperties {
  id?: string; // Assuming ID might be needed
  name?: string;
  price?: number;
  link?: string;
  amount?: string | null;
  supermarket_id?: string;
  supermarketName?: string;
  standardized_price_per_unit?: number | null;
  standardized_unit?: string | null;
  // Add index signature to satisfy Weaviate constraint
  [key: string]: any;
}

// Define the structure of the Weaviate object including metadata
// Making metadata required to match WeaviateObject expectations
export interface WeaviateProductResult
  extends WeaviateObject<WeaviateProductProperties> {
  metadata: { distance?: number; [key: string]: any }; // Made required
}

// Export the function and modify its signature and logic
export async function searchProducts(
  query: string,
  limit: number,
  client: WeaviateClient
): Promise<WeaviateProductResult[]> {
  if (!client) {
    console.error('Weaviate client is not provided.');
    throw new Error('Weaviate client required'); // Throw error instead of returning undefined
  }

  const productsCollection =
    client.collections.get<WeaviateProductProperties>(
      'Products' // Assuming collection name is 'Products'
    );

  // Define properties to return explicitly as string[]
  const returnProperties: string[] = [
    'name',
    'price',
    'link',
    'amount',
    'supermarketName',
    'standardizedPricePerUnit',
    'standardizedUnit',
    // Add 'id' explicitly if needed by find-cheapest.post.ts
    // 'id',
  ];

  try {
    const response = await productsCollection.query.nearText(query, {
      limit: limit,
      returnMetadata: ['distance'], // Include distance in metadata
      returnProperties: returnProperties, // Use the string[] type
    });

    // Type assertion might still be needed if WeaviateClient types are loose
    return response.objects as WeaviateProductResult[];
  } catch (error: any) {
    console.error(
      `Error searching Weaviate for query "${query}":`,
      error
    );
    // Re-throw or return empty array based on desired error handling
    throw new Error(`Weaviate search failed: ${error.message}`);
  }
}
