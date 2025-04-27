import process from 'node:process';

const sw = process.env.SW === 'true';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',

  // App configuration (should be top-level)
  app: {
    head: {
      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' },
        // Add other global links here if needed, e.g., favicons
        // { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ],
      meta: [
        { charset: 'utf-8' },
        {
          name: 'viewport',
          content:
            'viewport-fit=cover, width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no',
        },
        { name: 'msapplication-tap-highlight', content: 'no' },
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'color-scheme', content: 'light dark' },
      ],
    },
  },

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
    registerWebManifestInRouteRules: true,
    workbox: {
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
      maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
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
