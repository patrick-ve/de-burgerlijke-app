<template>
  <div class="space-y-6">
    <UCard>
      <template #header>
        <h3 class="text-lg font-medium">Recept importeren</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Plak een link naar een recept om het te importeren
        </p>
      </template>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <UFormGroup
          label="Recept URL"
          name="recipeUrl"
          :error="error"
        >
          <UInput
            v-model="url"
            placeholder="https://www.example.com/recipe"
            :ui="{
              icon: {
                trailing: { name: url ? 'i-heroicons-link' : '' },
              },
            }"
            :loading="isLoading"
            :disabled="isLoading"
          />
        </UFormGroup>

        <div class="flex justify-end">
          <UButton
            type="submit"
            :loading="isLoading"
            :disabled="!url || isLoading"
          >
            <template #leading>
              <UIcon name="i-heroicons-arrow-down-tray" />
            </template>
            Importeren
          </UButton>
        </div>
      </form>
    </UCard>

    <RecipePreview
      v-if="recipe"
      :recipe="recipe"
      @save="handleSave"
      @cancel="handleCancel"
    />
  </div>
</template>

<script setup lang="ts">
import type { Recipe } from '~/server/utils/recipeSchema';

const url = ref('');
const error = ref('');
const isLoading = ref(false);
const recipe = ref<Recipe | null>(null);

const { parseRecipeUrl } = useRecipeParser();

async function handleSubmit() {
  error.value = '';
  recipe.value = null;

  try {
    isLoading.value = true;

    // Validate URL format
    const { isValid, error: urlError } = parseRecipeUrl(url.value);

    if (!isValid) {
      error.value = urlError || 'Ongeldige URL';
      return;
    }

    // Send to API for parsing
    const response = await $fetch('/api/recipe/parse', {
      method: 'POST',
      body: { url: url.value },
    });

    recipe.value = response as Recipe;
  } catch (e: any) {
    error.value =
      e.message ||
      'Er is iets misgegaan bij het importeren van het recept';
  } finally {
    isLoading.value = false;
  }
}

function handleSave(savedRecipe: Recipe) {
  url.value = '';
  recipe.value = null;
  navigateTo('/recipes');
}

function handleCancel() {
  url.value = '';
  recipe.value = null;
}
</script>

<style scoped>
ion-card {
  margin: 0;
}

ion-button {
  margin: 1rem 0 0;
}

.space-y-6 > * + * {
  margin-top: 1.5rem;
}

.space-y-4 > * + * {
  margin-top: 1rem;
}
</style>
