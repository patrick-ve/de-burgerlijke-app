import { Recipe } from '../../../domain/entities/Recipe';
import { type IRecipeRepository } from '../../../domain/interfaces/IRecipeRepository';
import { type IWebScraperService } from '../../interfaces/IWebScraperService';
import { RecipeIngredient } from '../../../domain/value-objects/RecipeIngredient';
import { Quantity } from '../../../domain/value-objects/Quantity';
import { Duration } from '../../../domain/value-objects/Duration';
import { NutritionalInfo } from '../../../domain/value-objects/NutritionalInfo';
import { createId } from '@paralleldrive/cuid2';

export interface ImportRecipeFromUrlDTO {
  url: string;
  extractImages?: boolean;
}

export class ImportRecipeFromUrl {
  constructor(
    private readonly recipeRepository: IRecipeRepository,
    private readonly webScraperService: IWebScraperService
  ) {}

  async execute(dto: ImportRecipeFromUrlDTO): Promise<Recipe> {
    const scrapedData = await this.webScraperService.scrapeRecipe(dto.url);

    const ingredients = scrapedData.ingredients.map(ing => {
      try {
        const quantity = Quantity.parse(ing);
        const name = ing.replace(/^\d+(?:\.\d+)?\s*\w*\s*/, '').trim();
        return new RecipeIngredient(name, quantity);
      } catch {
        // If parsing fails, create ingredient with amount 1
        return new RecipeIngredient(ing, new Quantity(1));
      }
    });

    const recipe = new Recipe(
      createId(),
      scrapedData.title,
      scrapedData.description || '',
      ingredients,
      scrapedData.instructions,
      Duration.parse(scrapedData.prepTime || '0'),
      Duration.parse(scrapedData.cookTime || '0'),
      scrapedData.servings || 4,
      scrapedData.tags || [],
      scrapedData.imageUrl,
      dto.url,
      scrapedData.nutrition ? new NutritionalInfo(
        scrapedData.nutrition.calories,
        scrapedData.nutrition.protein,
        scrapedData.nutrition.carbs,
        scrapedData.nutrition.fat,
        scrapedData.nutrition.fiber,
        scrapedData.nutrition.sugar,
        scrapedData.nutrition.sodium
      ) : undefined
    );

    recipe.validate();
    await this.recipeRepository.save(recipe);

    return recipe;
  }
}