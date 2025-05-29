import { defineEventHandler, readValidatedBody, createError } from 'h3';
import { z } from 'zod';
import { getServerContainer } from '~/src/container/server';
import { type ImportRecipeFromUrlDTO } from '~/src/application/use-cases/recipes/ImportRecipeFromUrl';

const inputSchema = z.object({
  url: z.string().url(),
  extractImages: z.boolean().optional(),
});

export default defineEventHandler(async (event) => {
  let body: ImportRecipeFromUrlDTO;

  try {
    body = await readValidatedBody(event, inputSchema.parse);
  } catch (validationError: any) {
    console.error('Invalid request body:', validationError.errors);
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input: ' + validationError.errors.map((e: any) => e.message).join(', '),
    });
  }

  try {
    const config = useRuntimeConfig();
    const { importRecipeFromUrl } = getServerContainer({
      openaiApiKey: config.openaiApiKey,
      firecrawlApiKey: config.firecrawlApiKey
    });
    
    console.log(`Importing recipe from URL: "${body.url}"`);
    
    const recipe = await importRecipeFromUrl.execute(body);
    
    console.log('Imported Recipe:', recipe);
    
    return { recipe };
  } catch (error: any) {
    console.error('Recipe import error:', error);
    
    if (error.message?.includes('Failed to scrape')) {
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to fetch recipe content: ${error.message}`,
      });
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to import recipe',
    });
  }
});