import { type Unit } from '../../domain/value-objects/Quantity';

export interface CreateRecipeIngredientDTO {
  name: string;
  amount: number;
  unit?: Unit;
  notes?: string;
}

export interface CreateRecipeNutritionDTO {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface CreateRecipeDTO {
  title: string;
  description: string;
  ingredients: CreateRecipeIngredientDTO[];
  instructions: string[];
  prepTime: string; // e.g., "30min", "1h 15min"
  cookTime: string;
  servings: number;
  tags?: string[];
  imageUrl?: string;
  sourceUrl?: string;
  nutrition?: CreateRecipeNutritionDTO;
}