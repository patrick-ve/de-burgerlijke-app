import { Recipe } from '../../../domain/entities/Recipe';
import { type IRecipeRepository } from '../../../domain/interfaces/IRecipeRepository';
import { type CreateRecipeDTO } from '../../dto/CreateRecipeDTO';
import { RecipeIngredient } from '../../../domain/value-objects/RecipeIngredient';
import { Quantity } from '../../../domain/value-objects/Quantity';
import { Duration } from '../../../domain/value-objects/Duration';
import { NutritionalInfo } from '../../../domain/value-objects/NutritionalInfo';
import { createId } from '@paralleldrive/cuid2';

export class CreateRecipe {
  constructor(
    private readonly recipeRepository: IRecipeRepository
  ) {}

  async execute(dto: CreateRecipeDTO): Promise<Recipe> {
    const ingredients = dto.ingredients.map(ing => 
      new RecipeIngredient(
        ing.name,
        new Quantity(ing.amount, ing.unit),
        ing.notes
      )
    );

    const recipe = new Recipe(
      createId(),
      dto.title,
      dto.description,
      ingredients,
      dto.instructions,
      Duration.parse(dto.prepTime),
      Duration.parse(dto.cookTime),
      dto.servings,
      dto.tags || [],
      dto.imageUrl,
      dto.sourceUrl,
      dto.nutrition ? new NutritionalInfo(
        dto.nutrition.calories,
        dto.nutrition.protein,
        dto.nutrition.carbs,
        dto.nutrition.fat,
        dto.nutrition.fiber,
        dto.nutrition.sugar,
        dto.nutrition.sodium
      ) : undefined
    );

    recipe.validate();
    await this.recipeRepository.save(recipe);

    return recipe;
  }
}