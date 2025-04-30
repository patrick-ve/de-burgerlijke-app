<script setup lang="ts">
const { onboardingState } = useOnboardingSettings();
</script>

<template>
  <!-- Modern Quick Start Grid -->
  <section class="max-w-7xl mx-auto">
    <div class="flex items-center gap-2 mb-4">
      <UIcon name="i-heroicons-bolt" class="text-blue-400 w-7 h-7" />
      <h2 class="text-2xl font-semibold text-gray-900 tracking-tight">
        Snel aan de slag {{ onboardingState }}
      </h2>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Card 1 -->
      <div
        class="group relative flex flex-col items-start rounded-2xl bg-white shadow-lg p-3 transition"
      >
        <div class="flex items-center gap-3 w-full mb-0">
          <div
            class="flex items-center justify-center w-8 h-8 rounded-full bg-pink-100 shadow group-hover:scale-110 transition"
          >
            <UIcon
              name="i-heroicons-book-open"
              class="w-5 h-5 text-pink-400"
            />
          </div>
          <h3 class="font-semibold text-gray-900 text-lg">
            1. Voeg recepten toe
          </h3>
        </div>
        <p class="text-sm text-gray-600 mb-3">
          Importeer eenvoudig recepten van websites, YouTube, of via
          een foto van een kookboek of notitie. Deze worden opgeslagen
          in je eigen receptenboek, inclusief de ingrediënten en
          instructies.
        </p>
        <UButton
          to="/app/recipes/new"
          variant="solid"
          color="primary"
          icon="i-heroicons-plus-circle"
          class="mt-auto font-bold"
          size="sm"
        >
          Voeg een recept toe
        </UButton>
      </div>
      <!-- Card 2 -->
      <div
        class="group relative flex flex-col items-start rounded-2xl bg-white shadow-lg p-3 transition"
      >
        <div class="flex items-center gap-3 w-full mb-0">
          <div
            class="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 shadow group-hover:scale-110 transition"
          >
            <UIcon
              name="i-heroicons-calendar-days"
              class="w-5 h-5 text-blue-400"
            />
          </div>
          <h3 class="font-semibold text-gray-900 text-lg">
            2. Plan maaltijden in
          </h3>
        </div>
        <p class="text-sm text-gray-600 mb-3">
          Gebruik de planner om je opgeslagen recepten in te plannen
          voor de komende dagen of week.
        </p>
        <UButton
          to="/app/planner"
          variant="solid"
          color="primary"
          icon="i-heroicons-calendar-days"
          class="mt-auto font-bold"
          size="sm"
        >
          Ga naar de planner
        </UButton>
      </div>
      <!-- Card 3 -->
      <div
        class="group relative flex flex-col items-start rounded-2xl bg-white shadow-lg p-3 transition"
      >
        <div class="flex items-center gap-3 w-full mb-0">
          <div
            class="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 shadow group-hover:scale-110 transition"
          >
            <UIcon
              name="i-heroicons-shopping-cart"
              class="w-5 h-5 text-green-400"
            />
          </div>
          <h3 class="font-semibold text-gray-900 text-lg">
            3. Genereer je boodschappenlijst
          </h3>
        </div>
        <p class="text-sm text-gray-600 mb-3">
          Genereer automatisch een boodschappenlijst op basis van je
          planning. Wij helpen je de goedkoopste opties te vinden bij
          verschillende supermarkten.
        </p>
        <UButton
          to="/app/shopping-list"
          variant="solid"
          color="primary"
          icon="i-heroicons-list-bullet"
          class="mt-auto font-bold"
          size="sm"
        >
          Bekijk boodschappenlijst
        </UButton>
      </div>
    </div>
  </section>
</template>
