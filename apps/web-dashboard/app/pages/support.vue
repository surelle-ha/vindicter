<script setup lang="ts">
import { LifeBuoy, Send, CheckCircle2, Loader2, BookOpen, HelpCircle, Mail } from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Support — Vindicter' })

const api = useApi()
const { user } = useAuth()

const landingUrl = computed(() => {
  if (import.meta.client && window.location.hostname === 'localhost') return 'http://localhost:3002'
  return 'https://vindicter.xyz'
})

type Step = 'check' | 'form' | 'done'
type Category = 'setup' | 'scan' | 'billing' | 'bug' | 'other'

const step    = ref<Step>('check')
const loading = ref(false)
const apiErr  = ref('')
const doneEmail = ref('')

const form = reactive({
  name: '',
  email: '',
  category: 'setup' as Category,
  subject: '',
  message: '',
  docsChecked: false,
  faqChecked: false,
})

const errors = reactive({ name: '', email: '', subject: '', message: '', checks: '' })

const categories: { value: Category; label: string }[] = [
  { value: 'setup',    label: 'Setup or install' },
  { value: 'scan',     label: 'Scanning or findings' },
  { value: 'billing',  label: 'Beta or account' },
  { value: 'bug',      label: 'Bug report' },
  { value: 'other',    label: 'Something else' },
]

onMounted(() => {
  if (user.value) {
    const u = user.value as any
    form.email = u.email ?? ''
    form.name  = u.displayName ?? ''
  }
})

function goToForm() {
  form.docsChecked = true
  form.faqChecked  = true
  step.value = 'form'
}

function validate() {
  errors.name    = form.name.trim() ? '' : 'Name is required.'
  errors.email   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) ? '' : 'Enter a valid email.'
  errors.subject = form.subject.trim() ? '' : 'Subject is required.'
  errors.message = form.message.trim().length >= 20 ? '' : 'At least 20 characters required.'
  errors.checks  = form.docsChecked && form.faqChecked ? '' : 'Please confirm you checked the docs and FAQ.'
  return !Object.values(errors).some(Boolean)
}

async function submit() {
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
      documentationChecked: form.docsChecked,
      faqChecked:           form.faqChecked,
      sourceUrl:            import.meta.client ? window.location.href : null,
    })
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
  <div class="-m-5 mb-0">
    <PageCover title="Support" subtitle="We're here to help. Search docs before submitting — most questions are answered there." :icon="LifeBuoy"
      icon-bg="rgba(139,92,246,0.25)" icon-color="rgba(167,139,250,0.95)" />
  </div>

  <div class="max-w-2xl mx-auto">

    <!-- Step: check docs first -->
    <div v-if="step === 'check'" class="rounded-xl p-6 space-y-5"
      style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);">
      <div class="flex items-start gap-3">
        <div class="h-8 w-8 flex items-center justify-center rounded-lg shrink-0"
          style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.18);">
          <HelpCircle class="h-4 w-4" style="color:rgba(245,158,11,0.75);" />
        </div>
        <div>
          <p class="text-[14px] font-bold" style="color:rgba(255,255,255,0.85);">Have you checked the docs and FAQ?</p>
          <p class="mt-1 text-[12px] leading-relaxed" style="color:rgba(255,255,255,0.40);">
            Many common questions about setup, scanning, and beta access are already answered.
          </p>
        </div>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <a :href="`${landingUrl}/docs`" target="_blank"
          class="flex items-center gap-3 rounded-xl px-4 py-3.5 transition-colors hover:bg-white/[0.04] cursor-pointer"
          style="border:1px solid rgba(255,255,255,0.07);">
          <BookOpen class="h-4 w-4 shrink-0" style="color:rgba(139,92,246,0.70);" />
          <div>
            <p class="text-[12px] font-bold" style="color:rgba(255,255,255,0.80);">Documentation</p>
            <p class="text-[10px] mt-0.5" style="color:rgba(255,255,255,0.30);">Install, configure, scan and triage</p>
          </div>
        </a>
        <a :href="`${landingUrl}/faq`" target="_blank"
          class="flex items-center gap-3 rounded-xl px-4 py-3.5 transition-colors hover:bg-white/[0.04] cursor-pointer"
          style="border:1px solid rgba(255,255,255,0.07);">
          <HelpCircle class="h-4 w-4 shrink-0" style="color:rgba(139,92,246,0.70);" />
          <div>
            <p class="text-[12px] font-bold" style="color:rgba(255,255,255,0.80);">FAQ</p>
            <p class="text-[10px] mt-0.5" style="color:rgba(255,255,255,0.30);">Common beta and product questions</p>
          </div>
        </a>
      </div>

      <div class="flex flex-col gap-2 sm:flex-row pt-2">
        <NuxtLink to="/"
          class="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[13px] font-bold transition-colors"
          style="background:rgba(35,165,90,0.06);border:1px solid rgba(35,165,90,0.18);color:rgba(35,165,90,0.85);">
          <CheckCircle2 class="h-4 w-4" /> Found my answer
        </NuxtLink>
        <button
          class="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[13px] font-bold transition-colors cursor-pointer"
          style="background:rgba(139,92,246,0.14);border:1px solid rgba(139,92,246,0.28);color:rgba(167,139,250,0.92);"
          @click="goToForm">
          <Mail class="h-4 w-4" /> Still need help
        </button>
      </div>
    </div>

    <!-- Step: form -->
    <div v-else-if="step === 'form'" class="rounded-xl p-6 space-y-5"
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

      <div class="rounded-xl p-4 space-y-3" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);">
        <label class="flex items-start gap-3 text-[12px] leading-relaxed text-white/50 cursor-pointer">
          <input v-model="form.docsChecked" type="checkbox" class="mt-0.5 accent-[#8b5cf6]" />
          I checked the documentation and it did not answer this question.
        </label>
        <label class="flex items-start gap-3 text-[12px] leading-relaxed text-white/50 cursor-pointer">
          <input v-model="form.faqChecked" type="checkbox" class="mt-0.5 accent-[#8b5cf6]" />
          I checked the FAQ and still need support.
        </label>
        <p v-if="errors.checks" class="text-[10px]" style="color:rgba(242,63,66,0.80);">{{ errors.checks }}</p>
      </div>

      <p v-if="apiErr" class="text-[12px]" style="color:rgba(242,63,66,0.80);">{{ apiErr }}</p>

      <div class="flex gap-3 flex-col sm:flex-row">
        <button
          :disabled="loading"
          class="flex-1 flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-[13px] font-bold transition-colors disabled:opacity-50 cursor-pointer"
          style="background:rgba(139,92,246,0.14);border:1px solid rgba(139,92,246,0.28);color:rgba(167,139,250,0.92);"
          @click="submit">
          <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
          <Send v-else class="h-4 w-4" />
          {{ loading ? 'Sending…' : 'Send request' }}
        </button>
        <button
          :disabled="loading"
          class="flex items-center justify-center rounded-xl px-5 py-3 text-[12px] font-semibold transition-colors disabled:opacity-50 cursor-pointer"
          style="border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.40);"
          @click="step = 'check'">Back</button>
      </div>
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
