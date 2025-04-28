<template>
  <div>
    <NuxtPwaAssets />
    <NuxtLoadingIndicator :height="3" :color="'#40939a'" />

    <ion-app>
      <TheHeader :title="headerState.title">
        <template #left-action>
          <!-- Content for this slot will be provided by the page -->
          <div id="header-left-action"></div>
        </template>
        <template #right-action>
          <!-- Content for this slot will be provided by the page -->
          <div id="header-right-action"></div>
        </template>
      </TheHeader>

      <ion-content class="ion-padding">
        <NuxtPage />
      </ion-content>

      <NavigationSlideover />

      <UModals />
      <USlideovers />
      <UNotifications />
    </ion-app>
  </div>
</template>

<script setup lang="ts">
import { useHeaderState } from '~/composables/useHeaderState';

const { headerState } = useHeaderState();
const { $pwa } = useNuxtApp();

useSeoMeta({
  ogImage: '/og-image.png',
  title: 'De Burgerlijke App',
  description:
    'De slimme assistent voor je boodschappen en huishoudelijke planning.',
  ogTitle: 'De Burgerlijke App',
  ogDescription:
    'De slimme assistent voor je boodschappen en huishoudelijke planning.',
  ogUrl: 'https://burgerlijke.app',
  ogType: 'website',
  ogSiteName: 'De Burgerlijke App',
  twitterCard: 'summary_large_image',
  twitterImage: '/og-image.png',
});

onMounted(() => {
  if (import.meta.client) {
    localStorage.removeItem('nuxt-color-mode');
  }
});
</script>

<style>
.ion-padding {
  /* Keep padding for content, but adjust if needed for slideover */
  /* --padding-bottom: 4rem; */ /* Removed as BottomNav is gone */
}

ion-content {
  padding-top: var(--padding-top) !important;
}

* {
  font-family: 'Plus Jakarta Sans', serif;
}
</style>
