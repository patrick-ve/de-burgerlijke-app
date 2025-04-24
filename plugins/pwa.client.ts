import { consola } from 'consola';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook(
    'service-worker:registered',
    ({ url, registration }) => {
      // eslint-disable-next-line no-console
      consola.info(
        `service worker registered at ${url}`,
        registration
      );
    }
  );
  nuxtApp.hook('service-worker:registration-failed', ({ error }) => {
    consola.error(`service worker registration failed`, error);
  });
  nuxtApp.hook(
    'service-worker:activated',
    ({ url, registration }) => {
      // eslint-disable-next-line no-console
      consola.success(
        `service worker activated at ${url}`,
        registration
      );
    }
  );
});
