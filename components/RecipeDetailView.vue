<script setup lang="ts">
import type { Recipe } from '~/types/recipe';

const props = defineProps<{
  recipe: Recipe;
}>();

// Create a reactive copy of the steps to allow modification
const localSteps = ref(
  props.recipe.steps.map((step) => ({ ...step }))
);

// Initialize to ingredients
const selectedTab = ref('ingredients');

const items = [
  {
    key: 'ingredients',
    label: 'Ingrediënten',
    icon: 'i-heroicons-list-bullet',
  },
  {
    key: 'instructions',
    label: 'Bereiding',
    icon: 'i-heroicons-book-open',
  },
];

// Ensure both tabs content is accessible for testing
const showIngredients = computed(() => true); // Always render ingredients for tests
const showInstructions = computed(() => true); // Always render instructions for tests

// --- State for Portion Adjustment Slideover ---
const isPortionSlideoverOpen = ref(false);
const adjustedPortions = ref(props.recipe.portions); // Initialize with recipe portions
const originalPortions = computed(() => props.recipe.portions);

// --- Functions for Portion Adjustment ---
const openPortionSlideover = () => {
  adjustedPortions.value = props.recipe.portions; // Reset to original portions on open
  isPortionSlideoverOpen.value = true;
};

const incrementPortions = () => {
  adjustedPortions.value++;
};

const decrementPortions = () => {
  if (adjustedPortions.value > 1) {
    adjustedPortions.value--;
  }
};

const onPortionInput = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const value = parseInt(input.value, 10);
  if (!isNaN(value) && value > 0) {
    adjustedPortions.value = value;
  } else {
    // Reset to current value if input is invalid
    input.value = adjustedPortions.value.toString();
  }
};

// Helper to format quantity, handling potential fractions
const formatQuantity = (
  quantity: number | null | undefined
): string => {
  if (quantity === null || quantity === undefined) {
    return '';
  }
  // Avoid showing .0 for whole numbers
  if (quantity % 1 === 0) {
    return quantity.toString();
  }
  // Format common fractions
  const fractions: { [key: number]: string } = {
    0.5: '½',
    0.25: '¼',
    0.75: '¾',
    [1 / 3]: '⅓',
    [2 / 3]: '⅔',
  };
  // Check for common fractions with tolerance
  for (const val in fractions) {
    if (Math.abs(quantity - parseFloat(val)) < 0.01) {
      return fractions[val];
    }
  }
  // Fallback to fixed decimal for other fractions
  return quantity.toFixed(2).replace(/\.?0+$/, ''); // Keep up to 2 decimal places, remove trailing zeros
};

// Calculate scaled ingredients based on adjusted portions
const scaledIngredients = computed(() => {
  if (!props.recipe?.ingredients) return [];
  const scaleFactor = adjustedPortions.value / originalPortions.value;
  return props.recipe.ingredients.map((ingredient) => {
    let scaledQuantity: number | null = null;
    if (typeof ingredient.quantity === 'number') {
      scaledQuantity = ingredient.quantity * scaleFactor;
    }
    return {
      ...ingredient,
      // Format the scaled quantity for display
      displayQuantity: formatQuantity(scaledQuantity),
    };
  });
});

// Placeholder function for adding to shopping list
const handleAddPortionsToShoppingList = () => {
  console.log(
    `Adding ${adjustedPortions.value} portions to shopping list - (Not Implemented)`
  );
  // TODO: Implement actual logic to add ingredients to shopping list
  isPortionSlideoverOpen.value = false; // Close slideover after action
};
</script>

<template>
  <section class="pb-24">
    <!-- Added padding-bottom to prevent overlap with fixed bar -->
    <div
      v-if="recipe.imageUrl"
      class="w-full h-56 sm:h-72 overflow-hidden shadow-md"
    >
      <NuxtImg
        :src="recipe.imageUrl"
        :alt="recipe.title"
        class="w-full h-auto object-cover aspect-video mock-nuxt-img"
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
        v-if="recipe.prepTime"
        class="flex items-center justify-center gap-2 border-r border-gray-200"
      >
        <UIcon
          name="i-heroicons-book-open"
          class="w-5 h-5 text-primary-500 flex-shrink-0"
        />
        <div class="flex flex-col">
          <span class="text-gray-700 font-bold"
            >{{ recipe.prepTime }} minuten</span
          >
          <span class="text-gray-500">Voorbereiding</span>
        </div>
      </div>
      <div
        v-if="recipe.cookTime"
        class="flex items-center justify-center gap-2 border-r border-gray-200"
      >
        <UIcon
          name="i-heroicons-clock"
          class="w-5 h-5 text-primary-500 flex-shrink-0"
        />
        <div class="flex flex-col">
          <span class="text-gray-700 font-bold"
            >{{ recipe.cookTime }} minuten</span
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
            recipe.portions
          }}</span>
          <span class="text-gray-500">Porties</span>
        </div>
      </div>
    </div>

    <!-- Use a simplified tabs structure for better testing compatibility -->
    <div class="p-2 bg-white shadow-sm">
      <!-- Tab headers -->
      <div
        class="flex justify-between bg-gray-50 p-1 rounded-lg w-full"
      >
        <button
          v-for="item in items"
          :key="item.key"
          @click="selectedTab = item.key"
          class="flex flex-1 justify-center items-center px-3 py-2 text-sm font-medium rounded-md"
          :class="
            selectedTab === item.key
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-500'
          "
        >
          <UIcon
            :name="item.icon"
            class="w-5 h-5 mr-2"
            :class="
              selectedTab === item.key
                ? 'text-primary-500'
                : 'text-gray-400'
            "
          />
          {{ item.label }}
        </button>
      </div>

      <!-- Tab content -->
      <!-- Ingredients Tab Content - Always rendered for tests but visually hidden when not selected -->
      <div
        class="mt-6 px-2"
        :class="{ hidden: selectedTab !== 'ingredients' }"
        v-if="showIngredients"
        data-testid="ingredients-tab-content"
      >
        <ul class="space-y-2" data-testid="ingredients-list">
          <li
            v-for="(ingredient, index) in recipe.ingredients"
            :key="`ingredient-${index}`"
            class="flex items-start gap-2 pb-2 border-b text-sm border-gray-100 last:border-b-0"
            data-testid="ingredient-item"
          >
            <span
              class="inline-block w-2 h-2 mt-2 rounded-full bg-primary"
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

        <!-- Utensils Section - Moved here -->
        <div
          v-if="recipe.utensils && recipe.utensils.length > 0"
          class="mt-6"
          data-testid="utensils-section"
        >
          <h3 class="text-base font-medium text-gray-700 mb-2">
            Keukengerei
          </h3>
          <ul class="space-y-2" data-testid="utensils-list">
            <li
              v-for="(utensil, index) in recipe.utensils"
              :key="`utensil-${utensil.id || index}`"
              class="flex items-start gap-2 pb-2 border-b text-sm border-gray-100 last:border-b-0"
              data-testid="utensil-item"
            >
              <span
                class="inline-block w-2 h-2 mt-2 rounded-full bg-primary"
              ></span>
              <span class="text-gray-600">{{ utensil.name }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Instructions Tab Content - Always rendered for tests but visually hidden when not selected -->
      <div
        class="mt-6 px-2 space-y-6"
        :class="{ hidden: selectedTab !== 'instructions' }"
        v-if="showInstructions"
        data-testid="instructions-tab-content"
      >
        <div>
          <ol class="space-y-4 text-sm" data-testid="steps-list">
            <li
              v-for="(step, index) in localSteps"
              :key="`step-${step.id || index}`"
              class="flex items-start gap-3 pb-2 border-b border-gray-100 last:border-b-0"
              data-testid="step-item"
            >
              <UCheckbox
                v-model="step.isComplete"
                class="-py-1"
                :aria-label="`Mark step ${index + 1} as complete`"
                data-testid="step-checkbox"
              />
              <span
                :class="[
                  'flex-1',
                  'text-gray-700',
                  {
                    'line-through text-gray-400': step.isComplete,
                  },
                ]"
                data-testid="step-description"
                >{{ step.description }}</span
              >
            </li>
          </ol>
        </div>
      </div>
    </div>
  </section>

  <!-- Fixed Bottom Action Bar -->
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="transform translate-y-full"
    enter-to-class="transform translate-y-0"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="transform translate-y-0"
    leave-to-class="transform translate-y-full"
  >
    <div
      v-if="selectedTab !== 'instructions'"
      class="fixed bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-200 z-10"
    >
      <UButton
        block
        size="lg"
        label="Voeg toe aan boodschappenlijst"
        icon="i-heroicons-shopping-cart"
        @click="openPortionSlideover"
        data-testid="add-to-list-button"
        class="font-bold"
      />
    </div>
  </Transition>

  <!-- Portion Adjustment Slideover -->
  <USlideover
    v-model="isPortionSlideoverOpen"
    side="bottom"
    :ui="{
      overlay: {
        background: 'bg-black/40 backdrop-blur-sm',
      },
      width: 'w-screen sm:max-w-md', // Adjust width as needed
    }"
    prevent-close
  >
    <UCard
      class="flex flex-col flex-1"
      :ui="{
        header: { padding: 'py-3 px-4' },
        body: { padding: 'p-4', base: 'flex-1' },
        footer: { padding: 'p-4' },
        ring: '',
        divide: 'divide-y divide-gray-100',
      }"
    >
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-base font-semibold leading-6 text-gray-900">
            Porties aanpassen
          </h3>
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark-20-solid"
            class="-my-1"
            @click="isPortionSlideoverOpen = false"
            data-testid="close-slideover-button"
          />
        </div>
      </template>

      <!-- Body: Portion Adjustment Controls & Ingredient Preview -->
      <div class="space-y-4">
        <!-- Portion Controls -->
        <div class="flex items-center justify-center gap-0 pt-1 pb-2">
          <UButton
            icon="i-heroicons-minus-small"
            size="sm"
            color="primary"
            square
            variant="outline"
            @click="decrementPortions"
            :disabled="adjustedPortions <= 1"
            aria-label="Verlaag porties"
            data-testid="decrement-portions-button"
          />
          <input
            type="number"
            :value="adjustedPortions"
            @input="onPortionInput"
            min="1"
            class="w-8 text-center text-base text-gray-900 font-bold border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 p-1 mx-1"
            aria-label="Aantal porties"
            data-testid="portions-input"
          />
          <UButton
            icon="i-heroicons-plus-small"
            size="sm"
            color="primary"
            square
            variant="outline"
            @click="incrementPortions"
            aria-label="Verhoog porties"
            data-testid="increment-portions-button"
          />
        </div>

        <!-- Ingredient Preview -->
        <div
          class="max-h-60 overflow-y-auto px-2 -translate-y-4"
          data-testid="ingredients-preview-list"
        >
          <h4 class="text-sm font-medium text-gray-500 mt-0 mb-1">
            Ingrediënten voor {{ adjustedPortions }}
            {{ adjustedPortions === 1 ? 'portie' : 'porties' }}:
          </h4>
          <ul class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <li
              v-for="(ingredient, index) in scaledIngredients"
              :key="`preview-ingredient-${index}`"
              class="flex items-start gap-2 pb-1 border-b border-gray-100 last:border-b-0"
            >
              <span
                class="inline-block w-1.5 h-1.5 mt-1.5 rounded-full bg-primary/70 flex-shrink-0"
              ></span>
              <span>
                <span class="font-medium text-gray-800"
                  >{{ ingredient.displayQuantity }}
                  {{ ingredient.unit ?? '' }}
                </span>
                <span class="text-gray-600">
                  {{ ' ' + ingredient.name }}</span
                >
              </span>
            </li>
          </ul>
        </div>
      </div>

      <template #footer>
        <UButton
          block
          size="lg"
          class="font-bold"
          :label="`Voeg ${adjustedPortions} ${adjustedPortions === 1 ? 'portie' : 'porties'} toe aan boodschappenlijst`"
          @click="handleAddPortionsToShoppingList"
          data-testid="confirm-add-portions-button"
        />
      </template>
    </UCard>
  </USlideover>
</template>
