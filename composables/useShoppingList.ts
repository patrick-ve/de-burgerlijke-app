import { ref } from 'vue';
import type { ShoppingListItem } from '~/types/shopping-list';
import type { Ingredient } from '~/types/recipe';
import { v4 as uuidv4 } from 'uuid';

// Simple client-side state for demonstration
// TODO: Replace with server state management (e.g., useFetch/useAsyncData + API endpoints)
const shoppingListItems = ref<ShoppingListItem[]>([]);

// Helper to standardize ingredient names (basic example)
const standardizeName = (name: string): string => {
  let std = name.trim().toLowerCase();
  // Basic pluralization handling (add more rules as needed)
  if (std.endsWith('s') && !std.endsWith('ss')) {
    // Avoid changing 'passata', 'bass', etc.
    const singularAttempt = std.slice(0, -1);
    // Add specific known plurals you want to handle
    const knownPlurals: { [key: string]: string } = {
      cloves: 'clove',
      // Add more: e.g., tomatoes: 'tomato'
    };
    if (knownPlurals[std]) {
      return knownPlurals[std];
    }
    // Very basic check, might need a library for robust stemming
    // For now, only handle explicitly defined known plurals
  }
  return std; // Return original lowercased/trimmed if no rule applies
};

// Helper to standardize units (treat null, undefined, '' as equivalent null)
const standardizeUnit = (
  unit: string | null | undefined
): string | null => {
  if (unit === null || unit === undefined || unit.trim() === '') {
    return null;
  }
  // Optional: Add unit standardization (e.g., 'gram' -> 'g')
  return unit.trim().toLowerCase();
};

export function useShoppingList() {
  const items = computed(() => shoppingListItems.value);

  /**
   * Adds ingredients from a recipe (with specific portions) to the shopping list.
   * Aggregates quantities if the ingredient already exists.
   */
  const addIngredients = (
    ingredientsToAdd: Array<
      Ingredient & { scaledQuantity: number | null }
    >,
    recipeId: string
  ) => {
    ingredientsToAdd.forEach((ingredient) => {
      if (!ingredient.name) return; // Skip if ingredient has no name

      const stdName = standardizeName(ingredient.name);
      const quantity = ingredient.scaledQuantity;
      const unit = standardizeUnit(ingredient.unit); // Standardize the incoming unit

      const existingItemIndex = shoppingListItems.value.findIndex(
        (item) =>
          standardizeName(item.ingredientName) === stdName &&
          standardizeUnit(item.unit) === unit // Compare standardized units
      );

      if (existingItemIndex > -1) {
        // --- Update existing item ---
        const existingItem =
          shoppingListItems.value[existingItemIndex];
        let newQuantity = existingItem.aggregatedQuantity;

        // Add quantities if both are numbers
        if (
          typeof newQuantity === 'number' &&
          typeof quantity === 'number'
        ) {
          newQuantity += quantity;
        } else if (quantity !== null) {
          // If existing quantity is null, use the new quantity (if not null)
          newQuantity = quantity;
        }
        // If new quantity is null, existing remains unchanged

        shoppingListItems.value[existingItemIndex] = {
          ...existingItem,
          aggregatedQuantity: newQuantity,
          // Add recipeId if not already present
          recipeIds: existingItem.recipeIds.includes(recipeId)
            ? existingItem.recipeIds
            : [...existingItem.recipeIds, recipeId],
          updatedAt: new Date(),
        };
      } else {
        // --- Add new item ---
        const newItem: ShoppingListItem = {
          id: uuidv4(), // Generate unique ID
          ingredientName: ingredient.name, // Store original name for display
          standardizedName: stdName, // Store standardized name for comparison
          aggregatedQuantity: quantity,
          unit: ingredient.unit ?? null, // Store original unit for display (or null)
          isChecked: false,
          recipeIds: [recipeId],
          createdAt: new Date(),
          updatedAt: new Date(),
          priceInfo: [], // Initialize with empty price info
        };
        shoppingListItems.value.push(newItem);
      }
    });

    console.log('Shopping List Updated:', shoppingListItems.value);
  };

  /**
   * Updates an existing item in the shopping list (e.g., toggles isChecked).
   */
  const updateItem = (updatedItem: ShoppingListItem) => {
    const index = shoppingListItems.value.findIndex(
      (item) => item.id === updatedItem.id
    );
    if (index !== -1) {
      shoppingListItems.value[index] = {
        ...updatedItem,
        updatedAt: new Date(),
      };
    } else {
      console.warn(
        'Attempted to update non-existent item:',
        updatedItem
      );
    }
  };

  /**
   * Deletes an item from the shopping list by its ID.
   */
  const deleteItem = (itemId: string) => {
    const index = shoppingListItems.value.findIndex(
      (item) => item.id === itemId
    );
    if (index !== -1) {
      shoppingListItems.value.splice(index, 1);
    } else {
      console.warn('Attempted to delete non-existent item:', itemId);
    }
  };

  /**
   * Clears all items from the shopping list.
   */
  const clearList = () => {
    shoppingListItems.value = [];
    console.log('Shopping List Cleared');
  };

  // TODO: Add functions for removing items, etc.

  return {
    items,
    addIngredients,
    updateItem,
    deleteItem,
    clearList,
    // Expose other functions as needed
  };
}
