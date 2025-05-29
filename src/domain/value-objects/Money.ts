export type Currency = 'EUR' | 'USD' | 'GBP';

export class Money {
  constructor(
    public readonly amount: number,
    public readonly currency: Currency = 'EUR'
  ) {
    if (amount < 0) {
      throw new Error('Money amount cannot be negative');
    }
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot add money with different currencies');
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot subtract money with different currencies');
    }
    if (this.amount < other.amount) {
      throw new Error('Cannot subtract more than available amount');
    }
    return new Money(this.amount - other.amount, this.currency);
  }

  multiply(factor: number): Money {
    return new Money(this.amount * factor, this.currency);
  }

  toString(): string {
    const formatter = new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    return formatter.format(this.amount);
  }

  static fromCents(cents: number, currency: Currency = 'EUR'): Money {
    return new Money(cents / 100, currency);
  }

  toCents(): number {
    return Math.round(this.amount * 100);
  }
}