import process from 'node:process';

const sw = process.env.SW === 'true';

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
    '@vite-pwa/nuxt',
    '@nuxt/fonts',
  ],

  ssr: false,

  pwa: {
    strategies: sw ? 'injectManifest' : 'generateSW',
    srcDir: sw ? 'service-worker' : undefined,
    filename: sw ? 'sw.ts' : undefined,
    registerType: 'autoUpdate',
    manifest: {
      name: 'De Burgerlijke App',
      short_name: 'DeBurgerlijkeApp',
      theme_color: '#40939a',
      icons: [
        {
          src: 'pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
        {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable',
        },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
    },
    injectManifest: {
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
    },
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 3600,
    },
    devOptions: {
      enabled: true,
      suppressWarnings: true,
      navigateFallback: '/',
      navigateFallbackAllowlist: [/^\/$/],
      type: 'module',
    },
  },

  runtimeConfig: {
    openaiApiKey: process.env.OPENAI_API_KEY,
    firecrawlApiKey: process.env.FIRECRAWL_API_KEY,
    googleAiApiKey: process.env.GOOGLE_AI_API_KEY,
    rapidApiKeyYoutube: process.env.RAPID_API_KEY_YOUTUBE,
    weaviateApiKey: process.env.WEAVIATE_API_KEY,
    public: {
      weaviateUrl: process.env.WEAVIATE_URL,
    },
  },

  colorMode: {
    preference: 'light',
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
