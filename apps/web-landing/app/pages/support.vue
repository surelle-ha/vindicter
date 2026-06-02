<script setup lang="ts">
import { BookOpen, CheckCircle2, HelpCircle, LifeBuoy, Loader2, Mail, Send } from 'lucide-vue-next'

useLandingSeo({
  title: 'Support - Vindicter',
  description: 'Get help with Vindicter after checking the documentation and frequently asked questions.',
  path: '/support',
})

type SupportStep = 'check' | 'form' | 'done'
type SupportCategory = 'setup' | 'scan' | 'billing' | 'bug' | 'other'

const step = ref<SupportStep>('check')
const loading = ref(false)
const apiError = ref('')
const successEmail = ref('')

const form = reactive({
  name: '',
  email: '',
  category: 'setup' as SupportCategory,
  subject: '',
  message: '',
  documentationChecked: false,
  faqChecked: false,
})

const errors = reactive({
  name: '',
  email: '',
  subject: '',
  message: '',
  checks: '',
})

const categories: Array<{ value: SupportCategory; label: string }> = [
  { value: 'setup', label: 'Setup or install' },
  { value: 'scan', label: 'Scanning or findings' },
  { value: 'billing', label: 'Beta or account' },
  { value: 'bug', label: 'Bug report' },
  { value: 'other', label: 'Something else' },
]

function showSupportForm() {
  form.documentationChecked = true
  form.faqChecked = true
  step.value = 'form'
}

function validate() {
  errors.name = form.name.trim() ? '' : 'Name is required.'
  errors.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) ? '' : 'Enter a valid email address.'
  errors.subject = form.subject.trim() ? '' : 'Subject is required.'
  errors.message = form.message.trim().length >= 20 ? '' : 'Please share at least 20 characters so we have context.'
  errors.checks = form.documentationChecked && form.faqChecked ? '' : 'Please confirm that you checked the docs and FAQ first.'

  return !Object.values(errors).some(Boolean)
}

async function submitSupport() {
  apiError.value = ''
  if (!validate()) return

  loading.value = true
  try {
    const supabase = useSupabase()
    const { error } = await supabase
      .from('support_tickets')
      .insert({
        name: form.name.trim(),
        email: form.email.trim(),
        category: form.category,
        subject: form.subject.trim(),
        message: form.message.trim(),
        documentation_checked: form.documentationChecked,
        faq_checked: form.faqChecked,
        source_url: import.meta.client ? window.location.href : null,
      })

    if (error) throw error
    successEmail.value = form.email.trim()
    step.value = 'done'
  } catch {
    apiError.value = 'Something went wrong. Please try again or email support@vindicta.xyz.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex flex-1 flex-col">
    <main class="flex-1 px-6 py-28">
      <div class="mx-auto max-w-4xl">
        <div class="mb-10 text-center">
          <div class="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-accent/25 bg-accent/10">
            <LifeBuoy class="h-8 w-8 text-accent" />
          </div>
          <h1 class="font-display text-[44px] font-black uppercase leading-none tracking-wide sm:text-[60px]">
            Developer Support
          </h1>
          <p class="mx-auto mt-5 max-w-xl text-[14px] leading-relaxed text-white/48">
            Start with the docs and FAQ. If your question is still open, send the support request and the admin team can review it from the new dashboard.
          </p>
        </div>

        <section v-if="step === 'check'" class="rounded-2xl border border-white/8 bg-surface/60 p-6 sm:p-8">
          <div class="mb-6 flex items-start gap-4">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-warn/20 bg-warn/8">
              <HelpCircle class="h-5 w-5 text-warn" />
            </div>
            <div>
              <h2 class="text-[16px] font-bold text-white">Has this already been answered?</h2>
              <p class="mt-1 text-[13px] leading-relaxed text-white/45">
                Many setup, scanning, beta, and local-first questions are covered in the documentation or FAQ.
              </p>
            </div>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <NuxtLink
              to="/docs"
              class="flex items-center gap-4 rounded-xl border border-white/8 bg-white/[0.03] px-5 py-4 transition hover:border-accent/30 hover:bg-white/[0.05]"
            >
              <BookOpen class="h-5 w-5 shrink-0 text-accent" />
              <div>
                <p class="text-[13px] font-bold text-white">Documentation</p>
                <p class="text-[11px] text-white/35">Install, configure, scan, and triage.</p>
              </div>
            </NuxtLink>

            <NuxtLink
              to="/faq"
              class="flex items-center gap-4 rounded-xl border border-white/8 bg-white/[0.03] px-5 py-4 transition hover:border-accent/30 hover:bg-white/[0.05]"
            >
              <HelpCircle class="h-5 w-5 shrink-0 text-accent" />
              <div>
                <p class="text-[13px] font-bold text-white">FAQ</p>
                <p class="text-[11px] text-white/35">Common beta and product questions.</p>
              </div>
            </NuxtLink>
          </div>

          <div class="mt-8 grid gap-3 sm:grid-cols-2">
            <NuxtLink
              to="/"
              class="inline-flex items-center justify-center gap-2 rounded-xl border border-ok/20 bg-ok/8 px-5 py-4 text-[13px] font-bold text-ok transition hover:bg-ok/12"
            >
              <CheckCircle2 class="h-4 w-4" />
              Yes, I found my answer
            </NuxtLink>
            <button
              class="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-4 text-[13px] font-bold text-white transition hover:bg-accent/90"
              @click="showSupportForm"
            >
              <Mail class="h-4 w-4" />
              No, I still need help
            </button>
          </div>
        </section>

        <section v-else-if="step === 'form'" class="rounded-2xl border border-white/8 bg-surface/60 p-6 sm:p-8">
          <div class="mb-6">
            <p class="text-[13px] font-bold text-white">Support request</p>
            <p class="mt-1 text-[12px] text-white/35">This creates a read-only support item for admins to review.</p>
          </div>

          <div class="grid gap-5 sm:grid-cols-2">
            <div>
              <label class="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-2">Name</label>
              <input v-model="form.name" :disabled="loading" class="w-full rounded-xl border border-white/8 bg-white/[0.04] px-4 py-3 text-[13px] text-white placeholder-white/20 outline-none transition-colors focus:border-accent/40 disabled:opacity-50" placeholder="Jane Smith" />
              <p v-if="errors.name" class="mt-1 text-[11px] text-err/80">{{ errors.name }}</p>
            </div>

            <div>
              <label class="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-2">Email</label>
              <input v-model="form.email" type="email" :disabled="loading" class="w-full rounded-xl border border-white/8 bg-white/[0.04] px-4 py-3 text-[13px] text-white placeholder-white/20 outline-none transition-colors focus:border-accent/40 disabled:opacity-50" placeholder="you@example.com" />
              <p v-if="errors.email" class="mt-1 text-[11px] text-err/80">{{ errors.email }}</p>
            </div>
          </div>

          <div class="mt-5 grid gap-5 sm:grid-cols-[220px_1fr]">
            <div>
              <label class="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-2">Category</label>
              <select v-model="form.category" :disabled="loading" class="w-full rounded-xl border border-white/8 bg-[#1e1f22] px-4 py-3 text-[13px] text-white outline-none transition-colors focus:border-accent/40 disabled:opacity-50">
                <option v-for="category in categories" :key="category.value" :value="category.value">{{ category.label }}</option>
              </select>
            </div>

            <div>
              <label class="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-2">Subject</label>
              <input v-model="form.subject" :disabled="loading" class="w-full rounded-xl border border-white/8 bg-white/[0.04] px-4 py-3 text-[13px] text-white placeholder-white/20 outline-none transition-colors focus:border-accent/40 disabled:opacity-50" placeholder="Short summary" />
              <p v-if="errors.subject" class="mt-1 text-[11px] text-err/80">{{ errors.subject }}</p>
            </div>
          </div>

          <div class="mt-5">
            <label class="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-2">Message</label>
            <textarea v-model="form.message" rows="7" :disabled="loading" class="w-full resize-y rounded-xl border border-white/8 bg-white/[0.04] px-4 py-3 text-[13px] leading-relaxed text-white placeholder-white/20 outline-none transition-colors focus:border-accent/40 disabled:opacity-50" placeholder="What happened? What did you expect? Which version or platform are you using?" />
            <p v-if="errors.message" class="mt-1 text-[11px] text-err/80">{{ errors.message }}</p>
          </div>

          <div class="mt-5 space-y-3 rounded-xl border border-white/8 bg-white/[0.03] p-4">
            <label class="flex items-start gap-3 text-[12px] leading-relaxed text-white/50">
              <input v-model="form.documentationChecked" type="checkbox" class="mt-1 accent-[#8b5cf6]" />
              I checked the documentation and it did not answer this question.
            </label>
            <label class="flex items-start gap-3 text-[12px] leading-relaxed text-white/50">
              <input v-model="form.faqChecked" type="checkbox" class="mt-1 accent-[#8b5cf6]" />
              I checked the FAQ and still need support.
            </label>
            <p v-if="errors.checks" class="text-[11px] text-err/80">{{ errors.checks }}</p>
          </div>

          <p v-if="apiError" class="mt-5 text-[12px] text-err/80">{{ apiError }}</p>

          <div class="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              class="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-5 py-4 text-[13px] font-bold text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="loading"
              @click="submitSupport"
            >
              <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
              <Send v-else class="h-4 w-4" />
              {{ loading ? 'Sending...' : 'Send support request' }}
            </button>
            <button
              class="inline-flex items-center justify-center rounded-xl border border-white/10 px-5 py-4 text-[13px] font-semibold text-white/45 transition hover:bg-white/5 hover:text-white/70"
              :disabled="loading"
              @click="step = 'check'"
            >
              Back
            </button>
          </div>
        </section>

        <section v-else class="rounded-2xl border border-ok/20 bg-ok/5 p-8 text-center">
          <div class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-ok/25 bg-ok/10">
            <CheckCircle2 class="h-8 w-8 text-ok" />
          </div>
          <h2 class="font-display text-[30px] font-black uppercase">Request received</h2>
          <p class="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-white/50">
            Thanks. Your support request was saved and the team can review it in the admin dashboard. Replies will go to {{ successEmail }}.
          </p>
          <NuxtLink to="/" class="mt-7 inline-flex text-[12px] text-white/35 transition hover:text-white/65">
            Back to home
          </NuxtLink>
        </section>
      </div>
    </main>
  </div>
</template>
