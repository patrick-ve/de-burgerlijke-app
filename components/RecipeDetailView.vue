<script setup lang="ts">
import type { Recipe } from '~/types/recipe';

const props = defineProps<{
  recipe: Recipe;
}>();

const items = [
  {
    key: 'ingredients',
    label: 'Ingredients',
    icon: 'i-heroicons-list-bullet',
  },
  {
    key: 'instructions',
    label: 'Instructions',
    icon: 'i-heroicons-book-open',
  },
];
</script>

<template>
  <section>
    <div
      v-if="props.recipe.imageUrl"
      class="w-full h-56 sm:h-72 overflow-hidden shadow-md"
    >
      <NuxtImg
        :src="props.recipe.imageUrl"
        :alt="props.recipe.title"
        class="w-full h-full object-cover"
        width="400"
        height="300"
        fit="cover"
        format="webp"
        loading="lazy"
      />
    </div>

    <!-- Recipe metadata card with themed icons -->
    <div
      class="flex items-center justify-around gap-2 p-3 bg-gradient-to-r from-amber-50 to-orange-50 shadow-sm text-xs"
    >
      <div
        v-if="props.recipe.prepTime"
        class="flex flex-col items-center gap-0.5"
      >
        <UIcon
          name="i-heroicons-clock"
          class="w-5 h-5 text-blue-500"
        />
        <span class="text-gray-700"
          >{{ props.recipe.prepTime }} min</span
        >
        <span class="text-gray-500">Prep</span>
      </div>
      <div
        v-if="props.recipe.cookTime"
        class="flex flex-col items-center gap-0.5"
      >
        <UIcon
          name="i-heroicons-fire"
          class="w-5 h-5 text-orange-500"
        />
        <span class="text-gray-700"
          >{{ props.recipe.cookTime }} min</span
        >
        <span class="text-gray-500">Cook</span>
      </div>
      <div class="flex flex-col items-center gap-0.5">
        <UIcon
          name="i-heroicons-users"
          class="w-5 h-5 text-green-500"
        />
        <span class="text-gray-700">{{ props.recipe.portions }}</span>
        <span class="text-gray-500">Serves</span>
      </div>
    </div>

    <!-- Modern tab container -->
    <div
      class="p-5 bg-white rounded-xl shadow-sm border border-gray-100"
    >
      <UTabs
        :items="items"
        class="w-full"
        :ui="{
          list: {
            background: 'bg-gray-50',
            rounded: 'rounded-lg',
            padding: 'p-1',
            width: 'w-full',
            height: 'h-12',
          },
          item: {
            base: 'relative h-full font-medium',
            active: 'text-primary-600 bg-white shadow-sm rounded-lg',
            inactive: 'text-gray-500 hover:text-gray-900',
          },
        }"
      >
        <template #default="{ item, selected }">
          <div
            class="flex items-center justify-center gap-2 px-3 py-2 h-full"
            :class="selected ? 'text-primary-500' : 'text-gray-400'"
          >
            <span>{{ item.label }}</span>
          </div>
        </template>
        <template #item="{ item }">
          <div v-if="item.key === 'ingredients'" class="mt-6 px-2">
            <ul class="space-y-2">
              <li
                v-for="(ingredient, index) in props.recipe
                  .ingredients"
                :key="`ingredient-${index}`"
                class="flex items-start gap-2 pb-2 border-b border-gray-100"
              >
                <span
                  class="inline-block w-2 h-2 mt-2 rounded-full bg-amber-400"
                ></span>
                <span>
                  <span class="font-medium"
                    >{{ ingredient.quantity ?? '' }}
                    {{ ingredient.unit ?? '' }}</span
                  >
                  {{ ingredient.name }}
                </span>
              </li>
            </ul>
          </div>
          <div
            v-else-if="item.key === 'instructions'"
            class="mt-6 px-2 space-y-6"
          >
            <div>
              <h3
                class="text-lg font-medium text-gray-800 mb-3 flex items-center"
              >
                <UIcon
                  name="i-heroicons-book-open"
                  class="w-5 h-5 mr-2 text-primary-500"
                />
                Steps
              </h3>
              <ol class="space-y-4">
                <li
                  v-for="(step, index) in props.recipe.steps"
                  :key="`step-${index}`"
                  class="flex gap-3 pb-4 border-b border-gray-100"
                >
                  <span
                    class="flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-600 font-medium text-sm flex-shrink-0"
                  >
                    {{ index + 1 }}
                  </span>
                  <p class="text-gray-700">{{ step.description }}</p>
                </li>
              </ol>
            </div>

            <div
              v-if="
                props.recipe.utensils &&
                props.recipe.utensils.length > 0
              "
            >
              <h3
                class="text-lg font-medium text-gray-800 mb-3 flex items-center"
              >
                <UIcon
                  name="i-heroicons-beaker"
                  class="w-5 h-5 mr-2 text-indigo-500"
                />
                Utensils
              </h3>
              <ul class="grid grid-cols-2 gap-2">
                <li
                  v-for="(utensil, index) in props.recipe.utensils"
                  :key="`utensil-${index}`"
                  class="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                >
                  <UIcon
                    name="i-heroicons-sparkles"
                    class="w-4 h-4 text-indigo-400"
                  />
                  <span class="text-gray-600">{{ utensil }}</span>
                </li>
              </ul>
            </div>
          </div>
        </template>
      </UTabs>
    </div>
  </section>
</template>

<style scoped>
/* Component-specific styles */
</style>
