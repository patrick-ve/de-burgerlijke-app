<script setup lang="ts">
import { consola } from 'consola';
import type { Supermarket } from '~/types/shopping-list';
import { useNavigationState } from '~/composables/useNavigationState';

const { $pwa } = useNuxtApp();

useHead({
  title: 'Home - De Burgerlijke App',
});

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
</script>

<template>
  <TheHeader title="De Burgerlijke App">
    <template #left-action>
      <UButton
        color="gray"
        variant="ghost"
        aria-label="Open navigatie menu"
        icon="i-heroicons-bars-3"
        size="md"
        @click="toggleHamburgerMenu"
      />
    </template>
    <template #right-action>
      <UButton
        v-if="$pwa?.showInstallPrompt"
        color="primary"
        variant="solid"
        label="Installeer"
        class="font-bold"
        @click="installPWA"
      />
    </template>
  </TheHeader>

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

    <OnboardingSteps />
  </div>
</template>
