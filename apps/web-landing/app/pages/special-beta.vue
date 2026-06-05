<script setup lang="ts">
useHead({ title: 'Special Beta Program — Vindicter' })

import { COUNTRIES } from '~/data/countries'

// ── Form state ──────────────────────────────────────────────────────────────
const orgName       = ref('')
const orgSize       = ref('')
const country       = ref('')
const contactName   = ref('')
const contactEmail  = ref('')
const referral      = ref('')
const agreedTerms   = ref(false)

const loading  = ref(false)
const success  = ref(false)
const apiError = ref('')

const errors = reactive({
  orgName:      '',
  orgSize:      '',
  country:      '',
  contactName:  '',
  contactEmail: '',
  agreedTerms:  '',
  captcha:      '',
})

// ── Cloudflare Turnstile ────────────────────────────────────────────────────
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
    sitekey:           config.public.turnstileSiteKey as string,
    theme:             'dark',
    callback:          onTurnstileSuccess,
    'expired-callback': onTurnstileExpired,
    'error-callback':   onTurnstileError,
  })
}

const isDev = process.env.NODE_ENV !== 'production'

onMounted(() => {
  if (isDev) {
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

// Country search
const countrySearch  = ref('')
const showDropdown   = ref(false)
const filteredCountries = computed(() =>
  countrySearch.value.trim().length < 1
    ? COUNTRIES
    : COUNTRIES.filter(c => c.toLowerCase().includes(countrySearch.value.toLowerCase()))
)

function selectCountry(c: string) {
  country.value      = c
  countrySearch.value = c
  showDropdown.value  = false
}

function onCountryInput() {
  country.value     = ''
  showDropdown.value = true
}

function onCountryBlur() {
  setTimeout(() => { showDropdown.value = false }, 150)
}

// ── Generic/free email domains blocklist ────────────────────────────────────
const BLOCKED_DOMAINS = new Set([
  'gmail.com','googlemail.com','yahoo.com','yahoo.co.uk','yahoo.co.in',
  'yahoo.com.au','yahoo.ca','yahoo.fr','yahoo.de','yahoo.it','yahoo.es',
  'yahoo.com.br','yahoo.com.mx','yahoo.com.ar','ymail.com',
  'hotmail.com','hotmail.co.uk','hotmail.fr','hotmail.de','hotmail.it',
  'hotmail.es','hotmail.com.br','hotmail.com.mx','hotmail.com.ar',
  'outlook.com','outlook.co.uk','outlook.fr','outlook.de','outlook.it',
  'outlook.es','outlook.com.au','outlook.com.br','live.com','live.co.uk',
  'live.fr','live.de','live.it','live.es','live.com.au','live.com.br',
  'msn.com','icloud.com','me.com','mac.com','aol.com','aol.co.uk',
  'protonmail.com','protonmail.ch','proton.me','pm.me',
  'tutanota.com','tutanota.de','tuta.io','tutamail.com',
  'zoho.com','zohomail.com','mail.com','inbox.com','gmx.com','gmx.net',
  'gmx.de','gmx.at','gmx.ch','web.de','freenet.de','t-online.de',
  'yandex.com','yandex.ru','yandex.ua','yandex.kz','yandex.by',
  'qq.com','163.com','126.com','sina.com','sohu.com',
  'libero.it','virgilio.it','tin.it',
  'wanadoo.fr','orange.fr','free.fr','laposte.net','sfr.fr','bbox.fr',
  'fastmail.com','fastmail.fm','fastmail.org','hey.com','duck.com',
  'mailinator.com','guerrillamail.com','temp-mail.org','throwam.com',
  'dispostable.com','sharklasers.com','guerrillamailblock.com',
])

function isCompanyEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase() ?? ''
  return !!domain && !BLOCKED_DOMAINS.has(domain)
}

// ── Validation ───────────────────────────────────────────────────────────────
function validate(): boolean {
  errors.orgName     = orgName.value.trim()     ? '' : 'Organization name is required.'
  errors.orgSize     = orgSize.value            ? '' : 'Please select an organization size.'
  errors.country     = country.value            ? '' : 'Please select a country.'
  errors.contactName = contactName.value.trim() ? '' : 'Contact name is required.'
  errors.agreedTerms = agreedTerms.value ? '' : 'You must agree to the terms to apply.'
  errors.captcha     = turnstileToken.value ? '' : 'Please complete the verification challenge.'

  const raw = contactEmail.value.trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
    errors.contactEmail = 'Please enter a valid email address.'
  } else if (!isCompanyEmail(raw)) {
    errors.contactEmail = 'Please use your company or organisation email address. Free email providers (Gmail, Yahoo, Outlook, etc.) are not accepted.'
  } else {
    errors.contactEmail = ''
  }

  return !Object.values(errors).some(Boolean)
}

async function submit() {
  apiError.value = ''
  if (!validate()) return

  loading.value = true
  try {
    const { public: { apiBaseUrl } } = useRuntimeConfig()
    const res = await fetch(`${apiBaseUrl}/beta`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orgName:      orgName.value.trim(),
        orgSize:      orgSize.value,
        country:      country.value,
        contactName:  contactName.value.trim(),
        contactEmail: contactEmail.value.trim(),
        partnerType:  'organization',
        referral:     referral.value.trim() || null,
        agreedTerms:  agreedTerms.value,
      }),
    })
    if (!res.ok) throw new Error(await res.text())
    success.value = true
  } catch {
    apiError.value = 'Something went wrong. Please try again or contact support@vindicter.xyz.'
  } finally {
    loading.value = false
  }
}

const orgSizes = [
  { value: '1-10',    label: '1 – 10 employees' },
  { value: '11-50',   label: '11 – 50 employees' },
  { value: '51-200',  label: '51 – 200 employees' },
  { value: '201-500', label: '201 – 500 employees' },
  { value: '501+',    label: '500+ employees' },
]
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <main class="flex-1 pt-24 pb-24 px-6">
      <div class="max-w-3xl mx-auto">

        <!-- Header -->
        <div class="text-center mb-12">
          <div class="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/8 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-accent/80">
            <span class="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            Exclusive Access
          </div>
          <h1 class="font-display text-[44px] sm:text-[60px] font-black uppercase leading-none tracking-wide mb-4">
            Special Beta<br/>Program
          </h1>
          <p class="text-[15px] leading-relaxed text-white/50 max-w-xl mx-auto mb-6">
            Reserved for organisations that want early, hands-on access to Vindicter with dedicated developer support and direct input into the product roadmap.
          </p>

          <!-- Org-only notice -->
          <div class="inline-flex items-center gap-2.5 rounded-xl border border-warn/20 bg-warn/6 px-5 py-3 text-left">
            <svg class="h-4 w-4 text-warn/70 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p class="text-[12px] text-white/50 leading-relaxed">
              <strong class="text-white/75">This programme is for organisations only</strong> — companies, teams, agencies, and research groups.
              Individual users should use the
              <NuxtLink to="/standard-beta" class="text-accent/70 hover:text-accent transition-colors underline underline-offset-2">standard Open Beta</NuxtLink>.
            </p>
          </div>
        </div>

        <!-- Partnership tier info -->
        <!-- Benefits overview -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-12">
          <div class="rounded-2xl border border-accent/25 bg-accent/6 p-6">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 border border-accent/20 mb-4">
              <svg class="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
            <p class="text-[14px] font-bold text-white mb-3">Organisation Access</p>
            <ul class="space-y-1.5">
              <li v-for="b in ['Early access to all new features', 'Direct feature input & roadmap access', 'Priority developer support', 'Named in release notes']" :key="b" class="flex items-center gap-2 text-[11px] text-white/50">
                <span class="h-1 w-1 rounded-full bg-accent/60 shrink-0" />
                {{ b }}
              </li>
            </ul>
          </div>
          <div class="rounded-2xl border border-white/8 bg-surface/40 p-6">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20 mb-4">
              <svg class="h-5 w-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <p class="text-[14px] font-bold text-white mb-3">Dedicated Support</p>
            <ul class="space-y-1.5">
              <li v-for="b in ['Dedicated beta support channel', 'Feedback influence on roadmap', 'Quarterly update briefings', 'Co-marketing opportunities']" :key="b" class="flex items-center gap-2 text-[11px] text-white/50">
                <span class="h-1 w-1 rounded-full bg-violet-400/60 shrink-0" />
                {{ b }}
              </li>
            </ul>
          </div>
        </div>

        <!-- Terms & Conditions summary -->
        <div class="rounded-2xl border border-white/8 bg-surface/40 p-6 mb-10">
          <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/30 mb-4">Programme Terms</p>
          <div class="prose-policy space-y-4 text-[13px] text-white/50 leading-relaxed">
            <p><strong class="text-white/70">1. Confidentiality.</strong> All pre-release builds, feature previews, and communications received through the Special Beta Programme are confidential. You agree not to publicly disclose, review, or benchmark pre-release versions without prior written consent from Vindicter.</p>
            <p><strong class="text-white/70">2. Authorised use only.</strong> Vindicter may only be used on systems, codebases, and networks your organisation owns or has explicit written authorisation to test. The programme does not grant permission to test third-party systems.</p>
            <p><strong class="text-white/70">3. Feedback.</strong> You agree to provide reasonable feedback on bugs, usability, and features during the testing period. Feedback you submit may be incorporated into the product without compensation.</p>
            <p><strong class="text-white/70">4. Developer support.</strong> Partner and Trusted organisations receive dedicated developer support for the duration of the beta period. Support is provided on a best-effort basis with a target response time of 1 business day.</p>
            <p><strong class="text-white/70">5. Data.</strong> Your application details (organisation name, contact information) will be stored securely and used solely to manage programme access. They will not be sold or shared with third parties.</p>
            <p><strong class="text-white/70">6. No warranty.</strong> Pre-release software is provided as-is. Vindicter accepts no liability for issues arising from use of beta builds in production environments.</p>
            <p><strong class="text-white/70">7. Termination.</strong> Either party may withdraw from the programme at any time with 7 days' written notice. Vindicter reserves the right to revoke access immediately in case of terms violations.</p>
          </div>
        </div>

        <!-- Application form -->
        <div v-if="!success" class="rounded-2xl border border-white/8 bg-surface/60 p-6 sm:p-8">
          <p class="text-[13px] font-bold text-white mb-1">Application Form</p>
          <p class="text-[11px] text-white/35 mb-6">All fields are required unless marked optional.</p>

          <div class="space-y-5">

            <!-- Org name -->
            <div>
              <label class="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-2">Organisation Name</label>
              <input
                v-model="orgName"
                type="text"
                placeholder="Acme Security Ltd."
                :disabled="loading"
                class="w-full rounded-xl border border-white/8 bg-white/[0.04] px-4 py-3 text-[13px] text-white placeholder-white/20 outline-none focus:border-accent/40 transition-colors disabled:opacity-50"
              />
              <p v-if="errors.orgName" class="mt-1 text-[11px] text-err/80">{{ errors.orgName }}</p>
            </div>

            <!-- Org size + country row -->
            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <!-- Size -->
              <div>
                <label class="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-2">Organisation Size</label>
                <select
                  v-model="orgSize"
                  :disabled="loading"
                  class="w-full rounded-xl border border-white/8 bg-[#1e1f22] px-4 py-3 text-[13px] text-white outline-none focus:border-accent/40 transition-colors disabled:opacity-50 appearance-none cursor-pointer"
                >
                  <option value="" disabled selected class="text-white/30">Select size…</option>
                  <option v-for="s in orgSizes" :key="s.value" :value="s.value" class="bg-[#1e1f22]">{{ s.label }}</option>
                </select>
                <p v-if="errors.orgSize" class="mt-1 text-[11px] text-err/80">{{ errors.orgSize }}</p>
              </div>

              <!-- Country with search -->
              <div class="relative">
                <label class="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-2">Country</label>
                <input
                  v-model="countrySearch"
                  type="text"
                  placeholder="Search country…"
                  :disabled="loading"
                  autocomplete="off"
                  @input="onCountryInput"
                  @focus="showDropdown = true"
                  @blur="onCountryBlur"
                  class="w-full rounded-xl border border-white/8 bg-white/[0.04] px-4 py-3 text-[13px] text-white placeholder-white/20 outline-none focus:border-accent/40 transition-colors disabled:opacity-50"
                />
                <div
                  v-if="showDropdown && filteredCountries.length"
                  class="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-[#2b2d31] shadow-2xl"
                >
                  <button
                    v-for="c in filteredCountries"
                    :key="c"
                    @mousedown.prevent="selectCountry(c)"
                    class="w-full text-left px-4 py-2 text-[13px] text-white/70 hover:bg-accent/10 hover:text-white transition-colors"
                  >
                    {{ c }}
                  </button>
                </div>
                <p v-if="errors.country" class="mt-1 text-[11px] text-err/80">{{ errors.country }}</p>
              </div>
            </div>

            <!-- Contact name + email -->
            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label class="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-2">Contact Name</label>
                <input
                  v-model="contactName"
                  type="text"
                  placeholder="Jane Smith"
                  :disabled="loading"
                  class="w-full rounded-xl border border-white/8 bg-white/[0.04] px-4 py-3 text-[13px] text-white placeholder-white/20 outline-none focus:border-accent/40 transition-colors disabled:opacity-50"
                />
                <p v-if="errors.contactName" class="mt-1 text-[11px] text-err/80">{{ errors.contactName }}</p>
              </div>
              <div>
                <label class="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-2">Contact Email</label>
                <input
                  v-model="contactEmail"
                  type="email"
                  placeholder="jane@acme.com"
                  :disabled="loading"
                  class="w-full rounded-xl border border-white/8 bg-white/[0.04] px-4 py-3 text-[13px] text-white placeholder-white/20 outline-none focus:border-accent/40 transition-colors disabled:opacity-50"
                />
                <p v-if="errors.contactEmail" class="mt-1 text-[11px] text-err/80">{{ errors.contactEmail }}</p>
              </div>
            </div>

            <!-- Referral (optional) -->
            <div>
              <label class="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-2">
                How did you hear about Vindicter? <span class="normal-case font-normal text-white/25">(optional)</span>
              </label>
              <input
                v-model="referral"
                type="text"
                placeholder="Conference, colleague, social media…"
                :disabled="loading"
                class="w-full rounded-xl border border-white/8 bg-white/[0.04] px-4 py-3 text-[13px] text-white placeholder-white/20 outline-none focus:border-accent/40 transition-colors disabled:opacity-50"
              />
            </div>

            <!-- Cloudflare Turnstile (production only) -->
            <div v-if="!isDev">
              <label class="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-2">
                Verification
              </label>
              <div ref="turnstileContainer" />
              <p v-if="errors.captcha" class="mt-1.5 text-[11px] text-err/80">{{ errors.captcha }}</p>
            </div>

            <!-- Terms checkbox -->
            <label class="flex items-start gap-3 cursor-pointer group">
              <div class="relative mt-0.5 shrink-0">
                <input v-model="agreedTerms" type="checkbox" class="sr-only" />
                <div
                  :class="agreedTerms ? 'bg-accent border-accent' : 'bg-white/[0.04] border-white/15 group-hover:border-white/30'"
                  class="h-5 w-5 rounded-md border transition-colors flex items-center justify-center"
                >
                  <svg v-if="agreedTerms" class="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <span class="text-[12px] text-white/50 leading-relaxed">
                I have read and agree to the Special Beta Programme terms above. I confirm that my organisation will use Vindicter only on systems we own or are authorised to test.
              </span>
            </label>
            <p v-if="errors.agreedTerms" class="text-[11px] text-err/80 -mt-3">{{ errors.agreedTerms }}</p>

            <!-- API error -->
            <p v-if="apiError" class="text-[12px] text-err/80 leading-relaxed">{{ apiError }}</p>

            <!-- Submit -->
            <button
              @click="submit"
              :disabled="loading"
              class="w-full flex items-center justify-center gap-2.5 rounded-xl bg-accent px-6 py-4 text-[14px] font-bold text-white transition-colors hover:bg-accent/85 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg v-if="loading" class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
              </svg>
              <svg v-else class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
              {{ loading ? 'Submitting…' : 'Submit Application' }}
            </button>

          </div>
        </div>

        <!-- Success state -->
        <div v-else class="rounded-2xl border border-ok/20 bg-ok/5 p-8 sm:p-12 text-center">
          <div class="flex justify-center mb-6">
            <div class="flex h-16 w-16 items-center justify-center rounded-3xl border border-ok/25 bg-ok/10">
              <svg class="h-8 w-8 text-ok" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h2 class="font-display text-[28px] font-black uppercase mb-3">Application received</h2>
          <p class="text-[14px] text-white/50 leading-relaxed max-w-sm mx-auto mb-6">
            Thank you for applying to the Vindicter Special Beta Programme. We'll review your application and reach out to <strong class="text-white/75">{{ contactEmail }}</strong> within 3–5 business days.
          </p>
          <NuxtLink to="/" class="text-[12px] text-white/30 hover:text-white/60 transition-colors">
            ← Back to home
          </NuxtLink>
        </div>

      </div>
    </main>
  </div>
</template>
