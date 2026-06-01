<script setup lang="ts">
import { Users, Search, Loader2, ShieldAlert, RefreshCw } from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'User Management — Vindicta' })

const supabase = useSupabase()
const { isAdmin } = useAuth()
const router = useRouter()

onMounted(() => {
  if (!isAdmin.value) router.push('/dashboard')
})

interface UserProfile {
  id: string
  role: string
  display_name?: string
  email?: string
  created_at?: string
}

const users    = ref<UserProfile[]>([])
const loading  = ref(true)
const fetchErr = ref('')
const search   = ref('')
const saving   = ref<string | null>(null)
const saveMsg  = ref('')

async function fetchUsers() {
  loading.value  = true
  fetchErr.value = ''
  saveMsg.value  = ''
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    users.value = (data ?? []) as UserProfile[]
  } catch (e) {
    fetchErr.value = e instanceof Error ? e.message : 'Failed to load users.'
  } finally {
    loading.value = false
  }
}

async function updateRole(userId: string, newRole: string) {
  saving.value  = userId
  saveMsg.value = ''
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({ role: newRole })
      .eq('id', userId)
    if (error) throw error
    const u = users.value.find(u => u.id === userId)
    if (u) u.role = newRole
    saveMsg.value = 'Role updated.'
  } catch (e) {
    saveMsg.value = e instanceof Error ? e.message : 'Failed to update role.'
  } finally {
    saving.value = null
  }
}

onMounted(fetchUsers)

const filtered = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return users.value
  return users.value.filter(u =>
    u.id.toLowerCase().includes(q) ||
    (u.email ?? '').toLowerCase().includes(q) ||
    (u.display_name ?? '').toLowerCase().includes(q) ||
    (u.role ?? '').toLowerCase().includes(q)
  )
})

function truncId(id: string) {
  return id.slice(0, 8) + '…'
}

function fmt(iso?: string) {
  if (!iso) return '—'
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
        <h1 class="text-[26px] font-display font-black uppercase tracking-wide" style="color:rgba(255,255,255,0.90);">User Management</h1>
        <p class="mt-1 text-[13px]" style="color:rgba(255,255,255,0.40);">View and manage registered accounts and roles.</p>
      </div>
      <button
        class="shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] transition-colors hover:bg-white/[0.06] cursor-pointer"
        style="color:rgba(255,255,255,0.35);border:1px solid rgba(255,255,255,0.08);"
        :disabled="loading"
        @click="fetchUsers"
      >
        <RefreshCw class="h-3 w-3" :class="loading ? 'animate-spin' : ''" />
        Refresh
      </button>
    </div>

    <!-- Save message -->
    <div v-if="saveMsg" class="mb-4 rounded-xl px-4 py-2.5 text-[12px]" style="background:rgba(35,165,90,0.08);border:1px solid rgba(35,165,90,0.18);color:rgba(35,165,90,0.85);">
      {{ saveMsg }}
    </div>

    <!-- Error -->
    <div v-if="fetchErr" class="mb-4 rounded-xl px-4 py-3 text-[12px]" style="background:rgba(242,63,66,0.08);border:1px solid rgba(242,63,66,0.18);color:rgba(242,63,66,0.80);">
      {{ fetchErr }}
    </div>

    <!-- Search bar -->
    <div class="relative mb-4">
      <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style="color:rgba(255,255,255,0.22);" />
      <input
        v-model="search"
        placeholder="Search by name, email, or role…"
        class="w-full rounded-xl pl-9 pr-4 py-2.5 text-[13px] text-white outline-none transition-colors border border-white/8 bg-white/[0.03] focus:border-accent/40"
        style="max-width:380px;"
      />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-2">
      <div v-for="i in 5" :key="i" class="h-12 rounded-xl animate-pulse" style="background:rgba(255,255,255,0.03);" />
    </div>

    <!-- Empty -->
    <div
      v-else-if="!fetchErr && !filtered.length"
      class="rounded-xl px-5 py-14 text-center"
      style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);"
    >
      <Users class="h-8 w-8 mx-auto mb-3" style="color:rgba(255,255,255,0.12);" />
      <p class="text-[12px]" style="color:rgba(255,255,255,0.25);">
        {{ search ? 'No users match your search.' : 'No user profiles found.' }}
      </p>
    </div>

    <!-- Table -->
    <div v-else-if="!loading && !fetchErr" class="rounded-xl overflow-hidden" style="border:1px solid rgba(255,255,255,0.07);">

      <!-- Table header -->
      <div class="grid px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider" style="background:rgba(255,255,255,0.02);border-bottom:1px solid rgba(255,255,255,0.06);color:rgba(255,255,255,0.25);grid-template-columns:120px 1fr 120px 120px 140px;">
        <span>ID</span>
        <span>Account</span>
        <span>Role</span>
        <span>Joined</span>
        <span>Change role</span>
      </div>

      <div
        v-for="u in filtered"
        :key="u.id"
        class="grid items-center px-4 py-3 text-[12px] transition-colors hover:bg-white/[0.02]"
        style="border-bottom:1px solid rgba(255,255,255,0.04);grid-template-columns:120px 1fr 120px 120px 140px;"
      >
        <!-- ID -->
        <span class="font-mono text-[11px]" style="color:rgba(255,255,255,0.25);" :title="u.id">{{ truncId(u.id) }}</span>

        <!-- Account -->
        <div class="min-w-0 pr-4">
          <p class="font-medium truncate" style="color:rgba(255,255,255,0.80);">{{ u.display_name ?? u.email ?? '—' }}</p>
          <p v-if="u.display_name && u.email" class="text-[11px] truncate mt-0.5" style="color:rgba(255,255,255,0.30);">{{ u.email }}</p>
        </div>

        <!-- Role badge -->
        <span
          class="inline-flex w-max items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
          :style="u.role === 'admin'
            ? 'background:rgba(139,92,246,0.12);border:1px solid rgba(139,92,246,0.22);color:rgba(167,139,250,0.85);'
            : 'background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);color:rgba(255,255,255,0.40);'"
        >
          {{ u.role ?? 'member' }}
        </span>

        <!-- Joined -->
        <span style="color:rgba(255,255,255,0.25);">{{ fmt(u.created_at) }}</span>

        <!-- Role select -->
        <div class="flex items-center gap-2">
          <select
            :value="u.role"
            :disabled="saving === u.id"
            class="rounded-lg px-2.5 py-1 text-[11px] outline-none transition-colors cursor-pointer disabled:opacity-50"
            style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);color:rgba(255,255,255,0.60);"
            @change="(e) => updateRole(u.id, (e.target as HTMLSelectElement).value)"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <Loader2 v-if="saving === u.id" class="h-3 w-3 animate-spin" style="color:rgba(255,255,255,0.30);" />
        </div>
      </div>

    </div>

    <!-- Count -->
    <p v-if="!loading && filtered.length" class="mt-3 text-[11px]" style="color:rgba(255,255,255,0.20);">
      {{ filtered.length }} {{ filtered.length === 1 ? 'user' : 'users' }}{{ search ? ' matching' : '' }}
    </p>

  </div>
</template>
