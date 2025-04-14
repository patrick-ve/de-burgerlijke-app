<script setup lang="ts">
import type { ShoppingListItem } from '~/types/shopping-list';

const props = defineProps<{
  items: ShoppingListItem[];
}>();

const emit = defineEmits<{
  (e: 'update:item', item: ShoppingListItem): void;
}>();

// Function to handle checkbox changes and emit update
const handleCheckChange = (
  item: ShoppingListItem,
  isChecked: boolean
) => {
  // Emit the entire item object with the updated check status
  emit('update:item', { ...item, isChecked });
};

// Helper to format quantity and unit nicely
const formatItemDetails = (item: ShoppingListItem): string => {
  let details = '';
  if (
    item.aggregatedQuantity !== null &&
    item.aggregatedQuantity !== undefined
  ) {
    details += `${item.aggregatedQuantity}`;
  }
  if (item.unit) {
    details += `${details ? ' ' : ''}${item.unit}`;
  }
  return details.trim(); // Return quantity and unit, or empty string if neither exists
};
</script>

<template>
  <div v-if="items.length > 0" class="space-y-2">
    <ul data-testid="shopping-list">
      <li
        v-for="item in items"
        :key="item.id"
        class="flex items-center gap-3 p-3 border border-gray-200 rounded-md bg-white shadow-sm transition-colors"
        :class="{
          'bg-gray-50 opacity-70': item.isChecked,
        }"
        data-testid="shopping-list-item"
      >
        <UCheckbox
          :model-value="item.isChecked"
          @update:model-value="
            (checked) => handleCheckChange(item, checked)
          "
          :aria-label="`Mark ${item.ingredientName} as ${item.isChecked ? 'incomplete' : 'complete'}`"
          data-testid="item-checkbox"
          :ui="{ base: 'flex-shrink-0' }"
        />
        <div class="flex-1 min-w-0">
          <p
            class="text-sm font-medium text-gray-900 truncate"
            :class="{ 'line-through text-gray-500': item.isChecked }"
            data-testid="item-name"
          >
            {{ item.ingredientName }}
          </p>
          <p
            class="text-xs text-gray-500"
            :class="{ 'line-through': item.isChecked }"
            data-testid="item-details"
          >
            {{ formatItemDetails(item) }}
          </p>
        </div>
        <!-- Placeholder for price info/actions -->
        <!-- <div class="ml-auto"> ... </div> -->
      </li>
    </ul>
  </div>
  <div
    v-else
    class="text-center text-gray-500 py-6"
    data-testid="empty-list-message"
  >
    Je boodschappenlijst is leeg.
  </div>
</template>
