<script setup lang="ts">
import type { Recipe } from '~/types/recipe';
import RecipeEditView from '~/components/RecipeEditView.vue';
import { useRecipes } from '~/composables/useRecipes';
import { ref, computed, onMounted } from 'vue';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const { findRecipeById, updateRecipe } = useRecipes();

const recipeId = computed(() => route.params.id as string);
const recipe = ref<Recipe | null>(null); // Ref to hold the recipe data
const isLoading = ref(true);
const errorLoading = ref(false);

onMounted(() => {
  isLoading.value = true;
  errorLoading.value = false;
  const foundRecipe = findRecipeById(recipeId.value);
  if (foundRecipe) {
    // Create a deep copy to avoid modifying the stored recipe directly until save
    recipe.value = JSON.parse(JSON.stringify(foundRecipe));
  } else {
    console.error(`Recipe with ID ${recipeId.value} not found.`);
    toast.add({
      title: 'Error',
      description: 'Kon recept niet vinden om te bewerken.',
      color: 'red',
    });
    errorLoading.value = true;
    // Optionally redirect immediately
    // router.push('/app/recipes');
  }
  isLoading.value = false;
});

// --- Event Handlers ---
const handleSave = async (updatedRecipeData: Recipe) => {
  if (!recipeId.value) return;

  const savedRecipe = updateRecipe(recipeId.value, updatedRecipeData);

  if (savedRecipe) {
    toast.add({
      title: 'Succes',
      description: `'${savedRecipe.title}' succesvol bijgewerkt.`,
      color: 'green',
    });
    // Navigate back to the recipe detail page
    await router.push(`/app/recipes/${recipeId.value}`);
  } else {
    // Error handled by updateRecipe console warning, show toast
    toast.add({
      title: 'Fout bij opslaan',
      description: 'Kon recept niet bijwerken. Recept niet gevonden?',
      color: 'red',
    });
  }
};

const handleCancel = () => {
  if (!recipeId.value) {
    router.push('/app/recipes'); // Fallback if ID somehow missing
    return;
  }
  // Navigate back to the recipe detail page
  router.push(`/app/recipes/${recipeId.value}`);
};
</script>

<template>
  <div>
    <AppHeader title="Recept Bewerken" />

    <div v-if="isLoading" class="p-4 text-center">
      <p>Recept laden...</p>
      <UButton loading label="Laden" variant="ghost" />
    </div>

    <div
      v-else-if="errorLoading || !recipe"
      class="p-4 text-center text-red-500"
    >
      <p>
        Fout bij het laden van het recept. Kon het recept niet vinden.
      </p>
      <UButton
        label="Terug naar recepten"
        @click="router.push('/app/recipes')"
        class="mt-4"
      />
    </div>

    <!-- Pass the local reactive recipe ref to the edit view -->
    <!-- Ensure recipe is not null before rendering RecipeEditView -->
    <div v-else>
      <RecipeEditView
        :recipe="recipe"
        @save="handleSave"
        @cancel="handleCancel"
      />
    </div>
  </div>
</template>
