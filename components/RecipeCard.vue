<script setup lang="ts">
import { computed } from 'vue';
import type { Recipe } from '../types/recipe';

const props = defineProps<{
  recipe: Recipe;
}>();

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

// Helper to parse time strings like "30 minuten" or just a number
function parseTime(
  timeString: string | number | null | undefined
): number {
  if (typeof timeString === 'number') {
    return timeString;
  }
  if (typeof timeString === 'string') {
    const match = timeString.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }
  // Handles null or undefined by returning 0
  return 0;
}

// Compute total time
const totalTime = computed(() => {
  const prepMinutes = parseTime(props.recipe.prepTime);
  const cookMinutes = parseTime(props.recipe.cookTime);
  const total = prepMinutes + cookMinutes;
  return total > 0 ? total : null;
});
</script>

<template>
  <NuxtLink
    :to="`/recipes/${recipe.id}`"
    class="recipe-card-link block group relative"
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
      class="recipe-card bg-white dark:bg-gray-800 rounded-xl border-[1px] border-gray-200 shadow-md overflow-hidden flex items-start space-x-4 p-3 hover:shadow-lg transition-shadow duration-200 ease-in-out"
    >
      <!-- Image Section -->
      <div class="flex-shrink-0">
        <div v-if="recipe.imageUrl" class="w-24 h-24">
          <NuxtImg
            :src="recipe.imageUrl"
            :alt="`Image of ${recipe.title}`"
            class="object-cover w-full h-full rounded-lg"
            loading="lazy"
          />
        </div>
        <div
          v-else
          class="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center"
        >
          <UIcon
            name="i-heroicons-photo"
            class="w-10 h-10 text-gray-400 dark:text-gray-500"
          />
        </div>
      </div>

      <!-- Text Content Section -->
      <div class="flex-grow min-w-0 pr-4">
        <h3
          class="text-lg font-semibold text-gray-900 dark:text-white truncate recipe-title mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors mt-0"
        >
          {{ recipe.title }}
        </h3>

        <!-- Metadata Section -->
        <div
          class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 metadata-info"
        >
          <span
            v-if="recipe.portions"
            class="recipe-portions flex items-center"
            title="Portions"
          >
            <UIcon name="i-heroicons-users" class="mr-1 h-4 w-4" />
            {{ recipe.portions }} porties
          </span>
          <!-- Merged Prep and Cook Time -->
          <span
            v-if="totalTime"
            class="recipe-total-time flex items-center"
            title="Total time"
          >
            <UIcon name="i-heroicons-clock" class="mr-1 h-4 w-4" />
            {{ totalTime }} minuten
          </span>
          <!-- Cuisine Info -->
          <span
            v-if="recipe.cuisine"
            class="recipe-cuisine flex items-center"
            title="Cuisine"
          >
            <UIcon
              name="i-heroicons-globe-alt"
              class="mr-1 h-4 w-4"
            />
            {{ recipe.cuisine }}
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
