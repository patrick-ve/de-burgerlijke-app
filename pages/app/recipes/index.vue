<template>
  <TheHeader title="Recepten">
    <template #left-action>
      <UButton
        color="gray"
        variant="ghost"
        icon="i-heroicons-arrow-left"
        aria-label="Ga terug naar home"
        @click="router.push('/app')"
      />
    </template>
    <template #right-action>
      <UButton
        color="gray"
        variant="ghost"
        icon="i-heroicons-magnifying-glass-20-solid"
        aria-label="Zoek recepten"
        @click="toggleSearch"
      />
    </template>
  </TheHeader>

  <div
    class="p-4 px-0 pb-20 transition-padding duration-300 ease-in-out"
    :class="containerPaddingTop"
  >
    <!-- Apply transition to RecipeList -->
    <TransitionGroup name="list" tag="div">
      <RecipeList
        ref="recipeListRef"
        :recipes="filteredRecipes"
        key="recipe-list"
      />
    </TransitionGroup>

    <!-- Fixed Bottom Action Bar -->
    <div
      class="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50"
    >
      <UButton
        block
        size="lg"
        color="primary"
        aria-label="Voeg nieuw recept toe"
        label="Nieuw recept toevoegen"
        class="font-bold"
        @click="router.push('recipes/new')"
      />
    </div>

    <!-- Recipe Search Bar with Transition -->
    <Transition name="slide-fade">
      <RecipeSearchBar
        v-if="isSearchActive"
        v-model:isActive="isSearchActive"
        v-model:searchTerm="searchTerm"
        @search="handleSearch"
        @filterClick="triggerRecipeListFilters"
        class="fixed top-16 left-0 right-0 z-40 bg-white p-4"
      />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useRecipes } from '@/composables/useRecipes'; // Import the new composable
import RecipeSearchBar from '@/components/RecipeSearchBar.vue'; // Import the search bar component
import RecipeList from '@/components/RecipeList.vue'; // Ensure RecipeList is imported if not auto-imported

const router = useRouter();
const { recipes } = useRecipes(); // Get recipes and addRecipe from the composable
const isSearchActive = ref(false); // State for search bar visibility
const searchTerm = ref(''); // State for the search term

// Add type for exposed RecipeList methods
interface RecipeListInstance {
  openFilters: () => void;
}

const recipeListRef = ref<RecipeListInstance | null>(null); // Ref for RecipeList component

// Function to toggle search bar
const toggleSearch = () => {
  isSearchActive.value = !isSearchActive.value;
};

// Handler function for search input changes (can be debounced if needed)
const handleSearch = (value: string) => {
  // The actual filtering logic is handled by the computed property `filteredRecipes`
  // This function is kept for potential future use (e.g., debouncing, explicit search triggers)
};

// Handler to trigger filters in RecipeList component
const triggerRecipeListFilters = () => {
  recipeListRef.value?.openFilters(); // Call exposed method
};

// Computed property to filter recipes based on searchTerm
const filteredRecipes = computed(() => {
  if (!searchTerm.value) {
    return recipes.value; // Return all recipes if search term is empty
  }
  const lowerCaseSearchTerm = searchTerm.value.toLowerCase();
  return recipes.value.filter(
    (recipe) =>
      recipe.title.toLowerCase().includes(lowerCaseSearchTerm)
    // Add more fields to search here if needed, e.g.:
    // || recipe.description.toLowerCase().includes(lowerCaseSearchTerm)
    // || recipe.ingredients.some(ingredient => ingredient.name.toLowerCase().includes(lowerCaseSearchTerm))
  );
});

// Computed property for top padding based on search bar visibility
const containerPaddingTop = computed(() => {
  // Adjust this value based on the actual height of your search bar + header
  // Assuming header height is ~4rem (16 in Tailwind units)
  // Search bar fixed top is 16, height with padding is ~4rem (16 units)
  // Total offset needed is 4rem (header) + 4rem (search bar) = 8rem = pt-32? Let's try pt-28 (7rem) to be safe.
  // We need to check the actual rendered height
  return isSearchActive.value ? 'pt-20' : 'pt-4'; // Adjusted padding calculation
});

useHead({
  title: 'Recepten', // Browser tab title
});
</script>

<style scoped>
/* Transition for RecipeSearchBar */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-65px);
}

/* Transition for RecipeList (basic fade) */
.list-enter-active,
.list-leave-active {
  transition: opacity 0.5s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
}

/* Ensure the container padding transition works */
.transition-padding {
  transition-property: padding-top;
}
</style>
