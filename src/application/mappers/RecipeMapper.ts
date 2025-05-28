import { Recipe as DomainRecipe } from '../../domain/entities/Recipe';
import { RecipeIngredient } from '../../domain/value-objects/RecipeIngredient';
import { Duration } from '../../domain/value-objects/Duration';
import { NutritionalInfo } from '../../domain/value-objects/NutritionalInfo';
import { Quantity } from '../../domain/value-objects/Quantity';
import type { Recipe as UIRecipe, Ingredient } from '../../../types/recipe';

export class RecipeMapper {
  static toDomain(uiRecipe: UIRecipe): DomainRecipe {
    const ingredients = uiRecipe.ingredients.map(ing => 
      new RecipeIngredient(
        ing.name,
        new Quantity(ing.quantity || 0, ing.unit as any || undefined),
        ing.notes || undefined
      )
    );

    const prepTime = new Duration(uiRecipe.prepTime || 0);
    const cookTime = new Duration(uiRecipe.cookTime || 0);

    const nutrition: NutritionalInfo | undefined = undefined;

    return new DomainRecipe(
      uiRecipe.id || '',
      uiRecipe.title,
      uiRecipe.description || '',
      ingredients,
      uiRecipe.steps.map(s => s.description),
      prepTime,
      cookTime,
      uiRecipe.portions,
      uiRecipe.cuisine ? [uiRecipe.cuisine] : [],
      uiRecipe.imageUrl || undefined,
      uiRecipe.sourceUrl || undefined,
      nutrition,
      uiRecipe.createdAt || new Date(),
      uiRecipe.updatedAt || new Date()
    );
  }

  static toUI(domainRecipe: DomainRecipe): UIRecipe {
    const ingredients: Ingredient[] = domainRecipe.ingredients.map((ing, index) => ({
      id: `${domainRecipe.id}-ing-${index}`,
      quantity: ing.quantity.value,
      unit: ing.quantity.unit,
      name: ing.name,
      notes: ing.notes,
      category: undefined,
      isInStock: false
    }));

    return {
      id: domainRecipe.id,
      title: domainRecipe.title,
      description: domainRecipe.description,
      prepTime: domainRecipe.prepTime.minutes,
      cookTime: domainRecipe.cookTime.minutes,
      cuisine: domainRecipe.tags[0] || null,
      portions: domainRecipe.servings,
      ingredients,
      steps: domainRecipe.instructions.map((instruction, index) => ({
        id: `${domainRecipe.id}-step-${index}`,
        description: instruction,
        order: index + 1,
        timer: null,
        isComplete: false
      })),
      utensils: [],
      isFavorite: false,
      isVegetarian: domainRecipe.tags.includes('vegetarian'),
      userId: null,
      householdId: null,
      authorName: null,
      sourceUrl: domainRecipe.sourceUrl || null,
      youtubeUrl: null,
      youtubeVideoId: null,
      imageUrl: domainRecipe.imageUrl || null,
      createdAt: domainRecipe.createdAt,
      updatedAt: domainRecipe.updatedAt
    };
  }
}