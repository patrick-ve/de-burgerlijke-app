export default defineNuxtRouteMiddleware(() => {
  if (import.meta.client) {
    window.scrollTo(0, 0);
  }
});
