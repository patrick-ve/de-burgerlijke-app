<script setup lang="ts">
import type { Recipe } from '@/types/recipe';
import RecipeCard from '@/components/RecipeCard.vue';
import { ref, computed, watch } from 'vue';

interface Props {
  recipes: Recipe[];
  itemsPerPage?: number;
}

const props = defineProps<Props>();

// Default pagination size
const itemsPerPage = props.itemsPerPage || 8;

// --- Reactive State ---
const searchQuery = ref('');
const selectedCuisine = ref<string | null>(null);
const showFavoritesOnly = ref(false);
const currentPage = ref(1);
// Sort state - only title sort is needed now
const sortDirection = ref<'asc' | 'desc'>('asc');
const isFilterSlideoverOpen = ref(false); // State to control slideover visibility

// Time filter options and state - UPDATED for specific ranges
const timeFilterOptions = [
  { label: 'Elke tijd', value: null }, // Default/reset option
  { label: '< 20 min', value: 'under_20' },
  { label: '20 - 45 min', value: '20_to_45' },
  { label: '> 45 min', value: 'over_45' },
];
// UPDATED type to string | null
const selectedTimeFilter = ref<string | null>(null); // Holds the selected time range identifier

// Calculate max total time for the range slider
const maxTotalTime = computed(() => {
  if (!props.recipes || props.recipes.length === 0) {
    return 120; // Default max time if no recipes
  }
  return props.recipes.reduce((max, recipe) => {
    const total = (recipe.prepTime || 0) + (recipe.cookTime || 0);
    return Math.max(max, total);
  }, 0);
});

// Time range filter state, initialized after maxTotalTime is available
const totalTimeRange = ref<[number, number]>([0, 120]); // Default range
watch(
  maxTotalTime,
  (newMax) => {
    totalTimeRange.value = [0, newMax];
  },
  { immediate: true }
);

// Get unique cuisines from recipes & format for USelectMenu
const cuisineFilterOptions = computed(() => {
  const cuisines = new Set<string>();
  props.recipes.forEach((recipe) => {
    if (recipe.cuisine) cuisines.add(recipe.cuisine);
  });
  const sortedCuisines = Array.from(cuisines).sort();
  // Add "Any Cuisine" option
  return [
    { label: 'Elke keuken', value: null },
    ...sortedCuisines.map((cuisine) => ({
      label: cuisine,
      value: cuisine,
    })),
  ];
});

// Options for Sort USelectMenu - ADDED ICONS
const sortOptions = [
  {
    label: 'Oplopend (A-Z)',
    value: 'asc',
    icon: 'i-heroicons-bars-arrow-up',
  },
  {
    label: 'Aflopend (Z-A)',
    value: 'desc',
    icon: 'i-heroicons-bars-arrow-down',
  },
];

// Filtered recipes based on search query, cuisine, favorites, and time checkbox
const filteredRecipes = computed(() => {
  // Return original recipes array if it's empty
  if (!props.recipes || props.recipes.length === 0) {
    return [];
  }

  let results = [...props.recipes];

  // Apply search query filter
  if (searchQuery.value) {
    const lowerCaseQuery = searchQuery.value.toLowerCase();
    results = results.filter((recipe) => {
      const titleMatch = recipe.title
        ?.toLowerCase()
        .includes(lowerCaseQuery);
      const descriptionMatch = recipe.description
        ?.toLowerCase()
        .includes(lowerCaseQuery);
      return titleMatch || descriptionMatch;
    });
  }

  // Apply cuisine filter
  if (selectedCuisine.value) {
    results = results.filter(
      (recipe) => recipe.cuisine === selectedCuisine.value
    );
  }

  // Apply favorites filter
  if (showFavoritesOnly.value) {
    results = results.filter((recipe) => recipe.isFavorite);
  }

  // Apply time range filter (from USelectMenu) - UPDATED logic for ranges
  if (selectedTimeFilter.value !== null) {
    results = results.filter((recipe) => {
      const totalTime =
        (recipe.prepTime || 0) + (recipe.cookTime || 0);
      if (totalTime <= 0) return false; // Exclude recipes with no time unless 'Any Time' is selected

      switch (selectedTimeFilter.value) {
        case 'under_20':
          return totalTime < 20;
        case '20_to_45':
          return totalTime >= 20 && totalTime <= 45;
        case 'over_45':
          return totalTime > 45;
        default:
          return true; // Should not happen if value is not null, but good fallback
      }
    });
  }

  // Always apply sorting by title
  results.sort((a, b) => {
    const comparison = a.title.localeCompare(b.title);
    return sortDirection.value === 'asc' ? comparison : -comparison;
  });

  return results;
});

// Paginated recipes
const paginatedRecipes = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return filteredRecipes.value.slice(startIndex, endIndex);
});

// Total pages for pagination
const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredRecipes.value.length / itemsPerPage))
);

// Navigation methods
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

// Reset filters
const resetFilters = () => {
  searchQuery.value = '';
  selectedCuisine.value = null;
  showFavoritesOnly.value = false;
  currentPage.value = 1;
  sortDirection.value = 'asc';
  selectedTimeFilter.value = null; // Reset time filter select
};

// Check if we need to show no results message (primarily for tests)
const showNoResultsMessage = computed(() => {
  if (!props.recipes || props.recipes.length === 0) {
    return false; // Don't show if there are no recipes initially
  }

  // Check if any filter/search is active
  const isAnyFilterActive =
    searchQuery.value ||
    selectedCuisine.value ||
    showFavoritesOnly.value ||
    selectedTimeFilter.value !== null; // Check if time filter is selected

  // Show message only if filters are active AND no results are found
  return isAnyFilterActive && filteredRecipes.value.length === 0;
});

// Check if we need to show no recipes message (primarily for tests)
const showNoRecipesMessage = computed(() => {
  // Only show this if NO filters are active and the initial list is empty
  const isAnyFilterActive =
    searchQuery.value ||
    selectedCuisine.value ||
    showFavoritesOnly.value ||
    selectedTimeFilter.value !== null; // Check if time filter is selected

  return (
    !isAnyFilterActive &&
    (!props.recipes || props.recipes.length === 0)
  );
});
</script>

<template>
  <div class="space-y-4">
    <!-- Search and Filter Button Container -->
    <div v-if="props.recipes && props.recipes.length > 0">
      <div class="flex items-center space-x-2">
        <!-- Search Input -->
        <UInput
          v-model="searchQuery"
          name="search"
          placeholder="Zoek naar recepten..."
          icon="i-heroicons-magnifying-glass-20-solid"
          autocomplete="off"
          size="lg"
          class="w-[87.5%]"
          data-testid="search-input"
        />

        <!-- Filter Button (Opens Slideover) -->
        <UButton
          icon="i-heroicons-adjustments-horizontal"
          size="lg"
          @click="isFilterSlideoverOpen = true"
          data-testid="filter-button"
          class="w-[12.5%] justify-center"
        />
      </div>
    </div>

    <!-- Recipe Grid -->
    <div
      v-if="filteredRecipes.length > 0"
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <RecipeCard
        v-for="recipe in paginatedRecipes"
        :key="recipe.id ?? recipe.title"
        :recipe="recipe"
      />
    </div>

    <!-- No Results Message -->
    <div
      v-else-if="showNoResultsMessage"
      data-testid="no-results-message"
      class="text-center text-gray-500 py-8"
    >
      <p>
        Geen recepten gevonden die overeenkomen met uw huidige
        filters.
      </p>
      <UButton class="mt-4" @click="resetFilters"
        >Filters resetten</UButton
      >
    </div>

    <!-- Initial No Recipes Message -->
    <div
      v-else-if="showNoRecipesMessage"
      data-testid="no-recipes-message"
      class="text-center text-gray-500 py-8"
    >
      <p>Geen recepten gevonden.</p>
    </div>

    <!-- Pagination Controls -->
    <div
      v-if="totalPages > 1"
      class="flex justify-center items-center gap-2 mt-6"
    >
      <UButton
        icon="i-heroicons-chevron-left"
        color="gray"
        variant="ghost"
        :disabled="currentPage === 1"
        @click="prevPage"
        data-testid="prev-page"
      />

      <UBadge color="gray" variant="soft">
        {{ currentPage }} / {{ totalPages }}
      </UBadge>

      <UButton
        icon="i-heroicons-chevron-right"
        color="gray"
        variant="ghost"
        :disabled="currentPage === totalPages"
        @click="nextPage"
        data-testid="next-page"
      />
    </div>

    <!-- Filter and Sort Slideover -->
    <USlideover
      v-model="isFilterSlideoverOpen"
      side="bottom"
      :ui="{
        overlay: {
          background: 'bg-black/40 backdrop-blur-sm',
        },
      }"
      prevent-close
    >
      <UCard
        class="flex flex-col flex-1"
        :ui="{
          header: { padding: 'p-4' },
          body: {
            padding: 'p-4',
            base: 'flex-1',
          },
          footer: { padding: 'p-4' },
          ring: '',
          divide: 'divide-y divide-gray-100',
        }"
      >
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold leading-6 text-gray-900">
              Filteren & Sorteren
            </h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark-20-solid"
              class="-my-1"
              @click="isFilterSlideoverOpen = false"
            />
          </div>
        </template>

        <!-- Body contains the actual filters and sort options -->
        <div class="grid grid-cols-2 gap-4">
          <!-- Sort by Title -->
          <UFormGroup label="Sorteren op titel">
            <USelectMenu
              v-model="sortDirection"
              :options="sortOptions"
              value-attribute="value"
              option-attribute="label"
              size="md"
              class="w-full"
              data-testid="sort-select-slideover"
            />
          </UFormGroup>

          <!-- Quick Recipes -->
          <UFormGroup label="Max. tijd">
            <USelectMenu
              v-model="selectedTimeFilter"
              :options="timeFilterOptions"
              value-attribute="value"
              option-attribute="label"
              placeholder="Selecteer tijd"
              size="md"
              class="w-full"
              data-testid="time-filter-select-slideover"
            >
              <template #label>
                <!-- Display selected label or default -->
                {{
                  timeFilterOptions.find(
                    (o) => o.value === selectedTimeFilter
                  )?.label ?? 'Elke tijd'
                }}
              </template>
            </USelectMenu>
          </UFormGroup>

          <!-- Filter by Cuisine -->
          <UFormGroup label="Keuken">
            <USelectMenu
              v-if="cuisineFilterOptions.length > 1"
              v-model="selectedCuisine"
              :options="cuisineFilterOptions"
              value-attribute="value"
              option-attribute="label"
              placeholder="Selecteer keuken"
              size="md"
              class="w-full"
              data-testid="cuisine-select-slideover"
            >
              <template #label>
                {{
                  cuisineFilterOptions.find(
                    (o) => o.value === selectedCuisine
                  )?.label ?? 'Elke keuken'
                }}
              </template>
            </USelectMenu>
            <p v-else class="text-sm text-gray-500 mt-1">
              Geen keukens beschikbaar.
            </p>
          </UFormGroup>

          <!-- Filter by Favorites -->
          <UFormGroup label="Favoriete recepten">
            <div class="translate-y-2">
              <UCheckbox
                v-model="showFavoritesOnly"
                data-testid="favorite-checkbox-slideover"
                :label="
                  showFavoritesOnly
                    ? 'Toon alle recepten'
                    : 'Toon favoriete recepten'
                "
              />
            </div>
          </UFormGroup>
        </div>

        <template #footer>
          <div class="flex justify-end gap-4">
            <UButton
              @click="isFilterSlideoverOpen = false"
              data-testid="apply-filters-slideover"
              class="flex-1 font-bold"
              size="lg"
            >
              Toepassen
            </UButton>
          </div>
        </template>
      </UCard>
    </USlideover>
  </div>
</template>
