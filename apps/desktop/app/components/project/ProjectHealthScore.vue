<script setup lang="ts">
import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  FileText,
  Gauge,
  GitBranch,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TestTube2,
  Timer,
} from 'lucide-vue-next'
import { friendlyCodexExecError, runCodexExec } from '~/composables/useCodexShell'
import type { HistoryEntry, Ticket, VindicterJson } from '~/types/vindicta'

const props = defineProps<{
  projectPath: string
}>()

interface Metric {
  id: keyof HealthScores
  label: string
  value: number
  detail: string
  icon: any
  tone: string
  evidence: string[]
  aiNote?: string
}

interface HealthScores {
  maintainability: number
  complexity: number
  velocity: number
  security: number
  documentation: number
  aiDependency: number
  testConfidence: number
}

interface HealthFinding {
  severity: 'low' | 'medium' | 'high'
  area: string
  title: string
  detail: string
}

interface AIHealthResult {
  summary: string
  scores: Partial<HealthScores>
  findings: HealthFinding[]
}

interface SourceSignals {
  sourceFiles: number
  testFiles: number
  configFiles: number
  docsFiles: number
  packageScripts: string[]
  dependencyNames: string[]
  hasReadme: boolean
  hasChangelog: boolean
  hasEnvExample: boolean
  hasTestScript: boolean
  hasLintScript: boolean
  hasTypecheckScript: boolean
  hasTestTooling: boolean
}

interface LocalFsEntry {
  name: string
  path: string
  isDir: boolean
}

const SCORE_KEYS: (keyof HealthScores)[] = [
  'maintainability',
  'complexity',
  'velocity',
  'security',
  'documentation',
  'aiDependency',
  'testConfidence',
]

const ignoredDirs = new Set([
  '.git',
  '.nuxt',
  '.output',
  '.next',
  'coverage',
  'dist',
  'build',
  'node_modules',
  'target',
  '.venv',
])

const fs = useTauriFs()
const { notify } = useNotifications()
const loading = ref(true)
const aiChecking = ref(false)
const error = ref<string | null>(null)
const data = ref<VindicterJson | null>(null)
const rootEntries = ref<LocalFsEntry[]>([])
const signals = ref<SourceSignals>(emptySignals())
const aiError = ref<string | null>(null)
const expandedReport = ref(false)

function emptySignals(): SourceSignals {
  return {
    sourceFiles: 0,
    testFiles: 0,
    configFiles: 0,
    docsFiles: 0,
    packageScripts: [],
    dependencyNames: [],
    hasReadme: false,
    hasChangelog: false,
    hasEnvExample: false,
    hasTestScript: false,
    hasLintScript: false,
    hasTypecheckScript: false,
    hasTestTooling: false,
  }
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function average(values: number[]) {
  if (!values.length) return 0
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

function pathJoin(base: string, name: string) {
  const sep = base.includes('\\') ? '\\' : '/'
  return `${base.replace(/[\\/]+$/, '')}${sep}${name}`
}

function hasRootFile(pattern: RegExp) {
  return rootEntries.value.some(entry => !entry.isDir && pattern.test(entry.name))
}

function recentEntries(history: HistoryEntry[], actionPrefix: string, days: number) {
  const cutoff = Date.now() - days * 86400000
  return history.filter((entry) => {
    const time = new Date(entry.at).getTime()
    return entry.action.startsWith(actionPrefix) && Number.isFinite(time) && time >= cutoff
  })
}

function ticketDoneRatio(tickets: Ticket[]) {
  if (!tickets.length) return 0
  return tickets.filter(ticket => ticket.status === 'done').length / tickets.length
}

function numberPayload(entry: HistoryEntry | undefined, key: string) {
  const value = entry?.payload?.[key]
  return typeof value === 'number' ? value : null
}

function latestHealthCheck(history: HistoryEntry[]): AIHealthResult | null {
  const entry = history.find(item => item.action === 'project:health_checked')
  if (!entry) return null

  const payload = entry.payload ?? {}
  const summary = typeof payload.summary === 'string' ? payload.summary : ''
  const rawScores = payload.scores && typeof payload.scores === 'object'
    ? payload.scores as Record<string, unknown>
    : {}
  const scores: Partial<HealthScores> = {}
  for (const key of SCORE_KEYS) {
    const value = rawScores[key]
    if (typeof value === 'number') scores[key] = clamp(value)
  }

  const rawFindings = Array.isArray(payload.findings) ? payload.findings : []
  const findings = rawFindings
    .map((item): HealthFinding | null => {
      if (!item || typeof item !== 'object') return null
      const record = item as Record<string, unknown>
      const severity = record.severity === 'high' || record.severity === 'medium' || record.severity === 'low'
        ? record.severity
        : 'medium'
      return {
        severity,
        area: typeof record.area === 'string' ? record.area : 'Project',
        title: typeof record.title === 'string' ? record.title : 'Health finding',
        detail: typeof record.detail === 'string' ? record.detail : '',
      }
    })
    .filter((item): item is HealthFinding => Boolean(item))

  return { summary, scores, findings }
}

function blendWithAI(id: keyof HealthScores, localScore: number, check: AIHealthResult | null) {
  const aiScore = check?.scores[id]
  if (typeof aiScore !== 'number') return localScore
  return clamp(localScore * 0.7 + aiScore * 0.3)
}

const healthCheck = computed(() => latestHealthCheck(data.value?.history ?? []))

const metrics = computed<Metric[]>(() => {
  const project = data.value
  if (!project) return []

  const projectSignals = signals.value
  const tickets = project.tickets ?? []
  const sprints = project.sprints ?? []
  const history = project.history ?? []
  const openTickets = tickets.filter(ticket => !['done', 'cancelled'].includes(ticket.status))
  const criticalTickets = openTickets.filter(ticket => ticket.priority === 'critical' || ticket.priority === 'high')
  const staleTickets = openTickets.filter((ticket) => {
    const updated = new Date(ticket.updatedAt).getTime()
    return Number.isFinite(updated) && Date.now() - updated > 14 * 86400000
  })
  const doneRatio = ticketDoneRatio(tickets)
  const recentDone = tickets.filter((ticket) => {
    if (ticket.status !== 'done' || !ticket.resolvedAt) return false
    const resolved = new Date(ticket.resolvedAt).getTime()
    return Number.isFinite(resolved) && Date.now() - resolved < 30 * 86400000
  })
  const recentTicketActivity = recentEntries(history, 'ticket:', 14).length
  const recentSprintActivity = recentEntries(history, 'sprint:', 30).length
  const docsUpdates = history.filter(entry => entry.action === 'project:docs_updated').length
  const aiComments = tickets.flatMap(ticket => ticket.comments ?? []).filter(comment => comment.isAI).length
  const totalComments = tickets.flatMap(ticket => ticket.comments ?? []).length
  const securityScans = history.filter(entry => entry.action === 'security:scan_completed')
  const latestSecurityScan = securityScans[0]
  const securityFindings = numberPayload(latestSecurityScan, 'findings')
  const completedSprints = sprints.filter(sprint => sprint.status === 'completed').length
  const activeSprints = sprints.filter(sprint => sprint.status === 'active').length
  const check = healthCheck.value

  const maintainabilityLocal = clamp(
    58
    + doneRatio * 12
    + (projectSignals.hasLintScript ? 8 : 0)
    + (projectSignals.hasTypecheckScript ? 8 : 0)
    + Math.min(8, recentTicketActivity)
    - staleTickets.length * 5
    - criticalTickets.length * 4,
  )
  const complexityLocal = clamp(
    86
    - Math.min(28, Math.floor(projectSignals.sourceFiles / 18))
    - openTickets.length * 2
    - activeSprints * 4
    + (projectSignals.hasTypecheckScript ? 8 : 0)
    + Math.min(8, doneRatio * 8),
  )
  const velocityLocal = clamp(
    38
    + recentDone.length * 9
    + recentTicketActivity * 2
    + recentSprintActivity * 2
    + completedSprints * 4
    - staleTickets.length * 3,
  )
  const securityLocal = clamp(
    (securityScans.length ? 78 : 42)
    + (projectSignals.hasEnvExample ? 8 : 0)
    + (projectSignals.dependencyNames.some(name => /helmet|csrf|zod|validator|sanitize|auth/i.test(name)) ? 5 : 0)
    - (securityFindings ?? 0) * 6
    - criticalTickets.length * 4,
  )
  const documentationLocal = clamp(
    (projectSignals.hasReadme ? 42 : 0)
    + (projectSignals.hasChangelog ? 22 : 0)
    + Math.min(18, projectSignals.docsFiles * 4)
    + Math.min(18, docsUpdates * 6),
  )
  const aiDependencyLocal = clamp(
    92
    - (totalComments ? (aiComments / totalComments) * 45 : 0)
    - Math.max(0, (project.meta.aiTools?.length ?? 1) - 1) * 6
    + (tickets.length && aiComments < tickets.length ? 4 : 0),
  )
  const testConfidenceLocal = clamp(
    (projectSignals.hasTestTooling ? 34 : 0)
    + (projectSignals.hasTestScript ? 26 : 0)
    + Math.min(28, projectSignals.testFiles * 7)
    + Math.min(12, doneRatio * 12),
  )

  return [
    {
      id: 'maintainability',
      label: 'Maintainability',
      value: blendWithAI('maintainability', maintainabilityLocal, check),
      detail: staleTickets.length ? `${staleTickets.length} stale open ticket${staleTickets.length === 1 ? '' : 's'} detected.` : 'Work items are current and tracked.',
      icon: Gauge,
      tone: 'text-emerald-300',
      evidence: [
        `${openTickets.length} open ticket${openTickets.length === 1 ? '' : 's'}`,
        projectSignals.hasLintScript ? 'lint script detected' : 'no lint script detected',
        projectSignals.hasTypecheckScript ? 'typecheck script detected' : 'no typecheck script detected',
      ],
      aiNote: check?.scores.maintainability ? 'Blended with latest AI check.' : undefined,
    },
    {
      id: 'complexity',
      label: 'Complexity',
      value: blendWithAI('complexity', complexityLocal, check),
      detail: `${projectSignals.sourceFiles} source file${projectSignals.sourceFiles === 1 ? '' : 's'} and ${openTickets.length} open ticket${openTickets.length === 1 ? '' : 's'}.`,
      icon: GitBranch,
      tone: 'text-sky-300',
      evidence: [
        `${activeSprints} active sprint${activeSprints === 1 ? '' : 's'}`,
        `${criticalTickets.length} high priority open ticket${criticalTickets.length === 1 ? '' : 's'}`,
        `${projectSignals.configFiles} config file${projectSignals.configFiles === 1 ? '' : 's'} found`,
      ],
      aiNote: check?.scores.complexity ? 'Blended with latest AI check.' : undefined,
    },
    {
      id: 'velocity',
      label: 'Velocity',
      value: blendWithAI('velocity', velocityLocal, check),
      detail: `${recentDone.length} ticket${recentDone.length === 1 ? '' : 's'} completed in the last 30 days.`,
      icon: Timer,
      tone: 'text-indigo-300',
      evidence: [
        `${recentTicketActivity} ticket event${recentTicketActivity === 1 ? '' : 's'} in 14 days`,
        `${completedSprints} completed sprint${completedSprints === 1 ? '' : 's'}`,
        `${recentSprintActivity} sprint event${recentSprintActivity === 1 ? '' : 's'} in 30 days`,
      ],
      aiNote: check?.scores.velocity ? 'Blended with latest AI check.' : undefined,
    },
    {
      id: 'security',
      label: 'Security',
      value: blendWithAI('security', securityLocal, check),
      detail: securityScans.length ? `${securityScans.length} security scan${securityScans.length === 1 ? '' : 's'} logged.` : 'No security scan recorded yet.',
      icon: ShieldCheck,
      tone: 'text-emerald-300',
      evidence: [
        securityFindings === null ? 'latest finding count unavailable' : `${securityFindings} finding${securityFindings === 1 ? '' : 's'} in latest scan`,
        projectSignals.hasEnvExample ? '.env.example detected' : '.env.example missing',
        securityScans.length ? 'Security Analyzer history found' : 'run Security Analyzer for stronger signal',
      ],
      aiNote: check?.scores.security ? 'Blended with latest AI check.' : undefined,
    },
    {
      id: 'documentation',
      label: 'Documentation Quality',
      value: blendWithAI('documentation', documentationLocal, check),
      detail: projectSignals.hasReadme ? 'README detected in project root.' : 'README is missing from project root.',
      icon: FileText,
      tone: 'text-violet-300',
      evidence: [
        projectSignals.hasChangelog ? 'CHANGELOG detected' : 'CHANGELOG missing',
        `${projectSignals.docsFiles} docs file${projectSignals.docsFiles === 1 ? '' : 's'} found`,
        `${docsUpdates} Vindicter docs update${docsUpdates === 1 ? '' : 's'}`,
      ],
      aiNote: check?.scores.documentation ? 'Blended with latest AI check.' : undefined,
    },
    {
      id: 'aiDependency',
      label: 'AI Dependency Level',
      value: blendWithAI('aiDependency', aiDependencyLocal, check),
      detail: totalComments ? `${aiComments} of ${totalComments} ticket comment${totalComments === 1 ? '' : 's'} came from AI.` : 'No AI-heavy ticket comments detected.',
      icon: Bot,
      tone: 'text-amber-300',
      evidence: [
        `${project.meta.aiTools?.length ?? 0} AI tool${(project.meta.aiTools?.length ?? 0) === 1 ? '' : 's'} configured`,
        totalComments ? `${Math.round((aiComments / totalComments) * 100)}% AI comment share` : 'no comment signal yet',
        project.meta.activeAITool ? `${project.meta.activeAITool} selected` : 'no active AI tool selected',
      ],
      aiNote: check?.scores.aiDependency ? 'Blended with latest AI check.' : undefined,
    },
    {
      id: 'testConfidence',
      label: 'Test Confidence',
      value: blendWithAI('testConfidence', testConfidenceLocal, check),
      detail: projectSignals.hasTestScript ? 'Package test script detected.' : 'No package test script detected.',
      icon: TestTube2,
      tone: 'text-cyan-300',
      evidence: [
        `${projectSignals.testFiles} test file${projectSignals.testFiles === 1 ? '' : 's'} found`,
        projectSignals.hasTestTooling ? 'test tooling dependency/config detected' : 'test tooling not detected',
        `${projectSignals.packageScripts.length} package script${projectSignals.packageScripts.length === 1 ? '' : 's'} detected`,
      ],
      aiNote: check?.scores.testConfidence ? 'Blended with latest AI check.' : undefined,
    },
  ]
})

const overallScore = computed(() => average(metrics.value.map(metric => metric.value)))
const scoreLabel = computed(() => {
  if (overallScore.value >= 85) return 'Strong'
  if (overallScore.value >= 70) return 'Healthy'
  if (overallScore.value >= 55) return 'Watch'
  return 'Needs Focus'
})
const topRisks = computed(() => [...metrics.value].sort((a, b) => a.value - b.value).slice(0, 3))
const latestHealthSummary = computed(() => healthCheck.value?.summary || 'Run AI Check to add a second-pass review from Codex.')

async function collectSourceSignals(entries: LocalFsEntry[]) {
  const next = emptySignals()
  next.hasReadme = entries.some(entry => !entry.isDir && /^readme\.md$/i.test(entry.name))
  next.hasChangelog = entries.some(entry => !entry.isDir && /^changelog\.md$/i.test(entry.name))
  next.hasEnvExample = entries.some(entry => !entry.isDir && /^\.env\.example$/i.test(entry.name))

  const packageEntry = entries.find(entry => !entry.isDir && entry.name.toLowerCase() === 'package.json')
  if (packageEntry) {
    const rawPackage = await fs.readTextFile(packageEntry.path).catch(() => '')
    try {
      const parsed = JSON.parse(rawPackage)
      const scripts = parsed.scripts && typeof parsed.scripts === 'object' ? parsed.scripts as Record<string, unknown> : {}
      const dependencies = parsed.dependencies && typeof parsed.dependencies === 'object' ? parsed.dependencies as Record<string, unknown> : {}
      const devDependencies = parsed.devDependencies && typeof parsed.devDependencies === 'object' ? parsed.devDependencies as Record<string, unknown> : {}
      next.packageScripts = Object.keys(scripts)
      next.dependencyNames = [...Object.keys(dependencies), ...Object.keys(devDependencies)]
      next.hasTestScript = Object.entries(scripts).some(([name, value]) => /test|spec|vitest|jest|playwright|cypress/i.test(`${name} ${String(value)}`))
      next.hasLintScript = Object.entries(scripts).some(([name, value]) => /lint|eslint|biome/i.test(`${name} ${String(value)}`))
      next.hasTypecheckScript = Object.entries(scripts).some(([name, value]) => /typecheck|tsc|vue-tsc/i.test(`${name} ${String(value)}`))
      next.hasTestTooling = next.dependencyNames.some(name => /vitest|jest|playwright|cypress|testing-library|mocha|ava/i.test(name))
    }
    catch { /* package.json may be malformed while the user is editing */ }
  }

  let visited = 0
  async function scanDir(dir: string, depth: number) {
    if (visited > 700 || depth > 3) return
    const children = await fs.readDir(dir).catch(() => []) as LocalFsEntry[]
    for (const child of children) {
      if (visited > 700) return
      visited += 1
      if (child.isDir) {
        if (!ignoredDirs.has(child.name)) await scanDir(child.path, depth + 1)
        continue
      }

      const name = child.name.toLowerCase()
      if (/\.(ts|tsx|js|jsx|vue|svelte|rs|go|py|php|java|cs|rb|swift|kt)$/.test(name)) next.sourceFiles += 1
      if (/(\.|-)(test|spec)\.|__tests__|tests?/i.test(child.path)) next.testFiles += 1
      if (/\.(config|conf)\.|^(tsconfig|vite|nuxt|next|eslint|biome|tailwind|vitest|jest|playwright|cypress)/i.test(child.name)) next.configFiles += 1
      if (/\.(md|mdx|rst)$/i.test(child.name)) next.docsFiles += 1
      if (/^(vitest|jest|playwright|cypress)\.config\./i.test(child.name)) next.hasTestTooling = true
    }
  }

  for (const entry of entries) {
    if (entry.isDir && !ignoredDirs.has(entry.name)) await scanDir(entry.path, 1)
  }

  return next
}

function buildHealthPrompt(project: VindicterJson, currentMetrics: Metric[]) {
  const scanData = {
    project: {
      name: project.meta.name,
      description: project.meta.description,
      activeAITool: project.meta.activeAITool,
    },
    scores: Object.fromEntries(currentMetrics.map(metric => [metric.id, metric.value])),
    tickets: {
      total: project.tickets.length,
      open: project.tickets.filter(ticket => !['done', 'cancelled'].includes(ticket.status)).length,
      highPriorityOpen: project.tickets.filter(ticket => !['done', 'cancelled'].includes(ticket.status) && ['high', 'critical'].includes(ticket.priority)).length,
      done: project.tickets.filter(ticket => ticket.status === 'done').length,
    },
    sprints: {
      total: project.sprints.length,
      active: project.sprints.filter(sprint => sprint.status === 'active').length,
      completed: project.sprints.filter(sprint => sprint.status === 'completed').length,
    },
    sourceSignals: signals.value,
    recentHistory: project.history.slice(0, 20).map(entry => ({
      at: entry.at,
      action: entry.action,
      payload: entry.payload,
    })),
  }

  return `You are running a read-only engineering health check for this project.

Do not edit files. Use the provided Vindicter data and inspect the repository only when it helps validate the score.

Return only valid JSON in this shape:
{
  "summary": "one concise paragraph",
  "scores": {
    "maintainability": 0,
    "complexity": 0,
    "velocity": 0,
    "security": 0,
    "documentation": 0,
    "aiDependency": 0,
    "testConfidence": 0
  },
  "findings": [
    {
      "severity": "low|medium|high",
      "area": "short area",
      "title": "short finding title",
      "detail": "specific evidence-backed detail"
    }
  ]
}

Keep scores from 0 to 100 where higher is healthier. For aiDependency, higher means healthier autonomy and lower dependency risk.
Limit findings to the 5 most useful items.

Vindicter project data:
${JSON.stringify(scanData, null, 2)}`
}

function extractFirstJsonObject(raw: string) {
  const trimmed = raw.trim()
  const start = trimmed.indexOf('{')
  if (start === -1) throw new Error('AI health check did not return JSON.')

  let depth = 0
  let inString = false
  let escaped = false
  for (let index = start; index < trimmed.length; index += 1) {
    const char = trimmed[index]

    if (escaped) {
      escaped = false
      continue
    }
    if (char === '\\') {
      escaped = true
      continue
    }
    if (char === '"') {
      inString = !inString
      continue
    }
    if (inString) continue

    if (char === '{') depth += 1
    if (char === '}') {
      depth -= 1
      if (depth === 0) return trimmed.slice(start, index + 1)
    }
  }

  throw new Error('AI health check returned incomplete JSON.')
}

function parseAIHealthResult(raw: string): AIHealthResult {
  const jsonText = extractFirstJsonObject(raw)
  const parsed = JSON.parse(jsonText) as Record<string, unknown>
  const rawScores = parsed.scores && typeof parsed.scores === 'object' ? parsed.scores as Record<string, unknown> : {}
  const scores: Partial<HealthScores> = {}
  for (const key of SCORE_KEYS) {
    const value = rawScores[key]
    if (typeof value === 'number') scores[key] = clamp(value)
  }
  const findings = Array.isArray(parsed.findings)
    ? parsed.findings.map((item): HealthFinding | null => {
        if (!item || typeof item !== 'object') return null
        const record = item as Record<string, unknown>
        const severity = record.severity === 'high' || record.severity === 'medium' || record.severity === 'low'
          ? record.severity
          : 'medium'
        return {
          severity,
          area: typeof record.area === 'string' ? record.area.slice(0, 80) : 'Project',
          title: typeof record.title === 'string' ? record.title.slice(0, 120) : 'Health finding',
          detail: typeof record.detail === 'string' ? record.detail.slice(0, 500) : '',
        }
      }).filter((item): item is HealthFinding => Boolean(item))
    : []

  return {
    summary: typeof parsed.summary === 'string' ? parsed.summary.slice(0, 1000) : 'AI health check completed.',
    scores,
    findings,
  }
}

async function loadHealth() {
  loading.value = true
  error.value = null
  try {
    const { read } = useVindicterJson()
    data.value = await read(props.projectPath)
    const entries = await fs.readDir(props.projectPath).catch(() => []) as LocalFsEntry[]
    rootEntries.value = entries
    signals.value = await collectSourceSignals(entries)
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Could not load project health.'
  }
  finally {
    loading.value = false
  }
}

async function runAIHealthCheck() {
  if (!data.value || aiChecking.value) return
  aiChecking.value = true
  aiError.value = null
  try {
    const prompt = buildHealthPrompt(data.value, metrics.value)
    const result = await runCodexExec({
      prompt,
      projectPath: props.projectPath,
      reasoningEffort: 'medium',
      sandbox: 'read-only',
    })
    const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim()
    if (result.code !== 0) throw new Error(output || 'AI health check failed.')

    const parsed = parseAIHealthResult(output)
    const { appendHistory } = useVindicterJson()
    await appendHistory(props.projectPath, {
      action: 'project:health_checked',
      actor: 'Codex',
      payload: {
        summary: parsed.summary,
        scores: parsed.scores,
        findings: parsed.findings,
        rawReport: output,
      },
    })
    await loadHealth()
    expandedReport.value = true
    notify('Engineering health AI check completed.', 'success')
  }
  catch (e) {
    const message = friendlyCodexExecError(e)
    aiError.value = message
    notify(`AI health check failed: ${message}`, 'error')
  }
  finally {
    aiChecking.value = false
  }
}

watch(() => props.projectPath, loadHealth, { immediate: true })
</script>

<template>
  <div class="space-y-5">
    <div v-if="loading" class="py-12 text-center text-sm text-[var(--text-muted)]">
      Calculating health score...
    </div>

    <div v-else-if="error" class="rounded-lg border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-200">
      {{ error }}
    </div>

    <template v-else>
      <section class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <Activity class="size-4 text-indigo-300" />
              <h2 class="text-sm font-semibold text-[var(--text)]">Engineering Health Score</h2>
            </div>
            <p class="mt-2 max-w-3xl text-xs leading-relaxed text-[var(--text-muted)]">
              Uses Vindicter tickets, sprints, history, docs, scripts, shallow source signals, security scan history, and optional Codex AI Check.
            </p>
            <div class="mt-4 flex flex-wrap gap-2 text-[11px] text-[var(--text-muted)]">
              <span class="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1">{{ signals.sourceFiles }} source files</span>
              <span class="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1">{{ signals.testFiles }} test files</span>
              <span class="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1">{{ signals.packageScripts.length }} scripts</span>
              <span class="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1">{{ data?.history.length ?? 0 }} history events</span>
            </div>
          </div>

          <div class="flex shrink-0 items-center gap-3">
            <button
              class="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-[var(--text-muted)] transition-colors hover:bg-white/[0.07] hover:text-[var(--text)]"
              :disabled="loading || aiChecking"
              @click="loadHealth"
            >
              <RefreshCw class="size-3.5" :class="{ 'animate-spin': loading }" />
              Refresh
            </button>
            <button
              class="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-indigo-500/30 bg-indigo-500/15 px-3 text-xs font-medium text-indigo-100 transition-colors hover:bg-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="aiChecking"
              @click="runAIHealthCheck"
            >
              <Sparkles class="size-3.5" :class="{ 'animate-pulse': aiChecking }" />
              {{ aiChecking ? 'Checking...' : 'Run AI Check' }}
            </button>
            <div class="rounded-xl border border-indigo-500/25 bg-indigo-500/10 px-5 py-4 text-center">
              <p class="text-[10px] uppercase tracking-wider text-indigo-200/60">{{ scoreLabel }}</p>
              <p class="mt-1 text-3xl font-bold text-indigo-100">{{ overallScore }}</p>
            </div>
          </div>
        </div>
        <p v-if="aiError" class="mt-4 text-xs text-red-300">{{ aiError }}</p>
      </section>

      <section class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <article
          v-for="metric in metrics"
          :key="metric.id"
          class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-sm font-semibold text-[var(--text)]">{{ metric.label }}</p>
              <p class="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">{{ metric.detail }}</p>
            </div>
            <component :is="metric.icon" class="size-4 shrink-0" :class="metric.tone" />
          </div>
          <div class="mt-4 flex items-center gap-3">
            <div class="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                class="h-full rounded-full bg-indigo-400 transition-all"
                :style="{ width: `${metric.value}%` }"
              />
            </div>
            <span class="w-8 text-right font-mono text-xs text-[var(--text)]">{{ metric.value }}</span>
          </div>
          <div class="mt-3 space-y-1">
            <p v-for="item in metric.evidence" :key="item" class="text-[11px] leading-relaxed text-[var(--text-faint)]">
              {{ item }}
            </p>
            <p v-if="metric.aiNote" class="text-[11px] text-indigo-200/70">{{ metric.aiNote }}</p>
          </div>
        </article>
      </section>

      <section class="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
        <article class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <Bot class="size-4 text-indigo-300" />
              <h3 class="text-sm font-semibold text-[var(--text)]">AI Check</h3>
            </div>
            <button
              v-if="healthCheck"
              class="cursor-pointer text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
              @click="expandedReport = !expandedReport"
            >
              {{ expandedReport ? 'Hide findings' : 'Show findings' }}
            </button>
          </div>
          <p class="mt-3 text-xs leading-relaxed text-[var(--text-muted)]">{{ latestHealthSummary }}</p>

          <div v-if="healthCheck && expandedReport" class="mt-4 space-y-2">
            <div
              v-for="finding in healthCheck.findings"
              :key="`${finding.area}-${finding.title}`"
              class="rounded-lg border border-white/10 bg-white/[0.03] p-3"
            >
              <div class="flex items-start gap-2">
                <AlertTriangle
                  class="mt-0.5 size-3.5 shrink-0"
                  :class="finding.severity === 'high' ? 'text-red-300' : finding.severity === 'medium' ? 'text-amber-300' : 'text-sky-300'"
                />
                <div>
                  <p class="text-xs font-semibold text-[var(--text)]">{{ finding.title }}</p>
                  <p class="mt-1 text-[11px] uppercase tracking-wider text-[var(--text-faint)]">{{ finding.area }} / {{ finding.severity }}</p>
                  <p class="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">{{ finding.detail }}</p>
                </div>
              </div>
            </div>
          </div>
        </article>

        <article class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <div class="flex items-center gap-2">
            <CheckCircle2 class="size-4 text-emerald-300" />
            <h3 class="text-sm font-semibold text-[var(--text)]">Focus Areas</h3>
          </div>
          <div class="mt-4 space-y-3">
            <div v-for="risk in topRisks" :key="risk.id" class="flex items-center justify-between gap-3">
              <div class="min-w-0">
                <p class="text-xs font-medium text-[var(--text)]">{{ risk.label }}</p>
                <p class="truncate text-[11px] text-[var(--text-faint)]">{{ risk.detail }}</p>
              </div>
              <span class="font-mono text-xs text-[var(--text-muted)]">{{ risk.value }}</span>
            </div>
          </div>
        </article>
      </section>
    </template>
  </div>
</template>
