// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  modules: ['vuetify-nuxt-module'],

  css: ['~/assets/css/main.scss'],

  runtimeConfig: {
    public: {
      // TODO: replace with the real production domain once deployed
      siteUrl: 'https://mohamedosama.dev',
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      titleTemplate: '%s',
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap',
        },
      ],
    },
  },

  vuetify: {
    moduleOptions: {
      styles: true,
    },
    vuetifyOptions: {
      icons: {
        defaultSet: 'mdi-svg',
      },
      theme: {
        defaultTheme: 'dark',
        themes: {
          dark: {
            dark: true,
            colors: {
              background: '#0A0A0B',
              surface: '#0F0F11',
              'surface-bright': '#141416',
              'surface-variant': '#1A1A1D',
              primary: '#C6F32E',
              'on-primary': '#0A0A0B',
              secondary: '#7C5CFF',
              'on-background': '#EDEDED',
              'on-surface': '#EDEDED',
              error: '#FF6A6A',
              success: '#28C840',
            },
          },
          light: {
            dark: false,
            colors: {
              background: '#F6F6F1',
              surface: '#FFFFFF',
              'surface-bright': '#FFFFFF',
              'surface-variant': '#ECEDE4',
              primary: '#4F7A00',
              'on-primary': '#FFFFFF',
              secondary: '#5B3DF5',
              'on-background': '#181811',
              'on-surface': '#181811',
              error: '#C62828',
              success: '#1B873F',
            },
          },
        },
      },
      defaults: {
        VBtn: {
          rounded: 'lg',
          class: 'text-none',
        },
        VChip: {
          rounded: 'pill',
        },
      },
    },
  },

  nitro: {
    prerender: {
      routes: ['/'],
    },
  },
})
