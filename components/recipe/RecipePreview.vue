<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium">
          {{ recipe.title }}
        </h3>
        <UBadge
          :color="
            recipe.metadata.difficulty === 'easy'
              ? 'green'
              : recipe.metadata.difficulty === 'medium'
              ? 'yellow'
              : 'red'
          "
          variant="subtle"
          size="sm"
        >
          {{ difficultyLabel }}
        </UBadge>
      </div>
      <p
        v-if="recipe.description"
        class="mt-2 text-sm text-gray-500 dark:text-gray-400"
      >
        {{ recipe.description }}
      </p>
    </template>

    <div class="space-y-6">
      <!-- Recipe Metadata -->
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div
          v-for="(meta, index) in recipeMetadata"
          :key="index"
          class="text-center"
        >
          <dt
            class="text-sm font-medium text-gray-500 dark:text-gray-400"
          >
            {{ meta.label }}
          </dt>
          <dd class="mt-1 text-lg font-semibold">
            {{ meta.value }}
          </dd>
        </div>
      </div>

      <!-- Ingredients -->
      <div>
        <h4 class="font-medium mb-2">Ingrediënten</h4>
        <ul class="space-y-2">
          <li
            v-for="ingredient in recipe.ingredients"
            :key="ingredient.name"
            class="flex items-center gap-2"
          >
            <UIcon
              name="i-heroicons-check-circle"
              class="text-gray-400"
            />
            <span
              >{{ ingredient.amount }} {{ ingredient.unit }}
              {{ ingredient.name }}</span
            >
          </li>
        </ul>
      </div>

      <!-- Instructions -->
      <div>
        <h4 class="font-medium mb-2">Bereidingswijze</h4>
        <ol class="space-y-4">
          <li
            v-for="instruction in recipe.instructions"
            :key="instruction.step"
            class="flex gap-4"
          >
            <span
              class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400 text-sm font-medium"
            >
              {{ instruction.step }}
            </span>
            <div class="flex-1">
              <p>{{ instruction.text }}</p>
              <UBadge
                v-if="instruction.timer"
                color="gray"
                variant="subtle"
                class="mt-2"
              >
                <template #leading>
                  <UIcon name="i-heroicons-clock" />
                </template>
                {{ instruction.timer }} minuten
              </UBadge>
            </div>
          </li>
        </ol>
      </div>

      <!-- AI Suggestions -->
      <div v-if="recipe.aiEnhancements" class="space-y-4">
        <UAlert
          v-if="recipe.aiEnhancements.tips.length"
          icon="i-heroicons-light-bulb"
          color="primary"
          variant="subtle"
          title="Tips"
        >
          <ul class="list-disc list-inside space-y-1">
            <li v-for="tip in recipe.aiEnhancements.tips" :key="tip">
              {{ tip }}
            </li>
          </ul>
        </UAlert>

        <UAlert
          v-if="recipe.aiEnhancements.substitutions.length"
          icon="i-heroicons-arrow-path"
          color="info"
          variant="subtle"
          title="Mogelijke vervangingen"
        >
          <ul class="list-disc list-inside space-y-1">
            <li
              v-for="sub in recipe.aiEnhancements.substitutions"
              :key="sub.ingredient"
            >
              <span class="font-medium">{{ sub.ingredient }}</span
              >: {{ sub.alternatives.join(', ') }}
            </li>
          </ul>
        </UAlert>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton
          color="gray"
          variant="ghost"
          @click="$emit('cancel')"
        >
          Annuleren
        </UButton>
        <UButton color="primary" @click="$emit('save', recipe)">
          <template #leading>
            <UIcon name="i-heroicons-heart" />
          </template>
          Opslaan
        </UButton>
      </div>
    </template>
  </UCard>
</template>

<script setup lang="ts">
import type { Recipe } from '~/server/utils/recipeSchema';

const props = defineProps<{
  recipe: Recipe;
}>();

defineEmits<{
  (e: 'save', recipe: Recipe): void;
  (e: 'cancel'): void;
}>();

const difficultyLabel = computed(() => {
  switch (props.recipe.metadata.difficulty) {
    case 'easy':
      return 'Makkelijk';
    case 'medium':
      return 'Gemiddeld';
    case 'hard':
      return 'Moeilijk';
    default:
      return 'Onbekend';
  }
});

const recipeMetadata = computed(() => [
  {
    label: 'Porties',
    value: props.recipe.metadata.servings,
  },
  {
    label: 'Bereidingstijd',
    value: `${props.recipe.metadata.cookingTime} min`,
  },
  {
    label: 'Keuken',
    value: props.recipe.metadata.cuisine || 'Onbekend',
  },
  {
    label: 'Calorieën',
    value: props.recipe.nutrition?.calories
      ? `${props.recipe.nutrition.calories} kcal`
      : 'Onbekend',
  },
]);
</script>
