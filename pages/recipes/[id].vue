<template>
  <div>
    <!-- Fetch recipe data based on route params -->
    <div v-if="pending">Loading...</div>
    <div v-else-if="error || !recipe">
      Error loading recipe or recipe not found.
    </div>
    <RecipeDetailView v-else :recipe="recipe" />

    <!-- Teleport Back button to the header -->
    <Teleport to="#header-left-action" v-if="isMounted">
      <UButton
        v-if="headerState.showLeftAction"
        icon="i-heroicons-arrow-left"
        variant="ghost"
        color="gray"
        aria-label="Back"
        @click="triggerLeftAction"
      />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  nextTick,
  watch,
} from 'vue';
import type { Recipe } from '~/types/recipe'; // Assuming Recipe type exists
import { useHeaderState } from '~/composables/useHeaderState';
import { useMockRecipes } from '~/composables/useMockRecipes'; // Import the composable

const route = useRoute();
const { headerState, setHeader, resetHeader, defaultLeftAction } =
  useHeaderState();
const isMounted = ref(false);
const recipeId = computed(() => route.params.id as string);
const { findRecipeById } = useMockRecipes(); // Get the finder function

// Handler to trigger the action stored in state
const triggerLeftAction = () => {
  if (headerState.value.leftActionHandler) {
    headerState.value.leftActionHandler();
  }
};

// Fetching the specific recipe data
const {
  data: recipe,
  pending,
  error,
} = await useAsyncData<Recipe | null | undefined>( // Allow undefined type
  `recipe-${recipeId.value}`,
  async () => {
    console.log(`Fetching recipe with ID: ${recipeId.value}`);
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    // Use the composable to find the recipe
    const foundRecipe = findRecipeById(recipeId.value);
    return foundRecipe; // Return the found recipe or undefined
  },
  {
    watch: [recipeId], // Refetch when ID changes
  }
);

onMounted(async () => {
  await nextTick();
  isMounted.value = true;

  // Initial header setup
  setHeader({
    title: 'Loading Recipe...',
    showLeftAction: true,
    showRightAction: false, // No right action for now
    leftActionHandler: defaultLeftAction,
    rightActionHandler: null,
  });
});

// Watch for recipe data changes to update the header title
watch(
  recipe,
  (newRecipe) => {
    if (newRecipe) {
      headerState.value.title = newRecipe.title;
    } else if (!pending.value) {
      // Handle cases where recipe is not found or error occurred after initial load
      headerState.value.title = 'Recipe Not Found';
    }
    // If pending is true, the initial 'Loading Recipe...' title remains
  },
  { immediate: true } // Run on mount too, after initial setHeader
);

onUnmounted(() => {
  resetHeader();
  isMounted.value = false;
});

useHead({
  // Update title dynamically based on recipe name if available
  title: computed(() =>
    recipe.value ? recipe.value.title : 'Recipe Details'
  ),
});
</script>
