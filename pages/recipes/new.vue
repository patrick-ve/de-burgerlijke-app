<template>
  <div class="p-4 pb-24">
    <!-- Added padding -->
    <!-- Input Type Selection -->
    <UFormGroup label="Waar komt het recept vandaan?" class="mb-4">
      <USelectMenu
        v-model="selectedInputType"
        :options="inputTypes"
        value-attribute="value"
        option-attribute="label"
        size="lg"
      >
        <template #label>
          <UIcon
            v-if="selectedInputTypeData?.icon"
            :name="selectedInputTypeData.icon"
            class="w-4 h-4 mr-2"
          />
          {{ selectedInputTypeData?.label || 'Selecteer type' }}
        </template>
        <template #option="{ option }">
          <UIcon :name="option.icon" class="w-4 h-4 mr-2" />
          <span>{{ option.label }}</span>
        </template>
      </USelectMenu>
    </UFormGroup>

    <!-- Input Fields based on type -->
    <UForm
      :state="{ url, recipePrompt, imageFile }"
      @submit="submitRecipeRequest"
      class="space-y-4"
    >
      <!-- URL Input -->
      <UFormGroup
        v-if="
          selectedInputType === 'url' ||
          selectedInputType === 'youtube'
        "
        :label="
          selectedInputType === 'youtube'
            ? 'Voer de YouTube URL in'
            : 'Voer de website URL in'
        "
        name="url"
      >
        <UInput
          v-model="url"
          type="url"
          :placeholder="placeholderText"
          size="lg"
          icon="i-heroicons-link"
        />
      </UFormGroup>

      <!-- AI Prompt Input -->
      <UFormGroup
        v-if="selectedInputType === 'ai'"
        label="Beschrijf het recept"
        name="recipePrompt"
      >
        <UTextarea
          v-model="recipePrompt"
          :placeholder="placeholderText"
          :rows="3"
          autoresize
          size="lg"
        />
      </UFormGroup>

      <!-- Image File Input -->
      <UFormGroup
        v-if="selectedInputType === 'image'"
        label="Selecteer een foto"
        name="imageFile"
      >
        <!-- Basic file input, style as needed -->
        <UInput
          type="file"
          accept="image/jpeg, image/png, image/gif, image/webp"
          @change="onFileChange"
          size="lg"
          icon="i-heroicons-photo"
        />
        <p v-if="imageFile" class="text-sm text-gray-500 mt-1">
          Geselecteerd: {{ imageFile.name }}
        </p>
      </UFormGroup>

      <!-- Explanation Alert -->
      <UAlert
        v-if="explanationText"
        icon="i-heroicons-information-circle"
        color="primary"
        variant="subtle"
        :description="explanationText"
        class="mt-4"
      />

      <!-- Error Display -->
      <UAlert
        v-if="error"
        icon="i-heroicons-exclamation-triangle"
        color="red"
        variant="soft"
        :title="error"
        :closeable="true"
        @close="error = null"
      />
    </UForm>

    <!-- Fixed Action Bar -->
    <div
      class="fixed inset-x-0 bottom-0 p-4 bg-white border-t border-gray-200 shadow-md"
    >
      <UButton
        type="submit"
        :loading="isLoading"
        :disabled="isSubmitDisabled"
        block
        size="lg"
        class="font-bold"
        @click="submitRecipeRequest"
      >
        {{ submitButtonText }}
      </UButton>
    </div>

    <!-- Teleport Back Button -->
    <Teleport to="#header-left-action" v-if="isMounted">
      <UButton
        v-if="headerState.showLeftAction"
        color="gray"
        variant="ghost"
        icon="i-heroicons-arrow-left"
        aria-label="Ga terug naar recepten"
        @click="router.back()"
      />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import {
  recipeSchema,
  type AIRecipeDTO,
} from '~/server/utils/recipeSchema';
import { useRecipes } from '@/composables/useRecipes';
import { useHeaderState } from '@/composables/useHeaderState';

const router = useRouter();
const { addRecipe } = useRecipes();
const { headerState, setHeader, resetHeader } = useHeaderState();
const isMounted = ref(false);

// Input type selection
const inputTypes = [
  {
    value: 'url',
    label: 'Kookwebsite',
    icon: 'i-heroicons-globe-alt',
  },
  {
    value: 'youtube',
    label: 'YouTube video',
    icon: 'i-simple-icons-youtube',
  },
  {
    value: 'image',
    label: 'Foto uit een kookboek',
    icon: 'i-heroicons-photo',
  },
  {
    value: 'ai',
    label: 'Ik wil een recept genereren met AI',
    icon: 'i-heroicons-sparkles',
  },
];
const selectedInputType = ref('url'); // Default to 'url'

// Computed property to get the full object for the selected input type
const selectedInputTypeData = computed(() =>
  inputTypes.find((type) => type.value === selectedInputType.value)
);

const url = ref('');
const recipePrompt = ref('');
const imageFile = ref<File | null>(null); // State for the image file
const isLoading = ref(false);
const error = ref<string | null>(null);

// Computed property for explanation text
const explanationText = computed(() => {
  switch (selectedInputType.value) {
    case 'ai':
      return 'Beschrijf het gewenste recept (bijv. "Gezonde salade met kip en avocado voor 2 personen"). Wij gebruiken AI om een volledig recept voor je te genereren op basis van jouw beschrijving.';
    case 'youtube':
      return 'Plak de volledige URL van de YouTube video. We analyseren de video om het recept te verkrijgen.';
    case 'image':
      return 'Upload een duidelijke foto van het recept (bijv. uit een kookboek). Wij lezen de tekst op de foto uit en zetten deze om in een digitaal recept. Het is ook mogelijk om een foto te uploaden van een gerecht dat je hebt gemaakt.';
    case 'url':
    default:
      return 'Plak de volledige URL van de webpagina met het recept (bijv. van ah.nl of een receptenblog). We proberen automatisch de ingrediënten en stappen van de pagina te halen.';
  }
});

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
function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const files = target.files;
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
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(imageFile.value.type)) {
      error.value =
        'Ongeldig bestandstype. Selecteer een JPG of PNG afbeelding.';
      return false;
    }
    const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
    if (imageFile.value.size > maxSizeInBytes) {
      error.value = `Bestand is te groot (max ${
        maxSizeInBytes / 1024 / 1024
      }MB).`;
      return false;
    }
  } else {
    // URL or YouTube
    if (!url.value) {
      error.value = 'Voer een geldige URL in.';
      return false;
    }
    try {
      // Basic URL validation
      new URL(
        url.value.startsWith('http')
          ? url.value
          : `http://${url.value}`
      );
    } catch (_) {
      error.value = 'Voer een geldige URL in.';
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
      method: 'POST',
    };

    if (selectedInputType.value === 'image') {
      const formData = new FormData();
      if (!imageFile.value) {
        throw new Error('Geen afbeelding geselecteerd.');
      }
      formData.append('image', imageFile.value);
      requestBody = formData;
      // No 'Content-Type' header needed for FormData
    } else {
      requestBody =
        selectedInputType.value === 'ai'
          ? { prompt: recipePrompt.value }
          : { url: url.value };
      fetchOptions.headers = { 'Content-Type': 'application/json' };
    }

    fetchOptions.body = requestBody;

    console.log(`Submitting ${selectedInputType.value} request...`);

    const response = await $fetch<{ recipe: AIRecipeDTO }>(
      apiEndpoint.value,
      fetchOptions
    );

    console.log('API Response:', response);

    const parsed = recipeSchema.safeParse(response.recipe);

    if (parsed.success) {
      addRecipe(parsed.data);
      // Add query parameter to indicate success (optional)
      await router.push({
        path: '/recipes',
        query: { added: 'true' },
      });
    } else {
      console.error('Zod validation failed:', parsed.error.errors);
      throw new Error(
        'Receptgegevens van API zijn ongeldig. Probeer het opnieuw.'
      );
    }
  } catch (err: any) {
    console.error('Error submitting request:', err);
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

const submitButtonText = computed(() => {
  if (isLoading.value) {
    return 'Bezig met verwerken...';
  }
  switch (selectedInputType.value) {
    case 'ai':
      return 'Genereer recept';
    case 'image':
      return 'Verwerk foto';
    case 'youtube':
      return 'Haal YouTube recept op';
    case 'url':
    default:
      return 'Haal recept op';
  }
});

const isSubmitDisabled = computed(() => {
  if (isLoading.value) return true;

  switch (selectedInputType.value) {
    case 'ai':
      return !recipePrompt.value.trim();
    case 'image':
      return !imageFile.value;
    case 'url':
    case 'youtube':
    default:
      // Add basic URL format check for immediate feedback (optional, full validation in validateInput)
      return !url.value.trim(); // || !url.value.includes('.');
  }
});

onMounted(async () => {
  await nextTick(); // Ensure DOM is ready
  isMounted.value = true;
  setHeader({
    title: 'Nieuw recept toevoegen',
    showLeftAction: true,
    showRightAction: false, // No save button in header for this form
  });
});

onUnmounted(() => {
  resetHeader();
  isMounted.value = false;
});

useHead({
  title: 'Nieuw recept toeevoegen - De Burgerlijke App',
});
</script>

<style scoped>
/* Add any page-specific styles if needed */
</style>
