// Define the categories as a constant tuple (simplified list)
export const ingredientCategories = [
  'Fruit',
  'Vegetables',
  'Pasta & Rice',
  'Meals & Salads',
  'Deli & Cheese',
  'Meat & Fish',
  'Plant-Based',
  'Dairy & Eggs',
  'Bakery',
  'Breakfast & Spreads',
  'Sweets & Confectionery',
  'Snacks & Nuts',
  'Beverages',
  'Pantry',
  'Spices & Seasonings',
  'Nutrition',
  'Frozen',
  'Alcohol',
  'Oils',
  'Pharmacy',
  'Personal Care',
  'Baby & Child',
  'Household',
  'Pet',
  'Leisure',
  'Other',
] as const;

export const cuisineCategories = [
  'Nederlands',
  'Italiaans',
  'Frans',
  'Spaans',
  'Grieks',
  'Marokkaans',
  'Turks',
  'Libanees',
  'Mexicaans',
  'Indiaas',
  'Thais',
  'Vietnamees',
  'Chinees',
  'Japans',
  'Indonesisch',
  'Koreaans',
  'Surinaams',
  'Amerikaans',
  'Duits',
  'Brits',
  'Caribisch',
  'Zuid-Amerikaans',
  'West-Afrikaans',
  'Overig',
] as const;

// Define the type based on the tuple values
export type IngredientCategory =
  (typeof ingredientCategories)[number];

export interface Ingredient {
  id: string; // Or number, depending on DB schema
  quantity: number | null; // Allow null for ingredients without specific quantity
  unit: string | null;
  name: string;
  notes?: string | null;
  category?: IngredientCategory | null; // Use the single, simplified category type
}

export interface Step {
  id: string; // Or number
  description: string;
  order: number;
  timer?: number | null;
  isComplete?: boolean; // Added optional completion status
}

export interface Utensil {
  id: string; // Or number
  name: string;
}

export interface Recipe {
  id?: string | null; // Optional for new recipes
  title: string;
  description?: string | null;
  prepTime?: number | null;
  cookTime?: number | null;
  cuisine?: string | null;
  portions: number;
  ingredients: Ingredient[]; // This now uses the Ingredient interface with SimplifiedCategory
  steps: Step[];
  utensils?: Utensil[]; // Made optional and kept as Utensil[]
  isFavorite?: boolean;
  userId?: string | null;
  householdId?: string | null;
  sourceUrl?: string | null;
  youtubeUrl?: string | null;
  youtubeVideoId?: string | null; // Added for storing extracted ID
  imageUrl?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}
