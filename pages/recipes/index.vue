<template>
  <div class="p-4">
    <RecipeList :recipes="recipes" />

    <Teleport to="#header-left-action">
      <UButton
        color="gray"
        variant="ghost"
        icon="i-heroicons-arrow-left"
        aria-label="Ga terug naar home"
        @click="router.push('/')"
      />
    </Teleport>

    <Teleport to="#header-right-action">
      <UButton
        v-if="headerState.showRightAction"
        color="primary"
        aria-label="Voeg nieuw recept toe"
        label="Voeg toe"
        class="font-bold text-xs"
        @click="openAddModal"
      />
    </Teleport>

    <AddRecipeModal
      v-model:isOpen="isAddModalOpen"
      @recipeParsed="handleRecipeParsed"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import type { AIRecipeDTO } from '~/server/utils/recipeSchema'; // Import DTO type
import { useHeaderState } from '~/composables/useHeaderState';
import { useRecipes } from '~/composables/useRecipes'; // Import the new composable
import AddRecipeModal from '~/components/AddRecipeModal.vue'; // Import the modal component

const router = useRouter();
const { headerState, setHeader, resetHeader } = useHeaderState();
const isMounted = ref(false);
const { recipes, addRecipe } = useRecipes(); // Get recipes and addRecipe from the composable
const isAddModalOpen = ref(false); // State for modal visibility

// Function to open the modal
const openAddModal = () => {
  isAddModalOpen.value = true;
};

// Handler function for the recipeParsed event
const handleRecipeParsed = (recipeData: AIRecipeDTO) => {
  addRecipe(recipeData); // Call the addRecipe function from the composable
  // Modal is closed by the AddRecipeModal component itself upon success
};

// REMOVED - Action handler for navigating directly to /recipes/new
// const navigateToAddRecipe = () => {
//   router.push('/recipes/new');
// };

// Handler to trigger the action stored in state - NO LONGER NEEDED FOR THIS BUTTON
// const triggerRightAction = () => {
//   if (headerState.value.rightActionHandler) {
//     headerState.value.rightActionHandler();
//   }
// };

// Placeholder for fetching recipes data - REMOVED
// const recipes = ref<Recipe[]>([...]);

onMounted(async () => {
  await nextTick();
  isMounted.value = true;

  setHeader({
    title: 'Mijn recepten',
    showLeftAction: true,
    showRightAction: true,
  });
});

onUnmounted(() => {
  resetHeader();
  isMounted.value = false;
});

useHead({
  title: 'Recepten', // Browser tab title
});
</script>
