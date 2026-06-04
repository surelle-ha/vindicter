<script setup lang="ts">
import { Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from 'lucide-vue-next'

definePageMeta({ layout: 'auth' })
useHead({ title: 'Login' })

const route = useRoute()
const router = useRouter()
const { public: { turnstileSiteKey } } = useRuntimeConfig()
const { signIn, signOut, isInternal } = useAuth()

const loading = ref(false)
const errorMessage = ref(route.query.reason === 'internal' ? 'Internal comms access is limited to approved team accounts.' : '')
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const turnstileToken = ref('')
const turnstileContainer = ref<HTMLElement | null>(null)
const turnstileWidgetId = ref<string | null>(null)
const turnstileReady = computed(() => !turnstileSiteKey || Boolean(turnstileToken.value))

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string
      reset: (widgetId?: string | null) => void
      remove?: (widgetId?: string | null) => void
    }
  }
}

function loadTurnstileScript() {
  return new Promise<void>((resolve, reject) => {
    if (!import.meta.client || window.turnstile) {
      resolve()
      return
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-turnstile-script="true"]')
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Unable to load Turnstile.')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.defer = true
    script.dataset.turnstileScript = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Unable to load Turnstile.'))
    document.head.appendChild(script)
  })
}

async function renderTurnstile() {
  if (!turnstileSiteKey || !turnstileContainer.value || turnstileWidgetId.value) return

  try {
    await loadTurnstileScript()
    if (!window.turnstile || !turnstileContainer.value) return

    turnstileWidgetId.value = window.turnstile.render(turnstileContainer.value, {
      sitekey: turnstileSiteKey,
      theme: 'dark',
      size: 'flexible',
      callback: (token: string) => {
        turnstileToken.value = token
      },
      'expired-callback': () => {
        turnstileToken.value = ''
      },
      'error-callback': () => {
        turnstileToken.value = ''
        errorMessage.value = 'Turnstile could not verify this session. Try again.'
      },
    })
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to load Turnstile.'
  }
}

function resetTurnstile() {
  turnstileToken.value = ''
  if (window.turnstile && turnstileWidgetId.value) {
    window.turnstile.reset(turnstileWidgetId.value)
  }
}

onMounted(renderTurnstile)

onUnmounted(() => {
  if (window.turnstile?.remove && turnstileWidgetId.value) {
    window.turnstile.remove(turnstileWidgetId.value)
  }
})

async function login() {
  errorMessage.value = ''
  if (!turnstileReady.value) {
    errorMessage.value = 'Complete the Turnstile check before signing in.'
    return
  }

  loading.value = true

  try {
    await signIn(email.value.trim(), password.value, turnstileToken.value || undefined)
    if (!isInternal.value) {
      await signOut()
      errorMessage.value = 'Internal comms access is limited to approved team accounts.'
      resetTurnstile()
      return
    }

    await router.push(String(route.query.redirect ?? '/campaigns'))
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to login right now.'
    resetTurnstile()
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-7">
      <div class="mb-2 flex items-center gap-2">
        <ShieldCheck class="h-3.5 w-3.5 text-teal/75" />
        <p class="text-[10px] font-semibold uppercase tracking-[0.28em] text-teal/75">Internal Tool</p>
      </div>
      <h1 class="font-display text-[32px] font-black uppercase leading-none text-white/92">Internal login</h1>
      <p class="mt-2.5 text-[13px] leading-relaxed text-white/42">
        Sign in with your Vindicter API account.
      </p>
    </div>

    <div class="space-y-4 rounded-md border border-white/[0.08] bg-white/[0.035] p-6">
      <form class="space-y-4" @submit.prevent="login">
        <div>
          <label class="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-white/38">Email address</label>
          <div class="relative">
            <Mail class="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" />
            <input
              v-model="email"
              type="email"
              required
              autocomplete="email"
              placeholder="admin@example.com"
              class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] py-2.5 pl-9 pr-4 text-[13px] text-white outline-none transition-colors focus:border-teal/45"
            />
          </div>
        </div>

        <div>
          <label class="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-white/38">Password</label>
          <div class="relative">
            <Lock class="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" />
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              required
              autocomplete="current-password"
              placeholder="Your password"
              class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] py-2.5 pl-9 pr-10 text-[13px] text-white outline-none transition-colors focus:border-teal/45"
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 transition-colors hover:text-white/55"
              :title="showPassword ? 'Hide password' : 'Show password'"
              @click="showPassword = !showPassword"
            >
              <Eye v-if="!showPassword" class="h-3.5 w-3.5" />
              <EyeOff v-else class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div v-if="errorMessage" class="rounded-md border border-err/20 bg-err/10 px-3.5 py-3 text-[12px] text-err/85">
          {{ errorMessage }}
        </div>

        <div v-if="turnstileSiteKey" class="overflow-hidden rounded-md border border-white/[0.08] bg-white/[0.025] px-3 py-3">
          <div ref="turnstileContainer" class="min-h-[65px]" />
        </div>

        <button
          type="submit"
          :disabled="loading || !turnstileReady"
          class="flex w-full items-center justify-center gap-2 rounded-md bg-teal px-4 py-3 text-[13px] font-bold text-base transition-colors hover:bg-teal/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
          {{ loading ? 'Signing in...' : 'Sign in' }}
        </button>
      </form>
    </div>
  </div>
</template>
