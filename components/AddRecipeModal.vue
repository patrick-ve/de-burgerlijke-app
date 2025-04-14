<script setup lang="ts">
const isOpen = defineModel<boolean>('isOpen', { required: true });
// Define the type for the parsed recipe data, mirroring the server structure
// TODO: Move this to a shared types file (e.g., ~/types/recipe.ts)
interface ParsedRecipeData {
  title: string;
  description?: string;
  portions?: number;
  prepTime?: string;
  cookTime?: string;
  cuisine?: string;
  ingredients: {
    quantity?: number | string;
    unit?: string;
    name: string;
  }[];
  steps: { description: string }[];
  utensils?: string[];
}

// Define emits
const emit = defineEmits<{
  (e: 'recipeParsed', recipe: ParsedRecipeData): void;
}>();

const url = ref('');
const isLoading = ref(false);
const error = ref<string | null>(null);

async function submitRecipeUrl() {
  if (!url.value || !url.value.startsWith('http')) {
    error.value =
      'Voer een geldige URL in (beginnend met http of https).';
    return;
  }
  isLoading.value = true;
  error.value = null;
  try {
    console.log('Submitting URL:', url.value);

    // Make POST request to /api/recipe
    const response = await $fetch<{
      success: boolean;
      message: string;
      recipe: ParsedRecipeData;
    }>('/api/recipe/url', {
      method: 'POST',
      body: { url: url.value },
    });
    console.log('API Response:', response);

    if (response.success && response.recipe) {
      // Emit the parsed recipe data
      emit('recipeParsed', response.recipe);
      isOpen.value = false; // Close the modal
      url.value = ''; // Reset URL input
    } else {
      // Handle cases where the API call succeeded but didn't return expected data
      throw new Error(
        response.message || 'Failed to parse recipe from URL.'
      );
    }
  } catch (err: any) {
    console.error('Error submitting URL:', err);
    // Use error message from the API if available, otherwise generic message
    error.value =
      err.data?.message ||
      'URL versturen mislukt. Controleer de URL en probeer het opnieuw.';
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <UModal
    v-model="isOpen"
    :ui="{
      overlay: {
        background: 'bg-black/40 backdrop-blur-sm',
      },
    }"
  >
    <UCard
      :ui="{
        ring: '',
        divide: 'divide-y divide-gray-100 dark:divide-gray-800',
      }"
    >
      <template #header>
        <div class="flex items-center justify-between">
          <h3
            class="text-base font-semibold leading-6 text-gray-900 dark:text-white"
          >
            Recept toevoegen via website
          </h3>
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark-20-solid"
            class="-my-1"
            @click="isOpen = false"
          />
        </div>
      </template>

      <UFormGroup label="Recept URL" name="url" class="mb-4">
        <UInput
          v-model="url"
          placeholder="www.ah.nl/recepten/spaghetti-bolognese"
          icon="i-heroicons-link"
          :disabled="isLoading"
        />
      </UFormGroup>

      <UAlert
        v-if="error"
        icon="i-heroicons-exclamation-triangle"
        color="red"
        variant="soft"
        :title="error"
        class="mb-4"
      />

      <template #footer>
        <div class="flex justify-end space-x-2">
          <UButton
            color="gray"
            variant="ghost"
            @click="isOpen = false"
            :disabled="isLoading"
          >
            Annuleren
          </UButton>
          <UButton
            @click="submitRecipeUrl"
            :loading="isLoading"
            :disabled="isLoading"
            class="font-bold"
          >
            Versturen
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>
