<script setup lang="ts">
import { Newspaper } from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'News — Vindicter' })

const supabase = useSupabase()

interface Update { id: string; title: string; summary: string | null; published_at: string }
const updates = ref<Update[]>([])
const loading = ref(true)

onMounted(async () => {
  const { data } = await supabase
    .from('newsletter_updates')
    .select('id, title, summary, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(20)
  updates.value = (data ?? []) as Update[]
  loading.value = false
})

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<template>
  <div class="max-w-3xl mx-auto">

    <!-- Header -->
    <div class="mb-8 flex items-center gap-3">
      <div class="h-9 w-9 flex items-center justify-center rounded-xl shrink-0" style="background:rgba(139,92,246,0.10);border:1px solid rgba(139,92,246,0.20);">
        <Newspaper class="h-4 w-4" style="color:rgba(139,92,246,0.80);" />
      </div>
      <div>
        <h1 class="text-[22px] font-display font-black uppercase tracking-wide" style="color:rgba(255,255,255,0.90);">News &amp; Updates</h1>
        <p class="text-[12px] mt-0.5" style="color:rgba(255,255,255,0.35);">Release notes and announcements from the Vindicter team.</p>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 5" :key="i" class="h-16 rounded-xl animate-pulse" style="background:rgba(255,255,255,0.04);" />
    </div>

    <!-- Empty state -->
    <div
      v-else-if="!updates.length"
      class="rounded-xl px-5 py-14 text-center"
      style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);"
    >
      <Newspaper class="h-8 w-8 mx-auto mb-3" style="color:rgba(255,255,255,0.12);" />
      <p class="text-[12px]" style="color:rgba(255,255,255,0.25);">No updates published yet. Check back soon.</p>
    </div>

    <!-- Updates list -->
    <div v-else class="rounded-xl overflow-hidden" style="border:1px solid rgba(255,255,255,0.07);">
      <div
        v-for="(u, i) in updates"
        :key="u.id"
        class="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-white/[0.02]"
        :style="i < updates.length - 1 ? 'border-bottom:1px solid rgba(255,255,255,0.05);' : ''"
      >
        <div class="shrink-0 mt-1.5 h-1.5 w-1.5 rounded-full" style="background:rgba(139,92,246,0.70);" />
        <div class="flex-1 min-w-0">
          <p class="text-[13px] font-semibold" style="color:rgba(255,255,255,0.80);">{{ u.title }}</p>
          <p v-if="u.summary" class="text-[11px] mt-1 leading-relaxed" style="color:rgba(255,255,255,0.38);">{{ u.summary }}</p>
        </div>
        <p class="shrink-0 text-[11px] mt-0.5" style="color:rgba(255,255,255,0.25);">{{ fmt(u.published_at) }}</p>
      </div>
    </div>

  </div>
</template>
