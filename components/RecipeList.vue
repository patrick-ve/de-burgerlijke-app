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

// Get unique cuisines from recipes
const availableCuisines = computed(() => {
  const cuisines = new Set<string>();
  props.recipes.forEach((recipe) => {
    if (recipe.cuisine) cuisines.add(recipe.cuisine);
  });
  return Array.from(cuisines).sort();
});

// Toggle sort direction (only title)
const toggleSortDirection = () => {
  sortDirection.value =
    sortDirection.value === 'asc' ? 'desc' : 'asc';
};

// Ensure we start in alphabetical order - this is important for tests
watch(
  () => props.recipes,
  () => {
    // Reset sort direction on recipe change if needed, though resetFilters usually handles this
    sortDirection.value = 'asc';
  },
  { immediate: true }
);

// Filtered recipes based on search query, cuisine, favorites, and time range
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

  // Apply total time range filter (only if range is not default max)
  const [minTime, maxTime] = totalTimeRange.value;
  if (minTime > 0 || maxTime < maxTotalTime.value) {
    results = results.filter((recipe) => {
      const totalTime =
        (recipe.prepTime || 0) + (recipe.cookTime || 0);
      return totalTime >= minTime && totalTime <= maxTime;
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
  // Reset time range to full range
  totalTimeRange.value = [0, maxTotalTime.value];
};

// Function to clear filters and close slideover
const clearFiltersAndClose = () => {
  resetFilters();
  isFilterSlideoverOpen.value = false;
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
    totalTimeRange.value[0] > 0 ||
    totalTimeRange.value[1] < maxTotalTime.value;

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
    totalTimeRange.value[0] > 0 ||
    totalTimeRange.value[1] < maxTotalTime.value;

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
      class="text-center text-gray-500 dark:text-gray-400 py-8"
    >
      <p>No recipes found matching your current filters.</p>
      <UButton class="mt-4" @click="resetFilters"
        >Reset Filters</UButton
      >
    </div>

    <!-- Initial No Recipes Message -->
    <div
      v-else-if="showNoRecipesMessage"
      data-testid="no-recipes-message"
      class="text-center text-gray-500 dark:text-gray-400 py-8"
    >
      <p>No recipes found.</p>
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
    >
      <UCard
        class="flex flex-col flex-1"
        :ui="{
          body: {
            base: 'flex-1 rounded-t-lg',
          },
          ring: '',
          divide: 'divide-y divide-gray-100 dark:divide-gray-800',
        }"
      >
        <template #header>
          <div class="flex items-center justify-between">
            <h3
              class="text-base font-semibold leading-6 text-gray-900 dark:text-white"
            >
              Filter & Sort
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
        <div class="p-4 space-y-6">
          <!-- Sort by Title -->
          <UFormGroup label="Sort by Title">
            <div class="flex gap-2">
              <UButton
                size="md"
                color="gray"
                :variant="
                  sortDirection === 'asc' ? 'solid' : 'outline'
                "
                @click="sortDirection = 'asc'"
                class="flex-1 justify-center"
                data-testid="sort-title-asc-slideover"
              >
                <template #leading>
                  <UIcon name="i-heroicons-bars-arrow-up" />
                </template>
                Ascending (A-Z)
              </UButton>
              <UButton
                size="md"
                color="gray"
                :variant="
                  sortDirection === 'desc' ? 'solid' : 'outline'
                "
                @click="sortDirection = 'desc'"
                class="flex-1 justify-center"
                data-testid="sort-title-desc-slideover"
              >
                <template #leading>
                  <UIcon name="i-heroicons-bars-arrow-down" />
                </template>
                Descending (Z-A)
              </UButton>
            </div>
          </UFormGroup>

          <!-- Filter by Total Time -->
          <UFormGroup
            :label="`Total Time (${totalTimeRange[0]} - ${totalTimeRange[1]} min)`"
          >
            <URange
              v-model="totalTimeRange"
              :min="0"
              :max="maxTotalTime"
              :step="5"
              name="totalTime"
              data-testid="total-time-range-slideover"
            />
          </UFormGroup>

          <!-- Filter by Cuisine -->
          <UFormGroup label="Cuisine">
            <USelect
              v-if="availableCuisines.length > 0"
              :model-value="selectedCuisine ?? undefined"
              @update:model-value="
                (val: string | null) =>
                  (selectedCuisine = val || null)
              "
              :options="availableCuisines"
              placeholder="Filter op keuken"
              size="md"
              data-testid="cuisine-filter-slideover"
              class="w-full"
            >
              <template #leading>
                <UIcon name="i-heroicons-globe-europe-africa" />
              </template>
            </USelect>
            <p
              v-else
              class="text-sm text-gray-500 dark:text-gray-400"
            >
              No cuisines available.
            </p>
          </UFormGroup>

          <!-- Filter by Favorites -->
          <UFormGroup label="Favorites">
            <UButton
              color="gray"
              :variant="showFavoritesOnly ? 'solid' : 'outline'"
              size="md"
              @click="showFavoritesOnly = !showFavoritesOnly"
              data-testid="favorite-filter-toggle-slideover"
              class="w-full justify-center"
            >
              <template #leading>
                <UIcon
                  :name="
                    showFavoritesOnly
                      ? 'i-heroicons-heart-solid'
                      : 'i-heroicons-heart'
                  "
                />
              </template>
              Show Favorites Only
            </UButton>
          </UFormGroup>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              variant="outline"
              @click="clearFiltersAndClose"
              data-testid="clear-filters-slideover"
            >
              Clear Filters & Sort
            </UButton>
            <UButton
              @click="isFilterSlideoverOpen = false"
              data-testid="apply-filters-slideover"
            >
              Apply
            </UButton>
          </div>
        </template>
      </UCard>
    </USlideover>
  </div>
</template>
