import { defineEventHandler, readValidatedBody, createError } from 'h3';
import { z } from 'zod';
import { getServerContainer } from '~/src/container/server';
import { type GenerateRecipeDTO } from '~/src/application/use-cases/recipes/GenerateRecipeWithAI';

// Define the expected request body schema
const RequestBodySchema = z.object({
  prompt: z.string().min(1, 'Prompt cannot be empty'),
  servings: z.number().optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  maxCookTime: z.number().optional(),
});

export default defineEventHandler(async (event) => {
  let body: GenerateRecipeDTO;

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
    const config = useRuntimeConfig();
    const { generateRecipeWithAI } = getServerContainer({
      openaiApiKey: config.openaiApiKey,
      firecrawlApiKey: config.firecrawlApiKey
    });
    
    console.log(`Generating recipe for prompt: "${body.prompt}"`);
    
    const recipe = await generateRecipeWithAI.execute(body);
    
    console.log('Generated Recipe:', recipe);
    
    return { recipe };
  } catch (error: any) {
    console.error('Error during AI recipe generation:', error);

    let statusCode = 500;
    let statusMessage = 'Server error generating recipe.';

    if (error.message?.includes('quota')) {
      statusCode = 429;
      statusMessage = 'API quota exceeded.';
    } else if (error.message?.includes('validation')) {
      statusCode = 400;
      statusMessage = error.message;
    }

    throw createError({
      statusCode,
      statusMessage,
    });
  }
});