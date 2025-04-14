import { z } from 'zod';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import * as cheerio from 'cheerio';
import { recipeSchema } from '~/server/utils/recipeSchema';

const inputSchema = z
  .object({
    url: z.string().url(),
  })
  .describe('Schema for validating the recipe URL input');

const SYSTEM_PROMPT = `You are an expert in analyzing recipes. Given a recipe URL, you will:
1. Extract the recipe content
2. Structure it according to the specified format
3. Convert measurements to Dutch standard units
4. Ensure all numeric values are actual numbers

Keep the response concise and clear.
Use Dutch measurement units (ml, l, el, tl, kop, g, kg, stuk, teen, snuf, mespunt, plak, bol, takje, blaadje, scheut, handvol). Allow null for unit if not applicable.

Whenever a step from the recipe requires setting a timer, make sure to include the timer in the response.

Respond with a valid JSON object that matches this TypeScript interface:

interface Recipe {
  // Title of the recipe
  title: string

  // Optional description of the recipe (can be null)
  description?: string | null

  // List of ingredients
  ingredients: Array<{
    // Amount of the ingredient (positive number or null)
    quantity: number | null
    // Unit of measurement for the ingredient (can be null)
    // Examples:
    // - Volume: "ml" (milliliter), "l" (liter), "el" (eetlepel), "tl" (theelepel), "kop"
    // - Weight: "g" (gram), "kg" (kilogram)
    // - Count: "stuk", "teen", "plak", "bol"
    // - Approximate: "snuf", "mespunt", "takje", "blaadje", "scheut", "handvol"
    // - null when no unit applies
    unit: string | null 
    // Name of the ingredient
    name: string
    // Optional notes for the ingredient (can be null)
    notes?: string | null
  }>

  // List of preparation steps.
  steps: Array<{
    // Sequence number of the preparation step
    order: number
    // Description of the preparation step
    description: string
    // Timer in milliseconds for this step (can be null). Indicates when the user should do things like stirring, mixing, cooking pasta, etc. 
    // When a step describes a step that is expressed in minutes, convert it to milliseconds.
    timer?: number | null
  }>

  // Optional preparation time in minutes (can be null)
  prepTime?: number | null

  // Optional cooking time in minutes (can be null)
  cookTime?: number | null

  // Type of cuisine (e.g., Dutch, Italian) (can be null)
  cuisine?: string | null

  // Number of portions this recipe yields (must be a positive number)
  portions: number

  // Optional source URL of the recipe (can be null)
  sourceUrl?: string | null

  // Optional YouTube URL for the recipe (can be null)
  youtubeUrl?: string | null

  // Optional image URL for the recipe (can be null)
  imageUrl?: string | null
}
`;

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  try {
    const body = await readBody(event);
    const { url } = inputSchema.parse(body);

    const recipeContent = await fetchRecipeContent(url);
    console.log(recipeContent);

    const { object: recipe } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: recipeSchema,
      prompt: `${SYSTEM_PROMPT}\n\nRecipe content:\n${recipeContent}`,
    });

    console.log(recipe);
    return {
      recipe,
    };
  } catch (error) {
    console.error('Recipe parsing error:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to parse recipe',
    });
  }
});

async function fetchRecipeContent(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove unnecessary elements
    $('script').remove();
    $('style').remove();
    $('noscript').remove();
    $('iframe').remove();

    const mainContent = $('body').text();

    const cleanContent = mainContent
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();

    return cleanContent;
  } catch (error) {
    console.error('Error fetching recipe:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch recipe content',
    });
  }
}
