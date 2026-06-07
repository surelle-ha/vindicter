<script setup lang="ts">
useHead({ title: 'Download Vindicter — Open Beta' })

const MANIFEST = 'https://pub-1dcbd264e42f475e9f95858cc16ab6b7.r2.dev/releases/latest/update.json'

// ── Release manifest (version display only) ─────────────────────────────────
const version = ref<string | null>(null)

onMounted(async () => {
  try {
    const res = await fetch(MANIFEST)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json() as { version: string }
    version.value = data.version ?? null
  } catch { /* non-critical */ }
})

// ── Email gate ───────────────────────────────────────────────────────────────
type Step = 'gate' | 'sent'
const step          = ref<Step>('gate')
const email         = ref('')
const emailError    = ref('')
const captchaError  = ref('')
const submitLoading = ref(false)
const sentEmail     = ref('')

// ── Cloudflare Turnstile ─────────────────────────────────────────────────────
const turnstileContainer = ref<HTMLElement | null>(null)
const turnstileToken     = ref('')
const config             = useRuntimeConfig()

function onTurnstileSuccess(token: string) { turnstileToken.value = token }
function onTurnstileExpired()              { turnstileToken.value = '' }
function onTurnstileError()                { turnstileToken.value = '' }

function mountTurnstile() {
  if (!turnstileContainer.value) return
  const w = window as any
  if (!w.turnstile) return
  w.turnstile.render(turnstileContainer.value, {
    sitekey:            config.public.turnstileSiteKey as string,
    theme:              'dark',
    callback:           onTurnstileSuccess,
    'expired-callback': onTurnstileExpired,
    'error-callback':   onTurnstileError,
  })
}

const isDev = process.env.NODE_ENV !== 'production'

onMounted(() => {
  if (isDev) {
    // Skip the real widget in development — auto-satisfy so the form works locally
    turnstileToken.value = 'dev-bypass'
    return
  }
  if (typeof window === 'undefined') return
  const w = window as any
  if (w.turnstile) {
    mountTurnstile()
  } else {
    w.__turnstileOnLoad = mountTurnstile
    const s = document.createElement('script')
    s.src   = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=__turnstileOnLoad&render=explicit'
    s.async = true
    s.defer = true
    document.head.appendChild(s)
  }
})

function validateEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

async function submitEmail() {
  emailError.value  = ''
  captchaError.value = ''

  const raw = email.value.trim()
  if (!validateEmail(raw)) {
    emailError.value = 'Please enter a valid email address.'
    return
  }
  if (!turnstileToken.value) {
    captchaError.value = 'Please complete the verification challenge.'
    return
  }

  submitLoading.value = true
  try {
    const { public: { apiBaseUrl } } = useRuntimeConfig()
    const res = await fetch(`${apiBaseUrl}/newsletter/signups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: raw, accountType: 'individual', captchaToken: turnstileToken.value }),
    })
    if (!res.ok) throw new Error(await res.text())
    sentEmail.value = raw
    step.value = 'sent'
  } catch (err) {
    emailError.value = 'Something went wrong. Please try again.'
    console.error('[download-gate]', err)
  } finally {
    submitLoading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <main class="flex-1 flex items-center justify-center px-6 py-32">
      <div class="w-full max-w-md">

        <!-- Icon -->
        <div class="mb-8 flex justify-center">
          <div class="animate-float relative">
            <img src="/icon.png" alt="Vindicter" class="h-20 w-20 icon-glow" />
          </div>
        </div>

        <!-- Badge -->
        <div class="mb-6 flex justify-center">
          <div class="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/8 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-accent/80">
            <span class="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            Open Beta
            <span v-if="version" class="opacity-60">· v{{ version }}</span>
          </div>
        </div>

        <h1 class="font-display text-[40px] sm:text-[52px] font-black uppercase leading-none tracking-wide mb-4 text-center">
          Download Vindicter
        </h1>

        <p class="text-[14px] leading-relaxed text-white/45 mb-6 text-center">
          AI-powered security platform for teams. Scan codebases, track findings, and master security — together.
        </p>

        <!-- Org nudge -->
        <div class="mb-6 rounded-xl border border-white/6 bg-surface/30 px-5 py-4 flex items-start gap-3">
          <svg class="h-4 w-4 text-accent/40 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
          </svg>
          <p class="text-[12px] text-white/40 leading-relaxed">
            Representing an organisation?
            <NuxtLink to="/special-beta" class="text-accent/70 hover:text-accent transition-colors underline underline-offset-2">
              Join the Special Beta Programme
            </NuxtLink>
            — dedicated support, partner access, and early feature previews.
          </p>
        </div>

        <!-- ── Step: gate (email required) ─────────────────────────────── -->
        <div v-if="step === 'gate'" class="rounded-2xl border border-white/8 bg-surface/60 p-6 sm:p-8">
          <p class="text-[15px] font-semibold text-white mb-1.5 text-center">Get your download link</p>
          <p class="text-[12px] text-white/40 text-center mb-6 leading-relaxed">
            Enter your email and we'll send your personal download link. We'll also keep you updated on new releases.
          </p>

          <div class="mb-4">
            <label class="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-2">
              Email address
            </label>
            <input
              v-model="email"
              type="email"
              placeholder="you@example.com"
              :disabled="submitLoading"
              autocomplete="email"
              @keydown.enter="submitEmail"
              class="w-full rounded-xl border border-white/8 bg-white/[0.04] px-4 py-3 text-[13px] text-white placeholder-white/20 outline-none focus:border-accent/40 transition-colors disabled:opacity-50"
            />
            <p v-if="emailError" class="mt-1.5 text-[11px] text-err/80">{{ emailError }}</p>
          </div>

          <!-- Turnstile challenge (production only) -->
          <div v-if="!isDev" class="mb-4">
            <div ref="turnstileContainer" />
            <p v-if="captchaError" class="mt-1.5 text-[11px] text-err/80">{{ captchaError }}</p>
          </div>

          <button
            @click="submitEmail"
            :disabled="submitLoading || !email.trim() || !turnstileToken"
            class="w-full flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-[13px] font-bold text-white transition-colors hover:bg-accent/85 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg v-if="submitLoading" class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
            </svg>
            {{ submitLoading ? 'Sending link…' : 'Send Download Link →' }}
          </button>

          <p class="mt-3 text-center text-[10px] text-white/20">
            No spam. Unsubscribe any time.
          </p>
        </div>

        <!-- ── Step: sent (check inbox) ──────────────────────────────────── -->
        <div v-else class="rounded-2xl border border-ok/20 bg-ok/5 p-6 sm:p-8 text-center">
          <div class="mb-5 flex justify-center">
            <div class="flex h-14 w-14 items-center justify-center rounded-full bg-ok/10 border border-ok/20">
              <svg class="h-7 w-7 text-ok" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
          </div>

          <p class="text-[17px] font-bold text-white mb-2">Check your inbox</p>
          <p class="text-[13px] text-white/50 leading-relaxed mb-1">
            Your download link has been sent to
          </p>
          <p class="text-[13px] font-semibold text-ok/80 mb-5">{{ sentEmail }}</p>
          <p class="text-[12px] text-white/30 leading-relaxed">
            Click the link in the email to start your download. Check your spam folder if it doesn't arrive within a few minutes.
          </p>
        </div>

        <!-- Perks (always visible) -->
        <div class="mt-8 space-y-2.5">
          <p class="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/25 mb-4 text-center">What's included</p>
          <div
            v-for="perk in [
              { icon: 'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18', text: 'AI security scanning — Claude, OpenRouter, Ollama' },
              { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', text: 'Findings tracker, dependency inventory, secret detection' },
              { icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z', text: 'Vindicter Academy — 30-lesson security bootcamp' },
              { icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', text: 'Team workspaces — shared findings, seat limits, project quotas' },
            ]"
            :key="perk.text"
            class="flex items-start gap-3 rounded-xl border border-white/5 bg-surface/40 px-4 py-3"
          >
            <svg class="h-4 w-4 text-accent/50 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" :d="perk.icon" />
            </svg>
            <span class="text-[12px] text-white/50 leading-relaxed">{{ perk.text }}</span>
          </div>
        </div>

        <div class="mt-8 text-center">
          <NuxtLink to="/" class="text-[12px] text-white/30 hover:text-white/60 transition-colors">
            ← Back to home
          </NuxtLink>
        </div>

      </div>
    </main>
  </div>
</template>
