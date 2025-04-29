<script setup lang="ts">
import {
  useOnboardingSettings,
  type SupermarketName,
} from '~/composables/useOnboardingSettings'; // Import the composable and the type

// Define Supermarket interface locally
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
  setMode,
  toggleSupermarket,
  // `completeOnboarding` and `onboardingState` might need adjustment for a settings page
} = useOnboardingSettings();

// Radio options
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

// Logic to save settings might be needed here, e.g., via a button click
// For now, changes are reactive via the composable

// Computed property for disabled state (might not be needed if there's no confirm button)
const isConfirmDisabled = computed(() => {
  if (mode.value === 'overview') {
    return selectedSupermarketIds.value.length === 0;
  }
  return false;
});

useHead({
  title: 'Instellingen',
});
</script>

<template>
  <section>
    <AppSettings />
  </section>
</template>

<style>
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
