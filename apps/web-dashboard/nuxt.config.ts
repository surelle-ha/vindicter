import tailwindcss from '@tailwindcss/vite'

const SITE_URL   = 'https://dashboard.vindicter.xyz'
const SITE_NAME  = 'Vindicter'
const APP_TITLE  = 'Vindicter Dashboard'
const LOGIN_DESC = 'Sign in to your Vindicter account to manage your security workspace, API tokens, and account settings.'

export default defineNuxtConfig({
  compatibilityDate: '2025-05-12',
  ssr: true,
  modules: [],
  runtimeConfig: {
    public: {
      supabaseUrl:      process.env.SUPABASE_URL                   ?? '',
      supabaseAnonKey:  process.env.SUPABASE_ANON_KEY              ?? '',
      turnstileSiteKey: process.env.NUXT_PUBLIC_TURNSTILE_SITE_KEY ?? '1x00000000000000000000AA',
    },
  },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: APP_TITLE,
      // Page-level useHead() calls override the title; this formats the tab
      titleTemplate: (chunk) => chunk ? `${chunk} — ${SITE_NAME}` : APP_TITLE,
      link: [
        // No canonical — dashboard is private, each page is auth-gated
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
        // Authenticated dashboard — keep out of search engines
        { name: 'robots',           content: 'noindex, nofollow' },
        { name: 'googlebot',        content: 'noindex, nofollow' },
        { name: 'theme-color',      content: '#111215' },
        { name: 'color-scheme',     content: 'dark' },
        { name: 'application-name', content: SITE_NAME },
        { name: 'description',      content: LOGIN_DESC },
        // Minimal OG for link previews when sharing dashboard links internally
        { property: 'og:site_name', content: SITE_NAME },
        { property: 'og:type',      content: 'website' },
        { property: 'og:url',       content: SITE_URL },
        { property: 'og:title',     content: APP_TITLE },
        { property: 'og:description', content: LOGIN_DESC },
        { property: 'og:image',     content: `${SITE_URL}/icon.png` },
        // Prevent crawlers from following auth pages
        { 'http-equiv': 'X-Robots-Tag', content: 'noindex, nofollow' },
      ],
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
})
