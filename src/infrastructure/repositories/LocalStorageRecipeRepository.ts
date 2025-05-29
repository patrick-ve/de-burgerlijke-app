import { Recipe } from '../../domain/entities/Recipe';
import { type IRecipeRepository } from '../../domain/interfaces/IRecipeRepository';
import { RecipeIngredient } from '../../domain/value-objects/RecipeIngredient';
import { Quantity } from '../../domain/value-objects/Quantity';
import { Duration } from '../../domain/value-objects/Duration';
import { NutritionalInfo } from '../../domain/value-objects/NutritionalInfo';

interface StoredRecipe {
  id: string;
  title: string;
  description: string;
  ingredients: Array<{
    name: string;
    amount: number;
    unit?: string;
    notes?: string;
  }>;
  instructions: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  tags: string[];
  imageUrl?: string;
  sourceUrl?: string;
  nutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export class LocalStorageRecipeRepository implements IRecipeRepository {
  private readonly STORAGE_KEY = 'recipes';

  private getStoredRecipes(): StoredRecipe[] {
    if (typeof window === 'undefined') return [];
    
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private saveStoredRecipes(recipes: StoredRecipe[]): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recipes));
  }

  private toDomain(stored: StoredRecipe): Recipe {
    const ingredients = stored.ingredients.map(ing =>
      new RecipeIngredient(
        ing.name,
        new Quantity(ing.amount, ing.unit as any),
        ing.notes
      )
    );

    const nutrition = stored.nutrition
      ? new NutritionalInfo(
          stored.nutrition.calories,
          stored.nutrition.protein,
          stored.nutrition.carbs,
          stored.nutrition.fat,
          stored.nutrition.fiber,
          stored.nutrition.sugar,
          stored.nutrition.sodium
        )
      : undefined;

    return new Recipe(
      stored.id,
      stored.title,
      stored.description,
      ingredients,
      stored.instructions,
      new Duration(stored.prepTime),
      new Duration(stored.cookTime),
      stored.servings,
      stored.tags,
      stored.imageUrl,
      stored.sourceUrl,
      nutrition,
      new Date(stored.createdAt),
      new Date(stored.updatedAt)
    );
  }

  private toStored(recipe: Recipe): StoredRecipe {
    return {
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      ingredients: recipe.ingredients.map(ing => ({
        name: ing.name,
        amount: ing.quantity.amount,
        unit: ing.quantity.unit,
        notes: ing.notes
      })),
      instructions: recipe.instructions,
      prepTime: recipe.prepTime.minutes,
      cookTime: recipe.cookTime.minutes,
      servings: recipe.servings,
      tags: recipe.tags,
      imageUrl: recipe.imageUrl,
      sourceUrl: recipe.sourceUrl,
      nutrition: recipe.nutrition ? {
        calories: recipe.nutrition.calories,
        protein: recipe.nutrition.protein,
        carbs: recipe.nutrition.carbs,
        fat: recipe.nutrition.fat,
        fiber: recipe.nutrition.fiber,
        sugar: recipe.nutrition.sugar,
        sodium: recipe.nutrition.sodium
      } : undefined,
      createdAt: recipe.createdAt.toISOString(),
      updatedAt: recipe.updatedAt.toISOString()
    };
  }

  async findAll(): Promise<Recipe[]> {
    const stored = this.getStoredRecipes();
    return stored.map(s => this.toDomain(s));
  }

  async findById(id: string): Promise<Recipe | null> {
    const stored = this.getStoredRecipes();
    const found = stored.find(r => r.id === id);
    return found ? this.toDomain(found) : null;
  }

  async findByTags(tags: string[]): Promise<Recipe[]> {
    const stored = this.getStoredRecipes();
    const filtered = stored.filter(r => 
      tags.some(tag => r.tags.includes(tag))
    );
    return filtered.map(s => this.toDomain(s));
  }

  async save(recipe: Recipe): Promise<void> {
    const stored = this.getStoredRecipes();
    stored.push(this.toStored(recipe));
    this.saveStoredRecipes(stored);
  }

  async update(recipe: Recipe): Promise<void> {
    const stored = this.getStoredRecipes();
    const index = stored.findIndex(r => r.id === recipe.id);
    
    if (index === -1) {
      throw new Error(`Recipe with id ${recipe.id} not found`);
    }
    
    stored[index] = this.toStored(recipe);
    this.saveStoredRecipes(stored);
  }

  async delete(id: string): Promise<void> {
    const stored = this.getStoredRecipes();
    const filtered = stored.filter(r => r.id !== id);
    this.saveStoredRecipes(filtered);
  }

  async search(query: string): Promise<Recipe[]> {
    const stored = this.getStoredRecipes();
    const lowercaseQuery = query.toLowerCase();
    
    const filtered = stored.filter(r => 
      r.title.toLowerCase().includes(lowercaseQuery) ||
      r.description.toLowerCase().includes(lowercaseQuery) ||
      r.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
      r.ingredients.some(ing => ing.name.toLowerCase().includes(lowercaseQuery))
    );
    
    return filtered.map(s => this.toDomain(s));
  }
}