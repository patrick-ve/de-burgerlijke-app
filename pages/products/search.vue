<script setup lang="ts">
import type { products, supermarkets } from '~/server/db/schema';

// Define a type for the combined search result
interface ProductSearchResult {
  id: string;
  name: string;
  link: string;
  price: number;
  amount: string | null;
  supermarketName: string;
}

const searchQuery = ref('');
const searchResults = ref<ProductSearchResult[]>([]);
const isLoading = ref(false);
const error = ref<Error | null>(null);
const searchPerformed = ref(false);

async function performSearch() {
  if (!searchQuery.value.trim()) {
    searchResults.value = [];
    searchPerformed.value = false;
    return;
  }

  isLoading.value = true;
  error.value = null;
  searchPerformed.value = true;

  try {
    // Use $fetch for client-side request triggered by user action
    const results = await $fetch<ProductSearchResult[]>(
      '/api/products/search',
      {
        query: { term: searchQuery.value },
      }
    );
    searchResults.value = results;
  } catch (err: any) {
    console.error('Error fetching search results:', err);
    error.value = err;
    searchResults.value = [];
  } finally {
    isLoading.value = false;
  }
}

// Optional: Trigger search on Enter key press in the input
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    performSearch();
  }
}

const resultsColumns = [
  { key: 'name', label: 'Product Name' },
  { key: 'price', label: 'Price' },
  { key: 'amount', label: 'Amount' },
  { key: 'supermarketName', label: 'Supermarket' },
  { key: 'link', label: 'Link' },
];
</script>

<template>
  <UContainer class="py-8">
    <h1 class="text-2xl font-bold mb-6">Product Search</h1>

    <div class="flex gap-2 mb-6">
      <UInput
        v-model="searchQuery"
        placeholder="Search for products..."
        class="flex-grow"
        icon="i-heroicons-magnifying-glass"
        size="lg"
        @keydown="handleKeydown"
      />
      <UButton
        label="Search"
        size="lg"
        :loading="isLoading"
        @click="performSearch"
      />
    </div>

    <div v-if="isLoading" class="text-center">
      <p>Loading...</p>
      <!-- Or use a USkeleton -->
    </div>
    <div v-else-if="error" class="text-red-500 text-center">
      <p>Error loading results: {{ error.message }}</p>
    </div>
    <div
      v-else-if="searchPerformed && searchResults.length === 0"
      class="text-center text-gray-500"
    >
      <p>No products found matching "{{ searchQuery }}".</p>
    </div>
    <div v-else-if="searchResults.length > 0">
      <UTable :rows="searchResults" :columns="resultsColumns">
        <!-- Optional: Customize link column -->
        <template #link-data="{ row }">
          <UButton
            :to="row.link"
            target="_blank"
            variant="link"
            icon="i-heroicons-arrow-top-right-on-square"
            padded
          >
            View
          </UButton>
        </template>
        <template #price-data="{ row }">
          <span>€{{ row.price.toFixed(2) }}</span>
        </template>
      </UTable>
    </div>
    <div
      v-else-if="!searchPerformed"
      class="text-center text-gray-400"
    >
      <p>Enter a search term and click Search.</p>
    </div>
  </UContainer>
</template>
