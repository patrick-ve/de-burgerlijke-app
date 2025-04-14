<script setup lang="ts">
import { ref, computed, onUnmounted, watch } from 'vue';
import { useIntervalFn } from '@vueuse/core';

const props = defineProps<{
  durationMs: number | null;
  // stepId?: string; // Optional ID if needed for external tracking
}>();

const emit = defineEmits<{
  (e: 'finished'): void;
  (e: 'started'): void;
  (e: 'paused'): void;
  (e: 'reset'): void;
}>();

// --- Internal Timer State ---
const isRunning = ref(false);
const endTime = ref<number | null>(null); // Timestamp when the timer should finish
const remainingMsOnPause = ref<number | null>(null); // Store remaining time when paused
const displaySeconds = ref<number>(0); // Reactive state for display

// Function to get initial seconds from props
const getInitialSeconds = () => {
  return props.durationMs !== null
    ? Math.floor(props.durationMs / 1000)
    : 0;
};

// --- Formatted Display ---
const formattedTime = computed(() => {
  const totalSeconds = displaySeconds.value;
  if (totalSeconds < 0) return '00:00'; // Should not happen with Math.max
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
});

// --- Interval Timer for Display Update & Finish Check ---
const {
  pause: pauseInterval,
  resume: resumeInterval,
  isActive: isIntervalActive,
} = useIntervalFn(
  () => {
    if (!isRunning.value || endTime.value === null) {
      // This should theoretically not be needed if interval is paused correctly, but acts as a safeguard
      if (isIntervalActive.value) pauseInterval();
      return;
    }

    const now = Date.now();
    const currentRemainingMs = endTime.value - now;

    if (currentRemainingMs <= 0) {
      // Timer finished naturally
      displaySeconds.value = 0;
      isRunning.value = false;
      endTime.value = null;
      remainingMsOnPause.value = null; // Clear paused state
      pauseInterval(); // Stop this interval
      emit('finished');
    } else {
      // Update display
      displaySeconds.value = Math.max(
        0,
        Math.round(currentRemainingMs / 1000)
      );
    }
  },
  250,
  { immediate: false }
); // Update display ~4 times/sec, don't run immediately

// Stop interval initially if created active (depends on useIntervalFn version)
if (isIntervalActive.value) {
  pauseInterval();
}

// --- Control Functions ---
const startTimer = () => {
  if (
    isRunning.value ||
    props.durationMs === null ||
    displaySeconds.value <= 0
  ) {
    return;
  }

  const msToRun = remainingMsOnPause.value ?? props.durationMs;
  if (msToRun <= 0) return; // Nothing to run

  endTime.value = Date.now() + msToRun;
  remainingMsOnPause.value = null; // Clear paused state
  isRunning.value = true;
  resumeInterval(); // Start the display update interval
  emit('started');
};

const pauseTimer = () => {
  if (!isRunning.value || endTime.value === null) {
    return;
  }
  // Capture remaining time before pausing
  remainingMsOnPause.value = Math.max(0, endTime.value - Date.now()); // Ensure non-negative
  isRunning.value = false;
  endTime.value = null; // Clear end time as it's no longer actively counting down
  pauseInterval(); // Stop the display update interval
  emit('paused');
};

const resetTimer = () => {
  // Ensure interval is stopped and state is cleared
  pauseInterval();
  isRunning.value = false;
  endTime.value = null;
  remainingMsOnPause.value = null;

  // Reset display to initial duration
  displaySeconds.value = getInitialSeconds();

  // Emit reset only if it wasn't already at the initial state
  // This check might need adjustment depending on desired reset behavior
  // For now, always emit reset when called.
  emit('reset');
};

// --- Button Visibility (computed) ---
const initialSeconds = computed(getInitialSeconds);

const canStart = computed(
  () =>
    !isRunning.value &&
    displaySeconds.value > 0 &&
    props.durationMs !== null
);
const canPause = computed(
  () => isRunning.value && props.durationMs !== null
);
// Allow reset if timer is running, or if it's paused/stopped but not at the initial full duration
const canReset = computed(
  () =>
    props.durationMs !== null &&
    (isRunning.value ||
      (displaySeconds.value > 0 &&
        displaySeconds.value < initialSeconds.value))
);

// --- Lifecycle ---
onUnmounted(() => {
  pauseInterval(); // Clean up interval on component destroy
});

// Watch for external duration changes
watch(
  () => props.durationMs,
  (newDuration, oldDuration) => {
    if (newDuration !== oldDuration) {
      console.log('Timer duration changed, resetting timer.');
      resetTimer(); // Reset state when duration prop changes
    }
  },
  { immediate: true } // Run initially to set the first displaySeconds value
);
</script>

<template>
  <div
    v-if="props.durationMs !== null"
    class="flex items-center gap-2 mt-1 text-xs"
  >
    <UIcon
      name="i-heroicons-clock"
      class="w-4 h-4 text-gray-400 flex-shrink-0"
    />
    <span
      class="font-mono text-sm font-medium text-gray-600 min-w-[45px] text-right"
      :class="{ 'text-primary-600 font-bold': isRunning }"
    >
      {{ formattedTime }}
    </span>

    <div class="flex items-center gap-1">
      <!-- Start Button -->
      <UButton
        v-if="canStart"
        icon="i-heroicons-play-solid"
        size="xs"
        color="gray"
        variant="ghost"
        square
        :padded="false"
        @click="startTimer"
        aria-label="Start timer"
      />
      <!-- Pause Button -->
      <UButton
        v-if="canPause"
        icon="i-heroicons-pause-solid"
        size="xs"
        color="gray"
        variant="ghost"
        square
        :padded="false"
        @click="pauseTimer"
        aria-label="Pause timer"
      />
      <!-- Reset Button -->
      <UButton
        v-if="canReset"
        icon="i-heroicons-arrow-path"
        size="xs"
        color="gray"
        variant="ghost"
        square
        :padded="false"
        @click="resetTimer"
        aria-label="Reset timer"
      />
    </div>
  </div>
</template>
