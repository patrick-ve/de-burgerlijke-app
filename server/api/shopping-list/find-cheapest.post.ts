import { defineEventHandler, readBody, createError } from 'h3';
import { getServerContainer } from '~/src/container/server';
import { type FindCheapestPricesDTO } from '~/src/application/use-cases/shopping/FindCheapestPrices';

export default defineEventHandler(async (event) => {
  const body = await readBody<{ listId?: string }>(event);

  try {
    const config = useRuntimeConfig();
    const { findCheapestPrices } = getServerContainer({
      openaiApiKey: config.openaiApiKey,
      firecrawlApiKey: config.firecrawlApiKey
    });

    const dto: FindCheapestPricesDTO = {
      listId: body.listId
    };

    console.log('Finding cheapest prices for shopping list');
    
    const result = await findCheapestPrices.execute(dto);
    
    console.log(`Found price comparisons for ${result.comparisons.length} supermarkets`);
    
    return result;
  } catch (error: any) {
    console.error('Error finding cheapest prices:', error);
    
    if (error.message?.includes('not found')) {
      throw createError({
        statusCode: 404,
        statusMessage: error.message,
      });
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Server error finding cheapest prices.',
    });
  }
});