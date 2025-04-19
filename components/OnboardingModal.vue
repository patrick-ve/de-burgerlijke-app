<script setup lang="ts">
import {
  useOnboardingSettings,
  type SupermarketName,
} from '~/composables/useOnboardingSettings'; // Import the composable and the type

// No longer needed if modal controls its own open state based on persisted setting
// const emit = defineEmits(['close']);

// Define Supermarket interface locally (keep for supermarket list definition)
interface Supermarket {
  id: SupermarketName;
  name: string;
  ico: string;
}

// Define supermarkets directly in the component
const supermarkets: Supermarket[] = [
  {
    id: 'ah',
    name: 'Albert Heijn',
    ico: 'https://www.ah.nl/favicon.ico',
  },
  {
    id: 'jumbo',
    name: 'Jumbo',
    ico: 'https://www.jumbo.com/INTERSHOP/static/WFS/Jumbo-Grocery-Site/-/-/nl_NL/images/favicon.ico',
  },
  {
    id: 'plus',
    name: 'PLUS',
    ico: 'https://www.werkenbijplus.nl/WBP/img/plusMarker.png',
  },
  {
    id: 'dirk',
    name: 'Dirk',
    ico: 'https://d3r3h30p75xj6a.cloudfront.net/static-images/dirk/web/app_icon.png',
  },
  {
    id: 'aldi',
    name: 'ALDI',
    ico: 'https://play-lh.googleusercontent.com/SacQDsmttU6UOYjVLls5a7mvUYCS5yMEZt5XF6m0zUq34mrSf9O5vZBDPazxk4RBPCA=w240-h480',
  },
  {
    id: 'coop',
    name: 'Coop',
    ico: 'https://www.coop.nl/assets/themes/custom/img/logo_apple_180x180.png',
  },
  {
    id: 'hoogvliet',
    name: 'Hoogvliet',
    ico: 'https://www.hoogvliet.com/INTERSHOP/static/WFS/org-webshop-Site/-/-/nl_NL/img/smart_banner_icon.png',
  },
  {
    id: 'vomar',
    name: 'Vomar',
    ico: 'https://www.vomar.nl/apple-touch-icon.png',
  },
  {
    id: 'dekamarkt',
    name: 'DekaMarkt',
    ico: 'https://d3r3h30p75xj6a.cloudfront.net/static-images/deka/web/favicon.svg',
  },
];

// Instantiate the composable
const {
  mode, // Use direct computed ref
  selectedSupermarketIds, // Use direct computed ref
  hasCompletedOnboarding, // Use direct computed ref to control visibility
  setMode,
  toggleSupermarket,
  onboardingState,
  completeOnboarding,
} = useOnboardingSettings();

// Keep radio options
const modeOptions = [
  {
    value: 'overview',
    label:
      'Toon een overzicht van de supermarkt(en) waar ik boodschappen doe (aanbevolen).',
  },
  {
    value: 'cheapest',
    label:
      'Toon het goedkoopste product voor elk product. Elke supermarkt wordt meegenomen in de vergelijking.',
  },
];

// completeOnboarding now handles setting the persisted state
const handleConfirm = () => {
  completeOnboarding(
    mode.value, // Use direct computed ref
    selectedSupermarketIds.value // Use direct computed ref
  );
  // The watch on hasCompletedOnboarding will set isModalOpen.value to false
};

// Computed property for disabled state using composable state
const isConfirmDisabled = computed(() => {
  if (mode.value === 'overview') {
    // Disable if overview mode is selected and no supermarkets are chosen
    return selectedSupermarketIds.value.length === 0;
  }
  // Always enable if 'cheapest' mode is selected
  return false;
});
</script>

<template>
  <!-- Bind v-model directly to the local isModalOpen ref -->
  <UModal
    v-model="onboardingState.showModal"
    prevent-close
    :ui="{
      container: '-translate-y-20',
      overlay: {
        background: 'bg-black/40 backdrop-blur-sm',
      },
      width: 'sm:max-w-lg', // Slightly wider modal
    }"
  >
    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold">
          Welkom bij De Burgerlijke App!
        </h3>
      </template>

      <div class="space-y-6">
        <!-- Mode Selection -->
        <div>
          <p class="mb-2 font-medium">
            Hoe wil jij de goedkoopste boodschappen te zien krijgen?
          </p>
          <!-- Use setMode for v-model update -->
          <URadioGroup
            :model-value="mode"
            @update:model-value="
              setMode($event as 'overview' | 'cheapest')
            "
            :options="modeOptions"
            legend="Kies een optie"
            :ui="{
              fieldset: 'space-y-2',
            }"
          />
        </div>

        <!-- Conditional Supermarket Selection - use mode -->
        <div v-if="mode === 'overview'" class="space-y-4">
          <p>
            Selecteer hieronder de supermarkten waar je boodschappen
            wilt vergelijken.
          </p>
          <!-- Pill selection area with TransitionGroup -->
          <TransitionGroup
            tag="div"
            name="list"
            class="flex flex-wrap gap-2"
            appear
          >
            <UButton
              v-for="(supermarket, index) in supermarkets"
              :key="supermarket.id"
              :variant="
                selectedSupermarketIds.includes(
                  supermarket.id as SupermarketName
                )
                  ? 'solid'
                  : 'outline'
              "
              :style="{ transitionDelay: `${index * 50}ms` }"
              @click="
                toggleSupermarket(supermarket.id as SupermarketName)
              "
            >
              <img
                :src="supermarket.ico"
                :alt="supermarket.name"
                class="h-4 w-4"
              />
              <span class="text-sm">{{ supermarket.name }}</span>
            </UButton>
          </TransitionGroup>
        </div>
        <div v-else>
          <p class="text-sm text-gray-500">
            Je hebt gekozen voor de goedkoopste boodschappenlijst.
            Alle supermarkten worden meegenomen in de vergelijking.
          </p>
        </div>
      </div>

      <template #footer>
        <UButton
          label="Bevestigen"
          @click="handleConfirm"
          :disabled="isConfirmDisabled"
        />
      </template>
    </UCard>
  </UModal>
</template>

<style>
/* Staggered list transition */
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
