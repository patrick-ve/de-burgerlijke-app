import { type IPriceService } from '../../application/interfaces/IPriceService';
import { Money } from '../../domain/value-objects/Money';

export class MockPriceService implements IPriceService {
  private priceData: Map<string, Map<string, number>> = new Map([
    ['Albert Heijn', new Map([
      ['melk', 1.29],
      ['brood', 2.49],
      ['kaas', 4.99],
      ['eieren', 2.79],
      ['appels', 1.99],
      ['kip', 6.99],
      ['pasta', 1.89],
      ['tomaten', 2.49],
      ['ui', 0.99],
      ['aardappelen', 1.49]
    ])],
    ['Jumbo', new Map([
      ['melk', 1.19],
      ['brood', 2.29],
      ['kaas', 4.79],
      ['eieren', 2.59],
      ['appels', 1.79],
      ['kip', 6.49],
      ['pasta', 1.69],
      ['tomaten', 2.29],
      ['ui', 0.89],
      ['aardappelen', 1.39]
    ])],
    ['Lidl', new Map([
      ['melk', 0.99],
      ['brood', 1.99],
      ['kaas', 3.99],
      ['eieren', 1.99],
      ['appels', 1.49],
      ['kip', 5.99],
      ['pasta', 1.29],
      ['tomaten', 1.99],
      ['ui', 0.69],
      ['aardappelen', 0.99]
    ])]
  ]);

  async getPricesForItems(items: string[]): Promise<Map<string, Map<string, Money>>> {
    const result = new Map<string, Map<string, Money>>();
    
    for (const [supermarket, prices] of this.priceData) {
      const supermarketPrices = new Map<string, Money>();
      
      for (const item of items) {
        const normalizedItem = this.normalizeItemName(item);
        
        // Try to find a price for this item
        for (const [product, price] of prices) {
          if (this.itemMatches(normalizedItem, product)) {
            supermarketPrices.set(normalizedItem, new Money(price, 'EUR'));
            break;
          }
        }
      }
      
      result.set(supermarket, supermarketPrices);
    }
    
    return result;
  }

  async getPricesForItem(item: string): Promise<Map<string, Money>> {
    const result = new Map<string, Money>();
    const normalizedItem = this.normalizeItemName(item);
    
    for (const [supermarket, prices] of this.priceData) {
      for (const [product, price] of prices) {
        if (this.itemMatches(normalizedItem, product)) {
          result.set(supermarket, new Money(price, 'EUR'));
          break;
        }
      }
    }
    
    return result;
  }

  async getPriceHistory(item: string, days: number): Promise<Array<{
    date: Date;
    supermarket: string;
    price: Money;
  }>> {
    // Mock implementation - generate fake historical data
    const history: Array<{
      date: Date;
      supermarket: string;
      price: Money;
    }> = [];
    
    const currentPrices = await this.getPricesForItem(item);
    
    for (const [supermarket, currentPrice] of currentPrices) {
      // Generate daily prices for the last N days
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        // Add some random variation to simulate price changes
        const variation = (Math.random() - 0.5) * 0.2; // +/- 10%
        const historicalPrice = currentPrice.amount * (1 + variation);
        
        history.push({
          date,
          supermarket,
          price: new Money(Math.max(0.01, historicalPrice), 'EUR')
        });
      }
    }
    
    // Sort by date descending
    return history.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  private normalizeItemName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '');
  }

  private itemMatches(searchItem: string, productName: string): boolean {
    const searchTerms = searchItem.split(' ');
    const productLower = productName.toLowerCase();
    
    // Check if all search terms are found in the product name
    return searchTerms.every(term => productLower.includes(term));
  }
}