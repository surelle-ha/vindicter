<script setup lang="ts">
import {
  Newspaper, Key, User,
  PanelLeftClose, LogOut, ChevronRight, ChevronDown,
  LifeBuoy, GraduationCap,
} from 'lucide-vue-next'

const route  = useRoute()
const router = useRouter()
const { user, isAdmin, init, signOut } = useAuth()

const collapsed    = useState('sb-collapsed', () => false)
const dashState    = useState<'checking' | 'ready'>('dash-state', () => 'checking')
const authDone     = useState('dash-auth-done', () => false)
const userMenuOpen = ref(false)
const userMenuRef  = ref<HTMLElement | null>(null)

const outsideClickHandler = (e: MouseEvent) => {
  if (userMenuRef.value && !userMenuRef.value.contains(e.target as Node)) {
    userMenuOpen.value = false
  }
}

onMounted(async () => {
  if (authDone.value) { dashState.value = 'ready'; return }
  await init()
  if (!user.value) {
    await router.push(`/auth/login?redirect=${encodeURIComponent(route.fullPath)}`)
    return
  }
  dashState.value = 'ready'
  authDone.value  = true
  document.addEventListener('click', outsideClickHandler)
})

onUnmounted(() => document.removeEventListener('click', outsideClickHandler))

async function handleSignOut() {
  userMenuOpen.value = false
  await signOut()
  authDone.value  = false
  dashState.value = 'checking'
  await router.push('/auth/login')
}

const nav = [
  { label: 'News',    to: '/news',    icon: Newspaper },
  { label: 'Academy', to: '/academy', icon: GraduationCap },
  { label: 'Support', to: '/support', icon: LifeBuoy },
]

const developerNav = [
  { label: 'API',     to: '/api',     icon: Key },
]

function active(to: string) {
  return route.path === to || (to !== '/news' && route.path.startsWith(to))
}

const displayName = computed(() => {
  if (!user.value) return 'User'
  const u = user.value as Record<string, unknown>
  const meta = u.user_metadata as Record<string, unknown> | undefined
  return (meta?.display_name as string) ?? (u.email as string) ?? 'User'
})

const userEmail = computed(() => {
  if (!user.value) return ''
  return ((user.value as any).email as string) ?? ''
})

const initials = computed(() =>
  displayName.value.split(' ').map((n) => n[0] ?? '').join('').slice(0, 2).toUpperCase()
)

const pageTitle = computed(() => {
  const p = route.path
  if (p === '/news')               return 'News'
  if (p === '/academy' || p.startsWith('/academy/')) return 'Academy'
  if (p === '/api')           return 'API & Keys'
  if (p === '/support')       return 'Support'
  if (p === '/profile')       return 'Profile'
  return 'Dashboard'
})

const currentYear = new Date().getFullYear()

const landingUrl = computed(() => {
  if (import.meta.client && window.location.hostname === 'localhost') return 'http://localhost:3002'
  return 'https://vindicter.xyz'
})
</script>

<template>
  <div class="h-screen flex flex-col overflow-hidden" style="background:#111215;color:white;font-family:Inter,system-ui,sans-serif;">

    <!-- Background orbs -->
    <div class="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
      <div class="absolute inset-0" style="background:#111215;" />
      <div style="position:absolute;width:600px;height:600px;border-radius:50%;filter:blur(130px);background:radial-gradient(circle,#3730a3 0%,transparent 70%);top:-220px;left:-120px;opacity:0.08;" />
      <div style="position:absolute;width:400px;height:400px;border-radius:50%;filter:blur(130px);background:radial-gradient(circle,#4c1d95 0%,transparent 70%);bottom:-120px;right:-80px;opacity:0.06;" />
    </div>

    <!-- Auth checking -->
    <div v-if="dashState === 'checking'" class="flex flex-1 flex-col items-center justify-center gap-8">
      <!-- Progress bar at top -->
      <div class="fixed inset-x-0 top-0 h-0.5 overflow-hidden" style="background:rgba(255,255,255,0.06);">
        <div class="h-full animate-loading-bar" style="background:rgba(139,92,246,0.75);width:60%;" />
      </div>
      <div class="flex flex-col items-center gap-4">
        <img src="/icon.png" alt="" class="h-12 w-12 opacity-50" style="animation:pulse 2s ease-in-out infinite;" />
        <div class="flex flex-col items-center gap-2">
          <p class="text-[13px] font-medium" style="color:rgba(255,255,255,0.60);">Vindicter</p>
          <p class="text-[11px]" style="color:rgba(255,255,255,0.25);">Verifying your session…</p>
        </div>
        <!-- Dot progress -->
        <div class="flex items-center gap-1.5 mt-2">
          <div class="h-1 w-1 rounded-full animate-bounce" style="background:rgba(139,92,246,0.60);animation-delay:0ms;" />
          <div class="h-1 w-1 rounded-full animate-bounce" style="background:rgba(139,92,246,0.60);animation-delay:150ms;" />
          <div class="h-1 w-1 rounded-full animate-bounce" style="background:rgba(139,92,246,0.60);animation-delay:300ms;" />
        </div>
      </div>
    </div>

    <!-- Dashboard shell -->
    <div v-else-if="dashState === 'ready'" class="relative z-10 flex flex-1 overflow-hidden">

      <!-- Sidebar -->
      <aside
        class="shrink-0 flex flex-col overflow-hidden transition-[width] duration-200 ease-in-out"
        :class="collapsed ? 'w-12' : 'w-52'"
        style="background:rgba(17,18,21,0.98);border-right:1px solid rgba(255,255,255,0.07);"
      >
        <!-- Brand + collapse -->
        <div
          class="h-11 px-3 flex items-center"
          :class="collapsed ? 'justify-center' : 'gap-2'"
          style="border-bottom:1px solid rgba(255,255,255,0.07);"
        >
          <template v-if="!collapsed">
            <img src="/icon.png" alt="" class="size-6 shrink-0 rounded-md" />
            <span class="font-display flex-1 text-sm font-semibold truncate" style="color:rgba(255,255,255,0.90);">Vindicter</span>
          </template>
          <button
            class="size-6 flex items-center justify-center rounded transition-colors hover:bg-white/[0.06] cursor-pointer"
            style="color:rgba(255,255,255,0.35);"
            :title="collapsed ? 'Expand' : 'Collapse'"
            @click="collapsed = !collapsed"
          >
            <PanelLeftClose v-if="!collapsed" class="size-3.5" />
            <img v-else src="/icon.png" alt="" class="size-6 rounded-md" />
          </button>
        </div>

        <!-- Nav -->
        <nav class="flex-1 p-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
          <p v-if="!collapsed" class="px-2 mb-1 text-[10px] font-semibold uppercase tracking-[0.12em]" style="color:rgba(255,255,255,0.18);">Menu</p>
          <div v-else class="h-px mx-1 mb-2" style="background:rgba(255,255,255,0.07);" />

          <NuxtLink
            v-for="item in nav"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer"
            :class="[
              collapsed ? 'justify-center' : '',
              active(item.to) ? 'bg-indigo-600/15 text-indigo-400' : 'text-white/45 hover:text-white/80 hover:bg-white/[0.05]',
            ]"
            :title="collapsed ? item.label : undefined"
          >
            <component :is="item.icon" class="size-3.5 shrink-0" />
            <span v-if="!collapsed">{{ item.label }}</span>
          </NuxtLink>

          <!-- Developer section -->
          <div class="h-px mx-1 my-2" style="background:rgba(255,255,255,0.07);" />
          <p v-if="!collapsed" class="px-2 mb-1 text-[10px] font-semibold uppercase tracking-[0.12em]" style="color:rgba(99,102,241,0.50);">Developer</p>
          <NuxtLink
            v-for="item in developerNav"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer"
            :class="[
              collapsed ? 'justify-center' : '',
              active(item.to) ? 'bg-indigo-600/15 text-indigo-400' : 'text-white/45 hover:text-white/80 hover:bg-white/[0.05]',
            ]"
            :title="collapsed ? item.label : undefined"
          >
            <component :is="item.icon" class="size-3.5 shrink-0" />
            <span v-if="!collapsed">{{ item.label }}</span>
          </NuxtLink>

        </nav>

        <!-- ── Sidebar footer ───────────────────────────────────────────── -->
        <div class="shrink-0 p-2" style="border-top:1px solid rgba(255,255,255,0.06);">
          <!-- Expanded: version badge + tagline -->
          <template v-if="!collapsed">
            <div class="rounded-lg px-3 py-2.5" style="background:rgba(139,92,246,0.06);border:1px solid rgba(139,92,246,0.12);">
              <div class="flex items-center justify-between gap-2 mb-1">
                <span class="text-[10px] font-bold uppercase tracking-wider" style="color:rgba(139,92,246,0.70);">Vindicter</span>
                <span class="text-[9px] font-semibold rounded-full px-1.5 py-0.5" style="background:rgba(139,92,246,0.15);color:rgba(167,139,250,0.80);">Beta</span>
              </div>
              <p class="text-[10px] leading-relaxed" style="color:rgba(255,255,255,0.22);">Local-first AI security platform. Your data stays on your device.</p>
              <div class="flex items-center gap-1 mt-2">
                <span class="h-1.5 w-1.5 rounded-full animate-pulse" style="background:rgba(35,165,90,0.80);" />
                <span class="text-[9px]" style="color:rgba(35,165,90,0.65);">All systems operational</span>
              </div>
            </div>
          </template>
          <!-- Collapsed: just a pulsing status dot -->
          <template v-else>
            <div class="flex items-center justify-center py-1">
              <span class="h-2 w-2 rounded-full animate-pulse" style="background:rgba(35,165,90,0.70);" title="All systems operational" />
            </div>
          </template>
        </div>
      </aside>

      <!-- Main area -->
      <div class="flex flex-1 flex-col overflow-hidden">

        <!-- Topbar -->
        <header
          class="h-11 shrink-0 flex items-center justify-between px-5"
          style="border-bottom:1px solid rgba(255,255,255,0.07);background:rgba(17,18,21,0.95);"
        >
          <!-- Breadcrumb -->
          <div class="flex items-center gap-1.5 text-[11px]" style="color:rgba(255,255,255,0.28);">
            <span style="color:rgba(139,92,246,0.50);">dashboard</span>
            <ChevronRight class="size-3 shrink-0" />
            <span class="font-semibold" style="color:rgba(255,255,255,0.70);">{{ pageTitle }}</span>
          </div>

          <!-- User menu -->
          <div ref="userMenuRef" class="relative">
            <button
              class="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 transition-colors hover:bg-white/[0.05] cursor-pointer"
              @click.stop="userMenuOpen = !userMenuOpen"
            >
              <!-- Avatar -->
              <div
                class="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                :style="isAdmin
                  ? 'background:rgba(139,92,246,0.20);border:1.5px solid rgba(139,92,246,0.40);color:rgba(167,139,250,0.95);'
                  : 'background:rgba(255,255,255,0.08);border:1.5px solid rgba(255,255,255,0.14);color:rgba(255,255,255,0.60);'"
              >
                {{ initials }}
              </div>
              <div class="hidden sm:block text-left">
                <p class="text-[11px] leading-none truncate max-w-[140px]" style="color:rgba(255,255,255,0.80);">{{ displayName }}</p>
                <p class="text-[9px] mt-0.5 tracking-wide" style="color:rgba(255,255,255,0.22);">You're logged in</p>
              </div>
              <ChevronDown class="size-3 shrink-0 transition-transform" :class="userMenuOpen ? 'rotate-180' : ''" style="color:rgba(255,255,255,0.22);" />
            </button>

            <!-- Dropdown -->
            <Transition
              enter-active-class="transition-all duration-150 ease-out"
              enter-from-class="opacity-0 scale-95 -translate-y-1"
              enter-to-class="opacity-100 scale-100 translate-y-0"
              leave-active-class="transition-all duration-100 ease-in"
              leave-from-class="opacity-100 scale-100 translate-y-0"
              leave-to-class="opacity-0 scale-95 -translate-y-1"
            >
              <div
                v-if="userMenuOpen"
                class="absolute right-0 top-full mt-2 w-52 rounded-xl overflow-hidden z-50"
                style="background:rgba(22,23,28,0.99);border:1px solid rgba(255,255,255,0.10);box-shadow:0 20px 60px rgba(0,0,0,0.6);"
              >
                <!-- User info header -->
                <div class="px-3.5 py-3" style="border-bottom:1px solid rgba(255,255,255,0.07);">
                  <p class="text-[12px] font-semibold truncate" style="color:rgba(255,255,255,0.80);">{{ displayName }}</p>
                  <p class="text-[10px] mt-0.5 truncate" style="color:rgba(255,255,255,0.30);">{{ userEmail }}</p>
                  <span
                    class="mt-1.5 inline-block rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                    :style="isAdmin
                      ? 'background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.25);color:rgba(167,139,250,0.90);'
                      : 'background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.10);color:rgba(255,255,255,0.40);'"
                  >
                    {{ isAdmin ? 'Admin' : 'Member' }}
                  </span>
                </div>

                <!-- Links -->
                <div class="p-1">
                  <NuxtLink
                    to="/profile"
                    class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] transition-colors hover:bg-white/[0.05] cursor-pointer"
                    style="color:rgba(255,255,255,0.60);"
                    @click="userMenuOpen = false"
                  >
                    <User class="h-3.5 w-3.5 shrink-0" style="color:rgba(255,255,255,0.30);" />
                    Profile settings
                  </NuxtLink>
                  <div class="my-1 mx-1 h-px" style="background:rgba(255,255,255,0.07);" />
                  <button
                    class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] transition-colors hover:bg-red-500/[0.08] cursor-pointer"
                    style="color:rgba(248,113,113,0.65);"
                    @click="handleSignOut"
                  >
                    <LogOut class="h-3.5 w-3.5 shrink-0" />
                    Sign out
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </header>

        <!-- Page content -->
        <main class="flex-1 overflow-y-auto p-5" style="scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.08) transparent;">
          <slot />
        </main>

        <!-- Footer -->
        <footer class="shrink-0 flex items-center justify-between px-5 py-2" style="border-top:1px solid rgba(255,255,255,0.05);">
          <p class="text-[10px]" style="color:rgba(255,255,255,0.15);">&copy; {{ currentYear }} Vindicter — local-first security platform.</p>
          <div class="flex items-center gap-4">
            <a :href="`${landingUrl}/docs`" target="_blank" class="text-[10px] transition-colors hover:text-white/40 cursor-pointer" style="color:rgba(255,255,255,0.18);">Docs</a>
            <a :href="`${landingUrl}/support`" target="_blank" class="text-[10px] transition-colors hover:text-white/40 cursor-pointer" style="color:rgba(255,255,255,0.18);">Support</a>
            <a :href="`${landingUrl}/privacy`" target="_blank" class="text-[10px] transition-colors hover:text-white/40 cursor-pointer" style="color:rgba(255,255,255,0.18);">Privacy</a>
          </div>
        </footer>
      </div>
    </div>
  </div>
</template>
