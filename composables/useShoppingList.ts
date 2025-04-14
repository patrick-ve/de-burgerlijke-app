import { ref } from 'vue';
import type { ShoppingListItem } from '~/types/shopping-list';
import type { Ingredient } from '~/types/recipe';
import { v4 as uuidv4 } from 'uuid';

// Simple client-side state for demonstration
// TODO: Replace with server state management (e.g., useFetch/useAsyncData + API endpoints)
const shoppingListItems = ref<ShoppingListItem[]>([]);

// Helper to standardize ingredient names (basic example)
const standardizeName = (name: string): string => {
  return name.trim().toLowerCase();
  // TODO: Implement more robust standardization (pluralization, variations etc.)
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
      const unit = ingredient.unit;

      const existingItemIndex = shoppingListItems.value.findIndex(
        (item) =>
          standardizeName(item.ingredientName) === stdName &&
          item.unit === unit
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
          ingredientName: ingredient.name,
          standardizedName: stdName,
          aggregatedQuantity: quantity,
          unit: unit ?? null,
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

  // TODO: Add functions for removing items, clearing the list, etc.

  return {
    items,
    addIngredients,
    updateItem,
    // Expose other functions as needed
  };
}
