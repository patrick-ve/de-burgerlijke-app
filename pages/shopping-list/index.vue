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
  replaceList,
} = useShoppingList();
const { headerState, setHeader } = useHeaderState();
const { selectedSupermarketIds } = useOnboardingSettings();
const isMounted = ref(false);
const isClearConfirmationModalOpen = ref(false);
const isLoadingPrices = ref(false);
const toast = useToast();

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

// Function to fetch cheapest products
const fetchCheapestProducts = async () => {
  if (isLoadingPrices.value) return;

  isLoadingPrices.value = true;
  try {
    const itemsToFetch = shoppingListItems.value.filter(
      (item) => !item.isChecked
    );
    const ingredientNames = itemsToFetch.map(
      (item) => item.ingredientName
    );

    if (ingredientNames.length === 0) {
      consola.info(
        'No unchecked items in the shopping list to fetch prices for.'
      );
      toast.add({
        title: 'Geen items om prijzen voor op te halen',
        description: 'Vink items uit om prijzen op te halen.',
        color: 'orange',
      });
      isLoadingPrices.value = false;
      return;
    }

    consola.info('Fetching cheapest products for:', ingredientNames);

    // Include selected supermarket IDs in the fetch request
    const requestBody = {
      ingredientNames,
      selectedSupermarketIds: selectedSupermarketIds.value,
    };
    consola.info('Request Body:', requestBody);

    // Explicitly type the expected response with the CORRECT type
    const results: ApiReturnType = await $fetch(
      '/api/shopping-list/find-cheapest',
      {
        method: 'POST',
        body: requestBody,
      }
    );

    consola.success('Received cheapest products:', results);

    // Integrate results into the shopping list items
    let updateCount = 0;
    Object.entries(results).forEach(
      ([ingredientName, cheapestProduct]) => {
        // cheapestProduct is now the Product object itself, or null

        if (cheapestProduct) {
          const itemToUpdate = shoppingListItems.value.find(
            (item) =>
              item.ingredientName === ingredientName &&
              !item.isChecked
          );

          if (itemToUpdate) {
            updateItem({
              ...itemToUpdate,
              cheapestPrice: cheapestProduct.price,
              cheapestSupermarket: cheapestProduct.supermarketName,
              cheapestAmount: cheapestProduct.amount,
              // Optionally store standardized info if needed later
              // cheapestStandardizedPrice: cheapestProduct.standardized_price_per_unit,
              // cheapestStandardizedUnit: cheapestProduct.standardized_unit,
            });
            updateCount++;
          }
        }
      }
    );
    if (updateCount > 0) {
      toast.add({
        title: `Prijzen bijgewerkt voor ${updateCount} item(s)`,
        color: 'green',
      });
    } else {
      toast.add({
        title: 'Geen nieuwe prijzen gevonden',
        color: 'orange',
      });
    }

    // TODO: Handle ingredients for which no prices were found (clear existing price?)
    // TODO: Update the ShoppingList component to display the cheapestPrice, cheapestSupermarket, and cheapestAmount fields.
  } catch (error) {
    consola.error('Error fetching cheapest products:', error);
    toast.add({
      title: 'Fout bij ophalen prijzen',
      description: 'Kon de productprijzen niet ophalen.',
      color: 'red',
    });
  } finally {
    isLoadingPrices.value = false;
  }
};

// --- Group items by Supermarket AND Category (for UNCHECKED items) ---
const groupedBySupermarketAndCategory = computed(() => {
  const groups: Record<
    string,
    Record<string, ShoppingListItem[]>
  > = {};
  const noSupermarketKey = 'Nog geen prijs gevonden'; // Key for items without a supermarket
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
        item.cheapestSupermarket || noSupermarketKey; // Use last known supermarket or default
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
    if (a === noSupermarketKey) return 1; // Put 'No Price' at the end
    if (b === noSupermarketKey) return -1;
    return a.localeCompare(b); // Sort others alphabetically
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
    rightActionHandler: clearList,
  });
});

const router = useRouter();
</script>

<template>
  <div>
    <UContainer>
      <!-- Loading Skeleton (Optional, could add later if needed) -->
      <div v-if="isLoadingPrices" class="space-y-4 p-4">
        <USkeleton class="h-8 w-1/2 mb-4" />
        <div
          v-for="i in 3"
          :key="`skel-item-${i}`"
          class="flex items-center gap-3 py-2 px-2 border border-gray-200 rounded-md"
        >
          <USkeleton class="h-5 w-5 rounded" />
          <div class="flex-1 space-y-1">
            <USkeleton class="h-4 w-2/3" />
            <USkeleton class="h-3 w-1/2" />
          </div>
          <USkeleton class="h-6 w-16" />
          <USkeleton class="h-6 w-6" />
        </div>
      </div>

      <!-- Display Grouped Items -->
      <div
        v-else-if="shoppingListItems.length > 0"
        class="space-y-6 mt-4"
      >
        <!-- Grand Total -->
        <div
          v-if="grandTotal > 0"
          class="px-2 text-right font-semibold text-gray-800 text-lg"
        >
          Totaal:
          {{ formatCurrency(grandTotal) }}
        </div>

        <!-- UNCHECKED Items: Grouped by Supermarket -> Category -->
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
              <!-- Calculate total for UNCHECKED items in this supermarket -->
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

          <!-- Loop through categories within the supermarket -->
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
              data-testid="shopping-list-item"
            >
              <div class="flex items-center gap-3 flex-1 min-w-0">
                <UCheckbox
                  :model-value="item.isChecked"
                  @update:model-value="
                    handleItemUpdate({ ...item, isChecked: $event })
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
                  v-if="
                    item.cheapestPrice != null &&
                    supermarket !== 'Nog geen prijs gevonden'
                  "
                  class="text-sm font-medium text-gray-900"
                  :class="{
                    'line-through text-gray-500': item.isChecked,
                  }"
                >
                  {{ formatCurrency(item.cheapestPrice) }}
                </span>
                <!-- Placeholder/indicator if no price yet -->
                <span
                  v-else-if="
                    supermarket === 'Nog geen prijs gevonden'
                  "
                  class="text-xs text-gray-400 italic"
                >
                  Geen prijs
                </span>
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
      <!-- Empty State -->
      <div v-else class="mt-6 text-center text-gray-500">
        Je boodschappenlijst is leeg. Voeg items toe vanuit een
        recept!
      </div>

      <!-- Actions (kept as is) -->
      <div
        v-if="shoppingListItems.length > 0"
        class="mt-6 flex flex-wrap justify-end gap-2"
      >
        <UButton
          label="Prijzen ophalen"
          icon="i-heroicons-currency-euro"
          class="ml-2"
          :loading="isLoadingPrices"
          @click="fetchCheapestProducts"
        />
      </div>
    </UContainer>

    <!-- Teleport Clear button to the header -->
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
