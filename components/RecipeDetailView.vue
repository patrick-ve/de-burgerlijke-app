<script setup lang="ts">
import type { Recipe, Ingredient, Step } from '~/types/recipe';
import { useShoppingList } from '~/composables/useShoppingList';
import { useIntervalFn } from '@vueuse/core';

// --- Define Interface for Local Step with Timer State ---
interface LocalStep extends Step {
  isComplete?: boolean;
  timerDurationMs: number | null;
  timerIsRunning: boolean;
  timerStartTime: number | null; // Store start timestamp (Date.now())
  timerAccumulatedMs: number; // Store previously accumulated time when paused
}

const props = defineProps<{
  recipe: Recipe;
}>();

// Create a reactive copy of the steps with updated timer state
const localSteps = ref<LocalStep[]>(
  props.recipe.steps.map((step) => ({
    ...step,
    isComplete: false,
    timerDurationMs: step.timer ?? null,
    timerIsRunning: false,
    timerStartTime: null, // Initialize start time as null
    timerAccumulatedMs: 0, // Initialize accumulated time
  }))
);

// --- Timer Management ---
const activeTimers = ref<Record<string, { stop: () => void }>>({});

// Helper to format seconds into MM:SS
const formatTime = (totalSeconds: number): string => {
  if (totalSeconds < 0) totalSeconds = 0; // Ensure non-negative
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60); // Floor the seconds part too
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

// Calculate elapsed SECONDS based on timestamps
const calculateElapsedSeconds = (step: LocalStep): number => {
  let elapsedMs = step.timerAccumulatedMs;
  if (step.timerIsRunning && step.timerStartTime) {
    // Add time elapsed since the timer was last started
    elapsedMs += Date.now() - step.timerStartTime;
  }
  // Ensure we don't exceed the total duration if duration exists
  if (step.timerDurationMs !== null) {
    const totalDurationMs = step.timerDurationMs;
    elapsedMs = Math.min(elapsedMs, totalDurationMs);
  }
  return Math.floor(elapsedMs / 1000); // Convert accumulated MS to seconds
};

// Calculate remaining seconds for a step's timer using timestamp-based elapsed time
const calculateRemainingSeconds = (step: LocalStep): number => {
  if (step.timerDurationMs === null) return 0;
  const totalDurationSeconds = Math.floor(
    step.timerDurationMs / 1000
  );
  const elapsedSeconds = calculateElapsedSeconds(step);
  return Math.max(0, totalDurationSeconds - elapsedSeconds);
};

const startTimer = (stepId: string) => {
  const step = localSteps.value.find((s) => s.id === stepId);
  if (!step || step.timerIsRunning || step.timerDurationMs === null)
    return;

  const remainingSeconds = calculateRemainingSeconds(step);
  if (remainingSeconds <= 0) return; // Don't start if already finished

  step.timerStartTime = Date.now(); // Record start time
  step.timerIsRunning = true;

  // Use interval just to force updates for display, calculation is based on Date.now()
  const { pause, resume } = useIntervalFn(() => {
    // Check if the timer should stop based on accurate calculation
    if (calculateRemainingSeconds(step) <= 0) {
      // Ensure accumulated time is exactly the duration when finished
      step.timerAccumulatedMs = step.timerDurationMs ?? 0;
      pauseTimer(stepId); // Stop the interval and finalize state
      // Optional: Add notification
      // useNuxtApp().$toast.success(`Timer for step ${step.order} finished!`);
    } else {
      // Force reactivity update by making a meaningless change if needed,
      // but usually the interval itself triggers updates.
      // step.timerIsRunning = step.timerIsRunning; // Example if needed
    }
  }, 250); // Update display ~4 times/sec for smoother countdown appearance

  activeTimers.value[stepId] = { stop: pause };
  resume();
};

const pauseTimer = (stepId: string) => {
  const step = localSteps.value.find((s) => s.id === stepId);
  // Check if the step exists and is actually running
  if (!step || !step.timerIsRunning) return;

  // Add elapsed time since start to accumulated time BEFORE changing state
  if (step.timerStartTime) {
    step.timerAccumulatedMs += Date.now() - step.timerStartTime;
  }

  // Now update the state
  step.timerIsRunning = false;
  step.timerStartTime = null; // Clear start time

  // Stop and remove the interval timer
  if (activeTimers.value[stepId]) {
    activeTimers.value[stepId].stop();
    delete activeTimers.value[stepId];
  }
};

const resetTimer = (stepId: string) => {
  // Make sure timer is stopped and accumulated time is updated first
  const step = localSteps.value.find((s) => s.id === stepId);
  if (!step) return;

  // If it was running, pause it to capture the last bit of elapsed time
  if (step.timerIsRunning) {
    pauseTimer(stepId);
  }

  // Now reset the accumulated time
  step.timerAccumulatedMs = 0;
  step.timerIsRunning = false; // Ensure it's marked as not running
  step.timerStartTime = null; // Ensure start time is cleared

  // No need to manually trigger update, changing accumulatedMs handles it
};

// Cleanup active timers on component unmount
onUnmounted(() => {
  Object.values(activeTimers.value).forEach(({ stop }) => stop());
  activeTimers.value = {};
});

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
              class="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-b-0"
              data-testid="step-item"
            >
              <UCheckbox
                v-model="step.isComplete"
                class="-mt-1"
                :aria-label="`Mark step ${index + 1} as complete`"
                data-testid="step-checkbox"
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

                <!-- Timer Display and Controls -->
                <div
                  v-if="step.timerDurationMs !== null"
                  class="flex items-center gap-2 mt-1 text-xs"
                  data-testid="step-timer-controls"
                >
                  <UIcon
                    name="i-heroicons-clock"
                    class="w-4 h-4 text-gray-400"
                  />
                  <span
                    class="font-mono text-sm font-medium text-gray-600"
                    :class="{
                      'text-primary-600 font-bold':
                        step.timerIsRunning,
                    }"
                    data-testid="step-timer-display"
                  >
                    {{ formatTime(calculateRemainingSeconds(step)) }}
                  </span>
                  <div class="flex items-center gap-1">
                    <!-- Start Button -->
                    <UButton
                      v-if="
                        !step.timerIsRunning &&
                        calculateRemainingSeconds(step) > 0
                      "
                      icon="i-heroicons-play-solid"
                      size="xs"
                      color="gray"
                      variant="ghost"
                      square
                      :padded="false"
                      @click="startTimer(step.id)"
                      aria-label="Start timer"
                      data-testid="start-timer-button"
                    />
                    <!-- Pause Button -->
                    <UButton
                      v-if="step.timerIsRunning"
                      icon="i-heroicons-pause-solid"
                      size="xs"
                      color="gray"
                      variant="ghost"
                      square
                      :padded="false"
                      @click="pauseTimer(step.id)"
                      aria-label="Pause timer"
                      data-testid="pause-timer-button"
                    />
                    <!-- Reset Button -->
                    <UButton
                      v-if="calculateElapsedSeconds(step) > 0"
                      icon="i-heroicons-arrow-path"
                      size="xs"
                      color="gray"
                      variant="ghost"
                      square
                      :padded="false"
                      @click="resetTimer(step.id)"
                      aria-label="Reset timer"
                      data-testid="reset-timer-button"
                    />
                  </div>
                </div>
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
