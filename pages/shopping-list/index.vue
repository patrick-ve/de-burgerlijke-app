<script setup lang="ts">
import { useShoppingList } from '~/composables/useShoppingList';
import type { ShoppingListItem } from '~/types/shopping-list';

// Use the composable to get shopping list state and actions
const { items: shoppingListItems, updateItem } = useShoppingList();

// Define Head for the page
useHead({
  title: 'Boodschappenlijst',
});

// Handle item updates (e.g., checking/unchecking)
const handleItemUpdate = (item: ShoppingListItem) => {
  updateItem(item);
};

// TODO: Add functionality for clearing the list, saving, etc.
</script>

<template>
  <div>
    <TheHeader title="Boodschappenlijst" />

    <UContainer class="py-4">
      <!-- Pass items to the ShoppingList component and listen for updates -->
      <ShoppingList
        :items="shoppingListItems"
        @update:item="handleItemUpdate"
      />

      <!-- Placeholder for Actions -->
      <div
        v-if="shoppingListItems.length > 0"
        class="mt-6 flex justify-end"
      >
        <!-- <UButton label="Lijst legen" color="red" variant="outline" /> -->
        <!-- <UButton label="Prijzen ophalen" class="ml-2" /> -->
      </div>
    </UContainer>

    <BottomNav />
  </div>
</template>
