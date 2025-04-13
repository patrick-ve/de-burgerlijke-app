<template>
  <div>
    <h1>Add New Recipe</h1>
    <RecipeForm @save="handleSave" />
    <!-- Add a link back to the recipe list -->
    <NuxtLink to="/recipes">Back to Recipes</NuxtLink>
  </div>
</template>

<script setup lang="ts">
import type { Recipe } from '~/types/recipe'; // Assuming Recipe type exists

const router = useRouter();

// Placeholder for handling the save event from RecipeForm
const handleSave = async (recipeData: Recipe) => {
  console.log('Recipe data to save:', recipeData);
  // Replace with actual API call to save the new recipe
  try {
    // const savedRecipe = await $fetch('/api/recipes', { method: 'POST', body: recipeData })
    // console.log('Recipe saved:', savedRecipe)
    // Redirect to the new recipe's detail page or the list page
    // router.push(`/recipes/${savedRecipe.id}`) // Or router.push('/recipes')
    alert('Recipe saved (simulated)!');
    router.push('/recipes');
  } catch (error) {
    console.error('Error saving recipe:', error);
    alert('Failed to save recipe.');
  }
};

useHead({
  title: 'Add New Recipe',
});
</script>
