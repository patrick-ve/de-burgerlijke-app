import { consola } from 'consola';
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
    // TODO: Report error to a monitoring service (e.g., Sentry, Bugsnag)
    consola.error('Vue error:', error);
    consola.error('Vue error instance:', instance);
    consola.error('Vue error info:', info);

    // You could potentially show a user-friendly notification here
  };

  // You can also use the 'vue:error' hook
  nuxtApp.hook('vue:error', (error, instance, info) => {
    // This hook is based on onErrorCaptured, so it might catch errors
    // that errorHandler doesn't, depending on the propagation
    consola.error('Nuxt vue:error hook:', error);
    // TODO: Report error to a monitoring service
  });

  // Handle Nuxt app errors (startup, plugins, mounting, etc.)
  nuxtApp.hook('app:error', (error) => {
    consola.error('Nuxt app:error hook:', error);
    // This often indicates a fatal error during app initialization
    // You might want to show a specific message or take action
    // TODO: Report error to a monitoring service
  });
});
