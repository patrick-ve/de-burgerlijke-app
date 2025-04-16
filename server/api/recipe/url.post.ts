import { z } from 'zod';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import FirecrawlApp, {
  type ScrapeResponse,
  type FirecrawlDocumentMetadata,
} from '@mendable/firecrawl-js';
import { recipeSchema } from '~/server/utils/recipeSchema';
import { ingredientCategories } from '~/types/recipe'; // Import the RENAMED (simplified) categories

const inputSchema = z
  .object({
    url: z.string().url(),
  })
  .describe('Schema for validating the recipe URL input');

// Function to generate the system prompt dynamically
function createSystemPrompt(
  ogTitle?: string | null,
  ogVideo?: string | null
): string {
  const categoryList = ingredientCategories.join(', '); // Use RENAMED (simplified) list

  let prompt = `
You are an expert in analyzing recipes. You are given a markdown representation of a cooking website containing a recipe, including its metadata.
You must: 

1. Extract the recipe content according to the specified schema.
2. Structure it according to the specified schema.
3. Convert measurements to Dutch standard units.
4. Ensure all numeric values are actual numbers.
5. Translate all values of the schema to Dutch.
6. Use Dutch measurement units (ml, l, el, tl, kop, g, kg, stuk, teen, snuf, mespunt, plak, bol, takje, blaadje, scheut, handvol). Allow null for unit if not applicable.
7. Whenever a step from the recipe requires setting a timer (for example, cooking pasta), 
  make sure to include the timer in the response. This is the timer property in the schema. Ensure that the timer is in milliseconds, i.e. 1 minute = 60000 milliseconds.
8. For each ingredient, assign a category from the following list: ${categoryList}. If no specific category fits, use 'Other'. Set the category field to null if it cannot be determined.`;

  if (ogTitle) {
    prompt += `\n9. The metadata suggests the title might be "${ogTitle}". Consider using this as the primary source for the recipe's 'title'.`;
  } else {
    prompt += `\n9. Extract the recipe's 'title' from the main content.`;
  }

  if (ogVideo) {
    prompt += `\n10. The metadata includes a video URL: "${ogVideo}". Use this for the 'youtubeUrl' field if it's a valid video related to the recipe.`;
  } else {
    prompt += `\n10. Check the content for any YouTube video links to use for the 'youtubeUrl' field.`;
  }

  prompt += `

Keep the response concise and clear.

Respond with a valid JSON object that matches this TypeScript interface:

interface Recipe {
  // Title of the recipe, omit the word "Recept" or "Recipe" in this field.
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
    // Category of the ingredient (must be one of: ${categoryList}, or null)
    category?: string | null 
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
  return prompt;
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  try {
    const body = await readBody(event);
    const { url } = inputSchema.parse(body);

    const recipeContent = await fetchRecipeContent(
      url,
      config.firecrawlApiKey
    );

    console.log('Recipe Content:', recipeContent);

    // Safely extract metadata properties
    const metadata = recipeContent.metadata as
      | FirecrawlDocumentMetadata
      | undefined;
    const ogTitle = metadata?.ogTitle;
    const ogVideo = metadata?.ogVideo; // Assuming ogVideo maps to youtubeUrl

    // Generate the prompt dynamically
    const systemPrompt = createSystemPrompt(ogTitle, ogVideo);

    const { object: recipe } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: recipeSchema,
      prompt: `${systemPrompt}\n\nRecipe content (Markdown):\n${recipeContent.markdown}`, // Pass only markdown now
    });

    console.log('Generated Recipe:', recipe);

    // Optionally enrich the recipe object with metadata if not picked up by AI
    if (!recipe.title && ogTitle) {
      recipe.title = ogTitle;
    }
    if (!recipe.youtubeUrl && ogVideo) {
      recipe.youtubeUrl = ogVideo;
    }
    if (!recipe.sourceUrl) {
      recipe.sourceUrl = url; // Add source url if not present
    }
    if (!recipe.imageUrl && metadata?.ogImage) {
      recipe.imageUrl = metadata.ogImage; // Use ogImage for imageUrl
    }

    return {
      recipe,
    };
  } catch (error) {
    console.error('Recipe parsing error:', error);
    if (
      error instanceof Error &&
      error.message.startsWith('Failed to scrape')
    ) {
      throw createError({
        statusCode: 500,
        message: `Failed to fetch recipe content from Firecrawl: ${error.message}`,
      });
    }
    // Handle potential Zod validation errors
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        message: `Invalid input: ${error.errors.map((e) => e.message).join(', ')}`,
      });
    }
    throw createError({
      statusCode: 500,
      message: 'Failed to parse recipe',
    });
  }
});

async function fetchRecipeContent(
  url: string,
  apiKey: string
): Promise<ScrapeResponse> {
  if (!apiKey) {
    throw createError({
      statusCode: 500,
      message: 'A server error occured.',
    });
  }

  const app = new FirecrawlApp({ apiKey });

  try {
    // Fetch all available data, including metadata
    const scrapeResult = (await app.scrapeUrl(url, {
      formats: ['markdown'],
    })) as ScrapeResponse;

    if (!scrapeResult.success || !scrapeResult.markdown) {
      // Ensure markdown is present
      const errorMessage =
        scrapeResult.error || 'Markdown content missing';
      throw new Error(`Failed to scrape: ${errorMessage}`);
    }

    return scrapeResult;
  } catch (error) {
    console.error('Error fetching recipe with Firecrawl:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(
        'An unknown error occurred during recipe fetching.'
      );
    }
  }
}
