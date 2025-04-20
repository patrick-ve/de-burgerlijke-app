<script setup lang="ts">
import { useRecipes } from '~/composables/useRecipes';
import { useMealPlanner } from '~/composables/useMealPlanner';
import { useHeaderState } from '~/composables/useHeaderState';
import PortionSelector from '~/components/PortionSelector.vue';
import type { Recipe } from '~/types/recipe';
// --- Remove type import that's no longer needed directly here ---
// import type { ScheduledMeal } from '~/composables/useMealPlanner'; // Import from composable
import { useShoppingList } from '~/composables/useShoppingList'; // Import useShoppingList
import type { Ingredient } from '~/types/recipe'; // Import Ingredient type
import { consola } from 'consola'; // Added for debugging optimization
import type { ShoppingListItem } from '~/types/shopping-list'; // Added for optimizedList type

const { setHeader } = useHeaderState();
const { recipes } = useRecipes();
const { getMealsForDate, addMeal, removeMeal, getDateString } =
  useMealPlanner();
const {
  addIngredients: addIngredientsToShoppingList,
  replaceList,
  items: shoppingListItems,
} = useShoppingList(); // Get replaceList and items
const toast = useToast(); // For user feedback
const isOptimizingList = ref(false); // Add loading state for optimization

// Set header title
onMounted(async () => {
  await nextTick();

  setHeader({
    title: 'Maaltijdplanner',
    showLeftAction: true,
    showRightAction: false,
  });

  // Set initial state for action bar visibility after mount & tick
  showActionBar.value = hasPlannedMeals.value;
});

// Prepare recipes for select menu (value: id, label: title)
const recipeOptions = computed(
  () => recipes.value.map((r) => ({ label: r.title, value: r.id! })) // id guaranteed string by useRecipes
);

// --- Remove old state related to inline select ---
// const selectedRecipeId = ref<Record<string, string>>({});
// const selectedPortions = ref<Record<string, number>>({});

// --- Add state for modal ---
const isModalOpen = ref(false);
const modalTargetDate = ref<Date | null>(null);
const modalSelectedRecipeId = ref<string>(''); // State for modal's recipe selection
const modalSelectedPortions = ref<number>(1); // State for modal's portion selection

// Function to open the modal for a specific date
function openPlannerModal(date: Date) {
  modalTargetDate.value = date;
  modalSelectedRecipeId.value = ''; // Reset selection
  modalSelectedPortions.value = 1; // Reset portions
  isModalOpen.value = true;
}

// Generate days of the week starting from the next Monday
const today = new Date();
const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
// --- Correct day calculation to start from *today* if it's Monday ---
// const daysUntilNextMonday =
//   currentDay === 1 ? 0 : (8 - currentDay) % 7;
const daysFromToday = Array.from({ length: 7 }).map((_, i) => {
  const date = new Date(today);
  date.setDate(today.getDate() + i); // Start from today
  return date;
});

// Start from the *next* Monday for the display week if needed
const startDisplayDate = new Date(today);
if (currentDay !== 1) {
  // If today is not Monday
  const daysUntilNextMonday = (8 - currentDay) % 7;
  startDisplayDate.setDate(today.getDate() + daysUntilNextMonday);
}

const daysOfWeek = Array.from({ length: 7 }).map((_, i) => {
  const date = new Date(startDisplayDate); // Use the calculated start date
  date.setDate(startDisplayDate.getDate() + i);
  const dateString = getDateString(date);
  // --- Remove initialization of old state ---
  // selectedRecipeId.value[dateString] = '';
  // selectedPortions.value[dateString] = 1;
  return {
    date,
    dateString,
    name: date.toLocaleDateString('nl-NL', { weekday: 'long' }), // Dutch weekday
    shortDate: date.toLocaleDateString('nl-NL', {
      month: 'long',
      day: 'numeric',
    }), // Dutch date format
    meals: getMealsForDate(date), // Get reactive meals ref from composable
  };
});

// --- Remove watcher for old selectedRecipeId ---
// watch(selectedRecipeId, ..., { deep: true });

// --- Remove old handleAddRecipe function ---
// function handleAddRecipe(date: Date) { ... }

// --- Add new handler for planning from the modal ---
function planMealFromModal() {
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
      // Maybe show a toast notification here
    }
  } else {
    console.error(
      'Target date or recipe ID missing for modal planning.'
    );
    // Maybe show a toast notification here
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

// --- Add new handler for optimizing the list after adding ingredients ---
async function optimizeListAndShowFeedback() {
  if (isOptimizingList.value) return; // Prevent multiple triggers
  if (shoppingListItems.value.length === 0) {
    // No need to optimize an empty list
    return;
  }

  isOptimizingList.value = true;
  consola.info(
    'Optimizing shopping list after adding from planner...'
  );
  try {
    const currentItems = JSON.parse(
      JSON.stringify(shoppingListItems.value)
    ); // Deep clone
    const optimizedList: ShoppingListItem[] = await $fetch(
      '/api/shopping-list/clean-up',
      {
        method: 'POST',
        body: currentItems, // Send the current list
      }
    );

    replaceList(optimizedList); // Replace the list with the optimized one
    consola.success(
      'Shopping list optimized successfully after adding from planner.'
    );
    toast.add({
      id: 'list-optimized-toast', // Added ID to prevent duplicates if triggered quickly
      title: 'Boodschappenlijst geoptimaliseerd!',
      description: 'Dubbele items samengevoegd en opgeschoond.',
      icon: 'i-heroicons-sparkles',
      color: 'green',
    });
  } catch (error) {
    consola.error(
      'Error optimizing shopping list after adding from planner:',
      error
    );
    toast.add({
      id: 'list-optimize-error-toast',
      title: 'Fout bij optimaliseren',
      description:
        'Kon de boodschappenlijst niet automatisch opschonen.',
      color: 'red',
    });
  } finally {
    isOptimizingList.value = false;
  }
}

// --- Modify handler for adding all planned ingredients ---
async function addAllPlannedIngredientsToShoppingList() {
  // Hide the action bar immediately
  showActionBar.value = false;
  if (isOptimizingList.value) {
    toast.add({
      title: 'Optimalisatie bezig',
      description: 'Wacht even tot de lijst is opgeschoond.',
      color: 'orange',
    });
    return;
  }

  let ingredientsAddedCount = 0;
  let mealsProcessedCount = 0;

  daysOfWeek.forEach((day) => {
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
            // Ensure the structure matches what addIngredients expects
            return {
              ...ingredient,
              scaledQuantity: scaledQuantityNum,
            } as Ingredient & { scaledQuantity: number | null }; // Type assertion
          })
          .filter((ing) => ing.name); // Filter out ingredients without a name

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
      title: 'Boodschappenlijst bijgewerkt!',
      description: `${ingredientsAddedCount} ${ingredientsAddedCount === 1 ? 'ingrediënt' : 'ingrediënten'} van ${mealsProcessedCount} ${mealsProcessedCount === 1 ? 'maaltijd' : 'maaltijden'} toegevoegd.`,
      icon: 'i-heroicons-check-circle',
      color: 'green',
    });
    // --- Call optimization AFTER adding ingredients ---
    await optimizeListAndShowFeedback(); // Use await if you want to ensure it finishes before potentially other actions
  } else if (mealsProcessedCount > 0) {
    toast.add({
      title: 'Niets toegevoegd',
      description:
        'De geplande maaltijden hadden geen ingrediënten om toe te voegen.',
      icon: 'i-heroicons-information-circle',
      color: 'blue',
    });
  }
  // No need for an "else" here, because if mealsProcessedCount is 0,
  // the action bar wouldn't have been visible anyway (due to hasPlannedMeals being false).
}

// Computed property to check if any meals are planned in the week
const hasPlannedMeals = computed(() => {
  return daysOfWeek.some((day) => day.meals.value.length > 0);
});

// State to control the action bar visibility for animation
const showActionBar = ref(false);

// Watch for subsequent changes to keep the action bar visibility synced
watch(hasPlannedMeals, (newValue) => {
  showActionBar.value = newValue;
});

// Function to remove a meal (Keep as is)
function handleRemoveMeal(mealId: string, date: Date) {
  removeMeal(mealId, date);
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

const router = useRouter();
</script>

<template>
  <UContainer class="pb-24">
    <!-- Header is handled by TheHeader component using useHeaderState -->
    <div class="grid grid-cols-1 md:grid-cols-7 gap-4 mt-4">
      <div
        v-for="day in daysOfWeek"
        :key="day.dateString"
        class="border border-gray-200 shadow-sm rounded-xl"
        :class="{
          'bg-black/50': day.meals.value.length > 0, // From UCard background
          'bg-white': day.meals.value.length === 0, // Default background
          relative: day.meals.value.length > 0, // Added conditional 'relative'
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
        <!-- Add Remove Button -->
        <UButton
          v-if="day.meals.value.length > 0"
          icon="i-heroicons-x-mark"
          size="xs"
          color="gray"
          variant="solid"
          aria-label="Verwijder maaltijd"
          class="absolute top-2 right-2 z-20"
          @click="handleRemoveMeal(day.meals.value[0].id, day.date)"
        />

        <!-- Day/Date Info and Add Button Section -->
        <div
          class="relative z-10 p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2"
          :class="{
            'text-white border-b-0': day.meals.value.length > 0,
          }"
        >
          <!-- Left side: Day/Date -->
          <div :class="{ 'text-white': day.meals.value.length > 0 }">
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

          <!-- Right side: Plan Meal Button (only if no meal planned) -->
          <div
            v-if="day.meals.value.length === 0"
            class="mt-1 sm:mt-0"
          >
            <UButton
              v-if="recipeOptions.length > 0"
              size="xs"
              @click="openPlannerModal(day.date)"
            >
              Plan maaltijd
            </UButton>
            <!-- Optional: Message if no recipes exist -->
            <span v-else class="text-xs text-gray-400 italic"
              >Voeg recepten toe</span
            >
          </div>
        </div>

        <!-- Conditionally render the lower section (placeholder or planned meal title) -->
        <div
          v-if="day.meals.value.length > 0"
          class="relative z-10"
          :class="{
            'min-h-[100px] flex items-center justify-center p-4':
              day.meals.value.length === 0, // Keep placeholder space when empty
            'absolute bottom-2 right-2 p-2 text-white text-right':
              day.meals.value.length > 0, // Position title when meal exists
          }"
        >
          <!-- Planned Meal Title: Positioned bottom-right when meal exists -->
          <span
            v-if="day.meals.value.length > 0"
            class="text-xl font-semibold"
            >{{ day.meals.value[0].recipeTitle }} ({{
              day.meals.value[0].portions
            }}
            {{
              day.meals.value[0].portions > 1 ? 'porties' : 'portie'
            }})</span
          >
        </div>
      </div>
    </div>

    <Teleport to="#header-left-action">
      <UButton
        color="gray"
        variant="ghost"
        icon="i-heroicons-arrow-left"
        aria-label="Ga terug naar home"
        @click="router.push('/')"
      />
    </Teleport>

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
              searchable
            />
          </UFormGroup>

          <UFormGroup label="Aantal porties" name="portions">
            <PortionSelector v-model="modalSelectedPortions" />
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
              :disabled="!modalSelectedRecipeId"
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
        v-if="showActionBar"
        class="fixed bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-200 z-10"
      >
        <UButton
          block
          size="lg"
          label="Voeg maaltijden toe aan boodschappenlijst"
          icon="i-heroicons-shopping-cart-solid"
          @click="addAllPlannedIngredientsToShoppingList"
          class="font-bold"
          :loading="isOptimizingList"
          :disabled="isOptimizingList"
        />
      </div>
    </Transition>
  </UContainer>
</template>
