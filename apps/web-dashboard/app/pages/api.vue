<script setup lang="ts">
import { Key, Plus, Trash2, Copy, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'API — Vindicter' })

const supabase = useSupabase()
const { user } = useAuth()

interface APIToken {
  id: string
  name: string
  token_prefix: string
  created_at: string
  expires_at: string | null
  last_used_at: string | null
}

const tokens     = ref<APIToken[]>([])
const loading    = ref(true)
const fetchErr   = ref('')
const creating   = ref(false)
const newName    = ref('')
const newExpiry  = ref('never')
const showCreate = ref(false)
const justCopied = ref<string | null>(null)
const justCreatedFull = ref<string | null>(null)

async function fetchTokens() {
  if (!user.value) return
  loading.value = true
  fetchErr.value = ''
  try {
    const { data, error } = await supabase
      .from('api_tokens')
      .select('id, name, token_prefix, created_at, expires_at, last_used_at')
      .eq('user_id', (user.value as any).id)
      .order('created_at', { ascending: false })
    if (error) throw error
    tokens.value = (data ?? []) as APIToken[]
  } catch (e) {
    fetchErr.value = e instanceof Error ? e.message : 'Failed to load tokens.'
  } finally {
    loading.value = false
  }
}

async function createToken() {
  if (!newName.value.trim() || !user.value) return
  creating.value = true
  justCreatedFull.value = null
  try {
    const rawToken = `vdk_${crypto.randomUUID().replace(/-/g, '')}`
    const prefix   = rawToken.slice(0, 12) + '…'
    const expiresAt = newExpiry.value === 'never' ? null
      : newExpiry.value === '30d'  ? new Date(Date.now() + 30  * 86400_000).toISOString()
      : newExpiry.value === '90d'  ? new Date(Date.now() + 90  * 86400_000).toISOString()
      : newExpiry.value === '180d' ? new Date(Date.now() + 180 * 86400_000).toISOString()
      : new Date(Date.now() + 365 * 86400_000).toISOString()

    const { data, error } = await supabase
      .from('api_tokens')
      .insert({
        user_id:      (user.value as any).id,
        name:         newName.value.trim(),
        token:        rawToken,
        token_prefix: prefix,
        expires_at:   expiresAt,
      })
      .select('id, name, token_prefix, created_at, expires_at, last_used_at')
      .single()
    if (error) throw error

    tokens.value.unshift(data as APIToken)
    justCreatedFull.value = rawToken
    newName.value  = ''
    newExpiry.value = 'never'
    showCreate.value = false
  } catch (e) {
    fetchErr.value = e instanceof Error ? e.message : 'Failed to create token.'
  } finally {
    creating.value = false
  }
}

async function deleteToken(id: string) {
  try {
    await supabase.from('api_tokens').delete().eq('id', id)
    tokens.value = tokens.value.filter(t => t.id !== id)
    if (justCreatedFull.value) justCreatedFull.value = null
  } catch (e) {
    fetchErr.value = e instanceof Error ? e.message : 'Failed to delete token.'
  }
}

async function copyToken(text: string, id: string) {
  try { await navigator.clipboard.writeText(text) } catch { /* ignore */ }
  justCopied.value = id
  setTimeout(() => { justCopied.value = null }, 2000)
}

function fmtDate(iso?: string | null) {
  if (!iso) return 'Never'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function isExpired(iso?: string | null) {
  if (!iso) return false
  return new Date(iso) < new Date()
}

onMounted(fetchTokens)
</script>

<template>
  <div class="max-w-3xl mx-auto">

    <!-- Header -->
    <div class="mb-8 flex items-start justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="h-9 w-9 flex items-center justify-center rounded-xl shrink-0" style="background:rgba(139,92,246,0.10);border:1px solid rgba(139,92,246,0.20);">
          <Key class="h-4 w-4" style="color:rgba(139,92,246,0.80);" />
        </div>
        <div>
          <h1 class="text-[22px] font-display font-black uppercase tracking-wide" style="color:rgba(255,255,255,0.90);">API &amp; Keys</h1>
          <p class="text-[12px] mt-0.5" style="color:rgba(255,255,255,0.35);">Manage your DefendCore API access tokens.</p>
        </div>
      </div>
      <button
        class="shrink-0 flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px] font-semibold transition-colors"
        style="background:rgba(139,92,246,0.12);border:1px solid rgba(139,92,246,0.25);color:rgba(167,139,250,0.90);"
        @click="showCreate = !showCreate"
      >
        <Plus class="h-3.5 w-3.5" />
        New token
      </button>
    </div>

    <!-- DefendCore notice -->
    <div class="mb-6 rounded-xl px-4 py-3.5 flex items-start gap-3" style="background:rgba(139,92,246,0.06);border:1px solid rgba(139,92,246,0.14);">
      <AlertTriangle class="h-4 w-4 shrink-0 mt-0.5" style="color:rgba(245,158,11,0.75);" />
      <div>
        <p class="text-[12px] font-semibold" style="color:rgba(255,255,255,0.70);">DefendCore API is not yet available</p>
        <p class="text-[11px] mt-0.5 leading-relaxed" style="color:rgba(255,255,255,0.35);">
          You can generate tokens now to prepare your integrations. Active usage will be enabled when DefendCore launches.
        </p>
      </div>
    </div>

    <!-- Revealed token -->
    <div v-if="justCreatedFull" class="mb-5 rounded-xl px-4 py-4" style="background:rgba(35,165,90,0.06);border:1px solid rgba(35,165,90,0.18);">
      <div class="flex items-center gap-2 mb-2">
        <CheckCircle2 class="h-3.5 w-3.5 shrink-0" style="color:rgba(35,165,90,0.80);" />
        <p class="text-[12px] font-semibold" style="color:rgba(35,165,90,0.90);">Token created — copy it now, it won't be shown again.</p>
      </div>
      <div class="flex items-center gap-2 rounded-lg px-3 py-2" style="background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.07);">
        <code class="flex-1 font-mono text-[11px] break-all" style="color:rgba(255,255,255,0.75);">{{ justCreatedFull }}</code>
        <button
          class="shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold transition-colors"
          style="background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.25);color:rgba(167,139,250,0.90);"
          @click="copyToken(justCreatedFull!, 'new')"
        >
          <CheckCircle2 v-if="justCopied === 'new'" class="h-3 w-3" style="color:rgba(35,165,90,0.90);" />
          <Copy v-else class="h-3 w-3" />
        </button>
      </div>
    </div>

    <!-- Create form -->
    <div v-if="showCreate" class="mb-5 rounded-xl p-5 space-y-4" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.09);">
      <p class="text-[12px] font-semibold" style="color:rgba(255,255,255,0.70);">New API token</p>

      <div>
        <label class="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="color:rgba(255,255,255,0.30);">Token name</label>
        <input
          v-model="newName"
          type="text"
          placeholder="e.g. CI pipeline, local dev"
          maxlength="60"
          class="w-full rounded-xl px-3.5 py-2.5 text-[13px] text-white outline-none transition-colors"
          style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);"
          @keydown.enter="createToken"
        />
      </div>

      <div>
        <label class="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="color:rgba(255,255,255,0.30);">Expiry</label>
        <select
          v-model="newExpiry"
          class="w-full rounded-xl px-3.5 py-2.5 text-[13px] text-white outline-none"
          style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);"
        >
          <option value="never">Never expires</option>
          <option value="30d">30 days</option>
          <option value="90d">90 days</option>
          <option value="180d">180 days</option>
          <option value="365d">1 year</option>
        </select>
      </div>

      <div class="flex gap-2">
        <button
          :disabled="creating || !newName.trim()"
          class="flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12px] font-semibold transition-colors disabled:opacity-50"
          style="background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.28);color:rgba(167,139,250,0.90);"
          @click="createToken"
        >
          <Loader2 v-if="creating" class="h-3 w-3 animate-spin" />
          <Key v-else class="h-3 w-3" />
          Generate
        </button>
        <button
          class="rounded-xl px-4 py-2 text-[12px] transition-colors"
          style="border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.35);"
          @click="showCreate = false"
        >
          Cancel
        </button>
      </div>
    </div>

    <!-- Error -->
    <div v-if="fetchErr" class="mb-4 rounded-xl px-4 py-3 text-[12px]" style="background:rgba(242,63,66,0.08);border:1px solid rgba(242,63,66,0.18);color:rgba(242,63,66,0.80);">
      {{ fetchErr }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-2">
      <div v-for="i in 3" :key="i" class="h-14 rounded-xl animate-pulse" style="background:rgba(255,255,255,0.03);" />
    </div>

    <!-- Empty tokens -->
    <div
      v-else-if="!tokens.length"
      class="rounded-xl px-5 py-12 text-center"
      style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);"
    >
      <Key class="h-7 w-7 mx-auto mb-3" style="color:rgba(255,255,255,0.12);" />
      <p class="text-[12px]" style="color:rgba(255,255,255,0.25);">No API tokens yet. Create one above.</p>
    </div>

    <!-- Token list -->
    <div v-else class="rounded-xl overflow-hidden" style="border:1px solid rgba(255,255,255,0.07);">
      <div
        v-for="(t, i) in tokens"
        :key="t.id"
        class="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.02]"
        :style="i < tokens.length - 1 ? 'border-bottom:1px solid rgba(255,255,255,0.05);' : ''"
      >
        <Key class="h-3.5 w-3.5 shrink-0" :style="isExpired(t.expires_at) ? 'color:rgba(242,63,66,0.50);' : 'color:rgba(139,92,246,0.55);'" />

        <div class="flex-1 min-w-0">
          <p class="text-[12px] font-semibold truncate" style="color:rgba(255,255,255,0.75);">{{ t.name }}</p>
          <div class="flex items-center gap-3 mt-0.5 flex-wrap">
            <code class="font-mono text-[10px]" style="color:rgba(255,255,255,0.30);">{{ t.token_prefix }}</code>
            <span class="text-[10px]" style="color:rgba(255,255,255,0.22);">Created {{ fmtDate(t.created_at) }}</span>
            <span
              class="text-[10px]"
              :style="isExpired(t.expires_at) ? 'color:rgba(242,63,66,0.55);' : 'color:rgba(255,255,255,0.22);'"
            >
              {{ t.expires_at ? (isExpired(t.expires_at) ? 'Expired' : `Expires ${fmtDate(t.expires_at)}`) : 'No expiry' }}
            </span>
          </div>
        </div>

        <button
          class="shrink-0 h-7 w-7 flex items-center justify-center rounded-lg transition-colors hover:bg-red-500/10"
          style="color:rgba(248,113,113,0.45);"
          title="Revoke token"
          @click="deleteToken(t.id)"
        >
          <Trash2 class="h-3.5 w-3.5" />
        </button>
      </div>
    </div>

    <!-- Footer note -->
    <p class="mt-4 text-[11px]" style="color:rgba(255,255,255,0.20);">
      Tokens grant access to the DefendCore API. Revoke any token you no longer need.
    </p>

  </div>
</template>
