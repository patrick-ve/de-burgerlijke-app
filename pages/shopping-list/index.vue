<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { useShoppingList } from '~/composables/useShoppingList';
import type { ShoppingListItem } from '~/types/shopping-list';
import { useHeaderState } from '~/composables/useHeaderState';

// Use the composable to get shopping list state and actions
const {
  items: shoppingListItems,
  updateItem,
  deleteItem,
  clearList,
} = useShoppingList();
const { headerState, setHeader } = useHeaderState();
const isMounted = ref(false);
const isClearConfirmationModalOpen = ref(false);

// Define Head for the page
useHead({
  title: 'Boodschappenlijst',
});

// Handle item updates (e.g., checking/unchecking)
const handleItemUpdate = (item: ShoppingListItem) => {
  updateItem(item);
};

// Handle item deletion
const handleItemDelete = (itemId: string) => {
  deleteItem(itemId);
};

// Handler to trigger the action stored in state
const triggerRightAction = () => {
  isClearConfirmationModalOpen.value = true;
};

const confirmClearList = () => {
  clearList();
  isClearConfirmationModalOpen.value = false;
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
        @delete="handleItemDelete"
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

    <!-- Confirmation Modal -->
    <UModal
      v-model="isClearConfirmationModalOpen"
      :ui="{
        base: '-translate-y-64',
        overlay: {
          background: 'bg-black/40 backdrop-blur-sm',
        },
      }"
    >
      <UCard
        :ui="{
          ring: '',
          divide: 'divide-y divide-gray-100',
        }"
      >
        <template #header>
          <h3 class="text-lg font-semibold">Weet je het zeker?</h3>
        </template>

        <p class="text-gray-600">
          Wil je de boodschappenlijst echt helemaal leegmaken? Deze
          actie kan niet ongedaan worden gemaakt.
        </p>

        <template #footer>
          <div class="flex justify-end space-x-3">
            <UButton
              label="Annuleren"
              color="gray"
              variant="ghost"
              @click="isClearConfirmationModalOpen = false"
            />
            <UButton
              label="Bevestigen"
              color="red"
              @click="confirmClearList"
            />
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>
