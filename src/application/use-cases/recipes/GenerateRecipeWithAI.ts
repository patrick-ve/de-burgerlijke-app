import { Recipe } from '../../../domain/entities/Recipe';
import { type IRecipeRepository } from '../../../domain/interfaces/IRecipeRepository';
import { type IAIService } from '../../interfaces/IAIService';
import { RecipeIngredient } from '../../../domain/value-objects/RecipeIngredient';
import { Quantity } from '../../../domain/value-objects/Quantity';
import { Duration } from '../../../domain/value-objects/Duration';
import { createId } from '@paralleldrive/cuid2';

export interface GenerateRecipeDTO {
  prompt: string;
  servings?: number;
  dietaryRestrictions?: string[];
  maxCookTime?: number;
}

export class GenerateRecipeWithAI {
  constructor(
    private readonly recipeRepository: IRecipeRepository,
    private readonly aiService: IAIService
  ) {}

  async execute(dto: GenerateRecipeDTO): Promise<Recipe> {
    const generatedData = await this.aiService.generateRecipe({
      prompt: dto.prompt,
      servings: dto.servings,
      dietaryRestrictions: dto.dietaryRestrictions,
      maxCookTime: dto.maxCookTime
    });

    const ingredients = generatedData.ingredients.map(ing => 
      new RecipeIngredient(
        ing.name,
        new Quantity(ing.amount, ing.unit),
        ing.notes
      )
    );

    const recipe = new Recipe(
      createId(),
      generatedData.title,
      generatedData.description,
      ingredients,
      generatedData.instructions,
      Duration.parse(generatedData.prepTime),
      Duration.parse(generatedData.cookTime),
      generatedData.servings,
      generatedData.tags || [],
      generatedData.imageUrl
    );

    recipe.validate();
    await this.recipeRepository.save(recipe);

    return recipe;
  }
}