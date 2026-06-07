<script setup lang="ts">
import {
  Building2, Crown, Shield, Users, FolderOpen, CreditCard,
  Loader2, RefreshCw, UserPlus, X, CheckCircle2, Mail, UserMinus,
} from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Workspace — Vindicter' })

const api = useApi()

interface WorkspaceMember {
  id: string
  memberRole: string
  joinedAt: string
  user?: { id: string; email: string; firstName?: string; lastName?: string }
}
interface Plan {
  id: string; name: string; priceUsd: number; seatLimit: number; projectLimit: number
}
interface Subscription {
  id: string; status: string; seatLimit: number; projectLimit: number
  periodEnd?: string; plan?: Plan | null
}
interface Workspace {
  id: string; name: string; ownerId: string | null; createdAt: string
  memberRole?: string
  members?: WorkspaceMember[]
  subscription?: Subscription | null
}
interface Invitation {
  id: string
  workspace: { id: string; name: string }
  inviterName: string
  inviteeEmail: string
  expiresAt: string | null
  createdAt: string
}

const workspaces      = ref<Workspace[]>([])
const pendingInvites  = ref<Invitation[]>([])
const loading         = ref(true)
const err             = ref('')
const activeId        = ref<string | null>(null)

async function fetchWorkspaces() {
  loading.value = true; err.value = ''
  try {
    const [ws, inv] = await Promise.all([
      api.get<Workspace[]>('/workspaces'),
      api.get<Invitation[]>('/workspaces/invitations/me').catch(() => [] as Invitation[]),
    ])
    workspaces.value     = ws
    pendingInvites.value = inv
    if (ws.length && !activeId.value) activeId.value = ws[0]!.id
  } catch (e) {
    err.value = e instanceof Error ? e.message : 'Failed to load workspaces.'
  } finally { loading.value = false }
}

const active = computed(() => workspaces.value.find(w => w.id === activeId.value) ?? null)
const sub    = computed(() => active.value?.subscription ?? null)

function planLabel(n: number) { return n === -1 ? '∞' : String(n) }

function memberName(m: WorkspaceMember) {
  const parts = [m.user?.firstName, m.user?.lastName].filter(Boolean)
  return parts.length ? parts.join(' ') : (m.user?.email ?? 'Unknown')
}

function memberInitials(m: WorkspaceMember) {
  const name = memberName(m)
  return name.split(' ').map(n => n[0] ?? '').join('').slice(0, 2).toUpperCase()
}

function fmt(iso?: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Send invitation ────────────────────────────────────────────────────────
const showInvite  = ref(false)
const inviteEmail = ref('')
const inviting    = ref(false)
const inviteErr   = ref('')
const inviteOk    = ref(false)

async function submitInvite() {
  if (!inviteEmail.value.trim() || !activeId.value) return
  inviting.value = true; inviteErr.value = ''; inviteOk.value = false
  try {
    await api.post(`/workspaces/${activeId.value}/invitations`, { email: inviteEmail.value.trim() })
    inviteEmail.value = ''
    inviteOk.value    = true
    setTimeout(() => { inviteOk.value = false; showInvite.value = false }, 2500)
  } catch (e) {
    inviteErr.value = e instanceof Error ? e.message : 'Failed to send invitation.'
  } finally { inviting.value = false }
}

// ── Accept / decline invitation ────────────────────────────────────────────
const respondingId = ref<string | null>(null)

async function respond(invId: string, action: 'accept' | 'decline') {
  respondingId.value = invId
  try {
    await api.post(`/workspaces/invitations/${invId}/${action}`, {})
    pendingInvites.value = pendingInvites.value.filter(i => i.id !== invId)
    if (action === 'accept') await fetchWorkspaces()
  } finally { respondingId.value = null }
}

// ── Remove member ──────────────────────────────────────────────────────────
const removing = ref<string | null>(null)

async function removeMember(userId: string) {
  if (!activeId.value) return
  removing.value = userId
  try {
    await api.del(`/workspaces/${activeId.value}/members/${userId}`)
    await fetchWorkspaces()
  } finally { removing.value = null }
}

onMounted(fetchWorkspaces)
</script>

<template>
  <div class="max-w-4xl mx-auto">

    <div class="mb-6 flex items-start justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <Building2 class="h-3.5 w-3.5" style="color:rgba(139,92,246,0.55);" />
          <p class="text-[10px] font-semibold uppercase tracking-[0.22em]" style="color:rgba(139,92,246,0.50);">Dashboard</p>
        </div>
        <h1 class="text-[26px] font-display font-black uppercase tracking-wide" style="color:rgba(255,255,255,0.90);">Workspaces</h1>
        <p class="mt-1 text-[13px]" style="color:rgba(255,255,255,0.40);">Manage your team and subscription.</p>
      </div>
      <button
        class="shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] transition-colors hover:bg-white/[0.06] cursor-pointer"
        style="color:rgba(255,255,255,0.35);border:1px solid rgba(255,255,255,0.08);"
        :disabled="loading" @click="fetchWorkspaces"
      >
        <RefreshCw class="h-3 w-3" :class="loading ? 'animate-spin' : ''" />
        Refresh
      </button>
    </div>

    <div v-if="err" class="mb-4 rounded-xl px-4 py-3 text-[12px]" style="background:rgba(242,63,66,0.08);border:1px solid rgba(242,63,66,0.18);color:rgba(242,63,66,0.80);">{{ err }}</div>

    <!-- Pending invitations banner -->
    <div v-if="pendingInvites.length" class="mb-5 rounded-xl p-4" style="background:rgba(139,92,246,0.07);border:1px solid rgba(139,92,246,0.18);">
      <div class="flex items-center gap-2 mb-3">
        <Mail class="h-3.5 w-3.5" style="color:rgba(139,92,246,0.65);" />
        <p class="text-[10px] font-semibold uppercase tracking-[0.22em]" style="color:rgba(255,255,255,0.35);">Pending Invitations</p>
      </div>
      <div class="space-y-2">
        <div
          v-for="inv in pendingInvites" :key="inv.id"
          class="flex items-center gap-3 rounded-lg px-3 py-2.5"
          style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);"
        >
          <div class="flex-1 min-w-0">
            <p class="text-[12px] font-semibold" style="color:rgba(255,255,255,0.80);">{{ inv.workspace.name }}</p>
            <p class="text-[10px]" style="color:rgba(255,255,255,0.30);">Invited by {{ inv.inviterName }}<span v-if="inv.expiresAt"> · Expires {{ fmt(inv.expiresAt) }}</span></p>
          </div>
          <div class="flex gap-2 shrink-0">
            <button
              :disabled="respondingId === inv.id"
              class="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-40"
              style="background:rgba(139,92,246,0.70);color:white;"
              @click="respond(inv.id, 'accept')"
            >
              <Loader2 v-if="respondingId === inv.id" class="h-3 w-3 animate-spin" />
              <CheckCircle2 v-else class="h-3 w-3" />
              Accept
            </button>
            <button
              :disabled="respondingId === inv.id"
              class="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-40"
              style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);color:rgba(255,255,255,0.40);"
              @click="respond(inv.id, 'decline')"
            >
              <X class="h-3 w-3" />
              Decline
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="space-y-3">
      <div v-for="i in 2" :key="i" class="h-24 rounded-xl animate-pulse" style="background:rgba(255,255,255,0.03);" />
    </div>

    <template v-else-if="workspaces.length">
      <div class="grid sm:grid-cols-[200px_1fr] gap-4">

        <!-- Sidebar list -->
        <div class="space-y-1.5">
          <div
            v-for="ws in workspaces" :key="ws.id"
            class="flex items-center gap-2.5 rounded-xl px-3 py-2.5 cursor-pointer transition-colors"
            :style="activeId === ws.id
              ? 'background:rgba(139,92,246,0.10);border:1px solid rgba(139,92,246,0.20);'
              : 'background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);'"
            @click="activeId = ws.id"
          >
            <Building2 class="h-3.5 w-3.5 shrink-0" :style="activeId === ws.id ? 'color:rgba(139,92,246,0.70)' : 'color:rgba(255,255,255,0.25)'" />
            <p class="text-[12px] font-medium truncate" :style="activeId === ws.id ? 'color:rgba(255,255,255,0.85)' : 'color:rgba(255,255,255,0.45)'">{{ ws.name }}</p>
          </div>
        </div>

        <!-- Detail panel -->
        <div v-if="active" class="space-y-4">

          <!-- Header -->
          <div class="rounded-xl p-5" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);">
            <h2 class="text-[18px] font-display font-black uppercase tracking-wide" style="color:rgba(255,255,255,0.88);">{{ active.name }}</h2>
            <p class="text-[11px] mt-1" style="color:rgba(255,255,255,0.28);">Created {{ fmt(active.createdAt) }}</p>
          </div>

          <!-- Subscription -->
          <div class="rounded-xl p-5" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);">
            <div class="flex items-center gap-2 mb-4">
              <CreditCard class="h-3.5 w-3.5" style="color:rgba(139,92,246,0.55);" />
              <p class="text-[10px] font-semibold uppercase tracking-[0.22em]" style="color:rgba(255,255,255,0.22);">Subscription</p>
              <span
                v-if="sub" class="ml-auto rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                :style="sub.status === 'active'
                  ? 'background:rgba(35,165,90,0.10);border:1px solid rgba(35,165,90,0.20);color:rgba(35,165,90,0.75);'
                  : 'background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);color:rgba(255,255,255,0.35);'"
              >{{ sub.status }}</span>
            </div>
            <div v-if="sub" class="grid grid-cols-3 gap-4">
              <div>
                <p class="text-[10px] uppercase tracking-wider mb-1" style="color:rgba(255,255,255,0.22);">Plan</p>
                <p class="text-[16px] font-black" style="color:rgba(139,92,246,0.90);">{{ sub.plan?.name ?? 'Free' }}</p>
              </div>
              <div>
                <p class="text-[10px] uppercase tracking-wider mb-1" style="color:rgba(255,255,255,0.22);">Seats</p>
                <div class="flex items-baseline gap-1.5">
                  <p class="text-[16px] font-black" style="color:rgba(255,255,255,0.80);">{{ active.members?.length ?? 0 }}</p>
                  <p class="text-[11px]" style="color:rgba(255,255,255,0.28);">/ {{ planLabel(sub.seatLimit) }}</p>
                </div>
              </div>
              <div>
                <p class="text-[10px] uppercase tracking-wider mb-1" style="color:rgba(255,255,255,0.22);">Projects</p>
                <p class="text-[16px] font-black" style="color:rgba(255,255,255,0.80);">{{ planLabel(sub.projectLimit) }}</p>
              </div>
            </div>
            <div class="mt-4">
              <NuxtLink to="/pricing" class="text-[11px] cursor-pointer transition-colors" style="color:rgba(139,92,246,0.60);" onmouseover="this.style.color='rgba(139,92,246,0.90)'" onmouseout="this.style.color='rgba(139,92,246,0.60)'">
                View plans &amp; upgrade →
              </NuxtLink>
            </div>
          </div>

          <!-- Members -->
          <div class="rounded-xl p-5" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);">
            <div class="flex items-center gap-2 mb-4">
              <Users class="h-3.5 w-3.5" style="color:rgba(139,92,246,0.55);" />
              <p class="text-[10px] font-semibold uppercase tracking-[0.22em]" style="color:rgba(255,255,255,0.22);">Members</p>
              <span class="ml-auto rounded-full px-2 py-0.5 text-[10px]" style="background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.30);">
                {{ active.members?.length ?? 0 }}
              </span>
              <button
                v-if="active.memberRole && ['owner','admin'].includes(active.memberRole)"
                class="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium transition-colors cursor-pointer"
                style="background:rgba(139,92,246,0.12);border:1px solid rgba(139,92,246,0.22);color:rgba(167,139,250,0.80);"
                @click="showInvite = !showInvite"
              >
                <UserPlus class="h-3 w-3" />
                Invite
              </button>
            </div>

            <!-- Invite form -->
            <Transition enter-active-class="transition-all duration-200" enter-from-class="opacity-0 -translate-y-1" enter-to-class="opacity-100 translate-y-0">
              <div v-if="showInvite" class="mb-4 rounded-xl p-4" style="background:rgba(139,92,246,0.06);border:1px solid rgba(139,92,246,0.15);">
                <p class="text-[10px] font-semibold uppercase tracking-wider mb-1" style="color:rgba(255,255,255,0.30);">Send invitation</p>
                <p class="text-[10px] mb-3" style="color:rgba(255,255,255,0.20);">An invitation will be sent to the user's Vindicter account. They must accept before joining.</p>
                <div class="flex gap-2">
                  <input
                    v-model="inviteEmail"
                    type="email"
                    placeholder="member@example.com"
                    class="flex-1 rounded-lg px-3 py-2 text-[12px] text-white outline-none"
                    style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.10);"
                    @keydown.enter="submitInvite"
                  />
                  <button
                    :disabled="!inviteEmail.trim() || inviting"
                    class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-semibold transition-colors cursor-pointer disabled:opacity-40"
                    style="background:rgba(139,92,246,0.70);color:white;"
                    @click="submitInvite"
                  >
                    <Loader2 v-if="inviting" class="h-3.5 w-3.5 animate-spin" />
                    <CheckCircle2 v-else-if="inviteOk" class="h-3.5 w-3.5" />
                    <Mail v-else class="h-3.5 w-3.5" />
                    {{ inviteOk ? 'Sent!' : 'Send invite' }}
                  </button>
                  <button class="rounded-lg p-2 transition-colors cursor-pointer" style="color:rgba(255,255,255,0.30);" @click="showInvite = false; inviteErr = ''">
                    <X class="h-3.5 w-3.5" />
                  </button>
                </div>
                <p v-if="inviteErr" class="mt-2 text-[11px]" style="color:rgba(242,63,66,0.80);">{{ inviteErr }}</p>
              </div>
            </Transition>

            <div class="space-y-2">
              <div
                v-for="m in (active.members ?? [])" :key="m.id"
                class="flex items-center gap-3 rounded-lg px-3 py-2 group"
                style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);"
              >
                <div class="h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style="background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.22);color:rgba(167,139,250,0.85);">
                  {{ memberInitials(m) }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-[12px] font-medium truncate" style="color:rgba(255,255,255,0.72);">{{ memberName(m) }}</p>
                  <p class="text-[10px] truncate" style="color:rgba(255,255,255,0.28);">{{ m.user?.email }}</p>
                </div>
                <div class="flex items-center gap-1.5 shrink-0">
                  <Crown v-if="m.memberRole === 'owner'" class="h-3 w-3" style="color:rgba(251,191,36,0.60);" />
                  <Shield v-else-if="m.memberRole === 'admin'" class="h-3 w-3" style="color:rgba(139,92,246,0.60);" />
                  <span class="rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
                    style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.35);">
                    {{ m.memberRole }}
                  </span>
                  <button
                    v-if="m.memberRole !== 'owner' && active.memberRole && ['owner','admin'].includes(active.memberRole)"
                    class="opacity-0 group-hover:opacity-100 flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] transition-all cursor-pointer"
                    style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.35);"
                    :disabled="removing === m.user?.id"
                    @click="m.user?.id && removeMember(m.user.id)"
                  >
                    <Loader2 v-if="removing === m.user?.id" class="h-3 w-3 animate-spin" />
                    <UserMinus v-else class="h-3 w-3" />
                    Remove
                  </button>
                </div>
              </div>
              <p v-if="!active.members?.length" class="text-[12px]" style="color:rgba(255,255,255,0.22);">No members listed.</p>
            </div>
          </div>

        </div>
      </div>
    </template>

    <div v-else-if="!loading && !err && !pendingInvites.length" class="rounded-xl px-5 py-14 text-center"
      style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);">
      <Building2 class="h-8 w-8 mx-auto mb-3" style="color:rgba(255,255,255,0.12);" />
      <p class="text-[12px]" style="color:rgba(255,255,255,0.25);">No workspaces found.</p>
    </div>

  </div>
</template>
