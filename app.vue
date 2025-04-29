<template>
  <div>
    <NuxtPwaAssets />
    <NuxtLoadingIndicator :height="3" :color="'#40939a'" />

    <ion-app>
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
import { consola } from 'consola';
import { useDisableDevTools } from '~/composables/useDisableDevTools';

const { $pwa } = useNuxtApp();
const router = useRouter();

useDisableDevTools({
  onDetectOpen: () => {
    if (import.meta.client) {
      consola.info('Initiating redirect');
      window.location.href =
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    }
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
  /* Remove header padding adjustment */
  /* padding-top: var(--padding-top) !important; */
}

* {
  font-family: 'Plus Jakarta Sans', serif;
}
</style>
