<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { Braces, CalendarClock, Check, FileText, Loader2, Mail, Monitor, RotateCcw, Save, Send, Smartphone } from 'lucide-vue-next'
import { useMarketingStore } from '~/stores/marketing'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Comms' })

const store = useMarketingStore()
const {
  campaignKind,
  deliveryMode,
  draft,
  loading,
  error,
  previewDevice,
  scheduledFor,
  segments,
  selectedTemplateId,
  currentTemplates,
  selectedSegmentIds,
  selectedSegments,
  totalRecipients,
} = storeToRefs(store)

const notice = ref('')
const actionError = ref('')
const saving = ref(false)
const sending = ref(false)
const testEmail = ref('')

const campaignKinds = [
  { value: 'internal_update', label: 'Internal Update' },
  { value: 'release_note', label: 'Release Note' },
  { value: 'operational_notice', label: 'Ops Notice' },
] as const

const variableTokens = [
  { token: 'distribution.names', label: 'List names' },
  { token: 'distribution.count', label: 'List count' },
  { token: 'distribution.ownerTeams', label: 'Owner teams' },
  { token: 'recipients.count', label: 'Recipients' },
  { token: 'system.date', label: 'Date' },
]

onMounted(() => store.loadAll())

const tokenContext = computed<Record<string, string>>(() => ({
  'distribution.names': selectedSegments.value.map((segment) => segment.name).join(', ') || 'Selected lists',
  'distribution.count': String(selectedSegments.value.length),
  'distribution.ownerTeams': [...new Set(selectedSegments.value.map((segment) => segment.ownerTeam))].join(', ') || 'Marketing',
  'recipients.count': String(totalRecipients.value),
  'system.date': new Date().toISOString().slice(0, 10),
}))
const resolveTokens = (value: string) => value.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, key: string) => tokenContext.value[key] ?? `{{${key}}}`)
const bodyLines = computed(() => resolveTokens(draft.value.body).split('\n').filter(Boolean))
const previewSubject = computed(() => resolveTokens(draft.value.subject || 'Subject line'))
const previewPreheader = computed(() => resolveTokens(draft.value.preheader || 'Preheader text'))
const previewTitle = computed(() => resolveTokens(draft.value.title || 'Internal update'))
const previewCta = computed(() => resolveTokens(draft.value.ctaLabel || ''))
const subjectCount = computed(() => draft.value.subject.length)
const previewWidthClass = computed(() => previewDevice.value === 'mobile' ? 'max-w-[360px]' : 'max-w-[620px]')

function applySelectedTemplate() {
  const template = currentTemplates.value.find((item) => item.id === selectedTemplateId.value)
  if (template) store.applyTemplate(template)
}

function insertToken(token: string) {
  draft.value.body = `${draft.value.body}${draft.value.body.endsWith('\n') || !draft.value.body ? '' : ' '}{{${token}}}`
}

async function saveDraft() {
  saving.value = true
  notice.value = ''
  actionError.value = ''
  try {
    await store.saveCampaign()
    notice.value = 'Comms draft saved to the API.'
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : 'Unable to save draft.'
  } finally {
    saving.value = false
  }
}

async function send(testOnly = false) {
  sending.value = true
  notice.value = ''
  actionError.value = ''
  try {
    const result = await store.sendCampaign({
      testOnly,
      testEmail: testOnly ? testEmail.value : undefined,
    })
    notice.value = testOnly
      ? `Test email sent to ${testEmail.value}.`
      : `Comms sent through SMTP to ${result.recipients} recipient${result.recipients === 1 ? '' : 's'}.`
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : 'Unable to send comms.'
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-5">
    <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <p class="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-teal/65">Internal Email</p>
        <h1 class="text-[26px] font-display font-black uppercase tracking-wide text-white/90">Comms</h1>
        <p class="mt-1 text-[13px] text-white/42">Compose internal updates and send through the API SMTP transport.</p>
      </div>
      <div class="grid grid-cols-3 gap-2 md:min-w-[430px]">
        <div class="rounded-md border border-white/[0.08] bg-white/[0.025] px-3 py-2">
          <p class="text-[10px] uppercase tracking-[0.12em] text-white/28">Recipients</p>
          <p class="mt-1 text-lg font-semibold text-white/88">{{ totalRecipients.toLocaleString() }}</p>
        </div>
        <div class="rounded-md border border-white/[0.08] bg-white/[0.025] px-3 py-2">
          <p class="text-[10px] uppercase tracking-[0.12em] text-white/28">Lists</p>
          <p class="mt-1 text-lg font-semibold text-teal">{{ selectedSegments.length }}</p>
        </div>
        <div class="rounded-md border border-white/[0.08] bg-white/[0.025] px-3 py-2">
          <p class="text-[10px] uppercase tracking-[0.12em] text-white/28">Subject</p>
          <p class="mt-1 text-lg font-semibold" :class="subjectCount > 70 ? 'text-warn' : 'text-white/88'">{{ subjectCount }}</p>
        </div>
      </div>
    </div>

    <div v-if="notice" class="rounded-md border border-teal/20 bg-teal/10 px-4 py-2.5 text-[12px] text-teal/90">
      {{ notice }}
    </div>
    <div v-if="actionError || error" class="rounded-md border border-err/20 bg-err/10 px-4 py-2.5 text-[12px] text-err/85">
      {{ actionError || error }}
    </div>

    <div class="grid gap-5 xl:grid-cols-[360px_1fr_420px]">
      <section class="space-y-5">
        <div class="rounded-md border border-white/[0.08] bg-white/[0.025] p-4">
          <h2 class="mb-3 text-[13px] font-semibold text-white/82">Comms Type</h2>
          <div class="grid grid-cols-1 gap-2">
            <button
              v-for="kind in campaignKinds"
              :key="kind.value"
              class="flex items-center justify-between rounded-md border px-3 py-2 text-left text-[12px] transition-colors"
              :class="campaignKind === kind.value ? 'border-teal/35 bg-teal/12 text-teal' : 'border-white/[0.08] bg-white/[0.025] text-white/55 hover:bg-white/[0.05]'"
              @click="campaignKind = kind.value"
            >
              <span>{{ kind.label }}</span>
              <Check v-if="campaignKind === kind.value" class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div class="rounded-md border border-white/[0.08] bg-white/[0.025] p-4">
          <div class="mb-3 flex items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <FileText class="h-4 w-4 text-teal/70" />
              <h2 class="text-[13px] font-semibold text-white/82">Template</h2>
            </div>
            <NuxtLink to="/templates" class="text-[11px] font-medium text-teal/80 hover:text-teal">Manage</NuxtLink>
          </div>
          <select v-model="selectedTemplateId" class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45" @change="applySelectedTemplate">
            <option value="">Blank composer</option>
            <option v-for="template in currentTemplates" :key="template.id" :value="template.id">{{ template.name }}</option>
          </select>
          <p class="mt-2 text-[11px] text-white/30">{{ currentTemplates.length }} template{{ currentTemplates.length === 1 ? '' : 's' }} for this comms type.</p>
        </div>

        <div class="rounded-md border border-white/[0.08] bg-white/[0.025] p-4">
          <div class="mb-3 flex items-center justify-between gap-3">
            <h2 class="text-[13px] font-semibold text-white/82">Distribution Lists</h2>
            <NuxtLink to="/audiences" class="text-[11px] font-medium text-teal/80 hover:text-teal">Manage</NuxtLink>
          </div>
          <div v-if="loading" class="space-y-2">
            <div v-for="i in 3" :key="i" class="h-12 animate-pulse rounded-md bg-white/[0.04]" />
          </div>
          <div v-else class="space-y-2">
            <button
              v-for="segment in segments"
              :key="segment.id"
              class="flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-left transition-colors"
              :class="selectedSegmentIds.includes(segment.id) ? 'border-teal/30 bg-teal/10' : 'border-white/[0.08] bg-white/[0.025] hover:bg-white/[0.05]'"
              @click="store.toggleSegment(segment.id)"
            >
              <span class="min-w-0">
                <span class="block truncate text-[12px] font-medium text-white/78">{{ segment.name }}</span>
                <span class="mt-0.5 block text-[11px] text-white/30">{{ segment.ownerTeam }} Â· {{ segment.status }}</span>
              </span>
              <span class="flex h-4 w-4 shrink-0 items-center justify-center rounded border" :class="selectedSegmentIds.includes(segment.id) ? 'border-teal bg-teal text-base' : 'border-white/15'">
                <Check v-if="selectedSegmentIds.includes(segment.id)" class="h-3 w-3" />
              </span>
            </button>
            <p v-if="!segments.length" class="rounded-md border border-white/[0.08] bg-white/[0.025] px-3 py-4 text-center text-[12px] text-white/35">
              Add a distribution list before sending.
            </p>
          </div>
        </div>
      </section>

      <section class="rounded-md border border-white/[0.08] bg-white/[0.025] p-4">
        <div class="mb-4 flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <Mail class="h-4 w-4 text-teal/80" />
            <h2 class="text-[13px] font-semibold text-white/82">Composer</h2>
          </div>
          <button class="flex items-center gap-1.5 rounded-md border border-white/[0.08] px-2.5 py-1.5 text-[11px] text-white/45 transition-colors hover:bg-white/[0.05] hover:text-white/75" @click="store.resetDraft">
            <RotateCcw class="h-3.5 w-3.5" />
            Reset
          </button>
        </div>

        <div>
          <label class="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/32">Internal title</label>
          <input v-model="draft.title" class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45" />
        </div>

        <div class="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <label class="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/32">From name</label>
            <input v-model="draft.fromName" class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45" />
          </div>
          <div>
            <label class="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/32">From email</label>
            <input v-model="draft.fromEmail" class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45" />
          </div>
        </div>

        <div class="mt-3">
          <label class="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/32">Subject</label>
          <input v-model="draft.subject" class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45" />
        </div>

        <div class="mt-3">
          <label class="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/32">Preheader</label>
          <input v-model="draft.preheader" class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45" />
        </div>

        <div class="mt-3">
          <label class="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/32">Body</label>
          <div class="mb-2 flex flex-wrap gap-1.5">
            <button
              v-for="item in variableTokens"
              :key="item.token"
              class="inline-flex items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[10px] text-white/48 transition-colors hover:border-teal/35 hover:text-teal"
              @click="insertToken(item.token)"
            >
              <Braces class="h-3 w-3" />
              {{ item.label }}
            </button>
          </div>
          <textarea v-model="draft.body" rows="11" class="w-full resize-y rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] leading-6 text-white outline-none focus:border-teal/45" />
        </div>

        <div class="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <label class="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/32">CTA label</label>
            <input v-model="draft.ctaLabel" class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45" />
          </div>
          <div>
            <label class="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/32">CTA URL</label>
            <input v-model="draft.ctaUrl" class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45" />
          </div>
        </div>
      </section>

      <section class="space-y-5">
        <div class="rounded-md border border-white/[0.08] bg-white/[0.025] p-4">
          <div class="mb-3 flex items-center justify-between gap-3">
            <h2 class="text-[13px] font-semibold text-white/82">Preview</h2>
            <div class="flex rounded-md border border-white/[0.08] bg-white/[0.035] p-0.5">
              <button class="rounded px-2 py-1 text-[11px]" :class="previewDevice === 'desktop' ? 'bg-teal text-base' : 'text-white/45'" title="Desktop preview" @click="previewDevice = 'desktop'">
                <Monitor class="h-3.5 w-3.5" />
              </button>
              <button class="rounded px-2 py-1 text-[11px]" :class="previewDevice === 'mobile' ? 'bg-teal text-base' : 'text-white/45'" title="Mobile preview" @click="previewDevice = 'mobile'">
                <Smartphone class="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div class="mx-auto overflow-hidden rounded-md border border-white/[0.08] bg-[#f7f8fb] text-[#15171c]" :class="previewWidthClass">
            <div class="border-b border-black/10 px-4 py-3">
              <p class="text-[11px] font-semibold text-black/55">{{ draft.fromName }} &lt;{{ draft.fromEmail }}&gt;</p>
              <p class="mt-1 text-[13px] font-bold">{{ previewSubject }}</p>
              <p class="mt-0.5 text-[11px] text-black/45">{{ previewPreheader }}</p>
            </div>
            <div class="px-5 py-6">
              <img src="/icon.png" alt="" class="mb-5 h-9 w-9 rounded-md" />
              <p class="font-display text-[22px] font-black uppercase leading-tight">{{ previewTitle }}</p>
              <div class="mt-4 space-y-3 text-[13px] leading-6 text-black/70">
                <p v-for="(line, index) in bodyLines" :key="index">{{ line }}</p>
              </div>
              <a v-if="draft.ctaLabel" :href="draft.ctaUrl || '#'" class="mt-5 inline-flex rounded-md bg-[#111215] px-4 py-2 text-[12px] font-bold text-white">
                {{ previewCta }}
              </a>
            </div>
          </div>
        </div>

        <div class="rounded-md border border-white/[0.08] bg-white/[0.025] p-4">
          <h2 class="mb-3 text-[13px] font-semibold text-white/82">Delivery</h2>
          <div class="grid grid-cols-2 gap-2">
            <button class="rounded-md border px-3 py-2 text-[12px]" :class="deliveryMode === 'now' ? 'border-teal/35 bg-teal/12 text-teal' : 'border-white/[0.08] text-white/50'" @click="deliveryMode = 'now'">
              Send now
            </button>
            <button class="rounded-md border px-3 py-2 text-[12px]" :class="deliveryMode === 'schedule' ? 'border-teal/35 bg-teal/12 text-teal' : 'border-white/[0.08] text-white/50'" @click="deliveryMode = 'schedule'">
              Schedule
            </button>
          </div>
          <div v-if="deliveryMode === 'schedule'" class="mt-3">
            <label class="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/32">Scheduled time</label>
            <div class="relative">
              <CalendarClock class="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" />
              <input v-model="scheduledFor" type="datetime-local" class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] py-2 pl-9 pr-3 text-[12px] text-white outline-none focus:border-teal/45" />
            </div>
          </div>
          <div class="mt-3">
            <label class="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/32">Test recipient</label>
            <input v-model="testEmail" type="email" class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45" placeholder="teammate@vindicter.xyz" />
          </div>
          <div class="mt-4 grid grid-cols-3 gap-2">
            <button class="flex items-center justify-center gap-1.5 rounded-md border border-white/[0.08] px-3 py-2 text-[12px] text-white/58 transition-colors hover:bg-white/[0.05] disabled:opacity-60" :disabled="saving" @click="saveDraft">
              <Loader2 v-if="saving" class="h-3.5 w-3.5 animate-spin" />
              <Save v-else class="h-3.5 w-3.5" />
              Save
            </button>
            <button class="rounded-md border border-white/[0.08] px-3 py-2 text-[12px] text-white/58 transition-colors hover:bg-white/[0.05] disabled:opacity-60" :disabled="sending || !testEmail" @click="send(true)">Test</button>
            <button class="flex items-center justify-center gap-2 rounded-md bg-teal px-3 py-2 text-[12px] font-bold text-base transition-colors hover:bg-teal/90 disabled:opacity-60" :disabled="sending || !selectedSegmentIds.length" @click="send(false)">
              <Loader2 v-if="sending" class="h-3.5 w-3.5 animate-spin" />
              <Send v-else class="h-3.5 w-3.5" />
              Send
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

