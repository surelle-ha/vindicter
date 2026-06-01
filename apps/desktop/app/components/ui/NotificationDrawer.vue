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

const feed = useNotificationFeedStore()
const router = useRouter()

const categoryMeta: Record<FeedCategory, { icon: any; color: string; label: string }> = {
  scan_complete: { icon: ShieldCheck, color: 'text-emerald-400', label: 'Scan' },
  scan_error: { icon: ShieldAlert, color: 'text-red-400', label: 'Scan Error' },
  rss_article: { icon: Rss, color: 'text-sky-400', label: 'News' },
  finding_new: { icon: AlertTriangle, color: 'text-amber-400', label: 'Finding' },
  finding_stale: { icon: Clock, color: 'text-amber-500', label: 'Stale' },
  info: { icon: Info, color: 'text-indigo-400', label: 'Info' },
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

function handleItemClick(item: FeedItem) {
  feed.markRead(item.id)
  if (item.link) {
    feed.closeDrawer()
    void router.push(item.link)
  }
}
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="feed.drawerOpen"
        class="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
        @click="feed.closeDrawer()"
      />
    </Transition>

    <!-- Drawer -->
    <Transition
      enter-active-class="transition duration-250 ease-out"
      enter-from-class="translate-x-full opacity-0"
      enter-to-class="translate-x-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-x-0 opacity-100"
      leave-to-class="translate-x-full opacity-0"
    >
      <aside
        v-if="feed.drawerOpen"
        class="fixed right-0 top-8 z-50 flex h-[calc(100vh-2rem)] w-80 flex-col border-l border-[var(--border)] bg-[var(--bg-surface)] shadow-2xl"
      >
        <!-- Header -->
        <div class="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <div class="flex items-center gap-2">
            <Bell class="size-4 text-[var(--text-muted)]" />
            <h2 class="text-sm font-semibold text-[var(--text)]">Notifications</h2>
            <span v-if="feed.unreadCount > 0" class="rounded-full bg-red-500/20 px-1.5 py-px text-[10px] font-semibold text-red-400">
              {{ feed.unreadCount }}
            </span>
          </div>
          <div class="flex items-center gap-1">
            <button
              v-if="feed.unreadCount > 0"
              class="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-[var(--text-faint)] transition-colors hover:bg-white/[0.05] hover:text-[var(--text-muted)]"
              title="Mark all read"
              @click="feed.markAllRead()"
            >
              <CheckCheck class="size-3" />
              All read
            </button>
            <button
              v-if="feed.items.length > 0"
              class="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-[var(--text-faint)] transition-colors hover:bg-white/[0.05] hover:text-[var(--text-muted)]"
              title="Clear all"
              @click="feed.clearAll()"
            >
              <Trash2 class="size-3" />
            </button>
            <button
              class="flex size-6 items-center justify-center rounded-md text-[var(--text-faint)] transition-colors hover:bg-white/[0.05] hover:text-[var(--text-muted)]"
              @click="feed.closeDrawer()"
            >
              <X class="size-3.5" />
            </button>
          </div>
        </div>

        <!-- Items -->
        <div class="flex-1 overflow-y-auto custom-scroll">
          <div v-if="feed.items.length === 0" class="flex flex-col items-center gap-3 px-4 py-16 text-center">
            <Bell class="size-8 text-[var(--text-faint)] opacity-30" />
            <p class="text-xs text-[var(--text-faint)]">No notifications yet</p>
          </div>

          <div v-else class="divide-y divide-[var(--border)]">
            <button
              v-for="item in feed.recent"
              :key="item.id"
              class="group relative w-full px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
              :class="!item.read ? 'bg-white/[0.02]' : ''"
              @click="handleItemClick(item)"
            >
              <div class="flex items-start gap-3">
                <div
                  class="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.04]"
                  :class="categoryMeta[item.category].color"
                >
                  <component :is="categoryMeta[item.category].icon" class="size-3.5" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-1.5">
                    <span class="rounded-full border border-white/[0.06] bg-white/[0.04] px-1.5 py-px text-[9px] font-medium text-[var(--text-faint)]">
                      {{ categoryMeta[item.category].label }}
                    </span>
                    <span class="text-[9px] text-[var(--text-faint)]">{{ relativeTime(item.createdAt) }}</span>
                  </div>
                  <p class="mt-1 text-[11px] font-medium leading-snug text-[var(--text)]" :class="!item.read ? '' : 'opacity-75'">
                    {{ item.title }}
                  </p>
                  <p v-if="item.body" class="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-[var(--text-faint)]">
                    {{ item.body }}
                  </p>
                </div>
                <div class="flex shrink-0 flex-col items-end gap-1.5">
                  <div v-if="!item.read" class="size-1.5 rounded-full bg-indigo-400" />
                  <button
                    class="hidden size-5 items-center justify-center rounded text-[var(--text-faint)] opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100 group-hover:flex"
                    title="Dismiss"
                    @click.stop="feed.dismiss(item.id)"
                  >
                    <X class="size-3" />
                  </button>
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="shrink-0 border-t border-[var(--border)] p-3">
          <NuxtLink
            to="/notifications"
            class="flex w-full items-center justify-center rounded-lg border border-[var(--border)] py-2 text-xs text-[var(--text-muted)] transition-colors hover:bg-white/[0.04] hover:text-[var(--text)]"
            @click="feed.closeDrawer()"
          >
            View all notifications
          </NuxtLink>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>
