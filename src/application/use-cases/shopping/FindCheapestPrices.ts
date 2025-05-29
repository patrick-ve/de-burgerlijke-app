import { type IShoppingListRepository } from '../../../domain/interfaces/IShoppingListRepository';
import { type IPriceService } from '../../interfaces/IPriceService';
import { PriceCalculator } from '../../../domain/services/PriceCalculator';

export interface FindCheapestPricesDTO {
  listId?: string; // If not provided, use active list
}

export interface CheapestPricesResult {
  comparisons: Array<{
    supermarket: string;
    totalPrice: number;
    currency: string;
    availableItems: number;
    totalItems: number;
    missingItems: string[];
  }>;
  cheapest: {
    supermarket: string;
    totalPrice: number;
    currency: string;
    savings: number;
  };
}

export class FindCheapestPrices {
  constructor(
    private readonly shoppingListRepository: IShoppingListRepository,
    private readonly priceService: IPriceService,
    private readonly priceCalculator: PriceCalculator
  ) {}

  async execute(dto: FindCheapestPricesDTO): Promise<CheapestPricesResult> {
    // Get the shopping list
    let list;
    if (dto.listId) {
      list = await this.shoppingListRepository.findById(dto.listId);
      if (!list) {
        throw new Error(`Shopping list with id ${dto.listId} not found`);
      }
    } else {
      list = await this.shoppingListRepository.findActive();
      if (!list) {
        throw new Error('No active shopping list found');
      }
    }

    // Get price data
    const itemNames = list.items.map(item => item.name);
    const priceData = await this.priceService.getPricesForItems(itemNames);

    // Compare prices
    const comparisons = this.priceCalculator.compareListPrices(list, priceData);

    // Format results
    const formattedComparisons = comparisons.map(comp => ({
      supermarket: comp.supermarket,
      totalPrice: comp.totalPrice.amount,
      currency: comp.totalPrice.currency,
      availableItems: comp.items.filter(i => i.available).length,
      totalItems: comp.items.length,
      missingItems: comp.unavailableItems.map(i => i.name)
    }));

    const cheapest = formattedComparisons[0]; // Already sorted
    const mostExpensive = formattedComparisons[formattedComparisons.length - 1];
    
    return {
      comparisons: formattedComparisons,
      cheapest: {
        ...cheapest,
        savings: mostExpensive.totalPrice - cheapest.totalPrice
      }
    };
  }
}