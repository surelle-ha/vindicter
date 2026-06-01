<script setup lang="ts">
import {
  LayoutDashboard, ShieldCheck, Newspaper,
  PanelLeftClose, LogOut, Loader2, ChevronRight,
  User, Users, MessageCircle, Star, ChevronDown,
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

onUnmounted(() => {
  document.removeEventListener('click', outsideClickHandler)
})

async function handleSignOut() {
  userMenuOpen.value = false
  await signOut()
  authDone.value  = false
  dashState.value = 'checking'
  await router.push('/auth/login')
}

const nav = [
  { label: 'Overview',   to: '/dashboard',              icon: LayoutDashboard },
  { label: 'DefendCore', to: '/dashboard/subscription', icon: ShieldCheck },
  { label: 'Updates',    to: '/dashboard/updates',      icon: Newspaper },
]

const adminNav = [
  { label: 'Users',         to: '/dashboard/admin/users',   icon: Users },
  { label: 'Tickets',       to: '/dashboard/admin/tickets', icon: MessageCircle },
  { label: 'Beta Requests', to: '/dashboard/admin/beta',    icon: Star },
]

function active(to: string) {
  return to === '/dashboard'
    ? route.path === '/dashboard'
    : route.path.startsWith(to)
}

const displayName = computed(() => {
  if (!user.value) return 'User'
  const u = user.value as Record<string, unknown>
  const meta = u.user_metadata as Record<string, unknown> | undefined
  return (meta?.display_name as string) ?? (u.email as string) ?? 'User'
})

const initials = computed(() =>
  displayName.value.split(' ').map((n) => n[0] ?? '').join('').slice(0, 2).toUpperCase()
)

const pageTitle = computed(() => {
  const p = route.path
  if (p === '/dashboard') return 'Overview'
  if (p.startsWith('/dashboard/subscription')) return 'DefendCore'
  if (p.startsWith('/dashboard/updates')) return 'Updates'
  if (p.startsWith('/dashboard/profile')) return 'Profile'
  if (p.startsWith('/dashboard/admin/users')) return 'User Management'
  if (p.startsWith('/dashboard/admin/tickets')) return 'Support Tickets'
  if (p.startsWith('/dashboard/admin/beta')) return 'Beta Requests'
  return 'Dashboard'
})

const currentYear = new Date().getFullYear()
</script>

<template>
  <div
    class="h-screen flex flex-col overflow-hidden"
    style="background:#111215;color:white;font-family:Inter,system-ui,sans-serif;"
  >

    <!-- Orb background -->
    <div class="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
      <div class="absolute inset-0" style="background:#111215;" />
      <div style="position:absolute;width:700px;height:700px;border-radius:50%;filter:blur(130px);background:radial-gradient(circle,#3730a3 0%,transparent 70%);top:-250px;left:-150px;opacity:0.07;" />
      <div style="position:absolute;width:500px;height:500px;border-radius:50%;filter:blur(130px);background:radial-gradient(circle,#4c1d95 0%,transparent 70%);bottom:-150px;right:-100px;opacity:0.05;" />
    </div>

    <!-- Checking -->
    <div v-if="dashState === 'checking'" class="flex flex-1 items-center justify-center">
      <div class="flex flex-col items-center gap-3">
        <img src="/icon.png" alt="" class="h-10 w-10 opacity-40" />
        <div class="flex items-center gap-2 text-[12px]" style="color:rgba(255,255,255,0.30);">
          <Loader2 class="h-3.5 w-3.5 animate-spin" />
          Loading…
        </div>
      </div>
    </div>

    <!-- Dashboard shell -->
    <div v-else-if="dashState === 'ready'" class="relative z-10 flex flex-1 overflow-hidden">

      <!-- Sidebar -->
      <aside
        class="shrink-0 flex flex-col overflow-hidden transition-[width] duration-200 ease-in-out"
        :class="collapsed ? 'w-12' : 'w-52'"
        style="background:rgba(20,21,26,0.97);border-right:1px solid rgba(255,255,255,0.07);"
      >
        <!-- Brand + collapse toggle -->
        <div
          class="h-11 px-3 flex items-center"
          :class="collapsed ? 'justify-center' : 'gap-2'"
          style="border-bottom:1px solid rgba(255,255,255,0.07);"
        >
          <template v-if="!collapsed">
            <img src="/icon.png" alt="" class="size-6 shrink-0 rounded-md object-cover" />
            <span class="font-display flex-1 text-sm font-semibold truncate" style="color:rgba(255,255,255,0.90);">Vindicta</span>
          </template>
          <button
            class="size-6 flex items-center justify-center rounded transition-colors hover:bg-white/[0.06] cursor-pointer"
            style="color:rgba(255,255,255,0.40);"
            :title="collapsed ? 'Expand' : 'Collapse'"
            @click="collapsed = !collapsed"
          >
            <PanelLeftClose v-if="!collapsed" class="size-3.5" />
            <img v-else src="/icon.png" alt="" class="size-6 rounded-md object-cover" />
          </button>
        </div>

        <!-- Nav items -->
        <nav class="flex-1 p-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
          <p
            v-if="!collapsed"
            class="px-2 mb-1 text-[10px] font-semibold uppercase tracking-[0.12em]"
            style="color:rgba(255,255,255,0.20);"
          >
            Menu
          </p>
          <div v-else class="h-px mx-1 mb-2" style="background:rgba(255,255,255,0.08);" />

          <NuxtLink
            v-for="item in nav"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer"
            :class="[
              collapsed ? 'justify-center' : '',
              active(item.to)
                ? 'bg-indigo-600/15 text-indigo-400'
                : 'text-white/45 hover:text-white/80 hover:bg-white/[0.05]',
            ]"
            :title="collapsed ? item.label : undefined"
          >
            <component :is="item.icon" class="size-3.5 shrink-0" />
            <span v-if="!collapsed">{{ item.label }}</span>
          </NuxtLink>

          <!-- Admin nav section -->
          <template v-if="isAdmin">
            <div class="h-px mx-1 my-2" style="background:rgba(255,255,255,0.07);" />
            <p
              v-if="!collapsed"
              class="px-2 mb-1 text-[10px] font-semibold uppercase tracking-[0.12em]"
              style="color:rgba(248,113,113,0.35);"
            >
              Admin
            </p>
            <NuxtLink
              v-for="item in adminNav"
              :key="item.to"
              :to="item.to"
              class="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer"
              :class="[
                collapsed ? 'justify-center' : '',
                active(item.to)
                  ? 'bg-red-500/10 text-red-400'
                  : 'text-white/35 hover:text-white/70 hover:bg-white/[0.04]',
              ]"
              :title="collapsed ? item.label : undefined"
            >
              <component :is="item.icon" class="size-3.5 shrink-0" />
              <span v-if="!collapsed">{{ item.label }}</span>
            </NuxtLink>
          </template>
        </nav>
      </aside>

      <!-- Right column: topbar + content + footer -->
      <div class="flex flex-1 flex-col overflow-hidden">

        <!-- Topbar -->
        <header
          class="h-11 shrink-0 flex items-center justify-between px-5"
          style="border-bottom:1px solid rgba(255,255,255,0.07);background:rgba(17,18,21,0.90);"
        >
          <!-- Breadcrumb -->
          <div class="flex items-center gap-1.5 text-[11px]" style="color:rgba(255,255,255,0.30);">
            <span>Dashboard</span>
            <ChevronRight class="size-3 shrink-0" />
            <span class="font-semibold" style="color:rgba(255,255,255,0.70);">{{ pageTitle }}</span>
          </div>

          <!-- User dropdown trigger -->
          <div ref="userMenuRef" class="relative">
            <button
              class="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-white/[0.05] cursor-pointer"
              @click.stop="userMenuOpen = !userMenuOpen"
            >
              <div class="text-right hidden sm:block">
                <p class="text-[11px] font-medium leading-none truncate max-w-[130px]" style="color:rgba(255,255,255,0.70);">{{ displayName }}</p>
                <p v-if="isAdmin" class="text-[9px] mt-0.5 font-semibold uppercase tracking-wider" style="color:rgba(139,92,246,0.65);">Administrator</p>
                <p v-else class="text-[9px] mt-0.5" style="color:rgba(255,255,255,0.25);">Member</p>
              </div>
              <div
                class="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                :style="isAdmin
                  ? 'background:rgba(139,92,246,0.18);border:1px solid rgba(139,92,246,0.35);color:rgba(167,139,250,0.90);'
                  : 'background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.55);'"
              >
                {{ initials }}
              </div>
              <ChevronDown
                class="size-3 shrink-0 transition-transform"
                :class="userMenuOpen ? 'rotate-180' : ''"
                style="color:rgba(255,255,255,0.25);"
              />
            </button>

            <!-- Dropdown -->
            <div
              v-if="userMenuOpen"
              class="absolute right-0 top-full mt-1.5 w-44 rounded-xl overflow-hidden z-50"
              style="background:rgba(22,23,28,0.98);border:1px solid rgba(255,255,255,0.10);box-shadow:0 16px 48px rgba(0,0,0,0.5);"
            >
              <NuxtLink
                to="/dashboard/profile"
                class="flex items-center gap-2.5 px-3.5 py-2.5 text-[12px] transition-colors hover:bg-white/[0.05] cursor-pointer"
                style="color:rgba(255,255,255,0.65);"
                @click="userMenuOpen = false"
              >
                <User class="h-3.5 w-3.5 shrink-0" style="color:rgba(255,255,255,0.35);" />
                My Profile
              </NuxtLink>
              <div class="h-px mx-2.5" style="background:rgba(255,255,255,0.07);" />
              <button
                class="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12px] transition-colors hover:bg-red-400/[0.07] cursor-pointer"
                style="color:rgba(248,113,113,0.70);"
                @click="handleSignOut"
              >
                <LogOut class="h-3.5 w-3.5 shrink-0" />
                Sign out
              </button>
            </div>
          </div>
        </header>

        <!-- Page content -->
        <main
          class="flex-1 overflow-y-auto p-5"
          style="scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.10) transparent;"
        >
          <slot />
        </main>

        <!-- Footer -->
        <footer
          class="shrink-0 flex items-center justify-between px-5 py-2"
          style="border-top:1px solid rgba(255,255,255,0.05);"
        >
          <p class="text-[10px]" style="color:rgba(255,255,255,0.15);">&copy; {{ currentYear }} Surelle-ha. Local-first security review.</p>
          <div class="flex items-center gap-4">
            <NuxtLink to="/docs" class="text-[10px] transition-colors hover:text-white/40 cursor-pointer" style="color:rgba(255,255,255,0.18);">Docs</NuxtLink>
            <NuxtLink to="/support" class="text-[10px] transition-colors hover:text-white/40 cursor-pointer" style="color:rgba(255,255,255,0.18);">Support</NuxtLink>
            <NuxtLink to="/privacy" class="text-[10px] transition-colors hover:text-white/40 cursor-pointer" style="color:rgba(255,255,255,0.18);">Privacy</NuxtLink>
          </div>
        </footer>

      </div>
    </div>
  </div>
</template>
