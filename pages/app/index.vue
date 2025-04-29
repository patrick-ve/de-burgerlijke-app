<script setup lang="ts">
import { consola } from 'consola';
import type { Supermarket } from '~/types/shopping-list';
import { useHeaderState } from '~/composables/useHeaderState';
import { useNavigationState } from '~/composables/useNavigationState';

const { $pwa } = useNuxtApp();

useHead({
  title: 'Home - De Burgerlijke App',
});

const { headerState, setHeader } = useHeaderState();
const { openNav } = useNavigationState();

const availableSupermarkets = ref<Supermarket[]>([]);

const toggleHamburgerMenu = () => {
  openNav();
};

const installPWA = async () => {
  try {
    if (!$pwa?.showInstallPrompt) {
      consola.warn('Install prompt not available.');
      return;
    }
    await $pwa.install();
  } catch (error) {
    consola.error('PWA installation failed:', error);
  }
};

onMounted(() => {
  setHeader({
    title: 'De Burgerlijke App',
    showLeftAction: true,
    leftActionHandler: toggleHamburgerMenu,
    showRightAction: true, // Keep this true so the Teleport target exists
    // Right action handler is now handled by the conditional button below
    // rightActionHandler: installPWA,
  });
});
</script>

<template>
  <Teleport to="#header-left-action">
    <UButton
      v-if="headerState.showLeftAction"
      color="gray"
      variant="ghost"
      aria-label="Open navigatie menu"
      icon="i-heroicons-bars-3"
      size="md"
      @click="toggleHamburgerMenu"
    />
  </Teleport>

  <Teleport to="#header-right-action">
    <!-- Conditionally render install button only when the prompt is available -->
    <UButton
      v-if="$pwa?.showInstallPrompt"
      color="primary"
      variant="solid"
      label="Installeer"
      class="font-bold"
      @click="installPWA"
    />
  </Teleport>

  <div
    class="flex flex-col gap-8 px-4 py-6 bg-gradient-to-b from-pink-50 via-blue-50 to-green-50 min-h-screen"
  >
    <OnboardingModal :supermarkets="availableSupermarkets" />

    <!-- Modern Hero Section -->
    <section
      class="relative flex flex-col items-center justify-center rounded-3xl backdrop-blur-md px-6"
    >
      <div class="absolute inset-0 pointer-events-none">
        <div
          class="absolute -top-10 -left-10 w-40 h-40 bg-pink-200/40 rounded-full blur-2xl"
        ></div>
        <div
          class="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-200/40 rounded-full blur-2xl"
        ></div>
      </div>
      <div class="relative flex items-center gap-3">
        <h1
          class="text-2xl md:text-4xl text-center font-extrabold text-gray-900 tracking-tight"
        >
          Bespaar tijd en geld,<br />organiseer je huishouden
          efficiënter
        </h1>
      </div>
      <p
        class="relative text-md text-gray-700 mt-4 text-center max-w-2xl"
      >
        Jouw hulp voor het makkelijk organiseren van recepten, plannen
        van maaltijden en goedkoper boodschappen doen.<br />
      </p>
    </section>

    <!-- Modern Quick Start Grid -->
    <section>
      <div class="flex items-center gap-2 mb-4">
        <UIcon
          name="i-heroicons-bolt"
          class="text-blue-400 w-7 h-7"
        />
        <h2
          class="text-2xl font-semibold text-gray-900 tracking-tight"
        >
          Snel aan de slag
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
            een foto van een kookboek of notitie. Deze worden
            opgeslagen in je eigen receptenboek, inclusief de
            ingrediënten en instructies.
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
            planning. Wij helpen je de goedkoopste opties te vinden
            bij verschillende supermarkten.
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
  </div>
</template>
