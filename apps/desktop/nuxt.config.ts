import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-05-12',
  ssr: false,

  // Fixes Nuxt 4.4.5 bug: "No entry found in rollupOptions.input" when ssr:false
  experimental: {
    viteEnvironmentApi: true,
  },

  modules: [
    '@pinia/nuxt',
    '@vueuse/nuxt',
  ],

  components: {
    dirs: [
      { path: '~/components', pathPrefix: false },
    ],
  },

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: 'Vindicter',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
      link: [
        { rel: 'icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', href: '/icon.png' },
        { rel: 'apple-touch-icon', href: '/icon.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500;1,700&display=swap' },
      ],
    },
  },

  vite: {
    plugins: [tailwindcss()],
    clearScreen: false,
    envPrefix: ['VITE_', 'TAURI_'],
    // Required for Kokoro TTS web worker (ONNX inference in a background thread)
    worker: {
      format: 'es',
    },
    optimizeDeps: {
      exclude: [
        '@tauri-apps/api',
        '@tauri-apps/plugin-shell',
        '@tauri-apps/plugin-dialog',
        '@tauri-apps/plugin-fs',
        '@tauri-apps/plugin-store',
        // Kokoro TTS and its deps — large/complex packages served as-is
        'kokoro-js',
        '@huggingface/transformers',
        'phonemizer',
      ],
    },
  },

  devServer: {
    port: 3000,
  },
})
