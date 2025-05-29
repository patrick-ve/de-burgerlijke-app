import { defineEventHandler, readBody, createError } from 'h3';
import { getServerContainer } from '~/src/container/server';
import { type CleanUpShoppingListDTO } from '~/src/application/use-cases/shopping/CleanUpShoppingList';

export default defineEventHandler(async (event) => {
  const body = await readBody<{ 
    listId?: string;
    mergeStrategy?: 'sum' | 'max' | 'keep-separate';
  }>(event);

  try {
    const config = useRuntimeConfig();
    const { cleanUpShoppingList } = getServerContainer({
      openaiApiKey: config.openaiApiKey,
      firecrawlApiKey: config.firecrawlApiKey
    });

    const dto: CleanUpShoppingListDTO = {
      listId: body.listId,
      mergeStrategy: body.mergeStrategy
    };

    console.log('Cleaning up shopping list');
    
    const result = await cleanUpShoppingList.execute(dto);
    
    console.log(`Cleanup complete: ${result.itemsMerged} items merged, ${result.categoriesAssigned} categories assigned`);
    
    return result;
  } catch (error: any) {
    console.error('Error cleaning up shopping list:', error);
    
    if (error.message?.includes('not found')) {
      throw createError({
        statusCode: 404,
        statusMessage: error.message,
      });
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Server error during shopping list cleanup.',
    });
  }
});