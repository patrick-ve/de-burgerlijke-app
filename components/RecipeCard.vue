<script setup lang="ts">
import type { Recipe } from '../types/recipe';

const props = defineProps<{
  recipe: Recipe;
}>();

const emit = defineEmits<{
  (e: 'toggle-favorite', id: string): void;
}>();

function handleToggleFavorite() {
  if (!props.recipe.id) return;
  emit('toggle-favorite', props.recipe.id);
}
</script>

<template>
  <UCard class="recipe-card overflow-hidden">
    <template #header>
      <!-- Optional Header Content -->
      <!-- Placeholder for Image? -->
      <div v-if="recipe.imageUrl">
        <NuxtImg
          :src="recipe.imageUrl"
          :alt="`Image of ${recipe.title}`"
          class="object-cover w-full h-48"
          loading="lazy"
        />
      </div>
      <div
        v-else
        class="h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
      >
        <UIcon
          name="i-heroicons-photo"
          class="w-16 h-16 text-gray-400 dark:text-gray-500"
        />
      </div>
    </template>

    <div class="p-4">
      <NuxtLink :to="`/recipes/${recipe.id}`" class="block mb-2">
        <h3
          class="text-lg font-semibold recipe-title text-primary-500 dark:text-primary-400 hover:underline"
        >
          {{ recipe.title }}
        </h3>
      </NuxtLink>

      <p
        v-if="recipe.description"
        class="text-sm text-gray-600 dark:text-gray-400 recipe-description mb-3"
      >
        {{ recipe.description }}
      </p>

      <div
        class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3"
      >
        <span class="recipe-portions flex items-center">
          <UIcon name="i-heroicons-users" class="mr-1" />
          {{ recipe.portions }} Portions
        </span>
        <div class="flex space-x-2">
          <span
            v-if="recipe.prepTime"
            class="recipe-prep-time flex items-center"
          >
            <UIcon name="i-heroicons-clock" class="mr-1" /> Prep:
            {{ recipe.prepTime }}
          </span>
          <span
            v-if="recipe.cookTime"
            class="recipe-cook-time flex items-center"
          >
            <UIcon name="i-heroicons-fire" class="mr-1" /> Cook:
            {{ recipe.cookTime }}
          </span>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-end p-2">
        <UButton
          :icon="
            recipe.isFavorite
              ? 'i-heroicons-heart-solid'
              : 'i-heroicons-heart'
          "
          size="sm"
          color="red"
          square
          variant="ghost"
          class="favorite-button"
          @click="handleToggleFavorite"
          aria-label="Toggle Favorite"
        />
        <!-- Render favorite-icon class based on isFavorite state for test targeting -->
        <span
          v-if="recipe.isFavorite"
          class="favorite-icon hidden"
          aria-hidden="true"
        ></span>
      </div>
    </template>
  </UCard>
</template>

<style scoped>
/* Add any specific styles if needed */
.recipe-card {
  /* Add transition for hover effects if desired */
}
</style>
