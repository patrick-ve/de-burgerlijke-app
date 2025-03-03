export interface Recipe {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  sourceUrl: string;
  ingredients: Ingredient[];
  instructions: string[];
  completedInstructions: number[]; // Array of indices of completed instructions
  prepTime: number; // in minutes
  cookTime: number; // in minutes
  servings: number;
  tags: string[];
  createdAt: number;
}

export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface GroceryList {
  id: string;
  name: string;
  items: GroceryItem[];
  createdAt: number;
}

export interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  checked: boolean;
  recipeId?: string; // optional reference to the recipe
}

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
}
