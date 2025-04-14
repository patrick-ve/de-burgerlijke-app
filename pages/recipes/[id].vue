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
import { useRecipes } from '~/composables/useRecipes'; // Import the composable

const route = useRoute();
const { headerState, setHeader, resetHeader, defaultLeftAction } =
  useHeaderState();
const isMounted = ref(false);
const recipeId = computed(() => route.params.id as string);
const { findRecipeById } = useRecipes(); // Get the finder function

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
} = await useAsyncData<Recipe | undefined>( // Keep type as Recipe | undefined
  `recipe-${recipeId.value}`,
  async () => {
    // Re-add async, remove delay
    console.log(`Fetching recipe with ID: ${recipeId.value}`);
    // Removed artificial delay
    // Use the composable to find the recipe
    const foundRecipe = findRecipeById(recipeId.value);
    // console.log('Found Recipe:', foundRecipe);
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
    title: recipe.value?.title || 'Loading Recipe...',
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
    // console.log('Recipe Watch Triggered:', newRecipe, pending.value);
    if (newRecipe) {
      // console.log('Setting header title to:', newRecipe.title);
      setHeader({ title: newRecipe.title }); // Use setHeader for partial update
    } else if (!pending.value) {
      // console.log('Setting header title to: Recipe Not Found');
      // Handle cases where recipe is not found or error occurred after initial load
      setHeader({ title: 'Recipe Not Found' });
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
