import { ref, computed } from 'vue';
import { useStorage } from '@vueuse/core';
import type {
  ShoppingListItem,
  Product,
} from '~/types/shopping-list';
import type { Ingredient, IngredientCategory } from '~/types/recipe';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '#imports';
import { useOnboardingSettings } from '~/composables/useOnboardingSettings';
import { consola } from 'consola';

// Assuming ApiReturnType is defined somewhere, e.g., in types or directly
// If not, define it here or import it
type ApiReturnType = Record<string, Product | null>;

// Use useStorage to persist the shopping list in localStorage
const shoppingListItems = useStorage<ShoppingListItem[]>(
  'shopping-list-items',
  []
);

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
  const toast = useToast();
  const { selectedSupermarketIds } = useOnboardingSettings();
  const isLoadingPrices = ref(false);
  const isOptimizingList = ref(false);
  const isStandardizingItems = ref(false);

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
          category: ingredient.category ?? null,
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

  /**
   * Replaces the entire shopping list with a new set of items.
   * INTERNAL function, use optimizeAndFetchPrices for external cleanup trigger.
   */
  const replaceList = (newItems: ShoppingListItem[]) => {
    shoppingListItems.value = newItems;
    consola.info(
      'Shopping List Replaced (Internal):',
      shoppingListItems.value
    );
  };

  // --- Moved fetchCheapestProducts ---
  const fetchCheapestProducts = async () => {
    consola.info('fetchCheapestProducts called.', {
      isLoading: isLoadingPrices.value,
    }); // Log entry
    if (isLoadingPrices.value) {
      consola.info('Price fetching already in progress.');
      return;
    }
    if (shoppingListItems.value.length === 0) {
      consola.info(
        'Shopping list is empty, skipping price fetching.'
      );
      return; // No need to fetch if list is empty
    }

    const itemsToFetch = shoppingListItems.value.filter(
      (item) => !item.isChecked
    );
    const ingredientNames = itemsToFetch.map(
      (item) => item.ingredientName
    );

    if (ingredientNames.length === 0) {
      consola.info('No unchecked items to fetch prices for.');
      // Optionally show a toast, or just log
      return;
    }

    consola.info('Fetching cheapest products for:', ingredientNames);
    isLoadingPrices.value = true; // Set loading state
    consola.log('isLoadingPrices set to true'); // Log state change

    try {
      const requestBody = {
        ingredientNames,
        selectedSupermarketIds: selectedSupermarketIds.value,
      };
      consola.info('Price Fetch Request Body:', requestBody);

      const results: ApiReturnType = await $fetch(
        '/api/shopping-list/find-cheapest',
        {
          method: 'POST',
          body: requestBody,
        }
      );

      consola.success('Received cheapest products:', results);

      let updateCount = 0;
      Object.entries(results).forEach(
        ([ingredientName, cheapestProduct]) => {
          if (cheapestProduct) {
            const itemToUpdate = shoppingListItems.value.find(
              (item) =>
                item.ingredientName === ingredientName &&
                !item.isChecked
            );

            if (itemToUpdate) {
              consola.log(`Updating price for ${ingredientName}`); // Log item update
              // Use updateItem to ensure reactivity and timestamp update
              updateItem({
                ...itemToUpdate,
                cheapestPrice: cheapestProduct.price,
                cheapestSupermarket: cheapestProduct.supermarketName,
                cheapestAmount: cheapestProduct.amount,
                cheapestUrl: cheapestProduct.url,
                cheapestStandardizedPricePerUnit:
                  cheapestProduct.standardized_price_per_unit,
                cheapestStandardizedUnit:
                  cheapestProduct.standardized_unit,
              });
              updateCount++;
            }
          }
        }
      );
      consola.log('Finished processing price results.'); // Log end of processing

      if (updateCount > 0) {
        toast.add({
          id: 'prices-updated-toast',
          title: `Prijzen bijgewerkt voor ${updateCount} item(s)`,
          icon: 'i-heroicons-currency-euro',
        });
      } else if (Object.keys(results).length > 0) {
        // Only show 'no new prices' if the API call actually returned something
        toast.add({
          id: 'no-new-prices-toast',
          title: 'Geen nieuwe prijzen gevonden',
          description:
            'De prijzen voor de opgezochte items zijn mogelijk al actueel.',
          color: 'orange',
        });
      }
      // If results were empty, we don't need a toast.
    } catch (error) {
      consola.error('Error fetching cheapest products:', error);
      toast.add({
        id: 'price-fetch-error-toast',
        title: 'Fout bij ophalen prijzen',
        description:
          'Kon de productprijzen niet ophalen. Probeer het later opnieuw.',
        color: 'red',
      });
    } finally {
      isLoadingPrices.value = false; // Clear loading state regardless of outcome
      consola.log('isLoadingPrices set to false'); // Log state change
    }
  };
  // --- End fetchCheapestProducts ---

  // --- Modified function to add items from raw text input via AI standardization ---
  const addItemsFromText = async (
    textInput: string
  ): Promise<number> => {
    if (!textInput || textInput.trim() === '') {
      toast.add({
        title: 'Geen invoer',
        description: 'Voer boodschappen in om toe te voegen.',
        icon: 'i-heroicons-exclamation-triangle',
        color: 'orange',
      });
      return 0; // Return 0 items added
    }

    const lines = textInput
      .split('\\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      toast.add({
        title: 'Geen invoer',
        description: 'Voer boodschappen in om toe te voegen.',
        icon: 'i-heroicons-exclamation-triangle',
        color: 'orange',
      });
      return 0; // Return 0 items added
    }

    isStandardizingItems.value = true; // Set loading state
    consola.info('Starting standardization of text input...');
    let itemsAddedOrMergedCount = 0;

    try {
      // Call the new API endpoint
      const standardizedItems: ShoppingListItem[] = await $fetch(
        '/api/shopping-list/standardize-text',
        {
          method: 'POST',
          body: { lines },
        }
      );

      consola.success(
        `Received ${standardizedItems.length} standardized items from API.`
      );

      if (standardizedItems.length === 0) {
        toast.add({
          title: 'Niets herkend',
          description:
            'Kon geen geldige boodschappen vinden in de invoer.',
          icon: 'i-heroicons-question-mark-circle',
          color: 'orange',
        });
        return 0;
      }

      // Merge standardized items into the main list
      standardizedItems.forEach((stdItem) => {
        const stdName = standardizeName(stdItem.ingredientName);
        const unit = standardizeUnit(stdItem.unit); // Standardize unit for comparison

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
          const incomingQuantity = stdItem.aggregatedQuantity;

          // Add quantities if both are numbers
          if (
            typeof newQuantity === 'number' &&
            typeof incomingQuantity === 'number'
          ) {
            newQuantity += incomingQuantity;
          } else if (incomingQuantity !== null) {
            // If existing quantity is null, use the new quantity (if not null)
            newQuantity = incomingQuantity;
          }
          // If new quantity is null, existing remains unchanged

          shoppingListItems.value[existingItemIndex] = {
            ...existingItem,
            aggregatedQuantity: newQuantity,
            // Overwrite category if the new item has one and the old one didn't
            category:
              existingItem.category ?? stdItem.category ?? null,
            updatedAt: new Date(),
            // Keep existing recipeIds
            // Reset price info as quantity/item definition changed
            priceInfo: [],
            cheapestPrice: undefined,
            cheapestSupermarket: undefined,
            cheapestAmount: undefined,
          };
          consola.log(`Merged item: ${stdItem.ingredientName}`);
          itemsAddedOrMergedCount++;
        } else {
          // --- Add new item (already structured by API) ---
          shoppingListItems.value.push({
            ...stdItem, // Spread the item received from the API
            // Ensure timestamps are Date objects (API should return strings)
            createdAt: new Date(stdItem.createdAt),
            updatedAt: new Date(stdItem.updatedAt),
          });
          consola.log(`Added new item: ${stdItem.ingredientName}`);
          itemsAddedOrMergedCount++;
        }
      });

      if (itemsAddedOrMergedCount > 0) {
        toast.add({
          title: 'Items verwerkt',
          description: `${itemsAddedOrMergedCount} ${itemsAddedOrMergedCount === 1 ? 'item' : 'items'} toegevoegd of samengevoegd.`,
          icon: 'i-heroicons-check-circle',
        });
        // Optionally trigger price fetch or optimization after adding
        // optimizeAndFetchPrices();
      }
    } catch (error) {
      consola.error(
        'Error during item standardization or merging:',
        error
      );
      toast.add({
        id: 'standardize-error-toast',
        title: 'Fout bij verwerken',
        description:
          'Kon de ingevoerde boodschappen niet verwerken. Controleer de server logs.',
        color: 'red',
      });
      itemsAddedOrMergedCount = 0; // Reset count on error
    } finally {
      isStandardizingItems.value = false; // Clear loading state
      consola.info('Finished standardization process.');
    }

    return itemsAddedOrMergedCount; // Return the count of processed items
  };
  // --- End addItemsFromText ---

  // --- New function to handle optimization and subsequent price fetch ---
  const optimizeAndFetchPrices = async () => {
    const optimizingToastId = 'optimizing-list-toast'; // Define ID for the toast

    if (isOptimizingList.value) {
      consola.warn('Optimization already in progress.');
      // Don't add a new toast if one is likely already showing
      return;
    }
    if (shoppingListItems.value.length === 0) {
      consola.info('Shopping list is empty, skipping optimization.');
      return; // No need to optimize an empty list
    }

    isOptimizingList.value = true;
    consola.info('Optimizing shopping list and fetching prices...');
    toast.add({
      id: optimizingToastId, // Use the defined ID
      title: 'Boodschappenlijst opschonen...',
      description: 'Samenvoegen en standaardiseren...', // Optional slightly different description
      icon: 'i-heroicons-sparkles',
    });

    try {
      const currentItems = JSON.parse(
        JSON.stringify(shoppingListItems.value)
      ); // Deep clone
      const optimizedList: ShoppingListItem[] = await $fetch(
        '/api/shopping-list/clean-up',
        {
          method: 'POST',
          body: currentItems,
        }
      );

      replaceList(optimizedList); // Update the list internally
      consola.success('Shopping list optimized successfully.');
      // Toast for optimization success is handled implicitly by price fetching starting/succeeding

      // Remove the 'optimizing' toast before starting price fetch
      toast.remove(optimizingToastId);

      // *Immediately* fetch prices after optimization
      await fetchCheapestProducts();
    } catch (error) {
      consola.error('Error during list optimization:', error);
      // Ensure the 'optimizing' toast is removed on error too
      toast.remove(optimizingToastId);
      toast.add({
        id: 'list-optimize-error-toast',
        title: 'Fout bij optimaliseren',
        description:
          'Kon de boodschappenlijst niet automatisch opschonen.',
        color: 'red',
      });
    } finally {
      isOptimizingList.value = false; // Clear optimization loading state
      // Ensure the toast is removed if the finally block is reached for any other reason
      // although it should already be removed in try/catch blocks
      toast.remove(optimizingToastId);
    }
  };
  // --- End optimizeAndFetchPrices ---

  return {
    items,
    isLoadingPrices,
    isOptimizingList,
    isStandardizingItems,
    addIngredients,
    updateItem,
    deleteItem,
    clearList,
    fetchCheapestProducts,
    optimizeAndFetchPrices,
    addItemsFromText,
  };
}
