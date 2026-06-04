export default defineEventHandler(() => {
  return new Response(
    `User-agent: *
Allow: /
Disallow: /auth/

Sitemap: https://vindicter.xyz/sitemap.xml
`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  )
})
