<script setup lang="ts">
import { useRecipes } from '~/composables/useRecipes';
import { useMealPlanner } from '~/composables/useMealPlanner';
import { useHeaderState } from '~/composables/useHeaderState';
import PortionSelector from '~/components/PortionSelector.vue';
import type { Recipe } from '~/types/recipe';
import type { ScheduledMeal } from '~/composables/useMealPlanner'; // Import from composable

const { setHeader } = useHeaderState();
const { recipes } = useRecipes();
const { getMealsForDate, addMeal, removeMeal, getDateString } =
  useMealPlanner();

// Set header title
onMounted(async () => {
  await nextTick();

  setHeader({
    title: 'Maaltijdplanner',
    showLeftAction: false,
    showRightAction: false,
  });
});

// Prepare recipes for select menu (value: id, label: title)
const recipeOptions = computed(
  () => recipes.value.map((r) => ({ label: r.title, value: r.id! })) // id guaranteed string by useRecipes
);

// Keep selected recipe ID for each day's select menu, using empty string for no selection
const selectedRecipeId = ref<Record<string, string>>({});
// Keep selected portions for each day, defaulting to 1
const selectedPortions = ref<Record<string, number>>({});

// Generate days of the week starting from the next Monday
const today = new Date();
const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
const daysUntilNextMonday =
  currentDay === 1 ? 0 : (8 - currentDay) % 7;
const startOfWeek = new Date(today);
startOfWeek.setDate(today.getDate() + daysUntilNextMonday);

const daysOfWeek = Array.from({ length: 7 }).map((_, i) => {
  const date = new Date(startOfWeek);
  date.setDate(startOfWeek.getDate() + i);
  const dateString = getDateString(date); // Use helper from composable
  selectedRecipeId.value[dateString] = ''; // Initialize selection state with empty string
  selectedPortions.value[dateString] = 1; // Initialize portions state to 1
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

// Watch for changes in selectedRecipeId to update default portions
watch(
  selectedRecipeId,
  (newSelectedIds, oldSelectedIds) => {
    for (const dateString in newSelectedIds) {
      const newRecipeId = newSelectedIds[dateString];
      const oldRecipeId = oldSelectedIds?.[dateString];

      // Only update if the recipe ID actually changed
      if (newRecipeId !== oldRecipeId) {
        if (newRecipeId) {
          const selectedRecipe = recipes.value.find(
            (r) => r.id === newRecipeId
          );
          selectedPortions.value[dateString] =
            selectedRecipe?.portions ?? 1;
        } else {
          // Reset to 1 if no recipe is selected
          selectedPortions.value[dateString] = 1;
        }
      }
    }
  },
  { deep: true }
); // Use deep watcher as selectedRecipeId is an object

// Function to add the selected recipe to a day
function handleAddRecipe(date: Date) {
  const dateString = getDateString(date);
  const recipeIdToAdd = selectedRecipeId.value[dateString];
  const portionsToAdd = selectedPortions.value[dateString] || 1; // Default to 1 if somehow undefined

  if (recipeIdToAdd) {
    const recipeToAdd = recipes.value.find(
      (r) => r.id === recipeIdToAdd
    );
    if (recipeToAdd) {
      addMeal(recipeToAdd, date, portionsToAdd); // Pass portions to addMeal
      selectedRecipeId.value[dateString] = ''; // Reset selection to empty string
      selectedPortions.value[dateString] = 1; // Reset portions to 1
    } else {
      console.error('Selected recipe not found');
    }
  } else {
    console.warn('No recipe selected to add');
  }
}

// Function to remove a meal
function handleRemoveMeal(mealId: string, date: Date) {
  removeMeal(mealId, date);
}
</script>

<template>
  <UContainer>
    <!-- Header is handled by TheHeader component using useHeaderState -->
    <div class="grid grid-cols-1 md:grid-cols-7 gap-4 mt-4">
      <div
        v-for="day in daysOfWeek"
        :key="day.dateString"
        class="relative overflow-hidden transition-all duration-300 ease-in-out border border-gray-200 rounded-lg shadow-sm"
        :class="{
          'bg-black/50': day.meals.value.length > 0, // From UCard background
          'bg-white': day.meals.value.length === 0, // Default background
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

        <div
          class="relative z-10 p-4 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 border-b border-gray-200"
          :class="{
            'text-white border-b-0': day.meals.value.length > 0,
          }"
        >
          <!-- Top Section: Only contains Day/Date Info now -->
          <div class="flex-grow sm:max-w-[200px]">
            <!-- Empty div to maintain layout, meal title moved -->
            <div
              v-if="day.meals.value.length > 0"
              class="min-h-[30px]"
            >
              <!-- Placeholder to maintain some height consistency -->
            </div>
          </div>

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
        </div>

        <!-- Conditionally render the lower section (add recipe controls) -->
        <div
          v-if="day.meals.value.length === 0"
          class="p-4 space-y-2 min-h-[100px] relative z-10 flex flex-col justify-center items-center"
          :class="{
            'bg-black/30 p-2 rounded': day.meals.value.length > 0, // Kept for potential future use, though v-if makes it inactive now
          }"
        >
          <!-- Bottom Section: Contains Recipe Selector when empty -->
          <template v-if="recipeOptions.length > 0">
            <USelectMenu
              v-model="selectedRecipeId[day.dateString]"
              :options="recipeOptions"
              placeholder="Kies recept..."
              value-attribute="value"
              option-attribute="label"
              size="sm"
              class="mb-1 w-full"
            />
            <div
              v-if="selectedRecipeId[day.dateString]"
              class="flex flex-col items-center gap-2 mt-2 w-full"
            >
              <PortionSelector
                v-model="selectedPortions[day.dateString]"
              />
              <UButton
                size="sm"
                aria-label="Voeg toe"
                class="w-full mt-1 font-bold"
                @click="handleAddRecipe(day.date)"
              >
                Plan deze maaltijd in
              </UButton>
            </div>
            <!-- Show placeholder text centered if no recipe is selected yet -->
            <p
              v-else
              class="text-xs text-gray-400 text-center flex-grow flex items-center justify-center"
            >
              Kies een recept om in te plannen.
            </p>
          </template>
          <p v-else class="text-xs text-gray-400 text-center">
            Voeg recepten toe.
          </p>
        </div>

        <!-- Planned Meal Title: Positioned bottom-right when meal exists -->
        <div
          v-if="day.meals.value.length > 0"
          class="absolute bottom-2 right-2 z-10 p-2 text-white text-right"
        >
          <span class="text-xl font-semibold"
            >{{ day.meals.value[0].recipeTitle }} ({{
              day.meals.value[0].portions
            }}x)</span
          >
        </div>
      </div>
    </div>
  </UContainer>
</template>
