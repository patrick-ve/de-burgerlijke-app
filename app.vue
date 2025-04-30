<template>
  <div>
    <NuxtPwaAssets />
    <NuxtLoadingIndicator :height="3" :color="'#40939a'" />

    <ion-app>
      <ion-content class="ion-padding">
        <NuxtErrorBoundary @error="logClientError">
          <NuxtPage />

          <template #error="{ error, clearError }">
            <div class="p-4 text-center bg-primary-500">
              <h3 class="text-lg font-semibold text-red-600">
                Oeps! Er ging iets mis.
              </h3>
              <p class="mt-4 text-sm text-gray-700">
                Er is een fout opgetreden bij het weergeven van dit
                gedeelte van de pagina.
              </p>
              <p
                v-if="error.message"
                class="mt-2 text-xs text-gray-500"
              >
                Fout: {{ error.message }}
              </p>

              <UButton
                class="mt-4"
                variant="outline"
                color="gray"
                size="sm"
                @click="clearError"
              >
                Probeer opnieuw
              </UButton>
            </div>
          </template>
        </NuxtErrorBoundary>
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

// Function to log client-side errors caught by the boundary
const logClientError = (error: unknown) => {
  consola.error(
    'Client-side error caught in app.vue boundary:',
    error
  );
  // Optional: Check if it's an Error instance for more details
  if (error instanceof Error) {
    consola.error('Error name:', error.name);
    consola.error('Error message:', error.message);
    consola.error('Error stack:', error.stack);
  }
  // TODO: Report this error to your monitoring service (e.g., Sentry)
};
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
