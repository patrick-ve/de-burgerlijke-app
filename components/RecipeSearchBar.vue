<template>
  <div
    v-if="isActive"
    class="fixed top-16 left-0 right-0 z-40 flex items-center gap-2 bg-white border-b border-gray-200 p-4"
  >
    <UInput
      v-model="localSearchTerm"
      icon="i-heroicons-magnifying-glass-20-solid"
      size="sm"
      color="white"
      :trailing="false"
      placeholder="Zoek recepten..."
      class="flex-grow"
      @input="emitSearch"
    />
    <UButton
      icon="i-heroicons-adjustments-horizontal-20-solid"
      color="gray"
      variant="ghost"
      aria-label="Filter opties"
      @click="handleFilterClick"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
  isActive: boolean;
  searchTerm: string;
}

interface Emits {
  (e: 'update:isActive', value: boolean): void;
  (e: 'update:searchTerm', value: string): void;
  (e: 'search', value: string): void; // Optional: emit search explicitly
  (e: 'filterClick'): void; // Add emit for filter button click
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const localSearchTerm = ref(props.searchTerm);

// Watch for external changes to searchTerm
watch(
  () => props.searchTerm,
  (newValue) => {
    localSearchTerm.value = newValue;
  }
);

// Watch for local changes and emit update
watch(localSearchTerm, (newValue) => {
  emit('update:searchTerm', newValue);
  emit('search', newValue); // Emit search event on input change
});

const emitSearch = () => {
  // This function can be used if you prefer explicit event emission on button click or debounce
  emit('search', localSearchTerm.value);
};

const handleFilterClick = () => {
  // Emit an event when the filter button is clicked
  console.log('Filter button clicked in search bar');
  emit('filterClick');
  // Add logic here to open a filter modal/panel or perform filtering actions
};

// We don't directly manipulate isActive here, parent controls it
</script>

<style scoped>
/* Add any specific styles if needed */
</style>
