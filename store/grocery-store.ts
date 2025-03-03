import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GroceryList, GroceryItem, Ingredient, Recipe } from '@/types';

interface GroceryState {
  groceryLists: GroceryList[];
  addGroceryList: (name: string) => void;
  updateGroceryList: (id: string, name: string) => void;
  deleteGroceryList: (id: string) => void;
  addGroceryItem: (listId: string, item: Omit<GroceryItem, 'id'>) => void;
  updateGroceryItem: (listId: string, itemId: string, item: Partial<GroceryItem>) => void;
  deleteGroceryItem: (listId: string, itemId: string) => void;
  toggleGroceryItem: (listId: string, itemId: string) => void;
  addIngredientsFromRecipe: (listId: string, recipeId: string, recipe: Recipe, servings: number) => void;
  getGroceryListById: (id: string) => GroceryList | undefined;
}

export const useGroceryStore = create<GroceryState>()(
  persist(
    (set, get) => ({
      groceryLists: [],
      addGroceryList: (name) => set((state) => ({
        groceryLists: [
          ...state.groceryLists,
          {
            id: Date.now().toString(),
            name,
            items: [],
            createdAt: Date.now(),
          }
        ]
      })),
      updateGroceryList: (id, name) => set((state) => ({
        groceryLists: state.groceryLists.map((list) => 
          list.id === id ? { ...list, name } : list
        )
      })),
      deleteGroceryList: (id) => set((state) => ({
        groceryLists: state.groceryLists.filter((list) => list.id !== id)
      })),
      addGroceryItem: (listId, item) => set((state) => ({
        groceryLists: state.groceryLists.map((list) => 
          list.id === listId 
            ? { 
                ...list, 
                items: [
                  ...list.items, 
                  { 
                    ...item, 
                    id: Date.now().toString() 
                  }
                ] 
              } 
            : list
        )
      })),
      updateGroceryItem: (listId, itemId, updatedItem) => set((state) => ({
        groceryLists: state.groceryLists.map((list) => 
          list.id === listId 
            ? { 
                ...list, 
                items: list.items.map((item) => 
                  item.id === itemId ? { ...item, ...updatedItem } : item
                ) 
              } 
            : list
        )
      })),
      deleteGroceryItem: (listId, itemId) => set((state) => ({
        groceryLists: state.groceryLists.map((list) => 
          list.id === listId 
            ? { 
                ...list, 
                items: list.items.filter((item) => item.id !== itemId) 
              } 
            : list
        )
      })),
      toggleGroceryItem: (listId, itemId) => set((state) => ({
        groceryLists: state.groceryLists.map((list) => 
          list.id === listId 
            ? { 
                ...list, 
                items: list.items.map((item) => 
                  item.id === itemId ? { ...item, checked: !item.checked } : item
                ) 
              } 
            : list
        )
      })),
      addIngredientsFromRecipe: (listId, recipeId, recipe, servings) => set((state) => {
        const list = state.groceryLists.find(list => list.id === listId);
        if (!list) return state;

        const scaleFactor = servings / recipe.servings;
        
        const newItems = recipe.ingredients.map(ingredient => ({
          id: Date.now() + Math.random().toString(),
          name: ingredient.name,
          quantity: ingredient.quantity * scaleFactor,
          unit: ingredient.unit,
          checked: false,
          recipeId: recipeId
        }));

        return {
          groceryLists: state.groceryLists.map((list) => 
            list.id === listId 
              ? { 
                  ...list, 
                  items: [...list.items, ...newItems]
                } 
              : list
          )
        };
      }),
      getGroceryListById: (id) => {
        return get().groceryLists.find((list) => list.id === id);
      },
    }),
    {
      name: 'grocery-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);