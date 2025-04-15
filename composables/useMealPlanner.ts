import { useStorage } from '@vueuse/core';
import { v4 as uuidv4 } from 'uuid';
import type { Recipe } from '~/types/recipe'; // Assuming Recipe type is defined
import { computed } from 'vue';
import type { Ref } from 'vue';

// Define the structure for a scheduled meal
// Consider moving this to types/ if used elsewhere
export interface ScheduledMeal {
  id: string; // Unique ID for the scheduled instance
  recipeId: string;
  recipeTitle: string; // Denormalized for easy display
  date: string; // YYYY-MM-DD format
  portions: number;
}

// Define the shape of the persisted state: Record mapping date string to array of meals
type MealPlanState = Record<string, ScheduledMeal[]>;

export const useMealPlanner = () => {
  // Use useStorage to make the meal plan persistent
  const mealPlan = useStorage<MealPlanState>('mealPlan', {});

  // Helper to get date string in YYYY-MM-DD format
  const getDateString = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  /**
   * Retrieves scheduled meals for a specific date.
   * Returns a reactive ref to the array of meals for that date.
   */
  const getMealsForDate = (date: Date): Ref<ScheduledMeal[]> => {
    const dateString = getDateString(date);

    // Return a computed ref that reactively reads the meals for the specific date
    return computed(() => {
      // Ensure the date key exists within the computed getter for reactivity
      if (!mealPlan.value[dateString]) {
        // It's generally better practice to initialize reactively elsewhere (e.g., when adding)
        // but for safety, we can ensure it exists here if needed, though it might indicate
        // a logic flaw if accessed before being potentially initialized.
        // Let's rely on addMeal to initialize for now and just return empty if not found.
        return [];
      }
      return mealPlan.value[dateString];
    });
  };

  /**
   * Adds a new scheduled meal to the plan for a specific date.
   */
  const addMeal = (
    recipe: Recipe,
    date: Date,
    portions?: number
  ): ScheduledMeal | null => {
    if (!recipe.id || !recipe.title) {
      console.error(
        'Cannot add meal: Recipe ID or Title is missing.'
      );
      return null;
    }
    const dateString = getDateString(date);
    const newMeal: ScheduledMeal = {
      id: uuidv4(), // Generate unique ID for this scheduled instance
      recipeId: recipe.id,
      recipeTitle: recipe.title, // Title is guaranteed string by useRecipes
      date: dateString,
      portions: portions ?? recipe.portions ?? 1, // Use provided portions, then recipe default, then 1
    };

    if (!mealPlan.value[dateString]) {
      mealPlan.value[dateString] = []; // Initialize if date doesn't exist
    }
    mealPlan.value[dateString].push(newMeal);
    console.log(
      `Added meal "${newMeal.recipeTitle}" for ${dateString}`
    );
    return newMeal;
  };

  /**
   * Removes a specific scheduled meal instance by its ID from a specific date.
   */
  const removeMeal = (mealId: string, date: Date): void => {
    const dateString = getDateString(date);

    // Explicitly check if the date entry exists in the meal plan
    if (!mealPlan.value[dateString]) {
      console.warn(
        `No meals found for date ${dateString} to remove meal ID ${mealId}`
      );
      return; // Exit early if the date doesn't exist
    }

    // Now we know mealPlan.value[dateString] is an array
    const initialLength = mealPlan.value[dateString].length;
    mealPlan.value[dateString] = mealPlan.value[dateString].filter(
      (meal) => meal.id !== mealId
    );

    if (mealPlan.value[dateString].length < initialLength) {
      console.log(`Removed meal ID ${mealId} from ${dateString}`);
      // Optional: Clean up empty date entries
      if (mealPlan.value[dateString].length === 0) {
        delete mealPlan.value[dateString];
      }
    } else {
      // This warning means the date existed, but the specific mealId wasn't found
      console.warn(`Meal ID ${mealId} not found on ${dateString}`);
    }
  };

  return {
    mealPlan, // Expose the raw state if needed, otherwise rely on getters
    getMealsForDate,
    addMeal,
    removeMeal,
    getDateString, // Expose helper if needed elsewhere
  };
};
