import { type IShoppingListRepository } from '../../../domain/interfaces/IShoppingListRepository';
import { type IPriceService } from '../../interfaces/IPriceService';
import { PriceCalculator } from '../../../domain/services/PriceCalculator';
import { Money } from '../../../domain/value-objects/Money';

export interface OptimizeShoppingListDTO {
  listId?: string; // If not provided, use active list
  maxSupermarkets?: number;
}

export interface OptimizationResult {
  totalSavings: Money;
  originalPrice: Money;
  optimizedPrice: Money;
  recommendations: Array<{
    supermarket: string;
    items: string[];
    totalPrice: Money;
  }>;
}

export class OptimizeShoppingList {
  constructor(
    private readonly shoppingListRepository: IShoppingListRepository,
    private readonly priceService: IPriceService,
    private readonly priceCalculator: PriceCalculator
  ) {}

  async execute(dto: OptimizeShoppingListDTO): Promise<OptimizationResult> {
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

    // Get price data for all items
    const itemNames = list.items.map(item => item.name);
    const priceData = await this.priceService.getPricesForItems(itemNames);

    // Calculate optimal distribution
    const optimization = this.priceCalculator.findOptimalCombination(
      list,
      priceData,
      dto.maxSupermarkets || 2
    );

    // Calculate original price (if all items bought at one supermarket)
    const comparisons = this.priceCalculator.compareListPrices(list, priceData);
    const cheapestSingle = comparisons[0]; // Already sorted by price

    // Build recommendations
    const recommendations = Array.from(optimization.distribution.entries()).map(
      ([supermarket, items]) => {
        const supermarketPrices = priceData.get(supermarket)!;
        let totalPrice = new Money(0);
        
        for (const item of items) {
          const price = supermarketPrices.get(item.name);
          if (price) {
            totalPrice = totalPrice.add(price.multiply(item.quantity));
          }
        }
        
        return {
          supermarket,
          items: items.map(i => i.name),
          totalPrice
        };
      }
    );

    return {
      totalSavings: cheapestSingle.totalPrice.subtract(optimization.totalPrice),
      originalPrice: cheapestSingle.totalPrice,
      optimizedPrice: optimization.totalPrice,
      recommendations
    };
  }
}