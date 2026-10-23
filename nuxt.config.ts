import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineNuxtConfig({
  future: {
    compatibilityVersion: 4,
  },
  ssr: false,
  css: [
    '~/assets/css/main.css'
  ],
  modules: [
    '@primevue/nuxt-module'
  ],
  primevue: {
    options: {
      unstyled: true,
      ripple: true,
    }
  },
  vite: {
    plugins: [
      tailwindcss()
    ],
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    }
  },
  nitro: {
    output: {
      publicDir: path.resolve(__dirname, 'dist')
    }
  },
  compatibilityDate: '2026-06-14'
});
