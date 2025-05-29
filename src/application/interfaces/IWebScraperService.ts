export interface ScrapedRecipeData {
  title: string;
  description?: string;
  ingredients: string[];
  instructions: string[];
  prepTime?: string;
  cookTime?: string;
  servings?: number;
  tags?: string[];
  imageUrl?: string;
  nutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
}

export interface IWebScraperService {
  scrapeRecipe(url: string): Promise<ScrapedRecipeData>;
}