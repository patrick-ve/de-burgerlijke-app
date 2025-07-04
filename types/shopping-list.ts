import type { IngredientCategory } from './recipe';

export interface Supermarket {
  id: string; // Unique identifier
  name: 'Albert Heijn' | 'Jumbo' | 'Aldi' | 'Other';
  url: string; // e.g., 'https://www.ah.nl', 'https://www.jumbo.nl'
}

export interface PriceInfo {
  supermarket: Supermarket;
  productId?: string; // Supermarket-specific product ID
  price: number; // Price in cents or smallest currency unit
  unitSize?: string; // e.g., "500g", "1L"
  lastUpdated: Date;
}

export interface ShoppingListItem {
  id: string; // Unique ID for this list item instance
  ingredientName: string; // Name from the recipe
  standardizedName?: string; // Standardized name for price matching
  aggregatedQuantity: number | null;
  unit: string | null;
  category?: IngredientCategory | null;
  isChecked: boolean;
  priceInfo?: PriceInfo[]; // Array of prices from different stores
  recipeIds: string[]; // IDs of recipes contributing to this item
  createdAt: Date;
  updatedAt: Date;
  // Add fields for cheapest product display
  cheapestPrice?: number;
  cheapestSupermarket?: string;
  cheapestAmount?: string | null;
}

// --- Add Product interface definition ---
export interface Product {
  id: string;
  name: string;
  price: number;
  amount: string | null;
  distance?: number; // Optional distance/similarity score
  standardized_price_per_unit?: number | null;
  standardized_unit?: string | null;
  supermarketName: string;
}
// --- End Product interface ---

export interface ShoppingList {
  id: string; // Unique identifier
  userId?: string;
  householdId?: string;
  startDate: Date;
  endDate: Date;
  items: ShoppingListItem[];
  status: 'active' | 'completed' | 'archived'; // Example statuses
  createdAt: Date;
  updatedAt: Date;
}
