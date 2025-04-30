<script setup lang="ts">
import type { Recipe } from '@/types/recipe';
import RecipeCard from '@/components/RecipeCard.vue';
import { ref, computed, watch, defineExpose } from 'vue';

interface Props {
  recipes: Recipe[];
  // itemsPerPage is no longer needed
}

const props = defineProps<Props>();

// --- Reactive State ---
const searchQuery = ref('');
const selectedCuisine = ref<string | undefined>();
const showFavoritesOnly = ref(false);
// currentPage and itemsPerPage are removed
const isFilterSlideoverOpen = ref(false); // State to control slideover visibility

// Time filter options and state - UPDATED for specific ranges
const timeFilterOptions = [
  { label: 'Elke kooktijd', value: undefined }, // Default/reset option
  { label: 'Sneller dan 20 min', value: 'under_20' },
  { label: '20 - 45 min', value: '20_to_45' },
  { label: 'Langer dan 45 min', value: 'over_45' },
];
// UPDATED type to string | undefined
const selectedTimeFilter = ref<string | undefined>(); // Holds the selected time range identifier

// Calculate max total time for the range slider - Kept for potential future use but not directly used in filters now
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
    { label: 'Elke keuken', value: undefined },
    ...sortedCuisines.map((cuisine) => ({
      label: cuisine,
      value: cuisine,
    })),
  ];
});

// Filtered recipes based on search query, cuisine, favorites, and time checkbox
// --- REMOVED SORTING FROM HERE ---
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
  if (selectedCuisine.value !== undefined) {
    results = results.filter(
      (recipe) => recipe.cuisine === selectedCuisine.value
    );
  }

  // Apply favorites filter
  if (showFavoritesOnly.value) {
    results = results.filter((recipe) => recipe.isFavorite);
  }

  // Apply time range filter (from USelectMenu) - UPDATED logic for ranges
  if (selectedTimeFilter.value !== undefined) {
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

  // --- SORTING LOGIC REMOVED FROM HERE ---
  // It will be applied within groupedRecipes

  return results;
});

// --- NEW: Grouped Recipes ---
const groupedRecipes = computed(() => {
  const groups: Record<string, Recipe[]> = {};

  filteredRecipes.value.forEach((recipe) => {
    const cuisine = recipe.cuisine || 'Overig'; // Group recipes without cuisine under 'Overig'
    if (!groups[cuisine]) {
      groups[cuisine] = [];
    }
    groups[cuisine].push(recipe);
  });

  // Optionally sort the groups by cuisine name (alphabetically)
  const sortedGroupKeys = Object.keys(groups).sort((a, b) =>
    a.localeCompare(b)
  );
  const sortedGroups: Record<string, Recipe[]> = {};
  sortedGroupKeys.forEach((key) => {
    sortedGroups[key] = groups[key];
  });

  return sortedGroups;
});

// Reset filters
const resetFilters = () => {
  searchQuery.value = '';
  selectedCuisine.value = undefined;
  showFavoritesOnly.value = false;
  selectedTimeFilter.value = undefined; // Reset time filter select
};

// Check if we need to show no results message - UPDATED for groupedRecipes
const showNoResultsMessage = computed(() => {
  if (!props.recipes || props.recipes.length === 0) {
    return false; // Don't show if there are no recipes initially
  }

  // Check if any filter/search is active
  const isAnyFilterActive =
    searchQuery.value ||
    selectedCuisine.value ||
    showFavoritesOnly.value ||
    selectedTimeFilter.value !== undefined; // Check if time filter is selected

  // Show message only if filters are active AND no results are found in any group
  return (
    isAnyFilterActive &&
    Object.keys(groupedRecipes.value).length === 0
  );
});

// Check if we need to show no recipes message - UPDATED for groupedRecipes
const showNoRecipesMessage = computed(() => {
  // Only show this if NO filters are active and the initial list results in no groups
  const isAnyFilterActive =
    searchQuery.value ||
    selectedCuisine.value ||
    showFavoritesOnly.value ||
    selectedTimeFilter.value !== undefined; // Check if time filter is selected

  return (
    !isAnyFilterActive &&
    (!props.recipes ||
      props.recipes.length === 0 ||
      Object.keys(groupedRecipes.value).length === 0)
  );
});

// Computed property to get active filter labels - Remains largely the same
const activeFilters = computed(() => {
  const filters: { key: string; label: string }[] = [];

  if (selectedCuisine.value !== undefined) {
    const cuisineLabel = cuisineFilterOptions.value.find(
      (o) => o.value === selectedCuisine.value
    )?.label;
    if (cuisineLabel) {
      filters.push({
        key: 'cuisine',
        label: `${cuisineLabel}`,
      });
    }
  }

  if (selectedTimeFilter.value !== undefined) {
    const timeLabel = timeFilterOptions.find(
      (o) => o.value === selectedTimeFilter.value
    )?.label;
    if (timeLabel && timeLabel !== 'Elke tijd') {
      // Don't show badge for default
      filters.push({ key: 'time', label: `${timeLabel}` });
    }
  }

  if (showFavoritesOnly.value) {
    filters.push({ key: 'favorites', label: 'Favorieten' });
  }

  return filters;
});

// --- Expose Method ---
// Function to open the slideover from the parent
const openFilters = () => {
  isFilterSlideoverOpen.value = true;
};

// Expose the openFilters function to the parent component
defineExpose({
  openFilters,
});
</script>

<template>
  <div>
    <!-- Search and Filter Action Bar Container -->
    <Transition
      appear
      enter-active-class="transition-all duration-500 ease-out"
      enter-from-class="opacity-0 translate-y-full"
      enter-to-class="opacity-100 translate-y-0"
    >
      <!-- Conditionally render action bar only if there are recipes initially -->
      <div
        v-if="props.recipes && props.recipes.length > 0"
        class="fixed bottom-0 left-0 right-0 z-10 p-4 bg-white border-t border-gray-200"
        data-testid="action-bar"
      >
        <div class="flex items-center space-x-2 max-w-md mx-auto">
          <!-- Search Input -->
          <UInput
            v-model="searchQuery"
            name="search"
            placeholder="Zoek naar recepten..."
            icon="i-heroicons-magnifying-glass-20-solid"
            autocomplete="off"
            size="lg"
            class="flex-grow"
            data-testid="search-input"
          />

          <!-- Filter Button (Opens Slideover) -->
          <UButton
            icon="i-heroicons-adjustments-horizontal"
            size="lg"
            @click="isFilterSlideoverOpen = true"
            data-testid="filter-button"
            class="px-4"
          />
        </div>
      </div>
    </Transition>

    <!-- Active Filters Display -->
    <div
      v-if="activeFilters.length > 0"
      class="flex flex-wrap items-center gap-2 mb-4 px-4"
      data-testid="active-filters-display"
    >
      <UBadge
        v-for="filter in activeFilters"
        :key="filter.key"
        variant="soft"
        size="sm"
        class="border-primary border-[1px] p-1 px-2"
      >
        {{ filter.label }}
      </UBadge>

      <UButton
        label="Reset filters"
        color="gray"
        size="xs"
        icon="i-heroicons-x-circle"
        @click="resetFilters"
        data-testid="reset-filters-button"
      />
    </div>

    <!-- Recipe Groups - NEW STRUCTURE -->
    <div
      v-if="Object.keys(groupedRecipes).length > 0"
      class="space-y-4 pb-0"
    >
      <!-- Iterate over each cuisine group -->
      <div
        v-for="(recipesInGroup, cuisine) in groupedRecipes"
        :key="cuisine"
      >
        <h2 class="text-xl font-semibold mb-0 pl-4 mt-0">
          {{ cuisine }}
        </h2>
        <!-- Horizontal scrolling container for recipes within the group -->
        <div
          class="flex overflow-x-auto py-2 snap-x snap-mandatory scrollbar-hide"
          data-testid="recipe-group-scroll"
        >
          <RecipeCard
            v-for="recipe in recipesInGroup"
            :key="recipe.id ?? recipe.title"
            :recipe="recipe"
            class="w-64 flex-shrink-0 snap-start pl-4"
            data-testid="recipe-card-in-group"
          />
        </div>
      </div>
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
      <!-- Optional: Add a button or link to add recipes if applicable -->
    </div>

    <!-- Filter and Sort Slideover - Remains largely the same -->
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
        class="flex flex-col flex-1 max-h-[80vh]"
        :ui="{
          header: { padding: 'py-2 px-4' },
          body: {
            padding: 'p-4',
            base: 'flex-1 overflow-y-auto', // Added overflow-y-auto for smaller screens
          },
          footer: { padding: 'p-4' },
          ring: '',
          divide: 'divide-y divide-gray-100',
        }"
      >
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold leading-6 text-gray-900">
              Filteren
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
        <!-- Using grid layout for better spacing -->
        <div class="space-y-4">
          <!-- Search Input (Moved inside slideover for better mobile UX) -->
          <!-- Removed from here, kept in bottom bar -->

          <!-- Quick Recipes -->
          <UFormGroup label="Max. kooktijd">
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
              Geen keukens beschikbaar om te filteren.
            </p>
          </UFormGroup>
        </div>

        <template #footer>
          <div class="flex justify-between gap-4">
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

<style scoped>
/* Utility to hide scrollbar */
.scrollbar-hide::-webkit-scrollbar {
  display: none; /* Safari and Chrome */
}
.scrollbar-hide {
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}
</style>
