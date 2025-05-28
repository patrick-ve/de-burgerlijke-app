<script setup lang="ts">
import type { Recipe, Ingredient, Step } from '~/types/recipe';
import { useShoppingList } from '~/composables/useShoppingList';
import { useYoutubeEmbed } from '~/composables/useYoutubeEmbed';
import PortionSelector from '~/components/PortionSelector.vue';
import { ref, computed } from 'vue';
import { Recipe as DomainRecipe } from '~/src/domain/entities/Recipe';
import { RecipeMapper } from '~/src/application/mappers/RecipeMapper';

// --- Interface for Local Step (Simpler) ---
interface LocalStep extends Step {
  isComplete?: boolean;
}

const props = defineProps<{
  recipe: Recipe;
}>();

// Convert to domain model
const domainRecipe = computed(() => {
  try {
    return RecipeMapper.toDomain(props.recipe);
  } catch (error) {
    console.error('Failed to convert recipe to domain model:', error);
    return null;
  }
});

// --- YouTube Embed ---
const { embedUrl, isValidYoutubeUrl } = useYoutubeEmbed(
  computed(() => props.recipe.youtubeUrl)
);

// Initialize localSteps without timer state
const localSteps = ref<LocalStep[]>(
  props.recipe.steps.map((step) => ({
    ...step,
    isComplete: false,
    // Removed timer-specific properties
  }))
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
  if (domainRecipe.value && adjustedPortions.value !== originalPortions.value) {
    // Clone the domain recipe and update servings
    const clonedRecipe = Object.create(
      Object.getPrototypeOf(domainRecipe.value),
      Object.getOwnPropertyDescriptors(domainRecipe.value)
    );
    clonedRecipe.updateServings(adjustedPortions.value);
    
    // Convert back to UI format to get scaled ingredients
    const scaledUIRecipe = RecipeMapper.toUI(clonedRecipe);
    return scaledUIRecipe.ingredients.map((ingredient) => ({
      ...ingredient,
      scaledQuantity: ingredient.quantity,
      displayQuantity: formatQuantity(ingredient.quantity),
    }));
  }
  
  // Fallback to original logic
  if (!props.recipe?.ingredients) return [];
  const scaleFactor = adjustedPortions.value / originalPortions.value;
  return props.recipe.ingredients.map((ingredient) => {
    let scaledQuantityNum: number | null = null;
    if (typeof ingredient.quantity === 'number') {
      scaledQuantityNum = ingredient.quantity * scaleFactor;
    }
    return {
      ...ingredient,
      // Keep original quantity if needed
      // originalQuantity: ingredient.quantity,
      // Store the calculated numeric quantity
      scaledQuantity: scaledQuantityNum,
      // Format the scaled quantity for display
      displayQuantity: formatQuantity(scaledQuantityNum),
    };
  });
});

// --- Use Shopping List Composable ---
const { addIngredients } = useShoppingList();

// Function to add scaled portions to the shopping list
const handleAddPortionsToShoppingList = () => {
  console.log(
    `Adding ${adjustedPortions.value} portions of ${props.recipe.title} to shopping list...`
  );

  // Ensure we have ingredients to add and a recipe ID
  if (scaledIngredients.value.length > 0 && props.recipe.id) {
    // Type assertion might be needed if TS doesn't infer Ingredient & { scaledQuantity: number | null }
    const ingredientsData = scaledIngredients.value as Array<
      Ingredient & { scaledQuantity: number | null }
    >;
    addIngredients(ingredientsData, props.recipe.id);
  } else {
    console.warn(
      'Could not add ingredients to list: No scaled ingredients data or recipe ID.'
    );
  }

  // TODO: Add user feedback (e.g., Toast notification)
  isPortionSlideoverOpen.value = false; // Close slideover after action
};

// --- Computed Property for Total Time ---
const totalTime = computed(() => {
  if (domainRecipe.value) {
    const total = domainRecipe.value.totalTime.minutes;
    return total > 0 ? total : null;
  }
  // Fallback to original logic
  const prep = props.recipe.prepTime ?? 0;
  const cook = props.recipe.cookTime ?? 0;
  return prep + cook > 0 ? prep + cook : null;
});
</script>

<template>
  <section class="pb-24">
    <!-- Added padding-bottom to prevent overlap with fixed bar -->

    <!-- Top Section: Show YouTube Embed OR Image -->
    <div
      v-if="isValidYoutubeUrl && embedUrl"
      class="w-full video-aspect-ratio overflow-hidden shadow-md"
      data-testid="youtube-embed-container"
    >
      <iframe
        :src="embedUrl"
        title="YouTube video player"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerpolicy="strict-origin-when-cross-origin"
        allowfullscreen
        class="w-full h-full"
        data-testid="youtube-iframe"
      ></iframe>
    </div>

    <div
      v-else-if="recipe.imageUrl"
      class="w-full h-56 sm:h-72 overflow-hidden shadow-md video-aspect-ratio"
      data-testid="recipe-image-container"
    >
      <NuxtImg
        :src="recipe.imageUrl"
        :alt="recipe.title"
        class="w-full h-full object-cover mock-nuxt-img"
        width="400"
        height="300"
        fit="cover"
        format="webp"
        loading="lazy"
      />
    </div>

    <!-- Recipe metadata card with themed icons -->
    <div
      class="grid items-center p-3 text-xs border-b border-gray-200"
      :class="{
        'grid-cols-1': !totalTime && !recipe.sourceUrl, // Only portions
        'grid-cols-2':
          (totalTime && !recipe.sourceUrl) ||
          (!totalTime && recipe.sourceUrl), // Portions + one other
        'grid-cols-3': totalTime && recipe.sourceUrl, // All three
      }"
      data-testid="recipe-metadata"
    >
      <!-- Total Time Section -->
      <div
        v-if="totalTime"
        class="flex items-center justify-center gap-2"
        :class="{
          'border-r border-gray-200':
            recipe.sourceUrl || !recipe.sourceUrl,
        }"
        data-testid="total-time-section"
      >
        <UIcon
          name="i-heroicons-clock"
          class="w-5 h-5 text-primary-500 flex-shrink-0"
        />
        <div class="flex flex-col">
          <span class="text-primary-600 font-bold"
            >{{ totalTime }} minuten</span
          >
        </div>
      </div>

      <!-- Portions Section (Always Visible) -->
      <div
        class="flex items-center justify-center gap-2"
        :class="{
          'border-r border-gray-200': totalTime && recipe.sourceUrl,
        }"
        data-testid="portions-section"
      >
        <UIcon
          name="i-heroicons-users"
          class="w-5 h-5 text-primary-500 flex-shrink-0"
        />
        <div class="flex flex-col">
          <span class="text-primary-600 font-bold"
            >{{ recipe.portions }} porties</span
          >
        </div>
      </div>

      <!-- Source URL Section -->
      <div
        v-if="recipe.sourceUrl"
        class="flex items-center justify-center gap-2"
        data-testid="source-url-section"
      >
        <UIcon
          name="i-heroicons-globe-alt"
          class="w-5 h-5 text-primary-500 flex-shrink-0"
        />
        <div class="flex flex-col">
          <a
            :href="recipe.sourceUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="text-primary-600 hover:underline font-bold truncate"
            style="max-width: 100px"
          >
            Website
          </a>
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
              class="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-b-0"
              data-testid="step-item"
            >
              <UCheckbox
                v-model="step.isComplete"
                :aria-label="`Mark step ${index + 1} as complete`"
                data-testid="step-checkbox"
                :ui="{
                  base: 'h-5 w-5',
                }"
              />
              <div class="flex-1 space-y-2">
                <span
                  :class="[
                    'text-gray-700',
                    {
                      'line-through text-gray-400': step.isComplete,
                    },
                  ]"
                  data-testid="step-description"
                  >{{ step.description }}</span
                >

                <!-- Use the new RecipeCookingTimer component -->
                <RecipeCookingTimer
                  v-if="
                    step.timer !== null && step.timer !== undefined
                  "
                  :duration-ms="step.timer"
                  :data-testid="`step-timer-${index}`"
                  class="recipe-cooking-timer"
                />
              </div>
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
      v-if="false"
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
      width: 'w-screen sm:max-w-md',
    }"
    prevent-close
  >
    <UCard
      class="flex flex-col"
      :ui="{
        header: { padding: 'py-3 px-4' },
        body: { padding: 'p-4 h-32' },
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

      <!-- Body: Portion Adjustment Controls ONLY -->
      <div class="space-y-4">
        <!-- Use the new PortionSelector component -->
        <PortionSelector
          v-model="adjustedPortions"
          data-testid="portion-selector-control"
        />
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

<style scoped>
.video-aspect-ratio {
  aspect-ratio: 16 / 9;
}
</style>
