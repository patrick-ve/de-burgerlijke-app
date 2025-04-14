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
    to: '/shopping-list',
    icon: 'i-heroicons-shopping-cart',
  },
];

const showNav = computed(() => {
  // Split the path by '/' and filter out empty strings
  const pathSegments = route.path
    .split('/')
    .filter((segment) => segment !== '');
  // Show nav if path is root ('/') or has exactly one segment (e.g., '/recipes')
  return pathSegments.length <= 1;
});
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="transform translate-y-full"
    enter-to-class="transform translate-y-0"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="transform translate-y-0"
    leave-to-class="transform translate-y-full"
  >
    <nav
      v-if="showNav"
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
  </Transition>
</template>
