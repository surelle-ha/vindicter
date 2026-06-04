type ApiEnvelope<T> = {
  success?: boolean
  data?: T
  error?: { message?: string }
}

export const useApi = () => {
  const { public: { apiBaseUrl } } = useRuntimeConfig()
  const token = useState<string | null>('api-token', () => null)

  if (import.meta.client && token.value === null) {
    token.value = localStorage.getItem('marketing-api-token')
  }

  async function request<T>(path: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers)
    headers.set('Content-Type', 'application/json')
    if (token.value) headers.set('Authorization', `Bearer ${token.value}`)

    const response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers })
    const payload = await response.json().catch(() => null) as ApiEnvelope<T> | T | null

    if (!response.ok) {
      const message = payload && typeof payload === 'object' && 'error' in payload
        ? (payload as ApiEnvelope<T>).error?.message
        : null
      throw new Error(message || `API request failed with status ${response.status}`)
    }

    if (payload && typeof payload === 'object' && 'data' in payload) {
      return (payload as ApiEnvelope<T>).data as T
    }

    return payload as T
  }

  function setToken(value: string | null) {
    token.value = value
    if (!import.meta.client) return
    if (value) localStorage.setItem('marketing-api-token', value)
    else localStorage.removeItem('marketing-api-token')
  }

  return { request, token, setToken }
}
