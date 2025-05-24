<script setup lang="ts">
import { ref } from 'vue';
import { useWebcam } from '~/composables/useWebcam';

useHead({
  title: 'Vertalen - De Burgerlijke App',
});

const router = useRouter();

// Use the enhanced useWebcam composable
const {
  videoElementRef,
  canvasElementRef,
  isStreaming,
  error,
  availableCameras,
  selectedCameraId,
  startCamera,
  stopCamera,
  captureSnapshot,
  switchCamera,
} = useWebcam();

// Translation state
const isTranslating = ref(false);
const translationResult = ref<string | null>(null);
const translationError = ref<string | null>(null);
const showCameraSelector = ref(false);

// Auto-start camera when component mounts
onMounted(async () => {
  await startCamera();
  // Add click outside listener
  document.addEventListener('click', handleClickOutside);
});

// Clean up camera when leaving the page
onBeforeUnmount(() => {
  stopCamera();
  // Remove click outside listener
  document.removeEventListener('click', handleClickOutside);
});

const handleTakePhoto = async () => {
  if (!isStreaming.value) {
    console.error('Camera is not streaming');
    return;
  }

  try {
    isTranslating.value = true;
    translationError.value = null;
    translationResult.value = null;

    // Capture the snapshot
    const imageFile = await captureSnapshot();

    if (!imageFile) {
      throw new Error('Failed to capture image');
    }

    // Create FormData to send the image
    const formData = new FormData();
    formData.append('image', imageFile);

    // Send to translation API
    const response = await $fetch<{ translation: string }>(
      '/api/translate',
      {
        method: 'POST',
        body: formData,
      }
    );

    translationResult.value = response.translation;
    umTrackEvent('translate_image_success');
  } catch (err: any) {
    console.error('Translation error:', err);
    translationError.value =
      err.data?.message ||
      err.message ||
      'Er is een fout opgetreden bij het vertalen';
    umTrackEvent('translate_image_error');
  } finally {
    isTranslating.value = false;
  }
};

const resetTranslation = () => {
  translationResult.value = null;
  translationError.value = null;
};

const handleCameraSwitch = async (cameraId: string) => {
  showCameraSelector.value = false;
  await switchCamera(cameraId);
};

const toggleCameraSelector = () => {
  showCameraSelector.value = !showCameraSelector.value;
};

// Close camera selector when clicking outside
const handleClickOutside = (event: Event) => {
  const target = event.target as Element;
  const selector = document.querySelector('.camera-selector');
  const button = document.querySelector('.camera-selector-button');

  if (
    selector &&
    !selector.contains(target) &&
    !button?.contains(target)
  ) {
    showCameraSelector.value = false;
  }
};
</script>

<template>
  <TheHeader title="Vertalen">
    <template #left-action>
      <UButton
        color="gray"
        variant="ghost"
        icon="i-heroicons-arrow-left"
        aria-label="Ga terug naar home"
        @click="router.push('/app')"
      />
    </template>
    <template #right-action>
      <!-- Camera selector button (only show if multiple cameras available) -->
      <UButton
        v-if="availableCameras.length > 1"
        color="gray"
        variant="ghost"
        icon="i-heroicons-camera"
        aria-label="Wissel van camera"
        class="camera-selector-button"
        @click="toggleCameraSelector"
      />
    </template>
  </TheHeader>

  <div class="relative h-screen bg-black">
    <!-- Camera Selector Dropdown -->
    <div
      v-if="showCameraSelector && availableCameras.length > 1"
      class="camera-selector absolute top-4 right-4 z-50 bg-white rounded-lg shadow-lg border border-gray-200 min-w-48"
    >
      <div class="p-3 border-b border-gray-200">
        <h3 class="font-semibold text-gray-900">Selecteer Camera</h3>
      </div>
      <div class="p-2">
        <div
          v-for="camera in availableCameras"
          :key="camera.deviceId"
          class="flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer"
          :class="{
            'bg-primary-50': camera.deviceId === selectedCameraId,
          }"
          @click="handleCameraSwitch(camera.deviceId)"
        >
          <span class="text-sm text-gray-700">
            {{ camera.label }}
          </span>
          <UIcon
            v-if="camera.deviceId === selectedCameraId"
            name="i-heroicons-check"
            class="w-4 h-4 text-primary-500"
          />
        </div>
      </div>
    </div>

    <!-- Camera Preview - Full Screen -->
    <video
      ref="videoElementRef"
      autoplay
      playsinline
      muted
      class="absolute inset-0 w-full h-full object-cover"
    />

    <!-- Hidden canvas for capturing snapshots -->
    <canvas ref="canvasElementRef" class="hidden" />

    <!-- Camera info overlay -->
    <div
      v-if="isStreaming && availableCameras.length > 1"
      class="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm z-10"
    >
      {{
        availableCameras.find((c) => c.deviceId === selectedCameraId)
          ?.label || 'Camera'
      }}
    </div>

    <!-- Main UI Overlay -->
    <div
      class="absolute inset-0 flex flex-col justify-between p-6 z-20"
    >
      <!-- Top Section: Instructions (only show when not translating and no result) -->
      <div
        v-if="
          !isTranslating && !translationResult && !translationError
        "
        class="flex-shrink-0 text-center space-y-2 mt-8"
      >
        <div
          class="bg-black/50 backdrop-blur-sm rounded-lg p-4 max-w-md mx-auto"
        >
          <h2 class="text-xl font-bold text-white mb-2">
            Richt de camera op tekst
          </h2>
          <p class="text-sm text-white/90">
            Zorg dat de tekst goed zichtbaar en scherp is voor de
            beste vertaling
          </p>
        </div>
      </div>

      <!-- Center: Translation Results or Loading -->
      <div class="flex-1 flex items-center justify-center">
        <!-- Loading overlay -->
        <div
          v-if="isTranslating"
          class="bg-white rounded-lg p-6 text-center space-y-4 max-w-md mx-auto"
        >
          <UIcon
            name="i-heroicons-language"
            class="w-8 h-8 mx-auto text-primary-500"
          />
          <p class="text-lg font-semibold">Bezig met vertalen...</p>
          <UProgress animation="carousel" />
        </div>

        <!-- Translation Result -->
        <div
          v-else-if="translationResult"
          class="bg-white rounded-lg p-6 space-y-4 max-w-md mx-auto shadow-lg"
        >
          <div class="flex items-center gap-2">
            <UIcon
              name="i-heroicons-language"
              class="w-5 h-5 text-green-500"
            />
            <h3 class="text-lg font-semibold text-gray-900">
              Vertaling:
            </h3>
          </div>
          <div
            class="bg-green-50 border border-green-200 rounded-lg p-4"
          >
            <p class="text-gray-800 leading-relaxed">
              {{ translationResult }}
            </p>
          </div>
          <UButton
            @click="resetTranslation"
            color="gray"
            variant="ghost"
            icon="i-heroicons-arrow-path"
            size="sm"
            class="w-full"
          >
            Nieuwe foto maken
          </UButton>
        </div>

        <!-- Translation Error -->
        <div
          v-else-if="translationError"
          class="bg-white rounded-lg p-6 space-y-4 max-w-md mx-auto shadow-lg"
        >
          <div class="flex items-center gap-2">
            <UIcon
              name="i-heroicons-exclamation-triangle"
              class="w-5 h-5 text-red-500"
            />
            <h3 class="text-lg font-semibold text-gray-900">Fout:</h3>
          </div>
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <p class="text-red-800">{{ translationError }}</p>
          </div>
          <UButton
            @click="resetTranslation"
            color="gray"
            variant="ghost"
            icon="i-heroicons-arrow-path"
            size="sm"
            class="w-full"
          >
            Probeer opnieuw
          </UButton>
        </div>

        <!-- Camera Error -->
        <div
          v-else-if="error && !isStreaming"
          class="bg-white rounded-lg p-6 text-center space-y-4 max-w-md mx-auto shadow-lg"
        >
          <UIcon
            name="i-heroicons-exclamation-triangle"
            class="w-8 h-8 mx-auto text-red-500"
          />
          <p class="text-lg font-semibold">Camera probleem</p>
          <p class="text-gray-600">{{ error }}</p>
          <div class="flex gap-2 justify-center">
            <UButton
              @click="startCamera"
              color="primary"
              variant="solid"
            >
              Probeer opnieuw
            </UButton>
            <UButton
              v-if="availableCameras.length > 1"
              @click="toggleCameraSelector"
              color="gray"
              variant="outline"
            >
              Andere camera
            </UButton>
          </div>
        </div>
      </div>

      <!-- Bottom Section: Take Photo Button -->
      <div
        v-if="
          !translationResult && !translationError && !isTranslating
        "
        class="flex-shrink-0 text-center"
      >
        <UButton
          @click="handleTakePhoto"
          :disabled="!isStreaming"
          color="primary"
          variant="solid"
          size="xl"
          class="font-bold px-8 py-4 bg-white/90 hover:bg-white text-primary-600 shadow-lg"
          :loading="isTranslating"
        >
          <template #leading>
            <UIcon name="i-heroicons-camera" class="w-6 h-6" />
          </template>
          Neem foto
        </UButton>
      </div>
    </div>
  </div>
</template>
