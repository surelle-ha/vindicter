import tailwindcss from '@tailwindcss/vite'

const SITE_NAME = 'Vindicter'
const APP_TITLE = 'Vindicter Admin'
const DESC     = 'Internal admin and marketing panel for Vindicter.'

export default defineNuxtConfig({
  compatibilityDate: '2025-05-12',
  ssr: false,
  modules: [],
  runtimeConfig: {
    public: {
      apiBaseUrl:       process.env.NUXT_PUBLIC_API_BASE_URL       ?? 'http://localhost:4000/api/v1',
      turnstileSiteKey: process.env.NUXT_PUBLIC_TURNSTILE_SITE_KEY
        ?? (process.env.NODE_ENV !== 'production' ? '1x00000000000000000000AA' : ''),
    },
  },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: APP_TITLE,
      titleTemplate: (chunk) => chunk ? `${chunk} — ${SITE_NAME}` : APP_TITLE,
      link: [
        { rel: 'icon',             href: '/favicon.ico' },
        { rel: 'icon',             type: 'image/png', sizes: '32x32', href: '/icon.png' },
        { rel: 'apple-touch-icon', href: '/icon.png' },
        { rel: 'preconnect',       href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect',       href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@300;400;500;600;700&display=swap',
        },
      ],
      meta: [
        { name: 'viewport',         content: 'width=device-width, initial-scale=1' },
        { name: 'robots',           content: 'noindex, nofollow' },
        { name: 'googlebot',        content: 'noindex, nofollow' },
        { name: 'theme-color',      content: '#111215' },
        { name: 'color-scheme',     content: 'dark' },
        { name: 'application-name', content: SITE_NAME },
        { name: 'description',      content: DESC },
        { 'http-equiv': 'X-Robots-Tag', content: 'noindex, nofollow' },
      ],
    },
  },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: { include: ['ogl'] },
  },
})
