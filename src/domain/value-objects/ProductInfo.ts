import { Money } from './Money';

export class ProductInfo {
  constructor(
    public readonly name: string,
    public readonly brand?: string,
    public readonly barcode?: string,
    public readonly imageUrl?: string,
    public readonly description?: string
  ) {
    if (!name || name.trim().length === 0) {
      throw new Error('Product must have a name');
    }
  }

  matches(query: string): boolean {
    const searchTerms = query.toLowerCase().split(' ');
    const productText = `${this.name} ${this.brand || ''} ${this.description || ''}`.toLowerCase();
    
    return searchTerms.every(term => productText.includes(term));
  }

  toString(): string {
    return this.brand ? `${this.brand} ${this.name}` : this.name;
  }
}