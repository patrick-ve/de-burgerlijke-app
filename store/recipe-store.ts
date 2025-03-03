import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recipe, Ingredient } from '@/types';

interface RecipeState {
  recipes: Recipe[];
  addRecipe: (recipe: Recipe) => void;
  updateRecipe: (id: string, recipe: Partial<Recipe>) => void;
  deleteRecipe: (id: string) => void;
  getRecipeById: (id: string) => Recipe | undefined;
  updateServings: (id: string, servings: number) => void;
  toggleInstructionCompletion: (
    recipeId: string,
    instructionIndex: number
  ) => void;
}

export const useRecipeStore = create<RecipeState>()(
  persist(
    (set, get) => ({
      recipes: [],
      addRecipe: (recipe) =>
        set((state) => ({
          recipes: [recipe, ...state.recipes],
        })),
      updateRecipe: (id, updatedRecipe) =>
        set((state) => ({
          recipes: state.recipes.map((recipe) =>
            recipe.id === id
              ? { ...recipe, ...updatedRecipe }
              : recipe
          ),
        })),
      deleteRecipe: (id) =>
        set((state) => ({
          recipes: state.recipes.filter((recipe) => recipe.id !== id),
        })),
      getRecipeById: (id) => {
        return get().recipes.find((recipe) => recipe.id === id);
      },
      updateServings: (id, servings) =>
        set((state) => ({
          recipes: state.recipes.map((recipe) =>
            recipe.id === id
              ? {
                  ...recipe,
                  servings,
                  ingredients: recipe.ingredients.map(
                    (ingredient) => ({
                      ...ingredient,
                      quantity:
                        (ingredient.quantity / recipe.servings) *
                        servings,
                    })
                  ),
                }
              : recipe
          ),
        })),
      toggleInstructionCompletion: (recipeId, instructionIndex) =>
        set((state) => {
          const recipe = state.recipes.find((r) => r.id === recipeId);
          if (!recipe) return state;

          const completedInstructions =
            recipe.completedInstructions || [];
          const isCompleted =
            completedInstructions.includes(instructionIndex);

          if (isCompleted) {
            const hasLaterCompletedSteps = completedInstructions.some(
              (index) => index > instructionIndex
            );

            if (hasLaterCompletedSteps) {
              return state;
            }

            return {
              recipes: state.recipes.map((r) =>
                r.id === recipeId
                  ? {
                      ...r,
                      completedInstructions:
                        completedInstructions.filter(
                          (index) => index !== instructionIndex
                        ),
                    }
                  : r
              ),
            };
          }

          const allPreviousSteps = Array.from(
            { length: instructionIndex },
            (_, i) => i
          );

          const newCompletedInstructions = Array.from(
            new Set([
              ...completedInstructions,
              ...allPreviousSteps,
              instructionIndex,
            ])
          ).sort((a, b) => a - b);

          return {
            recipes: state.recipes.map((r) =>
              r.id === recipeId
                ? {
                    ...r,
                    completedInstructions: newCompletedInstructions,
                  }
                : r
            ),
          };
        }),
    }),
    {
      name: 'recipe-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
