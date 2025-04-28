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

// Define supermarkets directly in the component, sorted alphabetically by name
const supermarkets: Supermarket[] = [
  {
    id: 'aldi',
    name: 'ALDI',
    ico: 'https://play-lh.googleusercontent.com/SacQDsmttU6UOYjVLls5a7mvUYCS5yMEZt5XF6m0zUq34mrSf9O5vZBDPazxk4RBPCA=w240-h480',
  },
  {
    id: 'ah',
    name: 'Albert Heijn',
    ico: 'https://www.ah.nl/favicon.ico',
  },
  {
    id: 'coop',
    name: 'Coop',
    ico: 'https://www.coop.nl/assets/themes/custom/img/logo_apple_180x180.png',
  },
  {
    id: 'dekamarkt',
    name: 'DekaMarkt',
    ico: 'https://d3r3h30p75xj6a.cloudfront.net/static-images/deka/web/favicon.svg',
  },
  {
    id: 'dirk',
    name: 'Dirk',
    ico: 'https://d3r3h30p75xj6a.cloudfront.net/static-images/dirk/web/app_icon.png',
  },
  {
    id: 'hoogvliet',
    name: 'Hoogvliet',
    ico: 'https://www.hoogvliet.com/INTERSHOP/static/WFS/org-webshop-Site/-/-/nl_NL/img/smart_banner_icon.png',
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
    id: 'vomar',
    name: 'Vomar',
    ico: 'https://www.vomar.nl/apple-touch-icon.png',
  },
];

// Instantiate the composable
const {
  mode, // Use direct computed ref
  selectedSupermarketIds, // Use direct computed ref
  setMode,
  toggleSupermarket,
} = useOnboardingSettings();

// Radio options
const modeOptions = [
  {
    value: 'overview',
    label:
      'Toon boodschappen van de supermarkt(en) waar ik boodschappen doe (aanbevolen).',
  },
  {
    value: 'cheapest',
    label:
      'Toon het goedkoopste product voor elk product. Elke supermarkt wordt meegenomen in de vergelijking.',
  },
];

// Computed property for disabled state
const isConfirmDisabled = computed(() => {
  if (mode.value === 'overview') {
    return selectedSupermarketIds.value.length === 0;
  }
  return false;
});

// Define language options with flags
const languageOptions = [
  {
    value: 'nl',
    label: '🇳🇱 Nederlands',
  },
  {
    value: 'en',
    label: '🇬🇧 English',
  },
];

// Set the default language to Dutch
const selectedLanguage = ref('nl');
</script>

<template>
  <div class="space-y-2">
    <!-- Supermarket Settings Card -->
    <div class="overflow-hidden bg-white">
      <div
        class="space-y-6 border-b border-gray-200 px-4 py-5 sm:p-6"
      >
        <!-- Mode Selection -->
        <div>
          <h3 class="mb-2 font-semibold text-primary">
            Weergave boodschappen
          </h3>

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
            :uiRadio="{
              wrapper: 'border-[1px] border-gray-200 p-2 rounded-md',
            }"
          >
            <template #label="{ option }">
              <span :class="{ 'font-bold': mode === option.value }">{{
                option.label
              }}</span>
            </template>
          </URadioGroup>
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
    </div>

    <!-- Language Settings Card -->
    <div class="overflow-hidden bg-white">
      <div
        class="space-y-6 px-4 pb-5 sm:p-6 border-b-[1px] border-gray-200"
      >
        <!-- Language Selection Display -->
        <div>
          <h3 class="mb-2 font-semibold text-primary">Taal</h3>

          <URadioGroup
            v-model="selectedLanguage"
            :options="languageOptions"
            legend="Kies een taal"
            :disabled="true"
            :ui="{
              fieldset: 'flex flex-row gap-2 w-full',
            }"
            :uiRadio="{
              wrapper:
                'border-[1px] border-gray-200 p-2 rounded-md flex items-center w-full',
              label: 'cursor-default',
            }"
          >
            <template #label="{ option }">
              <span
                :class="{
                  'font-bold': selectedLanguage === option.value,
                }"
                >{{ option.label }}</span
              >
            </template>
          </URadioGroup>
          <p class="mt-2 text-sm text-gray-500">
            Momenteel is alleen Nederlands beschikbaar.
          </p>
        </div>
      </div>
    </div>
  </div>
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
