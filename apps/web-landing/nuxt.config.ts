import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-05-12',
  ssr: true,
  nitro: { preset: 'static' },
  modules: [],
  runtimeConfig: {
    public: {
      supabaseUrl:     process.env.SUPABASE_URL      ?? '',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? '',
    },
  },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'Vindicter - Local-First Security Workspace',
      titleTemplate: '%s',
      link: [
        { rel: 'icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', href: '/icon.png' },
        { rel: 'apple-touch-icon', href: '/icon.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@300;400;500;600;700&display=swap',
        },
      ],
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'robots', content: 'index, follow' },
        { name: 'author', content: 'Surelle-ha' },
        { name: 'application-name', content: 'Vindicter' },
        { name: 'theme-color', content: '#1e1f22' },
        {
          name: 'description',
          content: 'Vindicter is a free local-first desktop security workspace for AI code review, vulnerability tracking, dependency inventory, secret checks, and security learning.',
        },
        { property: 'og:site_name', content: 'Vindicter' },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://vindicta.xyz/' },
        { property: 'og:title', content: 'Vindicter - Local-First Security Workspace' },
        { property: 'og:description', content: 'AI security scanning, findings tracking, dependency checks, and security lessons for local codebases.' },
        { property: 'og:image', content: 'https://vindicta.xyz/icon.png' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Vindicter - Local-First Security Workspace' },
        { name: 'twitter:description', content: 'Scan codebases, track findings, and learn security from a local-first desktop workspace.' },
        { name: 'twitter:image', content: 'https://vindicta.xyz/icon.png' },
      ],
    },
  },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: { include: ['ogl'] },
  },
})
