<script setup lang="ts">
import { computed } from 'vue';
import type { Recipe } from '../types/recipe';
import { Recipe as DomainRecipe } from '../src/domain/entities/Recipe';
import { RecipeMapper } from '../src/application/mappers/RecipeMapper';

const props = defineProps<{
  recipe: Recipe;
}>();

// Convert UI recipe to domain model
const domainRecipe = computed(() => {
  try {
    return RecipeMapper.toDomain(props.recipe);
  } catch (error) {
    console.error('Failed to convert recipe to domain model:', error);
    return null;
  }
});

// Restore favorite functionality
const emit = defineEmits<{
  (e: 'toggle-favorite', id: string): void;
}>();

function handleToggleFavorite(event: MouseEvent) {
  event.preventDefault(); // Prevent navigation when clicking the button
  event.stopPropagation(); // Stop event bubbling
  if (!props.recipe.id) return;
  emit('toggle-favorite', props.recipe.id);
}

// Compute total time using domain model
const totalTime = computed(() => {
  if (!domainRecipe.value) {
    // Fallback to original logic if domain conversion fails
    const prepMinutes =
      typeof props.recipe.prepTime === 'number'
        ? props.recipe.prepTime
        : 0;
    const cookMinutes =
      typeof props.recipe.cookTime === 'number'
        ? props.recipe.cookTime
        : 0;
    const total = prepMinutes + cookMinutes;
    return total > 0 ? total : null;
  }

  const total = domainRecipe.value.totalTime.minutes;
  return total > 0 ? total : null;
});
</script>

<template>
  <NuxtLink
    :to="`/recipes/${recipe.id}`"
    class="recipe-card-link block group relative w-48"
    :aria-label="`View recipe: ${recipe.title}`"
  >
    <!-- Favorite Button (Absolute Position) -->
    <UButton
      :icon="
        recipe.isFavorite
          ? 'i-heroicons-heart-solid'
          : 'i-heroicons-heart'
      "
      size="md"
      color="red"
      square
      variant="ghost"
      class="favorite-button absolute top-2 right-2 z-10"
      aria-label="Toggle Favorite"
      @click.stop.prevent="handleToggleFavorite"
    />

    <div
      class="recipe-card bg-white rounded-xl border-[1px] border-gray-200 overflow-hidden flex flex-col h-64 transition-shadow duration-200 ease-in-out w-full"
    >
      <!-- Image Section (Top 75%) -->
      <div class="flex-shrink-0 h-[75%] overflow-hidden relative">
        <div
          v-if="recipe.imageUrl"
          class="w-full h-full overflow-hidden"
        >
          <NuxtImg
            :src="recipe.imageUrl"
            :alt="`Image of ${recipe.title}`"
            class="object-cover w-full h-full"
            :class="
              recipe.imageUrl.includes('youtube')
                ? 'scale-[140%]'
                : ''
            "
            loading="lazy"
          />
        </div>
        <div
          v-else
          class="w-full h-full bg-gray-200 flex items-center justify-center"
        >
          <UIcon
            name="i-heroicons-photo"
            class="w-10 h-10 text-gray-400"
          />
        </div>
        <!-- Author Badge (Absolute Position within Image) -->
        <span
          v-if="recipe.authorName"
          class="absolute bottom-2 right-2 z-10 bg-gray-100/80 backdrop-blur-sm text-gray-700 text-xs font-medium px-1.5 py-0.5 rounded"
          aria-label="Recipe author"
        >
          {{ recipe.authorName }}
        </span>
      </div>

      <!-- Text Content Section (Bottom 25%) -->
      <div
        class="flex-grow min-w-0 p-2 flex flex-col justify-center h-[25%]"
      >
        <h3
          class="text-sm font-semibold text-gray-900 recipe-title mb-1 transition-colors mt-0 overflow-hidden text-ellipsis whitespace-nowrap"
          :title="recipe.title"
        >
          {{ recipe.title }}
        </h3>

        <!-- Metadata Section -->
        <div
          class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 metadata-info"
        >
          <span
            v-if="domainRecipe?.servings || recipe.portions"
            class="recipe-portions flex items-center"
            title="Portions"
          >
            <UIcon name="i-heroicons-users" class="mr-1 h-3 w-3" />
            {{ domainRecipe?.servings || recipe.portions }}
            {{
              (domainRecipe?.servings || recipe.portions) > 1
                ? 'porties'
                : 'portie'
            }}
          </span>
          <!-- Merged Prep and Cook Time -->
          <span
            v-if="totalTime"
            class="recipe-total-time flex items-center"
            title="Total time"
          >
            <UIcon name="i-heroicons-clock" class="mr-1 h-3 w-3" />
            {{ totalTime }} minuten
          </span>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>

<style scoped>
/* Add any component-specific styles here if needed, */
/* but prefer Tailwind utility classes within the template. */
.recipe-card-link:focus-visible {
  outline: 2px solid var(--color-primary-500); /* Example focus ring */
  outline-offset: 2px;
  border-radius: 0.75rem; /* Match card rounding */
}
</style>
