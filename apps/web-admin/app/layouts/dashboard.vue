<script setup lang="ts">
import {
  Megaphone, SquarePen, History, UsersRound,
  Users, MessageCircle, Star, Globe, Building2,
  PanelLeftClose, LogOut, ChevronRight, ChevronDown, User,
} from 'lucide-vue-next'

const route  = useRoute()
const router = useRouter()
const { user, isAdmin, isInternal, init, signOut } = useAuth()

const collapsed    = useState('sb-collapsed', () => false)
const dashState    = useState<'checking' | 'ready'>('dash-state', () => 'checking')
const authDone     = useState('dash-auth-done', () => false)
const userMenuOpen = ref(false)
const userMenuRef  = ref<HTMLElement | null>(null)

const outsideClick = (e: MouseEvent) => {
  if (userMenuRef.value && !userMenuRef.value.contains(e.target as Node))
    userMenuOpen.value = false
}

onMounted(async () => {
  if (authDone.value) { dashState.value = 'ready'; return }
  await init()
  if (!user.value) {
    await router.push(`/auth/login?redirect=${encodeURIComponent(route.fullPath)}`)
    return
  }
  if (!isInternal.value) {
    await router.push('/auth/login?reason=restricted')
    return
  }
  dashState.value = 'ready'
  authDone.value  = true
  document.addEventListener('click', outsideClick)
})
onUnmounted(() => document.removeEventListener('click', outsideClick))

async function handleSignOut() {
  userMenuOpen.value = false
  await signOut()
  authDone.value  = false
  dashState.value = 'checking'
  await router.push('/auth/login')
}

const marketingNav = [
  { label: 'Comms',              to: '/campaigns',  icon: Megaphone },
  { label: 'Templates',          to: '/templates',  icon: SquarePen },
  { label: 'Distribution Lists', to: '/audiences',  icon: UsersRound },
  { label: 'Send History',       to: '/history',    icon: History },
]

const adminNav = [
  { label: 'Users',         to: '/admin/users',       icon: Users },
  { label: 'Workspaces',    to: '/admin/workspaces',  icon: Building2 },
  { label: 'Tickets',       to: '/admin/tickets',     icon: MessageCircle },
  { label: 'Beta Requests', to: '/admin/beta',         icon: Star },
  { label: 'CORS',          to: '/admin/cors',         icon: Globe },
]

function active(to: string) {
  return route.path === to || (to.length > 1 && route.path.startsWith(to))
}

const displayName = computed(() => {
  if (!user.value) return 'User'
  const parts = [user.value.firstName, user.value.lastName].filter(Boolean)
  return parts.length ? parts.join(' ') : (user.value.email ?? 'User')
})
const userEmail = computed(() => user.value?.email ?? '')
const initials  = computed(() =>
  displayName.value.split(' ').map(n => n[0] ?? '').join('').slice(0, 2).toUpperCase()
)

const pageTitle = computed(() => {
  const p = route.path
  if (p.startsWith('/campaigns'))        return 'Comms'
  if (p.startsWith('/templates'))        return 'Templates'
  if (p.startsWith('/audiences'))        return 'Distribution Lists'
  if (p.startsWith('/history'))          return 'Send History'
  if (p.startsWith('/admin/users'))      return 'User Management'
  if (p.startsWith('/admin/tickets'))    return 'Support Tickets'
  if (p.startsWith('/admin/beta'))       return 'Beta Requests'
  if (p.startsWith('/admin/cors'))        return 'CORS Origins'
  return 'Admin'
})

const currentYear = new Date().getFullYear()
</script>

<template>
  <div class="h-screen flex flex-col overflow-hidden" style="background:#111215;color:white;font-family:Inter,system-ui,sans-serif;">

    <!-- Background -->
    <div class="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
      <div class="absolute inset-0" style="background:#111215;" />
      <div style="position:absolute;width:600px;height:600px;border-radius:50%;filter:blur(130px);background:radial-gradient(circle,#92400e 0%,transparent 70%);top:-220px;left:-120px;opacity:0.07;" />
      <div style="position:absolute;width:400px;height:400px;border-radius:50%;filter:blur(130px);background:radial-gradient(circle,#78350f 0%,transparent 70%);bottom:-120px;right:-80px;opacity:0.05;" />
    </div>

    <!-- Auth checking -->
    <div v-if="dashState === 'checking'" class="flex flex-1 flex-col items-center justify-center gap-6">
      <div class="fixed inset-x-0 top-0 h-0.5 overflow-hidden" style="background:rgba(255,255,255,0.06);">
        <div class="h-full animate-pulse" style="background:rgba(245,158,11,0.70);width:60%;" />
      </div>
      <img src="/icon.png" alt="" class="h-11 w-11 opacity-45" />
      <div class="text-center">
        <p class="text-[13px] font-medium" style="color:rgba(255,255,255,0.55);">Vindicter Admin</p>
        <p class="text-[11px] mt-1" style="color:rgba(255,255,255,0.22);">Verifying session…</p>
      </div>
    </div>

    <!-- Shell -->
    <div v-else class="relative z-10 flex flex-1 overflow-hidden">

      <!-- Sidebar -->
      <aside
        class="shrink-0 flex flex-col overflow-hidden transition-[width] duration-200 ease-in-out"
        :class="collapsed ? 'w-12' : 'w-52'"
        style="background:rgba(17,18,21,0.98);border-right:1px solid rgba(255,255,255,0.07);"
      >
        <!-- Brand -->
        <div class="h-11 px-3 flex items-center" :class="collapsed ? 'justify-center' : 'gap-2'" style="border-bottom:1px solid rgba(255,255,255,0.07);">
          <template v-if="!collapsed">
            <img src="/icon.png" alt="" class="size-6 shrink-0 rounded-md" />
            <span class="font-display flex-1 text-sm font-semibold truncate" style="color:rgba(255,255,255,0.88);">Admin</span>
          </template>
          <button
            class="size-6 flex items-center justify-center rounded transition-colors hover:bg-white/[0.06] cursor-pointer"
            style="color:rgba(255,255,255,0.30);"
            :title="collapsed ? 'Expand' : 'Collapse'"
            @click="collapsed = !collapsed"
          >
            <PanelLeftClose v-if="!collapsed" class="size-3.5" />
            <img v-else src="/icon.png" alt="" class="size-5 rounded" />
          </button>
        </div>

        <!-- Nav -->
        <nav class="flex-1 p-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
          <!-- Marketing section -->
          <p v-if="!collapsed" class="px-2 mb-1 mt-1 text-[10px] font-semibold uppercase tracking-[0.12em]" style="color:rgba(45,212,191,0.40);">Marketing</p>
          <div v-else class="h-px mx-1 mb-2" style="background:rgba(255,255,255,0.07);" />

          <NuxtLink
            v-for="item in marketingNav"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer"
            :class="[
              collapsed ? 'justify-center' : '',
              active(item.to) ? 'bg-teal/10 text-teal' : 'text-white/45 hover:text-white/75 hover:bg-white/[0.05]',
            ]"
            :title="collapsed ? item.label : undefined"
          >
            <component :is="item.icon" class="size-3.5 shrink-0" />
            <span v-if="!collapsed">{{ item.label }}</span>
          </NuxtLink>

          <!-- Admin section -->
          <template v-if="isAdmin">
            <div class="h-px mx-1 my-2" style="background:rgba(255,255,255,0.07);" />
            <p v-if="!collapsed" class="px-2 mb-1 text-[10px] font-semibold uppercase tracking-[0.12em]" style="color:rgba(248,113,113,0.35);">Admin</p>
            <NuxtLink
              v-for="item in adminNav"
              :key="item.to"
              :to="item.to"
              class="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer"
              :class="[
                collapsed ? 'justify-center' : '',
                active(item.to) ? 'bg-red-500/10 text-red-400' : 'text-white/35 hover:text-white/65 hover:bg-white/[0.04]',
              ]"
              :title="collapsed ? item.label : undefined"
            >
              <component :is="item.icon" class="size-3.5 shrink-0" />
              <span v-if="!collapsed">{{ item.label }}</span>
            </NuxtLink>
          </template>
        </nav>

        <!-- Sidebar footer -->
        <div class="shrink-0 p-2" style="border-top:1px solid rgba(255,255,255,0.06);">
          <template v-if="!collapsed">
            <div class="rounded-lg px-3 py-2.5" style="background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.12);">
              <div class="flex items-center justify-between gap-2 mb-1">
                <span class="text-[10px] font-bold uppercase tracking-wider" style="color:rgba(245,158,11,0.65);">Vindicter</span>
                <span class="text-[9px] font-semibold rounded-full px-1.5 py-0.5" style="background:rgba(245,158,11,0.15);color:rgba(251,191,36,0.90);">Admin</span>
              </div>
              <p class="text-[10px] leading-relaxed" style="color:rgba(255,255,255,0.22);">Internal admin & marketing panel.</p>
            </div>
          </template>
          <template v-else>
            <div class="flex items-center justify-center py-1">
              <span class="h-2 w-2 rounded-full animate-pulse" style="background:rgba(35,165,90,0.65);" title="Online" />
            </div>
          </template>
        </div>
      </aside>

      <!-- Main area -->
      <div class="flex flex-1 flex-col overflow-hidden">

        <!-- Topbar -->
        <header class="h-11 shrink-0 flex items-center justify-between px-5" style="border-bottom:1px solid rgba(255,255,255,0.07);background:rgba(17,18,21,0.95);">
          <div class="flex items-center gap-1.5 text-[11px]" style="color:rgba(255,255,255,0.28);">
            <span style="color:rgba(245,158,11,0.55);">admin</span>
            <ChevronRight class="size-3 shrink-0" />
            <span class="font-semibold" style="color:rgba(255,255,255,0.68);">{{ pageTitle }}</span>
          </div>

          <!-- User menu -->
          <div ref="userMenuRef" class="relative">
            <button class="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 transition-colors hover:bg-white/[0.05] cursor-pointer" @click.stop="userMenuOpen = !userMenuOpen">
              <div class="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style="background:rgba(245,158,11,0.18);border:1.5px solid rgba(245,158,11,0.38);color:rgba(251,191,36,0.95);">
                {{ initials }}
              </div>
              <div class="hidden sm:block text-left">
                <p class="text-[11px] leading-none truncate max-w-[140px]" style="color:rgba(255,255,255,0.78);">{{ displayName }}</p>
                <p class="text-[9px] mt-0.5 tracking-wide" style="color:rgba(255,255,255,0.22);">{{ isAdmin ? 'Admin' : 'Internal' }}</p>
              </div>
              <ChevronDown class="size-3 shrink-0 transition-transform" :class="userMenuOpen ? 'rotate-180' : ''" style="color:rgba(255,255,255,0.22);" />
            </button>

            <Transition enter-active-class="transition-all duration-150 ease-out" enter-from-class="opacity-0 scale-95 -translate-y-1" enter-to-class="opacity-100 scale-100 translate-y-0" leave-active-class="transition-all duration-100 ease-in" leave-from-class="opacity-100 scale-100 translate-y-0" leave-to-class="opacity-0 scale-95 -translate-y-1">
              <div v-if="userMenuOpen" class="absolute right-0 top-full mt-2 w-52 rounded-xl overflow-hidden z-50" style="background:rgba(22,23,28,0.99);border:1px solid rgba(255,255,255,0.10);box-shadow:0 20px 60px rgba(0,0,0,0.6);">
                <div class="px-3.5 py-3" style="border-bottom:1px solid rgba(255,255,255,0.07);">
                  <p class="text-[12px] font-semibold truncate" style="color:rgba(255,255,255,0.80);">{{ displayName }}</p>
                  <p class="text-[10px] mt-0.5 truncate" style="color:rgba(255,255,255,0.28);">{{ userEmail }}</p>
                  <span class="mt-1.5 inline-block rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider" style="background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.25);color:rgba(251,191,36,0.90);">
                    {{ isAdmin ? 'Admin' : 'Internal' }}
                  </span>
                </div>
                <div class="p-1">
                  <button class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] transition-colors hover:bg-red-500/[0.08] cursor-pointer" style="color:rgba(248,113,113,0.65);" @click="handleSignOut">
                    <LogOut class="h-3.5 w-3.5 shrink-0" /> Sign out
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </header>

        <!-- Content -->
        <main class="flex-1 overflow-y-auto p-5" style="scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.08) transparent;">
          <slot />
        </main>

        <footer class="shrink-0 flex items-center justify-between px-5 py-2" style="border-top:1px solid rgba(255,255,255,0.05);">
          <p class="text-[10px]" style="color:rgba(255,255,255,0.14);">&copy; {{ currentYear }} Vindicter — Internal Admin Panel</p>
        </footer>
      </div>
    </div>
  </div>
</template>
