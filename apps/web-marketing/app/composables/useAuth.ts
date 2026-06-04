export const useAuth = () => {
  const api = useApi()
  const user = useState<Record<string, unknown> | null>('auth-user', () => null)
  const isInternal = useState<boolean>('auth-is-internal', () => false)
  const authReady = useState<boolean>('auth-ready', () => false)

  function canUseMarketing(profile: Record<string, unknown> | null) {
    const roles = Array.isArray(profile?.roles) ? profile.roles : []
    const accesses = Array.isArray(profile?.accesses) ? profile.accesses : []
    return roles.includes('admin') || accesses.includes('marketing.read')
  }

  async function init() {
    if (import.meta.server) return
    try {
      if (!api.token.value) {
        user.value = null
        isInternal.value = false
        return
      }
      const profile = await api.request<Record<string, unknown>>('/auth/me')
      user.value = profile
      isInternal.value = canUseMarketing(profile)
    } catch {
      api.setToken(null)
      user.value = null
      isInternal.value = false
    } finally {
      authReady.value = true
    }
  }

  async function signIn(email: string, password: string, turnstileToken?: string) {
    const data = await api.request<{ access_token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, turnstileToken, clientApp: 'web-marketing' }),
    })
    api.setToken(data.access_token)
    const profile = await api.request<Record<string, unknown>>('/auth/me')
    user.value = profile
    isInternal.value = canUseMarketing(profile)
    authReady.value = true
  }

  async function signOut() {
    api.setToken(null)
    user.value = null
    isInternal.value = false
    authReady.value = false
  }

  return { user, isInternal, authReady, init, signIn, signOut }
}
