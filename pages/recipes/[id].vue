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

const route = useRoute();
const { headerState, setHeader, resetHeader, defaultLeftAction } =
  useHeaderState();
const isMounted = ref(false);
const recipeId = computed(() => route.params.id as string);

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
} = await useAsyncData<Recipe | null>(
  `recipe-${recipeId.value}`,
  async () => {
    console.log(`Fetching recipe with ID: ${recipeId.value}`);
    // Replace with actual fetch logic
    // Example: return await $fetch(`/api/recipes/${recipeId.value}`)
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay
    // Dummy data for testing - replace with actual data structure
    if (recipeId.value === '1') {
      return {
        id: '1',
        title: 'Spaghetti Carbonara',
        description: 'A classic Roman pasta dish.',
        prepTime: 10,
        cookTime: 15,
        cuisine: 'Italian',
        portions: 2,
        ingredients: [
          { id: 'i1', quantity: 200, unit: 'g', name: 'Spaghetti' },
        ],
        steps: [{ id: 's1', order: 1, description: 'Cook pasta.' }],
        utensils: [],
        isFavorite: true,
      };
    } else if (recipeId.value === '2') {
      return {
        id: '2',
        title: 'Chicken Stir-Fry',
        description: 'Quick and easy weeknight meal.',
        prepTime: 15,
        cookTime: 10,
        cuisine: 'Asian',
        portions: 3,
        ingredients: [
          {
            id: 'i6',
            quantity: 300,
            unit: 'g',
            name: 'Chicken Breast',
          },
        ],
        steps: [{ id: 's5', order: 1, description: 'Heat oil.' }],
        utensils: [],
        isFavorite: false,
      };
    }
    return null; // Recipe not found
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
