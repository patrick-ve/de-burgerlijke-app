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
  standardizedName: string;
  url: string | null;
  price: number;
  amount: string | null;
  distance: number; // Renamed from similarity for consistency with Weaviate term
  standardized_price_per_unit: number | null;
  standardized_unit: string | null;
  supermarketName: string; // Ensure supermarketName is included
}

interface ResultItem {
  ingredientName: string;
  similarProducts: ProductResult[];
}

// Schema for the structure of a SINGLE selected product in the FINAL API response
const SelectedProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  // supermarketId: z.string(), // Removed as ID is already the main identifier
  supermarketName: z.string(),
  price: z.number(),
  amount: z.string().nullable(),
  standardized_price_per_unit: z.number().nullable(),
  standardized_unit: z.string().nullable(),
  // distance: z.number(), // distance/similarity might not be needed in the final API response
});

// Define a schema for the AI to return a SINGLE product ID (or null) for ONE ingredient
const SingleProductSelectionSchema = z.object({
  selectedProductId: z.string().nullable(), // Can be null if no suitable product found
});

// Define the final API return type using the full product interface
// Returns a single best product (selected by AI) or null per ingredient
type ApiReturnType = Record<string, ProductResult | null>;

// Define structure for grouping results (Not used currently, but kept for potential future use)
// interface GroupedProductResults {
//   [supermarketName: string]: ProductResult[];
// }

// --- Function to generate the prompt for a single ingredient ---
const generateSingleIngredientPrompt = (
  ingredientName: string,
  products: ProductResult[]
): string => {
  return `
    Analyze the following list of potential product matches for the ingredient "${ingredientName}":
    ${JSON.stringify(products, null, 2)}

    Each product has this structure:
    {
      "id": "string",
      "name": "string",
      "price": number,
      "amount": "string | null",
      "supermarketName": "string",
      "standardized_price_per_unit": "number | null",
      "standardized_unit": "string | null",
      "distance": number // Represents relevance (lower is better, closer to 0) - Note: this prompt incorrectly stated higher is better before. Lower distance = higher similarity.
    }

    Your goal is to select the SINGLE BEST product ID for "${ingredientName}" that best matches the ingredient description and offers good value.

    Selection Criteria:
    1. Relevance: Prioritize products with lower 'distance' scores. Critically evaluate if the product 'name' closely matches the original 'ingredientName'. For example, for "garlic cloves", prefer 'garlic cloves' or 'garlic' over 'garlic powder'. For "parmezaan kaas", prefer "Parmigiano Reggiano" or "Grana Padano" over "Melkan Geraspte kaas jong belegen".
    2. Value: Use 'standardized_price_per_unit' as a key indicator. Lower is generally better, but consider it alongside relevance.
    3. Availability of Standardized Price: Strongly prefer products that HAVE a 'standardized_price_per_unit'.

    Process:
    - Analyze the 'similarProducts' list provided above.
    - Select the ONE product ID that represents the best balance of relevance and value based on the criteria.
    - If no single suitable product can be identified (e.g., none are relevant enough, or none have standardized price), return null.

    Output Format:
    - Return a single JSON object.
    - Key: 'selectedProductId'.
    - Value: The selected product ID (string) OR null if no suitable product was found.

    Example Output Structure (for a single ingredient):
    \`\`\`json
    {
      "selectedProductId": "some-product-uuid-123"
    }
    \`\`\`
    or
    \`\`\`json
    {
      "selectedProductId": null
    }
    \`\`\`
  `;
};

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

    const initialSearchLimit = 10; // Fetch up to 10 products initially per ingredient

    console.time('findCheapestProducts'); // Start timer

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

    // --- Step 1: Search for candidate products for all ingredients ---
    const searchPromises = ingredientNames.map(async (name) => {
      try {
        const similarProductsRaw: WeaviateProductResult[] =
          await searchProducts(
            name,
            initialSearchLimit,
            weaviateClient,
            selectedSupermarketIds // Pass the filter IDs
          );

        if (similarProductsRaw.length === 0) {
          consola.warn(
            `No similar products found for "${name}" via Weaviate.`
          );
          return { ingredientName: name, similarProducts: [] };
        }

        consola.info(
          `Found ${similarProductsRaw.length} initial similar products for "${name}"`
        );

        const transformedProducts: ProductResult[] =
          similarProductsRaw.map((rawProduct) => ({
            id: rawProduct.uuid,
            standardizedName:
              rawProduct.properties.standardizedName ??
              'Unknown Name',
            url: rawProduct.properties.link ?? null,
            price: rawProduct.properties.price ?? 0,
            amount: rawProduct.properties.amount ?? null,
            supermarketName:
              rawProduct.properties.supermarketName ??
              'Unknown Supermarket',
            standardized_price_per_unit:
              rawProduct.properties.standardizedPricePerUnit ?? null,
            standardized_unit:
              rawProduct.properties.standardizedUnit ?? null,
            distance: rawProduct.metadata?.distance ?? 1, // Lower distance = better match
          }));

        return {
          ingredientName: name,
          similarProducts: transformedProducts,
        };
      } catch (error: any) {
        consola.error(
          `Error finding/processing products for "${name}":`,
          error.message
        );
        // Return an object indicating failure for this ingredient
        return { ingredientName: name, error: error.message };
      }
    });

    const searchResults = await Promise.all(searchPromises);

    consola.info(
      'Finished product search. Preparing data for parallel AI selection.'
    );

    // --- Step 2: Create a map of all fetched products for easy lookup later ---
    const allProductsMap = new Map<string, ProductResult>();
    searchResults.forEach((result) => {
      // Check if result exists and doesn't have an error, and has products
      if (result && !('error' in result) && result.similarProducts) {
        result.similarProducts.forEach((product) => {
          allProductsMap.set(product.id, product);
        });
      }
    });

    // --- Step 3: Prepare and execute parallel AI calls ---
    const aiPromises = searchResults
      .map((result) => {
        // Skip ingredients where the initial search failed or found no products
        if (
          !result ||
          'error' in result ||
          result.similarProducts.length === 0
        ) {
          consola.warn(
            `Skipping AI call for "${result?.ingredientName}" due to search error or no products found.`
          );
          return null; // Indicate skipping this ingredient for AI
        }

        const { ingredientName, similarProducts } = result;
        const prompt = generateSingleIngredientPrompt(
          ingredientName,
          similarProducts
        );

        return (async () => {
          try {
            consola.info(
              `Starting AI selection for "${ingredientName}"...`
            );
            const { object: selectedProduct, usage } =
              await generateObject({
                model: openai('gpt-4.1-mini-2025-04-14'),
                schema: SingleProductSelectionSchema,
                prompt: prompt,
              });
            consola.success(
              `AI selection successful for "${ingredientName}". Selected ID: ${selectedProduct.selectedProductId ?? 'null'}`
            );
            return {
              ingredientName,
              selectedProductId: selectedProduct.selectedProductId,
              usage, // Return usage for cost calculation
              status: 'fulfilled' as const, // Add status for type narrowing
            };
          } catch (aiError: any) {
            consola.error(
              `AI processing failed for "${ingredientName}":`,
              aiError.message
            );
            if (aiError.message?.includes('Type validation failed')) {
              consola.error(
                'AI response validation failed. Cause:',
                aiError.cause
              );
            }
            return {
              ingredientName,
              error: aiError,
              status: 'rejected' as const, // Add status for type narrowing
            };
          }
        })();
      })
      .filter((promise) => promise !== null); // Filter out skipped ingredients

    // Execute AI calls in parallel and wait for all to settle
    const aiResults = await Promise.allSettled(aiPromises);

    consola.info('All parallel AI calls settled.');

    // --- Step 4: Aggregate results and calculate total cost ---
    const finalResults: ApiReturnType = {};
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let totalAiCost = 0;
    const inputCostPerMillion = 0.15; // gpt-4o-mini input price ($0.15 / 1M tokens)
    const outputCostPerMillion = 0.6; // gpt-4o-mini output price ($0.60 / 1M tokens)

    aiResults.forEach((settledResult, index) => {
      // Get the original ingredient name (important if order changes, though Promise.allSettled maintains order)
      // We rely on the order here, which Promise.allSettled preserves.
      // A more robust way might involve passing the ingredient name through, which we did.
      const originalIngredientName = searchResults.filter(
        (r) => r && !('error' in r) && r.similarProducts.length > 0
      )[index]?.ingredientName; // Find corresponding original ingredient

      if (!originalIngredientName) {
        consola.error(
          `Could not map AI result at index ${index} back to an ingredient name. Skipping.`
        );
        return; // Should not happen if filtering logic is correct
      }

      if (settledResult.status === 'fulfilled') {
        const resultValue = settledResult.value; // Already contains ingredientName

        // Double check name consistency, although the value should have it
        if (resultValue.ingredientName !== originalIngredientName) {
          consola.warn(
            `Mismatch in ingredient names: expected "${originalIngredientName}", got "${resultValue.ingredientName}" from AI result.`
          );
        }

        const ingredientName = resultValue.ingredientName; // Use name from the result value
        const productId = resultValue.selectedProductId;

        if (productId) {
          const product = allProductsMap.get(productId);
          if (product) {
            finalResults[ingredientName] = product;
          } else {
            consola.warn(
              `Product ID "${productId}" selected by AI for ingredient "${ingredientName}" not found in the initial map.`
            );
            finalResults[ingredientName] = null;
          }
        } else {
          // AI returned null for this ingredient
          finalResults[ingredientName] = null;
          consola.info(
            `AI returned null (no suitable product) for "${ingredientName}".`
          );
        }

        // Accumulate token usage and cost
        if (resultValue.usage) {
          totalPromptTokens += resultValue.usage.promptTokens;
          totalCompletionTokens += resultValue.usage.completionTokens;
          const inputCost =
            (resultValue.usage.promptTokens / 1_000_000) *
            inputCostPerMillion;
          const outputCost =
            (resultValue.usage.completionTokens / 1_000_000) *
            outputCostPerMillion;
          totalAiCost += inputCost + outputCost;
        }
      } else {
        // AI call failed for this ingredient
        const ingredientName = originalIngredientName; // Use the mapped name
        consola.error(
          `AI call for "${ingredientName}" failed:`,
          settledResult.reason?.message || settledResult.reason
        );
        finalResults[ingredientName] = null; // Set to null on failure
      }
    });

    // --- Step 5: Handle ingredients that were skipped or failed initial search ---
    ingredientNames.forEach((name) => {
      if (!(name in finalResults)) {
        // If an ingredient wasn't processed by AI (due to search error, no products, or AI error), ensure it's null
        consola.info(
          `Setting final result for "${name}" to null as it wasn't successfully processed by AI.`
        );
        finalResults[name] = null;
      }
    });

    // Log total usage and cost
    consola.info(
      `Total AI Token Usage: Prompt=${totalPromptTokens}, Completion=${totalCompletionTokens}, Total=${totalPromptTokens + totalCompletionTokens}`
    );
    consola.info(
      `Estimated Total AI Cost: $${totalAiCost.toFixed(6)}`
    );

    console.timeEnd('findCheapestProducts');
    return finalResults;
  }
);
