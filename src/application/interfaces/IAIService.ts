export interface GenerateRecipeInput {
  prompt: string;
  servings?: number;
  dietaryRestrictions?: string[];
  maxCookTime?: number;
}

export interface GeneratedRecipeData {
  title: string;
  description: string;
  ingredients: Array<{
    name: string;
    amount: number;
    unit?: string;
    notes?: string;
  }>;
  instructions: string[];
  prepTime: string;
  cookTime: string;
  servings: number;
  tags?: string[];
  imageUrl?: string;
}

export interface IAIService {
  generateRecipe(input: GenerateRecipeInput): Promise<GeneratedRecipeData>;
  generateRecipeImage(recipeTitle: string, description: string): Promise<string>;
}