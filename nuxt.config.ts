// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',

  devtools: { enabled: true },

  modules: [
    '@nuxtjs/ionic',
    '@nuxt/ui',
    '@nuxt/icon',
    '@nuxt/image',
    '@vueuse/nuxt',
  ],

  ssr: false,

  runtimeConfig: {
    openaiApiKey: process.env.OPENAI_API_KEY,
    public: {},
  },

  // Configure Nuxt UI module
  ui: {
    global: true,
    icons: {
      dynamic: true,
      families: {
        heroicons: true,
      },
    },
  },
});