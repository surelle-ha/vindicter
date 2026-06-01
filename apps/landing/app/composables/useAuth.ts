export const useAuth = () => {
  const supabase   = useSupabase()
  const user       = useState<Record<string, unknown> | null>('auth-user',    () => null)
  const isAdmin    = useState<boolean>('auth-is-admin',   () => false)
  const authReady  = useState<boolean>('auth-ready',      () => false)

  async function init() {
    if (import.meta.server) return
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        user.value = session.user as unknown as Record<string, unknown>
        const { data } = await supabase
          .from('user_profiles').select('role').eq('id', session.user.id).single()
        isAdmin.value = data?.role === 'admin'
      } else {
        user.value    = null
        isAdmin.value = false
      }
    } catch {
      user.value    = null
      isAdmin.value = false
    } finally {
      authReady.value = true
    }
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    // Use the returned user directly — avoids a second getSession() round-trip
    if (data.user) {
      user.value = data.user as unknown as Record<string, unknown>
      const { data: profile } = await supabase
        .from('user_profiles').select('role').eq('id', data.user.id).single()
      isAdmin.value = profile?.role === 'admin'
    }
    authReady.value = true
  }

  async function signOut() {
    await supabase.auth.signOut()
    user.value      = null
    isAdmin.value   = false
    authReady.value = false
  }

  return { user, isAdmin, authReady, init, signIn, signOut }
}
