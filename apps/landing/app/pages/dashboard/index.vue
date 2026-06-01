<script setup lang="ts">
import { Users, MessageCircle, Star, ShieldAlert } from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Dashboard — Vindicta' })

const supabase = useSupabase()
const { isAdmin } = useAuth()

interface Update { id: string; title: string; summary: string | null; published_at: string }
const updates = ref<Update[]>([])
const loading = ref(true)

onMounted(async () => {
  const { data } = await supabase
    .from('newsletter_updates')
    .select('id, title, summary, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(3)
  updates.value = (data ?? []) as Update[]
  loading.value = false
})

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<template>
  <div class="max-w-3xl mx-auto">

    <!-- Welcome -->
    <div class="mb-8">
      <p class="text-[11px] font-semibold uppercase tracking-[0.25em] mb-1" style="color:rgba(139,92,246,0.70);">Member Portal</p>
      <h1 class="text-[26px] font-display font-black uppercase tracking-wide" style="color:rgba(255,255,255,0.90);">Welcome back</h1>
      <p class="mt-1 text-[13px]" style="color:rgba(255,255,255,0.40);">Here's what's happening with Vindicta.</p>
    </div>

    <!-- Cards row -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-8">

      <!-- DefendCore card -->
      <div class="rounded-2xl p-5" style="background:rgba(79,70,229,0.10);border:1px solid rgba(79,70,229,0.20);">
        <div class="flex items-center gap-3 mb-4">
          <div class="flex h-9 w-9 items-center justify-center rounded-xl" style="background:rgba(79,70,229,0.15);border:1px solid rgba(79,70,229,0.25);">
            <svg class="h-4 w-4" style="color:rgb(129,140,248);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <div>
            <p class="text-[13px] font-bold" style="color:rgba(255,255,255,0.85);">DefendCore</p>
            <p class="text-[10px]" style="color:rgba(139,92,246,0.60);">AI Security Model</p>
          </div>
        </div>
        <div class="rounded-xl px-3 py-2 text-[11px] flex items-center gap-2" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);">
          <span class="h-1.5 w-1.5 rounded-full animate-pulse" style="background:rgba(245,158,11,0.80);" />
          <span style="color:rgba(255,255,255,0.45);">Subscription management coming soon</span>
        </div>
        <NuxtLink to="/dashboard/subscription" class="mt-3 flex items-center gap-1 text-[11px] transition-colors" style="color:rgba(129,140,248,0.70);">
          Learn more →
        </NuxtLink>
      </div>

      <!-- Updates card -->
      <div class="rounded-2xl p-5" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);">
        <div class="flex items-center gap-3 mb-4">
          <div class="flex h-9 w-9 items-center justify-center rounded-xl" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);">
            <svg class="h-4 w-4" style="color:rgba(255,255,255,0.40);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
            </svg>
          </div>
          <div>
            <p class="text-[13px] font-bold" style="color:rgba(255,255,255,0.85);">Latest Updates</p>
            <p class="text-[10px]" style="color:rgba(255,255,255,0.30);">Vindicta changelog</p>
          </div>
        </div>
        <p class="text-[12px] leading-relaxed" style="color:rgba(255,255,255,0.40);">
          Stay up to date with new features, improvements, and security notes from the Vindicta team.
        </p>
        <NuxtLink to="/dashboard/updates" class="mt-3 flex items-center gap-1 text-[11px] transition-colors" style="color:rgba(255,255,255,0.35);">
          View all updates →
        </NuxtLink>
      </div>

    </div>

    <!-- Recent updates -->
    <div>
      <p class="text-[10px] font-semibold uppercase tracking-[0.2em] mb-3" style="color:rgba(255,255,255,0.25);">Recent Updates</p>

      <div v-if="loading" class="space-y-2">
        <div v-for="i in 3" :key="i" class="h-14 rounded-xl animate-pulse" style="background:rgba(255,255,255,0.04);" />
      </div>

      <div v-else-if="!updates.length" class="rounded-xl px-5 py-8 text-center text-[12px]" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);color:rgba(255,255,255,0.25);">
        No updates published yet.
      </div>

      <div v-else class="rounded-xl overflow-hidden" style="border:1px solid rgba(255,255,255,0.07);">
        <div
          v-for="(u, i) in updates"
          :key="u.id"
          class="flex items-start gap-4 px-5 py-4"
          :style="i < updates.length - 1 ? 'border-bottom:1px solid rgba(255,255,255,0.05);' : ''"
        >
          <div class="shrink-0 mt-0.5 h-1.5 w-1.5 rounded-full" style="background:rgba(79,70,229,0.70);" />
          <div class="flex-1 min-w-0">
            <p class="text-[13px] font-medium truncate" style="color:rgba(255,255,255,0.75);">{{ u.title }}</p>
            <p v-if="u.summary" class="text-[11px] mt-0.5 truncate" style="color:rgba(255,255,255,0.35);">{{ u.summary }}</p>
          </div>
          <p class="shrink-0 text-[11px]" style="color:rgba(255,255,255,0.25);">{{ fmt(u.published_at) }}</p>
        </div>
      </div>

      <NuxtLink
        v-if="updates.length"
        to="/dashboard/updates"
        class="mt-3 flex items-center gap-1 text-[11px] transition-colors"
        style="color:rgba(255,255,255,0.25);"
      >
        View all updates →
      </NuxtLink>
    </div>

    <!-- Administrator section (admin only) -->
    <div v-if="isAdmin" class="mt-10">
      <div class="flex items-center gap-2 mb-1">
        <ShieldAlert class="h-3.5 w-3.5" style="color:rgba(248,113,113,0.55);" />
        <p class="text-[10px] font-semibold uppercase tracking-[0.22em]" style="color:rgba(255,255,255,0.25);">Administrator</p>
      </div>
      <p class="text-[11px] mb-4" style="color:rgba(255,255,255,0.20);">Restricted to admin accounts only.</p>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">

        <!-- User Management -->
        <div class="rounded-xl p-4 transition-colors hover:bg-white/[0.02]" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);">
          <div class="flex items-center gap-2.5 mb-3">
            <div class="h-7 w-7 rounded-lg flex items-center justify-center shrink-0" style="background:rgba(248,113,113,0.10);border:1px solid rgba(248,113,113,0.18);">
              <Users class="h-3.5 w-3.5" style="color:rgba(248,113,113,0.70);" />
            </div>
            <p class="text-[12px] font-semibold" style="color:rgba(255,255,255,0.75);">User Management</p>
          </div>
          <p class="text-[11px] mb-3 leading-relaxed" style="color:rgba(255,255,255,0.28);">Manage registered accounts and assign roles.</p>
          <span class="inline-flex items-center gap-1 text-[10px] rounded-md px-2 py-1" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);color:rgba(255,255,255,0.25);">
            Coming soon
          </span>
        </div>

        <!-- Support Tickets -->
        <div class="rounded-xl p-4 transition-colors hover:bg-white/[0.02]" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);">
          <div class="flex items-center gap-2.5 mb-3">
            <div class="h-7 w-7 rounded-lg flex items-center justify-center shrink-0" style="background:rgba(251,191,36,0.10);border:1px solid rgba(251,191,36,0.18);">
              <MessageCircle class="h-3.5 w-3.5" style="color:rgba(251,191,36,0.70);" />
            </div>
            <p class="text-[12px] font-semibold" style="color:rgba(255,255,255,0.75);">Support Tickets</p>
          </div>
          <p class="text-[11px] mb-3 leading-relaxed" style="color:rgba(255,255,255,0.28);">Review and respond to user support requests.</p>
          <span class="inline-flex items-center gap-1 text-[10px] rounded-md px-2 py-1" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);color:rgba(255,255,255,0.25);">
            Coming soon
          </span>
        </div>

        <!-- Special Beta Requests -->
        <div class="rounded-xl p-4 transition-colors hover:bg-white/[0.02]" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);">
          <div class="flex items-center gap-2.5 mb-3">
            <div class="h-7 w-7 rounded-lg flex items-center justify-center shrink-0" style="background:rgba(139,92,246,0.12);border:1px solid rgba(139,92,246,0.22);">
              <Star class="h-3.5 w-3.5" style="color:rgba(167,139,250,0.75);" />
            </div>
            <p class="text-[12px] font-semibold" style="color:rgba(255,255,255,0.75);">Special Beta Requests</p>
          </div>
          <p class="text-[11px] mb-3 leading-relaxed" style="color:rgba(255,255,255,0.28);">Review early access applications from users.</p>
          <span class="inline-flex items-center gap-1 text-[10px] rounded-md px-2 py-1" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);color:rgba(255,255,255,0.25);">
            Coming soon
          </span>
        </div>

      </div>
    </div>

  </div>
</template>
