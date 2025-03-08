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
Use Dutch measurement units (ml, l, el, tl, kop, g, kg, stuk, teen, snuf, mespunt).

Respond with a valid JSON object that matches this TypeScript interface:

interface Recipe {
  // Title of the recipe
  title: string
  
  // Optional description of the recipe
  description?: string
  
  // List of ingredients
  ingredients: Array<{
    // Amount of the ingredient (positive number)
    amount: number
    // Unit of measurement for the ingredient
    unit: "ml" | "l" | "el" | "tl" | "kop" | "g" | "kg" | "stuk" | "teen" | "snuf" | "mespunt"
    // Name of the ingredient
    name: string
  }>
  
  // List of preparation steps
  instructions: Array<{
    // Sequence number of the preparation step
    step: number
    // Description of the preparation step
    text: string
    // Optional timer in minutes for this step
    timer?: number
  }>
  
  // Metadata about the recipe
  metadata: {
    // Number of servings this recipe yields
    servings: number
    // Total cooking time in minutes
    cookingTime: number
    // Type of cuisine (for example: Dutch, Italian)
    cuisine: string
  }
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

    return recipe;
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
