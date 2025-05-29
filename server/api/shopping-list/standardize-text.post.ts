import { defineEventHandler, readValidatedBody, createError } from 'h3';
import { z } from 'zod';
import { getServerContainer } from '~/src/container/server';
import { type StandardizeShoppingTextDTO } from '~/src/application/use-cases/shopping/StandardizeShoppingText';

// Zod schema for the request body
const RequestBodySchema = z.object({
  lines: z.array(z.string().min(1)).min(1), // Expect at least one non-empty line
  language: z.string().optional().default('nl'),
});

export default defineEventHandler(async (event) => {
  let body: { lines: string[]; language: string };

  try {
    body = await readValidatedBody(event, RequestBodySchema.parse);
  } catch (validationError: any) {
    console.error('Invalid request body:', validationError.errors);
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid request body. Provide lines to standardize.',
      data: validationError.errors,
    });
  }

  try {
    const config = useRuntimeConfig();
    const { standardizeShoppingText } = getServerContainer({
      openaiApiKey: config.openaiApiKey,
      firecrawlApiKey: config.firecrawlApiKey
    });

    // Join lines into text for processing
    const text = body.lines.join('\n');
    
    const dto: StandardizeShoppingTextDTO = {
      text,
      language: body.language
    };

    console.log(`Standardizing ${body.lines.length} lines`);
    
    const standardizedItems = await standardizeShoppingText.execute(dto);
    
    // Convert to shopping items with IDs for response
    const shoppingItems = standardizeShoppingText.toShoppingItems(standardizedItems);
    
    console.log(`Generated ${shoppingItems.length} standardized items`);
    
    return shoppingItems.map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      completed: item.completed,
      notes: item.notes
    }));
  } catch (error: any) {
    console.error('Error during shopping list standardization:', error);
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Server error during item standardization.',
    });
  }
});