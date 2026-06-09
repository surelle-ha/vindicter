<script setup lang="ts">
import { Check, CreditCard, RefreshCw } from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Pricing — Vindicter' })

const api = useApi()

interface Plan {
  id: string
  name: string
  description: string | null
  priceUsd: number
  seatLimit: number
  projectLimit: number
  isActive: boolean
  sortOrder: number
}

const plans   = ref<Plan[]>([])
const loading = ref(true)
const err     = ref('')

async function fetchPlans() {
  loading.value = true
  err.value = ''
  try {
    plans.value = await api.get<Plan[]>('/pricing')
  } catch (e) {
    err.value = e instanceof Error ? e.message : 'Failed to load plans.'
  } finally {
    loading.value = false
  }
}

function limitLabel(n: number) {
  return n === -1 ? 'Unlimited' : String(n)
}

function priceLabel(usd: number) {
  return usd === 0 ? 'Free' : `$${usd}/mo`
}

const PLAN_FEATURES: Record<string, string[]> = {
  Free:       ['1 seat', '3 projects', 'AI scanning', 'Academy access', 'Community support'],
  Pro:        ['5 seats', '20 projects', 'AI scanning', 'Academy access', 'Priority support', 'GitHub issue export'],
  Enterprise: ['Unlimited seats', 'Unlimited projects', 'AI scanning', 'Academy access', 'Dedicated support', 'GitHub issue export', 'Custom integrations'],
}

onMounted(fetchPlans)
</script>

<template>
  <div class="max-w-5xl mx-auto">

    <div class="mb-8 flex items-start justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <CreditCard class="h-3.5 w-3.5" style="color:rgba(139,92,246,0.55);" />
          <p class="text-[10px] font-semibold uppercase tracking-[0.22em]" style="color:rgba(139,92,246,0.50);">Dashboard</p>
        </div>
        <h1 class="text-[26px] font-display font-black uppercase tracking-wide" style="color:rgba(255,255,255,0.90);">Pricing Plans</h1>
        <p class="mt-1 text-[13px]" style="color:rgba(255,255,255,0.40);">Choose the plan that fits your team.</p>
      </div>
      <button
        class="shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] transition-colors hover:bg-white/[0.06] cursor-pointer"
        style="color:rgba(255,255,255,0.35);border:1px solid rgba(255,255,255,0.08);"
        :disabled="loading"
        @click="fetchPlans"
      >
        <RefreshCw class="h-3 w-3" :class="loading ? 'animate-spin' : ''" />
        Refresh
      </button>
    </div>

    <div v-if="err" class="mb-4 rounded-xl px-4 py-3 text-[12px]" style="background:rgba(242,63,66,0.08);border:1px solid rgba(242,63,66,0.18);color:rgba(242,63,66,0.80);">
      {{ err }}
    </div>

    <div v-if="loading" class="grid sm:grid-cols-3 gap-4">
      <div v-for="i in 3" :key="i" class="h-80 rounded-xl animate-pulse" style="background:rgba(255,255,255,0.03);" />
    </div>

    <div v-else class="grid sm:grid-cols-3 gap-4">
      <div
        v-for="plan in plans.filter(p => p.isActive)"
        :key="plan.id"
        class="relative rounded-xl p-6 flex flex-col"
        :style="plan.name === 'Pro'
          ? 'background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.28);'
          : 'background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);'"
      >
        <div v-if="plan.name === 'Pro'" class="absolute -top-3 left-1/2 -translate-x-1/2">
          <span class="rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            style="background:rgba(139,92,246,0.80);color:white;">
            Most Popular
          </span>
        </div>

        <div class="mb-4">
          <p class="text-[10px] font-semibold uppercase tracking-[0.22em] mb-2" style="color:rgba(255,255,255,0.30);">
            {{ plan.name }}
          </p>
          <p class="text-[32px] font-black leading-none" style="color:rgba(255,255,255,0.90);">
            {{ priceLabel(plan.priceUsd) }}
          </p>
          <p v-if="plan.description" class="mt-2 text-[12px]" style="color:rgba(255,255,255,0.35);">
            {{ plan.description }}
          </p>
        </div>

        <!-- Limits -->
        <div class="grid grid-cols-2 gap-2 mb-5">
          <div class="rounded-lg px-3 py-2" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);">
            <p class="text-[10px] uppercase tracking-wider mb-0.5" style="color:rgba(255,255,255,0.22);">Seats</p>
            <p class="text-[15px] font-black" style="color:rgba(255,255,255,0.80);">{{ limitLabel(plan.seatLimit) }}</p>
          </div>
          <div class="rounded-lg px-3 py-2" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);">
            <p class="text-[10px] uppercase tracking-wider mb-0.5" style="color:rgba(255,255,255,0.22);">Projects</p>
            <p class="text-[15px] font-black" style="color:rgba(255,255,255,0.80);">{{ limitLabel(plan.projectLimit) }}</p>
          </div>
        </div>

        <!-- Features -->
        <ul class="flex-1 space-y-2 mb-6">
          <li
            v-for="feat in (PLAN_FEATURES[plan.name] ?? [])"
            :key="feat"
            class="flex items-center gap-2 text-[12px]"
            style="color:rgba(255,255,255,0.55);"
          >
            <Check class="h-3 w-3 shrink-0" style="color:rgba(139,92,246,0.70);" />
            {{ feat }}
          </li>
        </ul>

        <!-- CTA -->
        <button
          v-if="plan.priceUsd === 0"
          disabled
          class="w-full rounded-xl py-2.5 text-[12px] font-semibold"
          style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.30);"
        >
          Current Free Tier
        </button>
        <button
          v-else
          disabled
          class="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-[12px] font-semibold"
          style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.25);"
        >
          Coming soon
        </button>
      </div>
    </div>

    <p class="mt-6 text-center text-[11px]" style="color:rgba(255,255,255,0.18);">
      Upgrades are manually reviewed. Our team will contact you within 24 hours to complete the process.
    </p>

  </div>
</template>
