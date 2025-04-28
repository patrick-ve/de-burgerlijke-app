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
import { useDisableDevTools } from '~/composables/useDisableDevTools';

const { headerState } = useHeaderState();
const { $pwa } = useNuxtApp();

useDisableDevTools({
  onDetectOpen: () => {
    if (import.meta.dev) return;
    window.location.href =
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  },
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
