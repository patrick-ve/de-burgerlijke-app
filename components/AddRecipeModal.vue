<script setup lang="ts">
import {
  recipeSchema,
  type AIRecipeDTO,
} from '~/server/utils/recipeSchema';
import { computed } from 'vue';
import { ref } from 'vue';

const isOpen = defineModel<boolean>('isOpen', { required: true });

// Define emits
const emit = defineEmits<{
  (e: 'recipeParsed', recipe: AIRecipeDTO): void;
}>();

// Input type selection
const inputTypes = [
  {
    value: 'url',
    label: 'Website',
    icon: 'i-heroicons-globe-alt',
  },
  {
    value: 'youtube',
    label: 'YouTube',
    icon: 'i-simple-icons-youtube',
  },
];
const selectedInputType = ref('url'); // Default to 'url'

const url = ref('');
const isLoading = ref(false);
const error = ref<string | null>(null);

// Computed property for dynamic placeholder
const placeholderText = computed(() => {
  return selectedInputType.value === 'youtube'
    ? 'https://www.youtube.com/watch?v=...'
    : 'www.ah.nl/recepten/...';
});

// Computed property for the API endpoint
const apiEndpoint = computed(() => {
  return selectedInputType.value === 'youtube'
    ? '/api/recipe/youtube'
    : '/api/recipe/url';
});

// Validation logic based on input type
function validateInput() {
  if (!url.value) {
    error.value = 'Voer een geldige URL in.';
    return false;
  }
  if (
    selectedInputType.value === 'url' &&
    !url.value.startsWith('http')
  ) {
    error.value =
      'Voer een geldige website URL in (beginnend met http of https).';
    return false;
  }
  if (
    selectedInputType.value === 'youtube' &&
    !url.value.includes('youtube.com') &&
    !url.value.includes('youtu.be')
  ) {
    error.value = 'Voer een geldige YouTube URL in.';
    return false;
  }
  return true;
}

async function submitRecipeUrl() {
  error.value = null;
  if (!validateInput()) {
    return;
  }

  isLoading.value = true;
  try {
    console.log(
      `Submitting ${selectedInputType.value} URL:`,
      url.value
    );

    // Make POST request to the dynamically selected endpoint
    const response = await $fetch<{ recipe: AIRecipeDTO }>(
      apiEndpoint.value,
      {
        method: 'POST',
        body: { url: url.value },
      }
    );

    console.log('API Response:', response);

    // Safely parse the recipe data using Zod
    const parsed = recipeSchema.safeParse(response.recipe);

    if (parsed.success) {
      emit('recipeParsed', parsed.data);
      isOpen.value = false;
      url.value = '';
      selectedInputType.value = 'url'; // Reset selection
    } else {
      console.error('Zod validation failed:', parsed.error.errors);
      throw new Error(
        'Receptgegevens van API zijn ongeldig. Probeer een andere URL.'
      );
    }
  } catch (err: any) {
    console.error('Error submitting URL:', err);
    error.value =
      err.data?.message || // Use API error message first
      err.message || // Then Zod/fetch error message
      'URL versturen mislukt. Controleer de URL en probeer het opnieuw.';
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <USlideover
    v-model="isOpen"
    side="bottom"
    :ui="{
      overlay: {
        background: 'bg-black/40 backdrop-blur-sm',
      },
      width: 'max-w-md', // Limit width on larger screens
    }"
  >
    <UCard
      class="flex flex-col flex-1"
      :ui="{
        header: { padding: 'py-4 px-4 sm:px-6' },
        body: {
          padding: 'p-4 sm:p-6',
          base: 'flex-1',
        },
        footer: { padding: 'p-4 sm:p-6' },
        ring: '',
        divide: 'divide-y divide-gray-200 dark:divide-gray-800',
      }"
    >
      <template #header>
        <div class="flex items-center justify-between">
          <h3
            class="text-lg font-semibold leading-6 text-gray-900 dark:text-white"
          >
            Recept toevoegen
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

      <!-- Body Section -->
      <UFormGroup label="Bron" name="inputType" class="mb-6">
        <div class="flex space-x-4">
          <UCard
            v-for="option in inputTypes"
            :key="option.value"
            as="button"
            type="button"
            :ui="{
              body: { padding: 'px-4 py-3 sm:p-4' },
              ring:
                selectedInputType === option.value
                  ? 'ring-2 ring-primary-500 dark:ring-primary-400'
                  : 'ring-1 ring-gray-300 dark:ring-gray-700',
            }"
            class="flex-1 text-left relative disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="isLoading"
            @click="selectedInputType = option.value"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <UIcon :name="option.icon" class="w-5 h-5 mr-2" />
                <span class="text-sm font-medium">{{
                  option.label
                }}</span>
              </div>
              <UIcon
                v-if="selectedInputType === option.value"
                name="i-heroicons-check-circle-solid"
                class="w-5 h-5 text-primary-500 dark:text-primary-400"
              />
            </div>
          </UCard>
        </div>
      </UFormGroup>

      <UFormGroup label="URL" name="url" class="mb-4">
        <UInput
          v-model="url"
          :placeholder="placeholderText"
          icon="i-heroicons-link"
          :disabled="isLoading"
          size="lg"
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
      <!-- End Body Section -->

      <template #footer>
        <div class="flex justify-end space-x-3">
          <UButton
            color="gray"
            variant="ghost"
            @click="isOpen = false"
            :disabled="isLoading"
            size="lg"
          >
            Annuleren
          </UButton>
          <UButton
            @click="submitRecipeUrl"
            :loading="isLoading"
            :disabled="isLoading || !url"
            class="font-bold"
            size="lg"
          >
            Versturen
          </UButton>
        </div>
      </template>
    </UCard>
  </USlideover>
</template>
