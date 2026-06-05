const TOKEN_KEY = 'auth-token'

export function useApi() {
  const { public: { apiBaseUrl } } = useRuntimeConfig()

  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }

    if (import.meta.client) {
      const token = localStorage.getItem(TOKEN_KEY)
      if (token) headers['Authorization'] = `Bearer ${token}`
    }

    const res = await fetch(`${apiBaseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

    if (!res.ok) {
      const err = await res.json().catch(() => null) as any
      throw new Error(err?.message ?? err?.error?.message ?? `API error ${res.status}`)
    }

    const json = await res.json().catch(() => null) as any
    // Unwrap standard response envelope { success, data }
    return (json?.data !== undefined ? json.data : json) as T
  }

  return {
    get:   <T>(path: string)                  => request<T>('GET',    path),
    post:  <T>(path: string, body?: unknown)  => request<T>('POST',   path, body),
    put:   <T>(path: string, body?: unknown)  => request<T>('PUT',    path, body),
    patch: <T>(path: string, body?: unknown)  => request<T>('PATCH',  path, body),
    del:   <T>(path: string)                  => request<T>('DELETE', path),
  }
}

export function getStoredToken(): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string | null) {
  if (typeof localStorage === 'undefined') return
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}
