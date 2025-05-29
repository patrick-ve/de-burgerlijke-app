import { type Quantity } from './Quantity';

export class RecipeIngredient {
  constructor(
    public readonly name: string,
    public readonly quantity: Quantity,
    public readonly notes?: string
  ) {
    if (!name || name.trim().length === 0) {
      throw new Error('Ingredient must have a name');
    }
  }

  adjustQuantity(ratio: number): RecipeIngredient {
    return new RecipeIngredient(
      this.name,
      this.quantity.multiply(ratio),
      this.notes
    );
  }

  toString(): string {
    const parts = [this.quantity.toString(), this.name];
    if (this.notes) {
      parts.push(`(${this.notes})`);
    }
    return parts.join(' ');
  }
}