<script setup lang="ts">
import { CheckCircle2, CircleDashed, Eye, EyeOff, Loader2, ShieldCheck, Stethoscope, UserCircle2, Zap } from 'lucide-vue-next'

const app      = useAppStore()
const projects = useProjectsStore()
const auth     = useAuthStore()
const emit     = defineEmits<{ launched: [] }>()

// ── Phase ─────────────────────────────────────────────────────────────────
// 'checking'   — loading stored auth, verifying token
// 'login'      — unauthenticated, show form
// 'logging-in' — in-flight API call
// 'entering'   — authenticated, brief welcome → auto-enter
type Phase = 'checking' | 'login' | 'logging-in' | 'entering'
const phase    = ref<Phase>('checking')
const email    = ref('')
const password = ref('')
const showPw   = ref(false)
const loginErr = ref('')
const welcomeName = ref('')

const animating = ref(false)

const launchMessages = [
  'Read the project. Map the risks. Close the findings.',
  'Turn source context into vulnerability scans your team can act on.',
  'Start focused, keep evidence visible, ship with confidence.',
]

const systemChecks = computed(() => [
  {
    label: 'Shell',
    detail: 'Interface ready',
    ok: true,
    icon: Zap,
  },
  {
    label: 'Session',
    detail: auth.isApiAuthenticated
      ? (auth.apiUser?.displayName ?? auth.apiUser?.email ?? 'Authenticated')
      : 'Not signed in',
    ok: auth.isApiAuthenticated,
    icon: UserCircle2,
  },
  {
    label: 'Projects',
    detail: projects.hasProjects ? `${projects.projects.length} registered` : 'No registry entries yet',
    ok: projects.hasProjects,
    icon: ShieldCheck,
  },
])

// ── Boot sequence ──────────────────────────────────────────────────────────
onMounted(async () => {
  document.addEventListener('keydown', onKey)

  // Auth store already loaded in app.vue before LaunchScreen mounts
  if (auth.isApiAuthenticated) {
    // Verify the stored token is still valid
    try {
      const { apiFetchMe } = await import('~/composables/useDesktopAuth')
      const me = await apiFetchMe(auth.apiToken!)
      auth.apiUser = me
      if (me.workspaces?.length) auth.workspaces = me.workspaces
      await auth._persist()
      welcomeName.value = me.displayName ?? me.email ?? ''
      phase.value = 'entering'
      setTimeout(() => doEnter(), 1400)
    } catch {
      // Token expired or invalid — clear and show login
      await auth.logoutApi()
      phase.value = 'login'
    }
  } else {
    phase.value = 'login'
  }
})

// ── Login ──────────────────────────────────────────────────────────────────
async function submitLogin() {
  if (!email.value.trim() || !password.value) return
  loginErr.value = ''
  phase.value    = 'logging-in'
  try {
    await auth.loginWithApi(email.value.trim(), password.value)
    welcomeName.value = auth.apiUser?.displayName ?? auth.apiUser?.email ?? ''
    phase.value = 'entering'
    setTimeout(() => doEnter(), 1000)
  } catch (e) {
    loginErr.value = e instanceof Error ? e.message : 'Sign in failed. Check your credentials.'
    phase.value    = 'login'
  }
}

// ── Enter ──────────────────────────────────────────────────────────────────
function doEnter() {
  if (animating.value) return
  animating.value = true
  setTimeout(() => {
    app.enter()
    emit('launched')
  }, 350)
}

onUnmounted(() => {
  document.removeEventListener('keydown', onKey)
})
function onKey(e: KeyboardEvent) {
  if (e.key === 'Enter' && phase.value === 'login') submitLogin()
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#0d0d0f]">
    <TitleBar />

    <div class="relative flex-1 overflow-hidden">
      <Dither
        class="z-0"
        :wave-speed="0.035"
        :wave-frequency="2.6"
        :wave-amplitude="0.26"
        :wave-color="[0.42, 0.37, 0.62]"
        :color-num="4"
        :pixel-size="2"
        :disable-animation="false"
        :enable-mouse-interaction="false"
        :mouse-radius="0.85"
      />
      <div class="absolute inset-0 z-[1] pointer-events-none bg-[radial-gradient(circle_at_center,rgba(31,29,38,0.08)_0%,rgba(13,13,15,0.34)_46%,rgba(13,13,15,0.86)_100%)]" />
      <div class="absolute inset-0 z-[2] pointer-events-none bg-black/35" />

      <Transition
        leave-active-class="transition-[opacity,transform] duration-350 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-[1.04]"
      >
        <div v-if="!animating" class="relative z-10 flex h-full flex-col items-center justify-center select-none px-4">

          <!-- Logo mark (always visible) -->
          <div class="flex flex-col items-center gap-2 mb-8">
            <img src="/icon.png" alt="Vindicter" class="size-16 rounded-xl object-cover drop-shadow-2xl" draggable="false" />
            <h1 class="text-xl font-bold tracking-tight text-white/90">Vindicter</h1>
            <TextType
              :text="launchMessages"
              class-name="text-xs font-medium text-indigo-100/50 text-center max-w-xs"
              :typing-speed="42" :deleting-speed="22" :pause-duration="1800"
              :show-cursor="true" cursor-character="|" cursor-class-name="text-indigo-200/40"
            />
          </div>

          <!-- ── CHECKING phase ── -->
          <div v-if="phase === 'checking'" class="flex flex-col items-center gap-3">
            <Loader2 class="size-5 animate-spin text-indigo-300/60" />
            <p class="text-xs text-white/30 tracking-wide">Checking session…</p>
          </div>

          <!-- ── ENTERING phase ── -->
          <div v-else-if="phase === 'entering'" class="flex flex-col items-center gap-3">
            <div class="flex items-center gap-2.5 rounded-xl border border-emerald-400/25 bg-emerald-400/8 px-5 py-3">
              <div class="h-7 w-7 rounded-full bg-emerald-400/15 border border-emerald-400/25 flex items-center justify-center">
                <CheckCircle2 class="size-4 text-emerald-300" />
              </div>
              <div>
                <p class="text-sm font-semibold text-emerald-200">Welcome back{{ welcomeName ? ', ' + welcomeName : '' }}</p>
                <p class="text-[10px] text-white/30 mt-0.5">Entering workspace…</p>
              </div>
            </div>
            <Loader2 class="size-4 animate-spin text-indigo-300/50 mt-1" />
          </div>

          <!-- ── LOGIN / LOGGING-IN phase ── -->
          <div v-else class="w-full max-w-sm">
            <div class="rounded-2xl border border-white/10 bg-black/30 p-6 shadow-2xl backdrop-blur-md">
              <div class="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-indigo-200/30 to-transparent" />

              <p class="text-[10px] font-semibold uppercase tracking-[0.28em] text-indigo-200/50 mb-4">Sign In</p>

              <div class="space-y-3">
                <!-- Email -->
                <div>
                  <label class="block text-[10px] font-semibold uppercase tracking-wider text-white/25 mb-1.5">Email</label>
                  <input
                    v-model="email"
                    type="email"
                    autocomplete="email"
                    placeholder="you@vindicter.xyz"
                    :disabled="phase === 'logging-in'"
                    class="w-full rounded-xl px-3.5 py-2.5 text-[13px] text-white outline-none transition-colors disabled:opacity-50"
                    style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.10);"
                    @focus="($event.target as HTMLInputElement).style.borderColor='rgba(99,102,241,0.45)'"
                    @blur="($event.target as HTMLInputElement).style.borderColor='rgba(255,255,255,0.10)'"
                    @keydown.enter="submitLogin"
                  />
                </div>

                <!-- Password -->
                <div>
                  <label class="block text-[10px] font-semibold uppercase tracking-wider text-white/25 mb-1.5">Password</label>
                  <div class="relative">
                    <input
                      v-model="password"
                      :type="showPw ? 'text' : 'password'"
                      autocomplete="current-password"
                      placeholder="Your password"
                      :disabled="phase === 'logging-in'"
                      class="w-full rounded-xl pl-3.5 pr-10 py-2.5 text-[13px] text-white outline-none transition-colors disabled:opacity-50"
                      style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.10);"
                      @focus="($event.target as HTMLInputElement).style.borderColor='rgba(99,102,241,0.45)'"
                      @blur="($event.target as HTMLInputElement).style.borderColor='rgba(255,255,255,0.10)'"
                      @keydown.enter="submitLogin"
                    />
                    <button
                      type="button"
                      class="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer transition-colors"
                      style="color:rgba(255,255,255,0.22);"
                      @click="showPw = !showPw"
                    >
                      <EyeOff v-if="showPw" class="size-3.5" />
                      <Eye v-else class="size-3.5" />
                    </button>
                  </div>
                </div>

                <!-- Error -->
                <div
                  v-if="loginErr"
                  class="rounded-xl px-3.5 py-2.5 text-[12px]"
                  style="background:rgba(242,63,66,0.08);border:1px solid rgba(242,63,66,0.18);color:rgba(248,113,113,0.85);"
                >
                  {{ loginErr }}
                </div>

                <!-- Submit -->
                <button
                  :disabled="!email.trim() || !password || phase === 'logging-in'"
                  class="pointer-events-auto w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-bold transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                  style="background:rgba(99,102,241,0.80);color:white;"
                  @click="submitLogin"
                >
                  <Loader2 v-if="phase === 'logging-in'" class="size-4 animate-spin" />
                  {{ phase === 'logging-in' ? 'Signing in…' : 'Sign In' }}
                </button>
              </div>
            </div>

            <p class="mt-3 text-center text-[10px] text-white/15 leading-relaxed max-w-xs mx-auto">
              By signing in you accept responsibility for your actions. The developers are not liable for misuse.
            </p>
          </div>

          <!-- System checks (shown in login + entering phases) -->
          <div
            v-if="phase !== 'checking'"
            class="pointer-events-auto absolute bottom-10 left-1/2 w-[min(34rem,calc(100%-2rem))] -translate-x-1/2"
          >
            <div class="relative overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-4 shadow-2xl shadow-black/30 backdrop-blur-md">
              <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(129,140,248,0.12),transparent_58%)]" />
              <div class="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-indigo-200/30 to-transparent" />
              <div class="relative">
                <div class="mb-3 flex items-center justify-between gap-3">
                  <div class="flex items-center gap-2">
                    <Stethoscope class="size-3.5 text-indigo-200/60" />
                    <p class="text-xs font-medium text-white/45">Launch Doctor</p>
                  </div>
                  <span class="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium text-emerald-200/70">
                    System check
                  </span>
                </div>
                <div class="grid gap-2 sm:grid-cols-3">
                  <div
                    v-for="check in systemChecks"
                    :key="check.label"
                    class="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5"
                  >
                    <div class="flex items-center gap-2">
                      <component :is="check.icon" class="size-3.5 text-white/30" />
                      <p class="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/25">{{ check.label }}</p>
                      <CheckCircle2 v-if="check.ok" class="ml-auto size-3.5 text-emerald-300/70" />
                      <CircleDashed v-else class="ml-auto size-3.5 text-amber-200/55" />
                    </div>
                    <p class="mt-2 truncate text-xs text-white/40">{{ check.detail }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </Transition>
    </div>
  </div>
</template>
