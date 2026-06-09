const SITE = 'https://vindicter.xyz'

const STATIC_ROUTES = [
  { path: '/',              priority: '1.0', changefreq: 'weekly'  },
  { path: '/standard-beta', priority: '0.8', changefreq: 'monthly' },
  { path: '/special-beta',  priority: '0.7', changefreq: 'monthly' },
  { path: '/download',      priority: '0.8', changefreq: 'weekly'  },
  { path: '/privacy',       priority: '0.4', changefreq: 'yearly'  },
  { path: '/terms',         priority: '0.4', changefreq: 'yearly'  },
  { path: '/support',       priority: '0.6', changefreq: 'monthly' },
  { path: '/docs',          priority: '0.7', changefreq: 'monthly' },
  { path: '/faq',           priority: '0.6', changefreq: 'monthly' },
]

export default defineEventHandler(() => {
  const today = new Date().toISOString().split('T')[0]

  const urls = STATIC_ROUTES.map(route => `
  <url>
    <loc>${SITE}${route.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  })
})
