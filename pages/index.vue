<script setup lang="ts">
import type { ScheduledMeal } from '~/composables/useMealPlanner'; // Import the type
import {
  useWeather,
  type WeatherInfo,
} from '~/composables/useWeather'; // Import the weather composable and type

useHead({
  title: 'Home - De Burgerlijke App',
});

// Meal Planner Logic
const { getMealsForDate } = useMealPlanner();
const today = new Date();
const todaysMeals = getMealsForDate(today); // This is a computed ref

// Weather Logic
// TODO: Make location dynamic (e.g., based on user settings or geolocation)
const {
  weatherData,
  isLoading: isLoadingWeather,
  error: weatherError,
} = useWeather();

// Helper to format date for display
const formattedDate = computed(() => {
  return today.toLocaleDateString('nl-NL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});

// Computed property for dynamic weather card classes
const weatherCardClasses = computed(() => {
  const baseClasses = [
    'p-4', // Adjusted padding
    'rounded-lg', // Keep rounded corners
    'text-center',
    'transition-colors',
    'duration-300',
    'ease-in-out',
    'flex',
    'flex-col',
    'items-center',
    'justify-between', // Space elements vertically
    'min-h-[150px]', // Give card a minimum height like the example
  ];

  if (!weatherData.value) {
    // Style for when data isn't loaded yet (but not loading/error state)
    return [...baseClasses, 'bg-gray-100', 'text-gray-800'];
  }

  const icon = weatherData.value.icon.toLowerCase();
  let background = 'bg-gray-400'; // Default background
  let text = 'text-white'; // Default text

  // Map icons to background colors based on image examples
  if (icon.includes('sun') && !icon.includes('cloud')) {
    // Sunny
    background = 'bg-sky-400';
  } else if (icon.includes('cloud-sun')) {
    // Partly Cloudy Day
    background = 'bg-sky-500';
  } else if (icon.includes('moon') && !icon.includes('cloud')) {
    // Clear Night
    background = 'bg-indigo-800';
  } else if (icon.includes('cloud-moon')) {
    // Partly Cloudy Night
    background = 'bg-indigo-700';
  } else if (icon.includes('cloud-arrow-down')) {
    // Rainy
    background = 'bg-blue-500';
  } else if (icon.includes('bolt')) {
    // Storm - Assuming a bolt icon exists/is mapped
    background = 'bg-purple-600';
  } else if (icon.includes('cloud-snow')) {
    // Snow/Sleet
    background = 'bg-cyan-400';
    text = 'text-gray-800'; // Lighter background might need darker text
  } else if (icon.includes('bars-3-bottom-left')) {
    // Fog - Using the example image color
    background = 'bg-cyan-600';
  } else if (icon.includes('cloud')) {
    // Generic Cloudy
    background = 'bg-gray-500';
  }

  return [...baseClasses, background, text];
});
</script>

<template>
  <div class="space-y-6 p-4">
    <UCard>
      <template #header>
        <h2 class="text-xl font-semibold">
          Maaltijdplanning voor vandaag ({{ formattedDate }})
        </h2>
      </template>

      <div v-if="todaysMeals.length > 0" class="space-y-4">
        <div
          v-for="meal in todaysMeals"
          :key="meal.id"
          class="flex items-center space-x-4"
        >
          <NuxtImg
            v-if="meal.imageUrl"
            :src="meal.imageUrl"
            :alt="`Afbeelding van ${meal.recipeTitle}`"
            class="h-16 w-16 rounded object-cover"
            width="64"
            height="64"
            fit="cover"
            loading="lazy"
            :modifiers="{ round: 'true' }"
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
            <!-- Add link to recipe details later -->
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
          Er is nog geen maaltijd gepland voor vandaag.
        </p>
        <!-- Optional: Add a link/button to the meal planner page -->
        <UButton
          to="/meal-planner"
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
    <UCard :ui="{ body: { padding: 'p-0' } }">
      <!-- Remove default body padding -->
      <template #header>
        <h2 class="text-xl font-semibold px-4 pt-4 sm:px-6 sm:pt-5">
          Weerbericht in {{ weatherData?.location || '...' }}
        </h2>
      </template>

      <!-- Loading State -->
      <div
        v-if="isLoadingWeather"
        class="space-y-2 p-4 sm:p-6 flex flex-col items-center justify-center min-h-[150px]"
      >
        <USkeleton class="h-12 w-12 rounded-full" />
        <USkeleton class="h-8 w-16 mt-2" />
        <USkeleton class="h-4 w-24 mt-1" />
      </div>

      <!-- Error State -->
      <div v-else-if="weatherError" class="p-4 sm:p-6">
        <UAlert
          icon="i-heroicons-exclamation-triangle"
          color="red"
          variant="soft"
          title="Fout bij laden weerbericht"
          :description="
            weatherError.message || 'Kon het weer niet ophalen.'
          "
        />
      </div>

      <!-- Success State -->
      <div v-else-if="weatherData" :class="weatherCardClasses">
        <!-- Re-add icon with styling -->
        <UIcon :name="weatherData.icon" class="text-5xl mb-1" />

        <!-- Temperature styling -->
        <p class="text-4xl font-bold leading-tight">
          {{ weatherData.temperature }}°
        </p>

        <!-- Description styling -->
        <p class="text-xs uppercase tracking-wider mt-1">
          {{ weatherData.description }}
        </p>
      </div>

      <!-- Fallback if no data and no error -->
      <div v-else class="p-4 sm:p-6">
        <p class="text-gray-500 dark:text-gray-400 text-center">
          Weergegevens niet beschikbaar.
        </p>
      </div>
    </UCard>
  </div>
</template>
