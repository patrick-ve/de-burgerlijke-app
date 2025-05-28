export type Unit = 'g' | 'kg' | 'ml' | 'l' | 'tsp' | 'tbsp' | 'cup' | 'piece' | 'slice' | 'handful' | 'pinch' | 'to taste';

export class Quantity {
  constructor(
    public readonly amount: number,
    public readonly unit?: Unit
  ) {
    if (amount < 0) {
      throw new Error('Quantity amount cannot be negative');
    }
  }

  multiply(factor: number): Quantity {
    return new Quantity(this.amount * factor, this.unit);
  }

  toString(): string {
    if (!this.unit || this.unit === 'piece') {
      return this.amount.toString();
    }
    return `${this.amount} ${this.unit}`;
  }

  static parse(text: string): Quantity {
    const match = text.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
    if (!match) {
      throw new Error('Invalid quantity format');
    }

    const amount = parseFloat(match[1]);
    const unit = match[2] as Unit | undefined;

    return new Quantity(amount, unit);
  }
}