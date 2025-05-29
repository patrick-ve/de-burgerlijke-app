import { type IRecipeRepository } from '../../../domain/interfaces/IRecipeRepository';
import { type Recipe } from '../../../domain/entities/Recipe';

export interface UpdateRecipeDTO {
  id: string;
  title?: string;
  description?: string;
  instructions?: string[];
  tags?: string[];
  imageUrl?: string;
}

export class UpdateRecipe {
  constructor(
    private readonly recipeRepository: IRecipeRepository
  ) {}

  async execute(dto: UpdateRecipeDTO): Promise<Recipe> {
    const recipe = await this.recipeRepository.findById(dto.id);
    
    if (!recipe) {
      throw new Error(`Recipe with id ${dto.id} not found`);
    }

    recipe.update({
      title: dto.title,
      description: dto.description,
      instructions: dto.instructions,
      tags: dto.tags,
      imageUrl: dto.imageUrl
    });

    await this.recipeRepository.update(recipe);
    return recipe;
  }
}