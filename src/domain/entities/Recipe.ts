import { type RecipeIngredient } from '../value-objects/RecipeIngredient';
import { type NutritionalInfo } from '../value-objects/NutritionalInfo';
import { Duration } from '../value-objects/Duration';

export class Recipe {
  constructor(
    public readonly id: string,
    public title: string,
    public description: string,
    public ingredients: RecipeIngredient[],
    public instructions: string[],
    public prepTime: Duration,
    public cookTime: Duration,
    public servings: number,
    public tags: string[],
    public imageUrl?: string,
    public sourceUrl?: string,
    public nutrition?: NutritionalInfo,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  get totalTime(): Duration {
    return new Duration(
      this.prepTime.minutes + this.cookTime.minutes
    );
  }

  validate(): void {
    if (!this.title || this.title.trim().length === 0) {
      throw new Error('Recipe must have a title');
    }

    if (!this.ingredients || this.ingredients.length === 0) {
      throw new Error('Recipe must have at least one ingredient');
    }

    if (!this.instructions || this.instructions.length === 0) {
      throw new Error('Recipe must have at least one instruction');
    }

    if (this.servings <= 0) {
      throw new Error('Recipe must have positive number of servings');
    }
  }

  updateServings(newServings: number): void {
    if (newServings <= 0) {
      throw new Error('Servings must be positive');
    }

    const ratio = newServings / this.servings;
    this.ingredients = this.ingredients.map((ingredient) =>
      ingredient.adjustQuantity(ratio)
    );
    this.servings = newServings;
    this.updatedAt = new Date();
  }

  addTag(tag: string): void {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
      this.updatedAt = new Date();
    }
  }

  removeTag(tag: string): void {
    this.tags = this.tags.filter((t) => t !== tag);
    this.updatedAt = new Date();
  }

  update(updates: Partial<Recipe>): void {
    Object.assign(this, updates);
    this.updatedAt = new Date();
    this.validate();
  }
}
