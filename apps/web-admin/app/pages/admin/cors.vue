<script setup lang="ts">
import { Globe, Plus, Loader2, Trash2, ToggleLeft, ToggleRight, RefreshCw, ShieldCheck } from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'CORS Management' })

const api = useApi()
const { isAdmin } = useAuth()
const router = useRouter()

onMounted(() => { if (!isAdmin.value) router.push('/campaigns') })

interface CorsOrigin {
  id: string
  origin: string
  label: string
  enabled: boolean
  createdAt: string
}

const origins = ref<CorsOrigin[]>([])
const loading  = ref(false)
const err      = ref('')
const msg      = ref('')

const newOrigin = ref('')
const newLabel  = ref('')
const adding    = ref(false)
const addErr    = ref('')

async function fetchOrigins() {
  loading.value = true; err.value = ''
  try { origins.value = await api.get<CorsOrigin[]>('/cors') ?? [] }
  catch (e) { err.value = e instanceof Error ? e.message : 'Failed to load.' }
  finally   { loading.value = false }
}

async function addOrigin() {
  addErr.value = ''
  const o = newOrigin.value.trim()
  if (!o) { addErr.value = 'Origin is required.'; return }
  if (!/^https?:\/\/|^tauri:\/\//.test(o)) { addErr.value = 'Must start with http://, https://, or tauri://'; return }
  adding.value = true
  try {
    const created = await api.post<CorsOrigin>('/cors', { origin: o, label: newLabel.value.trim() })
    origins.value.push(created)
    newOrigin.value = ''; newLabel.value = ''
    flash('Origin added. Takes effect immediately â€” no restart needed.', true)
  } catch (e) {
    addErr.value = e instanceof Error ? e.message : 'Failed to add.'
  } finally { adding.value = false }
}

async function toggleOrigin(row: CorsOrigin) {
  const prev = row.enabled
  row.enabled = !row.enabled
  try {
    await api.patch(`/cors/${row.id}/toggle`, { enabled: row.enabled })
    flash(`"${row.origin}" ${row.enabled ? 'enabled' : 'disabled'}.`, true)
  } catch {
    row.enabled = prev
  }
}

async function deleteOrigin(row: CorsOrigin) {
  if (!confirm(`Remove "${row.origin}" from CORS allowlist?`)) return
  try {
    await api.del(`/cors/${row.id}`)
    origins.value = origins.value.filter(o => o.id !== row.id)
    flash('Origin removed.', true)
  } catch (e) { err.value = e instanceof Error ? e.message : 'Failed to remove.' }
}

function flash(text: string, ok: boolean) {
  msg.value = ok ? text : ''
  err.value = ok ? '' : text
  setTimeout(() => { msg.value = ''; err.value = '' }, 4000)
}

onMounted(fetchOrigins)
</script>

<template>
  <div class="max-w-4xl mx-auto">

    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center gap-2 mb-1">
        <Globe class="h-3.5 w-3.5" style="color:rgba(248,113,113,0.55);" />
        <p class="text-[10px] font-semibold uppercase tracking-[0.22em]" style="color:rgba(248,113,113,0.50);">Admin</p>
      </div>
      <h1 class="text-[26px] font-display font-black uppercase tracking-wide" style="color:rgba(255,255,255,0.90);">CORS Origins</h1>
      <p class="mt-1 text-[13px]" style="color:rgba(255,255,255,0.40);">
        Manage allowed cross-origin request sources. Changes take effect immediately â€” no server restart required.
      </p>
    </div>

    <!-- Info banner -->
    <div class="mb-5 flex items-start gap-3 rounded-xl p-4" style="background:rgba(245,158,11,0.07);border:1px solid rgba(245,158,11,0.15);">
      <ShieldCheck class="h-4 w-4 shrink-0 mt-0.5" style="color:rgba(251,191,36,0.65);" />
      <p class="text-[12px] leading-relaxed" style="color:rgba(255,255,255,0.45);">
        Origins are stored in the database and applied to every request via a shared in-memory set. Enabling or disabling an origin here updates all running instances immediately.
      </p>
    </div>

    <!-- Feedback -->
    <div v-if="msg" class="mb-4 rounded-xl px-4 py-2.5 text-[12px]" style="background:rgba(35,165,90,0.08);border:1px solid rgba(35,165,90,0.18);color:rgba(35,165,90,0.85);">{{ msg }}</div>
    <div v-if="err" class="mb-4 rounded-xl px-4 py-2.5 text-[12px]" style="background:rgba(242,63,66,0.08);border:1px solid rgba(242,63,66,0.18);color:rgba(242,63,66,0.80);">{{ err }}</div>

    <div class="grid gap-5 lg:grid-cols-[1fr_340px]">

      <!-- Origins list -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <p class="text-[13px] font-semibold" style="color:rgba(255,255,255,0.75);">Allowlist</p>
          <button @click="fetchOrigins" class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] cursor-pointer hover:bg-white/[0.06]"
            style="border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.35);">
            <RefreshCw class="h-3 w-3" :class="loading ? 'animate-spin' : ''" />
            Refresh
          </button>
        </div>

        <div v-if="loading" class="space-y-2">
          <div v-for="i in 5" :key="i" class="h-14 rounded-xl animate-pulse" style="background:rgba(255,255,255,0.03);" />
        </div>
        <div v-else-if="!origins.length" class="rounded-xl px-5 py-12 text-center" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);">
          <p class="text-[12px]" style="color:rgba(255,255,255,0.25);">No origins configured. Add one to get started.</p>
        </div>
        <div v-else class="space-y-2">
          <div v-for="row in origins" :key="row.id"
            class="flex items-center gap-3 rounded-xl px-4 py-3 transition-colors"
            :style="row.enabled
              ? 'background:rgba(35,165,90,0.05);border:1px solid rgba(35,165,90,0.12);'
              : 'background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);'">
            <div class="flex-1 min-w-0">
              <p class="font-mono text-[12px] truncate" :style="row.enabled ? 'color:rgba(255,255,255,0.85);' : 'color:rgba(255,255,255,0.35);'">
                {{ row.origin }}
              </p>
              <p v-if="row.label" class="text-[10px] mt-0.5" style="color:rgba(255,255,255,0.28);">{{ row.label }}</p>
            </div>
            <span class="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold"
              :style="row.enabled
                ? 'background:rgba(35,165,90,0.15);color:rgba(35,165,90,0.80);border:1px solid rgba(35,165,90,0.20);'
                : 'background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.28);border:1px solid rgba(255,255,255,0.08);'">
              {{ row.enabled ? 'Active' : 'Disabled' }}
            </span>
            <button @click="toggleOrigin(row)" class="h-7 w-7 flex items-center justify-center rounded-lg cursor-pointer transition-colors hover:bg-white/[0.07]"
              :style="row.enabled ? 'color:rgba(35,165,90,0.65);' : 'color:rgba(255,255,255,0.25);'" :title="row.enabled ? 'Disable' : 'Enable'">
              <ToggleRight v-if="row.enabled" class="h-4 w-4" />
              <ToggleLeft  v-else             class="h-4 w-4" />
            </button>
            <button @click="deleteOrigin(row)" class="h-7 w-7 flex items-center justify-center rounded-lg cursor-pointer transition-colors hover:bg-red-500/10"
              style="color:rgba(248,113,113,0.40);" title="Remove">
              <Trash2 class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Add origin panel -->
      <div class="rounded-xl p-5 space-y-4" style="background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.08);">
        <div class="flex items-center gap-2">
          <Plus class="h-4 w-4" style="color:rgba(245,158,11,0.65);" />
          <p class="text-[12px] font-semibold" style="color:rgba(255,255,255,0.70);">Add Origin</p>
        </div>

        <div>
          <label class="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="color:rgba(255,255,255,0.30);">Origin URL</label>
          <input v-model="newOrigin" placeholder="https://example.com"
            class="w-full rounded-xl px-3 py-2.5 font-mono text-[12px] text-white outline-none"
            style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);"
            @keydown.enter="addOrigin" />
          <p class="mt-1 text-[10px]" style="color:rgba(255,255,255,0.20);">Must include scheme. No trailing slash.</p>
        </div>

        <div>
          <label class="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="color:rgba(255,255,255,0.30);">Label <span style="color:rgba(255,255,255,0.18);">(optional)</span></label>
          <input v-model="newLabel" placeholder="e.g. Partner staging"
            class="w-full rounded-xl px-3 py-2.5 text-[12px] text-white outline-none"
            style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);"
            @keydown.enter="addOrigin" />
        </div>

        <p v-if="addErr" class="text-[11px]" style="color:rgba(242,63,66,0.80);">{{ addErr }}</p>

        <button :disabled="adding" @click="addOrigin"
          class="w-full flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] font-semibold cursor-pointer disabled:opacity-50"
          style="background:rgba(245,158,11,0.18);border:1px solid rgba(245,158,11,0.30);color:rgba(251,191,36,0.90);">
          <Loader2 v-if="adding" class="h-3.5 w-3.5 animate-spin" /><Plus v-else class="h-3.5 w-3.5" />
          Add to Allowlist
        </button>
      </div>
    </div>

  </div>
</template>

