<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { useShoppingList } from '~/composables/useShoppingList';
import type { ShoppingListItem } from '~/types/shopping-list';
import { useHeaderState } from '~/composables/useHeaderState';

// Use the composable to get shopping list state and actions
const {
  items: shoppingListItems,
  updateItem,
  clearList,
} = useShoppingList();
const { headerState, setHeader } = useHeaderState();
const isMounted = ref(false);

// Define Head for the page
useHead({
  title: 'Boodschappenlijst',
});

// Handle item updates (e.g., checking/unchecking)
const handleItemUpdate = (item: ShoppingListItem) => {
  updateItem(item);
};

// Handler to trigger the action stored in state
const triggerRightAction = () => {
  if (headerState.value.rightActionHandler) {
    headerState.value.rightActionHandler();
  }
};

onMounted(async () => {
  await nextTick();
  isMounted.value = true;

  setHeader({
    title: 'Boodschappenlijst',
    showRightAction: true,
    rightActionHandler: clearList,
  });
});
</script>

<template>
  <div>
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

    <!-- Teleport Clear button to the header -->
    <Teleport to="#header-right-action" v-if="isMounted">
      <UButton
        v-if="
          headerState.showRightAction && shoppingListItems.length > 0
        "
        color="red"
        aria-label="Maak lijst leeg"
        label="Maak leeg"
        class="font-bold text-xs"
        @click="triggerRightAction"
      />
    </Teleport>
  </div>
</template>
