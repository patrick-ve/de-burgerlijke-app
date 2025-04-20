import { defineEventHandler, readBody } from 'h3';
import {
  searchProducts,
  type WeaviateProductResult,
} from '@/lib/query-products';
import { consola } from 'consola';
import { z } from 'zod';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { type WeaviateClient } from 'weaviate-client';

interface RequestBody {
  ingredientNames: string[];
}

interface ProductResult {
  id: string;
  name: string;
  price: number;
  amount: string | null;
  similarity: number;
  standardized_price_per_unit: number | null;
  standardized_unit: string | null;
  supermarketName: string;
}

interface ResultItem {
  ingredientName: string;
  similarProducts: ProductResult[];
}

// Schema for the structure of a SINGLE selected product in the FINAL API response
const SelectedProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  supermarketId: z.string(),
  supermarketName: z.string(),
  price: z.number(),
  amount: z.string().nullable(),
  standardized_price_per_unit: z.number().nullable(),
  standardized_unit: z.string().nullable(),
});

// Define a schema for the AI to return only product IDs
const SelectedProductIdsResponseSchema = z.object({
  productsByIngredient: z.record(
    z.string(), // Ingredient name key must be a string
    z.array(z.string()).max(5) // Array of up to 5 product IDs
  ),
});

// Define the final API return type using the full product interface
type ApiReturnType = Record<string, ProductResult[]>;

// Define structure for grouping results within the handler
interface GroupedProductResults {
  [supermarketName: string]: ProductResult[];
}

export default defineEventHandler(
  async (event): Promise<ApiReturnType> => {
    const body = await readBody<RequestBody>(event);
    const weaviateClient = event.context
      .weaviate as WeaviateClient | null;

    if (!weaviateClient) {
      consola.error(
        'Weaviate client is not available in event context.'
      );
      throw new Error('Search service unavailable');
    }

    const initialSearchLimit = 15; // Fetch more products initially
    const limitPerSupermarket = 5; // Limit to top N per supermarket

    console.time('findCheapestProducts'); // Renamed timer for clarity

    if (!body || !Array.isArray(body.ingredientNames)) {
      throw new Error(
        'Invalid request body. Expected { ingredientNames: string[] }'
      );
    }

    const { ingredientNames } = body;

    consola.info(
      `Received request to find cheapest products for: ${ingredientNames.join(', ')}`
    );

    const searchPromises = ingredientNames.map(async (name) => {
      try {
        // Fetch a larger set of initial results using the imported function
        const similarProductsRaw: WeaviateProductResult[] =
          await searchProducts(
            name,
            initialSearchLimit,
            weaviateClient
          );

        if (similarProductsRaw.length === 0) {
          consola.warn(`No similar products found for "${name}"`);
          return { ingredientName: name, similarProducts: [] };
        }

        consola.success(
          `Found ${similarProductsRaw.length} initial similar products for "${name}"`
        );

        // --- Transform Raw Weaviate Results ---
        const transformedProducts: ProductResult[] =
          similarProductsRaw.map((rawProduct) => {
            const distance = rawProduct.metadata?.distance ?? 1; // Default to 1 if distance is missing
            // Calculate similarity: (1 - distance) * 100, clamped between 0 and 100
            const similarity = Math.max(
              0,
              Math.min(100, (1 - distance) * 100)
            );

            return {
              id: rawProduct.uuid, // Use uuid as the primary identifier
              name: rawProduct.properties.name ?? 'Unknown Name',
              price: rawProduct.properties.price ?? 0,
              amount: rawProduct.properties.amount ?? null,
              supermarketName:
                rawProduct.properties.supermarketName ??
                'Unknown Supermarket',
              standardized_price_per_unit:
                rawProduct.properties.standardizedPricePerUnit ??
                null,
              standardized_unit:
                rawProduct.properties.standardizedUnit ?? null,
              similarity: similarity, // Add calculated similarity
            };
          });

        return {
          ingredientName: name,
          similarProducts: transformedProducts, // Use the transformed list
        };
      } catch (error: any) {
        consola.error(
          `Error finding/processing products for "${name}":`,
          error.message
        );
        return {
          ingredientName: name,
          similarProducts: [],
        };
      }
    });

    // This 'results' variable now contains the *curated* products per ingredient
    const results = await Promise.all(searchPromises);

    consola.info(
      'Finished product search and curation. Starting AI processing.'
    );

    console.dir(results, { depth: null });

    // --- Updated AI Prompt ---
    const prompt = `
        Given the following list of ingredients and a curated list of potential product matches (already transformed):
        ${JSON.stringify(results, null, 2)} // Sending transformed results

        For each ingredient, analyze its 'similarProducts' array. Each product in this array has the following structure:
        {
          "id": "string",
          "name": "string",
          "price": number,
          "amount": "string | null",
          "supermarketName": "string",
          "standardized_price_per_unit": "number | null",
          "standardized_unit": "string | null",
          "similarity": number // Percentage (0-100), higher is more similar
        }

        Your goal is to select the top 5 products for each ingredient that best match the ingredient description and offer good value FROM THIS TRANSFORMED LIST.

        Selection Criteria:
        1. Relevance: Prioritize products with higher 'similarity' scores. Also, consider if the product 'name' closely matches the original 'ingredientName'. For example, when "garlic cloves" is requested, prioritize products named 'garlic cloves' or 'garlic', avoiding 'garlic powder' or 'garlic paste', even if similarity is high due to vector proximity.
        2. Value: Use 'standardized_price_per_unit' as the primary indicator of value. Lower is better.
        3. Availability of Standardized Price: Strongly prefer products that HAVE a 'standardized_price_per_unit'.

        Process:
        - Analyze the 'similarProducts' list for the ingredient based on relevance (similarity + name match) and standardized price availability.
        - Select up to 5 of the best matches based on the criteria above.
        - It's acceptable to return fewer than 5 products if not enough suitable candidates are found in the curated list.

        Output Format:
        - Return a single JSON object.
        - This object MUST contain a key named 'productsByIngredient'.
        - The value associated with 'productsByIngredient' MUST be an object.
        - Inside this object, keys are the original ingredient names (e.g., "Garlic Cloves", "Olive Oil").
        - Each ingredient name key must map to an array containing ONLY THE IDs (strings) of the final selected product objects.
        - The array for each ingredient should contain between 0 and 5 product IDs.
        - If NO suitable products are found for a specific ingredient, return an empty array \`[]\` for that ingredient's key.
        - If NO suitable products are found for ANY ingredient, the value for 'productsByIngredient' should be an empty object \`{}\`.

        Example Output Structure:
        \`\`\`json
        {
          "productsByIngredient": {
            "Ingredient A": ["id1", "id2", "id3"],
            "Ingredient B": [],
            "Ingredient C": ["id4"]
          }
        }
        \`\`\`
      `;

    try {
      consola.info(
        'Sending request to AI for top 5 product ID selection from curated list...'
      );
      // const { object: selectedIdsByIngredient } =
      //   await generateObject({
      //     model: openai('gpt-4.1'),
      //     schema: SelectedProductIdsResponseSchema,
      //     prompt: prompt,
      //   });

      // consola.success(
      //   'Successfully received and validated AI response (product IDs).'
      // );

      // // --- Map IDs back to full product details and sort ---
      // const finalResults: ApiReturnType = {};

      // for (const [ingredientName, productIds] of Object.entries(
      //   selectedIdsByIngredient.productsByIngredient
      // )) {
      //   const productsForIngredient: ProductResult[] = [];
      //   for (const productId of productIds) {
      //     const product = allProductsMap.get(productId);
      //     if (product) {
      //       productsForIngredient.push(product);
      //     } else {
      //       consola.warn(
      //         `Product ID "${productId}" selected by AI for ingredient "${ingredientName}" not found in the initial map.`
      //       );
      //     }
      //   }
      //   // Optional: Sort products within the ingredient list if needed
      //   // productsForIngredient.sort((a, b) => a.similarity - b.similarity); // Example sort by similarity (ascending)
      //   finalResults[ingredientName] = productsForIngredient;
      // }

      // console.timeEnd('findCheapestProducts');
      // return finalResults; // Return the correctly structured final results
    } catch (error: any) {
      consola.error('Error during AI processing:', error);
      if (error.message?.includes('Type validation failed')) {
        consola.error(
          'AI response validation failed. Cause:',
          error.cause
        );
      }
      console.timeEnd('findCheapestProducts'); // Use updated timer name
      throw new Error('Failed to select products using AI.');
    }
  }
);
