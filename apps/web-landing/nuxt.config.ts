import tailwindcss from '@tailwindcss/vite'

const SITE_URL  = 'https://vindicter.xyz'
const SITE_NAME = 'Vindicter'
const TITLE     = 'Vindicter — Free Local-First AI Security Workspace'
const DESC      = 'Vindicter is a free, open-source desktop security workspace. Run AI-powered vulnerability scans with Claude, Codex, or Ollama — entirely on your machine. Track findings, inspect dependencies, detect secrets, and master security in the built-in Academy.'
const OG_IMAGE  = `${SITE_URL}/og-image.png`

export default defineNuxtConfig({
  compatibilityDate: '2025-05-12',
  ssr: true,
  nitro: { preset: 'static' },
  modules: [],
  runtimeConfig: {
    // server-only — used by the /download/[token] route to proxy releases
    apiBaseUrl: process.env.NUXT_API_BASE_URL ?? process.env.NUXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1',
    public: {
      apiBaseUrl:       process.env.NUXT_PUBLIC_API_BASE_URL          ?? 'http://localhost:4000/api/v1',
      // Cloudflare test key (always-passes) in dev; require real key in prod
      turnstileSiteKey: process.env.NUXT_PUBLIC_TURNSTILE_SITE_KEY
        ?? (process.env.NODE_ENV !== 'production' ? '1x00000000000000000000AA' : ''),
    },
  },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: TITLE,
      titleTemplate: (chunk) => chunk ? `${chunk} — ${SITE_NAME}` : TITLE,
      link: [
        { rel: 'canonical',        href: SITE_URL },
        { rel: 'icon',             href: '/favicon.ico' },
        { rel: 'icon',             type: 'image/png', sizes: '32x32',  href: '/icon.png' },
        { rel: 'apple-touch-icon', href: '/icon.png' },
        { rel: 'preconnect',       href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect',       href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@300;400;500;600;700&display=swap',
        },
      ],
      meta: [
        { name: 'viewport',           content: 'width=device-width, initial-scale=1' },
        { name: 'robots',             content: 'index, follow, max-snippet:-1, max-image-preview:large' },
        { name: 'googlebot',          content: 'index, follow' },
        { name: 'author',             content: SITE_NAME },
        { name: 'application-name',   content: SITE_NAME },
        { name: 'theme-color',        content: '#1e1f22' },
        { name: 'color-scheme',       content: 'dark' },
        { name: 'generator',          content: 'Nuxt' },
        // Primary description
        { name: 'description',        content: DESC },
        // Keywords for crawlers that still honour them
        {
          name: 'keywords',
          content: 'security scanner, AI security, vulnerability scanner, code review, SAST, local security, free security tool, Claude security, Codex security, security workspace, desktop security app, open source security',
        },
        // Open Graph
        { property: 'og:site_name',   content: SITE_NAME },
        { property: 'og:type',        content: 'website' },
        { property: 'og:url',         content: SITE_URL },
        { property: 'og:title',       content: TITLE },
        { property: 'og:description', content: DESC },
        { property: 'og:image',       content: OG_IMAGE },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height',content: '630' },
        { property: 'og:image:alt',   content: `${SITE_NAME} — AI Security Workspace` },
        { property: 'og:locale',      content: 'en_US' },
        // Twitter / X
        { name: 'twitter:card',        content: 'summary_large_image' },
        { name: 'twitter:site',        content: '@vindicter' },
        { name: 'twitter:creator',     content: '@vindicter' },
        { name: 'twitter:title',       content: TITLE },
        { name: 'twitter:description', content: DESC },
        { name: 'twitter:image',       content: OG_IMAGE },
        { name: 'twitter:image:alt',   content: `${SITE_NAME} — AI Security Workspace` },
      ],
      // JSON-LD structured data for rich results
      script: [
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: SITE_NAME,
            url: SITE_URL,
            description: DESC,
            applicationCategory: 'SecurityApplication',
            operatingSystem: 'Windows 10, Windows 11',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            featureList: [
              'AI-powered vulnerability scanning',
              'Local-first — no data leaves your machine',
              'Claude, Codex, OpenRouter, and Ollama support',
              'Dependency inventory and secret detection',
              'Security Academy with 30 lessons',
            ],
          }),
        },
      ],
    },
  },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: { include: ['ogl'] },
  },
})
