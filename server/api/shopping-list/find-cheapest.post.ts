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
import type { SupermarketName } from '~/composables/useOnboardingSettings'; // Import SupermarketName type

interface RequestBody {
  ingredientNames: string[];
  selectedSupermarketIds?: SupermarketName[]; // Make it optional
}

interface ProductResult {
  id: string;
  name: string;
  price: number;
  amount: string | null;
  distance: number;
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

// Define a schema for the AI to return a SINGLE product ID (or null) per ingredient
const SelectedProductIdsResponseSchema = z.object({
  productsByIngredient: z
    .record(
      z.string(), // Ingredient name key
      z.string().nullable() // Single product ID or null
    )
    .nullable(),
});

// Define the final API return type using the full product interface
// Returns a single best product (selected by AI) or null per ingredient
type ApiReturnType = Record<string, ProductResult | null>;

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

    const initialSearchLimit = 10; // Fetch more products initially
    const limitPerSupermarket = 5; // Limit to top N per supermarket

    console.time('findCheapestProducts'); // Renamed timer for clarity

    if (!body || !Array.isArray(body.ingredientNames)) {
      throw new Error(
        'Invalid request body. Expected { ingredientNames: string[] }'
      );
    }

    const { ingredientNames, selectedSupermarketIds } = body;

    consola.info(
      `Received request to find cheapest products for: ${ingredientNames.join(
        ', '
      )}`
    );
    if (selectedSupermarketIds && selectedSupermarketIds.length > 0) {
      consola.info(
        `Filtering by supermarkets: ${selectedSupermarketIds.join(', ')}`
      );
    }

    const searchPromises = ingredientNames.map(async (name) => {
      try {
        // Fetch initial results (up to 10)
        const similarProductsRaw: WeaviateProductResult[] =
          await searchProducts(
            name,
            initialSearchLimit, // Still fetching 10 initially
            weaviateClient,
            selectedSupermarketIds // Pass the filter IDs
          );

        if (similarProductsRaw.length === 0) {
          consola.warn(`No similar products found for "${name}"`);
          return { ingredientName: name, similarProducts: [] }; // Return empty list
        }

        consola.info(
          `Found ${similarProductsRaw.length} initial similar products for "${name}"`
        );

        // Transform ALL raw Weaviate results (up to 10)
        const transformedProducts: ProductResult[] =
          similarProductsRaw.map((rawProduct) => {
            // Changed from top3RelevantProductsRaw
            const distance = rawProduct.metadata?.distance ?? 1;
            const similarity = Math.max(
              0,
              Math.min(100, (1 - distance) * 100)
            );

            return {
              id: rawProduct.uuid,
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
              distance: similarity,
            };
          });

        return {
          ingredientName: name,
          similarProducts: transformedProducts, // Return all transformed products for AI
        };
      } catch (error: any) {
        consola.error(
          `Error finding/processing products for "${name}":`,
          error.message
        );
        return {
          ingredientName: name,
          similarProducts: [], // Return empty list on error
        };
      }
    });

    // 'results' contains ALL similar products per ingredient for AI analysis
    const results = await Promise.all(searchPromises);

    consola.info(
      'Finished product search. Preparing data for AI selection.'
    );

    // Create a map of all fetched products for easy lookup after AI selection
    const allProductsMap = new Map<string, ProductResult>();
    results.forEach((result) => {
      if (result) {
        // Check if result is not null/undefined from potential errors
        result.similarProducts.forEach((product) => {
          allProductsMap.set(product.id, product);
        });
      }
    });

    // --- Updated AI Prompt ---
    const prompt = `
        Given the following list of ingredients and potential product matches:
        ${JSON.stringify(results, null, 2)}

        For each ingredient, analyze its 'similarProducts' array (max 10 products). Each product has this structure:
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

        Your goal is to select the SINGLE BEST product ID for each ingredient that best matches the ingredient description and offers good value.

        Selection Criteria:
        1. Relevance: Prioritize products with higher 'similarity' scores. Critically evaluate if the product 'name' closely matches the original 'ingredientName'. For example, for "garlic cloves", prefer 'garlic cloves' or 'garlic' over 'garlic powder', even if similarity score is high. For "parmezaan kaas", prefer "Parmigiano Reggiano" or "Grana Padano" over "Melkan Geraspte kaas jong belegen".
        2. Value: Use 'standardized_price_per_unit' as a key indicator. Lower is generally better, but consider it alongside relevance.
        3. Availability of Standardized Price: Strongly prefer products that HAVE a 'standardized_price_per_unit'.

        Process:
        - Analyze the 'similarProducts' list for each ingredient.
        - Select the ONE product ID that represents the best balance of relevance and value based on the criteria.
        - If no single suitable product can be identified (e.g., none are relevant enough, or none have standardized price), return null for that ingredient.

        Output Format:
        - Return a single JSON object.
        - Key: 'productsByIngredient'.
        - Value: An object where keys are original ingredient names.
        - Each ingredient name key maps to the selected product ID (string) OR null if no suitable product was found.

        Example Output Structure:
        \`\`\`json
        {
          "productsByIngredient": {
            "Ingredient A": "id1",
            "Ingredient B": null,
            "Ingredient C": "id4"
          }
        }
        \`\`\`
      `;

    try {
      consola.info(
        'Sending request to AI for single best product ID selection...'
      );

      const { object: selectedIdsByIngredient } =
        await generateObject({
          model: openai('gpt-4o'), // Using gpt-4o potentially
          schema: SelectedProductIdsResponseSchema, // Use the updated schema
          prompt: prompt,
        });

      consola.success(
        'Successfully received and validated AI response (product IDs).'
      );
      console.dir(selectedIdsByIngredient, { depth: null });

      // --- Map selected IDs back to full product details ---
      const finalResults: ApiReturnType = {};

      for (const [ingredientName, productId] of Object.entries(
        selectedIdsByIngredient.productsByIngredient
      )) {
        if (productId) {
          // Check if AI returned an ID (not null)
          const product = allProductsMap.get(productId);
          if (product) {
            finalResults[ingredientName] = product;
          } else {
            consola.warn(
              `Product ID "${productId}" selected by AI for ingredient "${ingredientName}" not found in the initial map.`
            );
            finalResults[ingredientName] = null; // Set to null if ID mapping fails
          }
        } else {
          // AI returned null for this ingredient
          finalResults[ingredientName] = null;
          consola.info(
            `AI returned null (no suitable product) for "${ingredientName}".`
          );
        }
      }

      console.timeEnd('findCheapestProducts');
      return finalResults; // Return the correctly structured final results
    } catch (error: any) {
      consola.error('Error during AI processing:', error);
      // Log the full error object for more details
      console.error('Full AI processing error object:', error);

      if (error.message?.includes('Type validation failed')) {
        consola.error(
          'AI response validation failed. Cause:',
          error.cause
        );
      }
      console.timeEnd('findCheapestProducts');
      throw new Error('Failed to select products using AI.');
    }
  }
);
