import { getStoredToken, setStoredToken } from './useApi'

interface ApiUser {
  id: string
  email: string
  displayName: string | null
  onboardingComplete: boolean
  roles: string[]
}

export const useAuth = () => {
  const api       = useApi()
  const user      = useState<ApiUser | null>('auth-user',    () => null)
  const isAdmin   = useState<boolean>('auth-is-admin', () => false)
  const authReady = useState<boolean>('auth-ready',    () => false)

  async function init() {
    if (import.meta.server) return
    const token = getStoredToken()
    if (!token) { authReady.value = true; return }
    try {
      const me = await api.get<ApiUser>('/auth/me')
      user.value    = me
      isAdmin.value = me?.roles?.includes('admin') ?? false
    } catch {
      setStoredToken(null)
      user.value    = null
      isAdmin.value = false
    } finally {
      authReady.value = true
    }
  }

  async function signIn(email: string, password: string, opts?: { turnstileToken?: string }) {
    const res = await api.post<{ access_token: string }>('/auth/login', {
      email, password, turnstileToken: opts?.turnstileToken,
    })
    setStoredToken(res.access_token)
    const me = await api.get<ApiUser>('/auth/me')
    user.value      = me
    isAdmin.value   = me?.roles?.includes('admin') ?? false
    authReady.value = true
  }

  async function signOut() {
    setStoredToken(null)
    user.value      = null
    isAdmin.value   = false
    authReady.value = false
  }

  return { user, isAdmin, authReady, init, signIn, signOut }
}
