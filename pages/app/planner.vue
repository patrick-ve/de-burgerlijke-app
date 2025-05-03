<script setup lang="ts">
import { useRecipes } from '~/composables/useRecipes';
import { useMealPlanner } from '~/composables/useMealPlanner';
import PortionSelector from '~/components/PortionSelector.vue';
import { useShoppingList } from '~/composables/useShoppingList'; // Import useShoppingList
import { useOnboardingSettings } from '~/composables/useOnboardingSettings'; // Import onboarding settings
import type { Ingredient } from '~/types/recipe'; // Import Ingredient type

const { recipes } = useRecipes();
const { getMealsForDate, addMeal, removeMeal, getDateString } =
  useMealPlanner();
const {
  items: shoppingListItems,
  addIngredients: addIngredientsToShoppingList,
  optimizeAndFetchPrices,
  isOptimizingList,
} = useShoppingList(); // Replace replaceList with optimizeAndFetchPrices, expose isOptimizingList
const { completeAddToShoppingList } = useOnboardingSettings(); // Destructure the new function
const toast = useToast(); // For user feedback
const router = useRouter(); // Added router import

// --- Add week offset state ---
const weekOffset = ref(0);

// Prepare recipes for select menu (Keep early)
const recipeOptions = computed(
  () =>
    recipes.value
      .map((r) => ({ label: r.title, value: r.id! }))
      .sort((a, b) => a.label.localeCompare(b.label)) // Sort alphabetically by label
);

// --- Add state for modal ---
const isModalOpen = ref(false);
const modalTargetDate = ref<Date | null>(null);
const modalSelectedRecipeId = ref<string>(''); // State for modal's recipe selection
const modalSelectedPortions = ref<number>(1); // State for modal's portion selection

// --- Add watcher to update portions based on selected recipe ---
watch(modalSelectedRecipeId, (newRecipeId) => {
  if (newRecipeId) {
    const selectedRecipe = recipes.value.find(
      (r) => r.id === newRecipeId
    );
    if (selectedRecipe && selectedRecipe.portions > 0) {
      modalSelectedPortions.value = selectedRecipe.portions;
    } else {
      // Recipe not found or has 0 portions, default to 1
      modalSelectedPortions.value = 1;
    }
  } else {
    // No recipe selected, default to 1
    modalSelectedPortions.value = 1;
  }
});

// Function to open the modal for a specific date
function openPlannerModal(date: Date) {
  modalTargetDate.value = date;
  modalSelectedRecipeId.value = ''; // Reset selection (watcher will set portions to 1)
  // --- Remove explicit portion reset, handled by watcher now ---
  // modalSelectedPortions.value = 1;
  isModalOpen.value = true;
}

// --- Helper function to check if a date is in the past ---
function isDateInPast(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today to the start of the day
  const comparisonDate = new Date(date);
  comparisonDate.setHours(0, 0, 0, 0); // Normalize the comparison date
  return comparisonDate < today;
}

// --- Make startDisplayDate computed based on weekOffset ---
const startDisplayDate = computed(() => {
  const date = new Date(); // Start with today
  const currentDayOfWeek = date.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  // Calculate days needed to get to the Monday of the *current* week
  const daysToMonday =
    currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
  // Apply the offset to get to the target week's Monday
  date.setDate(date.getDate() + daysToMonday + weekOffset.value * 7);
  date.setHours(0, 0, 0, 0); // Normalize time
  return date;
});

// --- daysOfWeek now automatically reacts to startDisplayDate changes ---
const daysOfWeek = computed(() => {
  return Array.from({ length: 7 }).map((_, i) => {
    const date = new Date(startDisplayDate.value); // Use the computed start date
    date.setDate(startDisplayDate.value.getDate() + i);
    const dateString = getDateString(date);
    return {
      date,
      dateString,
      name: date.toLocaleDateString('nl-NL', { weekday: 'long' }),
      shortDate: date.toLocaleDateString('nl-NL', {
        month: 'long',
        day: 'numeric',
      }),
      meals: getMealsForDate(date), // Get reactive meals ref from composable
    };
  });
});

// --- Computed property to check if any meals are planned --- (Moved up)
const hasPlannedMeals = computed(() => {
  // Use the computed daysOfWeek value
  return daysOfWeek.value.some((day) => day.meals.value.length > 0);
});

// --- State to control the action bar visibility --- (Moved up)
const showActionBar = ref(false);

// --- Watch for subsequent changes to keep the action bar visibility synced --- (Moved up)
watch(hasPlannedMeals, (newValue) => {
  showActionBar.value = newValue;
});

// --- Keep onMounted here ---
onMounted(async () => {
  await nextTick();
  // Set initial state for action bar visibility after mount & tick
  showActionBar.value = hasPlannedMeals.value;
});

// --- Add new handler for planning from the modal ---
function planMealFromModal() {
  // --- Add check if the target date is in the past ---
  if (modalTargetDate.value && isDateInPast(modalTargetDate.value)) {
    toast.add({
      id: 'plan-past-date-error',
      title: 'Kan niet plannen',
      description:
        'Je kunt geen maaltijden plannen voor dagen in het verleden.',
      icon: 'i-heroicons-exclamation-circle',
      color: 'orange',
    });
    return; // Stop execution
  }

  if (modalTargetDate.value && modalSelectedRecipeId.value) {
    const recipeToAdd = recipes.value.find(
      (r) => r.id === modalSelectedRecipeId.value
    );
    if (recipeToAdd) {
      addMeal(
        recipeToAdd,
        modalTargetDate.value,
        modalSelectedPortions.value
      );
      isModalOpen.value = false; // Close modal on success
    } else {
      console.error('Selected recipe not found in modal');
      toast.add({
        title: 'Fout',
        description: 'Geselecteerd recept niet gevonden.',
        color: 'red',
      });
    }
  } else {
    console.error(
      'Target date or recipe ID missing for modal planning.'
    );
    toast.add({
      title: 'Fout',
      description: 'Selecteer een recept en datum.',
      color: 'red',
    });
  }
}

// --- Helper to format quantity (copied from RecipeDetailView for consistency) ---
// You might want to move this to a shared utility/composable later
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
  return quantity.toFixed(2).replace(/\\.?(0+)$/, ''); // Keep up to 2 decimal places, remove trailing zeros and potential dot
};

// Refactored function to call the composable directly
async function optimizeListAndShowFeedback() {
  // Let the composable handle the loading state and feedback
  await optimizeAndFetchPrices();
}

// --- Modify handler for adding all planned ingredients ---
async function addAllPlannedIngredientsToShoppingList() {
  // Hide the action bar immediately
  showActionBar.value = false;
  // Check the loading state from the composable
  if (isOptimizingList.value) {
    // Toast is already handled within the composable
    return;
  }

  let ingredientsAddedCount = 0;
  let mealsProcessedCount = 0;

  // Use computed daysOfWeek value
  daysOfWeek.value.forEach((day) => {
    day.meals.value.forEach((meal) => {
      const recipe = recipes.value.find(
        (r) => r.id === meal.recipeId
      );
      if (recipe && recipe.ingredients && recipe.portions > 0) {
        mealsProcessedCount++;
        const scaleFactor = meal.portions / recipe.portions;
        const scaledIngredients = recipe.ingredients
          .map((ingredient) => {
            let scaledQuantityNum: number | null = null;
            if (typeof ingredient.quantity === 'number') {
              scaledQuantityNum = ingredient.quantity * scaleFactor;
            }
            return {
              ...ingredient,
              scaledQuantity: scaledQuantityNum,
            } as Ingredient & { scaledQuantity: number | null };
          })
          .filter((ing) => ing.name);

        if (scaledIngredients.length > 0) {
          addIngredientsToShoppingList(
            scaledIngredients,
            meal.recipeId
          );
          ingredientsAddedCount += scaledIngredients.length;
        }
      } else if (recipe && recipe.portions <= 0) {
        console.warn(
          `Recipe "${recipe.title}" has 0 portions, cannot scale ingredients for meal on ${day.dateString}.`
        );
      } else if (!recipe) {
        console.warn(
          `Recipe with ID ${meal.recipeId} not found for meal on ${day.dateString}.`
        );
      }
    });
  });

  // Show appropriate toast message for adding
  if (ingredientsAddedCount > 0) {
    toast.add({
      id: 'ingredients-added-toast',
      title: 'Boodschappenlijst bijgewerkt!',
      description: `${ingredientsAddedCount} ${ingredientsAddedCount === 1 ? 'ingrediënt' : 'ingrediënten'} van ${mealsProcessedCount} ${mealsProcessedCount === 1 ? 'maaltijd' : 'maaltijden'} toegevoegd.`,
      icon: 'i-heroicons-check-circle',
    });
    // --- Call optimization AND price fetch AFTER adding ingredients ---
    // This now triggers both cleanup and price fetching
    await optimizeListAndShowFeedback();

    // --- Set onboarding passed ---
    // completeAddToShoppingList();

    // --- Umami Tracking ---
    umTrackEvent('plan_add_to_shopping_list');
    // --- End Umami Tracking ---
  } else if (mealsProcessedCount > 0) {
    toast.add({
      title: 'Niets toegevoegd',
      description:
        'De geplande maaltijden hadden geen ingrediënten om toe te voegen.',
      icon: 'i-heroicons-information-circle',
      color: 'blue',
    });
  }
  // No need for an "else" here
}

// Function to remove a meal (Keep as is)
function handleRemoveMeal(mealId: string, date: Date) {
  // --- Add check if the date is in the past before allowing removal ---
  if (isDateInPast(date)) {
    toast.add({
      id: 'remove-past-date-error',
      title: 'Kan niet verwijderen',
      description:
        'Je kunt geen maaltijden uit het verleden verwijderen.',
      icon: 'i-heroicons-exclamation-circle',
      color: 'orange',
    });
    return; // Stop execution
  }
  removeMeal(mealId, date);
  // Hide action bar if this was the last meal
  if (!hasPlannedMeals.value) {
    showActionBar.value = false;
  }
}

// Helper to format date for modal title
const formattedModalDate = computed(() => {
  if (!modalTargetDate.value) return '';
  return modalTargetDate.value.toLocaleDateString('nl-NL', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
});

// --- Computed property to check if the modal's target date is in the past ---
const isModalDateInPast = computed(() => {
  return modalTargetDate.value
    ? isDateInPast(modalTargetDate.value)
    : false;
});

// --- Computed property to check if the entire displayed week is in the past ---
const isCurrentWeekInPast = computed(() => {
  // We only need to check the start date of the week
  return isDateInPast(startDisplayDate.value);
});

// Helper function to get the ISO week number
function getISOWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  // Get first day of year
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  // Calculate full weeks to nearest Thursday
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  // Return week number
  return weekNo;
}

const currentWeekNumber = computed(() =>
  getISOWeekNumber(startDisplayDate.value)
);

// --- Computed property for week date range ---
const currentWeekDateRange = computed(() => {
  const startDate = startDisplayDate.value;
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6); // Sunday of the week

  const startDay = startDate.toLocaleDateString('nl-NL', {
    day: 'numeric',
  });
  const startMonth = startDate.toLocaleDateString('nl-NL', {
    month: 'long',
  });
  const endDay = endDate.toLocaleDateString('nl-NL', {
    day: 'numeric',
  });
  const endMonth = endDate.toLocaleDateString('nl-NL', {
    month: 'long',
  });

  if (startMonth === endMonth) {
    return `${startDay} - ${endDay} ${startMonth}`;
  } else {
    return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
  }
});

// --- Function to change the week ---
const changeWeek = (offset: number) => {
  weekOffset.value += offset;
};
</script>

<template>
  <TheHeader title="Maaltijdplanner">
    <template #left-action>
      <!-- Move back button here -->
      <UButton
        color="gray"
        variant="ghost"
        icon="i-heroicons-arrow-left"
        aria-label="Ga terug naar home"
        @click="router.push('/app')"
      />
    </template>
    <!-- No right action needed -->
  </TheHeader>

  <UContainer class="pb-24 max-w-7xl mx-auto">
    <!-- Week Number Display with Pagination -->
    <div class="flex items-center justify-center space-x-4 my-4">
      <UButton
        icon="i-heroicons-chevron-left"
        @click="changeWeek(-1)"
        aria-label="Vorige week"
        color="gray"
        variant="ghost"
        size="xl"
      />
      <div class="text-center text-xl font-semibold">
        {{ currentWeekDateRange }}
      </div>
      <UButton
        icon="i-heroicons-chevron-right"
        @click="changeWeek(1)"
        aria-label="Volgende week"
        color="gray"
        variant="ghost"
        size="xl"
      />
    </div>
    <!-- Changed grid layout to always be single column -->
    <div class="grid grid-cols-1 gap-4 mt-4">
      <div
        v-for="day in daysOfWeek"
        :key="day.dateString"
        class="border border-gray-200 shadow-sm rounded-xl overflow-hidden"
        :class="{
          'bg-black/50': day.meals.value.length > 0, // From UCard background
          'bg-white': day.meals.value.length === 0, // Default background
          relative: true, // Always relative for background and button positioning
        }"
        :style="
          day.meals.value.length > 0 && day.meals.value[0].imageUrl
            ? {
                backgroundImage: `url(${day.meals.value[0].imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundBlendMode: 'overlay',
              }
            : {}
        "
      >
        <!-- Remove Button (Conditionally disable if in the past) -->
        <UButton
          v-if="day.meals.value.length > 0"
          icon="i-heroicons-x-mark"
          size="xs"
          color="gray"
          variant="solid"
          aria-label="Verwijder maaltijd"
          class="absolute top-2 right-2 z-20"
          @click="handleRemoveMeal(day.meals.value[0].id, day.date)"
          :disabled="isDateInPast(day.date)"
        />

        <!-- Adjusted card content layout: p-4, flex-col then sm:flex-row, items-start -->
        <div
          class="relative z-10 p-4 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 min-h-[80px] md:h-[8rem]"
          :class="{ 'text-white': day.meals.value.length > 0 }"
        >
          <!-- Left side: Day/Date Info (takes available space) -->
          <div class="flex-grow">
            <div class="font-semibold capitalize">
              {{ day.name }}
            </div>
            <div
              class="text-sm"
              :class="{
                'text-gray-200': day.meals.value.length > 0,
                'text-gray-500': day.meals.value.length === 0,
              }"
            >
              {{ day.shortDate }}
            </div>
          </div>

          <!-- Right side: Meal Info or Plan Button (takes content width, aligned top-right on sm+) -->
          <div class="flex-shrink-0 mt-1 sm:mt-0 sm:text-right">
            <!-- If NO meal is planned -->
            <template v-if="day.meals.value.length === 0">
              <!-- Disable "Plan maaltijd" if the day is in the past -->
              <UButton
                v-if="recipeOptions.length > 0"
                size="sm"
                @click="openPlannerModal(day.date)"
                :disabled="isDateInPast(day.date)"
              >
                Plan maaltijd
              </UButton>
              <span v-else class="text-xs text-gray-400 italic"
                >Voeg recepten toe</span
              >
              <!-- Add visual indication that planning is disabled for past dates -->
              <span
                v-if="isDateInPast(day.date)"
                class="text-xs text-gray-400 italic ml-2"
              >
                (Verleden)
              </span>
            </template>

            <!-- If a meal IS planned -->
            <template v-else>
              <div
                class="text-lg font-semibold"
                :class="{ 'text-white': day.meals.value.length > 0 }"
              >
                {{ day.meals.value[0].recipeTitle }}
              </div>
              <div
                class="text-sm"
                :class="{
                  'text-gray-200': day.meals.value.length > 0,
                  'text-gray-500': day.meals.value.length === 0, // Should not happen here, but keep for consistency
                }"
              >
                ({{ day.meals.value[0].portions }}
                {{
                  day.meals.value[0].portions > 1
                    ? 'porties'
                    : 'portie'
                }})
              </div>
            </template>
          </div>
        </div>

        <!-- Removed the old conditional lower section -->
      </div>
    </div>

    <!-- Meal Planner Modal -->
    <UModal
      v-model="isModalOpen"
      :ui="{
        overlay: {
          background: 'bg-black/40 backdrop-blur-sm',
        },
      }"
    >
      <UCard
        :ui="{
          ring: '',
          divide: 'divide-y divide-gray-100',
        }"
      >
        <template #header>
          <div class="flex items-center justify-between">
            <h3
              class="text-base font-semibold leading-6 text-gray-900"
            >
              Plan maaltijd voor {{ formattedModalDate }}
              <!-- Add visual indicator if date is past -->
              <span
                v-if="isModalDateInPast"
                class="text-sm text-gray-500 font-normal ml-1"
                >(Verleden)</span
              >
            </h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark-20-solid"
              class="-my-1"
              @click="isModalOpen = false"
            />
          </div>
        </template>

        <div class="space-y-4">
          <UFormGroup label="Recept" name="recipe">
            <USelectMenu
              v-model="modalSelectedRecipeId"
              :options="recipeOptions"
              placeholder="Kies een recept"
              value-attribute="value"
              option-attribute="label"
              :disabled="isModalDateInPast"
            />
          </UFormGroup>

          <UFormGroup label="Aantal porties" name="portions">
            <!-- Disable portion selection if date is in the past -->
            <PortionSelector
              v-model="modalSelectedPortions"
              :disabled="isModalDateInPast"
            />
          </UFormGroup>
        </div>

        <template #footer>
          <div class="flex justify-end space-x-2">
            <UButton
              color="gray"
              variant="ghost"
              @click="isModalOpen = false"
              >Annuleren</UButton
            >
            <UButton
              label="Plan"
              :disabled="!modalSelectedRecipeId || isModalDateInPast"
              @click="planMealFromModal"
            />
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Fixed Bottom Action Bar for Adding All Ingredients -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform translate-y-full"
      enter-to-class="transform translate-y-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="transform translate-y-0"
      leave-to-class="transform translate-y-full"
    >
      <div
        v-if="showActionBar || isCurrentWeekInPast"
        class="fixed bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-200 z-30 max-w-7xl mx-auto md:border-[1px] md:border-r-[1px]"
      >
        <UButton
          block
          size="lg"
          label="Voeg maaltijden toe aan boodschappenlijst"
          icon="i-heroicons-shopping-cart-solid"
          @click="addAllPlannedIngredientsToShoppingList"
          class="font-bold"
          :loading="isOptimizingList"
          :disabled="isOptimizingList || isCurrentWeekInPast"
        />
      </div>
    </Transition>
  </UContainer>
</template>
