<script setup lang="ts">
import { useNavigationState } from '~/composables/useNavigationState';

const { isNavOpen, closeNav } = useNavigationState();
const route = useRoute();

const navigation = [
  {
    label: 'Home',
    to: '/',
    icon: 'i-heroicons-home',
  },
  {
    label: 'Recepten',
    to: '/recipes',
    icon: 'i-heroicons-book-open',
  },
  {
    label: 'Maaltijdenplanner',
    to: '/planner',
    icon: 'i-heroicons-calendar-days',
  },
  {
    label: 'Boodschappenlijst',
    to: '/shopping-list',
    icon: 'i-heroicons-shopping-cart',
  },
  {
    label: 'Takenlijst',
    to: '/to-do',
    icon: 'i-heroicons-check-circle',
  },
  // {
  //   label: 'Verjaardagen',
  //   to: '/birthdays',
  //   icon: 'i-heroicons-cake',
  // },
  // {
  //   label: 'Baby',
  //   to: '/baby',
  //   icon: 'i-heroicons-user',
  // },
];

// Close slideover on navigation
watch(
  () => route.fullPath,
  () => {
    closeNav();
  }
);
</script>

<template>
  <USlideover
    v-model="isNavOpen"
    side="left"
    :ui="{
      width: 'max-w-[66vw]',
      overlay: {
        background: 'bg-black/40 backdrop-blur-sm',
      },
    }"
  >
    <div
      class="p-4 space-y-4 h-full flex flex-col bg-gradient-to-b from-pink-50 via-blue-50 to-green-50"
    >
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
        <NuxtLink
          v-for="link in navigation"
          :key="link.to"
          :disabled="link.to === '/baby'"
          :to="link.to"
          class="flex items-center gap-3 px-3 py-2 text-base rounded-lg text-gray-900 hover:bg-white/30 transition-colors duration-150"
          active-class="bg-white/50 text-primary-700 font-semibold"
        >
          <UIcon :name="link.icon" class="w-5 h-5" />
          <span>{{ link.label }}</span>
        </NuxtLink>
      </nav>

      <div class="mt-auto flex justify-center">
        <img
          src="/illustration.png"
          class="w-[60%] h-auto object-contain"
        />
      </div>
    </div>
  </USlideover>
</template>
