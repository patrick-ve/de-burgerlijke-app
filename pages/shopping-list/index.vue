<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue';
import { useShoppingList } from '~/composables/useShoppingList';
import type { ShoppingListItem } from '~/types/shopping-list';
import { useHeaderState } from '~/composables/useHeaderState';
import { useOnboardingSettings } from '~/composables/useOnboardingSettings';
import { consola } from 'consola';
import { ingredientCategories } from '~/types/recipe';
import type { IngredientCategory } from '~/types/recipe';
import type { SupermarketName } from '~/composables/useOnboardingSettings';
import { useMouse, useWindowScroll } from '@vueuse/core';
import { unref } from 'vue';
import type { VirtualElement } from '@popperjs/core';

// Define the key used for items without a price/supermarket
const noSupermarketKey = 'Nog geen prijs gevonden';

// Interface for the single product object returned by the API
interface Product {
  id: string;
  name: string;
  price: number;
  amount: string | null;
  distance: number; // Represents similarity score from API
  standardized_price_per_unit: number | null; // Allow null
  standardized_unit: string | null; // Allow null
  supermarketName: string;
}

// --- Supermarket Definitions (from OnboardingModal.vue) ---
// Interface for the supermarket data structure
interface Supermarket {
  id: SupermarketName;
  name: string;
  ico: string;
}

const supermarkets: Supermarket[] = [
  {
    id: 'ah',
    name: 'Albert Heijn',
    ico: 'https://www.ah.nl/favicon.ico',
  },
  {
    id: 'jumbo',
    name: 'Jumbo',
    ico: 'https://www.jumbo.com/INTERSHOP/static/WFS/Jumbo-Grocery-Site/-/-/nl_NL/images/favicon.ico',
  },
  {
    id: 'plus',
    name: 'PLUS',
    ico: 'https://www.werkenbijplus.nl/WBP/img/plusMarker.png',
  },
  {
    id: 'dirk',
    name: 'Dirk',
    ico: 'https://d3r3h30p75xj6a.cloudfront.net/static-images/dirk/web/app_icon.png',
  },
  {
    id: 'aldi',
    name: 'ALDI',
    ico: 'https://play-lh.googleusercontent.com/SacQDsmttU6UOYjVLls5a7mvUYCS5yMEZt5XF6m0zUq34mrSf9O5vZBDPazxk4RBPCA=w240-h480',
  },
  {
    id: 'coop',
    name: 'Coop',
    ico: 'https://www.coop.nl/assets/themes/custom/img/logo_apple_180x180.png',
  },
  {
    id: 'hoogvliet',
    name: 'Hoogvliet',
    ico: 'https://www.hoogvliet.com/INTERSHOP/static/WFS/org-webshop-Site/-/-/nl_NL/img/smart_banner_icon.png',
  },
  {
    id: 'vomar',
    name: 'Vomar',
    ico: 'https://www.vomar.nl/apple-touch-icon.png',
  },
  {
    id: 'dekamarkt',
    name: 'DekaMarkt',
    ico: 'https://d3r3h30p75xj6a.cloudfront.net/static-images/deka/web/favicon.svg',
  },
];

// Helper to find supermarket details by name (or key)
const getSupermarketDetails = (
  key: string
): Supermarket | undefined => {
  // Attempt to match by ID first (more reliable if key is the ID)
  const foundById = supermarkets.find((s) => s.id === key);
  if (foundById) return foundById;
  // Fallback: attempt to match by name (case-insensitive)
  return supermarkets.find(
    (s) => s.name.toLowerCase() === key.toLowerCase()
  );
};
// --- End Supermarket Definitions ---

// Type for the actual API response
type ApiReturnType = Record<string, Product | null>;

// --- Category Definitions (similar to ShoppingList.vue) ---
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
// --- End Category Definitions ---

// Use the composable to get shopping list state and actions
const {
  items: shoppingListItems,
  updateItem,
  deleteItem,
  clearList,
  isLoadingPrices,
  isOptimizingList,
  addItemsFromText,
  isStandardizingItems,
} = useShoppingList();
const { headerState, setHeader } = useHeaderState();
const { selectedSupermarketIds } = useOnboardingSettings();
const isMounted = ref(false);
const isClearConfirmationModalOpen = ref(false);
const toast = useToast();

// --- State for Add Items Modal ---
const isAddItemModalOpen = ref(false);
const addItemTextAreaValue = ref('');
// --- End Add Items Modal State ---

// --- Context Menu State ---
const isContextMenuOpen = ref(false);
const { x, y } = useMouse();
const { y: windowY } = useWindowScroll();
const virtualElement = ref<VirtualElement>({
  getBoundingClientRect: () => ({
    width: 0,
    height: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  }),
});
// --- End Context Menu State ---

// --- State for View Mode ---
const isSupermarketViewActive = ref(true);
const viewModeType = computed<'supermarket' | 'category'>(() =>
  isSupermarketViewActive.value ? 'supermarket' : 'category'
);
// --- End View Mode State ---

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
  if (headerState.value.rightActionHandler) {
    headerState.value.rightActionHandler();
  }
};

const confirmClearList = () => {
  clearList();
  isClearConfirmationModalOpen.value = false;
};

// Function to open the context menu using mouse coordinates
const openContextMenu = () => {
  const top = unref(y) - unref(windowY);
  const left = unref(x);

  virtualElement.value.getBoundingClientRect = () => ({
    width: 0,
    height: 0,
    top,
    left,
    right: left,
    bottom: top,
    x: left,
    y: top,
    toJSON: () => JSON.stringify(this),
  });

  isContextMenuOpen.value = true;
};

// Function to copy shopping list to clipboard
const copyShoppingListToClipboard = () => {
  isContextMenuOpen.value = false;
  const uncheckedItems = shoppingListItems.value.filter(
    (item) => !item.isChecked
  );

  if (uncheckedItems.length === 0) {
    toast.add({
      title: 'Lijst is leeg',
      description: 'Geen items om te kopiëren.',
      icon: 'i-heroicons-exclamation-triangle',
      color: 'orange',
    });
    return;
  }

  const listText = uncheckedItems
    .map((item) => {
      const parts = [];
      if (item.aggregatedQuantity) {
        parts.push(item.aggregatedQuantity);
      }
      if (item.unit) {
        parts.push(item.unit);
      }
      parts.push(item.ingredientName);
      return parts.join(' ');
    })
    .join('\n');

  navigator.clipboard
    .writeText(listText)
    .then(() => {
      toast.add({
        title: 'Gekopieerd!',
        description: 'Boodschappenlijst gekopieerd naar klembord.',
        icon: 'i-heroicons-clipboard-document-check',
      });
    })
    .catch((err) => {
      console.error('Failed to copy list:', err);
      toast.add({
        title: 'Kopiëren mislukt',
        description: 'Kon de lijst niet naar het klembord kopiëren.',
        icon: 'i-heroicons-exclamation-circle',
        color: 'red',
      });
    });
};

// --- Function to handle adding items from modal ---
const handleAddItemsFromModal = async () => {
  const itemsAdded = await addItemsFromText(
    addItemTextAreaValue.value
  );
  if (itemsAdded > 0) {
    // Clear textarea and close modal only if items were added
    addItemTextAreaValue.value = '';
    isAddItemModalOpen.value = false;
    // Optionally trigger price fetch after adding items
    // fetchCheapestProducts(); // Consider if this should be automatic
  }
  // If itemsAdded is 0, the toast is handled within addItemsFromText
  // and the modal remains open for the user to correct input.
};
// --- End Add Items Modal Handler ---

// --- Group items by Supermarket AND Category (for UNCHECKED items) ---
const groupedBySupermarketAndCategory = computed(() => {
  const groups: Record<
    string,
    Record<string, ShoppingListItem[]>
  > = {};
  const categoryOrder: (IngredientCategory | 'Other')[] = [
    ...ingredientCategories,
    'Other',
  ];

  shoppingListItems.value.forEach((item) => {
    // Group ALL items (checked and unchecked)
    if (!item.isChecked) {
      const supermarketKey =
        item.cheapestSupermarket || noSupermarketKey;
      const categoryKey = item.category ?? 'Other';

      // Ensure supermarket group exists
      if (!groups[supermarketKey]) {
        groups[supermarketKey] = {};
        // Initialize all categories within the new supermarket group
        categoryOrder.forEach((cat) => {
          groups[supermarketKey][cat] = [];
        });
      }

      // Ensure category group exists (should always exist due to initialization)
      if (!groups[supermarketKey][categoryKey]) {
        groups[supermarketKey][categoryKey] = []; // Fallback just in case
      }

      groups[supermarketKey][categoryKey].push(item);
    } else {
      // Handle CHECKED items - group them by their *last known* supermarket if possible,
      // otherwise put them in the 'No Price' group for consistency.
      // They will be visually distinct in the template.
      const supermarketKey =
        item.cheapestSupermarket || noSupermarketKey;
      const categoryKey = item.category ?? 'Other';

      if (!groups[supermarketKey]) {
        groups[supermarketKey] = {};
        categoryOrder.forEach((cat) => {
          groups[supermarketKey][cat] = [];
        });
      }
      if (!groups[supermarketKey][categoryKey]) {
        groups[supermarketKey][categoryKey] = [];
      }
      groups[supermarketKey][categoryKey].push(item);
    }
  });

  // Sort supermarkets (alphabetically, with 'No Price' last)
  const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
    if (a === noSupermarketKey) return 1;
    if (b === noSupermarketKey) return -1;
    return a.localeCompare(b);
  });

  // Create the final sorted structure
  const sortedGroups: Record<
    string,
    Record<string, ShoppingListItem[]>
  > = {};
  sortedGroupKeys.forEach((key) => {
    sortedGroups[key] = groups[key];

    // Filter out empty categories within this supermarket group
    const filteredCategories: Record<string, ShoppingListItem[]> = {};
    categoryOrder.forEach((cat) => {
      if (groups[key][cat] && groups[key][cat].length > 0) {
        filteredCategories[cat] = groups[key][cat];
      }
    });
    sortedGroups[key] = filteredCategories;
  });

  return sortedGroups;
});

// --- NEW: Group items ONLY by Category ---
const groupedByCategoryOnly = computed(() => {
  const groups: Record<string, ShoppingListItem[]> = {};
  const categoryOrder: (IngredientCategory | 'Other')[] = [
    ...ingredientCategories,
    'Other',
  ];

  // Initialize groups for all categories first to maintain order
  categoryOrder.forEach((cat) => {
    groups[cat] = [];
  });

  shoppingListItems.value.forEach((item) => {
    const categoryKey = item.category ?? 'Other';
    // Ensure category group exists (it should due to initialization)
    if (!groups[categoryKey]) {
      groups[categoryKey] = []; // Fallback just in case
      console.warn(
        `Unexpected category key encountered: ${categoryKey}`
      );
    }
    groups[categoryKey].push(item);
  });

  // Filter out empty categories
  const filteredGroups: Record<string, ShoppingListItem[]> = {};
  categoryOrder.forEach((cat) => {
    if (groups[cat] && groups[cat].length > 0) {
      filteredGroups[cat] = groups[cat];
    }
  });

  return filteredGroups;
});
// --- End Group by Category Only ---

// --- Calculate Grand Total for ALL Items with Prices ---
const grandTotal = computed(() => {
  return shoppingListItems.value.reduce((total, item) => {
    if (item.cheapestPrice != null) {
      return total + item.cheapestPrice;
    }
    return total;
  }, 0);
});

// Helper function to format currency (can be moved to a composable later)
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
};

onMounted(async () => {
  await nextTick();
  isMounted.value = true;

  setHeader({
    title: 'Boodschappenlijst',
    showLeftAction: true,
    showRightAction: true,
    leftActionHandler: () => router.push('/'),
    rightActionHandler: openContextMenu,
  });
});

const router = useRouter();

const showActionBar = ref(false);
onMounted(() => {
  showActionBar.value = true;
});
</script>

<template>
  <div class="relative pb-20">
    <UContainer class="py-4">
      <div
        v-if="isOptimizingList"
        class="fixed inset-x-0 top-0 z-50 p-4 flex justify-center pointer-events-none"
      >
        <UAlert
          icon="i-heroicons-sparkles"
          color="primary"
          variant="solid"
          title="Lijst optimaliseren..."
          description="Bezig met opschonen en samenvoegen."
          class="shadow-lg max-w-md"
        />
      </div>

      <div v-if="shoppingListItems.length > 0" class="space-y-4">
        <!-- Controls: View Toggle and Grand Total -->
        <div
          v-if="shoppingListItems.length > 0"
          class="mb-4 flex justify-between items-center px-2"
        >
          <!-- View Mode Toggle -->
          <div class="flex items-center justify-center gap-4">
            <span
              class="text-sm text-gray-500 text-primary font-semibold"
              >Weergave:</span
            >
            <UToggle
              v-model="isSupermarketViewActive"
              size="md"
              on-icon="i-heroicons-currency-euro"
              off-icon="i-heroicons-list-bullet"
              aria-label="Wissel weergave tussen supermarkt en categorie"
              data-testid="view-mode-toggle"
              :ui="{
                container: {
                  base: 'translate-y-0.5 translate-x-0.5',
                },
                inactive: '-translate-x-2',
              }"
            />
          </div>

          <!-- Grand Total (now on the right) -->
          <div
            v-if="grandTotal > 0 && viewModeType === 'supermarket'"
            class="text-right font-semibold text-gray-800 text-lg"
          >
            Totaal:
            {{ formatCurrency(grandTotal) }}
          </div>
          <!-- No placeholder needed when total is on the right -->
        </div>

        <!-- View 1: Grouped by Supermarket -->
        <Transition
          name="view-transition"
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="opacity-0 transform scale-95"
          enter-to-class="opacity-100 transform scale-100"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="opacity-100 transform scale-100"
          leave-to-class="opacity-0 transform scale-95"
          mode="out-in"
        >
          <div
            v-if="viewModeType === 'supermarket'"
            key="supermarket-view"
            class="space-y-4"
          >
            <UCard
              v-for="(
                categories, supermarket
              ) in groupedBySupermarketAndCategory"
              :key="supermarket"
              :ui="{
                header: { padding: 'px-4 py-1 sm:px-6' },
                body: { padding: 'px-4 pt-0 pb-1 sm:px-6' },
              }"
            >
              <template #header>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <img
                      v-if="getSupermarketDetails(supermarket)?.ico"
                      :src="getSupermarketDetails(supermarket)?.ico"
                      :alt="
                        getSupermarketDetails(supermarket)?.name ??
                        supermarket
                      "
                      class="h-5 w-5"
                    />
                    <h3
                      class="text-base font-semibold leading-6 text-gray-900"
                    >
                      {{
                        getSupermarketDetails(supermarket)?.name ??
                        supermarket
                      }}
                    </h3>
                  </div>
                  <span
                    v-if="supermarket !== noSupermarketKey"
                    class="text-sm font-semibold text-gray-700"
                  >
                    {{
                      formatCurrency(
                        Object.values(categories)
                          .flat()
                          .reduce(
                            (sum, item) =>
                              sum +
                              (item.cheapestPrice != null
                                ? item.cheapestPrice
                                : 0),
                            0
                          )
                      )
                    }}
                  </span>
                </div>
              </template>

              <ul
                v-for="(items, category) in categories"
                :key="category"
                class="py-2 divide-y divide-gray-100"
              >
                <h4
                  v-if="items.length > 0"
                  class="text-sm font-semibold px-0 text-gray-600 flex items-center gap-2"
                >
                  <span class="text-base">{{
                    categoryEmojis[
                      category as IngredientCategory | 'Other'
                    ]
                  }}</span>
                  <span>{{
                    categoryTranslations[
                      category as IngredientCategory | 'Other'
                    ]
                  }}</span>
                </h4>

                <li
                  v-for="item in items"
                  :key="item.id"
                  class="flex items-center justify-between gap-3 py-1.5 pl-1 transition-opacity"
                  :class="{ 'opacity-50': item.isChecked }"
                  data-testid="shopping-list-item-supermarket-view"
                >
                  <div class="flex items-center gap-3 flex-1 min-w-0">
                    <UCheckbox
                      :model-value="item.isChecked"
                      @update:model-value="
                        handleItemUpdate({
                          ...item,
                          isChecked: $event,
                        })
                      "
                      :aria-label="`Mark ${item.ingredientName} as ${item.isChecked ? 'incomplete' : 'complete'}`"
                      data-testid="item-checkbox"
                      :ui="{ base: 'flex-shrink-0 w-5 h-5' }"
                    />
                    <div class="flex-1 min-w-0">
                      <p
                        class="text-sm font-medium text-gray-900 truncate"
                        :class="{
                          'line-through text-gray-500':
                            item.isChecked,
                        }"
                        data-testid="item-name"
                      >
                        {{ item.ingredientName }}
                      </p>
                      <p class="text-xs text-gray-500">
                        <span v-if="item.aggregatedQuantity">{{
                          item.aggregatedQuantity
                        }}</span>
                        <span v-if="item.unit"> {{ item.unit }}</span>
                        <span
                          v-if="
                            item.cheapestAmount &&
                            supermarket !== 'Nog geen prijs gevonden'
                          "
                        >
                          - {{ item.cheapestAmount }}</span
                        >
                      </p>
                    </div>
                  </div>

                  <div
                    class="flex items-center gap-2 flex-shrink-0"
                    :class="{ 'opacity-50': item.isChecked }"
                  >
                    <span
                      v-if="item.cheapestPrice != null"
                      class="text-sm font-medium text-gray-900"
                      :class="{
                        'line-through text-gray-500': item.isChecked,
                      }"
                      data-testid="item-price"
                    >
                      {{ formatCurrency(item.cheapestPrice) }}
                    </span>
                    <span
                      v-else-if="
                        !item.isChecked &&
                        supermarket !== noSupermarketKey
                      "
                      class="flex items-center gap-1 text-sm text-gray-500"
                      aria-label="Prijs laden"
                    >
                      <span>€</span>
                      <USkeleton
                        class="h-4 w-10"
                        :ui="{
                          background: 'bg-primary-100',
                        }"
                      />
                    </span>
                    <span
                      v-else-if="
                        item.isChecked &&
                        item.cheapestPrice == null &&
                        supermarket !== noSupermarketKey
                      "
                      class="text-xs text-gray-400 italic"
                    >
                      Geen prijs
                    </span>
                    <span
                      v-else-if="
                        !item.isChecked &&
                        supermarket === noSupermarketKey
                      "
                      class="w-[44px]"
                      aria-hidden="true"
                      >&nbsp;</span
                    >

                    <UButton
                      icon="i-heroicons-trash"
                      size="xs"
                      color="red"
                      variant="ghost"
                      :aria-label="`Verwijder ${item.ingredientName}`"
                      @click="handleItemDelete(item.id)"
                      data-testid="delete-item-button"
                    />
                  </div>
                </li>
              </ul>
            </UCard>
          </div>
        </Transition>

        <!-- View 2: Grouped by Category Only -->
        <Transition
          name="view-transition"
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="opacity-0 transform scale-95"
          enter-to-class="opacity-100 transform scale-100"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="opacity-100 transform scale-100"
          leave-to-class="opacity-0 transform scale-95"
          mode="out-in"
        >
          <div
            v-if="viewModeType === 'category'"
            key="category-view"
            class="space-y-4"
          >
            <UCard
              v-for="(items, category) in groupedByCategoryOnly"
              :key="category"
              :ui="{
                header: { padding: 'px-4 py-1 sm:px-6' },
                body: { padding: 'px-4 pt-0 pb-1 sm:px-6' },
              }"
            >
              <template #header>
                <h3
                  class="text-base font-semibold leading-6 text-gray-900 flex items-center gap-2"
                >
                  <span class="text-lg">{{
                    categoryEmojis[
                      category as IngredientCategory | 'Other'
                    ]
                  }}</span>
                  <span>{{
                    categoryTranslations[
                      category as IngredientCategory | 'Other'
                    ]
                  }}</span>
                </h3>
              </template>

              <ul class="py-2 divide-y divide-gray-100">
                <li
                  v-for="item in items"
                  :key="item.id"
                  class="flex items-center justify-between gap-3 py-1.5 pl-1 transition-opacity"
                  :class="{ 'opacity-50': item.isChecked }"
                  data-testid="shopping-list-item-category-view"
                >
                  <div class="flex items-center gap-3 flex-1 min-w-0">
                    <UCheckbox
                      :model-value="item.isChecked"
                      @update:model-value="
                        handleItemUpdate({
                          ...item,
                          isChecked: $event,
                        })
                      "
                      :aria-label="`Mark ${item.ingredientName} as ${item.isChecked ? 'incomplete' : 'complete'}`"
                      data-testid="item-checkbox"
                      :ui="{ base: 'flex-shrink-0 w-5 h-5' }"
                    />
                    <div class="flex-1 min-w-0">
                      <p
                        class="text-sm font-medium text-gray-900 truncate"
                        :class="{
                          'line-through text-gray-500':
                            item.isChecked,
                        }"
                        data-testid="item-name"
                      >
                        {{ item.ingredientName }}
                      </p>
                      <p class="text-xs text-gray-500">
                        <span v-if="item.aggregatedQuantity">{{
                          item.aggregatedQuantity
                        }}</span>
                        <span v-if="item.unit"> {{ item.unit }}</span>
                      </p>
                    </div>
                  </div>

                  <div
                    class="flex items-center gap-2 flex-shrink-0"
                    :class="{ 'opacity-50': item.isChecked }"
                  >
                    <UButton
                      icon="i-heroicons-trash"
                      size="xs"
                      color="red"
                      variant="ghost"
                      :aria-label="`Verwijder ${item.ingredientName}`"
                      @click="handleItemDelete(item.id)"
                      data-testid="delete-item-button"
                    />
                  </div>
                </li>
              </ul>
            </UCard>
          </div>
        </Transition>
      </div>
      <div v-else class="mt-6 text-center text-gray-500">
        Je boodschappenlijst is leeg. Voeg items toe vanuit een
        recept!
      </div>
    </UContainer>

    <Teleport to="#header-left-action" v-if="isMounted">
      <UButton
        color="gray"
        variant="ghost"
        icon="i-heroicons-arrow-left"
        aria-label="Ga terug naar home"
        @click="router.push('/')"
      />
    </Teleport>

    <Teleport to="#header-right-action" v-if="isMounted">
      <UButton
        v-if="
          headerState.showRightAction && shoppingListItems.length > 0
        "
        icon="i-heroicons-ellipsis-vertical"
        color="gray"
        variant="ghost"
        aria-label="Opties"
        @click="triggerRightAction"
      />
    </Teleport>

    <Teleport to="body">
      <UContextMenu
        v-model="isContextMenuOpen"
        :virtual-element="virtualElement"
        :popper="{ placement: 'bottom-end' }"
        :ui="{ container: 'z-50 group' }"
      >
        <div class="p-1 space-y-1">
          <UButton
            label="Kopieer lijst"
            variant="ghost"
            color="gray"
            icon="i-heroicons-clipboard-document"
            class="w-full justify-start"
            @click="copyShoppingListToClipboard"
            data-testid="copy-list-button"
          />
          <UButton
            label="Maak lijst leeg"
            color="red"
            variant="ghost"
            icon="i-heroicons-trash"
            class="w-full justify-start"
            @click="
              () => {
                isContextMenuOpen = false;
                isClearConfirmationModalOpen = true;
              }
            "
            data-testid="clear-list-button"
          />
        </div>
      </UContextMenu>
    </Teleport>

    <UModal
      v-model="isClearConfirmationModalOpen"
      :ui="{
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

    <!-- Fixed Bottom Action Bar for Adding Items Manually -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform translate-y-full"
      enter-to-class="transform translate-y-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="transform translate-y-0"
      leave-to-class="transform translate-y-full"
    >
      <div
        v-if="showActionBar"
        class="fixed bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-200 z-10"
      >
        <UButton
          block
          size="lg"
          label="Voeg boodschappen toe"
          icon="i-heroicons-shopping-cart"
          @click="isAddItemModalOpen = true"
          class="font-bold"
        />
      </div>
    </Transition>

    <!-- Add Items Modal -->
    <UModal
      v-model="isAddItemModalOpen"
      :ui="{
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
          <div class="flex items-center justify-between">
            <h3
              class="text-base font-semibold leading-6 text-gray-900"
            >
              Boodschappen toevoegen
            </h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark-20-solid"
              class="-my-1"
              @click="isAddItemModalOpen = false"
            />
          </div>
        </template>

        <div class="space-y-2">
          <p class="text-sm text-gray-500">
            Voer elke boodschap op een nieuwe regel in.
          </p>
          <UTextarea
            v-model="addItemTextAreaValue"
            placeholder="1 liter melk&#10;Brood&#10;500g gehakt"
            :rows="6"
            autofocus
            data-testid="add-items-textarea"
          />
        </div>

        <template #footer>
          <div class="flex justify-end space-x-2">
            <UButton
              color="gray"
              variant="ghost"
              @click="isAddItemModalOpen = false"
            >
              Annuleren
            </UButton>
            <UButton
              label="Toevoegen"
              :loading="isStandardizingItems"
              :disabled="
                !addItemTextAreaValue.trim() || isStandardizingItems
              "
              @click="handleAddItemsFromModal"
              data-testid="confirm-add-items-button"
            />
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>
