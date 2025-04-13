<script setup lang="ts">
import type { Recipe } from '~/types/recipe';

// Define props using the Recipe interface
const props = defineProps<{
  recipe: Recipe;
}>();

// Placeholder for component logic, e.g., portion adjustment
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="text-xl font-semibold">{{ props.recipe.title }}</h2>
    </template>

    <div v-if="props.recipe.description" class="mb-4">
      <p>{{ props.recipe.description }}</p>
    </div>

    <div class="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
      <div v-if="props.recipe.prepTime">Prep Time: {{ props.recipe.prepTime }}</div>
      <div v-if="props.recipe.cookTime">Cook Time: {{ props.recipe.cookTime }}</div>
      <div v-if="props.recipe.cuisineType">Cuisine: {{ props.recipe.cuisineType }}</div>
      <div>Portions: {{ props.recipe.portions }}</div>
      <!-- Add Portion Adjustment UI later -->
    </div>

    <div class="mb-4">
      <h3 class="text-lg font-medium mb-2">Ingredients</h3>
      <ul class="list-disc pl-5 space-y-1">
        <li v-for="(ingredient, index) in props.recipe.ingredients" :key="`ingredient-${index}`">
          {{ ingredient.quantity ?? 'null' }} {{ ingredient.unit ?? 'null' }} {{ ingredient.name }}
        </li>
      </ul>
    </div>

    <div class="mb-4">
      <h3 class="text-lg font-medium mb-2">Steps</h3>
      <ol class="list-decimal pl-5 space-y-2">
        <li v-for="(step, index) in props.recipe.steps" :key="`step-${index}`">
          {{ step.description }}
          <!-- Add Timer button here later -->
        </li>
      </ol>
    </div>

    <div v-if="props.recipe.utensils && props.recipe.utensils.length > 0">
      <h3 class="text-lg font-medium mb-2">Utensils</h3>
      <ul class="list-disc pl-5 space-y-1">
        <li v-for="(utensil, index) in props.recipe.utensils" :key="`utensil-${index}`">
          {{ utensil }}
        </li>
      </ul>
    </div>

    <template #footer>
      <!-- Optional footer content, e.g., Favorite button -->
    </template>
  </UCard>
</template>

<style scoped>
/* Add any component-specific styles here */
</style> 