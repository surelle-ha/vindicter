<script setup lang="ts">
import {
  Building2, Crown, Users, CreditCard, RefreshCw,
  ChevronDown, Check, Loader2, AlertTriangle,
} from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Workspaces — Admin' })

const api = useApi()

interface Plan { id: string; name: string; priceUsd: number; seatLimit: number; projectLimit: number }
interface Sub  { id: string; status: string; seatLimit: number; projectLimit: number; plan?: Plan | null }
interface Mem  { id: string; memberRole: string; user?: { id: string; email: string; firstName?: string; lastName?: string } }
interface Workspace {
  id: string; name: string; ownerId: string | null; createdAt: string
  memberCount: number; members: Mem[]; subscription: Sub | null
}

const workspaces = ref<Workspace[]>([])
const plans      = ref<Plan[]>([])
const loading    = ref(true)
const err        = ref('')

async function fetchAll() {
  loading.value = true; err.value = ''
  try {
    const [wsList, planList] = await Promise.all([
      api.get<Workspace[]>('/workspaces/admin/all'),
      api.get<Plan[]>('/pricing'),
    ])
    workspaces.value = wsList
    plans.value = planList.filter(p => (p as any).isActive ?? true)
  } catch (e) {
    err.value = e instanceof Error ? e.message : 'Failed to load.'
  } finally { loading.value = false }
}

// ── Plan change ─────────────────────────────────────────────────────────────
const changingPlan = ref<string | null>(null)
const planMenuOpen = ref<string | null>(null)
const planErr      = ref<Record<string, string>>({})

async function changePlan(workspaceId: string, planId: string) {
  changingPlan.value = workspaceId
  planMenuOpen.value = null
  delete planErr.value[workspaceId]
  try {
    await api.patch(`/workspaces/admin/${workspaceId}/plan`, { planId })
    await fetchAll()
  } catch (e) {
    planErr.value[workspaceId] = e instanceof Error ? e.message : 'Failed to change plan.'
  } finally { changingPlan.value = null }
}

function memberName(m: Mem) {
  const parts = [m.user?.firstName, m.user?.lastName].filter(Boolean)
  return parts.length ? parts.join(' ') : (m.user?.email ?? 'Unknown')
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function limitLabel(n: number) { return n === -1 ? '∞' : String(n) }

onMounted(fetchAll)
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <Building2 class="h-3.5 w-3.5" style="color:rgba(245,158,11,0.55);" />
          <p class="text-[10px] font-semibold uppercase tracking-[0.22em]" style="color:rgba(245,158,11,0.50);">Admin</p>
        </div>
        <h1 class="text-[22px] font-black uppercase tracking-wide" style="color:rgba(255,255,255,0.90);">Workspaces</h1>
        <p class="mt-0.5 text-[12px]" style="color:rgba(255,255,255,0.35);">Manage workspace subscriptions.</p>
      </div>
      <button
        class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] cursor-pointer transition-colors hover:bg-white/[0.06]"
        style="color:rgba(255,255,255,0.35);border:1px solid rgba(255,255,255,0.08);"
        :disabled="loading" @click="fetchAll"
      >
        <RefreshCw class="h-3 w-3" :class="loading ? 'animate-spin' : ''" /> Refresh
      </button>
    </div>

    <div v-if="err" class="mb-4 rounded-xl px-4 py-3 text-[12px]" style="background:rgba(242,63,66,0.08);border:1px solid rgba(242,63,66,0.18);color:rgba(242,63,66,0.80);">
      {{ err }}
    </div>

    <div v-if="loading" class="space-y-3">
      <div v-for="i in 4" :key="i" class="h-20 rounded-xl animate-pulse" style="background:rgba(255,255,255,0.03);" />
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="ws in workspaces" :key="ws.id"
        class="rounded-xl p-4"
        style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);"
      >
        <div class="flex items-start gap-4 flex-wrap">

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <Building2 class="h-3.5 w-3.5 shrink-0" style="color:rgba(255,255,255,0.25);" />
              <p class="text-[13px] font-semibold truncate" style="color:rgba(255,255,255,0.82);">{{ ws.name }}</p>
            </div>
            <p class="text-[10px] pl-5" style="color:rgba(255,255,255,0.22);">Created {{ fmt(ws.createdAt) }} · {{ ws.memberCount }} member{{ ws.memberCount !== 1 ? 's' : '' }}</p>
          </div>

          <!-- Subscription badge -->
          <div class="flex items-center gap-3 shrink-0">
            <div class="text-right">
              <p class="text-[10px] font-bold" style="color:rgba(245,158,11,0.70);">{{ ws.subscription?.plan?.name ?? 'No Plan' }}</p>
              <p class="text-[10px]" style="color:rgba(255,255,255,0.22);">
                {{ limitLabel(ws.subscription?.seatLimit ?? 0) }} seats · {{ limitLabel(ws.subscription?.projectLimit ?? 0) }} projects
              </p>
            </div>

            <!-- Plan picker -->
            <div class="relative">
              <button
                class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium cursor-pointer transition-colors"
                style="background:rgba(245,158,11,0.10);border:1px solid rgba(245,158,11,0.20);color:rgba(245,158,11,0.75);"
                :disabled="changingPlan === ws.id"
                @click="planMenuOpen = planMenuOpen === ws.id ? null : ws.id"
              >
                <Loader2 v-if="changingPlan === ws.id" class="h-3 w-3 animate-spin" />
                <CreditCard v-else class="h-3 w-3" />
                Change Plan
                <ChevronDown class="h-3 w-3" />
              </button>

              <div
                v-if="planMenuOpen === ws.id"
                class="absolute right-0 top-full mt-1 z-20 min-w-[160px] rounded-xl overflow-hidden shadow-xl"
                style="background:#18181b;border:1px solid rgba(255,255,255,0.10);"
              >
                <button
                  v-for="plan in plans" :key="plan.id"
                  class="w-full flex items-center justify-between px-3 py-2.5 text-[12px] cursor-pointer transition-colors hover:bg-white/[0.05]"
                  :style="ws.subscription?.plan?.id === plan.id ? 'color:rgba(245,158,11,0.85);' : 'color:rgba(255,255,255,0.65);'"
                  @click="changePlan(ws.id, plan.id)"
                >
                  <span>{{ plan.name }}</span>
                  <div class="flex items-center gap-1.5">
                    <span class="text-[10px]" style="color:rgba(255,255,255,0.28);">
                      {{ plan.priceUsd === 0 ? 'Free' : `$${plan.priceUsd}/mo` }}
                    </span>
                    <Check v-if="ws.subscription?.plan?.id === plan.id" class="h-3 w-3" style="color:rgba(245,158,11,0.70);" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="planErr[ws.id]" class="mt-2 text-[11px]" style="color:rgba(242,63,66,0.75);">
          <AlertTriangle class="inline h-3 w-3 mr-1" />{{ planErr[ws.id] }}
        </div>

        <!-- Members -->
        <div v-if="ws.members.length" class="mt-3 flex flex-wrap gap-1.5 pl-1">
          <div
            v-for="m in ws.members" :key="m.id"
            class="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px]"
            style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);color:rgba(255,255,255,0.40);"
          >
            <Crown v-if="m.memberRole === 'owner'" class="h-2.5 w-2.5" style="color:rgba(251,191,36,0.55);" />
            <span>{{ memberName(m) }}</span>
          </div>
        </div>

      </div>

      <p v-if="!workspaces.length" class="text-center py-10 text-[12px]" style="color:rgba(255,255,255,0.20);">
        No workspaces found.
      </p>
    </div>

  </div>
</template>
