import { z } from 'zod';
import OpenAI from 'openai';
import * as cheerio from 'cheerio';
import { recipeSchema } from '~/server/utils/recipeSchema';

// Input validation schema
const inputSchema = z
  .object({
    url: z.string().url(),
  })
  .describe('Schema voor het valideren van de recipe URL input');

// System prompt for recipe parsing
const SYSTEM_PROMPT = `You are an expert in analyzing Dutch recipes. Given a recipe URL, you will:
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
    // Parse and validate input
    const body = await readBody(event);
    const { url } = inputSchema.parse(body);

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: config.openaiApiKey,
    });

    // Fetch recipe content
    const recipeContent = await fetchRecipeContent(url);

    // Parse recipe with AI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Analyseer dit recept en formatteer het volgens het schema. Receptinhoud:\n${recipeContent}`,
        },
      ],
      temperature: 0.2, // Lower temperature for more consistent output
      response_format: { type: 'json_object' },
    });

    // Parse and validate AI response
    const rawRecipe = JSON.parse(
      completion.choices[0].message.content || '{}'
    );
    const recipe = recipeSchema.parse(rawRecipe);

    return recipe;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        message: 'Invalid input format',
        data: error.errors,
      });
    }

    console.error('Recipe parsing error:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to parse recipe',
    });
  }
});

// Helper function to fetch and parse recipe content
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

    // Get the main content
    const mainContent = $('body').text();

    // Clean up the text
    const cleanContent = mainContent
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
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
