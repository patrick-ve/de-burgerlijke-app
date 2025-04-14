<template>
  <div class="p-4">
    <RecipeList :recipes="recipes" />

    <!-- Teleport Add button to the header -->
    <Teleport to="#header-right-action" v-if="isMounted">
      <UButton
        v-if="headerState.showRightAction"
        color="primary"
        aria-label="Voeg nieuw recept toe"
        label="Voeg toe"
        class="font-bold text-xs"
        @click="triggerRightAction"
      />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
// import type { Recipe } from '~/types/recipe'; // No longer needed here
import { useHeaderState } from '~/composables/useHeaderState';
import { useMockRecipes } from '~/composables/useMockRecipes'; // Import the new composable

const router = useRouter();
const { headerState, setHeader, resetHeader } = useHeaderState();
const isMounted = ref(false);
const { recipes } = useMockRecipes(); // Get recipes from the composable

// Action handler for the Add button
const navigateToAddRecipe = () => {
  router.push('/recipes/new');
};

// Handler to trigger the action stored in state
const triggerRightAction = () => {
  if (headerState.value.rightActionHandler) {
    headerState.value.rightActionHandler();
  }
};

// Placeholder for fetching recipes data - REMOVED
// const recipes = ref<Recipe[]>([...]);

onMounted(async () => {
  await nextTick();
  isMounted.value = true;

  setHeader({
    title: 'Mijn recepten',
    showLeftAction: false, // No back button needed here usually
    showRightAction: true,
    rightActionHandler: navigateToAddRecipe,
  });
});

onUnmounted(() => {
  resetHeader();
  isMounted.value = false;
});

useHead({
  title: 'Recipes', // Browser tab title
});
</script>
