// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@nuxtjs/ionic', '@nuxtjs/tailwindcss'],
  ssr: false,
  runtimeConfig: {
    openaiApiKey: process.env.OPENAI_API_KEY,
  },
});
