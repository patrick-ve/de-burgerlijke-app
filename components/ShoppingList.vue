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
  Oils: '🍳',
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

// --- Dutch Category Translations ---
const categoryTranslations: Record<
  IngredientCategory | 'Other',
  string
> = {
  Fruit: 'Fruit',
  Vegetables: 'Groenten',
  'Pasta & Rice': 'Pasta & rijst',
  'Meals & Salads': 'Maaltijden & salades',
  'Deli & Cheese': 'Vleeswaren & kaas',
  'Meat & Fish': 'Vlees & vis',
  'Plant-Based': 'Plantaardig',
  'Dairy & Eggs': 'Zuivel & eieren',
  Bakery: 'Bakkerij',
  'Breakfast & Spreads': 'Ontbijt & broodbeleg',
  'Sweets & Confectionery': 'Snoep & zoetwaren',
  'Snacks & Nuts': 'Snacks & noten',
  Beverages: 'Dranken',
  Pantry: 'Voorraadkast',
  'Spices & Seasonings': 'Kruiden & specerijen',
  Nutrition: 'Voeding',
  Oils: 'Olie',
  Frozen: 'Diepvries',
  Alcohol: 'Alcohol',
  Pharmacy: 'Drogisterij',
  'Personal Care': 'Persoonlijke verzorging',
  'Baby & Child': 'Baby & kind',
  Household: 'Huishouden',
  Pet: 'Huisdier',
  Leisure: 'Vrije tijd',
  Other: 'Overig', // Default/Other category
};
// --- End Dutch Translations ---

const props = defineProps<{
  items: ShoppingListItem[];
  isLoading?: boolean; // Add isLoading prop (optional)
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

// --- Calculate Grand Total ---
const grandTotal = computed(() => {
  return props.items.reduce((total, item) => {
    // Add price if item has a cheapest price
    if (item.cheapestPrice != null) {
      return total + item.cheapestPrice;
    }
    return total;
  }, 0);
});
// --- End Grand Total ---

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

// Helper function to format currency
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
};
</script>

<template>
  <!-- Loading Skeleton -->
  <div v-if="isLoading" class="space-y-4">
    <!-- Simulate category headers and items -->
    <div v-for="i in 3" :key="`skel-cat-${i}`" class="space-y-3">
      <USkeleton class="h-6 w-1/3" />
      <!-- Category header -->
      <div
        v-for="j in 4"
        :key="`skel-item-${i}-${j}`"
        class="flex items-center gap-3 py-1 px-2"
      >
        <USkeleton class="h-5 w-5 rounded" />
        <!-- Checkbox -->
        <div class="flex-1 space-y-1">
          <USkeleton class="h-4 w-2/3" />
          <!-- Item name -->
          <USkeleton class="h-3 w-1/4" />
          <!-- Item details -->
          <USkeleton class="h-3 w-1/2" />
          <!-- Price info -->
        </div>
        <USkeleton class="h-6 w-6" />
        <!-- Delete button -->
      </div>
    </div>
  </div>

  <!-- Actual List Content -->
  <div v-else-if="items.length > 0" class="space-y-4">
    <!-- Grand Total Display -->
    <div
      v-if="grandTotal > 0"
      class="mt-4 px-2 text-right font-semibold text-gray-800"
    >
      Totaal goedkoopste opties: {{ formatCurrency(grandTotal) }}
    </div>

    <div
      v-for="(categoryItems, category) in groupedItems"
      :key="category"
    >
      <h2
        v-if="categoryItems.length > 0"
        class="text-lg font-bold mb-2 px-2 text-gray-700 flex items-center gap-2"
      >
        <span class="text-xl">{{
          categoryEmojis[category as IngredientCategory | 'Other']
        }}</span>
        <span>{{
          categoryTranslations[
            category as IngredientCategory | 'Other'
          ]
        }}</span>
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
            <!-- Display Cheapest Price Info -->
            <div
              v-if="item.cheapestPrice"
              class="text-xs mt-1"
              :class="{
                'line-through text-gray-400': item.isChecked,
                'text-green-700': !item.isChecked,
              }"
              data-testid="item-cheapest-price"
            >
              {{ formatCurrency(item.cheapestPrice) }} bij
              <span class="font-medium capitalize">{{
                item.cheapestSupermarket
              }}</span>
              <span v-if="item.cheapestAmount"
                >({{ item.cheapestAmount }})</span
              >
            </div>
            <!-- End Cheapest Price Info -->
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

  <!-- Grand Total Display -->
  <div
    class="mt-6 pt-4 border-t border-gray-200 px-2"
    data-testid="grand-total-section"
  >
    <p class="text-right text-lg font-semibold text-gray-800">
      Totaal:
      <span class="ml-2" data-testid="grand-total-amount">{{
        formatCurrency(grandTotal)
      }}</span>
    </p>
  </div>
  <!-- End Grand Total -->
</template>

<style scoped>
/* List transition animations */
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* Ensure leaving items are taken out of layout flow */
.list-leave-active {
  position: absolute;
  width: calc(
    100% - 1rem
  ); /* Adjust based on padding/margins if needed */
}
</style>
