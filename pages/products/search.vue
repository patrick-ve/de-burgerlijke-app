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

// Type for the grouped results object fetched from the API
interface GroupedSearchResults {
  [supermarketName: string]: ProductSearchResult[];
}

const searchQuery = ref('');
const searchResults = ref<GroupedSearchResults>({});
const isLoading = ref(false);
const error = ref<Error | null>(null);
const searchPerformed = ref(false);

async function performSearch() {
  if (!searchQuery.value.trim()) {
    searchResults.value = {};
    searchPerformed.value = false;
    return;
  }

  isLoading.value = true;
  error.value = null;
  searchPerformed.value = true;

  try {
    // Update the expected type for $fetch
    const results = await $fetch<GroupedSearchResults>(
      '/api/products/search',
      {
        query: { term: searchQuery.value },
      }
    );
    searchResults.value = results;
  } catch (err: any) {
    console.error('Error fetching search results:', err);
    error.value = err;
    searchResults.value = {};
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
  { key: 'name', label: 'Product Name', class: 'w-1/2' },
  { key: 'price', label: 'Price' },
  { key: 'amount', label: 'Amount' },
  { key: 'link', label: 'Link' },
];

// Helper to check if searchResults object is empty
const noResultsFound = computed(() => {
  return (
    searchPerformed.value &&
    Object.keys(searchResults.value).length === 0
  );
});

const hasResults = computed(() => {
  return Object.keys(searchResults.value).length > 0;
});
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
    <div v-else-if="noResultsFound" class="text-center text-gray-500">
      <p>No products found matching "{{ searchQuery }}".</p>
    </div>
    <div v-else-if="hasResults" class="space-y-6">
      <div
        v-for="(products, supermarketName) in searchResults"
        :key="supermarketName"
      >
        <h2 class="text-xl font-semibold mb-2 border-b pb-1">
          {{ supermarketName }} ({{ products.length }} results)
        </h2>
        <UTable :rows="products" :columns="resultsColumns">
          <template #link-data="{ row }">
            <UButton
              :to="row.link"
              target="_blank"
              variant="link"
              icon="i-heroicons-arrow-top-right-on-square"
              size="xs"
              :padded="false"
            >
              View
            </UButton>
          </template>
          <template #price-data="{ row }">
            <span>€{{ row.price.toFixed(2) }}</span>
          </template>
        </UTable>
      </div>
    </div>
    <div
      v-else-if="!searchPerformed"
      class="text-center text-gray-400"
    >
      <p>Enter a search term and click Search.</p>
    </div>
  </UContainer>
</template>
