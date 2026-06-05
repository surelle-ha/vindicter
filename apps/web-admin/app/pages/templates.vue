<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { Braces, Check, FileText, Loader2, Plus, Save, WandSparkles } from 'lucide-vue-next'
import { useMarketingStore, type CampaignKind } from '~/stores/marketing'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Templates' })

const store = useMarketingStore()
const { templates, loading, error } = storeToRefs(store)

const saving = ref(false)
const notice = ref('')
const actionError = ref('')

const campaignKinds = [
  { value: 'internal_update', label: 'Internal Update' },
  { value: 'release_note', label: 'Release Note' },
  { value: 'operational_notice', label: 'Ops Notice' },
] as const

const sourceTokens = [
  { value: 'distribution.names', label: 'Distribution names' },
  { value: 'distribution.count', label: 'Distribution count' },
  { value: 'distribution.ownerTeams', label: 'Owner teams' },
  { value: 'recipients.count', label: 'Recipient count' },
  { value: 'system.date', label: 'Send date' },
] as const

const template = reactive<{
  name: string
  campaignKind: CampaignKind
  subject: string
  preheader: string
  body: string
  ctaLabel: string
  ctaUrl: string
  status: 'draft' | 'active' | 'archived'
}>({
  name: 'Release readiness brief',
  campaignKind: 'internal_update',
  subject: 'Brief for {{distribution.names}}',
  preheader: 'Prepared for {{recipients.count}} internal recipients.',
  body: 'Team,\n\nThis template is scoped to {{distribution.names}} and owned by {{distribution.ownerTeams}}.\n\nSend date: {{system.date}}',
  ctaLabel: 'Open brief',
  ctaUrl: 'https://vindicter.xyz',
  status: 'active',
})

const variableRows = ref([
  { label: 'Audience', token: 'distribution.names' },
  { label: 'Owner team', token: 'distribution.ownerTeams' },
  { label: 'Recipient count', token: 'recipients.count' },
])

const filteredTemplates = computed(() =>
  templates.value.filter((item) => item.campaignKind === template.campaignKind)
)

const variableMap = computed(() =>
  Object.fromEntries(variableRows.value.filter((row) => row.label && row.token).map((row) => [row.label, row.token]))
)

const bodyLines = computed(() => template.body.split('\n').filter(Boolean))
const templateScore = computed(() => {
  let score = 0
  if (template.subject.includes('{{')) score += 25
  if (template.preheader) score += 20
  if (template.body.length > 80) score += 25
  if (template.ctaLabel && template.ctaUrl) score += 15
  if (variableRows.value.length >= 2) score += 15
  return Math.min(score, 100)
})

onMounted(() => store.loadAll())

function addVariableRow() {
  variableRows.value.push({ label: '', token: 'distribution.names' })
}

function insertToken(token: string) {
  template.body = `${template.body}${template.body.endsWith('\n') || !template.body ? '' : ' '}{{${token}}}`
}

async function saveTemplate() {
  saving.value = true
  notice.value = ''
  actionError.value = ''
  try {
    await store.saveTemplate({
      name: template.name,
      campaignKind: template.campaignKind,
      subject: template.subject,
      preheader: template.preheader || undefined,
      body: template.body,
      ctaLabel: template.ctaLabel || undefined,
      ctaUrl: template.ctaUrl || undefined,
      status: template.status,
      variableMap: variableMap.value,
    })
    notice.value = 'Template saved to the marketing API.'
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : 'Unable to save template.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-5">
    <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <p class="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-teal/65">Reusable Comms</p>
        <h1 class="font-display text-[26px] font-black uppercase tracking-wide text-white/90">Templates</h1>
        <p class="mt-1 text-[13px] text-white/42">Create per-type templates with mapped variables for distribution attributes.</p>
      </div>
      <div class="grid grid-cols-3 gap-2 md:min-w-[430px]">
        <div class="rounded-md border border-white/[0.08] bg-white/[0.025] px-3 py-2">
          <p class="text-[10px] uppercase tracking-[0.12em] text-white/28">Templates</p>
          <p class="mt-1 text-lg font-semibold text-white/88">{{ templates.length }}</p>
        </div>
        <div class="rounded-md border border-white/[0.08] bg-white/[0.025] px-3 py-2">
          <p class="text-[10px] uppercase tracking-[0.12em] text-white/28">This Type</p>
          <p class="mt-1 text-lg font-semibold text-teal">{{ filteredTemplates.length }}</p>
        </div>
        <div class="rounded-md border border-white/[0.08] bg-white/[0.025] px-3 py-2">
          <p class="text-[10px] uppercase tracking-[0.12em] text-white/28">Quality</p>
          <p class="mt-1 text-lg font-semibold text-white/88">{{ templateScore }}%</p>
        </div>
      </div>
    </div>

    <div v-if="notice" class="rounded-md border border-teal/20 bg-teal/10 px-4 py-2.5 text-[12px] text-teal/90">
      {{ notice }}
    </div>
    <div v-if="actionError || error" class="rounded-md border border-err/20 bg-err/10 px-4 py-2.5 text-[12px] text-err/85">
      {{ actionError || error }}
    </div>

    <div class="grid gap-5 xl:grid-cols-[420px_1fr_360px]">
      <section class="space-y-5">
        <div class="rounded-md border border-white/[0.08] bg-white/[0.025] p-4">
          <h2 class="mb-3 text-[13px] font-semibold text-white/82">Comms Type</h2>
          <div class="grid gap-2">
            <button
              v-for="kind in campaignKinds"
              :key="kind.value"
              class="flex items-center justify-between rounded-md border px-3 py-2 text-left text-[12px] transition-colors"
              :class="template.campaignKind === kind.value ? 'border-teal/35 bg-teal/12 text-teal' : 'border-white/[0.08] bg-white/[0.025] text-white/55 hover:bg-white/[0.05]'"
              @click="template.campaignKind = kind.value"
            >
              <span>{{ kind.label }}</span>
              <Check v-if="template.campaignKind === kind.value" class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div class="rounded-md border border-white/[0.08] bg-white/[0.025] p-4">
          <div class="mb-3 flex items-center justify-between">
            <h2 class="text-[13px] font-semibold text-white/82">Variable Mapping</h2>
            <button class="flex items-center gap-1.5 rounded-md border border-white/[0.08] px-2 py-1 text-[11px] text-white/50 hover:bg-white/[0.05]" @click="addVariableRow">
              <Plus class="h-3.5 w-3.5" />
              Add
            </button>
          </div>
          <div class="space-y-2">
            <div v-for="(row, index) in variableRows" :key="index" class="grid grid-cols-[1fr_1.2fr] gap-2">
              <input v-model="row.label" class="rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45" placeholder="Variable label" />
              <select v-model="row.token" class="rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45">
                <option v-for="source in sourceTokens" :key="source.value" :value="source.value">{{ source.label }}</option>
              </select>
            </div>
          </div>
          <div class="mt-3 flex flex-wrap gap-1.5">
            <button
              v-for="source in sourceTokens"
              :key="source.value"
              class="inline-flex items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[10px] text-white/48 transition-colors hover:border-teal/35 hover:text-teal"
              @click="insertToken(source.value)"
            >
              <Braces class="h-3 w-3" />
              {{ source.label }}
            </button>
          </div>
        </div>
      </section>

      <section class="rounded-md border border-white/[0.08] bg-white/[0.025] p-4">
        <div class="mb-4 flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <WandSparkles class="h-4 w-4 text-teal/80" />
            <h2 class="text-[13px] font-semibold text-white/82">Template Builder</h2>
          </div>
          <button class="flex items-center justify-center gap-1.5 rounded-md bg-teal px-3 py-2 text-[12px] font-bold text-base transition-colors hover:bg-teal/90 disabled:opacity-60" :disabled="saving" @click="saveTemplate">
            <Loader2 v-if="saving" class="h-3.5 w-3.5 animate-spin" />
            <Save v-else class="h-3.5 w-3.5" />
            Save template
          </button>
        </div>

        <div>
          <label class="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/32">Template name</label>
          <input v-model="template.name" class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45" />
        </div>

        <div class="mt-3 grid gap-3 md:grid-cols-[1fr_150px]">
          <div>
            <label class="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/32">Subject</label>
            <input v-model="template.subject" class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45" />
          </div>
          <div>
            <label class="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/32">Status</label>
            <select v-model="template.status" class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45">
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div class="mt-3">
          <label class="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/32">Preheader</label>
          <input v-model="template.preheader" class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45" />
        </div>

        <div class="mt-3">
          <label class="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/32">Body</label>
          <textarea v-model="template.body" rows="12" class="w-full resize-y rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] leading-6 text-white outline-none focus:border-teal/45" />
        </div>

        <div class="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <label class="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/32">CTA label</label>
            <input v-model="template.ctaLabel" class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45" />
          </div>
          <div>
            <label class="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/32">CTA URL</label>
            <input v-model="template.ctaUrl" class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45" />
          </div>
        </div>
      </section>

      <section class="space-y-5">
        <div class="rounded-md border border-white/[0.08] bg-white/[0.025] p-4">
          <div class="mb-3 flex items-center gap-2">
            <FileText class="h-4 w-4 text-teal/80" />
            <h2 class="text-[13px] font-semibold text-white/82">Preview</h2>
          </div>
          <div class="overflow-hidden rounded-md border border-white/[0.08] bg-[#f7f8fb] text-[#15171c]">
            <div class="border-b border-black/10 px-4 py-3">
              <p class="text-[11px] text-black/45">{{ template.preheader || 'Preheader text' }}</p>
              <p class="mt-1 text-[13px] font-bold">{{ template.subject || 'Subject line' }}</p>
            </div>
            <div class="px-5 py-6">
              <p class="font-display text-[20px] font-black uppercase leading-tight">{{ template.name || 'Template name' }}</p>
              <div class="mt-4 space-y-3 text-[13px] leading-6 text-black/70">
                <p v-for="(line, index) in bodyLines" :key="index">{{ line }}</p>
              </div>
              <a v-if="template.ctaLabel" :href="template.ctaUrl || '#'" class="mt-5 inline-flex rounded-md bg-[#111215] px-4 py-2 text-[12px] font-bold text-white">
                {{ template.ctaLabel }}
              </a>
            </div>
          </div>
        </div>

        <div class="rounded-md border border-white/[0.08] bg-white/[0.025] p-4">
          <h2 class="mb-3 text-[13px] font-semibold text-white/82">Library</h2>
          <div v-if="loading" class="space-y-2">
            <div v-for="i in 4" :key="i" class="h-14 animate-pulse rounded-md bg-white/[0.04]" />
          </div>
          <div v-else class="space-y-2">
            <div v-for="item in filteredTemplates.slice(0, 8)" :key="item.id" class="rounded-md border border-white/[0.08] bg-white/[0.025] px-3 py-2">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="truncate text-[12px] font-semibold text-white/82">{{ item.name }}</p>
                  <p class="mt-0.5 truncate text-[11px] text-white/35">{{ item.subject }}</p>
                </div>
                <span class="shrink-0 rounded border px-1.5 py-0.5 text-[10px]" :class="item.status === 'active' ? 'border-teal/25 bg-teal/10 text-teal' : 'border-white/[0.08] text-white/35'">{{ item.status }}</span>
              </div>
            </div>
            <p v-if="!filteredTemplates.length" class="rounded-md border border-white/[0.08] bg-white/[0.025] px-3 py-4 text-center text-[12px] text-white/35">
              No templates for this comms type yet.
            </p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
