<script setup lang="ts">
import { Bell } from 'lucide-vue-next'

const { forceClose, hideWindow, minimize, toggleMaximize } = useTauriWindow()
const aiActivity = useAIActivityStore()
const app = useAppStore()
const feed = useNotificationFeedStore()

const showCloseModal = ref(false)
const version = ref('')

onMounted(async () => {
  try {
    const { getVersion } = await import('@tauri-apps/api/app')
    version.value = await getVersion()
  }
  catch { /* browser dev mode */ }
})

function openCloseModal() {
  showCloseModal.value = true
}

async function confirmClose() {
  showCloseModal.value = false
  await forceClose()
}

async function sendToTray() {
  showCloseModal.value = false
  await hideWindow()
}
</script>

<template>
  <div
    data-tauri-drag-region
    class="titlebar relative z-50 flex h-8 shrink-0 select-none items-center overflow-hidden border-b border-[var(--border)] px-3"
    :class="[
      aiActivity.hasActiveHandover ? 'titlebar--ai-active' : '',
      !aiActivity.hasActiveHandover && app.vigilanteEnabled ? 'titlebar--vigilante' : '',
    ]"
  >
    <!-- AI active dither -->
    <Dither
      v-if="aiActivity.hasActiveHandover"
      class="pointer-events-none z-0 opacity-70"
      :wave-speed="0.035"
      :wave-frequency="3.5"
      :wave-amplitude="0.26"
      :wave-color="[0.24, 0.48, 0.86]"
      :color-num="4"
      :pixel-size="2"
      :disable-animation="false"
      :enable-mouse-interaction="false"
      :mouse-radius="0.75"
    />
    <div
      v-if="aiActivity.hasActiveHandover"
      class="pointer-events-none absolute inset-0 z-[1] bg-black/45"
    />
    <!-- Vigilante mode dither (orange/amber) -->
    <Dither
      v-if="!aiActivity.hasActiveHandover && app.vigilanteEnabled"
      class="pointer-events-none z-0 opacity-35"
      :wave-speed="0.012"
      :wave-frequency="2.2"
      :wave-amplitude="0.14"
      :wave-color="[0.9, 0.42, 0.07]"
      :color-num="3"
      :pixel-size="2"
      :disable-animation="false"
      :enable-mouse-interaction="false"
      :mouse-radius="0.75"
    />
    <div
      v-if="!aiActivity.hasActiveHandover && app.vigilanteEnabled"
      class="pointer-events-none absolute inset-0 z-[1] bg-black/30"
    />

    <span v-if="version" class="pointer-events-none relative z-10 font-mono text-[10px] text-[var(--text-muted)] opacity-50">
      v{{ version }}
    </span>

    <div class="controls relative z-10 ml-auto flex items-center gap-2">
      <!-- Notification bell -->
      <button
        class="relative flex size-5 items-center justify-center rounded-full text-[var(--text-faint)] transition-colors hover:text-[var(--text-muted)]"
        title="Notifications"
        @click.stop="feed.openDrawer()"
      >
        <Bell class="size-3.5" />
        <span
          v-if="feed.unreadCount > 0"
          class="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-500 px-0.5 font-mono text-[8px] font-bold leading-none text-white"
        >{{ feed.unreadCount > 99 ? '99+' : feed.unreadCount }}</span>
      </button>

      <div class="flex items-center gap-1.5">
        <button
          class="group flex size-3.5 items-center justify-center rounded-full border border-amber-300/30 bg-amber-400/75 transition-[filter] hover:brightness-125"
          title="Minimize"
          @click.stop="minimize()"
        >
          <span class="text-[8px] font-black leading-none text-amber-950 opacity-0 group-hover:opacity-100">-</span>
        </button>
        <button
          class="group flex size-3.5 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-400/70 transition-[filter] hover:brightness-125"
          title="Maximize"
          @click.stop="toggleMaximize()"
        >
          <span class="text-[7px] font-black leading-none text-cyan-950 opacity-0 group-hover:opacity-100">+</span>
        </button>
        <button
          class="group flex size-3.5 items-center justify-center rounded-full border border-red-400/30 bg-red-500/70 transition-[filter] hover:brightness-125"
          title="Close"
          @click.stop="openCloseModal"
        >
          <span class="text-[7px] font-black leading-none text-red-950 opacity-0 group-hover:opacity-100">x</span>
        </button>
      </div>
    </div>

    <span
      data-tauri-drag-region
      class="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]"
    >
      {{ aiActivity.hasActiveHandover ? 'Vindicta - AI Working' : app.vigilanteEnabled ? 'Vindicta — Vigilante' : 'Vindicta' }}
    </span>

  </div>

  <GlassModal v-model="showCloseModal" title="Close Vindicta?" max-width="sm">
    <div class="space-y-4">
      <p class="text-sm text-[var(--text-muted)]">
        Choose how you'd like to close the window. Vindicta can keep running in the background so active scans and AI work can continue.
      </p>
      <div class="flex flex-col gap-2">
        <button
          class="flex w-full items-center gap-3 rounded-xl border border-[var(--border)] bg-black/10 px-4 py-3 text-left transition-colors hover:bg-white/[0.05]"
          @click="sendToTray"
        >
          <div class="grid size-8 shrink-0 place-items-center rounded-lg border border-sky-500/25 bg-sky-500/10 text-sky-300">
            <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-[var(--text)]">Hide to Background</p>
            <p class="mt-0.5 text-xs text-[var(--text-muted)]">Window hides but Vindicta keeps running.</p>
          </div>
        </button>
        <button
          class="flex w-full items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-left transition-colors hover:bg-red-500/10"
          @click="confirmClose"
        >
          <div class="grid size-8 shrink-0 place-items-center rounded-lg border border-red-500/25 bg-red-500/10 text-red-300">
            <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </div>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-red-200">Close and Exit</p>
            <p class="mt-0.5 text-xs text-[var(--text-muted)]">Fully quits Vindicta.</p>
          </div>
        </button>
      </div>
      <div class="flex justify-end border-t border-[var(--border)] pt-3">
        <button
          class="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)]"
          @click="showCloseModal = false"
        >
          Cancel
        </button>
      </div>
    </div>
  </GlassModal>
</template>

<style scoped>
.titlebar {
  -webkit-app-region: drag;
  app-region: drag;
}

.titlebar--ai-active {
  border-color: rgba(99, 102, 241, 0.3);
}

.titlebar--vigilante {
  border-color: rgba(234, 88, 12, 0.35);
}

.controls,
.controls button {
  -webkit-app-region: no-drag;
  app-region: no-drag;
}
</style>
