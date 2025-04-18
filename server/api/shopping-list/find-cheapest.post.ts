import { defineEventHandler, readBody } from 'h3';
import { findSimilarProducts } from '../../../lib/query-embeddings';
import { consola } from 'consola';
import { z } from 'zod';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import fs from 'node:fs';

interface RequestBody {
  ingredientNames: string[];
}

interface ProductResult {
  id: string;
  name: string;
  price: number;
  link: string;
  amount: string | null;
  supermarketId: string;
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

// Define a schema for the AI to return only product IDs
const SelectedProductIdsResponseSchema = z.object({
  productsByIngredient: z.record(
    z.string(), // Ingredient name key must be a string
    z.array(z.string()).max(5) // Array of up to 5 product IDs
  ),
});

// Define the final API return type using the full product interface
type ApiReturnType = Record<string, ProductResult[]>;

export default defineEventHandler(
  async (event): Promise<ApiReturnType> => {
    const body = await readBody<RequestBody>(event);

    console.time('findSimilarProducts'); // Start timer

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
        const similarProductsRaw = await findSimilarProducts(
          name,
          10,
          10
        );

        if (similarProductsRaw.length > 0) {
          consola.success(
            `Found ${similarProductsRaw.length} similar products for "${name}"`
          );
        } else {
          consola.warn(`No similar product found for "${name}"`);
        }

        const similarProducts: ProductResult[] =
          similarProductsRaw.map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            link: p.link,
            amount: p.amount,
            supermarketId: p.supermarketId,
            distance: p.distance,
            standardized_price_per_unit:
              p.standardized_price_per_unit,
            standardized_unit: p.standardized_unit,
            supermarketName: p.supermarketName,
          }));

        return {
          ingredientName: name,
          similarProducts: similarProducts,
        };
      } catch (error: any) {
        consola.error(
          `Error finding product for "${name}":`,
          error.message
        );
        return {
          ingredientName: name,
          similarProducts: [],
        };
      }
    });

    const results = await Promise.all(searchPromises);

    consola.info(
      'Finished initial product search. Starting AI processing.'
    );

    // Log the initial 10 products found for each ingredient
    results.forEach((item) => {
      if (item.similarProducts.length > 0) {
        consola.info(
          `Initial products for "${item.ingredientName}":`,
          item.similarProducts
        );
      } else {
        consola.warn(
          `No initial products found for "${item.ingredientName}" to log.`
        );
      }
    });

    // Prepare data for AI prompt
    const promptData = results
      .filter((item) => item.similarProducts.length > 0) // Only process ingredients with results
      .map((item) => ({
        ingredient: item.ingredientName,
        // Provide only necessary fields to the AI
        products: item.similarProducts.map((p) => ({
          id: p.id,
          name: p.name,
          standardized_price_per_unit: p.standardized_price_per_unit,
          standardized_unit: p.standardized_unit,
        })),
      }));

    if (promptData.length === 0) {
      consola.warn(
        'No products found for any ingredient. Skipping AI step.'
      );
      console.timeEnd('findSimilarProducts');
      return {}; // Return empty object if no products to process
    }

    // Updated AI prompt
    const prompt = `
        Given the following list of ingredients and their top 10 potential product matches from different supermarkets:
        ${JSON.stringify(promptData, null, 2)}

        For each ingredient, analyze its 'products' array (which contains up to 10 items). Your goal is to select the top 5 products that best match the ingredient description and offer good value.

        Selection Criteria:
        1. Relevance: Prioritize products whose 'name' most closely matches the 'ingredient'. When a clove of garlic is requested, prioritize products that are called 'garlic cloves' or 'garlic' and not 'garlic powder' or 'garlic paste'.
        2. Value: Use 'standardized_price_per_unit' as the primary indicator of value. Lower is better.
        3. Availability of Standardized Price: Strongly prefer products that HAVE a 'standardized_price_per_unit'.

        Process:
        - First, identify the 5 most relevant products from the top 10 list for the ingredient.
        - From these 5, check if any are missing the 'standardized_price_per_unit'.
        - If a product is missing 'standardized_price_per_unit', try to replace it with the next most relevant product from the *original* top 10 list that *does* have a 'standardized_price_per_unit'.
        - Continue this replacement process until you have 5 products, or you run out of suitable candidates in the top 10 list that have a standardized price. It's acceptable to return fewer than 5 products if necessary, but aim for 5.

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
        Or, if no products are found for any ingredient:
        \`\`\`json
        {
          "productsByIngredient": {}
        }
        \`\`\`
      `;

    try {
      consola.info(
        'Sending request to AI for top 5 product ID selection...'
      );
      // Use the new schema expecting only IDs
      const { object: selectedIdsByIngredient } =
        await generateObject({
          model: openai('gpt-4.1'),
          schema: SelectedProductIdsResponseSchema, // Use the new schema for IDs
          prompt: prompt,
        });

      consola.success(
        'Successfully received and validated AI response (product IDs).'
      );

      // --- Map IDs back to full product details and sort ---
      const finalResults: ApiReturnType = {};
      const allProductsMap = new Map<string, ProductResult>();

      // Create a map of all initially fetched products for quick lookup
      results.forEach((item) => {
        item.similarProducts.forEach((product) => {
          allProductsMap.set(product.id, product);
        });
      });

      for (const ingredientName in selectedIdsByIngredient.productsByIngredient) {
        const selectedIds =
          selectedIdsByIngredient.productsByIngredient[
            ingredientName
          ];

        // Ensure selectedIds is an array before mapping
        if (Array.isArray(selectedIds)) {
          const selectedFullProducts: ProductResult[] = selectedIds
            .map((id: string) => allProductsMap.get(id)) // Add explicit type for id
            .filter((p): p is ProductResult => p !== undefined); // Keep type guard

          // Sort the selected full products by standardized_price_per_unit
          selectedFullProducts.sort((a, b) => {
            if (
              a.standardized_price_per_unit === null &&
              b.standardized_price_per_unit === null
            ) {
              return 0; // Keep original order if both are null
            }
            if (a.standardized_price_per_unit === null) {
              return 1; // a (null) comes after b (non-null)
            }
            if (b.standardized_price_per_unit === null) {
              return -1; // b (null) comes after a (non-null)
            }
            return (
              a.standardized_price_per_unit -
              b.standardized_price_per_unit
            );
          });

          // Assign the sorted full products to the final result object
          finalResults[ingredientName] = selectedFullProducts;
        } else {
          consola.warn(
            `Received non-array value for selected IDs for ingredient: ${ingredientName}. Skipping.`
          );
          finalResults[ingredientName] = []; // Assign empty array if IDs are not valid
        }
      }
      // --- End mapping and sorting ---

      console.timeEnd('findSimilarProducts'); // End timer and log duration
      return finalResults; // Return the object structured with full product details
    } catch (error: any) {
      consola.error('Error during AI processing:', error);
      // Log additional details if it's a validation error
      if (error.message?.includes('Type validation failed')) {
        consola.error(
          'AI response validation failed. Cause:',
          error.cause
        );
      }
      console.timeEnd('findSimilarProducts'); // End timer even on error
      throw new Error('Failed to select products using AI.');
    }
  }
);
