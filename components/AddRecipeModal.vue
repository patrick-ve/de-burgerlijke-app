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
    value: 'image',
    label: 'Foto',
    icon: 'i-heroicons-photo',
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
const imageFile = ref<File | null>(null); // State for the image file
const isLoading = ref(false);
const error = ref<string | null>(null);

// Computed property for dynamic placeholder
const placeholderText = computed(() => {
  switch (selectedInputType.value) {
    case 'ai':
      return 'Bijv: Kip pasta ovenschotel voor 4 personen';
    case 'youtube':
      return 'https://www.youtube.com/watch?v=...';
    case 'image':
      return ''; // No placeholder needed for file input
    case 'url':
    default:
      return 'www.ah.nl/recepten/...';
  }
});

// Computed property for the API endpoint
const apiEndpoint = computed(() => {
  switch (selectedInputType.value) {
    case 'youtube':
      return '/api/recipe/youtube';
    case 'ai':
      return '/api/recipe/generate';
    case 'image': // New API endpoint for image
      return '/api/recipe/image';
    case 'url':
    default:
      return '/api/recipe/url';
  }
});

// Handler for file input change
function onFileChange(files: FileList | null) {
  if (files && files.length > 0) {
    imageFile.value = files[0];
    error.value = null; // Clear error when file is selected
  } else {
    imageFile.value = null;
  }
}

// Validation logic based on input type
function validateInput() {
  error.value = null; // Clear previous errors
  if (selectedInputType.value === 'ai') {
    if (!recipePrompt.value.trim()) {
      error.value = 'Voer een beschrijving in voor het AI-recept.';
      return false;
    }
  } else if (selectedInputType.value === 'image') {
    if (!imageFile.value) {
      error.value = 'Selecteer een afbeelding van het recept.';
      return false;
    }
    // Optional: Add validation for file type or size
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    if (!allowedTypes.includes(imageFile.value.type)) {
      error.value =
        'Ongeldig bestandstype. Selecteer een JPG, PNG, GIF of WEBP afbeelding.';
      return false;
    }
    // Example size validation (e.g., max 10MB)
    const maxSizeInBytes = 10 * 1024 * 1024;
    if (imageFile.value.size > maxSizeInBytes) {
      error.value = `Bestand is te groot (max ${maxSizeInBytes / 1024 / 1024}MB).`;
      return false;
    }
  } else {
    // URL or YouTube
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
  if (!validateInput()) {
    return;
  }

  isLoading.value = true;
  error.value = null; // Clear previous error
  try {
    let requestBody: FormData | { [key: string]: string };
    let fetchOptions: any = {
      // Use 'any' for flexibility with FormData/JSON
      method: 'POST',
    };

    if (selectedInputType.value === 'image') {
      // Use FormData for image uploads
      const formData = new FormData();
      if (!imageFile.value) {
        throw new Error('Geen afbeelding geselecteerd.'); // Should be caught by validation, but double-check
      }
      formData.append('image', imageFile.value);
      requestBody = formData;
      // No 'Content-Type' header needed; browser sets it for FormData
    } else {
      // Use JSON for other types
      requestBody =
        selectedInputType.value === 'ai'
          ? { prompt: recipePrompt.value }
          : { url: url.value };
      fetchOptions.headers = { 'Content-Type': 'application/json' }; // Set header for JSON
    }

    // Assign the body regardless of type
    fetchOptions.body = requestBody;

    console.log(`Submitting ${selectedInputType.value} request...`);

    // Make POST request
    const response = await $fetch<{ recipe: AIRecipeDTO }>(
      apiEndpoint.value,
      fetchOptions
    );

    console.log('API Response:', response);

    // Safely parse the recipe data using Zod
    const parsed = recipeSchema.safeParse(response.recipe);

    if (parsed.success) {
      emit('recipeParsed', parsed.data);
      // Reset state
      isOpen.value = false;
      url.value = '';
      recipePrompt.value = '';
      imageFile.value = null;
      selectedInputType.value = 'url'; // Reset to default
    } else {
      console.error('Zod validation failed:', parsed.error.errors);
      throw new Error(
        'Receptgegevens van API zijn ongeldig. Probeer het opnieuw.'
      );
    }
  } catch (err: any) {
    console.error('Error submitting request:', err);
    // Improved error message extraction
    let message = 'Er is een onbekende fout opgetreden.';
    if (err.data && err.data.message) {
      message = err.data.message;
    } else if (err.data && err.data.statusMessage) {
      message = err.data.statusMessage;
    } else if (err.message) {
      message = err.message;
    }
    error.value = `${
      selectedInputType.value === 'ai'
        ? 'Genereren'
        : selectedInputType.value === 'image'
          ? 'Afbeelding verwerken'
          : 'URL versturen'
    } mislukt. ${message}`;
  } finally {
    isLoading.value = false;
  }
}

// Helper function to get the submit button text
const submitButtonText = computed(() => {
  switch (selectedInputType.value) {
    case 'ai':
      return 'Genereer';
    case 'image':
      return 'Verwerk Foto';
    default:
      return 'Versturen';
  }
});

// Helper function to disable submit button
const isSubmitDisabled = computed(() => {
  if (isLoading.value) return true;
  switch (selectedInputType.value) {
    case 'ai':
      return !recipePrompt.value.trim();
    case 'image':
      return !imageFile.value;
    default:
      return !url.value.trim();
  }
});
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
      <UFormGroup label="Bron" name="inputType" class="mb-4">
        <div class="grid grid-cols-2 gap-4">
          <UCard
            v-for="option in inputTypes"
            :key="option.value"
            as="button"
            type="button"
            :ui="{
              body: { padding: 'px-2 py-1.5' },
              ring:
                selectedInputType === option.value
                  ? 'ring-2 ring-primary-500 dark:ring-primary-400'
                  : 'ring-1 ring-gray-300 dark:ring-gray-700',
              base: 'hover:ring-gray-400 dark:hover:ring-gray-600 transition-shadow duration-150',
            }"
            class="flex-1 text-left relative disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="isLoading"
            @click="
              selectedInputType = option.value;
              url = '';
              recipePrompt = '';
              imageFile = null; // Reset image file on type change
              error = null;
            "
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <UIcon
                  :name="option.icon"
                  class="w-5 h-5 mr-2 flex-shrink-0"
                />
                <span class="text-sm font-medium truncate">{{
                  option.label
                }}</span>
              </div>
              <UIcon
                v-if="selectedInputType === option.value"
                name="i-heroicons-check-circle-solid"
                class="w-5 h-5 text-primary-500 dark:text-primary-400 flex-shrink-0"
              />
            </div>
          </UCard>
        </div>
      </UFormGroup>

      <!-- Conditional Input: URL, AI Prompt, or Image -->
      <UFormGroup
        v-if="selectedInputType === 'ai'"
        label="Beschrijving recept"
        name="recipePrompt"
        class="mb-4"
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

      <UFormGroup
        v-else-if="selectedInputType === 'image'"
        label="Recept afbeelding"
        name="recipeImage"
        class="mb-4"
      >
        <UInput
          type="file"
          size="lg"
          accept="image/png, image/jpeg, image/gif, image/webp"
          :disabled="isLoading"
          @change="onFileChange"
          :ui="{ base: 'relative', input: 'cursor-pointer' }"
        >
          <template #leading v-if="imageFile">
            <span
              class="truncate text-sm ml-16"
              :title="imageFile.name"
              >{{ imageFile.name }}</span
            >
          </template>
        </UInput>
        <!-- Add preview or file name display if needed -->
      </UFormGroup>

      <UFormGroup v-else label="URL" name="url" class="mb-4">
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
        class="mt-4"
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
            :disabled="isSubmitDisabled"
            class="font-bold"
            size="lg"
          >
            {{ submitButtonText }}
          </UButton>
        </div>
      </template>
    </UCard>
  </USlideover>
</template>
