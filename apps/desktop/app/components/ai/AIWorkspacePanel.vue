<script setup lang="ts">
import { AlertTriangle, Bot, CheckCircle2, ChevronLeft, ChevronRight, Clock3, FileCode, FileDiff, Lightbulb, Loader2, Play, Terminal } from 'lucide-vue-next'
import { friendlyCodexExecError, runCodexExec } from '~/composables/useCodexShell'
import type { Sprint, Ticket, TicketPriority, TicketStatus, TicketType } from '~/types/vindicta'
import { renderMarkdown } from '~/utils/markdown'
import { ticketKey } from '~/utils/ticket'

const props = defineProps<{
  projectId: string
}>()

const aiActivity = useAIActivityStore()
const projects = useProjectsStore()
const sprint = useSprintStore()
const kanban = useKanbanStore()
const { notify } = useNotifications()
const ticker = ref(Date.now())
const resuming = ref(false)
const syncingReport = ref(false)
const workspacePanelTab = ref<'tickets' | 'activity' | 'suggestions' | 'report'>('tickets')
let timer: ReturnType<typeof setInterval> | null = null

const projectJobs = computed(() => aiActivity.projectJobs(props.projectId))
const project = computed(() => projects.projects.find(item => item.id === props.projectId) ?? projects.activeProject)
const jobPageSize = 5
const jobPage = ref(1)
const jobPageCount = computed(() => Math.max(1, Math.ceil(projectJobs.value.length / jobPageSize)))
const pagedProjectJobs = computed(() => {
  const start = (jobPage.value - 1) * jobPageSize
  return projectJobs.value.slice(start, start + jobPageSize)
})
const selectedJobId = computed({
  get: () => aiActivity.activeJobId && projectJobs.value.some(job => job.id === aiActivity.activeJobId)
    ? aiActivity.activeJobId
    : projectJobs.value[0]?.id ?? '',
  set: (id: string) => aiActivity.setActive(id),
})
const selectedJob = computed(() => projectJobs.value.find(job => job.id === selectedJobId.value) ?? projectJobs.value[0] ?? null)
const selectedTicketId = ref('')
const selectedSprintTickets = computed(() => {
  const job = selectedJob.value
  if (!job?.sprintId) return []
  const selectedSprint = sprint.sprints.find(item => item.id === job.sprintId)
  if (!selectedSprint) return []
  return ticketsForSprint(selectedSprint)
})
const selectedTicket = computed(() =>
  selectedSprintTickets.value.find(ticket => ticket.id === selectedTicketId.value) ?? selectedSprintTickets.value[0] ?? null,
)
const selectedTicketUpdate = computed(() =>
  selectedJob.value?.ticketUpdates.find(update => update.ticketId === selectedTicket.value?.id) ?? null,
)
const openFindings = computed(() => selectedJob.value?.findings.filter(finding => finding.status === 'open') ?? [])
const selectedFindings = computed(() => openFindings.value.filter(finding => finding.selected))
const visibleChangedFiles = computed(() =>
  [...new Set(selectedJob.value?.ticketUpdates.flatMap(update => update.changedFiles) ?? [])],
)
const eventPageSize = 6
const eventPage = ref(1)
const activityEvents = computed(() => selectedJob.value?.events.slice().reverse() ?? [])
const eventPageCount = computed(() => Math.max(1, Math.ceil(activityEvents.value.length / eventPageSize)))
const pagedActivityEvents = computed(() => {
  const start = (eventPage.value - 1) * eventPageSize
  return activityEvents.value.slice(start, start + eventPageSize)
})
const selectedJobReason = computed(() => {
  const job = selectedJob.value
  if (!job || (job.status !== 'error' && job.status !== 'interrupted')) return ''
  return job.error
    || job.summary
    || job.events.find(event => event.status === job.status)?.detail
    || 'The AI job stopped before Vindicter received a complete report.'
})
const workspaceTabs = computed(() => [
  { id: 'tickets' as const, label: 'Ticket Steps', icon: Bot, count: selectedSprintTickets.value.length },
  { id: 'activity' as const, label: 'Activity', icon: Loader2, count: activityEvents.value.length },
  { id: 'code' as const, label: 'Code', icon: FileCode, count: visibleChangedFiles.value.length },
  { id: 'suggestions' as const, label: 'Suggestions', icon: Lightbulb, count: selectedJob.value?.findings.length ?? 0 },
  { id: 'report' as const, label: 'Report', icon: FileDiff, count: selectedJob.value?.output ? 1 : 0 },
])
const canResumeSelectedJob = computed(() =>
  Boolean(
    selectedJob.value
    && selectedJob.value.kind === 'sprint-handover'
    && selectedJob.value.sprintId
    && (selectedJob.value.status === 'interrupted' || selectedJob.value.status === 'error'),
  ),
)
const canSyncSelectedJobReport = computed(() =>
  Boolean(
    selectedJob.value?.output
    && selectedJob.value.kind === 'sprint-handover'
    && selectedJob.value.sprintId
    && !selectedJob.value.ticketUpdates.length,
  ),
)

onMounted(() => {
  timer = setInterval(() => {
    ticker.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

watch(projectJobs, () => {
  if (jobPage.value > jobPageCount.value) jobPage.value = jobPageCount.value
})

watch(selectedJobId, () => {
  eventPage.value = 1
  workspacePanelTab.value = 'tickets'
  selectedTicketId.value = selectedSprintTickets.value[0]?.id ?? ''
})

watch(activityEvents, () => {
  if (eventPage.value > eventPageCount.value) eventPage.value = eventPageCount.value
})

watch(selectedSprintTickets, (tickets) => {
  if (!tickets.some(ticket => ticket.id === selectedTicketId.value)) {
    selectedTicketId.value = tickets[0]?.id ?? ''
  }
}, { immediate: true })

function previousJobPage() {
  jobPage.value = Math.max(1, jobPage.value - 1)
}

function nextJobPage() {
  jobPage.value = Math.min(jobPageCount.value, jobPage.value + 1)
}

function previousEventPage() {
  eventPage.value = Math.max(1, eventPage.value - 1)
}

function nextEventPage() {
  eventPage.value = Math.min(eventPageCount.value, eventPage.value + 1)
}

function elapsedLabel(startedAt: string, endedAt?: string | null) {
  const end = endedAt ? new Date(endedAt).getTime() : ticker.value
  const total = Math.max(0, Math.floor((end - new Date(startedAt).getTime()) / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return minutes ? `${minutes}m ${String(seconds).padStart(2, '0')}s` : `${seconds}s`
}

function statusClass(status: string) {
  if (status === 'done') return 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200'
  if (status === 'warning') return 'border-amber-500/25 bg-amber-500/10 text-amber-200'
  if (status === 'interrupted') return 'border-amber-500/25 bg-amber-500/10 text-amber-200'
  if (status === 'error') return 'border-red-500/25 bg-red-500/10 text-red-200'
  return 'border-indigo-500/25 bg-indigo-500/10 text-indigo-200'
}

function ticketStepClass(ticket: Ticket) {
  const update = selectedJob.value?.ticketUpdates.find(item => item.ticketId === ticket.id)
  const status = update?.status || ticket.status
  if (status === 'done') return 'border-emerald-500/35 bg-emerald-500/10 text-emerald-200'
  if (status === 'in_review') return 'border-violet-500/35 bg-violet-500/10 text-violet-200'
  if (status === 'in_progress') return 'border-indigo-500/35 bg-indigo-500/10 text-indigo-200'
  if (status === 'cancelled') return 'border-red-500/35 bg-red-500/10 text-red-200'
  return 'border-[var(--border)] bg-black/10 text-[var(--text-muted)]'
}

function normalizeTicketStatus(value: unknown): TicketStatus {
  const status = String(value ?? '').trim()
  return ['backlog', 'todo', 'in_progress', 'in_review', 'done', 'cancelled'].includes(status)
    ? status as TicketStatus
    : 'in_progress'
}

function normalizeTicketPriority(value: unknown): TicketPriority {
  const priority = String(value ?? '').trim()
  return ['low', 'medium', 'high', 'critical'].includes(priority)
    ? priority as TicketPriority
    : 'medium'
}

function normalizeTicketType(value: unknown): TicketType {
  const type = String(value ?? '').trim()
  return ['feature', 'bug', 'fix', 'chore', 'spike'].includes(type)
    ? type as TicketType
    : 'chore'
}

function ticketsForSprint(s: Sprint): Ticket[] {
  return s.ticketIds
    .map(id => kanban.tickets.find(ticket => ticket.id === id))
    .filter(Boolean) as Ticket[]
}

function effortDetail(effort: string) {
  if (effort === 'low') return 'Review the sprint, make only obvious low-risk progress, and report blockers quickly.'
  if (effort === 'high' || effort === 'xhigh') return 'Make a thorough pass across tickets, code paths, tests, and integration risks.'
  return 'Default handover depth for implementing focused tickets and documenting follow-ups.'
}

function buildSprintHandoverPrompt(s: Sprint, tickets: Ticket[], effort: string) {
  const ticketPayload = tickets.map(ticket => ({
    key: project.value?.code && ticket.number ? ticketKey(project.value.code, ticket.number) : `#${ticket.number}`,
    id: ticket.id,
    title: ticket.title,
    type: ticket.type,
    status: ticket.status,
    priority: ticket.priority,
    labels: ticket.labels,
    description: ticket.description,
  }))

  return `You are Codex working inside Vindicter. The user is resuming an interrupted AI handover for an entire sprint.

Project: ${project.value?.name ?? 'Unknown project'}
Sprint: ${s.name}
Sprint goal: ${s.goal || '(no goal provided)'}
Sprint status: ${s.status}
Sprint window: ${s.startDate} to ${s.endDate}

Effort level: ${effort}
Effort guidance: ${effortDetail(effort)}

Tickets:
${JSON.stringify(ticketPayload, null, 2)}

Instructions:
- Inspect the codebase and current git/worktree state before changing files.
- Continue useful work for the sprint tickets where practical.
- Keep edits focused on the sprint scope and avoid unrelated refactors.
- Do not commit, push, install new dependencies, or run destructive commands.
- If previous partial edits exist, work with them instead of reverting them.
- If a ticket is too large or unclear, make the safest useful progress and document the blocker.
- Run relevant lightweight checks when available.

Return ONLY a JSON object. No markdown fences, no prose.
Schema:
{
  "summary": "Brief handover summary",
  "activity": [{"label":"Observable step","detail":"What happened, commands/checks run, or file area reviewed","files":["relative/path.ts"]}],
  "ticketUpdates": [{"ticketId":"ticket id from input","status":"todo|in_progress|in_review|done|backlog|cancelled","comment":"AI-visible progress summary for the ticket","changedFiles":["relative/path.ts"]}],
  "findings": [{"title":"Out-of-scope issue or suggestion","type":"bug|fix|chore|spike|feature","priority":"low|medium|high|critical","detail":"Why it matters","evidence":"Where you noticed it","recommendation":"Suggested follow-up"}],
  "markdownReport": "Markdown report with Summary, Tickets Worked, Changed Files, Checks Run, Blockers, Follow-ups, and Suggestions"
}

Include every sprint ticket in ticketUpdates. Report observable actions and output only. Do not include private chain-of-thought.`
}

function extractJsonObject(value: string) {
  const text = value
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')

  for (let start = text.indexOf('{'); start >= 0; start = text.indexOf('{', start + 1)) {
    let depth = 0
    let inString = false
    let escaped = false

    for (let index = start; index < text.length; index += 1) {
      const char = text[index]
      if (inString) {
        if (escaped) {
          escaped = false
        }
        else if (char === '\\') {
          escaped = true
        }
        else if (char === '"') {
          inString = false
        }
        continue
      }

      if (char === '"') {
        inString = true
      }
      else if (char === '{') {
        depth += 1
      }
      else if (char === '}') {
        depth -= 1
        if (depth === 0) {
          const candidate = text.slice(start, index + 1)
          try {
            return JSON.parse(candidate)
          }
          catch {
            break
          }
        }
      }
    }
  }

  throw new Error('No valid JSON object found in Codex response.')
}

async function applyHandoverArtifacts(jobId: string, rawText: string, sprintTickets: Ticket[]) {
  let parsed: any
  try {
    parsed = extractJsonObject(rawText)
  }
  catch {
    aiActivity.addEvent(jobId, 'Ticket sync needs review', 'Codex returned output, but it could not be parsed into structured ticket updates.', 'warning')
    return { report: rawText, summary: 'Codex finished handover, but structured updates could not be parsed.' }
  }

  const ticketUpdates = Array.isArray(parsed.ticketUpdates)
    ? parsed.ticketUpdates
        .map((item: any) => ({
          ticketId: String(item?.ticketId ?? ''),
          status: normalizeTicketStatus(item?.status),
          comment: String(item?.comment ?? '').trim(),
          changedFiles: Array.isArray(item?.changedFiles) ? item.changedFiles.map(String).filter(Boolean) : [],
        }))
        .filter((item: any) => sprintTickets.some(ticket => ticket.id === item.ticketId))
    : []

  const findings = Array.isArray(parsed.findings)
    ? parsed.findings
        .map((item: any) => ({
          title: String(item?.title ?? 'Untitled follow-up').trim(),
          type: normalizeTicketType(item?.type),
          priority: normalizeTicketPriority(item?.priority),
          detail: String(item?.detail ?? '').trim(),
          evidence: String(item?.evidence ?? '').trim(),
          recommendation: String(item?.recommendation ?? '').trim(),
        }))
        .filter((item: any) => item.title)
    : []

  const activity = Array.isArray(parsed.activity)
    ? parsed.activity
        .map((item: any) => ({
          label: String(item?.label ?? 'Observed activity').trim(),
          detail: [
            String(item?.detail ?? '').trim(),
            Array.isArray(item?.files) && item.files.length ? `Files: ${item.files.map(String).join(', ')}` : '',
          ].filter(Boolean).join('\n'),
        }))
        .filter((item: any) => item.label)
    : []

  aiActivity.updateJobArtifacts(jobId, { ticketUpdates, findings, events: activity })

  for (const update of ticketUpdates) {
    const ticket = kanban.tickets.find(item => item.id === update.ticketId)
    if (ticket?.comments?.some(comment => comment.text.startsWith('AI handover completed, but Vindicter could not parse structured ticket updates.'))) {
      await kanban.updateTicket(update.ticketId, {
        comments: ticket.comments.filter(comment => !comment.text.startsWith('AI handover completed, but Vindicter could not parse structured ticket updates.')),
      })
    }
    await kanban.moveTicket(update.ticketId, update.status)
    const changedFiles = update.changedFiles.length ? `\n\nChanged files:\n${update.changedFiles.map(file => `- ${file}`).join('\n')}` : ''
    await kanban.addComment(
      update.ticketId,
      `${update.comment || 'AI handover updated this ticket.'}${changedFiles}`,
      'AI Agent',
      true,
    )
  }

  return {
    report: String(parsed.markdownReport ?? rawText).trim(),
    summary: String(parsed.summary ?? 'Codex finished handover and synced ticket updates.').trim(),
  }
}

async function syncSelectedJobReport() {
  const job = selectedJob.value
  if (!job?.output || !job.sprintId) return
  const selectedSprint = sprint.sprints.find(item => item.id === job.sprintId)
  if (!selectedSprint) {
    notify('Could not find the sprint for this handover report.', 'warning')
    return
  }

  syncingReport.value = true
  try {
    await applyHandoverArtifacts(job.id, job.output, ticketsForSprint(selectedSprint))
    aiActivity.addEvent(job.id, 'Ticket updates synced', 'Parsed the existing handover report and applied ticket statuses, comments, changed files, and findings.', 'done')
    notify('AI handover ticket updates synced.', 'success')
  }
  catch (e: any) {
    notify(e?.message ?? 'Could not sync ticket updates from the handover report.', 'error')
  }
  finally {
    syncingReport.value = false
  }
}

function findingDescription(finding: any) {
  return [
    '## AI handover follow-up',
    `**Priority:** ${finding.priority}`,
    '',
    finding.detail,
    finding.evidence ? `\n## Evidence\n${finding.evidence}` : '',
    finding.recommendation ? `\n## Recommendation\n${finding.recommendation}` : '',
    '',
    '_Generated from AI Handover._',
  ].filter(Boolean).join('\n')
}

async function sendSelectedFindingsToBacklog() {
  const job = selectedJob.value
  if (!job || !selectedFindings.value.length) return
  try {
    for (const finding of selectedFindings.value) {
      await kanban.createTicket({
        title: `[AI Handover] ${finding.title}`,
        type: normalizeTicketType(finding.type),
        priority: normalizeTicketPriority(finding.priority),
        status: 'backlog',
        description: findingDescription(finding),
        labels: ['ai-handover', 'follow-up'],
      }, 'AI Agent')
      aiActivity.updateFinding(job.id, finding.id, { status: 'backlogged', selected: false })
    }
    notify(`Sent ${selectedFindings.value.length} suggestion${selectedFindings.value.length === 1 ? '' : 's'} to backlog.`, 'success')
  }
  catch (e: any) {
    notify(e?.message ?? 'Could not send suggestions to backlog.', 'error')
  }
}

async function sendSelectedFindingsToSprint() {
  const job = selectedJob.value
  if (!job || !job.sprintId || !selectedFindings.value.length) return
  const selectedSprint = sprint.sprints.find(item => item.id === job.sprintId)
  if (!selectedSprint) {
    notify('Could not find the sprint for these suggestions.', 'warning')
    return
  }

  try {
    for (const finding of selectedFindings.value) {
      const ticket = await kanban.createTicket({
        title: `[AI Handover] ${finding.title}`,
        type: normalizeTicketType(finding.type),
        priority: normalizeTicketPriority(finding.priority),
        status: selectedSprint.status === 'active' ? 'todo' : 'backlog',
        sprintId: selectedSprint.id,
        description: findingDescription(finding),
        labels: ['ai-handover', 'follow-up', 'sprint'],
      }, 'AI Agent')
      await sprint.assignTicket(ticket.id, selectedSprint.id)
      aiActivity.updateFinding(job.id, finding.id, { status: 'sprinted', selected: false })
    }
    notify(`Sent ${selectedFindings.value.length} suggestion${selectedFindings.value.length === 1 ? '' : 's'} to ${selectedSprint.name}.`, 'success')
  }
  catch (e: any) {
    notify(e?.message ?? 'Could not send suggestions to the sprint.', 'error')
  }
}

function friendlyCodexError(message: string) {
  return friendlyCodexExecError(message)
}

async function resumeSelectedHandover() {
  const interruptedJob = selectedJob.value
  const activeProject = project.value
  if (!interruptedJob?.sprintId || !activeProject?.absolutePath) return
  const selectedSprint = sprint.sprints.find(item => item.id === interruptedJob.sprintId)
  if (!selectedSprint) {
    notify('Could not find the sprint for this handover.', 'warning')
    return
  }

  const sprintTickets = ticketsForSprint(selectedSprint)
  resuming.value = true
  const effort = interruptedJob.effort
  const jobId = aiActivity.startJob({
    kind: 'sprint-handover',
    title: `Resume handover: ${selectedSprint.name}`,
    projectId: activeProject.id,
    projectName: activeProject.name,
    projectPath: activeProject.absolutePath,
    sprintId: selectedSprint.id,
    sprintName: selectedSprint.name,
    tool: 'codex',
    effort,
    ticketCount: sprintTickets.length,
    firstStep: 'Resuming sprint handover',
    firstDetail: `Starting a new Codex run for ${sprintTickets.length} sprint ticket${sprintTickets.length === 1 ? '' : 's'}.`,
  })

  try {
    aiActivity.addEvent(
      jobId,
      'Context packaged',
      `${sprintTickets.length} ticket${sprintTickets.length === 1 ? '' : 's'} prepared for a resumed ${effort} effort handover.`,
      'running',
    )
    aiActivity.addEvent(jobId, 'Launching Codex', 'Starting Codex with workspace-write access for this project.', 'running')
    const result = await runCodexExec({
      projectPath: activeProject.absolutePath,
      prompt: buildSprintHandoverPrompt(selectedSprint, sprintTickets, effort),
      model: `Codex CLI default (${effort} resumed handover)`,
      reasoningEffort: effort,
      sandbox: 'workspace-write',
    })
    aiActivity.addEvent(jobId, 'Reading Codex report', 'Codex returned control to Vindicter. Parsing the resumed handover report and status.', 'running')
    const responseText = [result.stdout, result.stderr].filter(Boolean).join('\n').trim()
    if (result.code !== 0) throw new Error(responseText || 'Codex handover failed.')
    if (!responseText) throw new Error('Codex completed without returning a handover report.')
    const applied = await applyHandoverArtifacts(jobId, responseText, sprintTickets)
    aiActivity.finishJob(jobId, 'done', applied.summary || `Codex finished resumed handover for ${selectedSprint.name}.`, applied.report || responseText)
    notify(`AI handover resumed and completed for "${selectedSprint.name}".`, 'success')
  }
  catch (e: any) {
    const message = friendlyCodexError(e?.message ?? 'AI handover resume failed.')
    aiActivity.finishJob(jobId, 'error', message)
    notify(`AI handover resume failed: ${message}`, 'error')
  }
  finally {
    resuming.value = false
  }
}
</script>

<template>
  <div class="grid gap-5 xl:grid-cols-[19rem_1fr]">
    <aside class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3">
      <div class="flex items-center gap-2 px-1 pb-3">
        <Bot class="size-4 text-indigo-300" />
        <div>
          <h2 class="text-sm font-semibold text-[var(--text)]">AI Workspace</h2>
          <p class="text-[10px] text-[var(--text-faint)]">Activity, output, and handover history.</p>
        </div>
      </div>

      <div v-if="projectJobs.length" class="space-y-2">
        <button
          v-for="job in pagedProjectJobs"
          :key="job.id"
          class="w-full rounded-lg border px-3 py-2 text-left transition-colors"
          :class="job.id === selectedJobId ? 'border-indigo-500/35 bg-indigo-500/10' : 'border-[var(--border)] bg-black/10 hover:bg-white/[0.05]'"
          @click="selectedJobId = job.id"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="truncate text-xs font-semibold text-[var(--text)]">{{ job.title }}</span>
            <span class="rounded-full border px-1.5 py-0.5 text-[10px] capitalize" :class="statusClass(job.status)">
              {{ job.status }}
            </span>
          </div>
          <p class="mt-1 truncate text-[10px] text-[var(--text-muted)]">{{ job.currentStep }}</p>
          <p v-if="(job.status === 'error' || job.status === 'interrupted') && (job.error || job.summary)" class="mt-1 line-clamp-2 text-[10px] leading-snug text-red-200/80">
            {{ job.error || job.summary }}
          </p>
          <p class="mt-1 text-[10px] text-[var(--text-faint)]">{{ elapsedLabel(job.startedAt, job.endedAt) }} - {{ job.effort }} effort</p>
        </button>
        <div v-if="projectJobs.length > jobPageSize" class="flex items-center justify-between gap-2 border-t border-[var(--border)] pt-2">
          <button
            class="inline-flex size-7 items-center justify-center rounded-lg border border-[var(--border)] bg-black/10 text-[var(--text-muted)] transition-colors hover:bg-white/[0.05] disabled:opacity-40"
            :disabled="jobPage === 1"
            title="Previous runs"
            @click="previousJobPage"
          >
            <ChevronLeft class="size-3.5" />
          </button>
          <span class="text-[10px] text-[var(--text-faint)]">Page {{ jobPage }} of {{ jobPageCount }}</span>
          <button
            class="inline-flex size-7 items-center justify-center rounded-lg border border-[var(--border)] bg-black/10 text-[var(--text-muted)] transition-colors hover:bg-white/[0.05] disabled:opacity-40"
            :disabled="jobPage === jobPageCount"
            title="Next runs"
            @click="nextJobPage"
          >
            <ChevronRight class="size-3.5" />
          </button>
        </div>
      </div>

      <div v-else class="rounded-lg border border-dashed border-[var(--border)] bg-black/10 px-3 py-8 text-center">
        <Bot class="mx-auto size-5 text-[var(--text-faint)]" />
        <p class="mt-2 text-xs text-[var(--text-muted)]">No AI workspace runs yet.</p>
      </div>
    </aside>

    <section v-if="selectedJob" class="space-y-5">
      <div class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <span class="rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize" :class="statusClass(selectedJob.status)">
                {{ selectedJob.status }}
              </span>
              <span class="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-[var(--text-muted)] capitalize">
                {{ selectedJob.tool }}
              </span>
              <span class="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
                {{ selectedJob.effort }} effort
              </span>
            </div>
            <h1 class="mt-2 text-lg font-semibold text-[var(--text)]">{{ selectedJob.title }}</h1>
            <p class="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
              {{ selectedJob.summary || selectedJob.currentStep }}
            </p>
            <div
              v-if="selectedJobReason"
              class="mt-3 rounded-lg border px-3 py-2 text-xs leading-relaxed"
              :class="selectedJob.status === 'error'
                ? 'border-red-500/25 bg-red-500/10 text-red-100/85'
                : 'border-amber-500/25 bg-amber-500/10 text-amber-100/85'"
            >
              <span class="font-medium">Reason:</span> {{ selectedJobReason }}
            </div>
            <button
              v-if="canResumeSelectedJob"
              class="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="resuming"
              @click="resumeSelectedHandover"
            >
              <Loader2 v-if="resuming" class="size-3.5 animate-spin" />
              <Play v-else class="size-3.5" />
              Resume Handover
            </button>
            <button
              v-if="canSyncSelectedJobReport"
              class="mt-3 ml-2 inline-flex items-center gap-1.5 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-100 transition-colors hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="syncingReport"
              @click="syncSelectedJobReport"
            >
              <Loader2 v-if="syncingReport" class="size-3.5 animate-spin" />
              <FileDiff v-else class="size-3.5" />
              Sync Tickets From Report
            </button>
          </div>
          <div class="rounded-lg border border-[var(--border)] bg-black/10 px-3 py-2 text-right">
            <div class="flex items-center justify-end gap-1.5 text-[10px] uppercase tracking-wider text-[var(--text-faint)]">
              <Clock3 class="size-3" />
              Elapsed
            </div>
            <p class="mt-1 font-mono text-sm text-[var(--text)]">{{ elapsedLabel(selectedJob.startedAt, selectedJob.endedAt) }}</p>
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-1">
        <div class="grid gap-1 md:grid-cols-5">
          <button
            v-for="tab in workspaceTabs"
            :key="tab.id"
            class="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors"
            :class="workspacePanelTab === tab.id
              ? 'bg-indigo-500/15 text-indigo-100'
              : 'text-[var(--text-muted)] hover:bg-white/[0.05] hover:text-[var(--text)]'"
            @click="workspacePanelTab = tab.id"
          >
            <span class="flex min-w-0 items-center gap-2">
              <component
                :is="tab.icon"
                class="size-3.5 shrink-0"
                :class="tab.id === 'activity' && selectedJob.status === 'running' ? 'animate-spin' : ''"
              />
              <span class="truncate">{{ tab.label }}</span>
            </span>
            <span class="rounded-full border border-white/10 bg-black/10 px-1.5 py-0.5 text-[10px] text-[var(--text-faint)]">
              {{ tab.count }}
            </span>
          </button>
        </div>
      </div>

      <div v-if="workspacePanelTab === 'tickets'" class="grid gap-5 xl:grid-cols-[18rem_1fr]">
        <section class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <div class="flex items-center gap-2">
            <Bot class="size-3.5 text-amber-300" />
            <h2 class="text-sm font-semibold text-[var(--text)]">Ticket Steps</h2>
          </div>
          <p class="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">
            Each step is a sprint ticket. Select one to view AI-visible progress, comments, and changed files.
          </p>

          <div v-if="selectedSprintTickets.length" class="mt-4 space-y-2">
            <button
              v-for="(ticket, index) in selectedSprintTickets"
              :key="ticket.id"
              class="grid w-full grid-cols-[1.75rem_1fr] gap-2 rounded-lg border px-3 py-2 text-left transition-colors"
              :class="[
                ticketStepClass(ticket),
                selectedTicket?.id === ticket.id ? 'ring-1 ring-amber-300/40' : 'hover:bg-white/[0.05]',
              ]"
              @click="selectedTicketId = ticket.id"
            >
              <div class="flex size-6 items-center justify-center rounded-full border border-current/20 bg-black/10 text-[10px] font-semibold">
                {{ index + 1 }}
              </div>
              <div class="min-w-0">
                <p class="truncate text-xs font-semibold">{{ ticket.title }}</p>
                <p class="mt-1 truncate text-[10px] opacity-75">
                  {{ selectedJob.ticketUpdates.find(update => update.ticketId === ticket.id)?.status || ticket.status }}
                </p>
              </div>
            </button>
          </div>

          <div v-else class="mt-4 rounded-lg border border-dashed border-[var(--border)] bg-black/10 px-3 py-8 text-center">
            <p class="text-xs text-[var(--text-muted)]">No sprint tickets found for this handover.</p>
          </div>
        </section>

        <section class="space-y-5">
          <div v-if="selectedTicket" class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <span class="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
                    {{ project?.code && selectedTicket.number ? ticketKey(project.code, selectedTicket.number) : `#${selectedTicket.number}` }}
                  </span>
                  <span class="rounded-full border px-2 py-0.5 text-[10px] capitalize" :class="ticketStepClass(selectedTicket)">
                    {{ selectedTicketUpdate?.status || selectedTicket.status }}
                  </span>
                </div>
                <h2 class="mt-2 text-base font-semibold text-[var(--text)]">{{ selectedTicket.title }}</h2>
                <p class="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
                  {{ selectedTicketUpdate?.comment || 'No structured AI update has been returned for this ticket yet.' }}
                </p>
              </div>
              <CheckCircle2 v-if="selectedTicketUpdate?.status === 'done'" class="size-5 text-emerald-300" />
              <Loader2 v-else-if="selectedJob.status === 'running'" class="size-5 animate-spin text-indigo-300" />
              <AlertTriangle v-else class="size-5 text-amber-300" />
            </div>

            <div class="mt-4 grid gap-3 sm:grid-cols-2">
              <div class="rounded-lg border border-[var(--border)] bg-black/10 px-3 py-2">
                <p class="text-[10px] uppercase tracking-wider text-[var(--text-faint)]">Changed Files</p>
                <div v-if="selectedTicketUpdate?.changedFiles.length" class="mt-2 space-y-1">
                  <p v-for="file in selectedTicketUpdate.changedFiles" :key="file" class="truncate font-mono text-[11px] text-violet-200">
                    {{ file }}
                  </p>
                </div>
                <p v-else class="mt-2 text-xs text-[var(--text-muted)]">No files reported yet.</p>
              </div>
              <div class="rounded-lg border border-[var(--border)] bg-black/10 px-3 py-2">
                <p class="text-[10px] uppercase tracking-wider text-[var(--text-faint)]">Ticket Comments</p>
                <p class="mt-2 text-xs text-[var(--text-muted)]">
                  {{ selectedTicket.comments?.length ?? 0 }} comment{{ (selectedTicket.comments?.length ?? 0) === 1 ? '' : 's' }} on this ticket.
                </p>
              </div>
            </div>
          </div>
          <div v-else class="rounded-xl border border-dashed border-[var(--border)] bg-black/10 px-3 py-12 text-center">
            <Bot class="mx-auto size-5 text-[var(--text-faint)]" />
            <p class="mt-2 text-xs text-[var(--text-muted)]">Select a ticket step to inspect handover progress.</p>
          </div>
        </section>
      </div>

      <section v-else-if="workspacePanelTab === 'activity'" class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div class="flex items-center gap-2">
              <Loader2 v-if="selectedJob.status === 'running'" class="size-3.5 animate-spin text-indigo-300" />
              <CheckCircle2 v-else-if="selectedJob.status === 'done'" class="size-3.5 text-emerald-300" />
              <AlertTriangle v-else class="size-3.5 text-amber-300" />
              <h2 class="text-sm font-semibold text-[var(--text)]">Observable Activity</h2>
            </div>
            <p class="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">
              Codex private thoughts are not exposed. Vindicter shows observable activity, file mentions, comments, and returned reports.
            </p>
          </div>
          <div v-if="activityEvents.length > eventPageSize" class="flex items-center gap-2">
            <button class="inline-flex size-7 items-center justify-center rounded-lg border border-[var(--border)] bg-black/10 text-[var(--text-muted)] transition-colors hover:bg-white/[0.05] disabled:opacity-40" :disabled="eventPage === 1" title="Previous steps" @click="previousEventPage">
              <ChevronLeft class="size-3.5" />
            </button>
            <span class="text-[10px] text-[var(--text-faint)]">Page {{ eventPage }} of {{ eventPageCount }}</span>
            <button class="inline-flex size-7 items-center justify-center rounded-lg border border-[var(--border)] bg-black/10 text-[var(--text-muted)] transition-colors hover:bg-white/[0.05] disabled:opacity-40" :disabled="eventPage === eventPageCount" title="Next steps" @click="nextEventPage">
              <ChevronRight class="size-3.5" />
            </button>
          </div>
        </div>
        <div v-if="activityEvents.length" class="mt-4 space-y-2">
          <div v-for="(event, index) in pagedActivityEvents" :key="event.id" class="grid grid-cols-[1.75rem_1fr] gap-2 rounded-lg border px-3 py-2" :class="statusClass(event.status)">
            <div class="flex size-6 items-center justify-center rounded-full border border-current/20 bg-black/10 text-[10px] font-semibold">
              {{ (eventPage - 1) * eventPageSize + index + 1 }}
            </div>
            <div>
              <div class="flex items-center justify-between gap-2">
                <p class="text-xs font-medium">{{ event.label }}</p>
                <span class="text-[10px]">{{ new Date(event.at).toLocaleTimeString() }}</span>
              </div>
              <p class="mt-1 whitespace-pre-wrap text-[10px] leading-relaxed opacity-80">{{ event.detail }}</p>
            </div>
          </div>
        </div>
        <div v-else class="mt-3 rounded-lg border border-dashed border-[var(--border)] bg-black/10 px-3 py-8 text-center">
          <Terminal class="mx-auto size-5 text-[var(--text-faint)]" />
          <p class="mt-2 text-xs text-[var(--text-muted)]">Activity will appear as the AI handover reports progress.</p>
        </div>
      </section>

      <section v-else-if="workspacePanelTab === 'code'" class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <div class="flex items-center gap-2">
          <FileCode class="size-3.5 text-sky-300" />
          <h2 class="text-sm font-semibold text-[var(--text)]">Code Visibility</h2>
        </div>
        <p class="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">
          Private model thoughts are not exposed. This view shows observable code references, changed files reported by the AI, and the returned report when available.
        </p>
        <div v-if="visibleChangedFiles.length" class="mt-4 space-y-2">
          <div
            v-for="file in visibleChangedFiles"
            :key="file"
            class="rounded-lg border border-[var(--border)] bg-black/10 px-3 py-2 font-mono text-xs text-sky-200"
          >
            {{ file }}
          </div>
        </div>
        <div v-else class="mt-4 rounded-lg border border-dashed border-[var(--border)] bg-black/10 px-3 py-8 text-center">
          <FileCode class="mx-auto size-5 text-[var(--text-faint)]" />
          <p class="mt-2 text-xs text-[var(--text-muted)]">Changed files will appear when Codex reports them.</p>
        </div>
        <pre v-if="selectedJob.output" class="mt-4 max-h-80 overflow-auto whitespace-pre-wrap rounded-lg border border-[var(--border)] bg-black/20 p-3 text-[11px] leading-relaxed text-[var(--text-muted)] custom-scroll">{{ selectedJob.output }}</pre>
      </section>

      <section v-else-if="workspacePanelTab === 'suggestions'" class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div class="flex items-center gap-2">
              <Lightbulb class="size-3.5 text-amber-300" />
              <h2 class="text-sm font-semibold text-[var(--text)]">Suggestions</h2>
            </div>
            <p class="mt-1 text-xs text-[var(--text-muted)]">Out-of-scope issues, tech debt, and follow-ups noticed during handover.</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              class="rounded-lg border border-[var(--border)] bg-black/10 px-3 py-2 text-xs font-medium text-[var(--text-muted)] transition-colors hover:bg-white/[0.05] hover:text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="!selectedFindings.length"
              @click="sendSelectedFindingsToBacklog"
            >
              Send to backlog
            </button>
            <button
              class="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="!selectedFindings.length || !selectedJob.sprintId"
              @click="sendSelectedFindingsToSprint"
            >
              Send to current sprint
            </button>
          </div>
        </div>
        <div v-if="selectedJob.findings.length" class="mt-3 space-y-2">
          <div v-for="finding in selectedJob.findings" :key="finding.id" class="rounded-lg border border-[var(--border)] bg-black/10 px-3 py-2">
            <div class="flex items-start gap-2">
              <GlassCheckbox
                :model-value="finding.selected"
                size="sm"
                :disabled="finding.status !== 'open'"
                class="mt-0.5"
                @update:model-value="value => aiActivity.updateFinding(selectedJob.id, finding.id, { selected: Boolean(value) })"
              />
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <p class="text-xs font-semibold text-[var(--text)]">{{ finding.title }}</p>
                  <span class="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-[var(--text-muted)]">{{ finding.priority }}</span>
                  <span class="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-[var(--text-muted)]">{{ finding.status }}</span>
                </div>
                <p class="mt-1 text-[11px] leading-relaxed text-[var(--text-muted)]">{{ finding.detail }}</p>
                <p v-if="finding.recommendation" class="mt-1 text-[11px] leading-relaxed text-[var(--text-faint)]">{{ finding.recommendation }}</p>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="mt-3 rounded-lg border border-dashed border-[var(--border)] bg-black/10 px-3 py-8 text-center">
          <Lightbulb class="mx-auto size-5 text-[var(--text-faint)]" />
          <p class="mt-2 text-xs text-[var(--text-muted)]">No suggestions were returned for this handover.</p>
        </div>
      </section>

      <section v-else class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <div class="flex items-center gap-2">
          <FileDiff class="size-3.5 text-violet-300" />
          <h2 class="text-sm font-semibold text-[var(--text)]">Handover Report</h2>
        </div>
        <div
          v-if="selectedJob.output"
          class="markdown-preview mt-3 max-h-[30rem] overflow-auto rounded-lg border border-[var(--border)] bg-black/20 p-4 text-sm leading-relaxed custom-scroll"
          v-html="renderMarkdown(selectedJob.output)"
        />
        <div v-else class="mt-3 rounded-lg border border-dashed border-[var(--border)] bg-black/10 px-3 py-8 text-center">
          <Terminal class="mx-auto size-5 text-[var(--text-faint)]" />
          <p class="mt-2 text-xs text-[var(--text-muted)]">Codex output will appear when the run reports back.</p>
        </div>
      </section>
    </section>
  </div>
</template>

<style scoped>
.markdown-preview :deep(h1) { font-size: 1.125rem; font-weight: 700; color: var(--text); margin: 0.25rem 0 0.75rem; }
.markdown-preview :deep(h2) { font-size: 1rem; font-weight: 650; color: var(--text); margin: 1rem 0 0.5rem; }
.markdown-preview :deep(h3) { font-size: 0.875rem; font-weight: 600; color: color-mix(in srgb, var(--text) 86%, transparent); margin: 0.75rem 0 0.375rem; }
.markdown-preview :deep(p) { color: var(--text-muted); margin-bottom: 0.625rem; }
.markdown-preview :deep(ul) { list-style: disc; margin: 0.25rem 0 0.75rem 1.1rem; }
.markdown-preview :deep(ol) { list-style: decimal; margin: 0.25rem 0 0.75rem 1.1rem; }
.markdown-preview :deep(li) { color: var(--text-muted); margin-bottom: 0.25rem; }
.markdown-preview :deep(strong) { color: color-mix(in srgb, var(--text) 88%, transparent); font-weight: 650; }
.markdown-preview :deep(code) { border-radius: 0.25rem; background: rgba(255,255,255,0.08); padding: 0.125rem 0.35rem; color: #c4b5fd; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 0.78em; }
.markdown-preview :deep(pre) { margin: 0.75rem 0; overflow-x: auto; border-radius: 0.5rem; border: 1px solid var(--border); background: rgba(0,0,0,0.22); padding: 0.75rem; }
.markdown-preview :deep(pre code) { background: transparent; padding: 0; }
.markdown-preview :deep(blockquote) { margin: 0.75rem 0; border-left: 2px solid rgba(129, 140, 248, 0.5); padding-left: 0.75rem; color: var(--text-faint); }
.markdown-preview :deep(hr) { border-color: var(--border); margin: 1rem 0; }
</style>
