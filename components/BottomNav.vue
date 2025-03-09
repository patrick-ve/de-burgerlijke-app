<script setup lang="ts">
const route = useRoute();

const navigation = [
  {
    name: 'Home',
    to: '/',
    icon: 'i-heroicons-home',
  },
  {
    name: 'Recepten',
    to: '/recipes',
    icon: 'i-heroicons-book-open',
  },
  {
    name: 'Boodschappen',
    to: '/groceries',
    icon: 'i-heroicons-shopping-cart',
  },
];
</script>

<template>
  <nav
    class="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800"
  >
    <UContainer class="h-16">
      <div class="grid h-full grid-cols-3">
        <NuxtLink
          v-for="item in navigation"
          :key="item.to"
          :to="item.to"
          class="flex flex-col items-center justify-center gap-1"
          :class="[
            route.path === item.to
              ? 'text-primary-500 dark:text-primary-400'
              : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white',
          ]"
        >
          <UIcon :name="item.icon" class="h-6 w-6" />
          <span class="text-xs">{{ item.name }}</span>
        </NuxtLink>
      </div>
    </UContainer>
  </nav>
</template>
