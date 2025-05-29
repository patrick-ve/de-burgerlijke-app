import { Money } from '../../domain/value-objects/Money';

export interface IPriceService {
  /**
   * Get prices for a list of items across different supermarkets
   * Returns a map of supermarket -> (item -> price)
   */
  getPricesForItems(items: string[]): Promise<Map<string, Map<string, Money>>>;
  
  /**
   * Get current prices for a specific item at all supermarkets
   */
  getPricesForItem(item: string): Promise<Map<string, Money>>;
  
  /**
   * Get price history for an item
   */
  getPriceHistory(item: string, days: number): Promise<Array<{
    date: Date;
    supermarket: string;
    price: Money;
  }>>;
}