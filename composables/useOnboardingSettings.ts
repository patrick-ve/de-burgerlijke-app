import { ref, computed } from 'vue';

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

export function useOnboardingSettings() {
  // --- State defined with simple refs ---
  const mode = ref<SelectionMode>('overview');
  const selectedSupermarketIds = ref<SupermarketName[]>([]);
  const hasCompletedOnboarding = ref(false);
  // showModal is now a simple ref, initially true
  const showModal = ref(true);

  // Optional: Computed for read-only combined settings
  const settings = computed(() => ({
    mode: mode.value,
    selectedSupermarketIds: selectedSupermarketIds.value,
    hasCompletedOnboarding: hasCompletedOnboarding.value,
  }));

  // --- Functions modifying the refs ---

  const setMode = (newMode: SelectionMode) => {
    mode.value = newMode;
    if (newMode === 'cheapest') {
      // Clear supermarket selection when switching to cheapest mode
      selectedSupermarketIds.value = [];
    }
  };

  const setSelectedSupermarketIds = (ids: SupermarketName[]) => {
    if (mode.value === 'overview') {
      selectedSupermarketIds.value = ids;
    } else {
      console.warn(
        'Attempted to set supermarket IDs while mode is not "overview".'
      );
    }
  };

  const toggleSupermarket = (id: SupermarketName) => {
    if (mode.value !== 'overview') {
      console.warn(
        'Cannot toggle supermarket selection when mode is not "overview".'
      );
      return;
    }
    const index = selectedSupermarketIds.value.indexOf(id);
    if (index === -1) {
      // Use .value to modify the ref's array
      selectedSupermarketIds.value.push(id);
    } else {
      // Use .value to modify the ref's array
      selectedSupermarketIds.value.splice(index, 1);
    }
  };

  const completeOnboarding = (
    currentMode: SelectionMode,
    currentSelectedIds: SupermarketName[]
  ) => {
    console.log(
      '[useOnboardingSettings - simple] completeOnboarding called'
    );
    // Directly modify the refs
    mode.value = currentMode;
    selectedSupermarketIds.value =
      currentMode === 'overview' ? currentSelectedIds : [];
    hasCompletedOnboarding.value = true;
    showModal.value = false; // Directly set the modal ref to false
    console.log(
      '[useOnboardingSettings - simple] showModal set to:',
      showModal.value
    );
  };

  const resetOnboarding = () => {
    // Reset refs to initial values
    mode.value = 'overview';
    selectedSupermarketIds.value = [];
    hasCompletedOnboarding.value = false;
    showModal.value = true;
  };

  return {
    settings, // Read-only computed settings
    showModal, // The simple ref for v-model
    // Expose individual refs if direct modification is needed elsewhere (optional)
    // mode,
    // selectedSupermarketIds,
    // hasCompletedOnboarding,
    setMode,
    setSelectedSupermarketIds, // Keep if needed
    toggleSupermarket,
    completeOnboarding,
    resetOnboarding,
  };
}
