export interface Ingredient {
  quantity: number | null; // Allow null for cases like "pinch of salt"
  unit: string | null;
  name: string;
  originalText?: string; // Original text before parsing
}

export interface Step {
  order: number;
  description: string;
  timerDuration?: number; // Duration in seconds
}

export interface Recipe {
  id: string; // Unique identifier
  userId?: string; // Link to user (if applicable, consider for later)
  householdId?: string; // Link to household (if applicable)
  title: string;
  description?: string;
  sourceUrl?: string;
  imageUrl?: string;
  portions: number;
  prepTime?: string; // e.g., "15 minutes"
  cookTime?: string; // e.g., "30 minutes"
  cuisineType?: string;
  ingredients: Ingredient[];
  steps: Step[];
  utensils?: string[];
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
} 