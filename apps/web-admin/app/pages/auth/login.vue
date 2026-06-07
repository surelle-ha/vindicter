<script setup lang="ts">
import { Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from 'lucide-vue-next'

definePageMeta({ layout: 'auth' })
useHead({ title: 'Login' })

const route  = useRoute()
const router = useRouter()
const { signIn, isInternal } = useAuth()
const { public: { turnstileSiteKey } } = useRuntimeConfig()

const loading   = ref(false)
const errorMsg  = ref(route.query.reason === 'restricted' ? 'Access is restricted to internal team accounts.' : '')
const email     = ref('')
const password  = ref('')
const showPw    = ref(false)

// â”€â”€ Turnstile â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const turnstileContainer = ref<HTMLElement | null>(null)
const turnstileToken     = ref('')
const turnstileWidgetId  = ref<string | null>(null)
const isDev              = process.env.NODE_ENV !== 'production'
const turnstileReady     = computed(() => isDev || !turnstileSiteKey || Boolean(turnstileToken.value))

function loadTurnstileScript() {
  return new Promise<void>((resolve, reject) => {
    if (!import.meta.client || (window as any).turnstile) { resolve(); return }
    const existing = document.querySelector<HTMLScriptElement>('script[data-ts="1"]')
    if (existing) { existing.addEventListener('load', () => resolve(), { once: true }); return }
    const s = document.createElement('script')
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    s.async = true; s.defer = true; s.dataset.ts = '1'
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Could not load Turnstile.'))
    document.head.appendChild(s)
  })
}

async function renderTurnstile() {
  if (isDev || !turnstileSiteKey || !turnstileContainer.value || turnstileWidgetId.value) return
  try {
    await loadTurnstileScript()
    const w = window as any
    if (!w.turnstile || !turnstileContainer.value) return
    turnstileWidgetId.value = w.turnstile.render(turnstileContainer.value, {
      sitekey:            turnstileSiteKey,
      theme:              'dark',
      size:               'flexible',
      callback:           (t: string) => { turnstileToken.value = t },
      'expired-callback': () => { turnstileToken.value = '' },
      'error-callback':   () => { turnstileToken.value = ''; errorMsg.value = 'Verification failed. Please try again.' },
    })
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : 'Could not load Turnstile.'
  }
}

function resetTurnstile() {
  turnstileToken.value = ''
  const w = window as any
  if (w.turnstile && turnstileWidgetId.value) w.turnstile.reset(turnstileWidgetId.value)
}

onMounted(renderTurnstile)
onUnmounted(() => {
  const w = window as any
  if (w.turnstile?.remove && turnstileWidgetId.value) w.turnstile.remove(turnstileWidgetId.value)
})

async function login() {
  errorMsg.value = ''
  if (!turnstileReady.value) { errorMsg.value = 'Complete the verification before signing in.'; return }
  loading.value = true
  try {
    const me = await signIn(email.value.trim(), password.value, isDev ? undefined : turnstileToken.value || undefined)
    if (!isInternal.value) {
      errorMsg.value = 'Access is restricted to internal team accounts.'
      resetTurnstile()
      return
    }
    await router.push(String(route.query.redirect ?? '/campaigns'))
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : 'Unable to sign in right now.'
    resetTurnstile()
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-7">
      <div class="flex items-center gap-2 mb-2">
        <ShieldCheck class="h-3.5 w-3.5" style="color:rgba(245,158,11,0.65);" />
        <p class="text-[10px] font-semibold uppercase tracking-[0.28em]" style="color:rgba(245,158,11,0.65);">Internal Tool</p>
      </div>
      <h1 class="font-display text-[30px] font-black uppercase leading-none" style="color:rgba(255,255,255,0.92);">Admin Login</h1>
      <p class="mt-2.5 text-[13px] leading-relaxed" style="color:rgba(255,255,255,0.38);">Sign in with your Vindicter account.</p>
    </div>

    <div class="rounded-2xl p-6 space-y-4" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);">
      <form class="space-y-4" @submit.prevent="login">

        <div>
          <label class="block mb-2 text-[10px] font-semibold uppercase tracking-wider" style="color:rgba(255,255,255,0.32);">Email address</label>
          <div class="relative">
            <Mail class="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style="color:rgba(255,255,255,0.20);" />
            <input v-model="email" type="email" required autocomplete="email" placeholder="admin@vindicter.xyz"
              class="w-full rounded-xl pl-9 pr-4 py-2.5 text-[13px] text-white outline-none transition-colors"
              style="border:1px solid rgba(255,255,255,0.09);background:rgba(255,255,255,0.04);"
              @focus="($event.target as HTMLInputElement).style.borderColor='rgba(245,158,11,0.45)'"
              @blur="($event.target as HTMLInputElement).style.borderColor='rgba(255,255,255,0.09)'"
            />
          </div>
        </div>

        <div>
          <label class="block mb-2 text-[10px] font-semibold uppercase tracking-wider" style="color:rgba(255,255,255,0.32);">Password</label>
          <div class="relative">
            <Lock class="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style="color:rgba(255,255,255,0.20);" />
            <input v-model="password" :type="showPw ? 'text' : 'password'" required autocomplete="current-password" placeholder="Your password"
              class="w-full rounded-xl pl-9 pr-10 py-2.5 text-[13px] text-white outline-none transition-colors"
              style="border:1px solid rgba(255,255,255,0.09);background:rgba(255,255,255,0.04);"
              @focus="($event.target as HTMLInputElement).style.borderColor='rgba(245,158,11,0.45)'"
              @blur="($event.target as HTMLInputElement).style.borderColor='rgba(255,255,255,0.09)'"
            />
            <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer transition-colors" style="color:rgba(255,255,255,0.20);" @click="showPw = !showPw">
              <Eye v-if="!showPw" class="h-3.5 w-3.5" />
              <EyeOff v-else class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <!-- Turnstile widget (hidden in dev) -->
        <div v-if="!isDev && turnstileSiteKey" class="overflow-hidden rounded-xl" style="border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.025);padding:12px;">
          <div ref="turnstileContainer" class="min-h-[65px]" />
        </div>

        <div v-if="errorMsg" class="rounded-xl px-3.5 py-3 text-[12px]" style="background:rgba(242,63,66,0.08);border:1px solid rgba(242,63,66,0.18);color:rgba(242,63,66,0.85);">
          {{ errorMsg }}
        </div>

        <button type="submit" :disabled="loading || !turnstileReady"
          class="w-full rounded-xl py-3 text-[13px] font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
          style="background:rgba(245,158,11,0.85);color:white;"
        >
          <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
          {{ loading ? 'Signing inâ€¦' : 'Sign in' }}
        </button>
      </form>
    </div>
  </div>
</template>

