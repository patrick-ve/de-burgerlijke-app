import process from 'node:process';

const sw = process.env.SW === 'true';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',

  // App configuration (should be top-level)
  app: {
    head: {
      title: 'De Burgerlijke App',
      htmlAttrs: {
        lang: 'nl',
      },
      link: [{ rel: 'manifest', href: '/manifest.webmanifest' }],
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
        {
          name: 'description',
          content:
            'De slimme assistent voor je boodschappen en huishoudelijke planning.',
        },
        { property: 'og:title', content: 'De Burgerlijke App' },
        {
          property: 'og:description',
          content:
            'De slimme assistent voor je boodschappen en huishoudelijke planning.',
        },
        { property: 'og:image', content: '/og-image.png' },
        { property: 'og:url', content: 'https://burgerlijke.app' },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'De Burgerlijke App' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:image', content: '/og-image.png' },
      ],
    },
  },

  devtools: { enabled: true },

  extends: ['@nuxt/ui-pro'],

  modules: [
    '@nuxtjs/ionic',
    '@nuxt/ui',
    '@nuxt/icon',
    '@nuxt/image',
    '@vueuse/nuxt',
    '@vite-pwa/nuxt',
    '@nuxt/fonts',
    'nuxt-umami',
  ],

  ssr: false,

  pwa: {
    strategies: sw ? 'injectManifest' : 'generateSW',
    srcDir: sw ? 'service-worker' : undefined,
    filename: sw ? 'sw.ts' : undefined,
    registerType: 'autoUpdate',
    manifest: {
      name: 'De Burgerlijke App',
      short_name: 'De Burgerlijke App',
      description:
        'De slimme assistent voor je boodschappen en huishoudelijke planning. Organiseer al je recepten overzichtelijk in één plek, plan maaltijden in voor het gezin en bespaar geld met boodschappen doen.',
      display: 'standalone',
      theme_color: '#40939a',
      orientation: 'portrait',
      start_url: '/app',
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
      ],
      screenshots: [
        {
          src: 'pwa-screenshot-mobile-1.png',
          sizes: '832x1794',
          type: 'image/png',
          form_factor: 'narrow',
          label: 'Mobile Screenshot',
        },
        {
          src: 'pwa-screenshot-mobile-2.png',
          sizes: '828x1794',
          type: 'image/png',
          form_factor: 'narrow',
          label: 'Mobile Screenshot',
        },
        {
          src: 'pwa-screenshot-mobile-3.png',
          sizes: '832x1796',
          type: 'image/png',
          form_factor: 'narrow',
          label: 'Mobile Screenshot',
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
    // Icons are handled by @nuxt/icon module
  },

  umami: {
    id: 'b5eb9afc-6894-4767-b990-f4e34ee4c89a',
    host: 'https://cloud.umami.is/',
    autoTrack: true,
    ignoreLocalhost: true,
    domains: ['burgerlijke.app'],
  },
});
