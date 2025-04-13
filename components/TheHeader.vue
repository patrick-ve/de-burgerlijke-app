<template>
  <header
    class="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between"
  >
    <div class="w-1/4">
      <!-- Target for the left action teleport -->
      <div id="header-left-action"></div>
      <slot name="left-action" />
    </div>
    <h1 class="w-1/2 text-lg font-semibold text-center truncate">
      {{ title }}
    </h1>
    <div class="w-1/4 flex justify-end">
      <!-- Target for the right action teleport -->
      <div id="header-right-action"></div>
      <slot name="right-action" />
    </div>
  </header>
</template>

<script setup lang="ts">
interface Props {
  title: string;
}

defineProps<Props>();
</script>

<style scoped>
/* Add any specific header styles if needed */
/* Ensure the teleport targets don't interfere with layout if empty */
#header-left-action:empty,
#header-right-action:empty {
  display: none;
}
</style>
