<script setup lang="ts">
import { computed } from 'vue';
import { useMealPlanner } from '~/composables/useMealPlanner';
import { useBirthdays } from '~/composables/useBirthdays';
import { useToDos } from '~/composables/useToDos';
import type { ToDo } from '~/composables/useToDos';

// Get data from composables
const { getNextAvailableMeals } = useMealPlanner();
const { sortedBirthdays } = useBirthdays();
const { sortedPendingTodos } = useToDos();

// Get the next available meal(s)
const nextMealsData = computed(() => getNextAvailableMeals());
const nextMealDate = computed(() => nextMealsData.value.date);
const nextMeals = computed(() => nextMealsData.value.meals);

// Get the next upcoming birthday
const nextBirthday = computed(() =>
  sortedBirthdays.value.length > 0 ? sortedBirthdays.value[0] : null
);

// Get the top 3 pending To-Dos
const upcomingToDos = computed(() =>
  sortedPendingTodos.value.slice(0, 3)
);

// Helper to format dates
const formatDate = (
  date: Date | string | null | undefined
): string => {
  if (!date) return 'N/A';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
    return dateObj.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  return 'Invalid Date';
};

const formatShortDate = (
  date: Date | string | null | undefined
): string => {
  if (!date) return 'Geen vervaldatum';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
    return dateObj.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  }
  return 'Ongeldige datum';
};

const formatRelativeDate = (
  date: Date | string | null | undefined
): string => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime()))
    return '';

  const today = new Date();
  const diffTime = dateObj.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Vandaag';
  if (diffDays === 1) return 'Morgen';
  if (diffDays > 1 && diffDays <= 7) return `Over ${diffDays} dagen`;
  return '';
};
</script>

<template>
  <div class="space-y-6">
    <!-- Main Dashboard Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Next Meal Card -->
      <div class="lg:col-span-2">
        <div
          class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <div class="px-4 py-4 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="flex-shrink-0">
                  <div
                    class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"
                  >
                    <UIcon
                      name="i-heroicons-calendar-days"
                      class="w-5 h-5 text-blue-600"
                    />
                  </div>
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-gray-900">
                    Volgende Geplande Maaltijd
                  </h3>
                  <p class="text-sm text-gray-500">
                    Je aankomende maaltijdplanning
                  </p>
                </div>
              </div>
              <div v-if="nextMealDate" class="text-right">
                <p class="text-sm font-medium text-gray-900">
                  {{ formatDate(nextMealDate) }}
                </p>
                <p class="text-xs text-gray-500">
                  {{ formatRelativeDate(nextMealDate) }}
                </p>
              </div>
            </div>
          </div>

          <div class="px-4 py-4">
            <div
              v-if="nextMealDate && nextMeals.length > 0"
              class="space-y-4"
            >
              <div class="grid gap-3">
                <div
                  v-for="meal in nextMeals"
                  :key="meal.id"
                  class="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                >
                  <div class="flex items-center space-x-3">
                    <div
                      class="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm"
                    >
                      <UIcon
                        name="i-heroicons-cake"
                        class="w-4 h-4 text-gray-600"
                      />
                    </div>
                    <div>
                      <p class="font-medium text-gray-900">
                        {{ meal.recipeTitle }}
                      </p>
                      <p class="text-sm text-gray-500">
                        {{ meal.portions }}
                        {{
                          meal.portions === 1 ? 'portie' : 'porties'
                        }}
                      </p>
                    </div>
                  </div>
                  <UBadge color="blue" variant="soft" size="sm">
                    Gepland
                  </UBadge>
                </div>
              </div>
            </div>

            <div v-else class="text-center py-6">
              <div
                class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <UIcon
                  name="i-heroicons-calendar-days"
                  class="w-6 h-6 text-gray-400"
                />
              </div>
              <h4 class="text-sm font-medium text-gray-900 mb-1">
                Geen maaltijden gepland
              </h4>
              <p class="text-sm text-gray-500">
                Begin met het plannen van je volgende maaltijd om deze
                hier te zien
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Next Birthday Card -->
      <div>
        <div
          class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <div class="px-4 py-4 border-b border-gray-200">
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0">
                <div
                  class="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center"
                >
                  <UIcon
                    name="i-heroicons-cake"
                    class="w-5 h-5 text-pink-600"
                  />
                </div>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900">
                  Volgende Verjaardag
                </h3>
                <p class="text-sm text-gray-500">
                  Aankomende viering
                </p>
              </div>
            </div>
          </div>

          <div class="px-4 py-4">
            <div v-if="nextBirthday" class="space-y-4">
              <div class="text-center">
                <div
                  class="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3"
                >
                  <span class="text-2xl">🎉</span>
                </div>
                <h4 class="text-xl font-semibold text-gray-900 mb-1">
                  {{ nextBirthday.name }}
                </h4>
                <p class="text-sm text-gray-600 mb-2">
                  {{ formatDate(nextBirthday.date) }}
                </p>
                <p
                  v-if="formatRelativeDate(nextBirthday.date)"
                  class="text-xs font-medium text-pink-600 bg-pink-50 px-3 py-1 rounded-full inline-block"
                >
                  {{ formatRelativeDate(nextBirthday.date) }}
                </p>
              </div>

              <div
                v-if="nextBirthday.birthYear"
                class="text-center pt-3 border-t border-gray-100"
              >
                <p class="text-sm text-gray-500">
                  Wordt
                  <span class="font-medium text-gray-900">{{
                    new Date().getFullYear() - nextBirthday.birthYear
                  }}</span>
                  jaar oud
                </p>
              </div>
            </div>

            <div v-else class="text-center py-6">
              <div
                class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <UIcon
                  name="i-heroicons-cake"
                  class="w-6 h-6 text-gray-400"
                />
              </div>
              <h4 class="text-sm font-medium text-gray-900 mb-1">
                Geen aankomende verjaardagen
              </h4>
              <p class="text-sm text-gray-500">
                Voeg verjaardagen toe om vieringen bij te houden
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- To-Dos Card -->
    <div
      class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
    >
      <div class="px-4 py-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="flex-shrink-0">
              <div
                class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"
              >
                <UIcon
                  name="i-heroicons-check-circle"
                  class="w-5 h-5 text-green-600"
                />
              </div>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900">
                Aankomende To-Do's
              </h3>
              <p class="text-sm text-gray-500">
                Je openstaande taken
              </p>
            </div>
          </div>
          <UBadge
            v-if="upcomingToDos.length > 0"
            color="green"
            variant="soft"
          >
            {{ upcomingToDos.length }} openstaand
          </UBadge>
        </div>
      </div>

      <div class="px-4 py-4">
        <div v-if="upcomingToDos.length > 0" class="space-y-3">
          <div
            v-for="(todo, index) in upcomingToDos"
            :key="todo.id"
            class="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200"
          >
            <div class="flex items-start space-x-3 flex-1">
              <div class="flex-shrink-0 mt-0.5">
                <div class="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">
                  {{ todo.text }}
                </p>
                <p
                  v-if="todo.dueDate"
                  class="text-xs text-gray-500 mt-1"
                >
                  Vervalt {{ formatShortDate(todo.dueDate) }}
                </p>
              </div>
            </div>

            <div class="flex items-center space-x-2 ml-4">
              <UBadge
                v-if="todo.dueDate"
                :color="
                  formatRelativeDate(todo.dueDate) === 'Vandaag'
                    ? 'red'
                    : 'gray'
                "
                variant="soft"
                size="xs"
              >
                <UIcon
                  name="i-heroicons-calendar"
                  class="w-3 h-3 mr-1"
                />
                {{ formatShortDate(todo.dueDate) }}
              </UBadge>
              <UBadge v-else color="gray" variant="outline" size="xs">
                Geen vervaldatum
              </UBadge>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-6">
          <div
            class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <UIcon
              name="i-heroicons-check-circle"
              class="w-6 h-6 text-gray-400"
            />
          </div>
          <h4 class="text-sm font-medium text-gray-900 mb-1">
            Alles afgerond!
          </h4>
          <p class="text-sm text-gray-500">
            Geen openstaande to-do's op dit moment
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
