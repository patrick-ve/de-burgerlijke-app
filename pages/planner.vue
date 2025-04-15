<script setup lang="ts">
import { useRecipes } from '~/composables/useRecipes';
import { useMealPlanner } from '~/composables/useMealPlanner';
import { useHeaderState } from '~/composables/useHeaderState';
import type { Recipe } from '~/types/recipe';
import type { ScheduledMeal } from '~/composables/useMealPlanner'; // Import from composable

const { setHeader } = useHeaderState();
const { recipes } = useRecipes();
const { getMealsForDate, addMeal, removeMeal, getDateString } =
  useMealPlanner();

// Set header title
onMounted(() => {
  setHeader({ title: 'Maaltijdplanner' });
});

// Prepare recipes for select menu (value: id, label: title)
const recipeOptions = computed(
  () => recipes.value.map((r) => ({ label: r.title, value: r.id! })) // id guaranteed string by useRecipes
);

// Keep selected recipe ID for each day's select menu, using empty string for no selection
const selectedRecipeId = ref<Record<string, string>>({});

// Generate days of the week
const today = new Date();
const daysOfWeek = Array.from({ length: 7 }).map((_, i) => {
  const date = new Date(today);
  date.setDate(today.getDate() + i);
  const dateString = getDateString(date); // Use helper from composable
  selectedRecipeId.value[dateString] = ''; // Initialize selection state with empty string
  return {
    date,
    dateString,
    name: date.toLocaleDateString('nl-NL', { weekday: 'long' }), // Dutch weekday
    shortDate: date.toLocaleDateString('nl-NL', {
      month: 'short',
      day: 'numeric',
    }), // Dutch date format
    meals: getMealsForDate(date), // Get reactive meals ref from composable
  };
});

// Function to add the selected recipe to a day
function handleAddRecipe(date: Date) {
  const dateString = getDateString(date);
  const recipeIdToAdd = selectedRecipeId.value[dateString];

  if (recipeIdToAdd) {
    const recipeToAdd = recipes.value.find(
      (r) => r.id === recipeIdToAdd
    );
    if (recipeToAdd) {
      // TODO: Allow specifying portions
      addMeal(recipeToAdd, date);
      selectedRecipeId.value[dateString] = ''; // Reset selection to empty string
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
      <UCard v-for="day in daysOfWeek" :key="day.dateString">
        <template #header>
          <div class="font-semibold capitalize">
            {{ day.name }}
          </div>
          <div class="text-sm text-gray-500">
            {{ day.shortDate }}
          </div>
        </template>

        <div class="space-y-2 min-h-[150px]">
          <!-- Display scheduled meals (day.meals is now Ref<ScheduledMeal[]>) -->
          <div
            v-for="meal in day.meals.value"
            :key="meal.id"
            class="text-sm p-2 bg-primary-100 rounded flex justify-between items-center"
          >
            <span>{{ meal.recipeTitle }} ({{ meal.portions }}p)</span>
            <UButton
              icon="i-heroicons-x-mark"
              size="xs"
              color="red"
              variant="ghost"
              aria-label="Verwijder maaltijd"
              @click="handleRemoveMeal(meal.id, day.date)"
            />
          </div>

          <!-- Add recipe section -->
          <div class="pt-2 border-t border-gray-200">
            <USelectMenu
              v-if="recipeOptions.length > 0"
              v-model="selectedRecipeId[day.dateString]"
              :options="recipeOptions"
              placeholder="Kies een recept..."
              value-attribute="value"
              option-attribute="label"
              size="sm"
            />
            <UButton
              v-if="selectedRecipeId[day.dateString]"
              size="sm"
              variant="outline"
              label="Voeg toe"
              class="mt-2 w-full justify-center"
              @click="handleAddRecipe(day.date)"
            />
            <p
              v-else-if="recipeOptions.length === 0"
              class="text-xs text-gray-400 text-center mt-2"
            >
              Voeg eerst recepten toe.
            </p>
          </div>
        </div>
      </UCard>
    </div>
  </UContainer>
</template>
