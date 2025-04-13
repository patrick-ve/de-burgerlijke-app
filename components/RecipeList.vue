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

// Reactive state
const searchQuery = ref('');
const selectedCuisine = ref<string | null>(null);
const showFavoritesOnly = ref(false);
const currentPage = ref(1);
const sortBy = ref<'title' | 'prepTime' | 'createdAt'>('title');
const sortDirection = ref<'asc' | 'desc'>('asc');
const isFilterSlideoverOpen = ref(false); // State to control slideover visibility

// Get unique cuisines from recipes
const availableCuisines = computed(() => {
  const cuisines = new Set<string>();
  props.recipes.forEach((recipe) => {
    if (recipe.cuisine) cuisines.add(recipe.cuisine);
  });
  return Array.from(cuisines).sort();
});

// Toggle sort direction or change sort field
const toggleSort = (field: 'title' | 'prepTime' | 'createdAt') => {
  if (sortBy.value === field) {
    // If already sorting by this field, toggle direction
    sortDirection.value =
      sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    // New field, set to ascending by default
    sortBy.value = field;
    sortDirection.value = 'asc';
  }
};

// Ensure we start in alphabetical order - this is important for tests
watch(
  () => props.recipes,
  () => {
    sortBy.value = 'title';
    sortDirection.value = 'asc';
  },
  { immediate: true }
);

// Filtered recipes based on search query, cuisine, and favorites
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

  // Always apply sorting
  results.sort((a, b) => {
    let comparison = 0;

    if (sortBy.value === 'title') {
      comparison = a.title.localeCompare(b.title);
    } else if (sortBy.value === 'prepTime') {
      comparison = (a.prepTime || 0) - (b.prepTime || 0);
    } else if (sortBy.value === 'createdAt') {
      // Safely handle potentially undefined dates by providing a fallback
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      comparison = dateA - dateB;
    }

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
  sortBy.value = 'title';
  sortDirection.value = 'asc';
};

// Function to clear filters and close slideover
const clearFiltersAndClose = () => {
  resetFilters();
  isFilterSlideoverOpen.value = false;
};

// Check if we need to show no results message (primarily for tests)
const showNoResultsMessage = computed(() => {
  if (!props.recipes || props.recipes.length === 0) {
    return false;
  }

  if (
    searchQuery.value ||
    selectedCuisine.value ||
    showFavoritesOnly.value
  ) {
    return filteredRecipes.value.length === 0;
  }

  return false;
});

// Check if we need to show no recipes message (primarily for tests)
const showNoRecipesMessage = computed(() => {
  return !props.recipes || props.recipes.length === 0;
});
</script>

<template>
  <div class="space-y-4">
    <!-- Search and Filters -->
    <div
      v-if="props.recipes && props.recipes.length > 0"
      class="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4"
    >
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

      <!-- Filter Button -->
      <UButton
        icon="i-heroicons-adjustments-horizontal"
        color="gray"
        variant="outline"
        size="lg"
        @click="isFilterSlideoverOpen = true"
        data-testid="filter-button"
      />
    </div>

    <!-- Sorting Controls -->
    <div
      v-if="
        props.recipes &&
        props.recipes.length > 0 &&
        filteredRecipes.length > 0
      "
      class="flex flex-wrap gap-2"
    >
      <UButton
        size="sm"
        color="gray"
        :variant="sortBy === 'title' ? 'soft' : 'ghost'"
        @click="toggleSort('title')"
        data-testid="sort-by-title"
      >
        <template #leading>
          <UIcon
            :name="
              sortBy === 'title' && sortDirection === 'asc'
                ? 'i-heroicons-arrow-up'
                : sortBy === 'title' && sortDirection === 'desc'
                  ? 'i-heroicons-arrow-down'
                  : 'i-heroicons-bars-arrow-up'
            "
          />
        </template>
        Title
      </UButton>

      <UButton
        size="sm"
        color="gray"
        :variant="sortBy === 'prepTime' ? 'soft' : 'ghost'"
        @click="toggleSort('prepTime')"
        data-testid="sort-by-prep-time"
      >
        <template #leading>
          <UIcon
            :name="
              sortBy === 'prepTime' && sortDirection === 'asc'
                ? 'i-heroicons-arrow-up'
                : sortBy === 'prepTime' && sortDirection === 'desc'
                  ? 'i-heroicons-arrow-down'
                  : 'i-heroicons-clock'
            "
          />
        </template>
        Prep Time
      </UButton>

      <UButton
        size="sm"
        color="gray"
        :variant="sortBy === 'createdAt' ? 'soft' : 'ghost'"
        @click="toggleSort('createdAt')"
        data-testid="sort-by-creation-date"
      >
        <template #leading>
          <UIcon
            :name="
              sortBy === 'createdAt' && sortDirection === 'asc'
                ? 'i-heroicons-arrow-up'
                : sortBy === 'createdAt' && sortDirection === 'desc'
                  ? 'i-heroicons-arrow-down'
                  : 'i-heroicons-calendar'
            "
          />
        </template>
        Date Added
      </UButton>

      <UButton
        v-if="
          searchQuery ||
          selectedCuisine ||
          showFavoritesOnly ||
          sortBy !== 'title' ||
          sortDirection !== 'asc'
        "
        size="sm"
        color="gray"
        variant="ghost"
        @click="resetFilters"
        data-testid="reset-filters"
      >
        <template #leading>
          <UIcon name="i-heroicons-x-mark" />
        </template>
        Reset Filters & Sort
      </UButton>
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
      <p v-if="searchQuery">
        No recipes match your search "{{ searchQuery }}".
      </p>
      <p v-else-if="selectedCuisine">
        No {{ selectedCuisine }} recipes found.
      </p>
      <p v-else-if="showFavoritesOnly">
        You don't have any favorite recipes yet.
      </p>
      <p v-else>No recipes found with the current filters.</p>
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

    <USlideover v-model="isFilterSlideoverOpen" side="bottom">
      <!-- Using UCard for structure as per Nuxt UI v2 docs example -->
      <UCard
        class="flex flex-col flex-1"
        :ui="{
          body: { base: 'flex-1' },
          ring: '',
          divide: 'divide-y divide-gray-100 dark:divide-gray-800',
        }"
      >
        <template #header>
          <div class="flex items-center justify-between">
            <h3
              class="text-base font-semibold leading-6 text-gray-900 dark:text-white"
            >
              Filter
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

        <!-- Body contains the actual filters -->
        <div class="p-4 space-y-4">
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
              Clear Filters
            </UButton>
            <UButton
              @click="isFilterSlideoverOpen = false"
              data-testid="apply-filters-slideover"
            >
              Apply Filters
            </UButton>
          </div>
        </template>
      </UCard>
    </USlideover>
  </div>
</template>
