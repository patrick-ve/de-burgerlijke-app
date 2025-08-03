<script setup lang="ts">
import { useNavigationState } from '~/composables/useNavigationState';
import { useRoute } from 'vue-router';

const { isNavOpen, closeNav } = useNavigationState();
const route = useRoute();
const pwa = usePWA();

// Define the navigation structure with groups
const navigationGroups = [
  {
    title: 'Home',
    links: [
      {
        label: 'Home',
        to: '/app',
        icon: 'i-heroicons-home',
      },
    ],
  },
  {
    title: 'Koken & Boodschappen',
    links: [
      {
        label: 'Recepten',
        to: '/app/recipes',
        icon: 'i-heroicons-book-open',
      },
      {
        label: 'Maaltijdenplanner',
        to: '/app/planner',
        icon: 'i-heroicons-calendar-days',
      },
      {
        label: 'Boodschappenlijst',
        to: '/app/shopping-list',
        icon: 'i-heroicons-shopping-cart',
      },
    ],
  },
  {
    title: 'Planning & Kalender',
    links: [
      {
        label: 'Takenlijst',
        to: '/app/to-do',
        icon: 'i-heroicons-check-circle',
      },
      {
        label: 'Verjaardagen',
        to: '/app/birthdays',
        icon: 'i-heroicons-cake',
      },
      {
        label: 'Vakantie',
        to: '/app/holiday',
        icon: 'i-heroicons-globe-alt',
      },
      {
        label: 'Baby',
        to: '/app/baby',
        icon: 'i-heroicons-heart',
      },
    ],
  },
  {
    title: 'Hulpmiddelen',
    links: [
      {
        label: 'Vertalen',
        to: '/app/translate',
        icon: 'i-heroicons-language',
      },
    ],
  },
  // {
  //   title: 'Instellingen',
  //   links: [
  //     {
  //       label: 'Instellingen',
  //       to: '/settings',
  //       icon: 'i-heroicons-cog-6-tooth',
  //     },
  //   ],
  // },
];

// Close slideover on navigation
watch(
  () => route.fullPath,
  () => {
    closeNav();
  }
);

const installPWA = () => {
  pwa?.install();
  closeNav(); // Optionally close nav after initiating install
};
</script>

<template>
  <USlideover
    v-model="isNavOpen"
    side="left"
    :ui="{
      width: 'max-w-[66vw] md:max-w-[20vw]',
      overlay: {
        background: 'bg-black/40 backdrop-blur-sm',
      },
    }"
  >
    <div class="p-4 space-y-4 h-full flex flex-col bg-white">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900">
          De Burgerlijke App
        </h3>
        <UButton
          color="gray"
          variant="ghost"
          icon="i-heroicons-x-mark-20-solid"
          size="md"
          class="-mr-2 text-gray-700"
          @click="closeNav"
        />
      </div>

      <nav class="flex-grow space-y-1">
        <div
          v-for="group in navigationGroups"
          :key="group.title"
          class="mb-6"
        >
          <h4
            v-if="group.title !== 'Home'"
            class="px-3 py-2 -mb-1 text-sm font-bold text-primary-500 uppercase tracking-wider"
          >
            {{ group.title }}
          </h4>
          <NuxtLink
            v-for="link in group.links"
            :key="link.to"
            :disabled="link.to === '/baby'"
            :to="link.to"
            class="flex items-center gap-3 px-3 py-1.5 text-base rounded-lg text-gray-900 hover:bg-white/30 transition-colors duration-150"
            active-class="bg-white/50 text-primary-700 font-semibold"
          >
            <UIcon :name="link.icon" class="w-5 h-5 flex-shrink-0" />
            <span>{{ link.label }}</span>
          </NuxtLink>
        </div>
      </nav>

      <!-- Settings Link -->
      <div class="mt-auto pt-4 border-t border-gray-200">
        <NuxtLink
          to="/app/settings"
          class="flex items-center gap-3 px-3 py-1.5 text-base rounded-lg text-gray-900 hover:bg-white/30 transition-colors duration-150"
          active-class="bg-white/50 text-primary-700 font-semibold"
        >
          <UIcon
            name="i-heroicons-cog-6-tooth"
            class="w-5 h-5 flex-shrink-0"
          />
          <span>Instellingen</span>
        </NuxtLink>
      </div>
    </div>
  </USlideover>
</template>
