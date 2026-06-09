<script setup lang="ts">
import { LifeBuoy, Send, CheckCircle2, Loader2, Clock } from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Support — Vindicter' })

const api = useApi()
const { user } = useAuth()

type Step = 'form' | 'done'
type Category = 'setup' | 'scan' | 'billing' | 'bug' | 'other'

const RATE_LIMIT_KEY = 'support_last_submitted'
const RATE_LIMIT_MS  = 10 * 60 * 1000 // 10 minutes

const step    = ref<Step>('form')
const loading = ref(false)
const apiErr  = ref('')
const doneEmail = ref('')

const rateLimitedUntil = ref<number | null>(null)
const rateLimitSeconds = ref(0)
let rateLimitTimer: ReturnType<typeof setInterval> | null = null

const form = reactive({
  name: '',
  email: '',
  category: 'setup' as Category,
  subject: '',
  message: '',
})

const errors = reactive({ name: '', email: '', subject: '', message: '' })

const categories: { value: Category; label: string }[] = [
  { value: 'setup',    label: 'Setup or install' },
  { value: 'scan',     label: 'Scanning or findings' },
  { value: 'billing',  label: 'Beta or account' },
  { value: 'bug',      label: 'Bug report' },
  { value: 'other',    label: 'Something else' },
]

function checkRateLimit() {
  if (!import.meta.client) return
  const last = localStorage.getItem(RATE_LIMIT_KEY)
  if (!last) return
  const until = Number(last) + RATE_LIMIT_MS
  if (Date.now() < until) {
    rateLimitedUntil.value = until
    startCountdown(until)
  }
}

function startCountdown(until: number) {
  if (rateLimitTimer) clearInterval(rateLimitTimer)
  rateLimitSeconds.value = Math.ceil((until - Date.now()) / 1000)
  rateLimitTimer = setInterval(() => {
    const secs = Math.ceil((until - Date.now()) / 1000)
    if (secs <= 0) {
      rateLimitedUntil.value = null
      rateLimitSeconds.value = 0
      if (rateLimitTimer) clearInterval(rateLimitTimer)
    } else {
      rateLimitSeconds.value = secs
    }
  }, 1000)
}

onMounted(() => {
  if (user.value) {
    const u = user.value as any
    form.email = u.email ?? ''
    form.name  = u.displayName ?? ''
  }
  checkRateLimit()
})

onUnmounted(() => {
  if (rateLimitTimer) clearInterval(rateLimitTimer)
})

function validate() {
  errors.name    = form.name.trim() ? '' : 'Name is required.'
  errors.email   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) ? '' : 'Enter a valid email.'
  errors.subject = form.subject.trim() ? '' : 'Subject is required.'
  errors.message = form.message.trim().length >= 20 ? '' : 'At least 20 characters required.'
  return !Object.values(errors).some(Boolean)
}

async function submit() {
  if (rateLimitedUntil.value) return
  apiErr.value = ''
  if (!validate()) return
  loading.value = true
  try {
    await api.post('/support/tickets', {
      name:                 form.name.trim(),
      email:                form.email.trim(),
      category:             form.category,
      subject:              form.subject.trim(),
      message:              form.message.trim(),
      documentationChecked: true,
      faqChecked:           true,
      sourceUrl:            import.meta.client ? window.location.href : null,
    })
    if (import.meta.client) {
      localStorage.setItem(RATE_LIMIT_KEY, String(Date.now()))
    }
    doneEmail.value = form.email.trim()
    step.value = 'done'
  } catch {
    apiErr.value = 'Something went wrong. Please try again later.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="-m-5 mb-6">
    <PageCover title="Support" subtitle="Describe your issue and our team will get back to you." :icon="LifeBuoy"
      icon-bg="rgba(139,92,246,0.25)" icon-color="rgba(167,139,250,0.95)" />
  </div>

  <div class="max-w-2xl mx-auto">

    <!-- Step: form -->
    <div v-if="step === 'form'" class="rounded-xl p-6 space-y-5"
      style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);">
      <div>
        <p class="text-[13px] font-bold" style="color:rgba(255,255,255,0.80);">Support request</p>
        <p class="mt-0.5 text-[11px]" style="color:rgba(255,255,255,0.30);">The admin team will review your request.</p>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="color:rgba(255,255,255,0.30);">Name</label>
          <input v-model="form.name" :disabled="loading" placeholder="Jane Smith"
            class="w-full rounded-xl px-3.5 py-2.5 text-[12px] text-white outline-none transition-colors focus:border-indigo-500/40 disabled:opacity-50"
            style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);" />
          <p v-if="errors.name" class="mt-1 text-[10px]" style="color:rgba(242,63,66,0.80);">{{ errors.name }}</p>
        </div>
        <div>
          <label class="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="color:rgba(255,255,255,0.30);">Email</label>
          <input v-model="form.email" type="email" :disabled="loading" placeholder="you@example.com"
            class="w-full rounded-xl px-3.5 py-2.5 text-[12px] text-white outline-none transition-colors focus:border-indigo-500/40 disabled:opacity-50"
            style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);" />
          <p v-if="errors.email" class="mt-1 text-[10px]" style="color:rgba(242,63,66,0.80);">{{ errors.email }}</p>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-[180px_1fr]">
        <div>
          <label class="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="color:rgba(255,255,255,0.30);">Category</label>
          <select v-model="form.category" :disabled="loading"
            class="w-full rounded-xl px-3.5 py-2.5 text-[12px] text-white outline-none disabled:opacity-50 cursor-pointer"
            style="background:rgba(30,31,34,0.95);border:1px solid rgba(255,255,255,0.09);">
            <option v-for="cat in categories" :key="cat.value" :value="cat.value">{{ cat.label }}</option>
          </select>
        </div>
        <div>
          <label class="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="color:rgba(255,255,255,0.30);">Subject</label>
          <input v-model="form.subject" :disabled="loading" placeholder="Short summary"
            class="w-full rounded-xl px-3.5 py-2.5 text-[12px] text-white outline-none transition-colors focus:border-indigo-500/40 disabled:opacity-50"
            style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);" />
          <p v-if="errors.subject" class="mt-1 text-[10px]" style="color:rgba(242,63,66,0.80);">{{ errors.subject }}</p>
        </div>
      </div>

      <div>
        <label class="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="color:rgba(255,255,255,0.30);">Message</label>
        <textarea v-model="form.message" rows="6" :disabled="loading"
          placeholder="What happened? What did you expect? Which version or platform?"
          class="w-full resize-y rounded-xl px-3.5 py-2.5 text-[12px] leading-relaxed text-white outline-none transition-colors focus:border-indigo-500/40 disabled:opacity-50"
          style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);" />
        <p v-if="errors.message" class="mt-1 text-[10px]" style="color:rgba(242,63,66,0.80);">{{ errors.message }}</p>
      </div>

      <!-- Rate limit notice -->
      <div v-if="rateLimitedUntil" class="flex items-center gap-2 rounded-xl px-4 py-3 text-[12px]"
        style="background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.18);color:rgba(245,158,11,0.80);">
        <Clock class="h-3.5 w-3.5 shrink-0" />
        You can submit another request in {{ Math.floor(rateLimitSeconds / 60) }}:{{ String(rateLimitSeconds % 60).padStart(2, '0') }}
      </div>

      <p v-if="apiErr" class="text-[12px]" style="color:rgba(242,63,66,0.80);">{{ apiErr }}</p>

      <button
        :disabled="loading || !!rateLimitedUntil"
        class="w-full flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-[13px] font-bold transition-colors disabled:opacity-50 cursor-pointer"
        style="background:rgba(139,92,246,0.14);border:1px solid rgba(139,92,246,0.28);color:rgba(167,139,250,0.92);"
        @click="submit">
        <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
        <Send v-else class="h-4 w-4" />
        {{ loading ? 'Sending…' : 'Send request' }}
      </button>
    </div>

    <!-- Step: done -->
    <div v-else class="rounded-xl p-8 text-center"
      style="background:rgba(35,165,90,0.04);border:1px solid rgba(35,165,90,0.18);">
      <div class="mx-auto mb-4 h-14 w-14 flex items-center justify-center rounded-2xl"
        style="background:rgba(35,165,90,0.08);border:1px solid rgba(35,165,90,0.20);">
        <CheckCircle2 class="h-7 w-7" style="color:rgba(35,165,90,0.85);" />
      </div>
      <h2 class="font-display text-[24px] font-black uppercase" style="color:rgba(255,255,255,0.90);">Request received</h2>
      <p class="mx-auto mt-3 max-w-sm text-[13px] leading-relaxed" style="color:rgba(255,255,255,0.45);">
        Your support request was saved. The admin team will review it and any reply will go to {{ doneEmail }}.
      </p>
      <NuxtLink to="/" class="mt-6 inline-block text-[11px] transition-colors hover:text-white/60"
        style="color:rgba(255,255,255,0.30);">Back to home</NuxtLink>
    </div>

  </div>
</template>
