<script setup lang="ts">
import { Bot, ShieldCheck, X } from 'lucide-vue-next'
import { useScanProgress } from '~/composables/useScanProgress'
import type { AIActivityJob } from '~/stores/aiActivity'

const aiActivity = useAIActivityStore()
const router = useRouter()
const scanProgress = useScanProgress()
const sidebarCollapsed = useState('sidebar-collapsed', () => false)
const ticker = ref(Date.now())
const showResultModal = ref(false)
const completedJob = ref<AIActivityJob | null>(null)

let timer: ReturnType<typeof setInterval> | null = null
onMounted(() => { timer = setInterval(() => { ticker.value = Date.now() }, 1000) })
onUnmounted(() => { if (timer) clearInterval(timer) })

const activeScanJob = computed(() =>
  aiActivity.visibleJobs.find(j => j.kind === 'security-scan' && (j.status === 'running' || j.status === 'pending'))
)

// Whether the footer should be visible
const isVisible = computed(() =>
  (activeScanJob.value !== undefined) || scanProgress.value.running
)

const footerLabel = computed(() => {
  if (scanProgress.value.running && scanProgress.value.kind === 'validation') return 'Validating fix'
  return 'AI Scan in progress'
})

const footerDetail = computed(() => {
  if (scanProgress.value.running && scanProgress.value.kind === 'validation') return scanProgress.value.detail
  return activeScanJob.value?.currentStep ?? ''
})

const footerTool = computed(() => {
  if (scanProgress.value.running) return scanProgress.value.tool
  return activeScanJob.value?.tool ?? ''
})

const footerEffort = computed(() => {
  if (scanProgress.value.running && scanProgress.value.kind === 'validation') return ''
  return activeScanJob.value?.effort ?? ''
})

const footerStartedAt = computed(() => {
  if (scanProgress.value.running) return scanProgress.value.startedAt
  return activeScanJob.value?.startedAt ?? null
})

const elapsedTime = computed(() => {
  const t = footerStartedAt.value
  if (!t) return ''
  const total = Math.max(0, Math.floor((ticker.value - new Date(t).getTime()) / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return m ? `${m}m ${String(s).padStart(2, '0')}s` : `${s}s`
})

// Detect scan completion — watch for activeScanJob transitioning from running → done
let lastRunningJobId: string | null = null
watch(activeScanJob, (newJob, oldJob) => {
  if (newJob) {
    lastRunningJobId = newJob.id
  } else if (oldJob && !newJob) {
    const done = aiActivity.visibleJobs.find(j => j.id === (lastRunningJobId ?? oldJob.id) && j.status === 'done')
    if (done) {
      completedJob.value = done
      showResultModal.value = true
    }
    lastRunningJobId = null
  }
})

async function goToScanner() {
  showResultModal.value = false
  const job = completedJob.value
  if (job?.projectId) {
    await router.push({ path: `/projects/${job.projectId}`, query: { tab: 'scanner' } })
  }
}
</script>

<template>
  <!-- Footer bar — always in DOM, shown/hidden via v-show to avoid Dither remounting -->
  <Teleport to="body">
    <div
      v-show="isVisible"
      class="fixed bottom-0 right-0 z-[90] h-10 overflow-hidden transition-[left] duration-200 ease-in-out"
      :class="isVisible ? 'pointer-events-auto' : 'pointer-events-none'"
      :style="{ left: sidebarCollapsed ? '3rem' : '13rem' }"
    >
      <!-- Dither background — mounted once, always present -->
      <Dither
        class="pointer-events-none absolute inset-0 z-0"
        :wave-speed="0.04"
        :wave-frequency="3.5"
        :wave-amplitude="0.15"
        :wave-color="[0.06, 0.38, 0.24]"
        :color-num="4"
        :pixel-size="3"
        :disable-animation="false"
        :enable-mouse-interaction="false"
      />
      <!-- Dark overlay -->
      <div
        class="absolute inset-0 z-[1] pointer-events-none"
        style="background: color-mix(in srgb, var(--bg-base) 78%, transparent);"
      />
      <!-- Border -->
      <div class="absolute inset-x-0 top-0 h-px z-[2] bg-emerald-500/20" />

      <!-- Content -->
      <div class="absolute inset-0 z-[3] flex items-center gap-3 px-5">
        <span class="relative flex size-1.5 shrink-0">
          <span class="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50 animate-ping" style="animation-duration: 2s;" />
          <span class="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
        </span>
        <Bot class="size-3.5 shrink-0 text-emerald-300" />
        <p class="text-xs font-semibold text-emerald-200 shrink-0">{{ footerLabel }}</p>
        <span v-if="footerDetail" class="h-3 w-px bg-white/10 shrink-0" />
        <p v-if="footerDetail" class="flex-1 truncate text-[11px] text-[var(--text-muted)]">{{ footerDetail }}</p>
        <span v-else class="flex-1" />
        <span v-if="footerTool" class="shrink-0 hidden sm:inline rounded-full border border-emerald-500/20 bg-emerald-500/[0.07] px-2 py-0.5 text-[10px] font-medium text-emerald-300/80 capitalize">{{ footerTool }}</span>
        <span v-if="footerEffort" class="shrink-0 hidden sm:inline rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-[var(--text-faint)] capitalize">{{ footerEffort }}</span>
        <span v-if="elapsedTime" class="shrink-0 font-mono text-[10px] text-[var(--text-faint)]">{{ elapsedTime }}</span>
      </div>
    </div>

    <!-- Scan completion modal -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div v-if="showResultModal && completedJob" class="fixed inset-0 z-[95] flex items-center justify-center p-4" style="background: rgba(0,0,0,0.55);">
        <div class="relative w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-2xl">
          <!-- Close -->
          <button
            class="absolute right-3 top-3 grid size-7 place-items-center rounded-lg text-[var(--text-faint)] hover:bg-white/[0.07] hover:text-[var(--text)] transition-colors cursor-pointer"
            @click="showResultModal = false"
          >
            <X class="size-3.5" />
          </button>

          <!-- Icon -->
          <div class="flex justify-center mb-4">
            <div class="grid size-12 place-items-center rounded-xl border border-emerald-500/25 bg-emerald-500/10">
              <ShieldCheck class="size-6 text-emerald-300" />
            </div>
          </div>

          <!-- Heading -->
          <h2 class="text-center text-base font-bold text-[var(--text)]">Scan complete</h2>
          <p class="mt-1 text-center text-xs text-[var(--text-muted)]">{{ completedJob.projectName }}</p>

          <!-- Summary -->
          <div class="mt-4 rounded-xl border border-[var(--border)] bg-black/10 px-4 py-3">
            <p class="text-[11px] leading-relaxed text-[var(--text-muted)] line-clamp-3">{{ completedJob.summary || 'Scan finished successfully.' }}</p>
          </div>

          <!-- Stats row -->
          <div class="mt-3 flex items-center justify-center gap-3">
            <div class="text-center">
              <p class="text-lg font-black text-[var(--text)]">{{ completedJob.events?.length ?? 0 }}</p>
              <p class="text-[10px] text-[var(--text-faint)]">events</p>
            </div>
            <div class="h-6 w-px bg-[var(--border)]" />
            <div class="text-center">
              <p class="text-lg font-black text-emerald-300 capitalize">{{ completedJob.effort }}</p>
              <p class="text-[10px] text-[var(--text-faint)]">effort</p>
            </div>
            <div class="h-6 w-px bg-[var(--border)]" />
            <div class="text-center">
              <p class="text-lg font-black text-[var(--text)] capitalize">{{ completedJob.tool }}</p>
              <p class="text-[10px] text-[var(--text-faint)]">tool</p>
            </div>
          </div>

          <!-- CTA -->
          <button
            class="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-500/25 bg-indigo-500/10 px-4 py-2.5 text-xs font-semibold text-indigo-200 hover:bg-indigo-500/15 transition-colors cursor-pointer"
            @click="goToScanner"
          >
            <Bot class="size-3.5" />
            View in AI Scanner
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
