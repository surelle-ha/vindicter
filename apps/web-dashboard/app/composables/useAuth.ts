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
  const api     = useApi()
  const user    = useState<ApiUser | null>('auth-user',     () => null)
  const isAdmin = useState<boolean>('auth-is-admin', () => false)

  async function init() {
    if (import.meta.server) return
    const token = getStoredToken()
    if (!token) return
    try {
      const me = await api.get<ApiUser>('/auth/me')
      user.value    = me
      isAdmin.value = me?.roles?.includes('admin') ?? false
    }
    catch {
      setStoredToken(null)
      user.value    = null
      isAdmin.value = false
    }
  }

  async function signIn(email: string, password: string, opts?: { turnstileToken?: string; clientApp?: string }): Promise<{ needsOnboarding: boolean }> {
    const res = await api.post<{ access_token: string }>('/auth/login', {
      email, password,
      turnstileToken: opts?.turnstileToken,
      clientApp:      opts?.clientApp,
    })
    setStoredToken(res.access_token)
    const me = await api.get<ApiUser>('/auth/me')
    user.value    = me
    isAdmin.value = me?.roles?.includes('admin') ?? false
    return { needsOnboarding: !me?.onboardingComplete }
  }

  async function signUp(email: string, password: string, opts?: { firstName?: string; lastName?: string; turnstileToken?: string }): Promise<void> {
    const res = await api.post<{ access_token: string }>('/auth/register', {
      email, password,
      firstName:      opts?.firstName,
      lastName:       opts?.lastName,
      turnstileToken: opts?.turnstileToken,
    })
    setStoredToken(res.access_token)
    const me = await api.get<ApiUser>('/auth/me')
    user.value    = me
    isAdmin.value = me?.roles?.includes('admin') ?? false
  }

  async function signOut() {
    setStoredToken(null)
    user.value    = null
    isAdmin.value = false
  }

  async function updateProfile(patch: {
    firstName?: string
    lastName?: string
    jobRole?: string
    experienceLevel?: string
    onboardingComplete?: boolean
  }) {
    const updated = await api.patch<ApiUser>('/auth/me', patch)
    if (user.value) Object.assign(user.value, updated)
    return updated
  }

  return { user, isAdmin, init, signIn, signUp, signOut, updateProfile }
}
