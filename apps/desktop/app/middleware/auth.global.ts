export default defineNuxtRouteMiddleware((to) => {
  const publicRoutes = ['/login', '/onboarding']
  if (publicRoutes.includes(to.path)) return

  const auth = useAuthStore()
  if (!auth.isApiAuthenticated) {
    const app = useAppStore()
    app.launched = false
    return abortNavigation()
  }
})
