export async function runDefendCoreChat(messages: { role: 'system' | 'user' | 'assistant'; content: string }[]): Promise<string> {
  const systemMsg = messages.find(m => m.role === 'system')?.content ?? ''
  const history = messages
    .filter(m => m.role !== 'system')
    .map(m => `${m.role === 'user' ? 'Student' : 'Professor'}: ${m.content}`)
    .join('\n')
  const combined = systemMsg ? `${systemMsg}\n\n${history}` : history
  return runDefendCoreQuery(combined)
}

export async function runDefendCoreScan(prompt: string): Promise<string> {
  const app = useAppStore()
  const base  = app.defendCore.apiUrl.replace(/\/$/, '')
  const token = app.defendCore.apiToken.trim()

  if (!token) throw new Error('DefendCore API token is not configured. Add it in AI Models settings.')

  const res = await fetch(`${base}/api/v1/defendcore/scan`, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key':    token,
    },
    body: JSON.stringify({ prompt }),
  })

  if (!res.ok) {
    const json = await res.json().catch(() => null) as any
    const payload = json?.data ?? json
    throw new Error(payload?.message ?? `DefendCore error ${res.status}`)
  }

  const json = await res.json() as any
  const data = json?.data ?? json
  return (data?.result as string) ?? ''
}

export async function runDefendCoreQuery(query: string): Promise<string> {
  const app = useAppStore()
  const base  = app.defendCore.apiUrl.replace(/\/$/, '')
  const token = app.defendCore.apiToken.trim()

  if (!token) throw new Error('DefendCore API token is not configured. Add it in AI Models settings.')

  const res = await fetch(`${base}/api/v1/defendcore/query`, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key':    token,
    },
    body: JSON.stringify({ query }),
  })

  if (!res.ok) {
    const json = await res.json().catch(() => null) as any
    const payload = json?.data ?? json
    throw new Error(payload?.message ?? `DefendCore error ${res.status}`)
  }

  const json = await res.json() as any
  const data = json?.data ?? json
  let result = (data?.answer as string) ?? ''
  const sources: string[] = data?.sources ?? []
  if (sources.length) result += `\n\nSources: ${sources.join(', ')}`
  return result
}

export async function checkDefendCoreStatus(): Promise<{ available: boolean; message: string }> {
  const app = useAppStore()
  const base = app.defendCore.apiUrl.replace(/\/$/, '')
  try {
    const res = await fetch(`${base}/api/v1/defendcore/status`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return { available: false, message: 'DefendCore service is unreachable.' }
    const json = await res.json() as any
    const payload = json?.data ?? json
    return {
      available: Boolean(payload?.available),
      message:   payload?.message ?? '',
    }
  }
  catch {
    return { available: false, message: 'DefendCore service is unreachable.' }
  }
}
