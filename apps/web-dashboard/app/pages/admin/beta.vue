<script setup lang="ts">
import { Star, Search, Loader2, ShieldAlert, RefreshCw, ChevronDown, Building2 } from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Beta Requests — Vindicter' })

const api = useApi()
const { isAdmin } = useAuth()
const router = useRouter()

onMounted(() => {
  if (!isAdmin.value) router.push('/dashboard')
})

interface BetaApplication {
  id: string
  org_name: string
  org_size: string
  country: string
  contact_name: string
  contact_email: string
  partner_type: string
  referral?: string | null
  status?: string
  created_at: string
}

const applications = ref<BetaApplication[]>([])
const loading      = ref(true)
const fetchErr     = ref('')
const search       = ref('')
const filter       = ref<'all' | 'pending' | 'approved' | 'rejected'>('all')
const expanded     = ref<string | null>(null)
const saving       = ref<string | null>(null)

async function fetchApplications() {
  loading.value  = true
  fetchErr.value = ''
  try {
    applications.value = await api.get<BetaApplication[]>('/beta') ?? []
  } catch (e) {
    fetchErr.value = e instanceof Error ? e.message : 'Failed to load applications.'
  } finally {
    loading.value = false
  }
}

async function setStatus(appId: string, newStatus: string) {
  saving.value = appId
  try {
    await api.patch(`/beta/${appId}/status`, { status: newStatus })
    const a = applications.value.find(a => a.id === appId)
    if (a) a.status = newStatus
  } catch { /* silent */ }
  finally { saving.value = null }
}

onMounted(fetchApplications)

const filtered = computed(() => {
  let list = applications.value
  if (filter.value !== 'all') list = list.filter(a => (a.status ?? 'pending') === filter.value)
  const q = search.value.toLowerCase().trim()
  if (q) list = list.filter(a =>
    a.org_name.toLowerCase().includes(q) ||
    a.contact_name.toLowerCase().includes(q) ||
    a.contact_email.toLowerCase().includes(q) ||
    a.country.toLowerCase().includes(q) ||
    a.partner_type.toLowerCase().includes(q)
  )
  return list
})

const counts = computed(() => ({
  all:      applications.value.length,
  pending:  applications.value.filter(a => !a.status || a.status === 'pending').length,
  approved: applications.value.filter(a => a.status === 'approved').length,
  rejected: applications.value.filter(a => a.status === 'rejected').length,
}))

const statusMeta: Record<string, { label: string; style: string }> = {
  pending:  { label: 'Pending',  style: 'background:rgba(251,191,36,0.10);border:1px solid rgba(251,191,36,0.20);color:rgba(251,191,36,0.80);' },
  approved: { label: 'Approved', style: 'background:rgba(35,165,90,0.10);border:1px solid rgba(35,165,90,0.20);color:rgba(35,165,90,0.80);' },
  rejected: { label: 'Rejected', style: 'background:rgba(242,63,66,0.10);border:1px solid rgba(242,63,66,0.20);color:rgba(242,63,66,0.75);' },
}

const partnerMeta: Record<string, { label: string; style: string }> = {
  partner: { label: 'Partner',  style: 'background:rgba(139,92,246,0.10);border:1px solid rgba(139,92,246,0.20);color:rgba(167,139,250,0.80);' },
  trusted: { label: 'Trusted',  style: 'background:rgba(79,70,229,0.10);border:1px solid rgba(79,70,229,0.20);color:rgba(129,140,248,0.80);' },
}

const orgSizeLabel: Record<string, string> = {
  '1-10': '1–10', '11-50': '11–50', '51-200': '51–200', '201-500': '201–500', '501+': '500+',
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
        <h1 class="text-[26px] font-display font-black uppercase tracking-wide" style="color:rgba(255,255,255,0.90);">Special Beta Requests</h1>
        <p class="mt-1 text-[13px]" style="color:rgba(255,255,255,0.40);">Review and action organisational early access applications.</p>
      </div>
      <button
        class="shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] transition-colors hover:bg-white/[0.06] cursor-pointer"
        style="color:rgba(255,255,255,0.35);border:1px solid rgba(255,255,255,0.08);"
        :disabled="loading"
        @click="fetchApplications"
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
      <div class="flex items-center gap-1 rounded-lg p-1" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);">
        <button
          v-for="(tab, key) in { all: 'All', pending: 'Pending', approved: 'Approved', rejected: 'Rejected' }"
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

      <div class="relative flex-1" style="min-width:200px;max-width:300px;">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style="color:rgba(255,255,255,0.22);" />
        <input
          v-model="search"
          placeholder="Search by org, contact, country…"
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
      <Star class="h-8 w-8 mx-auto mb-3" style="color:rgba(255,255,255,0.12);" />
      <p class="text-[12px]" style="color:rgba(255,255,255,0.25);">
        {{ search || filter !== 'all' ? 'No applications match your filters.' : 'No beta applications yet.' }}
      </p>
    </div>

    <!-- Application list -->
    <div v-else-if="!loading && !fetchErr" class="space-y-2">
      <div
        v-for="a in filtered"
        :key="a.id"
        class="rounded-xl overflow-hidden"
        style="border:1px solid rgba(255,255,255,0.07);"
      >
        <!-- Row -->
        <button
          class="w-full flex items-center gap-4 px-4 py-3.5 text-left transition-colors cursor-pointer"
          :style="expanded === a.id ? 'background:rgba(139,92,246,0.06);' : 'background:rgba(255,255,255,0.02);'"
          @click="expanded = expanded === a.id ? null : a.id"
        >
          <!-- Org icon -->
          <div class="shrink-0 h-7 w-7 rounded-lg flex items-center justify-center" style="background:rgba(139,92,246,0.10);border:1px solid rgba(139,92,246,0.18);">
            <Building2 class="h-3.5 w-3.5" style="color:rgba(167,139,250,0.65);" />
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <p class="text-[13px] font-semibold truncate" style="color:rgba(255,255,255,0.80);">{{ a.org_name }}</p>
              <span
                class="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase"
                :style="partnerMeta[a.partner_type]?.style ?? partnerMeta.partner.style"
              >
                {{ partnerMeta[a.partner_type]?.label ?? a.partner_type }}
              </span>
            </div>
            <p class="text-[11px] mt-0.5" style="color:rgba(255,255,255,0.30);">
              {{ a.contact_name }} · {{ a.contact_email }} · {{ a.country }}
              <span v-if="a.org_size" class="ml-1">({{ orgSizeLabel[a.org_size] ?? a.org_size }} employees)</span>
            </p>
          </div>

          <!-- Date + status + chevron -->
          <div class="shrink-0 flex items-center gap-3">
            <span class="hidden sm:block text-[11px]" style="color:rgba(255,255,255,0.22);">{{ fmt(a.created_at) }}</span>
            <span
              class="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
              :style="statusMeta[a.status ?? 'pending']?.style ?? statusMeta.pending.style"
            >
              {{ statusMeta[a.status ?? 'pending']?.label ?? 'Pending' }}
            </span>
            <ChevronDown
              class="h-3.5 w-3.5 shrink-0 transition-transform"
              :class="expanded === a.id ? 'rotate-180' : ''"
              style="color:rgba(255,255,255,0.20);"
            />
          </div>
        </button>

        <!-- Expanded detail -->
        <div v-if="expanded === a.id" class="px-4 pb-4 pt-3" style="background:rgba(139,92,246,0.03);border-top:1px solid rgba(139,92,246,0.10);">

          <!-- Detail grid -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div
              v-for="field in [
                { label: 'Org size',      value: orgSizeLabel[a.org_size] ?? a.org_size },
                { label: 'Country',       value: a.country },
                { label: 'Partner type',  value: partnerMeta[a.partner_type]?.label ?? a.partner_type },
                { label: 'Referral',      value: a.referral ?? '—' },
              ]"
              :key="field.label"
              class="rounded-lg px-3 py-2"
              style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);"
            >
              <p class="text-[10px] uppercase tracking-wider mb-1" style="color:rgba(255,255,255,0.25);">{{ field.label }}</p>
              <p class="text-[12px] font-medium" style="color:rgba(255,255,255,0.70);">{{ field.value }}</p>
            </div>
          </div>

          <!-- Action buttons -->
          <div class="flex items-center gap-2 flex-wrap">
            <p class="text-[11px] mr-1" style="color:rgba(255,255,255,0.25);">Action:</p>
            <button
              class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
              :style="(a.status ?? 'pending') === 'approved'
                ? 'background:rgba(35,165,90,0.15);border:1px solid rgba(35,165,90,0.25);color:rgba(35,165,90,0.85);'
                : 'background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);color:rgba(255,255,255,0.45);'"
              :disabled="saving === a.id"
              @click="setStatus(a.id, 'approved')"
            >
              <Loader2 v-if="saving === a.id" class="h-3 w-3 animate-spin" />
              Approve
            </button>
            <button
              class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
              :style="(a.status ?? 'pending') === 'pending'
                ? 'background:rgba(251,191,36,0.10);border:1px solid rgba(251,191,36,0.20);color:rgba(251,191,36,0.80);'
                : 'background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);color:rgba(255,255,255,0.35);'"
              :disabled="saving === a.id"
              @click="setStatus(a.id, 'pending')"
            >
              Reset to Pending
            </button>
            <button
              class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
              :style="(a.status ?? 'pending') === 'rejected'
                ? 'background:rgba(242,63,66,0.10);border:1px solid rgba(242,63,66,0.20);color:rgba(242,63,66,0.80);'
                : 'background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);color:rgba(255,255,255,0.35);'"
              :disabled="saving === a.id"
              @click="setStatus(a.id, 'rejected')"
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>

    <p v-if="!loading && filtered.length" class="mt-3 text-[11px]" style="color:rgba(255,255,255,0.20);">
      {{ filtered.length }} {{ filtered.length === 1 ? 'application' : 'applications' }}
    </p>

  </div>
</template>
