<script setup lang="ts">
import { MessageCircle, Search, Loader2, ShieldAlert, RefreshCw, ChevronDown } from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Support Tickets — Vindicter' })

const supabase = useSupabase()
const { isAdmin } = useAuth()
const router = useRouter()

onMounted(() => {
  if (!isAdmin.value) router.push('/dashboard')
})

interface Ticket {
  id: string
  name: string
  email: string
  category: string
  subject: string
  message: string
  status?: string
  created_at: string
}

const tickets   = ref<Ticket[]>([])
const loading   = ref(true)
const fetchErr  = ref('')
const search    = ref('')
const filter    = ref<'all' | 'open' | 'in_progress' | 'resolved'>('all')
const expanded  = ref<string | null>(null)
const saving    = ref<string | null>(null)

async function fetchTickets() {
  loading.value  = true
  fetchErr.value = ''
  try {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    tickets.value = (data ?? []) as Ticket[]
  } catch (e) {
    fetchErr.value = e instanceof Error ? e.message : 'Failed to load tickets.'
  } finally {
    loading.value = false
  }
}

async function setStatus(ticketId: string, newStatus: string) {
  saving.value = ticketId
  try {
    const { error } = await supabase
      .from('support_tickets')
      .update({ status: newStatus })
      .eq('id', ticketId)
    if (error) throw error
    const t = tickets.value.find(t => t.id === ticketId)
    if (t) t.status = newStatus
  } catch { /* silent — table may not have status column */ }
  finally { saving.value = null }
}

onMounted(fetchTickets)

const filtered = computed(() => {
  let list = tickets.value
  if (filter.value !== 'all') list = list.filter(t => (t.status ?? 'open') === filter.value)
  const q = search.value.toLowerCase().trim()
  if (q) list = list.filter(t =>
    t.subject.toLowerCase().includes(q) ||
    t.name.toLowerCase().includes(q) ||
    t.email.toLowerCase().includes(q) ||
    t.category.toLowerCase().includes(q)
  )
  return list
})

const counts = computed(() => ({
  all:         tickets.value.length,
  open:        tickets.value.filter(t => !t.status || t.status === 'open').length,
  in_progress: tickets.value.filter(t => t.status === 'in_progress').length,
  resolved:    tickets.value.filter(t => t.status === 'resolved').length,
}))

const statusMeta: Record<string, { label: string; style: string }> = {
  open:        { label: 'Open',        style: 'background:rgba(251,191,36,0.10);border:1px solid rgba(251,191,36,0.20);color:rgba(251,191,36,0.80);' },
  in_progress: { label: 'In Progress', style: 'background:rgba(79,70,229,0.12);border:1px solid rgba(79,70,229,0.22);color:rgba(129,140,248,0.85);' },
  resolved:    { label: 'Resolved',    style: 'background:rgba(35,165,90,0.10);border:1px solid rgba(35,165,90,0.20);color:rgba(35,165,90,0.80);' },
}

const categoryLabel: Record<string, string> = {
  setup: 'Setup / Install', scan: 'Scanning', billing: 'Account', bug: 'Bug', other: 'Other',
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<template>
  <div class="max-w-5xl mx-auto">

    <!-- Header -->
    <div class="mb-6 flex items-start justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <ShieldAlert class="h-3.5 w-3.5" style="color:rgba(248,113,113,0.55);" />
          <p class="text-[10px] font-semibold uppercase tracking-[0.22em]" style="color:rgba(248,113,113,0.50);">Admin</p>
        </div>
        <h1 class="text-[26px] font-display font-black uppercase tracking-wide" style="color:rgba(255,255,255,0.90);">Support Tickets</h1>
        <p class="mt-1 text-[13px]" style="color:rgba(255,255,255,0.40);">Review and respond to user support requests.</p>
      </div>
      <button
        class="shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] transition-colors hover:bg-white/[0.06] cursor-pointer"
        style="color:rgba(255,255,255,0.35);border:1px solid rgba(255,255,255,0.08);"
        :disabled="loading"
        @click="fetchTickets"
      >
        <RefreshCw class="h-3 w-3" :class="loading ? 'animate-spin' : ''" />
        Refresh
      </button>
    </div>

    <!-- Error -->
    <div v-if="fetchErr" class="mb-4 rounded-xl px-4 py-3 text-[12px]" style="background:rgba(242,63,66,0.08);border:1px solid rgba(242,63,66,0.18);color:rgba(242,63,66,0.80);">
      {{ fetchErr }}
    </div>

    <!-- Filters + search -->
    <div class="flex flex-wrap items-center gap-3 mb-4">
      <!-- Status tabs -->
      <div class="flex items-center gap-1 rounded-lg p-1" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);">
        <button
          v-for="(tab, key) in { all: 'All', open: 'Open', in_progress: 'In Progress', resolved: 'Resolved' }"
          :key="key"
          class="rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer"
          :style="filter === key
            ? 'background:rgba(255,255,255,0.09);color:rgba(255,255,255,0.80);'
            : 'color:rgba(255,255,255,0.35);'"
          @click="filter = key as typeof filter"
        >
          {{ tab }}
          <span class="ml-1 text-[10px]" style="color:rgba(255,255,255,0.25);">{{ counts[key as keyof typeof counts] }}</span>
        </button>
      </div>

      <!-- Search -->
      <div class="relative flex-1" style="min-width:200px;max-width:300px;">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style="color:rgba(255,255,255,0.22);" />
        <input
          v-model="search"
          placeholder="Search tickets…"
          class="w-full rounded-xl pl-8 pr-4 py-2 text-[12px] text-white outline-none border border-white/8 bg-white/[0.03] focus:border-accent/40"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-2">
      <div v-for="i in 4" :key="i" class="h-14 rounded-xl animate-pulse" style="background:rgba(255,255,255,0.03);" />
    </div>

    <!-- Empty -->
    <div
      v-else-if="!fetchErr && !filtered.length"
      class="rounded-xl px-5 py-14 text-center"
      style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);"
    >
      <MessageCircle class="h-8 w-8 mx-auto mb-3" style="color:rgba(255,255,255,0.12);" />
      <p class="text-[12px]" style="color:rgba(255,255,255,0.25);">
        {{ search || filter !== 'all' ? 'No tickets match your filters.' : 'No support tickets yet.' }}
      </p>
    </div>

    <!-- Ticket list -->
    <div v-else-if="!loading && !fetchErr" class="space-y-2">
      <div
        v-for="t in filtered"
        :key="t.id"
        class="rounded-xl overflow-hidden"
        style="border:1px solid rgba(255,255,255,0.07);"
      >
        <!-- Row -->
        <button
          class="w-full flex items-center gap-4 px-4 py-3.5 text-left transition-colors cursor-pointer"
          :style="expanded === t.id ? 'background:rgba(79,70,229,0.06);' : 'background:rgba(255,255,255,0.02);'"
          @click="expanded = expanded === t.id ? null : t.id"
        >
          <!-- Status dot -->
          <div
            class="shrink-0 h-2 w-2 rounded-full mt-0.5"
            :style="t.status === 'resolved'
              ? 'background:rgba(35,165,90,0.70);'
              : t.status === 'in_progress'
                ? 'background:rgba(79,70,229,0.70);'
                : 'background:rgba(251,191,36,0.70);'"
          />

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <p class="text-[13px] font-semibold truncate" style="color:rgba(255,255,255,0.80);">{{ t.subject }}</p>
              <span
                class="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase"
                style="background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.30);"
              >
                {{ categoryLabel[t.category] ?? t.category }}
              </span>
            </div>
            <p class="text-[11px] mt-0.5" style="color:rgba(255,255,255,0.30);">{{ t.name }} · {{ t.email }}</p>
          </div>

          <!-- Date + status badge + chevron -->
          <div class="shrink-0 flex items-center gap-3">
            <span class="hidden sm:block text-[11px]" style="color:rgba(255,255,255,0.22);">{{ fmt(t.created_at) }}</span>
            <span
              class="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
              :style="statusMeta[t.status ?? 'open']?.style ?? statusMeta.open.style"
            >
              {{ statusMeta[t.status ?? 'open']?.label ?? 'Open' }}
            </span>
            <ChevronDown
              class="h-3.5 w-3.5 shrink-0 transition-transform"
              :class="expanded === t.id ? 'rotate-180' : ''"
              style="color:rgba(255,255,255,0.20);"
            />
          </div>
        </button>

        <!-- Expanded detail -->
        <div v-if="expanded === t.id" class="px-4 pb-4 pt-3" style="background:rgba(79,70,229,0.04);border-top:1px solid rgba(79,70,229,0.10);">
          <p class="text-[13px] leading-relaxed whitespace-pre-wrap mb-4" style="color:rgba(255,255,255,0.55);">{{ t.message }}</p>
          <div class="flex items-center gap-2 flex-wrap">
            <p class="text-[11px] mr-2" style="color:rgba(255,255,255,0.25);">Set status:</p>
            <button
              v-for="(meta, key) in statusMeta"
              :key="key"
              class="rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
              :style="(t.status ?? 'open') === key
                ? meta.style
                : 'background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.35);'"
              :disabled="saving === t.id"
              @click="setStatus(t.id, key)"
            >
              <Loader2 v-if="saving === t.id && (t.status ?? 'open') !== key" class="h-3 w-3 animate-spin inline mr-1" />
              {{ meta.label }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <p v-if="!loading && filtered.length" class="mt-3 text-[11px]" style="color:rgba(255,255,255,0.20);">
      {{ filtered.length }} {{ filtered.length === 1 ? 'ticket' : 'tickets' }}
    </p>

  </div>
</template>
