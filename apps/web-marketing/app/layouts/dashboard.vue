<script setup lang="ts">
import {
  ChevronDown,
  ChevronRight,
  History,
  LayoutDashboard,
  Loader2,
  LogOut,
  Megaphone,
  PanelLeftClose,
  Send,
  SquarePen,
  UsersRound,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const { user, isInternal, init, signOut } = useAuth()

const collapsed = useState('marketing-sidebar-collapsed', () => false)
const shellState = useState<'checking' | 'ready'>('marketing-shell-state', () => 'checking')
const authChecked = useState('marketing-auth-checked', () => false)
const userMenuOpen = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)

const nav = [
  { label: 'Comms', to: '/campaigns', icon: Megaphone },
  { label: 'Templates', to: '/templates', icon: SquarePen },
  { label: 'Send History', to: '/history', icon: History },
  { label: 'Distribution Lists', to: '/audiences', icon: UsersRound },
]

const outsideClickHandler = (event: MouseEvent) => {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target as Node)) {
    userMenuOpen.value = false
  }
}

onMounted(async () => {
  if (authChecked.value && user.value && isInternal.value) {
    shellState.value = 'ready'
    document.addEventListener('click', outsideClickHandler)
    return
  }

  await init()

  if (!user.value) {
    await router.push(`/auth/login?redirect=${encodeURIComponent(route.fullPath)}`)
    return
  }

  if (!isInternal.value) {
    await signOut()
    await router.push('/auth/login?reason=internal')
    return
  }

  shellState.value = 'ready'
  authChecked.value = true
  document.addEventListener('click', outsideClickHandler)
})

onUnmounted(() => document.removeEventListener('click', outsideClickHandler))

async function handleSignOut() {
  userMenuOpen.value = false
  await signOut()
  authChecked.value = false
  shellState.value = 'checking'
  await router.push('/auth/login')
}

function active(to: string) {
  return route.path === to || route.path.startsWith(`${to}/`)
}

const pageTitle = computed(() => {
  if (route.path.startsWith('/audiences')) return 'Distribution Lists'
  if (route.path.startsWith('/templates')) return 'Templates'
  if (route.path.startsWith('/history')) return 'Send History'
  if (route.path.startsWith('/campaigns')) return 'Comms'
  return 'Internal Ops'
})

const displayName = computed(() => {
  const current = user.value as Record<string, unknown> | null
  return (current?.displayName as string) ?? (current?.email as string) ?? 'Internal user'
})

const userEmail = computed(() => ((user.value as any)?.email as string) ?? '')

const initials = computed(() =>
  displayName.value
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
)

const currentYear = new Date().getFullYear()
</script>

<template>
  <div class="flex h-screen flex-col overflow-hidden bg-base text-white">
    <div v-if="shellState === 'checking'" class="flex flex-1 items-center justify-center">
      <div class="flex flex-col items-center gap-3">
        <img src="/icon.png" alt="" class="h-10 w-10 rounded-md opacity-45" />
        <div class="flex items-center gap-2 text-[12px] text-white/35">
          <Loader2 class="h-3.5 w-3.5 animate-spin" />
          Loading...
        </div>
      </div>
    </div>

    <div v-else class="flex flex-1 overflow-hidden">
      <aside
        class="relative shrink-0 overflow-hidden transition-[width] duration-200"
        :class="collapsed ? 'w-12' : 'w-56'"
      >
        <div class="absolute inset-0 opacity-45">
          <ClientOnly>
            <Dither
              :wave-speed="0.025"
              :wave-frequency="2"
              :wave-amplitude="0.22"
              :wave-color="[0.18, 0.38, 0.36]"
              :color-num="4"
              :pixel-size="3"
              :enable-mouse-interaction="false"
            />
          </ClientOnly>
        </div>
        <div class="absolute inset-0 bg-base/80" />

        <div class="relative z-10 flex h-full flex-col border-r border-white/[0.08]">
          <div class="flex h-12 items-center border-b border-white/[0.08] px-3" :class="collapsed ? 'justify-center' : 'gap-2'">
            <template v-if="!collapsed">
              <img src="/icon.png" alt="" class="h-6 w-6 shrink-0 rounded-md" />
              <span class="font-display flex-1 truncate text-sm font-semibold">Vindicter</span>
            </template>
            <button
              class="flex h-7 w-7 items-center justify-center rounded-md text-white/40 transition-colors hover:bg-white/[0.07] hover:text-white/75"
              :title="collapsed ? 'Expand' : 'Collapse'"
              @click="collapsed = !collapsed"
            >
              <PanelLeftClose v-if="!collapsed" class="h-3.5 w-3.5" />
              <LayoutDashboard v-else class="h-3.5 w-3.5" />
            </button>
          </div>

          <nav class="flex-1 space-y-1 overflow-y-auto p-2">
            <p v-if="!collapsed" class="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/25">Marketing</p>
            <NuxtLink
              v-for="item in nav"
              :key="item.to"
              :to="item.to"
              class="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium transition-colors"
              :class="[
                collapsed ? 'justify-center' : '',
                active(item.to) ? 'bg-teal/12 text-teal' : 'text-white/45 hover:bg-white/[0.05] hover:text-white/80',
              ]"
              :title="collapsed ? item.label : undefined"
            >
              <component :is="item.icon" class="h-3.5 w-3.5 shrink-0" />
              <span v-if="!collapsed">{{ item.label }}</span>
            </NuxtLink>
          </nav>
        </div>
      </aside>

      <div class="flex min-w-0 flex-1 flex-col">
        <header class="flex h-12 shrink-0 items-center justify-between border-b border-white/[0.08] bg-base/95 px-5">
          <div class="flex items-center gap-1.5 text-[11px] text-white/30">
            <span class="text-teal/65">internal</span>
            <ChevronRight class="h-3 w-3" />
            <span class="font-semibold text-white/75">{{ pageTitle }}</span>
          </div>

          <div ref="userMenuRef" class="relative">
            <button
              class="flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-white/[0.06]"
              @click.stop="userMenuOpen = !userMenuOpen"
            >
              <div class="flex h-7 w-7 items-center justify-center rounded-full border border-teal/35 bg-teal/15 text-[10px] font-bold text-teal">
                {{ initials }}
              </div>
              <div class="hidden text-left sm:block">
                <p class="max-w-[140px] truncate text-[12px] font-semibold leading-none text-white/80">{{ displayName }}</p>
                <p class="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-teal/60">Internal</p>
              </div>
              <ChevronDown class="h-3 w-3 text-white/25" :class="userMenuOpen ? 'rotate-180' : ''" />
            </button>

            <Transition
              enter-active-class="transition-all duration-150 ease-out"
              enter-from-class="opacity-0 scale-95 -translate-y-1"
              enter-to-class="opacity-100 scale-100 translate-y-0"
              leave-active-class="transition-all duration-100 ease-in"
              leave-from-class="opacity-100 scale-100 translate-y-0"
              leave-to-class="opacity-0 scale-95 -translate-y-1"
            >
              <div v-if="userMenuOpen" class="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-md border border-white/[0.10] bg-panel shadow-2xl">
                <div class="border-b border-white/[0.07] px-3.5 py-3">
                  <p class="truncate text-[12px] font-semibold text-white/80">{{ displayName }}</p>
                  <p class="mt-0.5 truncate text-[10px] text-white/35">{{ userEmail }}</p>
                </div>
                <div class="p-1">
                  <NuxtLink to="/campaigns" class="flex items-center gap-2.5 rounded-md px-3 py-2 text-[12px] text-white/60 transition-colors hover:bg-white/[0.05]" @click="userMenuOpen = false">
                    <Send class="h-3.5 w-3.5 text-white/35" />
                    Comms
                  </NuxtLink>
                  <NuxtLink to="/templates" class="flex items-center gap-2.5 rounded-md px-3 py-2 text-[12px] text-white/60 transition-colors hover:bg-white/[0.05]" @click="userMenuOpen = false">
                    <SquarePen class="h-3.5 w-3.5 text-white/35" />
                    Templates
                  </NuxtLink>
                  <div class="mx-1 my-1 h-px bg-white/[0.07]" />
                  <button class="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-[12px] text-err/70 transition-colors hover:bg-err/[0.08]" @click="handleSignOut">
                    <LogOut class="h-3.5 w-3.5" />
                    Sign out
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </header>

        <main class="flex-1 overflow-y-auto p-5">
          <slot />
        </main>

        <footer class="flex shrink-0 items-center justify-between border-t border-white/[0.05] px-5 py-2">
          <p class="text-[10px] text-white/18">&copy; {{ currentYear }} Vindicter Internal Comms</p>
          <NuxtLink to="/audiences" class="text-[10px] text-white/22 transition-colors hover:text-white/45">Distribution Lists</NuxtLink>
        </footer>
      </div>
    </div>
  </div>
</template>
