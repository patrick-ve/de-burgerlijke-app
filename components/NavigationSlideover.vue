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
    label: 'Planner',
    to: '/planner',
    icon: 'i-heroicons-calendar-days',
  },
  {
    label: 'Boodschappenlijst',
    to: '/shopping-list',
    icon: 'i-heroicons-shopping-cart',
  },
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
      class="bg-primary flex items-center h-16 justify-between p-2 border-b border-gray-200 dark:border-gray-800"
    >
      <h3 class="pl-2 text-base font-bold leading-6 text-white">
        De Burgerlijke App
      </h3>

      <UButton
        color="white"
        variant="ghost"
        icon="i-heroicons-x-mark-20-solid"
        size="xl"
        class="text-white font-bold translate-y-1"
        @click="closeNav"
      />
    </div>

    <div class="p-4 space-y-1">
      <NuxtLink
        v-for="link in navigation"
        :key="link.to"
        :to="link.to"
        class="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
        active-class="border-l-2 border-primary text-primary-500 font-bold bg-primary-50"
      >
        <UIcon :name="link.icon" class="w-5 h-5" />
        <span>{{ link.label }}</span>
      </NuxtLink>
    </div>
  </USlideover>
</template>
