import {
  defineEventHandler,
  readValidatedBody,
  createError,
} from 'h3';
import { z } from 'zod';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { v4 as uuidv4 } from 'uuid';
import type { ShoppingListItem } from '~/types/shopping-list'; // Assuming this type exists
import { consola } from 'consola';
import { ingredientCategories } from '~/server/utils/recipeSchema';
import type { IngredientCategory } from '~/types/recipe';

// Zod schema for a single shopping list item (input)
// Reflects the structure provided in the example and likely in ShoppingListItem type
const ShoppingListItemSchema = z.object({
  id: z.string().uuid(),
  ingredientName: z.string(),
  standardizedName: z.string().optional(), // Include if present in type
  aggregatedQuantity: z.number().nullable(),
  unit: z.string().nullable(),
  // Use z.enum with the imported categories, allow null, make optional
  category: z.enum(ingredientCategories).nullable().optional(),
  isChecked: z.boolean().default(false),
  recipeIds: z.array(z.string()),
  // Use preprocess to convert valid date strings to Date objects
  createdAt: z.preprocess((arg) => {
    if (typeof arg == 'string' || arg instanceof Date)
      return new Date(arg);
  }, z.date()),
  updatedAt: z.preprocess((arg) => {
    if (typeof arg == 'string' || arg instanceof Date)
      return new Date(arg);
  }, z.date()),
  priceInfo: z.array(z.any()).optional(), // Use z.any() or a more specific schema if available
  // Add other fields from ShoppingListItem if necessary
});

// Zod schema for the request body (array of shopping list items)
const RequestBodySchema = z.array(ShoppingListItemSchema);

// Zod schema for a single optimized item returned by the AI
const OptimizedItemSchema = z.object({
  ingredientName: z
    .string()
    .describe(
      'The standardized and potentially combined name of the ingredient in Dutch.'
    ),
  aggregatedQuantity: z
    .number()
    .nullable()
    .describe(
      'The combined total quantity for this ingredient. Null if quantity is not applicable (e.g., "1 snufje").'
    ),
  unit: z
    .string()
    .nullable()
    .describe(
      'The standardized Dutch unit (e.g., g, kg, ml, l, el, tl, stuk, teen, snufje). Null if no unit applies.'
    ),
  category: z
    .string()
    .nullable()
    .describe(
      `An optional category suggestion (e.g., ${ingredientCategories.join(', ')}).`
    ),
});

// Zod schema for the AI's structured output
const OptimizedListSchema = z.object({
  optimizedItems: z
    .array(OptimizedItemSchema)
    .describe(
      'An array containing the cleaned-up shopping list items.'
    ),
});

// Function to generate the system prompt
function createSystemPrompt(): string {
  return `
You are an AI assistant specialized in optimizing shopping lists for Dutch users.
Your task is to process a given list of shopping items (potentially messy, with duplicates, varying units, and inconsistent naming) and return a cleaned-up, merged, and standardized version.

Instructions:
1.  **Analyze Input:** Carefully examine the input array of shopping list items.
2.  **Merge Duplicates:** Identify items that refer to the same ingredient, even if the naming or unit is slightly different (e.g., "uien" and "ui", "gram" and "g"). Combine their quantities appropriately. If units are compatible (e.g., 500g and 1kg), convert to a single unit (e.g., 1.5kg). If units are incompatible or quantities are not numeric, list them as separate items or use your best judgment to represent the need (e.g., "1 bosje peterselie" and "fijngehakte peterselie" might remain separate or be merged into a general "peterselie" entry if quantities are vague).
3.  **Standardize Names:** Use clear, common Dutch names for ingredients. Correct typos. Be consistent (e.g., always use "ui", not sometimes "uien").
4.  **Standardize Units:** Use standard Dutch abbreviations: ml, l, el (eetlepel), tl (theelepel), g, kg, stuk(s), teen/tenen (for garlic), snuf(je), mespunt, pak, blik, bos(je), etc. Use 'null' if no unit or quantity is applicable (e.g., "peper en zout naar smaak").
5.  **Aggregate Quantities:** Sum quantities for merged items. If an item has no quantity (null), keep it that way unless merged with an item that *does*.
6.  **Round off quantities:** Round off quantities to the nearest whole number in the context of the ingredient. 475 ml becomes 500 ml, 1.5 kg becomes 2 kg.
7.  **Categorize:** If possible, assign a relevant category in English (e.g., ${ingredientCategories.join(', ')}). Use 'null' if unsure.
8.  **Output Format:** Respond ONLY with a valid JSON object matching the provided 'OptimizedListSchema'. The object must have a key "optimizedItems" containing an array of objects, where each object matches the 'OptimizedItemSchema'.

Example Input Item:
{ "ingredientName": "Penne pasta", "aggregatedQuantity": 500, "unit": "g" }
{ "ingredientName": "Penne", "aggregatedQuantity": 1, "unit": "pak" }

Example Output Item within the array:
{ "ingredientName": "Penne pasta", "aggregatedQuantity": 1.5, "unit": "kg", "category": "Pasta & Rice" }
`;
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  let inputItems: ShoppingListItem[];

  try {
    // Validate and read the request body
    inputItems = await readValidatedBody(
      event,
      RequestBodySchema.parse
    );
    consola.info(`Received ${inputItems.length} items for cleanup.`);

    if (inputItems.length === 0) {
      consola.info(
        'Input shopping list is empty, returning empty list.'
      );
      return [];
    }

    const systemPrompt = createSystemPrompt();
    // Format input items into a human-readable list
    const formattedItems = inputItems
      .map((item) => {
        let line = item.ingredientName;
        if (
          item.aggregatedQuantity !== null &&
          item.aggregatedQuantity !== undefined
        ) {
          line += `: ${item.aggregatedQuantity}`;
          if (item.unit) {
            line += ` ${item.unit}`;
          }
        } else if (item.unit) {
          // Handle cases with unit but no quantity, though less common
          line += `: ${item.unit}`;
        }
        return line;
      })
      .join('\\n'); // Use newline to separate items

    const userPrompt = `Please optimize the following shopping list items:\n${formattedItems}`;

    consola.debug('AI User Prompt:', userPrompt);
    consola.info('Generating optimized shopping list via AI...');

    const { object: optimizationResult } = await generateObject({
      model: openai('gpt-4.1-nano-2025-04-14'),
      schema: OptimizedListSchema,
      mode: 'json',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    consola.debug('Raw AI Result:', optimizationResult);

    if (!optimizationResult || !optimizationResult.optimizedItems) {
      consola.error(
        'AI returned null or undefined optimization result or items array.',
        optimizationResult
      );
      throw createError({
        statusCode: 500,
        statusMessage:
          'AI processing failed to return expected structure.',
      });
    }

    consola.success(
      `AI generated ${optimizationResult.optimizedItems.length} optimized items.`
    );

    const now = new Date();
    const cleanedShoppingList: ShoppingListItem[] =
      optimizationResult.optimizedItems.map((optItem) => {
        const isValidCategory =
          optItem.category &&
          ingredientCategories.includes(
            optItem.category as IngredientCategory
          );
        const category = isValidCategory
          ? (optItem.category as IngredientCategory)
          : null;

        return {
          id: uuidv4(),
          ingredientName: optItem.ingredientName,
          standardizedName: optItem.ingredientName
            .toLowerCase()
            .trim(),
          aggregatedQuantity: optItem.aggregatedQuantity,
          unit: optItem.unit,
          category: category,
          isChecked: false,
          recipeIds: [],
          createdAt: now,
          updatedAt: now,
          priceInfo: [],
        };
      });

    return cleanedShoppingList;
  } catch (error: any) {
    if (error?.errors) {
      consola.error('Invalid request body:', error.errors);
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid request body.',
        data: error.errors,
      });
    }
    consola.error('Error during AI shopping list cleanup:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Server error during shopping list cleanup.',
    });
  }
});
