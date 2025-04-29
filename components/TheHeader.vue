<template>
  <header
    class="sticky top-0 h-16 z-40 bg-white border-b border-gray-200 p-4 items-center gap-4 w-full"
  >
    <div
      class="max-w-7xl mx-auto"
      :class="[
        !isOnHomePage
          ? 'grid grid-cols-[1fr_auto_1fr]'
          : 'flex justify-between',
      ]"
    >
      <div v-if="!isOnHomePage">
        <!-- Removed ID -->
        <div></div>
        <slot name="left-action" />
      </div>
      <h1
        v-if="!isOnHomePage && title"
        class="text-xl font-semibold truncate my-auto"
      >
        {{ title }}
      </h1>
      <div v-if="isOnHomePage">
        <h1 class="text-xl font-semibold my-auto text-primary-500">
          De Burgerlijke App
        </h1>
      </div>
      <div class="flex justify-end">
        <!-- Removed ID -->
        <div></div>
        <slot name="right-action" />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
interface Props {
  title?: string; // Made title optional
}

defineProps<Props>();

const route = useRoute();
const isOnHomePage = computed(() => route.path === '/');
</script>

<style scoped>
/* Removed styles for IDs */

.font-caveat {
  font-family: 'Caveat', cursive;
}
</style>
