import { type ShoppingItem } from '../entities/ShoppingItem';
import { type ShoppingList } from '../entities/ShoppingList';
import { Money } from '../value-objects/Money';

export interface PriceComparison {
  supermarket: string;
  totalPrice: Money;
  items: Array<{
    item: ShoppingItem;
    price: Money;
    available: boolean;
  }>;
  unavailableItems: ShoppingItem[];
}

export class PriceCalculator {
  /**
   * Calculate the total price for a shopping list at different supermarkets
   */
  compareListPrices(
    list: ShoppingList,
    priceData: Map<string, Map<string, Money>>
  ): PriceComparison[] {
    const comparisons: PriceComparison[] = [];
    
    // For each supermarket
    for (const [supermarket, prices] of priceData) {
      let totalPrice = new Money(0);
      const itemPrices: Array<{
        item: ShoppingItem;
        price: Money;
        available: boolean;
      }> = [];
      const unavailableItems: ShoppingItem[] = [];
      
      // Calculate price for each item
      for (const item of list.items) {
        const itemKey = this.normalizeItemName(item.name);
        const price = prices.get(itemKey);
        
        if (price) {
          const totalItemPrice = price.multiply(item.quantity);
          totalPrice = totalPrice.add(totalItemPrice);
          itemPrices.push({
            item,
            price: price,
            available: true
          });
        } else {
          unavailableItems.push(item);
          itemPrices.push({
            item,
            price: new Money(0),
            available: false
          });
        }
      }
      
      comparisons.push({
        supermarket,
        totalPrice,
        items: itemPrices,
        unavailableItems
      });
    }
    
    // Sort by total price (cheapest first)
    return comparisons.sort((a, b) => a.totalPrice.amount - b.totalPrice.amount);
  }
  
  /**
   * Find the optimal combination of supermarkets to minimize total cost
   * This is a simplified version - in reality this could be a complex optimization problem
   */
  findOptimalCombination(
    list: ShoppingList,
    priceData: Map<string, Map<string, Money>>,
    maxSupermarkets: number = 2
  ): {
    totalPrice: Money;
    distribution: Map<string, ShoppingItem[]>;
  } {
    // For now, implement a simple greedy algorithm
    // In production, this could use more sophisticated algorithms
    
    const itemAssignments = new Map<string, string>(); // item -> supermarket
    let totalPrice = new Money(0);
    
    // For each item, find the cheapest supermarket
    for (const item of list.items) {
      const itemKey = this.normalizeItemName(item.name);
      let bestPrice: Money | null = null;
      let bestSupermarket: string | null = null;
      
      for (const [supermarket, prices] of priceData) {
        const price = prices.get(itemKey);
        if (price && (!bestPrice || price.amount < bestPrice.amount)) {
          bestPrice = price;
          bestSupermarket = supermarket;
        }
      }
      
      if (bestSupermarket && bestPrice) {
        itemAssignments.set(item.id, bestSupermarket);
        totalPrice = totalPrice.add(bestPrice.multiply(item.quantity));
      }
    }
    
    // Group items by supermarket
    const distribution = new Map<string, ShoppingItem[]>();
    for (const item of list.items) {
      const supermarket = itemAssignments.get(item.id);
      if (supermarket) {
        if (!distribution.has(supermarket)) {
          distribution.set(supermarket, []);
        }
        distribution.get(supermarket)!.push(item);
      }
    }
    
    return { totalPrice, distribution };
  }
  
  /**
   * Calculate potential savings by switching supermarkets
   */
  calculateSavings(
    currentList: ShoppingList,
    currentSupermarket: string,
    priceData: Map<string, Map<string, Money>>
  ): Map<string, Money> {
    const savings = new Map<string, Money>();
    const currentPrices = priceData.get(currentSupermarket);
    
    if (!currentPrices) {
      return savings;
    }
    
    // Calculate current total
    let currentTotal = new Money(0);
    for (const item of currentList.items) {
      const price = currentPrices.get(this.normalizeItemName(item.name));
      if (price) {
        currentTotal = currentTotal.add(price.multiply(item.quantity));
      }
    }
    
    // Calculate savings for each other supermarket
    for (const [supermarket, prices] of priceData) {
      if (supermarket === currentSupermarket) continue;
      
      let alternativeTotal = new Money(0);
      for (const item of currentList.items) {
        const price = prices.get(this.normalizeItemName(item.name));
        if (price) {
          alternativeTotal = alternativeTotal.add(price.multiply(item.quantity));
        }
      }
      
      if (alternativeTotal.amount < currentTotal.amount) {
        savings.set(supermarket, currentTotal.subtract(alternativeTotal));
      }
    }
    
    return savings;
  }
  
  /**
   * Normalize item names for price comparison
   */
  private normalizeItemName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '');
  }
}