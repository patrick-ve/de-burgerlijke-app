import {
  type WeaviateClient,
  type WeaviateObject,
  // Filters, // Not used directly for building in v3
} from 'weaviate-client';
import type { SupermarketName } from '~/composables/useOnboardingSettings';

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
  client: WeaviateClient,
  supermarketFilter?: SupermarketName[] // Add optional supermarket filter
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
    // Add logging right before the query inside the try block
    if (supermarketFilter && supermarketFilter.length > 0) {
      console.log(
        'DEBUG: Applying supermarket filter inside try block:',
        supermarketFilter
      );
    }

    const response = await productsCollection.query.hybrid(query, {
      limit: limit,
      fusionType: 'RelativeScore',
      alpha: 0.75,
      returnMetadata: ['distance'], // Include distance in metadata
      returnProperties: returnProperties, // Use the string[] type
      // Use v4 filter syntax: .containsAny() for multiple values
      filters:
        supermarketFilter && supermarketFilter.length > 0
          ? productsCollection.filter
              .byProperty('supermarketName')
              .containsAny(supermarketFilter)
          : undefined,
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
