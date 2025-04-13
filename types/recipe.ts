export interface Ingredient {
  id: string; // Or number, depending on DB schema
  quantity: number | null; // Allow null for ingredients without specific quantity
  unit: string | null;
  name: string;
  notes?: string | null;
}

export interface Step {
  id: string; // Or number
  description: string;
  order: number;
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
  ingredients: Ingredient[];
  steps: Step[];
  utensils: Utensil[]; // Changed from string[] to Utensil[]
  isFavorite?: boolean;
  userId?: string | null;
  householdId?: string | null;
  sourceUrl?: string | null;
  imageUrl?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
} 