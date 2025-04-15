<script setup lang="ts">
import { useRecipes } from '~/composables/useRecipes';
import { useMealPlanner } from '~/composables/useMealPlanner';
import { useHeaderState } from '~/composables/useHeaderState';
import PortionSelector from '~/components/PortionSelector.vue';
import type { Recipe } from '~/types/recipe';
// --- Remove type import that's no longer needed directly here ---
// import type { ScheduledMeal } from '~/composables/useMealPlanner'; // Import from composable

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
</script>

<template>
  <UContainer>
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
  </UContainer>
</template>
