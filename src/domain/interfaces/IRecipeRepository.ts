import { type Recipe } from '../entities/Recipe';

export interface IRecipeRepository {
  findAll(): Promise<Recipe[]>;
  findById(id: string): Promise<Recipe | null>;
  findByTags(tags: string[]): Promise<Recipe[]>;
  save(recipe: Recipe): Promise<void>;
  update(recipe: Recipe): Promise<void>;
  delete(id: string): Promise<void>;
  search(query: string): Promise<Recipe[]>;
}