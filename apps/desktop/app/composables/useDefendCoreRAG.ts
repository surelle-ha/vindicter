const BASE = import.meta.env.DEV ? 'http://localhost:4000' : 'https://api.vindicter.xyz'

export async function checkDefendCoreAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/api/v1/defendcore/status`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return false
    const json = await res.json() as any
    const payload = json?.data ?? json
    return Boolean(payload?.available)
  }
  catch { return false }
}

export async function fetchRAGContext(query: string, limit = 5): Promise<string> {
  try {
    const res = await fetch(`${BASE}/api/v1/defendcore/retrieve`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ query, limit }),
      signal:  AbortSignal.timeout(10_000),
    })
    if (!res.ok) return ''
    const json = await res.json() as any
    const payload = json?.data ?? json
    const chunks: string[] = payload?.chunks ?? []
    const sources: string[] = payload?.sources ?? []
    if (!chunks.length) return ''
    const header = sources.length
      ? `Security knowledge base context (sources: ${sources.join(', ')}):`
      : 'Security knowledge base context:'
    return `${header}\n\n${chunks.join('\n\n---\n\n')}`
  }
  catch { return '' }
}
