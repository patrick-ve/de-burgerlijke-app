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
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import type { AIRecipeDTO } from '~/server/utils/recipeSchema'; // Import DTO type
import { useHeaderState } from '~/composables/useHeaderState';
import { useRecipes } from '~/composables/useRecipes'; // Import the new composable
import AddRecipeModal from '~/components/AddRecipeModal.vue'; // Import the modal component
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute(); // Get the route object
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

// Watch for changes in the query parameter
watch(
  () => route.query.newRecipe,
  (newValue) => {
    if (newValue === 'true') {
      openAddModal();
      // Optional: Remove the query param after opening the modal
      // router.replace({ query: { ...route.query, newRecipe: undefined } });
    }
  },
  { immediate: true } // Check immediately on component load
);

onMounted(async () => {
  await nextTick();
  isMounted.value = true;

  setHeader({
    title: 'Mijn recepten',
    showLeftAction: true,
    showRightAction: true,
    rightActionHandler: openAddModal, // Ensure the header button also opens the modal
  });
});

onUnmounted(() => {
  isMounted.value = false;
});

useHead({
  title: 'Recepten', // Browser tab title
});
</script>
