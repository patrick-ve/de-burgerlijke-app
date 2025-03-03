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
}

export const useRecipeStore = create<RecipeState>()(
  persist(
    (set, get) => ({
      recipes: [],
      addRecipe: (recipe) => set((state) => ({ 
        recipes: [recipe, ...state.recipes] 
      })),
      updateRecipe: (id, updatedRecipe) => set((state) => ({
        recipes: state.recipes.map((recipe) => 
          recipe.id === id ? { ...recipe, ...updatedRecipe } : recipe
        )
      })),
      deleteRecipe: (id) => set((state) => ({
        recipes: state.recipes.filter((recipe) => recipe.id !== id)
      })),
      getRecipeById: (id) => {
        return get().recipes.find((recipe) => recipe.id === id);
      },
      updateServings: (id, servings) => set((state) => ({
        recipes: state.recipes.map((recipe) => 
          recipe.id === id 
            ? { 
                ...recipe, 
                servings,
                ingredients: recipe.ingredients.map(ingredient => ({
                  ...ingredient,
                  quantity: (ingredient.quantity / recipe.servings) * servings
                }))
              } 
            : recipe
        )
      })),
    }),
    {
      name: 'recipe-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);