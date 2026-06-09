<script setup lang="ts">
import { Bot, CheckCircle2, ExternalLink, Loader2, X, AlertTriangle } from 'lucide-vue-next'

const aiActivity = useAIActivityStore()
const router = useRouter()
const ticker = ref(Date.now())

const visibleJobs = computed(() => aiActivity.visibleJobs.filter(j => j.kind !== 'security-scan'))

let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  timer = setInterval(() => {
    ticker.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

function elapsedLabel(startedAt: string, endedAt?: string | null) {
  const end = endedAt ? new Date(endedAt).getTime() : ticker.value
  const total = Math.max(0, Math.floor((end - new Date(startedAt).getTime()) / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return minutes ? `${minutes}m ${String(seconds).padStart(2, '0')}s` : `${seconds}s`
}

function statusIcon(status: string) {
  if (status === 'running' || status === 'pending') return Loader2
  if (status === 'done') return CheckCircle2
  return AlertTriangle
}

function statusClass(status: string) {
  if (status === 'done') return 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200'
  if (status === 'warning' || status === 'interrupted') return 'border-amber-500/25 bg-amber-500/10 text-amber-200'
  if (status === 'error') return 'border-red-500/25 bg-red-500/10 text-red-200'
  return 'border-indigo-500/25 bg-indigo-500/10 text-indigo-200'
}

async function openJob(jobId: string) {
  const job = aiActivity.jobs.find(item => item.id === jobId)
  if (!job) return
  aiActivity.setActive(jobId)
  if (job.kind === 'security-scan') {
    if (job.projectId) await router.push({ path: `/projects/${job.projectId}`, query: { tab: 'scanner' } })
    else await router.push('/security')
    return
  }
  if (job.projectId) {
    await router.push({ path: `/projects/${job.projectId}`, query: { tab: 'ai-workspace' } })
  }
}
</script>

<template>
  <div v-if="visibleJobs.length" class="pointer-events-none fixed bottom-4 right-4 z-[80] w-[min(24rem,calc(100vw-2rem))] space-y-2">
    <article
      v-for="job in visibleJobs"
      :key="job.id"
      class="pointer-events-auto overflow-hidden rounded-xl border bg-[var(--bg-card)] shadow-2xl shadow-black/30 backdrop-blur-xl"
      :class="statusClass(job.status)"
    >
      <div class="flex items-start gap-3 p-3">
        <div class="grid size-9 shrink-0 place-items-center rounded-lg border border-current/20 bg-black/10">
          <component
            :is="statusIcon(job.status)"
            class="size-4"
            :class="job.status === 'running' || job.status === 'pending' ? 'animate-spin' : ''"
          />
        </div>
        <button class="min-w-0 flex-1 text-left" @click="openJob(job.id)">
          <div class="flex items-center gap-2">
            <p class="truncate text-sm font-semibold text-[var(--text)]">{{ job.title }}</p>
            <span class="shrink-0 rounded-full border border-current/20 px-1.5 py-0.5 text-[10px] font-medium capitalize">
              {{ job.effort }}
            </span>
          </div>
          <p class="mt-1 truncate text-xs text-[var(--text-muted)]">{{ job.currentStep }}</p>
          <div class="mt-2 flex items-center gap-2 text-[10px] text-[var(--text-faint)]">
            <Bot class="size-3" />
            <span class="capitalize">{{ job.tool }}</span>
            <span>{{ elapsedLabel(job.startedAt, job.endedAt) }}</span>
            <span v-if="job.ticketCount">{{ job.ticketCount }} tickets</span>
          </div>
        </button>
        <div class="flex shrink-0 items-center gap-1">
          <button
            class="grid size-7 place-items-center rounded-lg border border-current/10 text-current/70 hover:bg-white/10 hover:text-current"
            title="Open activity"
            @click="openJob(job.id)"
          >
            <ExternalLink class="size-3.5" />
          </button>
          <button
            v-if="job.status !== 'running' && job.status !== 'pending'"
            class="grid size-7 place-items-center rounded-lg border border-current/10 text-current/70 hover:bg-white/10 hover:text-current"
            title="Dismiss"
            @click="aiActivity.dismiss(job.id)"
          >
            <X class="size-3.5" />
          </button>
        </div>
      </div>
    </article>
  </div>
</template>
