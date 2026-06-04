import { XMLParser } from 'fast-xml-parser'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const url = String(query.url ?? '')

  if (!url || !/^https?:\/\//i.test(url)) {
    return sendError(event, createError({ statusCode: 400, statusMessage: 'Missing or invalid url parameter' }))
  }

  try {
    const raw = await $fetch<string>(url, {
      responseType: 'text',
      headers: { 'User-Agent': 'Vindicter/1.0 RSS Reader (+https://vindicter.xyz)', Accept: 'application/rss+xml, application/xml, text/xml, */*' },
      timeout: 8000,
    })

    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })
    const parsed = parser.parse(raw)
    const channel = parsed?.rss?.channel ?? parsed?.feed ?? null

    if (!channel) return { items: [] }

    // RSS 2.0
    const rawItems: any[] = Array.isArray(channel.item) ? channel.item : channel.item ? [channel.item] : []
    // Atom
    const atomItems: any[] = Array.isArray(channel.entry) ? channel.entry : channel.entry ? [channel.entry] : []

    const items = [...rawItems, ...atomItems].map((item: any) => ({
      title:       String(item.title?.['#text'] ?? item.title ?? '').trim(),
      link:        String(item.link?.['@_href'] ?? item.link ?? item.guid?.['#text'] ?? item.guid ?? '').trim(),
      description: String(item.description ?? item.summary?.['#text'] ?? item.summary ?? item.content?.['#text'] ?? '').replace(/<[^>]*>/g, '').slice(0, 500).trim(),
      pubDate:     item.pubDate ?? item.published ?? item.updated ?? null,
    })).filter(i => i.title && i.link).slice(0, 30)

    return { items }
  }
  catch (e: any) {
    return sendError(event, createError({ statusCode: 502, statusMessage: `Failed to fetch feed: ${e?.message ?? 'unknown error'}` }))
  }
})
