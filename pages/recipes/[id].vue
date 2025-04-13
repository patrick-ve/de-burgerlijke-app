<template>
  <div>
    <!-- Fetch recipe data based on route params -->
    <div v-if="pending">Loading...</div>
    <div v-else-if="error || !recipe">
      Error loading recipe or recipe not found.
    </div>
    <RecipeDetailView v-else :recipe="recipe" />
    <!-- Add a link back to the recipe list -->
    <NuxtLink to="/recipes">Back to Recipes</NuxtLink>
  </div>
</template>

<script setup lang="ts">
import type { Recipe } from '~/types/recipe'; // Assuming Recipe type exists

const route = useRoute();
const recipeId = computed(() => route.params.id as string);

// Placeholder for fetching the specific recipe data
// Replace with actual useFetch or useAsyncData call
const {
  data: recipe,
  pending,
  error,
} = await useAsyncData<Recipe | null>(
  `recipe-${recipeId.value}`,
  async () => {
    // Simulate API call - replace with actual fetch logic
    console.log(`Fetching recipe with ID: ${recipeId.value}`);
    // Example: return await $fetch(`/api/recipes/${recipeId.value}`)
    // For now, return null or dummy data for testing
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay
    // Dummy data example:
    // return { id: recipeId.value, name: `Recipe ${recipeId.value}`, description: 'Dummy description', ingredients: [], steps: [], portions: 2, isFavorite: false };
    return null;
  },
  {
    watch: [recipeId], // Refetch when ID changes
  }
);

useHead({
  // Update title dynamically based on recipe name if available
  title: computed(() =>
    recipe.value ? recipe.value.title : 'Recipe Details'
  ),
});
</script>
