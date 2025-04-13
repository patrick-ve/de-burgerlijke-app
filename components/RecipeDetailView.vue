<script setup lang="ts">
import type { Recipe } from '~/types/recipe';

const props = defineProps<{
  recipe: Recipe;
}>();

const items = [
  {
    key: 'ingredients',
    label: 'Ingrediënten',
    icon: 'i-heroicons-list-bullet',
  },
  {
    key: 'instructions',
    label: 'Bereidingswijze',
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
      class="grid grid-cols-3 items-center p-3 text-xs border-b border-gray-200"
    >
      <div
        v-if="props.recipe.prepTime"
        class="flex items-center justify-center gap-2 border-r border-gray-200"
      >
        <UIcon
          name="i-heroicons-book-open"
          class="w-5 h-5 text-primary-500 flex-shrink-0"
        />
        <div class="flex flex-col">
          <span class="text-gray-700 font-bold"
            >{{ props.recipe.prepTime }} minuten</span
          >
          <span class="text-gray-500">Voorbereiding</span>
        </div>
      </div>
      <div
        v-if="props.recipe.cookTime"
        class="flex items-center justify-center gap-2 border-r border-gray-200"
      >
        <UIcon
          name="i-heroicons-clock"
          class="w-5 h-5 text-primary-500 flex-shrink-0"
        />
        <div class="flex flex-col">
          <span class="text-gray-700 font-bold"
            >{{ props.recipe.cookTime }} minuten</span
          >
          <span class="text-gray-500">Kooktijd</span>
        </div>
      </div>
      <div class="flex items-center justify-center gap-2">
        <UIcon
          name="i-heroicons-users"
          class="w-5 h-5 text-primary-500 flex-shrink-0"
        />
        <div class="flex flex-col">
          <span class="text-gray-700 font-bold">{{
            props.recipe.portions
          }}</span>
          <span class="text-gray-500">Porties</span>
        </div>
      </div>
    </div>

    <!-- Modern tab container -->
    <div class="p-2 bg-white shadow-sm">
      <UTabs
        :items="items"
        class="w-full"
        :ui="{
          list: {
            background: 'bg-gray-50',
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
                class="flex items-start gap-2 pb-2 border-b text-sm border-gray-100"
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
                Stappen
              </h3>
              <ol class="space-y-4 text-sm">
                <li
                  v-for="(step, index) in props.recipe.steps"
                  :key="`step-${index}`"
                  class="flex items-start gap-2 pb-2 border-b text-sm border-gray-100"
                >
                  <span
                    class="inline-block w-2 h-2 mt-2 rounded-full bg-amber-400"
                  ></span>
                  <span class="text-gray-700">{{
                    step.description
                  }}</span>
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
                Keukengerei
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
