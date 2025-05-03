<script setup lang="ts">
import { consola } from 'consola';
import type { Supermarket } from '~/types/shopping-list';
import { useNavigationState } from '~/composables/useNavigationState';
import { computed } from 'vue';

const { $pwa } = useNuxtApp();

useHead({
  title: 'Home - De Burgerlijke App',
});

const { openNav } = useNavigationState();
const { isIos } = useDevice();

const availableSupermarkets = ref<Supermarket[]>([]);
const showIosInstallModal = ref(false);

const isStandalone = computed(() => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(display-mode: standalone)').matches;
  }
  return false;
});

const toggleHamburgerMenu = () => {
  openNav();
};

const installPWA = async () => {
  const { isIos } = useDevice();
  try {
    if (isIos) {
      showIosInstallModal.value = true;
      umTrackEvent('show_ios_install_modal');
      return;
    }

    if (!$pwa?.showInstallPrompt) {
      consola.warn('Install prompt not available.');
      return;
    }

    await $pwa.install();
    umTrackEvent('install_pwa');
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
        v-if="isIos && !isStandalone"
        color="primary"
        variant="solid"
        aria-label="Installeer op iOS"
        class="font-bold"
        label="Installeer"
        @click="installPWA"
      />
      <UButton
        v-else-if="$pwa?.showInstallPrompt"
        color="primary"
        variant="solid"
        label="Installeer"
        aria-label="Installeer de app"
        class="font-bold"
        @click="installPWA"
      />
    </template>
  </TheHeader>

  <div
    class="flex flex-col gap-8 px-4 py-6 bg-gradient-to-b from-pink-50 via-blue-50 to-green-50 min-h-screen"
  >
    <OnboardingModal :supermarkets="availableSupermarkets" />

    <UModal
      v-model="showIosInstallModal"
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
          <h3 class="text-base font-semibold leading-6 text-gray-900">
            Installeren op iOS of iPadOS
          </h3>
        </template>
        <div class="space-y-2 text-sm text-gray-700">
          <p>Om deze app op je iPhone of iPad te installeren:</p>
          <ol class="list-decimal list-inside space-y-1">
            <li>
              Tik op de <strong>Deel knop</strong> (<UIcon
                name="i-heroicons-arrow-up-on-square"
              />) in de Safari-werkbalk.
            </li>
            <li>
              Scroll naar beneden en tik op
              <strong>'Zet op beginscherm'</strong>.
            </li>
            <li>Tik op <strong>'Voeg toe'</strong>.</li>
          </ol>
        </div>
        <template #footer>
          <UButton
            label="Sluiten"
            color="gray"
            @click="showIosInstallModal = false"
          />
        </template>
      </UCard>
    </UModal>

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
