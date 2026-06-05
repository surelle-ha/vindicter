<script setup lang="ts">
import {
  CreditCard, Plus, Trash2, Edit3, Loader2, RefreshCw, Check, X, ToggleLeft, ToggleRight, Zap,
} from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Pricing Management — Vindicter' })

const api = useApi()
const { isAdmin } = useAuth()
const router = useRouter()

onMounted(() => { if (!isAdmin.value) router.push('/news') })

interface Plan {
  id: string
  name: string
  description: string | null
  tokenLimit: number
  priceUsd: number
  isActive: boolean
  sortOrder: number
  createdAt: string
}

const plans   = ref<Plan[]>([])
const loading = ref(true)
const err     = ref('')
const msg     = ref('')
const msgType = ref<'ok' | 'err'>('ok')
const saving  = ref(false)

const showAdd    = ref(false)
const editingId  = ref<string | null>(null)

const blankForm  = () => ({ name: '', description: '', tokenLimit: 0, priceUsd: 0, sortOrder: 0 })
const addForm    = reactive(blankForm())
const editForm   = reactive({ name: '', description: '', tokenLimit: 0, priceUsd: 0, sortOrder: 0 })
const addErr     = ref('')

function fmt(n: number) {
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : String(n)
}

async function fetchPlans() {
  loading.value = true; err.value = ''
  try {
    plans.value = await api.get<Plan[]>('/pricing/admin') ?? []
  } catch (e) {
    err.value = e instanceof Error ? e.message : 'Failed to load plans.'
  } finally {
    loading.value = false
  }
}

async function addPlan() {
  addErr.value = ''
  if (!addForm.name.trim())   { addErr.value = 'Name is required.'; return }
  if (addForm.tokenLimit < 0) { addErr.value = 'Token limit must be ≥ 0.'; return }
  saving.value = true
  try {
    const created = await api.post<Plan>('/pricing', {
      name:        addForm.name.trim(),
      description: addForm.description.trim() || null,
      tokenLimit:  Number(addForm.tokenLimit),
      priceUsd:    Number(addForm.priceUsd),
      sortOrder:   Number(addForm.sortOrder),
    })
    plans.value.push(created)
    plans.value.sort((a, b) => a.sortOrder - b.sortOrder)
    Object.assign(addForm, blankForm())
    showAdd.value = false
    setMsg('Plan created.', 'ok')
  } catch (e) {
    addErr.value = e instanceof Error ? e.message : 'Failed to create plan.'
  } finally {
    saving.value = false
  }
}

function startEdit(plan: Plan) {
  editingId.value      = plan.id
  editForm.name        = plan.name
  editForm.description = plan.description ?? ''
  editForm.tokenLimit  = plan.tokenLimit
  editForm.priceUsd    = plan.priceUsd
  editForm.sortOrder   = plan.sortOrder
}

async function saveEdit(plan: Plan) {
  try {
    await api.patch(`/pricing/${plan.id}`, {
      name:        editForm.name.trim(),
      description: editForm.description.trim() || null,
      tokenLimit:  Number(editForm.tokenLimit),
      priceUsd:    Number(editForm.priceUsd),
      sortOrder:   Number(editForm.sortOrder),
    })
    Object.assign(plan, {
      name:        editForm.name.trim(),
      description: editForm.description.trim() || null,
      tokenLimit:  Number(editForm.tokenLimit),
      priceUsd:    Number(editForm.priceUsd),
      sortOrder:   Number(editForm.sortOrder),
    })
    plans.value.sort((a, b) => a.sortOrder - b.sortOrder)
    editingId.value = null
    setMsg('Plan saved.', 'ok')
  } catch (e) {
    setMsg(e instanceof Error ? e.message : 'Failed to save.', 'err')
  }
}

async function toggleActive(plan: Plan) {
  try {
    await api.patch(`/pricing/${plan.id}`, { isActive: !plan.isActive })
    plan.isActive = !plan.isActive
  } catch (e) {
    setMsg(e instanceof Error ? e.message : 'Failed to update.', 'err')
  }
}

async function deletePlan(id: string) {
  if (!confirm('Delete this plan?')) return
  try {
    await api.del(`/pricing/${id}`)
    plans.value = plans.value.filter(p => p.id !== id)
    setMsg('Plan deleted.', 'ok')
  } catch (e) {
    setMsg(e instanceof Error ? e.message : 'Failed to delete.', 'err')
  }
}

function setMsg(text: string, type: 'ok' | 'err') {
  msg.value = text; msgType.value = type
  setTimeout(() => { msg.value = '' }, 3000)
}

onMounted(fetchPlans)
</script>

<template>
  <div class="max-w-4xl mx-auto">

    <!-- Header -->
    <div class="mb-6 flex items-start justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <CreditCard class="h-3.5 w-3.5" style="color:rgba(248,113,113,0.55);" />
          <p class="text-[10px] font-semibold uppercase tracking-[0.22em]" style="color:rgba(248,113,113,0.50);">Admin</p>
        </div>
        <h1 class="text-[26px] font-display font-black uppercase tracking-wide" style="color:rgba(255,255,255,0.90);">Pricing Management</h1>
        <p class="mt-1 text-[13px]" style="color:rgba(255,255,255,0.40);">Manage DefendCore token-based subscription plans.</p>
      </div>
      <div class="flex gap-2 shrink-0">
        <button class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] transition-colors hover:bg-white/[0.06] cursor-pointer"
          style="color:rgba(255,255,255,0.35);border:1px solid rgba(255,255,255,0.08);"
          :disabled="loading" @click="fetchPlans">
          <RefreshCw class="h-3 w-3" :class="loading ? 'animate-spin' : ''" /> Refresh
        </button>
        <button class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-semibold transition-colors cursor-pointer"
          style="background:rgba(139,92,246,0.18);border:1px solid rgba(139,92,246,0.30);color:rgba(167,139,250,0.95);"
          @click="showAdd = !showAdd">
          <Plus class="h-3 w-3" /> Add Plan
        </button>
      </div>
    </div>

    <!-- Message -->
    <div v-if="msg" class="mb-4 rounded-xl px-4 py-2.5 text-[12px]"
      :style="msgType === 'ok'
        ? 'background:rgba(35,165,90,0.08);border:1px solid rgba(35,165,90,0.18);color:rgba(35,165,90,0.85);'
        : 'background:rgba(242,63,66,0.08);border:1px solid rgba(242,63,66,0.18);color:rgba(242,63,66,0.80);'"
    >{{ msg }}</div>

    <!-- Error -->
    <div v-if="err" class="mb-4 rounded-xl px-4 py-3 text-[12px]" style="background:rgba(242,63,66,0.08);border:1px solid rgba(242,63,66,0.18);color:rgba(242,63,66,0.80);">{{ err }}</div>

    <!-- Note about DefendCore -->
    <div class="mb-5 rounded-xl px-4 py-3 flex items-start gap-3" style="background:rgba(139,92,246,0.06);border:1px solid rgba(139,92,246,0.14);">
      <Zap class="h-4 w-4 shrink-0 mt-0.5" style="color:rgba(167,139,250,0.65);" />
      <p class="text-[12px] leading-relaxed" style="color:rgba(255,255,255,0.45);">
        Plans define the token allowances for DefendCore usage. Token limits represent monthly AI token consumption.
        Pricing is informational until DefendCore billing is live.
      </p>
    </div>

    <!-- Add plan form -->
    <div v-if="showAdd" class="mb-5 rounded-xl p-5 space-y-4" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.09);">
      <p class="text-[12px] font-semibold" style="color:rgba(255,255,255,0.70);">New Plan</p>
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="color:rgba(255,255,255,0.30);">Name</label>
          <input v-model="addForm.name" placeholder="e.g. Pro"
            class="w-full rounded-xl px-3 py-2 text-[12px] text-white outline-none"
            style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);" />
        </div>
        <div>
          <label class="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="color:rgba(255,255,255,0.30);">Description</label>
          <input v-model="addForm.description" placeholder="Short description"
            class="w-full rounded-xl px-3 py-2 text-[12px] text-white outline-none"
            style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);" />
        </div>
        <div>
          <label class="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="color:rgba(255,255,255,0.30);">Token Limit</label>
          <input v-model.number="addForm.tokenLimit" type="number" min="0" placeholder="e.g. 1000000"
            class="w-full rounded-xl px-3 py-2 text-[12px] text-white outline-none"
            style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);" />
        </div>
        <div>
          <label class="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="color:rgba(255,255,255,0.30);">Price (USD/mo)</label>
          <input v-model.number="addForm.priceUsd" type="number" min="0" step="0.01" placeholder="0.00"
            class="w-full rounded-xl px-3 py-2 text-[12px] text-white outline-none"
            style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);" />
        </div>
        <div>
          <label class="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="color:rgba(255,255,255,0.30);">Sort Order</label>
          <input v-model.number="addForm.sortOrder" type="number" min="0"
            class="w-full rounded-xl px-3 py-2 text-[12px] text-white outline-none"
            style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);" />
        </div>
      </div>
      <p v-if="addErr" class="text-[11px]" style="color:rgba(242,63,66,0.80);">{{ addErr }}</p>
      <div class="flex gap-2">
        <button :disabled="saving"
          class="flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12px] font-semibold disabled:opacity-50 cursor-pointer"
          style="background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.28);color:rgba(167,139,250,0.90);"
          @click="addPlan">
          <Loader2 v-if="saving" class="h-3 w-3 animate-spin" />
          <Plus v-else class="h-3 w-3" /> Create
        </button>
        <button class="rounded-xl px-4 py-2 text-[12px] cursor-pointer"
          style="border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.35);"
          @click="showAdd = false">Cancel</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-2">
      <div v-for="i in 4" :key="i" class="h-16 rounded-xl animate-pulse" style="background:rgba(255,255,255,0.03);" />
    </div>

    <!-- Plans grid -->
    <div v-else-if="plans.length" class="grid gap-3 sm:grid-cols-2">
      <div v-for="plan in plans" :key="plan.id"
        class="rounded-xl p-5 transition-colors"
        :style="plan.isActive
          ? 'background:rgba(255,255,255,0.03);border:1px solid rgba(139,92,246,0.18);'
          : 'background:rgba(255,255,255,0.015);border:1px solid rgba(255,255,255,0.07);opacity:0.55;'">

        <!-- View mode -->
        <template v-if="editingId !== plan.id">
          <div class="flex items-start justify-between gap-2 mb-3">
            <div>
              <p class="text-[15px] font-bold" style="color:rgba(255,255,255,0.88);">{{ plan.name }}</p>
              <p v-if="plan.description" class="text-[11px] mt-0.5" style="color:rgba(255,255,255,0.35);">{{ plan.description }}</p>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <button class="h-6 w-6 flex items-center justify-center rounded transition-colors hover:bg-white/[0.06] cursor-pointer"
                style="color:rgba(255,255,255,0.28);" @click="startEdit(plan)">
                <Edit3 class="h-3 w-3" />
              </button>
              <button class="h-6 w-6 flex items-center justify-center rounded transition-colors cursor-pointer"
                @click="toggleActive(plan)" :title="plan.isActive ? 'Disable' : 'Enable'">
                <ToggleRight v-if="plan.isActive" class="h-4 w-4" style="color:rgba(35,165,90,0.75);" />
                <ToggleLeft v-else class="h-4 w-4" style="color:rgba(255,255,255,0.25);" />
              </button>
              <button class="h-6 w-6 flex items-center justify-center rounded transition-colors hover:bg-red-500/10 cursor-pointer"
                style="color:rgba(248,113,113,0.40);" @click="deletePlan(plan.id)">
                <Trash2 class="h-3 w-3" />
              </button>
            </div>
          </div>
          <div class="flex items-end justify-between mt-4">
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style="color:rgba(255,255,255,0.25);">Tokens / month</p>
              <p class="text-[18px] font-black" style="color:rgba(167,139,250,0.90);">{{ fmt(plan.tokenLimit) }}</p>
            </div>
            <div class="text-right">
              <p class="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style="color:rgba(255,255,255,0.25);">Price</p>
              <p class="text-[18px] font-black" style="color:rgba(255,255,255,0.80);">
                {{ plan.priceUsd === 0 ? 'Free' : `$${Number(plan.priceUsd).toFixed(2)}/mo` }}
              </p>
            </div>
          </div>
        </template>

        <!-- Edit mode -->
        <template v-else>
          <div class="space-y-3">
            <div class="grid gap-2 grid-cols-2">
              <div>
                <label class="block text-[9px] font-semibold uppercase tracking-wider mb-1" style="color:rgba(255,255,255,0.25);">Name</label>
                <input v-model="editForm.name" class="w-full rounded-lg px-2.5 py-1.5 text-[12px] text-white outline-none"
                  style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.10);" />
              </div>
              <div>
                <label class="block text-[9px] font-semibold uppercase tracking-wider mb-1" style="color:rgba(255,255,255,0.25);">Sort</label>
                <input v-model.number="editForm.sortOrder" type="number" class="w-full rounded-lg px-2.5 py-1.5 text-[12px] text-white outline-none"
                  style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.10);" />
              </div>
            </div>
            <div>
              <label class="block text-[9px] font-semibold uppercase tracking-wider mb-1" style="color:rgba(255,255,255,0.25);">Description</label>
              <input v-model="editForm.description" class="w-full rounded-lg px-2.5 py-1.5 text-[12px] text-white outline-none"
                style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.10);" />
            </div>
            <div class="grid gap-2 grid-cols-2">
              <div>
                <label class="block text-[9px] font-semibold uppercase tracking-wider mb-1" style="color:rgba(255,255,255,0.25);">Token Limit</label>
                <input v-model.number="editForm.tokenLimit" type="number" min="0" class="w-full rounded-lg px-2.5 py-1.5 text-[12px] text-white outline-none"
                  style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.10);" />
              </div>
              <div>
                <label class="block text-[9px] font-semibold uppercase tracking-wider mb-1" style="color:rgba(255,255,255,0.25);">Price USD</label>
                <input v-model.number="editForm.priceUsd" type="number" min="0" step="0.01" class="w-full rounded-lg px-2.5 py-1.5 text-[12px] text-white outline-none"
                  style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.10);" />
              </div>
            </div>
            <div class="flex gap-2 pt-1">
              <button class="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-semibold cursor-pointer"
                style="background:rgba(35,165,90,0.12);border:1px solid rgba(35,165,90,0.22);color:rgba(35,165,90,0.85);"
                @click="saveEdit(plan)">
                <Check class="h-3 w-3" /> Save
              </button>
              <button class="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] cursor-pointer"
                style="border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.30);"
                @click="editingId = null">
                <X class="h-3 w-3" /> Cancel
              </button>
            </div>
          </div>
        </template>

      </div>
    </div>

    <!-- Empty -->
    <div v-else class="rounded-xl px-5 py-14 text-center"
      style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);">
      <CreditCard class="h-8 w-8 mx-auto mb-3" style="color:rgba(255,255,255,0.12);" />
      <p class="text-[12px]" style="color:rgba(255,255,255,0.25);">No plans yet. Add one above.</p>
    </div>

  </div>
</template>
