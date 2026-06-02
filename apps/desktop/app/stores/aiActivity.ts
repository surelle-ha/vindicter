export type AIActivityKind = 'security-scan' | 'sprint-handover'
export type AIActivityStatus = 'pending' | 'running' | 'done' | 'warning' | 'error' | 'interrupted'
export type AIActivityTool = 'codex' | 'claude' | 'openrouter'
export type AIActivityEffort = 'low' | 'medium' | 'high' | 'xhigh'

export interface AIActivityEvent {
  id: string
  at: string
  label: string
  detail: string
  status: AIActivityStatus
}

export interface AIHandoverTicketUpdate {
  ticketId: string
  status: string
  comment: string
  changedFiles: string[]
}

export interface AIHandoverFinding {
  id: string
  title: string
  type: string
  priority: string
  detail: string
  evidence: string
  recommendation: string
  status: 'open' | 'backlogged' | 'sprinted' | 'dismissed'
  selected: boolean
}

export interface AIActivityJob {
  id: string
  kind: AIActivityKind
  title: string
  projectId: string | null
  projectName: string
  projectPath: string | null
  sprintId: string | null
  sprintName: string | null
  tool: AIActivityTool
  effort: AIActivityEffort
  status: AIActivityStatus
  startedAt: string
  endedAt: string | null
  currentStep: string
  summary: string
  output: string
  error: string | null
  ticketCount: number
  events: AIActivityEvent[]
  ticketUpdates: AIHandoverTicketUpdate[]
  findings: AIHandoverFinding[]
}

function activityId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function nowIso() {
  return new Date().toISOString()
}

export const useAIActivityStore = defineStore('aiActivity', {
  state: () => ({
    jobs: [] as AIActivityJob[],
    activeJobId: null as string | null,
    dismissedJobIds: [] as string[],
    loaded: false,
  }),
  getters: {
    activeJobs: (state) => state.jobs.filter(job => job.status === 'pending' || job.status === 'running'),
    visibleJobs: (state) => state.jobs
      .filter(job => !state.dismissedJobIds.includes(job.id))
      .slice(0, 4),
    latestJob: (state) => state.jobs[0] ?? null,
    hasActiveHandover: (state) => state.jobs.some(job => job.kind === 'sprint-handover' && (job.status === 'pending' || job.status === 'running')),
  },
  actions: {
    async load() {
      if (this.loaded) return
      this.loaded = true
      const saved = await readPersistedAIActivity()
      if (!saved) return

      this.jobs = normalizeJobs(saved.jobs).map((job) => {
        if (job.status !== 'running' && job.status !== 'pending') return job
        const detail = 'Vindicter stopped before this AI job reported completion. Resume starts a new Codex run for the same scope.'
        return {
          ...job,
          status: 'interrupted',
          endedAt: job.endedAt ?? nowIso(),
          currentStep: 'Interrupted',
          summary: detail,
          error: detail,
          events: [{
            id: activityId('ai_evt'),
            at: nowIso(),
            label: 'Interrupted',
            detail,
            status: 'interrupted',
          }, ...job.events],
        }
      })
      this.activeJobId = saved.activeJobId && this.jobs.some(job => job.id === saved.activeJobId)
        ? saved.activeJobId
        : this.jobs[0]?.id ?? null
      this.dismissedJobIds = Array.isArray(saved.dismissedJobIds) ? saved.dismissedJobIds : []
      await this.persist()
    },
    async persist() {
      await persistAIActivity({
        jobs: this.jobs.slice(0, 30),
        activeJobId: this.activeJobId,
        dismissedJobIds: this.dismissedJobIds,
      })
    },
    projectJobs(projectId: string | null | undefined) {
      if (!projectId) return []
      return this.jobs.filter(job => job.projectId === projectId)
    },
    startJob(input: {
      kind: AIActivityKind
      title: string
      projectId?: string | null
      projectName?: string
      projectPath?: string | null
      sprintId?: string | null
      sprintName?: string | null
      tool?: AIActivityTool
      effort?: AIActivityEffort
      ticketCount?: number
      firstStep?: string
      firstDetail?: string
    }) {
      const firstStep = input.firstStep ?? 'Starting AI work'
      const job: AIActivityJob = {
        id: activityId('ai_job'),
        kind: input.kind,
        title: input.title,
        projectId: input.projectId ?? null,
        projectName: input.projectName ?? 'Project',
        projectPath: input.projectPath ?? null,
        sprintId: input.sprintId ?? null,
        sprintName: input.sprintName ?? null,
        tool: input.tool ?? 'codex',
        effort: input.effort ?? 'medium',
        status: 'running',
        startedAt: nowIso(),
        endedAt: null,
        currentStep: firstStep,
        summary: '',
        output: '',
        error: null,
        ticketCount: input.ticketCount ?? 0,
        events: [{
          id: activityId('ai_evt'),
          at: nowIso(),
          label: firstStep,
          detail: input.firstDetail ?? 'AI work started.',
          status: 'running',
        }],
        ticketUpdates: [],
        findings: [],
      }
      this.jobs = [job, ...this.jobs].slice(0, 30)
      this.activeJobId = job.id
      this.dismissedJobIds = this.dismissedJobIds.filter(id => id !== job.id)
      void this.persist()
      return job.id
    },
    addEvent(jobId: string | null, label: string, detail: string, status: AIActivityStatus = 'running') {
      if (!jobId) return
      const job = this.jobs.find(item => item.id === jobId)
      if (!job) return
      job.currentStep = label
      job.status = status === 'pending' ? job.status : status
      job.events.unshift({
        id: activityId('ai_evt'),
        at: nowIso(),
        label,
        detail,
        status,
      })
      void this.persist()
    },
    appendOutput(jobId: string | null, output: string) {
      if (!jobId) return
      const job = this.jobs.find(item => item.id === jobId)
      if (!job || !output.trim()) return
      job.output = [job.output, output.trim()].filter(Boolean).join('\n\n')
      void this.persist()
    },
    updateJobArtifacts(jobId: string | null, artifacts: {
      ticketUpdates?: AIHandoverTicketUpdate[]
      findings?: Omit<AIHandoverFinding, 'id' | 'status' | 'selected'>[]
      events?: Omit<AIActivityEvent, 'id' | 'at' | 'status'>[]
    }) {
      if (!jobId) return
      const job = this.jobs.find(item => item.id === jobId)
      if (!job) return
      if (artifacts.ticketUpdates) job.ticketUpdates = artifacts.ticketUpdates
      if (artifacts.findings) {
        job.findings = artifacts.findings.map(finding => ({
          ...finding,
          id: activityId('ai_find'),
          status: 'open',
          selected: true,
        }))
      }
      if (artifacts.events?.length) {
        job.events = [
          ...artifacts.events.map(event => ({
            id: activityId('ai_evt'),
            at: nowIso(),
            label: event.label,
            detail: event.detail,
            status: 'running' as AIActivityStatus,
          })),
          ...job.events,
        ]
      }
      void this.persist()
    },
    finishJob(jobId: string | null, status: AIActivityStatus, summary: string, output?: string) {
      if (!jobId) return
      const job = this.jobs.find(item => item.id === jobId)
      if (!job) return
      job.status = status
      job.endedAt = nowIso()
      job.summary = summary
      job.currentStep = status === 'done' ? 'Complete' : status === 'warning' ? 'Needs review' : 'Failed'
      if (output?.trim()) job.output = output.trim()
      if (status === 'error') job.error = summary
      job.events.unshift({
        id: activityId('ai_evt'),
        at: nowIso(),
        label: job.currentStep,
        detail: summary,
        status,
      })
      void this.persist()
    },
    updateFinding(jobId: string, findingId: string, updates: Partial<AIHandoverFinding>) {
      const job = this.jobs.find(item => item.id === jobId)
      const finding = job?.findings.find(item => item.id === findingId)
      if (!finding) return
      Object.assign(finding, updates)
      void this.persist()
    },
    dismiss(jobId: string) {
      if (!this.dismissedJobIds.includes(jobId)) this.dismissedJobIds.push(jobId)
      void this.persist()
    },
    setActive(jobId: string) {
      if (this.jobs.some(job => job.id === jobId)) this.activeJobId = jobId
      void this.persist()
    },
  },
})

interface PersistedAIActivity {
  jobs: AIActivityJob[]
  activeJobId: string | null
  dismissedJobIds: string[]
}

const AI_ACTIVITY_KEY = 'ai-activity-history'

function normalizeJobs(value: unknown): AIActivityJob[] {
  if (!Array.isArray(value)) return []
  return value
    .map((job: any) => ({
      id: String(job?.id ?? activityId('ai_job')),
      kind: job?.kind === 'security-scan' ? 'security-scan' : 'sprint-handover',
      title: String(job?.title ?? 'AI job'),
      projectId: job?.projectId ? String(job.projectId) : null,
      projectName: String(job?.projectName ?? 'Project'),
      projectPath: job?.projectPath ? String(job.projectPath) : null,
      sprintId: job?.sprintId ? String(job.sprintId) : null,
      sprintName: job?.sprintName ? String(job.sprintName) : null,
      tool: job?.tool === 'claude' ? 'claude' : job?.tool === 'openrouter' ? 'openrouter' : 'codex',
      effort: ['low', 'medium', 'high', 'xhigh'].includes(job?.effort) ? job.effort : 'medium',
      status: ['pending', 'running', 'done', 'warning', 'error', 'interrupted'].includes(job?.status) ? job.status : 'warning',
      startedAt: String(job?.startedAt ?? nowIso()),
      endedAt: job?.endedAt ? String(job.endedAt) : null,
      currentStep: String(job?.currentStep ?? 'Unknown'),
      summary: String(job?.summary ?? ''),
      output: String(job?.output ?? ''),
      error: job?.error ? String(job.error) : null,
      ticketCount: Number.isFinite(job?.ticketCount) ? Number(job.ticketCount) : 0,
      events: Array.isArray(job?.events)
        ? job.events.map((event: any) => ({
            id: String(event?.id ?? activityId('ai_evt')),
            at: String(event?.at ?? nowIso()),
            label: String(event?.label ?? 'Activity'),
            detail: String(event?.detail ?? ''),
            status: ['pending', 'running', 'done', 'warning', 'error', 'interrupted'].includes(event?.status) ? event.status : 'warning',
          }))
        : [],
      ticketUpdates: Array.isArray(job?.ticketUpdates)
        ? job.ticketUpdates.map((update: any) => ({
            ticketId: String(update?.ticketId ?? ''),
            status: String(update?.status ?? ''),
            comment: String(update?.comment ?? ''),
            changedFiles: Array.isArray(update?.changedFiles) ? update.changedFiles.map(String) : [],
          })).filter((update: AIHandoverTicketUpdate) => update.ticketId)
        : [],
      findings: Array.isArray(job?.findings)
        ? job.findings.map((finding: any) => ({
            id: String(finding?.id ?? activityId('ai_find')),
            title: String(finding?.title ?? 'Untitled finding'),
            type: String(finding?.type ?? 'chore'),
            priority: String(finding?.priority ?? 'medium'),
            detail: String(finding?.detail ?? ''),
            evidence: String(finding?.evidence ?? ''),
            recommendation: String(finding?.recommendation ?? ''),
            status: ['open', 'backlogged', 'sprinted', 'dismissed'].includes(finding?.status) ? finding.status : 'open',
            selected: Boolean(finding?.selected ?? finding?.status !== 'backlogged'),
          }))
        : [],
    }))
    .slice(0, 30)
}

async function readPersistedAIActivity(): Promise<PersistedAIActivity | null> {
  try {
    const store = useTauriStore()
    return await store.get<PersistedAIActivity>(AI_ACTIVITY_KEY)
  }
  catch {
    if (typeof localStorage === 'undefined') return null
    const raw = localStorage.getItem(AI_ACTIVITY_KEY)
    return raw ? JSON.parse(raw) as PersistedAIActivity : null
  }
}

async function persistAIActivity(value: PersistedAIActivity) {
  try {
    const store = useTauriStore()
    await store.set(AI_ACTIVITY_KEY, value)
    await store.save()
  }
  catch {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(AI_ACTIVITY_KEY, JSON.stringify(value))
  }
}
