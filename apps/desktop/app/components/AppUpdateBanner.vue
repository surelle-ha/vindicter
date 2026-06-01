<script setup lang="ts">
import { ArrowUpCircle, Download, Loader2, X } from 'lucide-vue-next'

const updater = useAppUpdater()

const show = computed(() =>
  (updater.updateReady.value || updater.downloading.value) && !updater.dismissed.value,
)
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 translate-y-4"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-4"
  >
    <div
      v-if="show"
      class="fixed bottom-4 right-4 z-[9999] w-72 rounded-2xl border border-indigo-500/25 bg-[#0d0d14]/95 shadow-2xl shadow-black/50 backdrop-blur-md overflow-hidden"
    >
      <!-- Subtle top accent line -->
      <div class="h-[2px] bg-gradient-to-r from-indigo-500/60 via-violet-500/60 to-teal-500/40" />

      <div class="p-3.5">
        <!-- Downloading state -->
        <template v-if="updater.downloading.value">
          <div class="flex items-center gap-2.5 mb-2">
            <div class="size-7 rounded-lg border border-indigo-500/20 bg-indigo-500/10 grid place-items-center shrink-0">
              <Loader2 class="size-3.5 text-indigo-400 animate-spin" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-[11px] font-semibold text-[var(--text)]">Downloading update</p>
              <p class="text-[10px] text-[var(--text-faint)]">v{{ updater.updateVersion.value }} · {{ updater.progress.value }}%</p>
            </div>
          </div>
          <div class="h-1 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              class="h-1 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
              :style="{ width: updater.progress.value + '%' }"
            />
          </div>
        </template>

        <!-- Ready to install -->
        <template v-else-if="updater.updateReady.value">
          <div class="flex items-start gap-2.5">
            <div class="size-7 rounded-lg border border-teal-500/20 bg-teal-500/10 grid place-items-center shrink-0 mt-0.5">
              <ArrowUpCircle class="size-3.5 text-teal-400" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-[11px] font-semibold text-[var(--text)]">Update ready — v{{ updater.updateVersion.value }}</p>
              <p class="text-[10px] text-[var(--text-faint)] mt-0.5 leading-relaxed">
                Restart to apply the latest version.
              </p>
            </div>
            <button
              class="size-5 shrink-0 grid place-items-center rounded text-[var(--text-faint)] hover:text-[var(--text)] hover:bg-white/[0.06] transition-colors mt-0.5"
              title="Dismiss"
              @click="updater.dismiss()"
            >
              <X class="size-3" />
            </button>
          </div>

          <div class="flex gap-2 mt-3">
            <button
              class="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-teal-500/30 bg-teal-500/10 py-1.5 text-[11px] font-medium text-teal-300 hover:bg-teal-500/20 transition-colors"
              @click="updater.install()"
            >
              <Download class="size-3.5" /> Restart &amp; Install
            </button>
            <button
              class="px-3 rounded-lg border border-[var(--border)] py-1.5 text-[11px] text-[var(--text-faint)] hover:text-[var(--text)] hover:bg-white/[0.04] transition-colors"
              @click="updater.dismiss()"
            >
              Later
            </button>
          </div>
        </template>
      </div>
    </div>
  </Transition>
</template>
