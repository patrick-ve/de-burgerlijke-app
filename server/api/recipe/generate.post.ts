import {
  defineEventHandler,
  readValidatedBody,
  createError,
} from 'h3';
import { z } from 'zod';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import {
  recipeSchema,
  type AIRecipeDTO,
} from '~/server/utils/recipeSchema';
import { ingredientCategories } from '~/types/recipe';

// Define the expected request body schema
const RequestBodySchema = z.object({
  prompt: z.string().min(1, 'Prompt cannot be empty'),
});

// Function to generate the system prompt dynamically
function createSystemPrompt(): string {
  const categoryList = ingredientCategories.join(', '); // Use RENAMED (simplified) list

  return `
You are an expert AI assistant tasked with generating recipes based on user descriptions.
You must:

1. Create a plausible recipe based on the user's prompt.
2. Structure the output strictly according to the specified schema.
3. Provide estimated prepTime, cookTime, and portions appropriate for the recipe.
4. Use Dutch standard units (ml, l, el, tl, kop, g, kg, stuk, teen, snuf, mespunt, plak, bol, takje, blaadje, scheut, handvol). Allow null for unit if not applicable.
5. Ensure all numeric values are actual numbers (or null where allowed).
6. Translate all descriptive text (title, description, ingredient names, steps) to Dutch.
7. Whenever a step involves waiting or cooking for a specific duration (e.g., baking, simmering, resting), include a timer in milliseconds in the 'timer' property of that step. 1 minute = 60000 milliseconds.
8. For each ingredient, assign the most fitting category from this list: ${categoryList}. If unsure, use 'Other' or null.
9. Omit the word "Recept" or "Recipe" from the title.
10. Do not include sourceUrl or youtubeUrl unless specifically requested or implied in the prompt.

Respond ONLY with a valid JSON object that matches the provided TypeScript interface.
`;
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  let body;

  if (!config.openaiApiKey) {
    console.error('OpenAI API key is not configured.');
    throw createError({
      statusCode: 500,
      statusMessage: 'Server configuration error.',
    });
  }

  try {
    body = await readValidatedBody(event, RequestBodySchema.parse);
  } catch (validationError: any) {
    console.error('Invalid request body:', validationError.errors);
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid request body.',
      data: validationError.errors,
    });
  }

  try {
    // Create the system prompt
    const systemPrompt = createSystemPrompt();

    console.log(`Generating recipe for prompt: "${body.prompt}"`);

    // Generate the recipe using the AI SDK
    const { object: generatedRecipe } = await generateObject({
      model: openai('gpt-4.1-nano-2025-04-14'), // Or your preferred model
      schema: recipeSchema,
      prompt: `System Instructions:\n${systemPrompt}\n\nUser Request:\n${body.prompt}`,
    });

    console.log('Generated Recipe:', generatedRecipe);

    // The generateObject function already validates against the schema
    return { recipe: generatedRecipe as AIRecipeDTO }; // Cast for type consistency if needed
  } catch (error: any) {
    console.error('Error during AI recipe generation:', error);

    // Handle potential AI SDK errors or other issues
    let statusCode = 500;
    let statusMessage = 'Server error generating recipe.';

    // Check for specific AI SDK error structures if available
    // (Example, adjust based on actual error details)
    if (error.code === 'insufficient_quota') {
      statusCode = 429;
      statusMessage = 'API quota exceeded.';
    } else if (error.status === 400) {
      statusCode = 400;
      statusMessage = 'Bad request to AI service.';
    }

    throw createError({
      statusCode,
      statusMessage,
    });
  }
});
