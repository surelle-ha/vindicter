<script setup lang="ts">
useHead({ title: 'Download Vindicter — Open Beta' })

const MANIFEST = 'https://pub-1dcbd264e42f475e9f95858cc16ab6b7.r2.dev/releases/latest/update.json'
const TOKEN_KEY = 'vindicter:download-token'

// ── Release manifest ────────────────────────────────────────────────────────
const manifestLoading = ref(true)
const manifestError   = ref(false)
const version         = ref<string | null>(null)
const pubDate         = ref<string | null>(null)
const winUrl          = ref<string | null>(null)

onMounted(async () => {
  try {
    const res = await fetch(MANIFEST)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json() as {
      version: string
      pub_date: string
      platforms: Record<string, { url: string }>
    }
    version.value = data.version ?? null
    pubDate.value = data.pub_date
      ? new Date(data.pub_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : null
    winUrl.value = data.platforms?.['windows-x86_64']?.url ?? null
  } catch {
    manifestError.value = true
  } finally {
    manifestLoading.value = false
  }

  await checkExistingAccess()
})

// ── Token gate ──────────────────────────────────────────────────────────────
type Step = 'gate' | 'download'
const step         = ref<Step>('gate')
const email        = ref('')
const emailError   = ref('')
const submitLoading = ref(false)
const tokenVerifying = ref(false)
const tokenEmail   = ref('')

function validateEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

async function checkExistingAccess() {
  const route = useRoute()
  const urlToken = route.query.token as string | undefined

  // Priority 1: URL token parameter
  if (urlToken) {
    tokenVerifying.value = true
    try {
      const supabase = useSupabase()
      const { data } = await supabase
        .from('newsletter_signups')
        .select('email, download_token')
        .eq('download_token', urlToken)
        .maybeSingle()
      if (data) {
        tokenEmail.value = data.email ?? ''
        localStorage.setItem(TOKEN_KEY, urlToken)
        step.value = 'download'
        return
      }
    } catch { /* fall through */ } finally {
      tokenVerifying.value = false
    }
  }

  // Priority 2: localStorage saved token
  const saved = localStorage.getItem(TOKEN_KEY)
  if (saved) {
    tokenVerifying.value = true
    try {
      const supabase = useSupabase()
      const { data } = await supabase
        .from('newsletter_signups')
        .select('email')
        .eq('download_token', saved)
        .maybeSingle()
      if (data) {
        tokenEmail.value = data.email ?? ''
        step.value = 'download'
      } else {
        localStorage.removeItem(TOKEN_KEY)
      }
    } catch { /* ignore */ } finally {
      tokenVerifying.value = false
    }
  }
}

async function submitEmail() {
  emailError.value = ''
  const raw = email.value.trim()
  if (!validateEmail(raw)) {
    emailError.value = 'Please enter a valid email address.'
    return
  }

  submitLoading.value = true
  try {
    const supabase = useSupabase()
    const token = crypto.randomUUID().replace(/-/g, '')

    // Upsert: same email gets a fresh token each time
    const { error } = await supabase
      .from('newsletter_signups')
      .upsert(
        { email: raw, download_token: token, account_type: 'individual' },
        { onConflict: 'email' },
      )

    if (error && error.code !== '23505') throw error

    // For duplicate email, fetch the existing token so returning users get access
    const { data: existing } = await supabase
      .from('newsletter_signups')
      .select('download_token')
      .eq('email', raw)
      .maybeSingle()

    const finalToken = existing?.download_token ?? token
    localStorage.setItem(TOKEN_KEY, finalToken)
    tokenEmail.value = raw
    step.value = 'download'
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
          Local-first AI security workspace. Scan codebases, track findings, and master security — all on your machine.
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

        <!-- Verifying spinner -->
        <div v-if="tokenVerifying" class="flex justify-center py-10">
          <svg class="h-7 w-7 text-accent/40 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
          </svg>
        </div>

        <!-- ── Step: gate (email required) ─────────────────────────────── -->
        <div v-else-if="step === 'gate'" class="rounded-2xl border border-white/8 bg-surface/60 p-6 sm:p-8">
          <p class="text-[15px] font-semibold text-white mb-1.5 text-center">Get your download link</p>
          <p class="text-[12px] text-white/40 text-center mb-6 leading-relaxed">
            Enter your email to receive a personal download link. We'll also send you release notes.
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

          <button
            @click="submitEmail"
            :disabled="submitLoading || !email.trim()"
            class="w-full flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-[13px] font-bold text-white transition-colors hover:bg-accent/85 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg v-if="submitLoading" class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
            </svg>
            {{ submitLoading ? 'Generating link…' : 'Get Download Link →' }}
          </button>

          <p class="mt-3 text-center text-[10px] text-white/20">
            No spam. Unsubscribe any time. Personal link is reusable.
          </p>
        </div>

        <!-- ── Step: download ────────────────────────────────────────────── -->
        <div v-else>
          <!-- Registered confirmation -->
          <div v-if="tokenEmail" class="mb-5 rounded-xl border border-ok/20 bg-ok/5 px-4 py-3 flex items-center gap-3">
            <svg class="h-4 w-4 text-ok shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-[12px] text-ok/80">Access granted for <strong>{{ tokenEmail }}</strong>.</p>
          </div>

          <!-- Loading manifest -->
          <div v-if="manifestLoading" class="flex justify-center py-6">
            <svg class="h-7 w-7 text-accent/40 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
            </svg>
          </div>

          <!-- Manifest error -->
          <div v-else-if="manifestError" class="rounded-2xl border border-err/20 bg-err/5 px-5 py-4 text-center">
            <p class="text-[13px] text-err/80">Could not load release info. Try refreshing the page.</p>
          </div>

          <!-- Download card -->
          <div v-else class="rounded-2xl border border-white/8 bg-surface/60 p-6 sm:p-8">
            <a
              :href="winUrl ?? '#'"
              :class="winUrl ? '' : 'pointer-events-none opacity-40'"
              class="group flex items-center gap-3 rounded-xl bg-accent px-6 py-4 text-[14px] font-bold text-white transition-all hover:bg-accent/85 hover:scale-[1.02] active:scale-[0.98] w-full justify-center mb-4"
            >
              <svg class="h-5 w-5 transition-transform group-hover:translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download for Windows
              <span v-if="version" class="opacity-55 font-normal text-[12px]">v{{ version }}</span>
            </a>

            <div class="flex items-center justify-center gap-4 text-[11px] text-white/30">
              <span>Windows 10 / 11 · x64</span>
              <span class="text-white/15">·</span>
              <span>Free</span>
              <span v-if="pubDate" class="text-white/15">·</span>
              <span v-if="pubDate">{{ pubDate }}</span>
            </div>

            <div class="mt-5 rounded-xl border border-warn/15 bg-warn/5 px-4 py-3 flex items-start gap-2.5">
              <svg class="h-4 w-4 text-warn/70 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p class="text-[11px] text-white/35 leading-relaxed">
                Windows SmartScreen may prompt you. Click <strong class="text-white/55">"More info"</strong> → <strong class="text-white/55">"Run anyway"</strong> to proceed.
              </p>
            </div>
          </div>
        </div>

        <!-- Perks (always visible) -->
        <div class="mt-8 space-y-2.5">
          <p class="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/25 mb-4 text-center">What's included</p>
          <div
            v-for="perk in [
              { icon: 'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18', text: 'AI security scanning — Claude, OpenRouter, Ollama' },
              { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', text: 'Findings tracker, dependency inventory, secret detection' },
              { icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z', text: 'Vindicter Academy — 30-lesson security bootcamp' },
              { icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', text: '100% local — no cloud, no account, no telemetry' },
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
