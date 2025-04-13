<script setup lang="ts">
import type { Recipe } from '@/types/recipe';
import RecipeCard from '@/components/RecipeCard.vue';
import { ref, computed } from 'vue';

interface Props {
  recipes: Recipe[];
}

const props = defineProps<Props>();

// Reactive state for the search query
const searchQuery = ref('');

// Computed property to filter recipes based on search query
const filteredRecipes = computed(() => {
  if (!searchQuery.value) {
    return props.recipes; // Return all recipes if search query is empty
  }
  const lowerCaseQuery = searchQuery.value.toLowerCase();
  return props.recipes.filter((recipe) => {
    // Basic search: check title and description
    // TODO: Consider searching ingredients, cuisine, etc. for more comprehensive filtering
    const titleMatch = recipe.title
      ?.toLowerCase()
      .includes(lowerCaseQuery);
    const descriptionMatch = recipe.description
      ?.toLowerCase()
      .includes(lowerCaseQuery);
    return titleMatch || descriptionMatch;
  });
});
</script>

<template>
  <div class="space-y-4">
    <!-- Search Input -->
    <UInput
      v-model="searchQuery"
      name="search"
      placeholder="Search recipes by title or description..."
      icon="i-heroicons-magnifying-glass-20-solid"
      autocomplete="off"
      size="lg"
      data-testid="search-input"
    />

    <!-- Recipe Grid -->
    <div
      v-if="filteredRecipes.length > 0"
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <!-- Use title as fallback key if id is missing -->
      <RecipeCard
        v-for="recipe in filteredRecipes"
        :key="recipe.id ?? recipe.title"
        :recipe="recipe"
      />
    </div>

    <!-- No Results Message -->
    <div
      v-else-if="searchQuery && filteredRecipes.length === 0"
      data-testid="no-results-message"
      class="text-center text-gray-500 dark:text-gray-400 py-8"
    >
      <p>No recipes match your search "{{ searchQuery }}".</p>
    </div>

    <!-- Initial No Recipes Message -->
    <div
      v-else
      data-testid="no-recipes-message"
      class="text-center text-gray-500 dark:text-gray-400 py-8"
    >
      <p>No recipes found.</p>
      <!-- TODO: Add a more engaging message or link to add recipes -->
    </div>
  </div>
</template>
