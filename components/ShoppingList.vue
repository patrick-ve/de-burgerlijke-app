<script setup lang="ts">
import { computed } from 'vue';
import type { ShoppingListItem } from '~/types/shopping-list';
import { ingredientCategories } from '~/types/recipe';
import type { IngredientCategory } from '~/types/recipe';

// --- Emoji mapping for categories ---
const categoryEmojis: Record<IngredientCategory | 'Other', string> = {
  Fruit: '🍎',
  Vegetables: '🥕',
  'Pasta & Rice': '🍝',
  'Meals & Salads': '🥗',
  'Deli & Cheese': '🧀',
  'Meat & Fish': '🥩',
  'Plant-Based': '🌱',
  'Dairy & Eggs': '🥛',
  Bakery: '🍞',
  'Breakfast & Spreads': '🥣',
  'Sweets & Confectionery': '🍫',
  'Snacks & Nuts': '🥜',
  Beverages: '🥤',
  Pantry: '🥫',
  'Spices & Seasonings': '🧂',
  Nutrition: '💪',
  Frozen: '🧊',
  Alcohol: '🍷',
  Pharmacy: '💊',
  'Personal Care': '🧴',
  'Baby & Child': '👶',
  Household: '🧼',
  Pet: '🐾',
  Leisure: '🪁',
  Other: '🛒', // Default/Other category
};
// --- End Emoji Mapping ---

const props = defineProps<{
  items: ShoppingListItem[];
}>();

const emit = defineEmits<{
  (e: 'update:item', item: ShoppingListItem): void;
  (e: 'delete', id: string): void;
}>();

// --- Group items by category ---
const groupedItems = computed(() => {
  const groups: Record<string, ShoppingListItem[]> = {};

  // Initialize groups based on predefined order, adding an 'Other' category
  const categoryOrder: (IngredientCategory | 'Other')[] = [
    ...ingredientCategories,
    'Other',
  ];
  categoryOrder.forEach((category) => {
    groups[category] = [];
  });

  // Group items
  props.items.forEach((item) => {
    const categoryKey = item.category ?? 'Other';
    if (groups[categoryKey]) {
      // Should always exist due to initialization
      groups[categoryKey].push(item);
    } else {
      // Fallback just in case, though unlikely with initialization
      groups['Other'].push(item);
    }
  });

  // Filter out empty categories and return the sorted record
  const filteredGroups: Record<string, ShoppingListItem[]> = {};
  categoryOrder.forEach((category) => {
    if (groups[category].length > 0) {
      filteredGroups[category] = groups[category];
    }
  });

  return filteredGroups;
});
// --- End Grouping ---

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
  <div v-if="items.length > 0" class="space-y-4">
    <div
      v-for="(categoryItems, category) in groupedItems"
      :key="category"
    >
      <h2
        v-if="categoryItems.length > 0"
        class="text-lg font-semibold mb-2 px-2 text-gray-700 flex items-center gap-2"
      >
        <span class="text-xl">{{
          categoryEmojis[category as IngredientCategory | 'Other']
        }}</span>
        <span>{{ category }}</span>
      </h2>
      <TransitionGroup
        tag="ul"
        name="list"
        :data-testid="`shopping-list-category-${category}`"
        class="space-y-1 relative"
      >
        <li
          v-for="item in categoryItems"
          :key="item.id"
          class="flex items-center gap-3 py-1 px-2 border border-gray-200 rounded-md bg-white shadow-sm transition-colors"
          :class="{
            'bg-gray-50 opacity-70': item.isChecked,
          }"
          data-testid="shopping-list-item"
        >
          <UCheckbox
            :model-value="item.isChecked"
            @update:model-value="
              (checked: boolean) => handleCheckChange(item, checked)
            "
            :aria-label="`Mark ${item.ingredientName} as ${item.isChecked ? 'incomplete' : 'complete'}`"
            data-testid="item-checkbox"
            :ui="{ base: 'flex-shrink-0' }"
          />
          <div class="flex-1 min-w-0">
            <p
              class="text-sm font-medium text-gray-900 truncate"
              :class="{
                'line-through text-gray-500': item.isChecked,
              }"
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
          <UButton
            icon="i-heroicons-trash"
            size="xs"
            color="red"
            variant="ghost"
            square
            :aria-label="`Verwijder ${item.ingredientName}`"
            data-testid="delete-item-button"
            @click="emit('delete', item.id)"
            class="ml-auto flex-shrink-0"
          />
        </li>
      </TransitionGroup>
    </div>
  </div>
  <div
    v-else
    class="text-center text-gray-500 py-6"
    data-testid="empty-list-message"
  >
    Je boodschappenlijst is leeg.
  </div>
</template>

<style scoped>
/* Leave animation */
.list-leave-active {
  transition: all 0.3s ease;
  position: absolute; /* Important for smooth transition of remaining items */
  width: 100%; /* Prevent item collapse during transition */
}
.list-leave-to {
  opacity: 0;
  transform: translateX(20px) scaleY(0.8); /* Example: Slide right and shrink slightly */
}

/* Move transition for reordering items smoothly */
.list-move {
  transition: transform 0.3s ease;
}
</style>
