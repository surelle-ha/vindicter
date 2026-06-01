<script setup lang="ts">
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  Clock,
  Info,
  Rss,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-vue-next'
import type { FeedCategory, FeedItem } from '~/stores/notificationFeed'

definePageMeta({ layout: 'default' })

const feed = useNotificationFeedStore()
const security = useSecurityStore()
const router = useRouter()

const activeFilter = ref<FeedCategory | 'all'>('all')

const filters: { value: FeedCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'scan_complete', label: 'Scans' },
  { value: 'scan_error', label: 'Scan Errors' },
  { value: 'finding_new', label: 'Findings' },
  { value: 'finding_stale', label: 'Stale' },
  { value: 'rss_article', label: 'News' },
  { value: 'info', label: 'Info' },
]

const categoryMeta: Record<FeedCategory, { icon: any; color: string; bg: string; label: string }> = {
  scan_complete: { icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Scan Complete' },
  scan_error:    { icon: ShieldAlert, color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20',         label: 'Scan Error' },
  rss_article:   { icon: Rss,         color: 'text-sky-400',     bg: 'bg-sky-500/10 border-sky-500/20',         label: 'Security News' },
  finding_new:   { icon: AlertTriangle,color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20',     label: 'New Finding' },
  finding_stale: { icon: Clock,        color: 'text-amber-500',  bg: 'bg-amber-500/10 border-amber-500/20',     label: 'Stale Finding' },
  info:          { icon: Info,         color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20',   label: 'Info' },
}

const filtered = computed(() => {
  if (activeFilter.value === 'all') return feed.items
  return feed.items.filter(i => i.category === activeFilter.value)
})

const staleFindings = computed(() => {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
  return security.findings.filter(f =>
    (f.status === 'open' || f.status === 'in_progress' || f.status === 'triaged')
    && new Date(f.updatedAt).getTime() < cutoff,
  )
})

function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function handleItemClick(item: FeedItem) {
  feed.markRead(item.id)
  if (item.link) void router.push(item.link)
}

const filterCount = computed(() => (cat: FeedCategory | 'all') => {
  if (cat === 'all') return feed.items.length
  return feed.items.filter(i => i.category === cat).length
})
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-5">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="flex size-9 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10">
          <Bell class="size-4 text-indigo-400" />
        </div>
        <div>
          <h1 class="text-sm font-semibold text-[var(--text)]">Notifications</h1>
          <p class="text-xs text-[var(--text-muted)]">
            {{ feed.unreadCount > 0 ? `${feed.unreadCount} unread` : 'All caught up' }}
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-if="feed.unreadCount > 0"
          class="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-muted)] transition-colors hover:bg-white/[0.04] hover:text-[var(--text)]"
          @click="feed.markAllRead()"
        >
          <CheckCheck class="size-3.5" />
          Mark all read
        </button>
        <button
          v-if="feed.items.length > 0"
          class="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/[0.05] px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/10"
          @click="feed.clearAll()"
        >
          <Trash2 class="size-3.5" />
          Clear all
        </button>
      </div>
    </div>

    <!-- Stale findings alert -->
    <div
      v-if="staleFindings.length > 0"
      class="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-4"
    >
      <Clock class="mt-0.5 size-4 shrink-0 text-amber-400" />
      <div class="min-w-0 flex-1">
        <p class="text-xs font-semibold text-amber-300">
          {{ staleFindings.length }} stale finding{{ staleFindings.length === 1 ? '' : 's' }} need attention
        </p>
        <p class="mt-0.5 text-[11px] text-[var(--text-muted)]">
          These findings haven't been updated in over 7 days and are still open.
        </p>
        <div class="mt-2 space-y-1">
          <div
            v-for="f in staleFindings.slice(0, 5)"
            :key="f.id"
            class="flex items-center gap-2"
          >
            <span
              class="rounded-full px-1.5 py-px text-[9px] font-semibold capitalize"
              :class="{
                'bg-red-500/20 text-red-300': f.severity === 'critical' || f.severity === 'high',
                'bg-amber-500/20 text-amber-300': f.severity === 'medium',
                'bg-slate-500/20 text-slate-300': f.severity === 'low',
              }"
            >{{ f.severity }}</span>
            <NuxtLink
              :to="`/findings/${encodeURIComponent(f.id)}`"
              class="truncate text-[11px] text-[var(--text-muted)] hover:text-[var(--text)]"
            >
              {{ f.title }}
            </NuxtLink>
          </div>
          <p v-if="staleFindings.length > 5" class="text-[10px] text-[var(--text-faint)]">
            +{{ staleFindings.length - 5 }} more
          </p>
        </div>
      </div>
      <NuxtLink
        to="/security"
        class="shrink-0 rounded-lg border border-amber-500/20 px-2.5 py-1.5 text-[11px] font-medium text-amber-300 transition-colors hover:bg-amber-500/10"
      >
        Review
      </NuxtLink>
    </div>

    <!-- Filter tabs -->
    <div class="flex flex-wrap gap-1.5">
      <button
        v-for="f in filters"
        :key="f.value"
        class="flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors"
        :class="activeFilter === f.value
          ? 'border-indigo-500/30 bg-indigo-500/15 text-indigo-300'
          : 'border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:border-white/15 hover:text-[var(--text)]'"
        @click="activeFilter = f.value"
      >
        {{ f.label }}
        <span
          v-if="filterCount(f.value) > 0"
          class="rounded-full px-1 text-[9px]"
          :class="activeFilter === f.value ? 'bg-indigo-500/30 text-indigo-200' : 'bg-white/[0.06] text-[var(--text-faint)]'"
        >{{ filterCount(f.value) }}</span>
      </button>
    </div>

    <!-- Notification list -->
    <div class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
      <div v-if="filtered.length === 0" class="flex flex-col items-center gap-3 py-20 text-center">
        <Bell class="size-10 text-[var(--text-faint)] opacity-25" />
        <p class="text-sm text-[var(--text-muted)]">No notifications</p>
        <p class="text-xs text-[var(--text-faint)]">
          {{ activeFilter === 'all' ? 'Notifications about scans, news, and findings will appear here.' : 'No notifications of this type yet.' }}
        </p>
      </div>

      <div v-else class="divide-y divide-[var(--border)]">
        <div
          v-for="item in filtered"
          :key="item.id"
          class="group flex cursor-pointer items-start gap-4 px-5 py-4 transition-colors hover:bg-white/[0.025]"
          :class="!item.read ? 'bg-white/[0.015]' : ''"
          @click="handleItemClick(item)"
        >
          <!-- Icon -->
          <div
            class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border"
            :class="[categoryMeta[item.category].bg, categoryMeta[item.category].color]"
          >
            <component :is="categoryMeta[item.category].icon" class="size-4" />
          </div>

          <!-- Content -->
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <span class="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-px text-[9px] font-medium text-[var(--text-faint)]">
                {{ categoryMeta[item.category].label }}
              </span>
              <span class="text-[10px] text-[var(--text-faint)]">{{ relativeTime(item.createdAt) }}</span>
              <span
                v-if="!item.read"
                class="rounded-full bg-indigo-500/25 px-1.5 py-px text-[9px] font-semibold text-indigo-300"
              >New</span>
            </div>
            <p
              class="mt-1 text-xs font-semibold leading-snug"
              :class="!item.read ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'"
            >
              {{ item.title }}
            </p>
            <p v-if="item.body" class="mt-1 line-clamp-3 text-[11px] leading-relaxed text-[var(--text-faint)]">
              {{ item.body }}
            </p>
          </div>

          <!-- Actions -->
          <div class="flex shrink-0 items-start gap-2 pt-0.5">
            <div v-if="!item.read" class="mt-1.5 size-2 rounded-full bg-indigo-400" />
            <button
              class="flex size-6 items-center justify-center rounded-md text-[var(--text-faint)] opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
              title="Dismiss"
              @click.stop="feed.dismiss(item.id)"
            >
              <X class="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
