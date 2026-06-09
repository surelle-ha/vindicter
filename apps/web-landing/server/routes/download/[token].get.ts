const MANIFEST = 'https://pub-1dcbd264e42f475e9f95858cc16ab6b7.r2.dev/releases/latest/update.json'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) throw createError({ statusCode: 400, message: 'Missing token' })

  const { apiBaseUrl } = useRuntimeConfig(event)

  // Validate token against API — rejects expired / unknown tokens
  try {
    const validation = await fetch(`${apiBaseUrl}/newsletter/signups/token/${token}`)
    if (!validation.ok) throw new Error('invalid')
    const body = await validation.json().catch(() => null) as any
    const data = body?.data ?? body
    if (!data?.valid) throw new Error('invalid')
  } catch {
    throw createError({ statusCode: 403, message: 'Invalid or expired download token' })
  }

  // Resolve real download URL server-side — never exposed to the browser
  try {
    const manifest = await fetch(MANIFEST)
    if (!manifest.ok) throw new Error('manifest unavailable')
    const data = await manifest.json() as {
      platforms: Record<string, { url: string }>
    }
    const url = data.platforms?.['windows-x86_64']?.url
    if (!url) throw new Error('no windows url')
    return sendRedirect(event, url, 302)
  } catch {
    throw createError({ statusCode: 503, message: 'Download temporarily unavailable. Please try again shortly.' })
  }
})
