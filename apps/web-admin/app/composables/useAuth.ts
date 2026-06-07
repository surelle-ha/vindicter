import { getStoredToken, setStoredToken } from './useApi'

interface ApiUser {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  jobRole: string | null
  experienceLevel: string | null
  onboardingComplete: boolean
  createdAt: string
  roles: string[]
  accesses: string[]
}

export const useAuth = () => {
  const api      = useApi()
  const user     = useState<ApiUser | null>('auth-user',        () => null)
  const isAdmin  = useState<boolean>('auth-is-admin',    () => false)
  // internal = admin OR has marketing.read access
  const isInternal = useState<boolean>('auth-is-internal', () => false)

  function checkFlags(me: ApiUser | null) {
    isAdmin.value    = me?.roles?.includes('admin') ?? false
    isInternal.value = (me?.roles?.includes('admin') || me?.accesses?.includes('marketing.read')) ?? false
  }

  async function init() {
    if (import.meta.server) return
    const token = getStoredToken()
    if (!token) return
    try {
      const me = await api.get<ApiUser>('/auth/me')
      user.value = me
      checkFlags(me)
    } catch {
      setStoredToken(null)
      user.value       = null
      isAdmin.value    = false
      isInternal.value = false
    }
  }

  async function signIn(email: string, password: string, turnstileToken?: string) {
    const res = await api.post<{ access_token: string }>('/auth/login', {
      email,
      password,
      turnstileToken,
      clientApp: 'web-admin',
    })
    setStoredToken(res.access_token)
    const me = await api.get<ApiUser>('/auth/me')
    user.value = me
    checkFlags(me)
    return me
  }

  async function signOut() {
    setStoredToken(null)
    user.value       = null
    isAdmin.value    = false
    isInternal.value = false
  }

  return { user, isAdmin, isInternal, init, signIn, signOut }
}
