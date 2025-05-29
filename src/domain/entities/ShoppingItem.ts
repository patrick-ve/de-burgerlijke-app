import { type Money } from '../value-objects/Money';

export type ItemCategory = 
  | 'Groente & Fruit'
  | 'Vlees & Vis'
  | 'Zuivel & Eieren'
  | 'Brood & Bakkerij'
  | 'Kruidenierswaren'
  | 'Diepvries'
  | 'Dranken'
  | 'Huishouden'
  | 'Verzorging'
  | 'Overig';

export class ShoppingItem {
  constructor(
    public readonly id: string,
    public name: string,
    public quantity: number = 1,
    public unit?: string,
    public category?: ItemCategory,
    public notes?: string,
    public completed: boolean = false,
    public estimatedPrice?: Money,
    public supermarket?: string
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Shopping item must have a name');
    }
    
    if (this.quantity <= 0) {
      throw new Error('Quantity must be positive');
    }
  }

  toggleCompleted(): void {
    this.completed = !this.completed;
  }

  increaseQuantity(amount: number = 1): void {
    this.quantity += amount;
    this.validate();
  }

  decreaseQuantity(amount: number = 1): void {
    this.quantity = Math.max(1, this.quantity - amount);
  }

  updatePrice(price: Money): void {
    this.estimatedPrice = price;
  }

  get totalPrice(): Money | null {
    if (!this.estimatedPrice) return null;
    return new Money(
      this.estimatedPrice.amount * this.quantity,
      this.estimatedPrice.currency
    );
  }

  toString(): string {
    const parts = [this.name];
    
    if (this.quantity > 1 || this.unit) {
      parts.unshift(`${this.quantity}${this.unit ? ` ${this.unit}` : 'x'}`);
    }
    
    if (this.notes) {
      parts.push(`(${this.notes})`);
    }
    
    return parts.join(' ');
  }
}