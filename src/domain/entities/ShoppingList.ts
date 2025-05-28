import { type ShoppingItem } from './ShoppingItem';
import { type Money } from '../value-objects/Money';

export class ShoppingList {
  constructor(
    public readonly id: string,
    public name: string,
    public items: ShoppingItem[] = [],
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  addItem(item: ShoppingItem): void {
    const existingItem = this.items.find(i => 
      i.name.toLowerCase() === item.name.toLowerCase() && 
      i.category === item.category
    );

    if (existingItem) {
      existingItem.increaseQuantity(item.quantity);
    } else {
      this.items.push(item);
    }
    
    this.updatedAt = new Date();
  }

  removeItem(itemId: string): void {
    this.items = this.items.filter(item => item.id !== itemId);
    this.updatedAt = new Date();
  }

  toggleItemCompleted(itemId: string): void {
    const item = this.items.find(i => i.id === itemId);
    if (item) {
      item.toggleCompleted();
      this.updatedAt = new Date();
    }
  }

  clearCompleted(): void {
    this.items = this.items.filter(item => !item.completed);
    this.updatedAt = new Date();
  }

  get totalEstimatedCost(): Money | null {
    const itemsWithPrice = this.items.filter(item => item.estimatedPrice);
    if (itemsWithPrice.length === 0) return null;

    const total = itemsWithPrice.reduce((sum, item) => {
      return sum + (item.estimatedPrice?.amount || 0) * item.quantity;
    }, 0);

    return new Money(total, 'EUR');
  }

  get completedItemsCount(): number {
    return this.items.filter(item => item.completed).length;
  }

  get pendingItemsCount(): number {
    return this.items.filter(item => !item.completed).length;
  }

  get completionPercentage(): number {
    if (this.items.length === 0) return 0;
    return Math.round((this.completedItemsCount / this.items.length) * 100);
  }

  groupByCategory(): Map<string, ShoppingItem[]> {
    const grouped = new Map<string, ShoppingItem[]>();
    
    this.items.forEach(item => {
      const category = item.category || 'Overig';
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(item);
    });

    return grouped;
  }
}