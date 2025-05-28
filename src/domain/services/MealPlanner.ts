import { type Recipe } from '../entities/Recipe';
import { type MealPlan } from '../entities/MealPlan';
import { ScheduledMeal, type MealType } from '../entities/ScheduledMeal';
import { createId } from '@paralleldrive/cuid2';

export interface MealPlanningPreferences {
  servingsPerMeal: number;
  avoidConsecutiveDuplicates: boolean;
  preferredMealTypes: {
    breakfast: string[];
    lunch: string[];
    dinner: string[];
  };
  maxRecipeRepetitions: number;
}

export interface MealSuggestion {
  recipe: Recipe;
  mealType: MealType;
  score: number;
  reasons: string[];
}

export class MealPlanner {
  /**
   * Generate meal suggestions based on available recipes and preferences
   */
  generateMealSuggestions(
    recipes: Recipe[],
    mealType: MealType,
    existingMeals: ScheduledMeal[],
    preferences: MealPlanningPreferences
  ): MealSuggestion[] {
    const suggestions: MealSuggestion[] = [];
    
    for (const recipe of recipes) {
      const score = this.calculateSuggestionScore(
        recipe,
        mealType,
        existingMeals,
        preferences
      );
      
      const reasons = this.getSuggestionReasons(
        recipe,
        mealType,
        existingMeals,
        preferences
      );
      
      suggestions.push({
        recipe,
        mealType,
        score,
        reasons
      });
    }
    
    // Sort by score (highest first)
    return suggestions.sort((a, b) => b.score - a.score);
  }

  /**
   * Create a balanced weekly meal plan
   */
  createWeeklyMealPlan(
    recipes: Recipe[],
    startDate: Date,
    preferences: MealPlanningPreferences
  ): MealPlan {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6); // 7 days total
    
    const mealPlan = new MealPlan(
      createId(),
      `Week of ${startDate.toLocaleDateString()}`,
      startDate,
      endDate
    );
    
    // Plan meals for each day
    for (let day = 0; day < 7; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + day);
      
      // Plan each meal type
      const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner'];
      
      for (const mealType of mealTypes) {
        const mealDate = new Date(currentDate);
        
        // Set appropriate time for each meal
        switch (mealType) {
          case 'breakfast':
            mealDate.setHours(8, 0, 0, 0);
            break;
          case 'lunch':
            mealDate.setHours(12, 30, 0, 0);
            break;
          case 'dinner':
            mealDate.setHours(18, 30, 0, 0);
            break;
        }
        
        // Get suggestions for this meal
        const suggestions = this.generateMealSuggestions(
          recipes,
          mealType,
          mealPlan.meals,
          preferences
        );
        
        if (suggestions.length > 0) {
          // Pick the top suggestion
          const topSuggestion = suggestions[0];
          
          const meal = new ScheduledMeal(
            createId(),
            topSuggestion.recipe.id,
            topSuggestion.recipe.title,
            mealDate,
            mealType,
            preferences.servingsPerMeal
          );
          
          mealPlan.addMeal(meal);
        }
      }
    }
    
    return mealPlan;
  }

  /**
   * Calculate a score for how suitable a recipe is for a specific meal
   */
  private calculateSuggestionScore(
    recipe: Recipe,
    mealType: MealType,
    existingMeals: ScheduledMeal[],
    preferences: MealPlanningPreferences
  ): number {
    let score = 100; // Start with base score
    
    // Check if recipe matches preferred tags for meal type
    const preferredTags = preferences.preferredMealTypes[mealType] || [];
    const matchingTags = recipe.tags.filter(tag => 
      preferredTags.some(preferred => 
        tag.toLowerCase().includes(preferred.toLowerCase())
      )
    );
    score += matchingTags.length * 10;
    
    // Reduce score for recent repetitions
    const recentOccurrences = existingMeals.filter(meal => 
      meal.recipeId === recipe.id
    ).length;
    score -= recentOccurrences * 20;
    
    // Reduce score if exceeds max repetitions
    if (recentOccurrences >= preferences.maxRecipeRepetitions) {
      score -= 50;
    }
    
    // Boost score based on cooking time for meal type
    if (mealType === 'breakfast' && recipe.totalTime.minutes <= 30) {
      score += 15;
    } else if (mealType === 'lunch' && recipe.totalTime.minutes <= 45) {
      score += 10;
    }
    
    // Check for consecutive duplicates
    if (preferences.avoidConsecutiveDuplicates && existingMeals.length > 0) {
      const lastMeal = existingMeals[existingMeals.length - 1];
      if (lastMeal.recipeId === recipe.id) {
        score -= 30;
      }
    }
    
    return Math.max(0, score); // Ensure non-negative score
  }

  /**
   * Get human-readable reasons for why a recipe is suggested
   */
  private getSuggestionReasons(
    recipe: Recipe,
    mealType: MealType,
    existingMeals: ScheduledMeal[],
    preferences: MealPlanningPreferences
  ): string[] {
    const reasons: string[] = [];
    
    // Check cooking time
    if (mealType === 'breakfast' && recipe.totalTime.minutes <= 30) {
      reasons.push('Quick to prepare for breakfast');
    }
    
    // Check tags
    const preferredTags = preferences.preferredMealTypes[mealType] || [];
    const matchingTags = recipe.tags.filter(tag => 
      preferredTags.some(preferred => 
        tag.toLowerCase().includes(preferred.toLowerCase())
      )
    );
    
    if (matchingTags.length > 0) {
      reasons.push(`Matches preferences: ${matchingTags.join(', ')}`);
    }
    
    // Check variety
    const recentOccurrences = existingMeals.filter(meal => 
      meal.recipeId === recipe.id
    ).length;
    
    if (recentOccurrences === 0) {
      reasons.push('Adds variety to the meal plan');
    } else if (recentOccurrences < preferences.maxRecipeRepetitions) {
      reasons.push('Popular recipe, used in moderation');
    }
    
    // Check nutritional balance (if available)
    if (recipe.nutrition) {
      if (recipe.nutrition.protein > 20) {
        reasons.push('High in protein');
      }
      if (recipe.nutrition.fiber && recipe.nutrition.fiber > 5) {
        reasons.push('Good source of fiber');
      }
    }
    
    return reasons;
  }

  /**
   * Calculate shopping list from meal plan
   */
  generateShoppingListFromPlan(
    mealPlan: MealPlan,
    recipes: Recipe[]
  ): Map<string, { quantity: number; unit?: string }> {
    const ingredientMap = new Map<string, { quantity: number; unit?: string }>();
    
    for (const meal of mealPlan.meals) {
      const recipe = recipes.find(r => r.id === meal.recipeId);
      if (!recipe) continue;
      
      // Calculate serving ratio
      const servingRatio = meal.servings / recipe.servings;
      
      for (const ingredient of recipe.ingredients) {
        const key = `${ingredient.name}_${ingredient.quantity.unit || 'piece'}`;
        const adjustedQuantity = ingredient.quantity.amount * servingRatio;
        
        if (ingredientMap.has(key)) {
          const existing = ingredientMap.get(key)!;
          existing.quantity += adjustedQuantity;
        } else {
          ingredientMap.set(key, {
            quantity: adjustedQuantity,
            unit: ingredient.quantity.unit
          });
        }
      }
    }
    
    return ingredientMap;
  }
}