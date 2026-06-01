<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Updates — Vindicta' })

const supabase = useSupabase()

interface Update { id: string; title: string; summary: string | null; body: string; published_at: string }
const updates  = ref<Update[]>([])
const loading  = ref(true)
const expanded = ref<string | null>(null)

onMounted(async () => {
  const { data } = await supabase
    .from('newsletter_updates')
    .select('id, title, summary, body, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
  updates.value = (data ?? []) as Update[]
  loading.value = false
})

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}
function toggle(id: string) {
  expanded.value = expanded.value === id ? null : id
}
</script>

<template>
  <div class="max-w-3xl mx-auto">

    <div class="mb-8">
      <p class="text-[11px] font-semibold uppercase tracking-[0.25em] mb-1" style="color:rgba(139,92,246,0.70);">Changelog</p>
      <h1 class="text-[26px] font-display font-black uppercase tracking-wide" style="color:rgba(255,255,255,0.90);">Vindicta Updates</h1>
      <p class="mt-1 text-[13px]" style="color:rgba(255,255,255,0.40);">Release notes, feature announcements, and security notices.</p>
    </div>

    <!-- Skeleton -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 4" :key="i" class="h-16 rounded-xl animate-pulse" style="background:rgba(255,255,255,0.04);" />
    </div>

    <!-- Empty -->
    <div
      v-else-if="!updates.length"
      class="rounded-xl px-5 py-16 text-center"
      style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);"
    >
      <svg class="h-8 w-8 mx-auto mb-3" style="color:rgba(255,255,255,0.15);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
      </svg>
      <p class="text-[12px]" style="color:rgba(255,255,255,0.25);">No updates published yet. Check back soon.</p>
    </div>

    <!-- Updates list -->
    <div v-else class="space-y-3">
      <div
        v-for="u in updates"
        :key="u.id"
        class="rounded-xl overflow-hidden transition-all"
        style="border:1px solid rgba(255,255,255,0.08);"
      >
        <!-- Header row -->
        <button
          @click="toggle(u.id)"
          class="w-full flex items-start gap-4 px-5 py-4 text-left transition-colors"
          :style="expanded === u.id
            ? 'background:rgba(79,70,229,0.07);'
            : 'background:rgba(255,255,255,0.03);'"
        >
          <div class="shrink-0 mt-1 h-2 w-2 rounded-full" style="background:rgba(79,70,229,0.70);" />
          <div class="flex-1 min-w-0">
            <p class="text-[13px] font-semibold" style="color:rgba(255,255,255,0.85);">{{ u.title }}</p>
            <p v-if="u.summary && expanded !== u.id" class="mt-0.5 text-[11px] truncate" style="color:rgba(255,255,255,0.40);">{{ u.summary }}</p>
          </div>
          <div class="shrink-0 flex items-center gap-3">
            <span class="text-[11px]" style="color:rgba(255,255,255,0.25);">{{ fmt(u.published_at) }}</span>
            <svg
              class="h-3.5 w-3.5 transition-transform shrink-0"
              :style="expanded === u.id ? 'color:rgba(129,140,248,0.70);transform:rotate(180deg)' : 'color:rgba(255,255,255,0.25);'"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        <!-- Expanded body -->
        <div
          v-if="expanded === u.id"
          class="px-5 pb-5 pt-2"
          style="background:rgba(79,70,229,0.04);border-top:1px solid rgba(79,70,229,0.12);"
        >
          <p class="text-[13px] leading-relaxed whitespace-pre-wrap" style="color:rgba(255,255,255,0.60);">{{ u.body }}</p>
        </div>
      </div>
    </div>

  </div>
</template>
