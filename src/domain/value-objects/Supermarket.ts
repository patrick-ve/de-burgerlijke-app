export class Supermarket {
  constructor(
    public readonly name: string,
    public readonly logo?: string,
    public readonly color?: string
  ) {
    if (!name || name.trim().length === 0) {
      throw new Error('Supermarket must have a name');
    }
  }

  equals(other: Supermarket): boolean {
    return this.name === other.name;
  }

  toString(): string {
    return this.name;
  }
}

// Common Dutch supermarkets
export const SUPERMARKETS = {
  ALBERT_HEIJN: new Supermarket('Albert Heijn', '🛒', '#00A0E2'),
  JUMBO: new Supermarket('Jumbo', '🛒', '#FDB813'),
  LIDL: new Supermarket('Lidl', '🛒', '#0050AA'),
  ALDI: new Supermarket('Aldi', '🛒', '#00529B'),
  PLUS: new Supermarket('Plus', '🛒', '#ED1C24'),
  COOP: new Supermarket('Coop', '🛒', '#00A859'),
  DIRK: new Supermarket('Dirk', '🛒', '#E30613'),
  VOMAR: new Supermarket('Vomar', '🛒', '#FF6900'),
  DEEN: new Supermarket('Deen', '🛒', '#009639'),
  SPAR: new Supermarket('Spar', '🛒', '#00A960'),
} as const;