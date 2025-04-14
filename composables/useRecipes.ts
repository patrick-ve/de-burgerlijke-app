/**
 * Provides access to the mock recipe data, now persistent using localStorage.
 */
import { useStorage } from '@vueuse/core';
import { v4 as uuidv4 } from 'uuid';
import type { Recipe } from '~/types/recipe';
import type { AIRecipeDTO } from '~/server/utils/recipeSchema'; // Import the DTO type

// Helper function to parse duration strings/numbers (e.g., "15 min", "1 hour", 15) into minutes
function parseDuration(
  duration: string | number | null | undefined
): number | null {
  if (duration === null || duration === undefined) return null;
  if (typeof duration === 'number')
    return duration > 0 ? duration : null; // Handle direct number input

  // Handle string input
  let totalMinutes = 0;
  const hourMatch = duration.match(/(\d+)\s*(?:hour|uur)/i);
  const minMatch = duration.match(/(\d+)\s*(?:min|minuten)/i);

  if (hourMatch) {
    totalMinutes += parseInt(hourMatch[1], 10) * 60;
  }
  if (minMatch) {
    totalMinutes += parseInt(minMatch[1], 10);
  }

  // If no explicit hour/min match but string contains digits, try parsing just the digits
  if (totalMinutes === 0) {
    const digitMatch = duration.match(/\d+/);
    if (digitMatch) {
      totalMinutes = parseInt(digitMatch[0], 10);
    }
  }

  return totalMinutes > 0 ? totalMinutes : null;
}

// Helper function to parse portions string/number into a number or null
function parsePortions(
  portions: string | number | null | undefined
): number | null {
  if (typeof portions === 'number') return portions;
  if (typeof portions === 'string') {
    // Try to extract the first number found
    const match = portions.match(/\d+/);
    if (match) return parseInt(match[0], 10);
  }
  return null; // Default or unable to parse
}

// Helper specifically for step timer parsing
function parseStepTimer(
  timerValue: string | number | null | undefined
): number | null {
  if (timerValue === null || timerValue === undefined) return null;

  let durationMinutes: number | null = null;

  if (typeof timerValue === 'number') {
    // Heuristic:
    // If number > 1000, assume milliseconds -> convert to minutes.
    // If number <= 180 (3 min), assume seconds -> convert to minutes.
    // Otherwise (181-1000), assume minutes (less likely for steps, but possible).
    if (timerValue > 1000) {
      // Plausibly milliseconds
      durationMinutes = timerValue / 60000;
    } else if (timerValue > 0 && timerValue <= 180) {
      // Plausibly seconds
      durationMinutes = timerValue / 60;
    } else if (timerValue > 180) {
      // Plausibly minutes
      durationMinutes = timerValue;
    }
  } else if (typeof timerValue === 'string') {
    let totalMinutes = 0;
    const hourMatch = timerValue.match(/(\d+)\s*(?:hour|uur)/i);
    const minMatch = timerValue.match(/(\d+)\s*(?:min|minuten)/i);
    const secMatch = timerValue.match(/(\d+)\s*(?:sec|seconden)/i);

    if (hourMatch) totalMinutes += parseInt(hourMatch[1], 10) * 60;
    if (minMatch) totalMinutes += parseInt(minMatch[1], 10);
    if (secMatch) totalMinutes += parseInt(secMatch[1], 10) / 60;

    // Fallback for simple number strings (assume seconds?)
    if (totalMinutes === 0) {
      const digitMatch = timerValue.match(/\d+/);
      if (digitMatch) {
        const num = parseInt(digitMatch[0], 10);
        // Heuristic: Assume seconds if just a number in a string & <= 180
        if (num > 0 && num <= 180) {
          totalMinutes = num / 60;
        } else if (num > 180) {
          // Assume minutes if > 180
          totalMinutes = num;
        }
      }
    }
    durationMinutes = totalMinutes;
  }

  // Return null if parsing failed or resulted in 0 or negative
  return durationMinutes !== null && durationMinutes > 0
    ? durationMinutes
    : null;
}

export const useRecipes = () => {
  // Use useStorage to make recipes persistent
  const storedRecipes = useStorage<Recipe[]>('recipes', []);

  const findRecipeById = (id: string): Recipe | undefined => {
    // Search in the stored recipes
    return storedRecipes.value.find((recipe) => recipe.id === id);
  };

  /**
   * Adds a new recipe parsed from an AIRecipeDTO to the persistent list.
   */
  const addRecipe = (aiRecipe: AIRecipeDTO): Recipe => {
    const newRecipe: Recipe = {
      id: uuidv4(), // Generate unique ID
      title: aiRecipe.title,
      description: aiRecipe.description ?? null,
      imageUrl: aiRecipe.imageUrl ?? null,
      prepTime: parseDuration(aiRecipe.prepTime),
      cookTime: parseDuration(aiRecipe.cookTime),
      cuisine: aiRecipe.cuisine ?? null,
      portions: parsePortions(aiRecipe.portions) ?? 1, // Default to 1 if null
      ingredients: (aiRecipe.ingredients ?? []).map((ing) => ({
        id: uuidv4(), // Generate unique ingredient ID
        name: ing.name,
        quantity: ing.quantity ?? null,
        unit: ing.unit ?? null,
        notes: ing.notes ?? null,
      })),
      steps: (aiRecipe.steps ?? [])
        .map((step, index) => ({
          id: uuidv4(), // Generate unique step ID
          order: index + 1,
          description: step.description,
          timer: parseStepTimer(step.timer), // Use the specific step timer parser
        }))
        // Ensure steps are sorted by order, just in case
        .sort((a, b) => a.order - b.order),
      // Remove utensils mapping as it's not present in AIRecipeDTO
      utensils: [], // Default to empty array for the Recipe type
      isFavorite: false, // Default new recipes are not favorite
    };

    storedRecipes.value.push(newRecipe);
    console.log('Added new recipe:', newRecipe);
    return newRecipe; // Return the added recipe
  };

  return {
    // Expose the reactive ref directly
    recipes: storedRecipes,
    findRecipeById,
    addRecipe, // Expose the new function
  };
};
