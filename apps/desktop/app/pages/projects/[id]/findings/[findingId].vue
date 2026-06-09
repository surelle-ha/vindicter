<script setup lang="ts">
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Terminal } from 'lucide-vue-next'
import type { SecurityFindingStatus } from '~/types/vindicta'

const route = useRoute()
const router = useRouter()
const projects = useProjectsStore()
const security = useSecurityStore()

const projectId = computed(() => route.params.id as string)
const findingId = computed(() => decodeURIComponent(route.params.findingId as string))
const scanId = computed(() => route.query.scan ? String(route.query.scan) : null)
const project = computed(() => projects.projects.find(item => item.id === projectId.value) ?? null)
const scan = computed(() => scanId.value ? security.scans.find(item => item.id === scanId.value) ?? null : null)
const scanFinding = computed(() => {
  if (!scan.value) return null
  return scan.value.findings.find(item => item.id === findingId.value) ?? null
})
const remediationFinding = computed(() => security.findings.find(item => item.id === findingId.value) ?? null)
const finding = computed(() => remediationFinding.value ?? scanFinding.value)
const statusOptions: SecurityFindingStatus[] = ['open', 'triaged', 'in_progress', 'resolved', 'ignored']

// Navigation: prev/next in the active findings list
const allFindings = computed(() =>
  remediationFinding.value ? security.findings : (scan.value?.findings ?? []),
)
const currentIndex = computed(() =>
  allFindings.value.findIndex(f => f.id === findingId.value),
)
const prevFinding = computed(() => currentIndex.value > 0 ? allFindings.value[currentIndex.value - 1] : null)
const nextFinding = computed(() => currentIndex.value < allFindings.value.length - 1 ? allFindings.value[currentIndex.value + 1] : null)

function navigateTo(id: string) {
  const query = { ...route.query, scan: route.query.scan }
  void router.replace({ params: { id: projectId.value, findingId: encodeURIComponent(id) }, query })
}

onMounted(async () => {
  if (!projects.projects.length) await projects.loadProjects()
  if (project.value?.absolutePath) await security.load(project.value.absolutePath, project.value.id)
})

async function updateStatus(value: SecurityFindingStatus) {
  if (!remediationFinding.value) return
  await security.updateFindingStatus(remediationFinding.value.id, value)
}
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-5">
    <div class="flex items-center justify-between gap-3">
      <NuxtLink
        :to="project ? `/projects/${project.id}?tab=${remediationFinding ? 'findings' : 'scanner'}` : '/'"
        class="inline-flex items-center gap-2 text-xs font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
      >
        <ArrowLeft class="size-3.5" />
        Back to {{ remediationFinding ? 'findings' : 'scanner' }}
      </NuxtLink>
      <div class="flex items-center gap-1">
        <button
          class="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-black/10 px-2.5 py-1.5 text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          :disabled="!prevFinding"
          :title="prevFinding ? `Previous: ${prevFinding.title}` : 'No previous finding'"
          @click="prevFinding && navigateTo(prevFinding.id)"
        >
          <ChevronLeft class="size-3.5" /> Prev
        </button>
        <span class="text-[10px] text-[var(--text-faint)] px-1">
          {{ currentIndex + 1 }} / {{ allFindings.length }}
        </span>
        <button
          class="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-black/10 px-2.5 py-1.5 text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          :disabled="!nextFinding"
          :title="nextFinding ? `Next: ${nextFinding.title}` : 'No next finding'"
          @click="nextFinding && navigateTo(nextFinding.id)"
        >
          Next <ChevronRight class="size-3.5" />
        </button>
      </div>
    </div>

    <section v-if="finding" class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
      <div class="border-b border-[var(--border)] p-5">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-mono text-[10px] text-[var(--text-faint)]">
                {{ remediationFinding ? `SEC-${remediationFinding.number}` : finding.id }}
              </span>
              <span class="rounded-full border border-red-500/25 bg-red-500/10 px-2 py-0.5 text-[10px] font-medium capitalize text-red-300">
                {{ finding.severity }}
              </span>
              <span class="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
                {{ finding.category }}
              </span>
              <span class="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
                {{ finding.source.replace('_', ' ') }}
              </span>
            </div>
            <h1 class="mt-3 text-2xl font-bold tracking-tight text-[var(--text)]">{{ finding.title }}</h1>
            <p class="mt-2 break-words text-sm leading-relaxed text-[var(--text-muted)]">{{ finding.detail }}</p>
          </div>

          <GlassSelect
            v-if="remediationFinding"
            class="w-36"
            :value="remediationFinding.status"
            @change="updateStatus(($event.target as HTMLSelectElement).value as SecurityFindingStatus)"
          >
            <option v-for="status in statusOptions" :key="status" :value="status">{{ status.replace('_', ' ') }}</option>
          </GlassSelect>
        </div>
      </div>

      <div class="grid gap-5 p-5 lg:grid-cols-[1fr_18rem]">
        <main class="space-y-5">
          <section class="rounded-lg border border-[var(--border)] bg-black/10 p-4">
            <div class="flex items-center gap-2">
              <Terminal class="size-3.5 text-indigo-300" />
              <h2 class="text-sm font-semibold text-[var(--text)]">Evidence</h2>
            </div>
            <pre class="mt-3 max-h-[32rem] overflow-auto whitespace-pre-wrap break-words rounded-lg border border-[var(--border)] bg-black/20 p-3 text-xs leading-relaxed text-[var(--text-muted)] custom-scroll">{{ finding.evidence || 'No evidence was captured for this finding.' }}</pre>
          </section>

          <section class="rounded-lg border border-indigo-500/15 bg-indigo-500/[0.06] p-4">
            <div class="flex items-center gap-2">
              <CheckCircle2 class="size-3.5 text-indigo-300" />
              <h2 class="text-sm font-semibold text-[var(--text)]">Recommended Remediation</h2>
            </div>
            <p class="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--text-muted)]">{{ finding.recommendation || 'No recommendation was captured for this finding.' }}</p>
          </section>
        </main>

        <aside class="space-y-3">
          <div class="rounded-lg border border-[var(--border)] bg-black/10 p-3">
            <p class="text-[10px] uppercase tracking-wider text-[var(--text-faint)]">Area</p>
            <p class="mt-1 break-words text-xs text-[var(--text-muted)]">{{ finding.area }}</p>
          </div>
          <div class="rounded-lg border border-[var(--border)] bg-black/10 p-3">
            <p class="text-[10px] uppercase tracking-wider text-[var(--text-faint)]">Project</p>
            <p class="mt-1 break-words text-xs text-[var(--text-muted)]">{{ project?.name ?? 'Unknown project' }}</p>
          </div>
          <div v-if="scan" class="rounded-lg border border-[var(--border)] bg-black/10 p-3">
            <p class="text-[10px] uppercase tracking-wider text-[var(--text-faint)]">Scan</p>
            <p class="mt-1 text-xs text-[var(--text-muted)]">{{ new Date(scan.scannedAt).toLocaleString() }}</p>
          </div>
        </aside>
      </div>
    </section>

    <section v-else class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-5 py-14 text-center">
      <p class="text-sm text-[var(--text-muted)]">Finding not found.</p>
    </section>
  </div>
</template>
