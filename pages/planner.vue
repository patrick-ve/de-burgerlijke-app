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
      <UCard v-for="day in daysOfWeek" :key="day.dateString">
        <template #header>
          <div
            class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2"
          >
            <!-- Day and Date -->
            <div>
              <div class="font-semibold capitalize">
                {{ day.name }}
              </div>
              <div class="text-sm text-gray-500">
                {{ day.shortDate }}
              </div>
            </div>

            <!-- Add Recipe Controls -->
            <div class="flex-grow sm:max-w-[200px]">
              <template v-if="recipeOptions.length > 0">
                <USelectMenu
                  v-model="selectedRecipeId[day.dateString]"
                  :options="recipeOptions"
                  placeholder="Kies recept..."
                  value-attribute="value"
                  option-attribute="label"
                  size="sm"
                  class="mb-1"
                />
                <div
                  v-if="selectedRecipeId[day.dateString]"
                  class="flex items-center gap-1 mt-2"
                >
                  <!-- Use PortionSelector -->
                  <PortionSelector
                    v-model="selectedPortions[day.dateString]"
                    class="flex-grow"
                  />
                  <UButton
                    icon="i-heroicons-plus"
                    size="sm"
                    variant="outline"
                    aria-label="Voeg toe"
                    class="flex-shrink-0 ml-1"
                    @click="handleAddRecipe(day.date)"
                  />
                </div>
              </template>
              <p
                v-else
                class="text-xs text-gray-400 text-center mt-1"
              >
                Voeg recepten toe.
              </p>
            </div>
          </div>
        </template>

        <div class="space-y-2 min-h-[100px]">
          <!-- Display scheduled meals -->
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
          <!-- Message if no meals -->
          <p
            v-if="day.meals.value.length === 0"
            class="text-xs text-gray-400 text-center pt-4"
          >
            Nog geen maaltijden gepland.
          </p>
        </div>
      </UCard>
    </div>
  </UContainer>
</template>
