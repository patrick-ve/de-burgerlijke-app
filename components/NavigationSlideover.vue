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
    label: 'Boodschappen',
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
      class="bg-primary flex items-center h-16 justify-between p-4 border-b border-gray-200 dark:border-gray-800"
    >
      <h3 class="text-base font-bold leading-6 text-white">
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

    <UVerticalNavigation
      :links="navigation"
      :ui="{
        padding: 'p-4',
        // Customize other UI aspects if needed
      }"
    />
  </USlideover>
</template>
