<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'; // Add onMounted
import type { ScheduledMeal } from '~/composables/useMealPlanner'; // Import the type
import {
  useWeather,
  type WeatherInfo,
} from '~/composables/useWeather'; // Import the weather composable and type
import { useHeaderState } from '~/composables/useHeaderState';
import {
  useMealPlanner,
  type NextAvailableMealsResult,
} from '~/composables/useMealPlanner';
import { useNavigationState } from '~/composables/useNavigationState';

useHead({
  title: 'Home - De Burgerlijke App',
});

// Meal Planner Logic
const { getMealsForDate, getNextAvailableMeals } = useMealPlanner();
const today = new Date();

// Get today's meals (reactive)
const todaysMeals = getMealsForDate(today);

// Get the next available meals (non-reactive, fetched once)
const nextAvailable = getNextAvailableMeals(today);

// Determine which meals and date to display
const displayData = computed(() => {
  if (todaysMeals.value.length > 0) {
    return {
      date: today,
      meals: todaysMeals.value,
      isToday: true,
    };
  } else {
    return {
      date: nextAvailable.date, // This might be null
      meals: nextAvailable.meals,
      isToday: false,
    };
  }
});

// Weather Logic
// TODO: Make location dynamic (e.g., based on user settings or geolocation)
const {
  weatherData,
  isLoading: isLoadingWeather,
  error: weatherError,
  characterImage,
  hourlyForecast,
} = useWeather();

// Helper to format date for display
const formattedDisplayDate = computed(() => {
  if (!displayData.value.date) {
    return 'Geen maaltijden gepland'; // Fallback message if no meals are planned at all
  }
  const dateToFormat = displayData.value.date;
  const prefix = displayData.value.isToday
    ? 'vandaag'
    : `op ${dateToFormat.toLocaleDateString('nl-NL', { weekday: 'long' })}`;

  return `${prefix} (${dateToFormat.toLocaleDateString('nl-NL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })})`;
});

const { headerState, setHeader, resetHeader } = useHeaderState();
const { openNav } = useNavigationState();

const toggleHamburgerMenu = () => {
  openNav();
};

onMounted(() => {
  setHeader({
    title: 'Home',
    showLeftAction: true,
    leftActionHandler: toggleHamburgerMenu,
    showRightAction: false,
    rightActionHandler: null,
  });
});
</script>

<template>
  <!-- Teleport Add button to the header -->
  <Teleport to="#header-left-action">
    <UButton
      v-if="headerState.showLeftAction"
      color="black"
      variant="ghost"
      aria-label="Open navigatie menu"
      icon="i-heroicons-bars-3"
      size="md"
      @click="toggleHamburgerMenu"
    />
  </Teleport>

  <div class="space-y-6 p-4">
    <UCard>
      <template #header>
        <h2 class="text-xl font-semibold">
          Maaltijdplanning {{ formattedDisplayDate }}
        </h2>
      </template>

      <div v-if="displayData.meals.length > 0" class="space-y-4">
        <div
          v-for="meal in displayData.meals"
          :key="meal.id"
          class="flex items-center space-x-4"
        >
          <img
            v-if="meal.imageUrl"
            :src="meal.imageUrl"
            :alt="`Afbeelding van ${meal.recipeTitle}`"
            class="h-16 w-16 rounded object-cover"
            loading="lazy"
          />
          <UAvatar
            v-else
            icon="i-heroicons-photo"
            size="lg"
            class="bg-gray-200 dark:bg-gray-700"
          />
          <div>
            <p class="font-medium">
              {{ meal.recipeTitle }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Porties: {{ meal.portions }}
            </p>
            <NuxtLink
              :to="`/recipes/${meal.recipeId}`"
              class="text-sm text-primary-500 hover:underline"
            >
              Bekijk recept
            </NuxtLink>
          </div>
        </div>
      </div>
      <div v-else>
        <p class="text-gray-500 dark:text-gray-400">
          Er zijn momenteel geen maaltijden gepland.
        </p>

        <UButton
          to="/planner"
          variant="link"
          icon="i-heroicons-calendar-days"
          class="mt-2"
          size="sm"
        >
          Plan een maaltijd
        </UButton>
      </div>
    </UCard>

    <!-- Weather Section -->
    <section class="overflow-hidden rounded-lg shadow bg-gray-50/50">
      <!-- Loading State -->
      <div
        v-if="isLoadingWeather"
        class="space-y-2 p-6 flex flex-col items-center justify-center min-h-[250px]"
      >
        <USkeleton class="h-32 w-32 mb-2 bg-gray-700" />
        <USkeleton class="h-8 w-24 mt-2 bg-gray-700" />
        <USkeleton class="h-4 w-32 mt-1 bg-gray-700" />
      </div>

      <!-- Error State -->
      <div
        v-else-if="weatherError"
        class="p-6 min-h-[250px] flex items-center justify-center"
      >
        <UAlert
          icon="i-heroicons-exclamation-triangle"
          color="red"
          variant="soft"
          title="Fout bij laden weerbericht"
          :description="
            weatherError.message || 'Kon het weer niet ophalen.'
          "
          class="bg-red-900/50 text-red-100"
        />
      </div>

      <!-- Success State -->
      <div v-else-if="weatherData">
        <!-- Top Section: Temp/Location + Image -->
        <div class="flex items-center justify-between p-6">
          <!-- Left Side: Location, Rain, Temp -->
          <div class="flex flex-col">
            <h2 class="text-2xl font-bold">
              {{ weatherData.location || 'Locatie' }}
            </h2>
            <p
              v-if="weatherData.chanceOfRain !== undefined"
              class="text-sm text-gray-300 mt-1"
            >
              Kans op regen: {{ weatherData.chanceOfRain }}%
            </p>
            <p class="text-6xl font-bold mt-2">
              {{ weatherData.temperature }}°
            </p>
            <p
              class="text-sm uppercase tracking-wider text-gray-700 mt-1"
            >
              {{ weatherData.description }}
            </p>
          </div>

          <!-- Right Side: Character Image -->
          <div class="flex-shrink-0">
            <img
              :src="characterImage"
              alt="Weer karakter"
              class="h-36 w-auto"
              loading="lazy"
            />
          </div>
        </div>

        <!-- Hourly Forecast Section -->
        <div
          v-if="hourlyForecast.length > 0"
          class="mt-4 pt-4 pb-4 px-6 border-t border-gray-700"
        >
          <h3
            class="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3"
          >
            Voorspelling per uur
          </h3>

          <div class="flex space-x-1.5 pb-2 -mx-1">
            <div
              v-for="(hour, index) in hourlyForecast"
              :key="index"
              class="flex flex-col items-center text-center flex-shrink-0 w-16 space-y-1"
            >
              <p class="text-sm font-medium text-gray-300">
                {{ hour.time }}
              </p>
              <UIcon
                :name="hour.icon"
                class="text-3xl"
                :title="hour.description"
              />
              <p class="text-lg font-semibold">
                {{ hour.temperature }}°
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Fallback -->
      <div
        v-else
        class="p-6 min-h-[250px] flex items-center justify-center"
      >
        <p class="text-gray-400 text-center">
          Weergegevens niet beschikbaar.
        </p>
      </div>
    </section>
  </div>
</template>
