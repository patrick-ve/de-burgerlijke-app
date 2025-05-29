import { type IRecipeRepository } from '../../../domain/interfaces/IRecipeRepository';

export class DeleteRecipe {
  constructor(
    private readonly recipeRepository: IRecipeRepository
  ) {}

  async execute(id: string): Promise<void> {
    const recipe = await this.recipeRepository.findById(id);
    
    if (!recipe) {
      throw new Error(`Recipe with id ${id} not found`);
    }

    await this.recipeRepository.delete(id);
  }
}