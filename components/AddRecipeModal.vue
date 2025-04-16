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
  {
    value: 'ai',
    label: 'AI',
    icon: 'i-heroicons-sparkles',
  },
];
const selectedInputType = ref('url'); // Default to 'url'

const url = ref('');
const recipePrompt = ref('');
const isLoading = ref(false);
const error = ref<string | null>(null);

// Computed property for dynamic placeholder
const placeholderText = computed(() => {
  if (selectedInputType.value === 'ai') {
    return 'Bijv: Kip pasta ovenschotel voor 4 personen';
  }
  return selectedInputType.value === 'youtube'
    ? 'https://www.youtube.com/watch?v=...'
    : 'www.ah.nl/recepten/...';
});

// Computed property for the API endpoint
const apiEndpoint = computed(() => {
  switch (selectedInputType.value) {
    case 'youtube':
      return '/api/recipe/youtube';
    case 'ai':
      return '/api/recipe/generate';
    case 'url':
    default:
      return '/api/recipe/url';
  }
});

// Validation logic based on input type
function validateInput() {
  if (selectedInputType.value === 'ai') {
    if (!recipePrompt.value.trim()) {
      error.value = 'Voer een beschrijving in voor het AI-recept.';
      return false;
    }
  } else {
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
  }
  return true;
}

async function submitRecipeRequest() {
  error.value = null;
  if (!validateInput()) {
    return;
  }

  isLoading.value = true;
  try {
    const requestBody =
      selectedInputType.value === 'ai'
        ? { prompt: recipePrompt.value }
        : { url: url.value };

    console.log(
      `Submitting ${selectedInputType.value} request:`,
      requestBody
    );

    // Make POST request to the dynamically selected endpoint
    const response = await $fetch<{ recipe: AIRecipeDTO }>(
      apiEndpoint.value,
      {
        method: 'POST',
        body: requestBody,
      }
    );

    console.log('API Response:', response);

    // Safely parse the recipe data using Zod
    const parsed = recipeSchema.safeParse(response.recipe);

    if (parsed.success) {
      emit('recipeParsed', parsed.data);
      isOpen.value = false;
      url.value = '';
      recipePrompt.value = '';
      selectedInputType.value = 'url';
    } else {
      console.error('Zod validation failed:', parsed.error.errors);
      throw new Error(
        'Receptgegevens van API zijn ongeldig. Probeer het opnieuw.'
      );
    }
  } catch (err: any) {
    console.error('Error submitting request:', err);
    error.value =
      err.data?.message ||
      err.message ||
      `${
        selectedInputType.value === 'ai'
          ? 'Genereren'
          : 'URL versturen'
      } mislukt. Controleer de invoer en probeer het opnieuw.`;
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
      width: 'max-w-md',
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
      <UFormGroup label="Bron" name="inputType">
        <div class="grid grid-cols-2 gap-4">
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
            @click="
              selectedInputType = option.value;
              url = '';
              recipePrompt = '';
              error = null;
            "
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

      <!-- Conditional Input: URL or AI Prompt -->
      <UFormGroup
        v-if="selectedInputType === 'ai'"
        label="Beschrijving AI Recept"
        name="recipePrompt"
        class="translate-y-3"
      >
        <UTextarea
          v-model="recipePrompt"
          :placeholder="placeholderText"
          :disabled="isLoading"
          size="lg"
          autoresize
          :rows="1"
        />
      </UFormGroup>

      <UFormGroup v-else label="URL" name="url" class="translate-y-3">
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
            @click="submitRecipeRequest"
            :loading="isLoading"
            :disabled="
              isLoading ||
              (selectedInputType === 'ai' ? !recipePrompt : !url)
            "
            class="font-bold"
            size="lg"
          >
            {{
              selectedInputType === 'ai' ? 'Genereer' : 'Versturen'
            }}
          </UButton>
        </div>
      </template>
    </UCard>
  </USlideover>
</template>
