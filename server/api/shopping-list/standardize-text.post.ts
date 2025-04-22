import {
  defineEventHandler,
  readValidatedBody,
  createError,
} from 'h3';
import { z } from 'zod';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { v4 as uuidv4 } from 'uuid';
import type { ShoppingListItem } from '~/types/shopping-list';
import { consola } from 'consola';
import { ingredientCategories } from '~/server/utils/recipeSchema'; // Reuse categories
import type { IngredientCategory } from '~/types/recipe';

// Zod schema for the request body
const RequestBodySchema = z.object({
  lines: z.array(z.string().min(1)).min(1), // Expect at least one non-empty line
});

// Zod schema for a single structured item returned by the AI
// Similar to OptimizedItemSchema in clean-up.post.ts
const StandardizedItemSchema = z.object({
  originalLine: z
    .string()
    .describe('The original input line corresponding to this item.'),
  ingredientName: z
    .string()
    .describe(
      'The standardized name of the ingredient in Dutch (e.g., "Ui", "Volkorenbrood").'
    ),
  quantity: z
    .number()
    .nullable()
    .describe(
      'The extracted quantity. Null if not applicable or not found.'
    ),
  unit: z
    .string()
    .nullable()
    .describe(
      'The standardized Dutch unit (e.g., g, kg, ml, l, el, tl, stuk, teen, snufje). Null if no unit applies.'
    ),
  category: z
    .string() // Keep as string initially for flexibility from AI
    .nullable()
    .describe(
      `An optional category suggestion from the list: ${ingredientCategories.join(', ')}.`
    ),
});

// Zod schema for the AI's structured output
const StandardizedListSchema = z.object({
  standardizedItems: z
    .array(StandardizedItemSchema)
    .describe(
      'An array containing the structured items parsed from the input lines.'
    ),
});

// Function to generate the system prompt for parsing lines
function createSystemPrompt(): string {
  return `
You are an AI assistant specialized in parsing Dutch shopping list entries.
Your task is to process an array of raw text lines, where each line represents one or more shopping items, and convert each line into a structured format.

Instructions:
1.  **Input:** You will receive an array of strings, each string being a line from a user's shopping list input.
2.  **Process Each Line:** For each line in the input array:
    *   Identify the main ingredient(s).
    *   Extract the quantity, if specified.
    *   Extract the unit, if specified.
    *   Determine a suitable category from the provided list.
    *   Standardize the ingredient name (e.g., "uien" -> "Ui", "Avocado's" -> "Avocado").
    *   Standardize the unit using common Dutch abbreviations (ml, l, el, tl, g, kg, stuk(s), teen/tenen, snuf(je), pak, blik, bos(je), etc.). Use 'null' if no unit is applicable.
    *   If a line contains multiple distinct items (e.g., "Melk, Brood, Eieren"), try to create separate structured items for each if possible, otherwise create a single item representing the line.
3.  **Categorize:** Assign a relevant category in English from the list: ${ingredientCategories.join(', ')}. Use 'null' if unsure or not applicable.
4.  **Output Format:** Respond ONLY with a valid JSON object matching the 'StandardizedListSchema'. The object must have a key "standardizedItems" containing an array of objects. Each object in the array must match the 'StandardizedItemSchema' and correspond to a parsed item from the input lines. Include the 'originalLine' in each output item.

Example Input Line: "2 large onions"
Example Output Item:
{ "originalLine": "2 large onions", "ingredientName": "Ui", "quantity": 2, "unit": "stuk", "category": "Vegetables" }

Example Input Line: "Zout en peper"
Example Output Item:
{ "originalLine": "Zout en peper", "ingredientName": "Zout en peper", "quantity": null, "unit": null, "category": "Spices & Seasonings" }

Example Input Line: "500gr Kipfilet"
Example Output Item:
{ "originalLine": "500gr Kipfilet", "ingredientName": "Kipfilet", "quantity": 500, "unit": "g", "category": "Meat & Fish" }
`;
}

// Helper to standardize name (simple version, AI does the heavy lifting)
const standardizeName = (name: string): string => {
  return name.trim().toLowerCase();
};

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  let inputLines: string[];

  try {
    // Validate and read the request body
    const body = await readValidatedBody(
      event,
      RequestBodySchema.parse
    );
    inputLines = body.lines;
    consola.info(
      `Received ${inputLines.length} lines for standardization.`
    );

    const systemPrompt = createSystemPrompt();
    const userPrompt = `Please parse and standardize the following shopping list lines:
${JSON.stringify(inputLines)}`;

    consola.debug('AI Standardization Prompt:', userPrompt);
    consola.info('Generating standardized items via AI...');

    const { object: standardizationResult } = await generateObject({
      model: openai('gpt-4.1-nano-2025-04-14'), // Use configured model
      schema: StandardizedListSchema,
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

    consola.debug(
      'Raw AI Standardization Result:',
      standardizationResult
    );

    if (
      !standardizationResult ||
      !standardizationResult.standardizedItems
    ) {
      consola.error(
        'AI returned null or invalid structure for standardization.',
        standardizationResult
      );
      throw createError({
        statusCode: 500,
        statusMessage:
          'AI processing failed to return expected structure.',
      });
    }

    consola.success(
      `AI generated ${standardizationResult.standardizedItems.length} standardized items.`
    );

    const now = new Date();
    // Map the AI output to the full ShoppingListItem structure
    const standardizedShoppingListItems: ShoppingListItem[] =
      standardizationResult.standardizedItems.map((stdItem) => {
        // Validate category against the allowed list
        const isValidCategory =
          stdItem.category &&
          ingredientCategories.includes(
            stdItem.category as IngredientCategory
          );
        const category = isValidCategory
          ? (stdItem.category as IngredientCategory)
          : null;

        return {
          id: uuidv4(), // Generate a new ID for this item
          ingredientName: stdItem.ingredientName, // Use the AI standardized name
          standardizedName: standardizeName(stdItem.ingredientName),
          aggregatedQuantity: stdItem.quantity, // Use AI extracted quantity
          unit: stdItem.unit, // Use AI extracted/standardized unit
          category: category,
          isChecked: false,
          recipeIds: [], // No recipe associated with manually added items
          createdAt: now,
          updatedAt: now,
          priceInfo: [], // Initialize price info
          // Note: We could include stdItem.originalLine if needed for debugging/display
        };
      });

    return standardizedShoppingListItems;
  } catch (error: any) {
    if (error?.errors) {
      // Handle Zod validation errors
      consola.error(
        'Invalid request body for standardization:',
        error.errors
      );
      throw createError({
        statusCode: 400,
        statusMessage:
          'Invalid request body. Provide lines to standardize.',
        data: error.errors,
      });
    }
    // Handle other errors (AI errors, network issues, etc.)
    consola.error(
      'Error during AI shopping list standardization:',
      error
    );
    throw createError({
      statusCode: 500,
      statusMessage: 'Server error during item standardization.',
    });
  }
});
