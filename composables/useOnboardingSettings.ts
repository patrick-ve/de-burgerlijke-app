import { computed } from 'vue';
import { useLocalStorage } from '@vueuse/core';

// Keep the exported types
export type SupermarketName =
  | 'dirk'
  | 'plus'
  | 'coop'
  | 'jumbo'
  | 'hoogvliet'
  | 'ah'
  | 'dekamarkt'
  | 'aldi'
  | 'vomar';
type SelectionMode = 'overview' | 'cheapest';

// Key for local storage
const ONBOARDING_STORAGE_KEY = 'onboardingSettings';

interface OnboardingState {
  mode: SelectionMode;
  selectedSupermarketIds: SupermarketName[];
  hasCompletedOnboarding: boolean;
  showModal: boolean;
}

export function useOnboardingSettings() {
  // --- State defined with useLocalStorage ---
  const onboardingState = useLocalStorage<OnboardingState>(
    ONBOARDING_STORAGE_KEY,
    {
      // Default values
      mode: 'overview',
      selectedSupermarketIds: [],
      hasCompletedOnboarding: false,
      showModal: true,
    }
  );

  // --- Computed properties based on the state ---
  const mode = computed(() => onboardingState.value.mode);
  const selectedSupermarketIds = computed(
    () => onboardingState.value.selectedSupermarketIds
  );
  const hasCompletedOnboarding = computed(
    () => onboardingState.value.hasCompletedOnboarding
  );

  // Optional: Computed for read-only combined settings (if needed elsewhere)
  // const settings = computed(() => onboardingState.value);

  // --- Functions modifying the state ---

  const setMode = (newMode: SelectionMode) => {
    onboardingState.value.mode = newMode;
    if (newMode === 'cheapest') {
      // Clear supermarket selection when switching to cheapest mode
      onboardingState.value.selectedSupermarketIds = [];
    }
  };

  const setSelectedSupermarketIds = (ids: SupermarketName[]) => {
    if (onboardingState.value.mode === 'overview') {
      onboardingState.value.selectedSupermarketIds = ids;
    } else {
      console.warn(
        'Attempted to set supermarket IDs while mode is not "overview".'
      );
    }
  };

  const toggleSupermarket = (id: SupermarketName) => {
    if (onboardingState.value.mode !== 'overview') {
      console.warn(
        'Cannot toggle supermarket selection when mode is not "overview".'
      );
      return;
    }
    const currentIds = onboardingState.value.selectedSupermarketIds;
    const index = currentIds.indexOf(id);
    if (index === -1) {
      onboardingState.value.selectedSupermarketIds = [
        ...currentIds,
        id,
      ];
    } else {
      onboardingState.value.selectedSupermarketIds = [
        ...currentIds.slice(0, index),
        ...currentIds.slice(index + 1),
      ];
    }
  };

  const completeOnboarding = (
    currentMode: SelectionMode,
    currentSelectedIds: SupermarketName[]
  ) => {
    console.log('[useOnboardingSettings] completeOnboarding called');
    onboardingState.value = {
      mode: currentMode,
      selectedSupermarketIds:
        currentMode === 'overview' ? currentSelectedIds : [],
      hasCompletedOnboarding: true,
      showModal: false,
    };
    console.log(
      '[useOnboardingSettings] State after completion:',
      onboardingState.value
    );
  };

  const resetOnboarding = () => {
    console.log('[useOnboardingSettings] resetOnboarding called');
    // Reset state to default values
    onboardingState.value = {
      mode: 'overview',
      selectedSupermarketIds: [],
      hasCompletedOnboarding: false,
      showModal: true,
    };
  };

  return {
    // Expose computed refs for read access
    mode,
    selectedSupermarketIds,
    hasCompletedOnboarding,
    // Expose functions to modify state
    setMode,
    setSelectedSupermarketIds,
    toggleSupermarket,
    completeOnboarding,
    resetOnboarding,
    onboardingState,
    // Deprecated: settings, showModal
  };
}
