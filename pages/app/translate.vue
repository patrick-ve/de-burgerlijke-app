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

// Camera UI state
const showGrid = ref(false);
const focusPoint = ref<{ x: number; y: number } | null>(null);
const isCapturing = ref(false);
const flashEnabled = ref(false);
const zoomLevel = ref(1);
const lastCapturedImage = ref<string | null>(null);

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
    // Add haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }

    // Show capture animation
    isCapturing.value = true;
    setTimeout(() => {
      isCapturing.value = false;
    }, 150);

    isTranslating.value = true;
    translationError.value = null;
    translationResult.value = null;

    // Capture the snapshot
    const imageFile = await captureSnapshot();

    if (!imageFile) {
      throw new Error('Failed to capture image');
    }

    // Store preview of captured image
    const imageUrl = URL.createObjectURL(imageFile);
    lastCapturedImage.value = imageUrl;

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

// Camera interaction handlers
const handleVideoTap = (event: MouseEvent | TouchEvent) => {
  if (!isStreaming.value || isTranslating.value) return;

  const rect = (event.target as HTMLElement).getBoundingClientRect();
  const clientX =
    'touches' in event ? event.touches[0].clientX : event.clientX;
  const clientY =
    'touches' in event ? event.touches[0].clientY : event.clientY;

  focusPoint.value = {
    x: clientX - rect.left - 60, // Center the larger focus ring
    y: clientY - rect.top - 60,
  };

  // Clear focus point after animation
  setTimeout(() => {
    focusPoint.value = null;
  }, 1000);
};

const toggleGrid = () => {
  showGrid.value = !showGrid.value;
};

const toggleFlash = () => {
  flashEnabled.value = !flashEnabled.value;
  // Note: Flash control would need camera constraints update
  // This is a UI toggle for now
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

  <div class="h-screen bg-black flex flex-col">
    <div class="relative h-[90vh] bg-black">
      <div
        v-if="showCameraSelector && availableCameras.length > 1"
        class="camera-selector absolute top-4 right-4 z-50 bg-white rounded-lg shadow-lg border border-gray-200 min-w-48"
      >
        <div class="p-3 border-b border-gray-200">
          <h3 class="font-semibold text-gray-900">
            Selecteer Camera
          </h3>
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

      <!-- Camera Preview - Full Camera Area -->
      <video
        ref="videoElementRef"
        autoplay
        playsinline
        muted
        class="absolute inset-0 w-full h-full object-cover cursor-crosshair"
        @click="handleVideoTap"
        @touchstart="handleVideoTap"
      />

      <!-- Corner Overlays -->
      <div class="absolute inset-0 pointer-events-none z-10">
        <!-- Top Left Corner -->
        <div class="absolute top-1/4 left-1/4 w-8 h-8">
          <div
            class="absolute top-0 left-0 w-8 h-2 bg-white opacity-70"
          ></div>
          <div
            class="absolute top-0 left-0 w-2 h-8 bg-white opacity-70"
          ></div>
        </div>
        <!-- Top Right Corner -->
        <div class="absolute top-1/4 right-1/4 w-8 h-8">
          <div
            class="absolute top-0 right-0 w-8 h-2 bg-white opacity-70"
          ></div>
          <div
            class="absolute top-0 right-0 w-2 h-8 bg-white opacity-70"
          ></div>
        </div>
        <!-- Bottom Left Corner -->
        <div class="absolute bottom-1/4 left-1/4 w-8 h-8">
          <div
            class="absolute bottom-0 left-0 w-8 h-2 bg-white opacity-70"
          ></div>
          <div
            class="absolute bottom-0 left-0 w-2 h-8 bg-white opacity-70"
          ></div>
        </div>
        <!-- Bottom Right Corner -->
        <div class="absolute bottom-1/4 right-1/4 w-8 h-8">
          <div
            class="absolute bottom-0 right-0 w-8 h-2 bg-white opacity-70"
          ></div>
          <div
            class="absolute bottom-0 right-0 w-2 h-8 bg-white opacity-70"
          ></div>
        </div>
      </div>

      <!-- Focus Point -->
      <div
        v-if="focusPoint"
        class="absolute w-30 h-30 border-2 border-white rounded-full pointer-events-none animate-ping z-20"
        :style="{
          left: focusPoint.x + 'px',
          top: focusPoint.y + 'px',
        }"
      ></div>

      <!-- Capture Flash Effect -->
      <div
        v-if="isCapturing"
        class="absolute inset-0 bg-white opacity-80 z-30"
      ></div>

      <!-- Hidden canvas for capturing snapshots -->
      <canvas ref="canvasElementRef" class="hidden" />

      <!-- Camera info overlay -->
      <div
        v-if="isStreaming && availableCameras.length > 1"
        class="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm z-10"
      >
        {{
          availableCameras.find(
            (c) => c.deviceId === selectedCameraId
          )?.label || 'Camera'
        }}
      </div>

      <!-- Camera UI Overlay -->
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
            <h2 class="text-xl font-bold text-white my-2">
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
              <h3 class="text-lg font-semibold text-gray-900">
                Fout:
              </h3>
            </div>
            <div
              class="bg-red-50 border border-red-200 rounded-lg p-4"
            >
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

        <!-- Bottom Section: Camera Controls -->
        <div
          v-if="
            !translationResult && !translationError && !isTranslating
          "
          class="flex-shrink-0 flex items-center justify-center relative"
        >
          <!-- Circular Shutter Button - Centered -->
          <button
            @click="handleTakePhoto"
            :disabled="!isStreaming"
            class="w-20 h-20 bg-white/20 border-4 border-white rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/30 transition-all duration-200 disabled:opacity-50"
            :class="{ 'animate-pulse': isTranslating }"
          >
            <div
              class="w-16 h-16 bg-white rounded-full flex items-center justify-center"
            >
              <UIcon
                name="i-heroicons-camera"
                class="w-8 h-8 text-gray-800"
              />
            </div>
          </button>

          <!-- Flash Toggle Button - To the right -->
          <button
            @click="toggleFlash"
            class="absolute left-[calc(50%+60px)] w-16 h-16 bg-white/20 border-2 border-white rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/30 transition-all duration-200"
            :class="{
              'bg-yellow-400/50 border-yellow-400': flashEnabled,
            }"
          >
            <UIcon
              :name="
                flashEnabled
                  ? 'i-heroicons-bolt-solid'
                  : 'i-heroicons-bolt-slash'
              "
              class="w-6 h-6 text-white"
              :class="{ 'text-yellow-300': flashEnabled }"
            />
          </button>
        </div>
      </div>
    </div>

    <!-- Bottom Black Area - 20vh -->
    <div class="h-[20vh] bg-black">
      <!-- Additional content can go here if needed -->
    </div>
  </div>
</template>
