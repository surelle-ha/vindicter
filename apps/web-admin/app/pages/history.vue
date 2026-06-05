<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { AlertTriangle, CheckCircle2, History, MailCheck, Search, TestTube2 } from 'lucide-vue-next'
import { useMarketingStore } from '~/stores/marketing'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Send History' })

const store = useMarketingStore()
const { sendHistory, campaigns, loading, error, failedSends } = storeToRefs(store)

const query = ref('')
const statusFilter = ref<'all' | 'sent' | 'failed' | 'test'>('all')
const statusFilters = ['all', 'sent', 'test', 'failed'] as const

onMounted(() => store.loadAll())

const filteredHistory = computed(() => {
  const q = query.value.trim().toLowerCase()
  return sendHistory.value.filter((event) => {
    const matchesQuery = !q ||
      event.campaignTitle.toLowerCase().includes(q) ||
      event.campaignKind.toLowerCase().includes(q) ||
      (event.testEmail ?? '').toLowerCase().includes(q) ||
      (event.messageId ?? '').toLowerCase().includes(q)
    const matchesStatus =
      statusFilter.value === 'all' ||
      (statusFilter.value === 'test' ? event.testOnly : event.status === statusFilter.value)
    return matchesQuery && matchesStatus
  })
})

const sentCount = computed(() => sendHistory.value.filter((event) => event.status === 'sent' && !event.testOnly).length)
const testCount = computed(() => sendHistory.value.filter((event) => event.testOnly).length)
const totalRecipients = computed(() => sendHistory.value.filter((event) => event.status === 'sent' && !event.testOnly).reduce((sum, event) => sum + event.recipientsCount, 0))
const latestEvent = computed(() => sendHistory.value[0] ?? null)

function fmt(value?: string | null) {
  if (!value) return 'Not sent'
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function kindLabel(value: string) {
  return value.replaceAll('_', ' ')
}
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-5">
    <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <p class="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-teal/65">Audit Trail</p>
        <h1 class="font-display text-[26px] font-black uppercase tracking-wide text-white/90">Send History</h1>
        <p class="mt-1 text-[13px] text-white/42">Track sent, test, and failed internal comms from the SMTP pipeline.</p>
      </div>
      <div class="grid grid-cols-4 gap-2 md:min-w-[560px]">
        <div class="rounded-md border border-white/[0.08] bg-white/[0.025] px-3 py-2">
          <p class="text-[10px] uppercase tracking-[0.12em] text-white/28">Sends</p>
          <p class="mt-1 text-lg font-semibold text-white/88">{{ sentCount }}</p>
        </div>
        <div class="rounded-md border border-white/[0.08] bg-white/[0.025] px-3 py-2">
          <p class="text-[10px] uppercase tracking-[0.12em] text-white/28">Tests</p>
          <p class="mt-1 text-lg font-semibold text-teal">{{ testCount }}</p>
        </div>
        <div class="rounded-md border border-white/[0.08] bg-white/[0.025] px-3 py-2">
          <p class="text-[10px] uppercase tracking-[0.12em] text-white/28">Recipients</p>
          <p class="mt-1 text-lg font-semibold text-white/88">{{ totalRecipients.toLocaleString() }}</p>
        </div>
        <div class="rounded-md border border-white/[0.08] bg-white/[0.025] px-3 py-2">
          <p class="text-[10px] uppercase tracking-[0.12em] text-white/28">Failed</p>
          <p class="mt-1 text-lg font-semibold" :class="failedSends ? 'text-err' : 'text-white/88'">{{ failedSends }}</p>
        </div>
      </div>
    </div>

    <div v-if="error" class="rounded-md border border-err/20 bg-err/10 px-4 py-2.5 text-[12px] text-err/85">
      {{ error }}
    </div>

    <div class="grid gap-5 xl:grid-cols-[1fr_340px]">
      <section class="rounded-md border border-white/[0.08] bg-white/[0.025]">
        <div class="flex flex-col gap-3 border-b border-white/[0.07] p-4 md:flex-row md:items-center md:justify-between">
          <div class="relative md:w-[340px]">
            <Search class="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" />
            <input v-model="query" class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] py-2 pl-9 pr-3 text-[12px] text-white outline-none focus:border-teal/45" placeholder="Search campaign, message id, email" />
          </div>
          <div class="grid grid-cols-4 gap-1 rounded-md border border-white/[0.08] bg-white/[0.035] p-1">
            <button v-for="item in statusFilters" :key="item" class="rounded px-3 py-1.5 text-[11px] capitalize" :class="statusFilter === item ? 'bg-teal text-base' : 'text-white/45 hover:bg-white/[0.05]'" @click="statusFilter = item">
              {{ item }}
            </button>
          </div>
        </div>

        <div v-if="loading" class="space-y-2 p-4">
          <div v-for="i in 5" :key="i" class="h-16 animate-pulse rounded-md bg-white/[0.04]" />
        </div>

        <div v-else class="divide-y divide-white/[0.06]">
          <div v-for="event in filteredHistory" :key="event.id" class="grid gap-3 px-4 py-3 md:grid-cols-[1fr_120px_120px_120px] md:items-center">
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <CheckCircle2 v-if="event.status === 'sent'" class="h-4 w-4 text-teal" />
                <AlertTriangle v-else class="h-4 w-4 text-err" />
                <p class="truncate text-[13px] font-semibold text-white/84">{{ event.campaignTitle }}</p>
              </div>
              <p class="mt-1 truncate text-[11px] text-white/32">
                {{ kindLabel(event.campaignKind) }}
                <span v-if="event.testOnly"> / test to {{ event.testEmail }}</span>
                <span v-if="event.messageId"> / {{ event.messageId }}</span>
              </p>
              <p v-if="event.error" class="mt-1 truncate text-[11px] text-err/70">{{ event.error }}</p>
            </div>
            <span class="text-[12px] text-white/45">{{ event.recipientsCount }} recipient{{ event.recipientsCount === 1 ? '' : 's' }}</span>
            <span class="rounded border px-2 py-1 text-center text-[11px]" :class="event.testOnly ? 'border-warn/25 bg-warn/10 text-warn' : event.status === 'sent' ? 'border-teal/25 bg-teal/10 text-teal' : 'border-err/25 bg-err/10 text-err'">
              {{ event.testOnly ? 'test' : event.status }}
            </span>
            <span class="text-right text-[11px] text-white/35 md:text-left">{{ fmt(event.createdAt) }}</span>
          </div>
          <p v-if="!filteredHistory.length" class="px-4 py-10 text-center text-[12px] text-white/35">
            No send events match this view.
          </p>
        </div>
      </section>

      <section class="space-y-5">
        <div class="rounded-md border border-white/[0.08] bg-white/[0.025] p-4">
          <div class="mb-3 flex items-center gap-2">
            <History class="h-4 w-4 text-teal/80" />
            <h2 class="text-[13px] font-semibold text-white/82">Latest Activity</h2>
          </div>
          <div v-if="latestEvent" class="rounded-md border border-white/[0.08] bg-white/[0.025] p-3">
            <p class="text-[12px] font-semibold text-white/82">{{ latestEvent.campaignTitle }}</p>
            <p class="mt-1 text-[11px] text-white/35">{{ fmt(latestEvent.createdAt) }}</p>
            <p class="mt-3 text-[22px] font-semibold" :class="latestEvent.status === 'sent' ? 'text-teal' : 'text-err'">{{ latestEvent.recipientsCount }}</p>
            <p class="text-[10px] uppercase tracking-[0.12em] text-white/28">Recipients processed</p>
          </div>
          <p v-else class="rounded-md border border-white/[0.08] bg-white/[0.025] px-3 py-6 text-center text-[12px] text-white/35">
            No SMTP sends recorded yet.
          </p>
        </div>

        <div class="rounded-md border border-white/[0.08] bg-white/[0.025] p-4">
          <div class="mb-3 flex items-center gap-2">
            <MailCheck class="h-4 w-4 text-teal/80" />
            <h2 class="text-[13px] font-semibold text-white/82">Campaign Outcomes</h2>
          </div>
          <div class="space-y-2">
            <div v-for="campaign in campaigns.slice(0, 6)" :key="campaign.id" class="flex items-center justify-between gap-3 rounded-md bg-white/[0.03] px-3 py-2">
              <div class="min-w-0">
                <p class="truncate text-[12px] font-medium text-white/78">{{ campaign.title }}</p>
                <p class="truncate text-[11px] text-white/32">{{ campaign.subject }}</p>
              </div>
              <span class="shrink-0 rounded border px-1.5 py-0.5 text-[10px]" :class="campaign.status === 'sent' ? 'border-teal/25 bg-teal/10 text-teal' : campaign.status === 'failed' ? 'border-err/25 bg-err/10 text-err' : 'border-white/[0.08] text-white/35'">
                {{ campaign.status }}
              </span>
            </div>
          </div>
        </div>

        <div class="rounded-md border border-white/[0.08] bg-white/[0.025] p-4">
          <div class="mb-3 flex items-center gap-2">
            <TestTube2 class="h-4 w-4 text-warn" />
            <h2 class="text-[13px] font-semibold text-white/82">Preflight Checks</h2>
          </div>
          <div class="space-y-2 text-[12px] text-white/48">
            <div class="flex items-center justify-between rounded-md bg-white/[0.03] px-3 py-2">
              <span>Test sends logged</span>
              <span class="font-semibold text-white/76">{{ testCount }}</span>
            </div>
            <div class="flex items-center justify-between rounded-md bg-white/[0.03] px-3 py-2">
              <span>Production sends logged</span>
              <span class="font-semibold text-white/76">{{ sentCount }}</span>
            </div>
            <div class="flex items-center justify-between rounded-md bg-white/[0.03] px-3 py-2">
              <span>Recent failures</span>
              <span class="font-semibold" :class="failedSends ? 'text-err' : 'text-white/76'">{{ failedSends }}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
