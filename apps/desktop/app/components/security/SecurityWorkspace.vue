<script setup lang="ts">
import {
  AlertTriangle,
  Bot,
  Bug,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clipboard,
  Clock3,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileJson,
  FileSearch,
  FileText,
  FlaskConical,
  FolderOpen,
  Github,
  History,
  KeyRound,
  Loader2,
  LockKeyhole,
  PackageSearch,
  Plus,
  RotateCcw,
  Search,
  SearchCheck,
  Settings,
  ShieldCheck,
  ShieldMinus,
  ShieldX,
  Terminal,
  Trash2,
  TriangleAlert,
  X,
} from 'lucide-vue-next'
import { runCodexExec } from '~/composables/useCodexShell'
import { runClaudeExec } from '~/composables/useClaudeAI'
import { runOpenRouterChat } from '~/composables/useOpenRouterAI'
import { runOllamaChat } from '~/composables/useOllamaAI'
import type {
  ProjectMeta,
  SecurityFinding,
  SecurityFindingStatus,
  SecurityScan,
  SecurityScanEffort,
  SecurityScanFinding,
  SecuritySeverity,
} from '~/types/vindicta'
import { createVindicterSecurityDocx, createVindicterRawReportDocx, buildFixPromptsMarkdown, buildSecurityReviewMarkdown, buildRawReportMarkdown } from '~/utils/docx'

type SecurityAITool = 'codex' | 'claude' | 'openrouter' | 'ollama'
type SecurityWorkspaceTab = 'overview' | 'scanner' | 'findings' | 'whitelist' | 'dependencies' | 'secrets' | 'reports' | 'settings' | 'github_issues'
type ScanActivityStatus = 'pending' | 'running' | 'done' | 'warning' | 'error'

interface ParsedScanResult {
  summary: string
  findings: SecurityScanFinding[]
  raw: string
}

interface ScanActivityItem {
  id: string
  label: string
  detail: string
  status: ScanActivityStatus
}

interface DependencyInventoryItem {
  manifest: string
  name: string
  version: string
  type: string
}

interface ConfigCheck {
  label: string
  status: 'ok' | 'warning' | 'info'
  detail: string
}

const props = defineProps<{
  project: ProjectMeta
  tab: SecurityWorkspaceTab
}>()

const emit = defineEmits<{
  changeTab: [SecurityWorkspaceTab]
}>()

const security = useSecurityStore()
const feed = useNotificationFeedStore()
const aiActivity = useAIActivityStore()
const app = useAppStore()
const auth = useAuthStore()
const projects = useProjectsStore()
const { notify } = useNotifications()

const query = ref('')
const activeScanId = ref<string | null>(null)
const scanError = ref<string | null>(null)
const parseWarning = ref<string | null>(null)
const selectedAITool = ref<SecurityAITool>('codex')
const selectedScanEffort = ref<SecurityScanEffort>('medium')
const selectedFindingLimit = ref(10)
const metricsCollapsed = ref(false)
const showToolPicker = ref(false)
const showScopePicker = ref(false)
const showScanConfirm = ref(false)
const scopeScanAll = ref(true)
const scopeEntries = ref<{ path: string; name: string; isDir: boolean; depth: number; selected: boolean }[]>([])
const scopeLoading = ref(false)
const isGitRepo       = ref(false)
const gitBranches     = ref<string[]>([])
const gitCurrentBranch = ref<string | null>(null)
const selectedBranch  = ref<string | null>(null)
const aiScanRunning = ref(false)
const creatingRemediation = ref(false)
const exportingDocs = ref(false)
const showExportModal = ref(false)
const showExportFormatModal = ref(false)
const exportingFormat = ref<'review' | 'raw' | 'prompts' | null>(null)
const pendingExportType = ref<'review' | 'raw' | 'prompts' | null>(null)
const confirmClearFindings = ref(false)
const showHistoryDrawer    = ref(false)

// ── Finding validation ────────────────────────────────────────────────────────
interface ValidationResult {
  status: 'resolved' | 'present' | 'regressed' | 'new_issue'
  verdict: string
  evidence: string
  recommendation: string
  newFinding?: {
    title: string
    severity: string
    category: string
    area: string
    detail: string
    recommendation: string
  }
}
const showValidateModal = ref(false)
const validateFinding = ref<SecurityFinding | null>(null)
const validateAITool = ref<SecurityAITool>('codex')
const validateRunning = ref(false)
const validateResult = ref<ValidationResult | null>(null)
const validateError = ref('')

// ── AI tool availability (shared composable) ─────────────────────────────────
const { toolStatus: toolAvailability, checkAIToolAvailability } = useAIToolAvailability()

async function checkToolAvailability() {
  await checkAIToolAvailability()
  if (!toolAvailability[selectedAITool.value].available) {
    const first = (['codex', 'claude', 'openrouter', 'ollama'] as SecurityAITool[])
      .find(t => toolAvailability[t].available)
    if (first) selectedAITool.value = first
  }
}

// ── Project stack detection ───────────────────────────────────────────────────
const detectedStack = ref<Awaited<ReturnType<typeof detectProjectStack>>>([])

// ── OSS scanner state ─────────────────────────────────────────────────────────
interface OssToolStatus { name: string; status: 'idle' | 'running' | 'done' | 'skipped' | 'error'; count: number; error?: string }
const ossTools = ref<OssToolStatus[]>([
  { name: 'npm audit', status: 'idle', count: 0 },
  { name: 'Trivy', status: 'idle', count: 0 },
  { name: 'Semgrep', status: 'idle', count: 0 },
])
const ossRunning = ref(false)

const showGitHubIssueModal = ref(false)
const ghIssueFinding = ref<SecurityFinding | null>(null)
const ghIssueCreating = ref(false)
const ghIssueError = ref('')
const ghIssueCreatedUrl = ref('')

const ghRepoInput = ref(props.project.githubRepo ?? '')
const ghRepoSaving = ref(false)

watch(() => props.project.githubRepo, (v) => { ghRepoInput.value = v ?? '' })

async function saveGitHubRepo() {
  ghRepoSaving.value = true
  try {
    const githubRepo = ghRepoInput.value.trim() || null
    await projects.updateProjectMeta(props.project.id, { githubRepo })
    notify('GitHub repository saved.', 'success')
  } catch (e: any) {
    notify(e?.message ?? 'Could not save repository.', 'error')
  } finally {
    ghRepoSaving.value = false
  }
}

function openGitHubIssueModal(finding: SecurityFinding) {
  ghIssueFinding.value = finding
  ghIssueError.value = ''
  ghIssueCreatedUrl.value = ''
  showGitHubIssueModal.value = true
}

function parseGitHubRepo(repoUrl: string): { owner: string; repo: string } | null {
  const s = repoUrl.trim()
  // plain owner/repo
  const plain = s.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/)
  if (plain) return { owner: plain[1]!, repo: plain[2]! }
  // full https / ssh URL
  const url = s.match(/github\.com[/:]([^/]+)\/([^/.]+?)(?:\.git)?(?:[/#?].*)?$/)
  if (url) return { owner: url[1]!, repo: url[2]! }
  return null
}

async function submitGitHubIssue() {
  const finding = ghIssueFinding.value
  if (!finding) return

  const repoStr = props.project.githubRepo
  if (!repoStr) {
    ghIssueError.value = 'No GitHub repository linked to this project. Add one in project settings.'
    return
  }

  const parsed = parseGitHubRepo(repoStr)
  if (!parsed) {
    ghIssueError.value = 'Could not parse the linked GitHub repository URL.'
    return
  }

  ghIssueCreating.value = true
  ghIssueError.value = ''
  try {
    const severityLabel = finding.severity.charAt(0).toUpperCase() + finding.severity.slice(1)
    const body = [
      `**Severity:** ${severityLabel}`,
      `**Area:** ${finding.area}`,
      `**Category:** ${finding.category}`,
      '',
      '## Detail',
      finding.detail,
      ...(finding.evidence ? ['', '## Evidence', finding.evidence] : []),
      '',
      '## Recommendation',
      finding.recommendation,
      '',
      '---',
      '_Created by [Vindicter](https://github.com/Vindicter/vindicter) — AI-powered security platform_',
    ].join('\n')

    const result = await auth.createGitHubIssue({
      owner: parsed.owner,
      repo: parsed.repo,
      title: `[${severityLabel}] ${finding.title}`,
      body,
      labels: ['security', finding.severity],
    })
    ghIssueCreatedUrl.value = result.htmlUrl
    notify(`GitHub issue #${result.number} created.`, 'success')
    ghIssuesLoadedForRepo = null
    void loadGitHubIssues()
  } catch (e: any) {
    ghIssueError.value = e?.message ?? 'Failed to create GitHub issue.'
  } finally {
    ghIssueCreating.value = false
  }
}

async function clearAllFindingsConfirmed() {
  await security.clearAllFindings()
  confirmClearFindings.value = false
  notify('All findings cleared.', 'success')
}

function buildFixPrompt(finding: SecurityFinding): string {
  const lines: string[] = [
    `You are a security engineer. Fix the following security finding in this codebase.`,
    ``,
    `Finding: ${finding.title}`,
    `Severity: ${finding.severity.toUpperCase()}`,
    `Category: ${finding.category}`,
    `Affected area: ${finding.area}`,
  ]
  if (finding.detail) lines.push(``, `Description:`, finding.detail)
  if (finding.evidence) lines.push(``, `Evidence:`, finding.evidence)
  if (finding.recommendation) lines.push(``, `Recommended fix:`, finding.recommendation)
  lines.push(``, `Apply the minimum-scope fix needed to resolve this finding without breaking existing functionality. Explain what you changed and why.`)
  return lines.join('\n')
}

async function copyFixPrompt(finding: SecurityFinding) {
  await navigator.clipboard.writeText(buildFixPrompt(finding))
  notify('Fix prompt copied to clipboard.', 'success')
}

function openValidateModal(finding: SecurityFinding) {
  validateFinding.value = finding
  validateResult.value = null
  validateError.value = ''
  showValidateModal.value = true
}

function buildValidationPrompt(finding: SecurityFinding): string {
  return `You are a security validation agent for the project "${props.project.name}".

A security finding was previously identified. Inspect the codebase and determine whether it has been resolved, is still present, has regressed, or whether a new related issue has emerged.

Finding to validate:
  Title: ${finding.title}
  Severity: ${finding.severity.toUpperCase()}
  Category: ${finding.category}
  Affected area: ${finding.area}
  Description: ${finding.detail}
${finding.evidence ? `  Evidence: ${finding.evidence}\n` : ''}  Recommended fix: ${finding.recommendation}

Inspect the relevant source files, configuration, and logic paths. Look for:
- Evidence the fix described in the recommendation was applied
- Any remaining instances of the vulnerable pattern
- Any regression or new related vulnerability introduced by a fix attempt

Return ONLY valid JSON — no markdown fences, no extra text:
{
  "status": "resolved" | "present" | "regressed" | "new_issue",
  "verdict": "One concise sentence summarising what you found",
  "evidence": "Specific code paths, file locations, or patterns you observed",
  "recommendation": "Clear next action for the developer",
  "newFinding": {
    "title": "...",
    "severity": "critical|high|medium|low",
    "category": "...",
    "area": "...",
    "detail": "...",
    "recommendation": "..."
  }
}
Include "newFinding" only when status is "new_issue". Omit it otherwise.`
}

function parseValidationResponse(text: string): ValidationResult {
  const raw = parseJsonPayload(text) as Record<string, unknown>
  const status = ['resolved', 'present', 'regressed', 'new_issue'].includes(String(raw?.status))
    ? (raw.status as ValidationResult['status'])
    : 'present'
  return {
    status,
    verdict: stringValue(raw?.verdict, 'No verdict returned.'),
    evidence: stringValue(raw?.evidence, ''),
    recommendation: stringValue(raw?.recommendation, ''),
    newFinding: status === 'new_issue' && raw?.newFinding
      ? {
          title: stringValue((raw.newFinding as any)?.title, 'Untitled finding'),
          severity: stringValue((raw.newFinding as any)?.severity, 'medium'),
          category: stringValue((raw.newFinding as any)?.category, finding.category),
          area: stringValue((raw.newFinding as any)?.area, finding.area),
          detail: stringValue((raw.newFinding as any)?.detail, ''),
          recommendation: stringValue((raw.newFinding as any)?.recommendation, ''),
        }
      : undefined,
  }
}

async function runValidation() {
  const finding = validateFinding.value
  if (!finding || !props.project.absolutePath) return

  validateRunning.value = true
  validateResult.value = null
  validateError.value = ''

  const tool = validateAITool.value
  const prompt = buildValidationPrompt(finding)

  try {
    let responseText = ''

    if (tool === 'openrouter') {
      responseText = await runOpenRouterChat({
        apiKey: app.openRouter.apiKey,
        model: app.openRouter.model,
        messages: [
          { role: 'system', content: 'You are Vindicter, an AI security validator. Return only the JSON requested by the user.' },
          { role: 'user', content: prompt },
        ],
      })
    }
    else if (tool === 'ollama') {
      responseText = await runOllamaChat({
        url: app.ollama.url,
        model: app.ollama.model,
        messages: [
          { role: 'system', content: 'You are Vindicter, an AI security validator. Return only the JSON requested by the user.' },
          { role: 'user', content: prompt },
        ],
      })
    }
    else if (tool === 'claude') {
      const r = await runClaudeExec({ projectPath: props.project.absolutePath, prompt, model: 'Claude CLI default', reasoningEffort: 'medium' })
      responseText = [r.stdout, r.stderr].filter(Boolean).join('\n').trim()
    }
    else {
      const r = await runCodexExec({ projectPath: props.project.absolutePath, prompt, model: 'Codex CLI default', reasoningEffort: 'medium' })
      responseText = [r.stdout, r.stderr].filter(Boolean).join('\n').trim()
    }

    if (!responseText) throw new Error('AI returned no output.')
    validateResult.value = parseValidationResponse(responseText)
  }
  catch (e: any) {
    validateError.value = e?.message ?? 'Validation failed.'
  }
  finally {
    validateRunning.value = false
  }
}

async function applyValidationResolved() {
  const finding = validateFinding.value
  if (!finding) return
  await security.updateFindingStatus(finding.id, 'resolved')
  notify(`"${finding.title}" marked as resolved.`, 'success')
  showValidateModal.value = false
}

async function addValidationNewFinding() {
  const result = validateResult.value
  const finding = validateFinding.value
  if (!result?.newFinding || !finding) return
  const nf = result.newFinding
  await security.createRemediationItems(finding.scanId, [{
    id: `VAL-${Date.now()}`,
    title: nf.title,
    severity: normalizeSeverity(nf.severity),
    category: nf.category || finding.category,
    source: finding.source,
    area: nf.area || finding.area,
    detail: nf.detail,
    evidence: '',
    recommendation: nf.recommendation,
    selected: true,
  }])
  notify(`New finding "${nf.title}" added to remediation list.`, 'success')
  showValidateModal.value = false
}

const dependencyLoading = ref(false)
const secretsLoading = ref(false)

// ── Secrets pending review (not auto-saved) ───────────────────────────────────
interface PendingSecretFinding {
  id: string
  title: string
  severity: SecuritySeverity
  category: string
  area: string
  detail: string
  evidence: string
  recommendation: string
  selected: boolean
}
const pendingSecretFindings = ref<PendingSecretFinding[]>([])
const secretScanDone = ref(false)

// ── Env file viewer ───────────────────────────────────────────────────────────
interface EnvVar { key: string; value: string; redacted: boolean }
interface EnvFile { path: string; relPath: string; vars: EnvVar[] }
const envFiles = ref<EnvFile[]>([])
const envLoading = ref(false)
const redactAll = ref(true)

// ── Bulk selection ────────────────────────────────────────────────────────────
const selectedFindingIds = ref(new Set<string>())
const bulkActionStatus = ref<SecurityFindingStatus | ''>('')

function toggleFindingSelect(id: string) {
  const next = new Set(selectedFindingIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedFindingIds.value = next
}

function toggleSelectAll() {
  if (selectedFindingIds.value.size === filteredFindings.value.length) {
    selectedFindingIds.value = new Set()
  }
  else {
    selectedFindingIds.value = new Set(filteredFindings.value.map(f => f.id))
  }
}

async function applyBulkStatus() {
  if (!bulkActionStatus.value || !selectedFindingIds.value.size) return
  for (const id of selectedFindingIds.value) {
    await security.updateFindingStatus(id, bulkActionStatus.value as SecurityFindingStatus)
  }
  notify(`${selectedFindingIds.value.size} finding${selectedFindingIds.value.size !== 1 ? 's' : ''} updated to "${bulkActionStatus.value}".`, 'success')
  selectedFindingIds.value = new Set()
  bulkActionStatus.value = ''
}

async function applyBulkWhitelist() {
  let count = 0
  for (const id of selectedFindingIds.value) {
    const f = security.findings.find(x => x.id === id)
    if (f) {
      await security.addToWhitelist(f)
      count++
    }
  }
  notify(`${count} finding${count !== 1 ? 's' : ''} added to whitelist.`, 'success')
  selectedFindingIds.value = new Set()
}

function copyBulkFixPrompts() {
  const prompts = [...selectedFindingIds.value]
    .map(id => security.findings.find(f => f.id === id))
    .filter(Boolean)
    .map(f => buildFixPrompt(f!))
    .join('\n\n---\n\n')
  navigator.clipboard.writeText(prompts)
  notify(`${selectedFindingIds.value.size} fix prompt${selectedFindingIds.value.size !== 1 ? 's' : ''} copied.`, 'success')
  selectedFindingIds.value = new Set()
}
const dependencyInventory = ref<DependencyInventoryItem[]>([])
const configChecks = ref<ConfigCheck[]>([])
const reportSection = ref<HTMLElement | null>(null)
const scanStartedAt = ref<string | null>(null)
const scanElapsedSeconds = ref(0)
const activeScanStage = ref(0)
const scanActivity = ref<ScanActivityItem[]>([])
let scanActivityTimer: ReturnType<typeof setInterval> | null = null
let scanCheckpointTimer: ReturnType<typeof setInterval> | null = null
let activeSecurityJobId: string | null = null
let autoScanStartedForProject: string | null = null

async function cancelScan() {
  const { abortAllScans } = await import('~/composables/useScanAbort')
  abortAllScans()
}

function startScanCheckpoint() {
  stopScanCheckpoint()
  scanCheckpointTimer = setInterval(() => {
    security.persist().catch(() => {})
  }, 30_000)
}

function stopScanCheckpoint() {
  if (scanCheckpointTimer !== null) {
    clearInterval(scanCheckpointTimer)
    scanCheckpointTimer = null
  }
}

interface GitHubIssue {
  number: number
  title: string
  body: string | null
  state: 'open' | 'closed'
  htmlUrl: string
  createdAt: string
  updatedAt: string
  labels: { name: string; color: string }[]
  user: { login: string; avatarUrl: string } | null
}

const ghIssues = ref<GitHubIssue[]>([])
const ghIssuesLoading = ref(false)
const ghIssuesError = ref('')
const ghIssuesFilter = ref<'open' | 'closed' | 'all'>('open')
let ghIssuesLoadedForRepo: string | null = null

const filteredGhIssues = computed(() => {
  if (ghIssuesFilter.value === 'all') return ghIssues.value
  return ghIssues.value.filter(issue => issue.state === ghIssuesFilter.value)
})

async function loadGitHubIssues(force = false) {
  const repoUrl = props.project.githubRepo
  if (!repoUrl || !auth.githubToken) return

  if (!force && ghIssuesLoadedForRepo === repoUrl) return
  ghIssuesLoading.value = true
  ghIssuesError.value = ''
  try {
    const parsed = parseGitHubRepo(repoUrl)
    if (!parsed) throw new Error('Could not parse the linked GitHub repository URL.')
    const { owner, repo } = parsed
    const resp = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues?state=all&per_page=100`, {
      headers: {
        Authorization: `Bearer ${auth.githubToken}`,
        Accept: 'application/vnd.github+json',
      },
    })
    if (!resp.ok) {
      const msg = (await resp.json().catch(() => null) as Record<string, unknown> | null)?.message
      throw new Error(typeof msg === 'string' ? msg : `GitHub API error: ${resp.status}`)
    }
    const data = await resp.json() as Record<string, unknown>[]
    ghIssues.value = data
      .filter(item => !item.pull_request)
      .map(item => ({
        number: item.number as number,
        title: item.title as string,
        body: (item.body as string | null) ?? null,
        state: item.state as 'open' | 'closed',
        htmlUrl: item.html_url as string,
        createdAt: item.created_at as string,
        updatedAt: item.updated_at as string,
        labels: ((item.labels ?? []) as Record<string, unknown>[]).map(l => ({
          name: l.name as string,
          color: l.color as string,
        })),
        user: item.user ? {
          login: (item.user as Record<string, unknown>).login as string,
          avatarUrl: (item.user as Record<string, unknown>).avatar_url as string,
        } : null,
      }))
    ghIssuesLoadedForRepo = repoUrl
  } catch (e: any) {
    ghIssuesError.value = e?.message ?? 'Failed to load GitHub issues.'
  } finally {
    ghIssuesLoading.value = false
  }
}

function securityToolLabel(tool: SecurityAITool) {
  if (tool === 'claude') return 'Claude'
  if (tool === 'openrouter') return 'OpenRouter'
  if (tool === 'ollama') return 'Ollama'
  return 'Codex'
}

function securityToolAccentClass(tool: SecurityAITool) {
  if (tool === 'claude') return 'text-violet-300'
  if (tool === 'openrouter') return 'text-sky-300'
  if (tool === 'ollama') return 'text-orange-300'
  return 'text-emerald-300'
}

function securityToolRunButtonClass(tool: SecurityAITool) {
  if (tool === 'claude') return 'bg-violet-600 hover:bg-violet-500'
  if (tool === 'openrouter') return 'bg-sky-600 hover:bg-sky-500'
  if (tool === 'ollama') return 'bg-orange-600 hover:bg-orange-500'
  return 'bg-emerald-600 hover:bg-emerald-500'
}

function buildScanStageTemplates(tool: SecurityAITool) {
  const toolLabel = securityToolLabel(tool)
  const launchDetail = (tool === 'openrouter' || tool === 'ollama')
    ? `Sending the read-only security prompt to the configured ${toolLabel} model.`
    : `Launching ${toolLabel} CLI in read-only mode for the selected project.`
  return [
    { id: 'scope', label: 'Preparing scan scope', detail: 'Building a read-only security prompt for OWASP, configuration, dependency, secret, API, and desktop security review.' },
    { id: 'launch', label: `Starting ${toolLabel}`, detail: launchDetail },
    { id: 'inspect', label: 'Inspecting project files', detail: 'Reviewing source, configuration, auth boundaries, shell usage, data access, and local trust boundaries.' },
    { id: 'risk-map', label: 'Mapping risks', detail: 'Grouping concrete issues by severity, abuse path, evidence, and risk family.' },
    { id: 'parse', label: 'Parsing results', detail: `Converting the ${toolLabel} report into selectable remediation-ready security findings.` },
  ]
}
const scanStageTemplates = computed(() => buildScanStageTemplates(selectedAITool.value))

const scanEffortOptions: { value: SecurityScanEffort; label: string; detail: string; focus: string; tokenNote: string }[] = [
  {
    value: 'low',
    label: 'Quick',
    detail: 'Fast pass for obvious high-signal risks.',
    focus: 'Inspect only the most security-sensitive entry points and configuration. Prefer obvious, high-confidence issues over exhaustive coverage.',
    tokenNote: 'Lowest token use',
  },
  {
    value: 'medium',
    label: 'Balanced',
    detail: 'Default review depth for normal project checks.',
    focus: 'Review core source, configuration, API boundaries, dependency risk, desktop app permissions, and frontend trust boundaries with balanced depth.',
    tokenNote: 'Moderate token use',
  },
  {
    value: 'high',
    label: 'Deep',
    detail: 'Broader review for release or audit prep.',
    focus: 'Perform a deeper review across security-sensitive flows, cross-file interactions, auth boundaries, persistence, shell usage, dependencies, secrets handling, and configuration.',
    tokenNote: 'Highest token use',
  },
]

const severityClasses: Record<SecuritySeverity, string> = {
  critical: 'border-red-500/30 bg-red-500/10 text-red-300',
  high: 'border-orange-500/25 bg-orange-500/10 text-orange-300',
  medium: 'border-amber-500/25 bg-amber-500/10 text-amber-300',
  low: 'border-sky-500/25 bg-sky-500/10 text-sky-300',
}

const statusClasses: Record<SecurityFindingStatus, string> = {
  open: 'border-red-500/20 bg-red-500/10 text-red-300',
  triaged: 'border-indigo-500/20 bg-indigo-500/10 text-indigo-300',
  in_progress: 'border-sky-500/20 bg-sky-500/10 text-sky-300',
  resolved: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
  ignored: 'border-white/10 bg-white/[0.04] text-[var(--text-muted)]',
}

const scanActivityClasses: Record<ScanActivityStatus, string> = {
  pending: 'border-white/10 bg-white/[0.03] text-[var(--text-faint)]',
  running: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
  done: 'border-indigo-500/20 bg-indigo-500/10 text-indigo-200',
  warning: 'border-amber-500/25 bg-amber-500/10 text-amber-200',
  error: 'border-red-500/25 bg-red-500/10 text-red-200',
}

const statusOptions: SecurityFindingStatus[] = ['open', 'triaged', 'in_progress', 'resolved', 'ignored']
const selectedEffortOption = computed(() => scanEffortOptions.find(option => option.value === selectedScanEffort.value) ?? scanEffortOptions[1]!)
const normalizedFindingLimit = computed(() => Math.max(0, Math.min(50, Math.floor(Number(selectedFindingLimit.value) || 0))))
const selectedAIToolLabel = computed(() => securityToolLabel(selectedAITool.value))
const canUseSelectedAITool = computed(() => {
  if (selectedAITool.value === 'openrouter') return app.openRouter.enabled && Boolean(app.openRouter.apiKey.trim())
  if (selectedAITool.value === 'ollama') return app.ollama.enabled && Boolean(app.ollama.url.trim())
  return true
})
const latestScan = computed(() => security.latestScan)
const activeScan = computed(() => security.scans.find(scan => scan.id === activeScanId.value) ?? latestScan.value)
const scanFindings = computed(() => activeScan.value?.findings ?? [])
const selectedScanFindings = computed(() => scanFindings.value.filter(finding => finding.selected))
const remediatedTitles = computed(() => new Set(security.findings.map(f => f.title.trim().toLowerCase())))
const whitelistedTitles = computed(() => new Set(security.whitelist.map(w => `${w.title.trim().toLowerCase()}||${w.category.trim().toLowerCase()}`)))
function isAlreadyRemediated(finding: SecurityScanFinding) {
  return remediatedTitles.value.has(finding.title.trim().toLowerCase())
}
function isAlreadyWhitelisted(finding: SecurityScanFinding) {
  return Boolean(finding.whitelisted) || whitelistedTitles.value.has(`${finding.title.trim().toLowerCase()}||${finding.category.trim().toLowerCase()}`)
}
const canRunAIScan = computed(() => Boolean(props.project.absolutePath) && !aiScanRunning.value && canUseSelectedAITool.value)
const canExportDocs = computed(() => Boolean(activeScan.value || security.findings.length) && !exportingDocs.value)
const formattedLastScan = computed(() => latestScan.value ? new Date(latestScan.value.scannedAt).toLocaleString() : 'Not run')
const highRiskScans = computed(() => scanFindings.value.filter(finding => finding.severity === 'critical' || finding.severity === 'high').length)
const filteredFindings = computed(() => {
  const text = query.value.trim().toLowerCase()
  if (!text) return security.findings
  return security.findings.filter(finding =>
    [
      finding.title,
      finding.area,
      finding.severity,
      finding.status,
      finding.detail,
      finding.category,
      finding.source,
    ].some(value => String(value).toLowerCase().includes(text)),
  )
})
const filteredScanFindings = computed(() => {
  const text = query.value.trim().toLowerCase()
  if (!text) return scanFindings.value
  return scanFindings.value.filter(finding =>
    [finding.title, finding.area, finding.severity, finding.detail, finding.category].some(value => value.toLowerCase().includes(text)),
  )
})
const scanElapsedLabel = computed(() => {
  const minutes = Math.floor(scanElapsedSeconds.value / 60)
  const seconds = scanElapsedSeconds.value % 60
  return minutes ? `${minutes}m ${String(seconds).padStart(2, '0')}s` : `${seconds}s`
})
const scanStatusText = computed(() => {
  if (aiScanRunning.value) return scanActivity.value[activeScanStage.value]?.label ?? 'Scanning'
  if (parseWarning.value) return 'Scan completed with parser warning'
  if (scanError.value) return 'Scan failed'
  if (latestScan.value) return 'Scan complete'
  return 'Idle'
})
const dependencyCount = computed(() => dependencyInventory.value.length)
const secretFindings = computed(() => security.secretFindings)
const dependencyFindings = computed(() => security.dependencyFindings)

onMounted(async () => {
  if (typeof localStorage !== 'undefined') {
    metricsCollapsed.value = localStorage.getItem('vindicter-security-metrics-collapsed') === 'true'
  }
  await initializeWorkspace()
  checkStaleFindings()
})

function checkStaleFindings() {
  const key = `vindicter:stale-notif:${props.project.id}`
  const lastNotified = Number(localStorage.getItem(key) ?? 0)
  if (Date.now() - lastNotified < 24 * 60 * 60 * 1000) return
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
  const stale = security.findings.filter(f =>
    (f.status === 'open' || f.status === 'in_progress' || f.status === 'triaged')
    && new Date(f.updatedAt).getTime() < cutoff,
  )
  if (!stale.length) return
  const high = stale.filter(f => f.severity === 'critical' || f.severity === 'high').length
  feed.push({
    category: 'finding_stale',
    title: `${stale.length} finding${stale.length === 1 ? '' : 's'} stale in ${props.project.name}`,
    body: `${stale.length} open finding${stale.length === 1 ? '' : 's'} haven't been updated in over 7 days${high ? ` (${high} high/critical)` : ''}.`,
    link: '/notifications',
    meta: { projectId: props.project.id },
  })
  localStorage.setItem(key, String(Date.now()))
}

watch(() => props.project.id, async () => {
  await initializeWorkspace()
})

watch(() => props.tab, async (tab) => {
  if ((tab as string) === 'history') {
    // History is now a drawer inside the scanner tab
    showHistoryDrawer.value = true
    emit('changeTab', 'scanner')
    return
  }
  if (tab === 'dependencies' && !dependencyLoading.value && !dependencyInventory.value.length) {
    await scanDependencies(false)
  }
  if (tab === 'github_issues') {
    await loadGitHubIssues()
  }
})

watch(() => aiActivity.jobs, () => {
  restoreActiveSecurityJob()
}, { deep: true })

watch(metricsCollapsed, (value) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('vindicter-security-metrics-collapsed', String(value))
  }
})

onUnmounted(() => {
  stopScanActivityTimer()
})

async function detectAndSaveGitHubRepo() {
  if (props.project.githubRepo || !props.project.absolutePath) return
  try {
    const fs = useTauriFs()
    const sep = props.project.absolutePath.includes('\\') ? '\\' : '/'
    const gitConfigPath = `${props.project.absolutePath}${sep}.git${sep}config`
    const text = await fs.readTextFile(gitConfigPath).catch(() => '')
    if (!text) return
    const urlMatch = text.match(/\[remote\s+"origin"\][^\[]*url\s*=\s*([^\r\n]+)/s)
    if (!urlMatch) return
    const rawUrl = urlMatch[1]!.trim()
    const ghMatch = rawUrl.match(/github\.com[/:]([^/]+)\/([^/.]+?)(?:\.git)?$/)
    if (!ghMatch) return
    const repoSlug = `${ghMatch[1]}/${ghMatch[2]}`
    await projects.updateProjectMeta(props.project.id, { githubRepo: repoSlug })
  } catch { /* git config unreadable — not a git repo or no origin */ }
}

async function initializeWorkspace() {
  await aiActivity.load()
  await security.load(props.project.absolutePath, props.project.id)
  activeScanId.value = security.latestScan?.id ?? null
  selectedFindingLimit.value = security.settings.aiFindingLimit
  restoreActiveSecurityJob()
  void detectAndSaveGitHubRepo()
  await Promise.allSettled([scanDependencies(false), scanConfig()])
  if (props.project.absolutePath) {
    detectedStack.value = await detectProjectStack(props.project.absolutePath).catch(() => [])
  }
}

function hasRunningSecurityJob() {
  return aiActivity.jobs.some(job =>
    job.kind === 'security-scan'
    && job.projectId === props.project.id
    && (job.status === 'running' || job.status === 'pending'),
  )
}

function openAIScanPicker() {
  scanError.value = null
  selectedAITool.value = 'codex'
  showToolPicker.value = true
  void checkToolAvailability()
}

async function openScopePicker() {
  showToolPicker.value = false
  scopeScanAll.value = true
  scopeEntries.value = []
  showScopePicker.value = true
  await Promise.all([loadScopeTree(), loadGitBranches()])
}

async function loadGitBranches() {
  isGitRepo.value    = false
  gitBranches.value  = []
  gitCurrentBranch.value = null
  selectedBranch.value   = null
  if (!props.project.absolutePath) return
  const fs  = useTauriFs()
  const sep = props.project.absolutePath.includes('\\') ? '\\' : '/'
  const gitDir = props.project.absolutePath + sep + '.git'
  const headFile = gitDir + sep + 'HEAD'
  const exists = await fs.exists(headFile).catch(() => false)
  if (!exists) return
  isGitRepo.value = true
  const headContent = await fs.readTextFile(headFile).catch(() => '')
  const branchMatch = headContent.trim().match(/^ref: refs\/heads\/(.+)$/)
  if (branchMatch) {
    gitCurrentBranch.value = branchMatch[1]!
    selectedBranch.value   = branchMatch[1]!
  }
  const headsDir = gitDir + sep + 'refs' + sep + 'heads'
  const headsDirExists = await fs.exists(headsDir).catch(() => false)
  if (headsDirExists) {
    const items = await fs.readDir(headsDir).catch(() => [] as { name: string; isDir: boolean }[])
    gitBranches.value = items.filter(i => !i.isDir).map(i => i.name).sort()
    if (!selectedBranch.value && gitBranches.value.length) {
      selectedBranch.value = gitBranches.value[0]!
    }
  }
}

async function loadScopeTree() {
  if (!props.project.absolutePath) return
  scopeLoading.value = true
  const fs = useTauriFs()
  const ignored = new Set(['.git', 'node_modules', 'dist', '.nuxt', '.output', 'target', 'build', '.cache', 'bin', 'obj', '__pycache__', '.venv', 'venv'])
  const entries: typeof scopeEntries.value = []

  async function collect(dir: string, depth: number) {
    if (depth > 2) return
    const items = await fs.readDir(dir).catch(() => [])
    for (const item of items) {
      if (ignored.has(item.name)) continue
      entries.push({ path: item.path, name: item.name, isDir: item.isDir, depth, selected: true })
      if (item.isDir && depth < 2) await collect(item.path, depth + 1)
    }
  }

  await collect(props.project.absolutePath, 0)
  scopeEntries.value = entries
  scopeLoading.value = false
}

function buildScopeConstraint(): string {
  const parts: string[] = []
  if (isGitRepo.value && selectedBranch.value) {
    parts.push(`\n\nGit context — this scan targets the \`${selectedBranch.value}\` branch.`)
  }
  if (!scopeScanAll.value) {
    const sep = props.project.absolutePath.includes('\\') ? '\\' : '/'
    const base = props.project.absolutePath
    const selected = scopeEntries.value
      .filter(e => e.selected && e.depth === 0)
      .map(e => e.path.replace(base + sep, '').replace(base + '/', ''))
    if (selected.length) {
      parts.push(`\n\nScope constraint — focus ONLY on these paths:\n${selected.map(p => `- ${p}`).join('\n')}\nIgnore everything else unless it is a direct dependency of the scoped paths.`)
    }
  }
  return parts.join('')
}

function toggleScopeParent(entry: { path: string; isDir: boolean; depth: number; selected: boolean }) {
  const newVal = !entry.selected
  entry.selected = newVal
  if (entry.isDir) {
    const prefix1 = entry.path + '/'
    const prefix2 = entry.path + '\\'
    for (const child of scopeEntries.value) {
      if (child.path.startsWith(prefix1) || child.path.startsWith(prefix2)) {
        child.selected = newVal
      }
    }
  }
}

function scrollToReport() {
  reportSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function stopScanActivityTimer() {
  if (!scanActivityTimer) return
  clearInterval(scanActivityTimer)
  scanActivityTimer = null
}

function activityStatusForScan(status: string): ScanActivityStatus {
  if (status === 'pending' || status === 'running' || status === 'done' || status === 'warning' || status === 'error') return status
  return 'warning'
}

function startElapsedTimer(startedAt: string) {
  stopScanActivityTimer()
  scanElapsedSeconds.value = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000))
  scanActivityTimer = setInterval(() => {
    scanElapsedSeconds.value = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000))
  }, 1000)
}

function restoreActiveSecurityJob() {
  const job = aiActivity.jobs.find(item =>
    item.kind === 'security-scan'
    && item.projectId === props.project.id
    && (item.status === 'running' || item.status === 'pending')
  )
  if (!job) {
    const finished = activeSecurityJobId
      ? aiActivity.jobs.find(item => item.id === activeSecurityJobId)
      : null
    if (finished && finished.kind === 'security-scan' && finished.status !== 'running' && finished.status !== 'pending') {
      aiScanRunning.value = false
      stopScanActivityTimer()
      scanError.value = finished.status === 'error' ? finished.error || finished.summary : null
    }
    return
  }

  const shouldRestartTimer = activeSecurityJobId !== job.id
  activeSecurityJobId = job.id
  aiScanRunning.value = true
  scanStartedAt.value = job.startedAt
  scanError.value = null
  parseWarning.value = null
  scanActivity.value = job.events
    .slice()
    .reverse()
    .map(event => ({
      id: event.id,
      label: event.label,
      detail: event.detail,
      status: activityStatusForScan(event.status),
    }))
  activeScanStage.value = Math.max(0, scanActivity.value.findIndex(item => item.status === 'running'))
  if (shouldRestartTimer || !scanActivityTimer) startElapsedTimer(job.startedAt)
}

function setScanStage(index: number, status: ScanActivityStatus = 'running') {
  const previousStage = activeScanStage.value
  activeScanStage.value = Math.min(index, scanActivity.value.length - 1)
  scanActivity.value = scanActivity.value.map((item, itemIndex) => ({
    ...item,
    status: itemIndex < activeScanStage.value ? 'done' : itemIndex === activeScanStage.value ? status : 'pending',
  }))
  const activeItem = scanActivity.value[activeScanStage.value]
  if (activeSecurityJobId && activeItem && (previousStage !== activeScanStage.value || status !== 'running')) {
    aiActivity.addEvent(activeSecurityJobId, activeItem.label, activeItem.detail, status)
  }
}

function beginScanActivity(effort: typeof scanEffortOptions[number], tool: SecurityAITool) {
  stopScanActivityTimer()
  scanStartedAt.value = new Date().toISOString()
  scanElapsedSeconds.value = 0
  activeScanStage.value = 0
  const stages = buildScanStageTemplates(tool)
  scanActivity.value = stages.map((stage, index) => ({
    ...stage,
    status: index === 0 ? 'running' : 'pending',
  }))
  activeSecurityJobId = aiActivity.startJob({
    kind: 'security-scan',
    title: `Security scan: ${props.project.name}`,
    projectId: props.project.id,
    projectName: props.project.name,
    projectPath: props.project.absolutePath,
    tool,
    effort: effort.value,
    firstStep: stages[0]?.label,
    firstDetail: stages[0]?.detail,
  })

  scanActivityTimer = setInterval(() => {
    scanElapsedSeconds.value += 1
    if (scanElapsedSeconds.value >= 3 && activeScanStage.value < 1) setScanStage(1)
    if (scanElapsedSeconds.value >= 8 && activeScanStage.value < 2) setScanStage(2)
    if (scanElapsedSeconds.value >= 16 && activeScanStage.value < 3) setScanStage(3)
  }, 1000)
}

function finishScanActivity(status: ScanActivityStatus, detail?: string, output?: string) {
  stopScanActivityTimer()
  const finalStageIndex = scanActivity.value.length - 1
  activeScanStage.value = finalStageIndex
  scanActivity.value = scanActivity.value.map((item, index) => ({
    ...item,
    detail: index === finalStageIndex && detail ? detail : item.detail,
    status: index < finalStageIndex ? 'done' : status,
  }))
  aiActivity.finishJob(activeSecurityJobId, status, detail ?? scanActivity.value[finalStageIndex]?.detail ?? 'Security scan finished.', output)
  activeSecurityJobId = null
}

function buildExistingSecurityContext() {
  const persisted = security.findings
    .slice()
    .sort((a, b) => b.number - a.number)
    .slice(0, 40)
    .map(finding => `#${finding.number} [${finding.status}/${finding.severity}/${finding.source}] ${finding.title}; area: ${finding.area}; category: ${finding.category}; detail: ${finding.detail.replace(/\s+/g, ' ').slice(0, 220)}`)

  const lines: string[] = []
  if (persisted.length) {
    lines.push('Existing security remediation items for duplicate avoidance:')
    lines.push(...persisted)
  } else {
    lines.push('No existing security remediation items were loaded.')
  }

  const whitelist = security.whitelist
  if (whitelist.length) {
    lines.push('')
    lines.push('Whitelisted/suppressed findings — do NOT report these even if found:')
    whitelist.forEach(w => lines.push(`- [${w.category}] ${w.title} (area: ${w.area})`))
  }

  return lines.join('\n')
}

function whitelistFinding(finding: SecurityScanFinding) {
  void security.addToWhitelist(finding)
  notify(`"${finding.title}" added to whitelist. AI will skip this in future scans.`, 'success')
}

function buildSecurityScanPrompt(projectName: string, existingFindingContext: string, effort: typeof scanEffortOptions[number], findingLimit: number) {
  const limitInstruction = findingLimit > 0
    ? `Return at most ${findingLimit} findings. Prioritize concrete, exploitable risks with specific evidence. Avoid broad speculation.`
    : 'Return every concrete, exploitable risk you can substantiate with specific evidence. Avoid broad speculation.'

  return `You are running a read-only security review for the project "${projectName}".

Do not edit files. Inspect the application source and configuration for concrete, abusable security risks.

Effort level: ${effort.label} (${effort.value})
Effort instructions: ${effort.focus}
${limitInstruction}

Scope:
- OWASP Top 10 style issues, especially injection, broken access control, auth/session mistakes, insecure configuration, SSRF/path traversal, unsafe deserialization, vulnerable dependency patterns, and secrets handling.
- Desktop app risks such as shell execution, filesystem permissions, command argument handling, and unsafe local privilege boundaries.
- API/backend risks such as tenant isolation, authorization checks, input validation, CORS, and persistence boundaries.
- Frontend risks such as unsafe HTML rendering, token exposure, secret leakage, and trust boundary mistakes.

Ignore generated or vendored artifacts unless they create a project risk: node_modules, dist, .nuxt, .output, target, build output, and lockfile noise.

Existing security remediation items for duplicate avoidance:
${existingFindingContext}

Before returning a finding, compare it against the existing remediation items above. Do not return findings that substantially duplicate an existing item title, affected area, evidence, or remediation work.

Return ONLY valid JSON with this exact shape and no markdown fences:
{
  "summary": "1-3 sentence executive summary.",
  "findings": [
    {
      "id": "AI-SEC-001",
      "title": "Short finding title",
      "area": "File or subsystem",
      "severity": "critical|high|medium|low",
      "category": "OWASP category or risk family",
      "detail": "What is wrong and how it could be abused.",
      "evidence": "Specific files, functions, or code paths reviewed.",
      "recommendation": "Concrete remediation steps."
    }
  ]
}

If no concrete issues are found, return an empty findings array with a brief summary.`
}

function stringValue(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function normalizeSeverity(value: unknown): SecuritySeverity {
  const text = String(value ?? '').toLowerCase()
  if (text === 'critical' || text === 'high' || text === 'medium' || text === 'low') return text
  return 'medium'
}

function stripJsonFence(value: string) {
  return value.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
}

function findBalancedJson(value: string, start: number) {
  const opening = value[start]
  const closing = opening === '{' ? '}' : opening === '[' ? ']' : ''
  if (!closing) return null
  const stack = [closing]
  let inString = false
  let escaped = false
  for (let i = start + 1; i < value.length; i += 1) {
    const char = value[i]
    if (escaped) {
      escaped = false
      continue
    }
    if (char === '\\') {
      escaped = inString
      continue
    }
    if (char === '"') {
      inString = !inString
      continue
    }
    if (inString) continue
    if (char === '{') stack.push('}')
    else if (char === '[') stack.push(']')
    else if (char === stack[stack.length - 1]) {
      stack.pop()
      if (!stack.length) return value.slice(start, i + 1)
    }
  }
  return null
}

function parseJsonPayload(text: string): unknown {
  const trimmed = stripJsonFence(text)
  try {
    return JSON.parse(trimmed)
  }
  catch {
    const fencedBlocks = [...trimmed.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)]
      .map(match => stripJsonFence(match[1] ?? ''))
    for (const candidate of fencedBlocks) {
      try {
        return JSON.parse(candidate)
      }
      catch { /* keep looking */ }
    }
    for (let i = 0; i < trimmed.length; i += 1) {
      if (trimmed[i] !== '{' && trimmed[i] !== '[') continue
      const candidate = findBalancedJson(trimmed, i)
      if (!candidate) continue
      try {
        return JSON.parse(candidate)
      }
      catch { /* keep looking */ }
    }
    throw new Error('No valid JSON object or array found in AI response')
  }
}

function parseAiScanResponse(text: string): ParsedScanResult {
  const parsed = parseJsonPayload(text) as Record<string, unknown>
  const items = Array.isArray(parsed) ? parsed : Array.isArray(parsed.findings) ? parsed.findings : []
  const findings = items.map((item, index) => {
    const value = item as Record<string, unknown>
    const evidence = Array.isArray(value.evidence)
      ? value.evidence.map(entry => String(entry)).join('\n')
      : stringValue(value.evidence)

    return {
      id: stringValue(value.id, `AI-SEC-${String(index + 1).padStart(3, '0')}`),
      title: stringValue(value.title, 'Untitled security finding'),
      area: stringValue(value.area, 'Project'),
      severity: normalizeSeverity(value.severity),
      category: stringValue(value.category ?? value.owaspCategory, 'Security review'),
      source: 'ai_review' as const,
      detail: stringValue(value.detail, 'The AI scan did not include a detailed explanation.'),
      recommendation: stringValue(value.recommendation, 'Review the referenced code path and add a remediation plan.'),
      evidence,
      selected: true,
    }
  })

  return {
    summary: Array.isArray(parsed) ? '' : stringValue(parsed.summary),
    findings,
    raw: text,
  }
}

// ── OSS Security Scanner functions ───────────────────────────────────────────

function ossToolStatusClass(tool: OssToolStatus) {
  if (tool.status === 'done') return tool.count > 0 ? 'text-amber-300' : 'text-emerald-300'
  if (tool.status === 'running') return 'text-sky-300'
  if (tool.status === 'error') return 'text-red-400'
  if (tool.status === 'skipped') return 'text-[var(--text-faint)]'
  return 'text-[var(--text-faint)]'
}

function ossToolStatusLabel(tool: OssToolStatus) {
  if (tool.status === 'running') return 'Scanning…'
  if (tool.status === 'done') return tool.count > 0 ? `${tool.count} finding${tool.count !== 1 ? 's' : ''}` : 'Clean'
  if (tool.status === 'error') return 'Error'
  if (tool.status === 'skipped') return 'Not available'
  return 'Idle'
}

function normalizeSeverityOss(raw: string): SecuritySeverity {
  const s = raw.toLowerCase()
  if (s === 'critical') return 'critical'
  if (s === 'high' || s === 'error') return 'high'
  if (s === 'moderate' || s === 'medium' || s === 'warning') return 'medium'
  return 'low'
}

async function runNpmAuditScan(projectPath: string): Promise<SecurityScanFinding[]> {
  const fs = useTauriFs()
  const sep = projectPath.includes('\\') ? '\\' : '/'
  const hasPackageJson = await fs.exists(`${projectPath}${sep}package.json`).catch(() => false)
  if (!hasPackageJson) return []

  const { Command } = await import('@tauri-apps/plugin-shell')
  const isWin = typeof navigator !== 'undefined' && /Windows/i.test(navigator.userAgent)
  const cmdName = isWin ? 'npm-cmd-audit' : 'npm-audit'

  let stdout = '', stderr = ''
  try {
    const res = await Command.create(cmdName, ['audit', '--json', '--prefix', projectPath]).execute()
    stdout = res.stdout; stderr = res.stderr
  } catch { return [] }

  const text = (stdout || stderr).trim()
  if (!text) return []

  let parsed: any
  try {
    const start = text.indexOf('{')
    if (start < 0) return []
    parsed = JSON.parse(text.slice(start))
  } catch { return [] }

  const vulns: Record<string, any> = parsed?.vulnerabilities ?? {}
  const severityOrder = ['critical', 'high', 'moderate', 'low', 'info']
  const entries = Object.values(vulns)
    .sort((a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity))
    .slice(0, 15)

  return entries.map((v: any) => {
    const via = Array.isArray(v.via) ? v.via.filter((x: any) => typeof x === 'object') : []
    const cves: string[] = via.flatMap((x: any) => x.cves ?? [])
    const cveStr = cves.length ? ` (${cves.slice(0, 3).join(', ')})` : ''
    const detail = via[0]?.overview ?? `${v.name} has a known ${v.severity} vulnerability.`
    return {
      id: `NPM-${String(v.name).replace(/[^a-zA-Z0-9]/g, '-').toUpperCase().slice(0, 18)}`,
      title: `${String(v.severity).toUpperCase()}: ${v.name}${cveStr}`,
      severity: normalizeSeverityOss(v.severity),
      category: 'Vulnerable and outdated components',
      source: 'dependency' as const,
      area: `npm · ${v.name}@${v.range ?? 'unknown'}`,
      detail,
      evidence: `${v.name} range ${v.range ?? '?'}${cveStr}. Fix available: ${v.fixAvailable ? 'yes' : 'no'}.`,
      recommendation: v.fixAvailable === true
        ? `Run \`npm audit fix\` to upgrade ${v.name} to a patched version.`
        : `Manually upgrade or replace ${v.name}. No automated fix is available.`,
      selected: true,
    } satisfies SecurityScanFinding
  })
}

async function runTrivyScan(projectPath: string): Promise<SecurityScanFinding[]> {
  const { Command } = await import('@tauri-apps/plugin-shell')
  try { await Command.create('trivy-version', ['--version']).execute() } catch { return [] }

  let stdout = '', stderr = ''
  try {
    const res = await Command.create('trivy-fs-scan', ['fs', '--format', 'json', '--quiet', '--no-progress', projectPath]).execute()
    stdout = res.stdout; stderr = res.stderr
  } catch { return [] }

  let parsed: any
  try { parsed = JSON.parse((stdout || stderr).trim()) } catch { return [] }

  const trivyResults: any[] = parsed?.Results ?? parsed?.results ?? []
  const allVulns: Array<{ v: any; target: string }> = []
  for (const r of trivyResults) {
    for (const v of (r.Vulnerabilities ?? r.vulnerabilities ?? [])) {
      allVulns.push({ v, target: r.Target ?? 'unknown' })
    }
  }

  const sevOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'UNKNOWN']
  allVulns.sort((a, b) => sevOrder.indexOf(a.v.Severity?.toUpperCase() ?? '') - sevOrder.indexOf(b.v.Severity?.toUpperCase() ?? ''))

  const seen = new Set<string>()
  const findings: SecurityScanFinding[] = []
  for (const { v, target } of allVulns) {
    const key = `${v.PkgName}@${v.VulnerabilityID}`
    if (seen.has(key) || findings.length >= 15) continue
    seen.add(key)
    findings.push({
      id: `TRIVY-${String(v.VulnerabilityID ?? v.PkgName).replace(/[^a-zA-Z0-9]/g, '-').slice(0, 18)}`,
      title: `${v.Severity ?? 'UNKNOWN'}: ${v.VulnerabilityID ?? 'CVE'} in ${v.PkgName}`,
      severity: normalizeSeverityOss(v.Severity ?? 'low'),
      category: 'Vulnerable and outdated components',
      source: 'dependency' as const,
      area: `${target} · ${v.PkgName}@${v.InstalledVersion ?? '?'}`,
      detail: v.Description ?? v.Title ?? `${v.PkgName} has a ${v.Severity?.toLowerCase() ?? 'unknown'} severity vulnerability.`,
      evidence: `${v.VulnerabilityID ?? '?'} in ${v.PkgName}@${v.InstalledVersion ?? '?'}. Fixed in: ${v.FixedVersion ?? 'none'}.`,
      recommendation: v.FixedVersion
        ? `Upgrade ${v.PkgName} to version ${v.FixedVersion} or later.`
        : `No fix available for ${v.PkgName}. Consider replacing the dependency.`,
      selected: true,
    } satisfies SecurityScanFinding)
  }
  return findings
}

async function runSemgrepScan(projectPath: string): Promise<SecurityScanFinding[]> {
  const { Command } = await import('@tauri-apps/plugin-shell')
  try { await Command.create('semgrep-version', ['--version']).execute() } catch { return [] }

  let stdout = '', stderr = ''
  try {
    const res = await Command.create('semgrep-scan', ['--config=auto', '--json', '--quiet', projectPath]).execute()
    stdout = res.stdout; stderr = res.stderr
  } catch { return [] }

  let parsed: any
  try {
    const text = (stdout || stderr).trim()
    const start = text.indexOf('{')
    if (start < 0) return []
    parsed = JSON.parse(text.slice(start))
  } catch { return [] }

  const results: any[] = parsed?.results ?? []
  const sevOrder = ['ERROR', 'WARNING', 'INFO']
  const sorted = results.slice().sort((a, b) =>
    sevOrder.indexOf((a.extra?.severity ?? '').toUpperCase()) - sevOrder.indexOf((b.extra?.severity ?? '').toUpperCase()),
  )

  const seen = new Set<string>()
  const findings: SecurityScanFinding[] = []
  const base = projectPath.replace(/[/\\]$/, '')

  for (const item of sorted) {
    const ruleId = item.check_id ?? 'unknown'
    if (seen.has(ruleId) || findings.length >= 15) continue
    seen.add(ruleId)

    const owasp: string[] = item.extra?.metadata?.owasp ?? []
    const cwe: string[] = item.extra?.metadata?.cwe ?? []
    const category = owasp.length ? String(owasp[0]).replace(/^A\d+:\d{4}\s*-\s*/i, '') : 'Static analysis'
    const relPath = (item.path ?? '').replace(base, '').replace(/^[/\\]/, '')

    findings.push({
      id: `SEMGREP-${ruleId.split('.').pop()?.toUpperCase().replace(/[^A-Z0-9]/g, '-').slice(0, 18) ?? 'RULE'}`,
      title: item.extra?.message ?? ruleId,
      severity: normalizeSeverityOss(item.extra?.severity ?? 'warning'),
      category,
      source: 'config' as const,
      area: relPath || item.path || 'project files',
      detail: item.extra?.message ?? 'Static analysis finding.',
      evidence: `${relPath} line ${item.start?.line ?? '?'}${cwe.length ? `. ${cwe.slice(0, 2).join(', ')}` : ''}`,
      recommendation: item.extra?.fix ?? 'Review the flagged code and apply the security fix described in the Semgrep rule documentation.',
      selected: true,
    } satisfies SecurityScanFinding)
  }
  return findings
}

async function runCargoAuditScan(projectPath: string): Promise<SecurityScanFinding[]> {
  const fs = useTauriFs()
  const sep = projectPath.includes('\\') ? '\\' : '/'
  const lockPath = `${projectPath}${sep}Cargo.lock`
  if (!await fs.exists(lockPath).catch(() => false)) return []

  const { Command } = await import('@tauri-apps/plugin-shell')
  try { await Command.create('cargo-version', ['--version']).execute() } catch { return [] }

  let stdout = '', stderr = ''
  try {
    const res = await Command.create('cargo-audit-scan', ['audit', '--json', '--file', lockPath]).execute()
    stdout = res.stdout; stderr = res.stderr
  } catch { return [] }

  let parsed: any
  try {
    const text = (stdout || stderr).trim()
    const start = text.indexOf('{')
    if (start < 0) return []
    parsed = JSON.parse(text.slice(start))
  } catch { return [] }

  const list: any[] = parsed?.vulnerabilities?.list ?? []
  const sevMap: Record<string, SecuritySeverity> = { critical: 'critical', high: 'high', medium: 'medium', low: 'low' }

  return list.slice(0, 15).map((entry: any) => {
    const adv = entry.advisory ?? {}
    const pkg = entry.package ?? {}
    const patched: string[] = entry.versions?.patched ?? []
    const aliases: string[] = adv.aliases ?? []
    const cveStr = aliases.length ? ` (${aliases.slice(0, 2).join(', ')})` : ''
    return {
      id: `RUSTSEC-${String(adv.id ?? pkg.name).replace(/[^a-zA-Z0-9]/g, '-').slice(0, 18)}`,
      title: `${adv.id ?? 'Vulnerability'} in ${pkg.name}${cveStr}`,
      severity: sevMap[String(adv.severity ?? 'medium').toLowerCase()] ?? 'medium',
      category: 'Vulnerable and outdated components',
      source: 'dependency' as const,
      area: `Cargo · ${pkg.name}@${pkg.version ?? '?'}`,
      detail: adv.title ?? adv.description ?? `${pkg.name} has a known vulnerability.`,
      evidence: `${adv.id ?? '?'} in ${pkg.name}@${pkg.version ?? '?'}${cveStr}. Fixed in: ${patched.length ? patched.join(', ') : 'no patch listed'}.`,
      recommendation: patched.length
        ? `Upgrade ${pkg.name} to ${patched[0]} or later. See ${adv.url ?? 'https://rustsec.org'}.`
        : `No patched version listed. Review the advisory at ${adv.url ?? 'https://rustsec.org'}.`,
      selected: true,
    } satisfies SecurityScanFinding
  })
}

async function runOssScanners(): Promise<SecurityScanFinding[]> {
  const projectPath = props.project.absolutePath
  if (!projectPath) return []

  ossTools.value = [
    { name: 'npm audit',   status: 'running', count: 0 },
    { name: 'cargo audit', status: 'running', count: 0 },
    { name: 'Trivy',       status: 'running', count: 0 },
    { name: 'Semgrep',     status: 'running', count: 0 },
  ]
  ossRunning.value = true

  const [npmResult, cargoResult, trivyResult, semgrepResult] = await Promise.allSettled([
    runNpmAuditScan(projectPath),
    runCargoAuditScan(projectPath),
    runTrivyScan(projectPath),
    runSemgrepScan(projectPath),
  ])

  const allFindings: SecurityScanFinding[] = []
  const results = [npmResult, cargoResult, trivyResult, semgrepResult]
  ossTools.value = ossTools.value.map((tool, i) => {
    const r = results[i]!
    if (r.status === 'fulfilled') {
      allFindings.push(...r.value)
      return { ...tool, status: r.value.length ? 'done' as const : 'skipped' as const, count: r.value.length }
    }
    return { ...tool, status: 'error' as const, count: 0, error: String((r as any).reason?.message ?? 'failed') }
  })
  ossRunning.value = false
  return allFindings
}

const SCAN_EXTS = new Set([
  'ts', 'tsx', 'js', 'jsx', 'vue', 'svelte',
  'py', 'rb', 'php', 'go', 'rs', 'java', 'cs', 'cpp', 'c', 'h',
  'json', 'yaml', 'yml', 'toml', 'env', 'sh', 'bash', 'ps1',
  'sql', 'prisma', 'graphql',
])
const SCAN_SKIP_DIRS = new Set([
  'node_modules', 'dist', '.nuxt', '.output', 'target', 'build',
  '.cache', 'bin', 'obj', '__pycache__', '.venv', 'venv', '.git',
  'vendor', 'coverage', '.turbo',
])
const MAX_FILE_BYTES = 6_000
const MAX_TOTAL_BYTES = 40_000

async function readProjectFilesForScan(projectPath: string): Promise<string> {
  const fs = useTauriFs()
  const sep = projectPath.includes('\\') ? '\\' : '/'
  const parts: string[] = []
  let totalBytes = 0

  async function walk(dir: string, depth: number) {
    if (depth > 4 || totalBytes >= MAX_TOTAL_BYTES) return
    const items = await fs.readDir(dir).catch(() => [])
    for (const item of items) {
      if (totalBytes >= MAX_TOTAL_BYTES) break
      if (SCAN_SKIP_DIRS.has(item.name)) continue
      if (item.isDir) {
        await walk(item.path, depth + 1)
      } else {
        const ext = item.name.split('.').pop()?.toLowerCase() ?? ''
        if (!SCAN_EXTS.has(ext)) continue
        try {
          const content = await fs.readTextFile(item.path)
          const truncated = content.length > MAX_FILE_BYTES ? content.slice(0, MAX_FILE_BYTES) + '\n[truncated]' : content
          const rel = item.path.replace(projectPath + sep, '').replace(projectPath + '/', '')
          const block = `=== ${rel} ===\n${truncated}`
          totalBytes += block.length
          parts.push(block)
        } catch { /* unreadable, skip */ }
      }
    }
  }

  await walk(projectPath, 0)
  return parts.join('\n\n')
}

async function runAIScan(effortOverride?: SecurityScanEffort, automatic = false) {
  if (!props.project.absolutePath) {
    notify('Select a project before running an AI security scan.', 'warning')
    return
  }

  const tool: SecurityAITool = automatic ? (props.project.activeAITool === 'claude_code' ? 'claude' : 'codex') : selectedAITool.value
  const effort = scanEffortOptions.find(option => option.value === (effortOverride ?? selectedEffortOption.value.value)) ?? scanEffortOptions[1]!
  const findingLimit = automatic ? security.settings.aiFindingLimit : normalizedFindingLimit.value
  const toolLabel = securityToolLabel(tool)

  if (tool === 'openrouter' && (!app.openRouter.enabled || !app.openRouter.apiKey.trim())) {
    notify('Configure and enable OpenRouter in AI Models before running this scan.', 'warning')
    showToolPicker.value = true
    return
  }

  if (tool === 'ollama' && (!app.ollama.enabled || !app.ollama.url.trim())) {
    notify('Enable Ollama and configure its URL in AI Models before running this scan.', 'warning')
    showToolPicker.value = true
    return
  }


  if (!automatic) {
    selectedFindingLimit.value = findingLimit
    await security.updateSettings({ aiFindingLimit: findingLimit })
  }
  showToolPicker.value = false
  aiScanRunning.value = true
  startScanCheckpoint()
  beginScanActivity(effort, tool)
  scanError.value = null
  parseWarning.value = null
  if (!automatic) emit('changeTab', 'scanner')

  // Start OSS scanners in parallel with the AI scan
  const ossPromise = runOssScanners()

  try {
    const scopeConstraint = automatic ? '' : buildScopeConstraint()
    const prompt = buildSecurityScanPrompt(props.project.name, buildExistingSecurityContext(), effort, findingLimit) + scopeConstraint

    const fileContent = (tool === 'openrouter' || tool === 'ollama')
      ? await readProjectFilesForScan(props.project.absolutePath)
      : ''
    const enrichedPrompt = [
      prompt,
      fileContent ? `---\nProject source files for analysis:\n\n${fileContent}` : '',
    ].filter(Boolean).join('\n\n')

    let result: { stdout: string; stderr: string }
    if (tool === 'openrouter') {
      const output = await runOpenRouterChat({
        apiKey: app.openRouter.apiKey,
        model: app.openRouter.model,
        messages: [
          { role: 'system', content: 'You are Vindicter, an AI security reviewer. Return only the JSON requested by the user.' },
          { role: 'user', content: enrichedPrompt },
        ],
      })
      result = { stdout: output, stderr: '' }
    }
    else if (tool === 'ollama') {
      const output = await runOllamaChat({
        url: app.ollama.url,
        model: app.ollama.model,
        messages: [
          { role: 'system', content: 'You are Vindicter, an AI security reviewer. Return only the JSON requested by the user.' },
          { role: 'user', content: enrichedPrompt },
        ],
      })
      result = { stdout: output, stderr: '' }
    }
    else if (tool === 'claude') {
      result = await runClaudeExec({
        projectPath: props.project.absolutePath,
        prompt,
        model: `Claude CLI default (${effort.value} effort)`,
        reasoningEffort: effort.value,
      })
    }
    else {
      result = await runCodexExec({
        projectPath: props.project.absolutePath,
        prompt,
        model: `Codex CLI default (${effort.value} effort)`,
        reasoningEffort: effort.value,
      })
    }

    const responseText = [result.stdout, result.stderr].filter(Boolean).join('\n').trim()
    if (!responseText) throw new Error(`${toolLabel} completed without returning scan output.`)

    try {
      setScanStage(4)
      const parsed = parseAiScanResponse(responseText)

      // Wait for OSS scanners and merge findings
      const ossFindings = await ossPromise
      const allFindings = [...parsed.findings, ...ossFindings]
      const ossCount = ossFindings.length
      const aiCount = parsed.findings.length
      const ossNote = ossCount ? ` + ${ossCount} OSS scanner finding${ossCount !== 1 ? 's' : ''}` : ''

      const scan = await security.recordScan(props.project, {
        effort: effort.value,
        status: 'done',
        summary: parsed.summary + (ossCount ? ` [${ossCount} additional finding${ossCount !== 1 ? 's' : ''} from OSS scanners]` : ''),
        rawReport: parsed.raw,
        findings: allFindings,
        parseWarning: null,
      })
      activeScanId.value = scan.id
      finishScanActivity('done', `${aiCount} AI finding${aiCount !== 1 ? 's' : ''}${ossNote} from the ${toolLabel} report.`, parsed.raw)
      notify(`Security scan complete: ${allFindings.length} finding${allFindings.length !== 1 ? 's' : ''} (AI: ${aiCount}${ossNote}).`, 'success')
      feed.push({
        category: 'scan_complete',
        title: `Scan complete — ${allFindings.length} finding${allFindings.length !== 1 ? 's' : ''} in ${props.project.name}`,
        body: parsed.summary || `${aiCount} AI finding${aiCount !== 1 ? 's' : ''}${ossNote} detected.`,
        link: '/security',
        meta: { projectId: props.project.id, tool: toolLabel },
      })
    }
    catch (e: any) {
      const ossFindings = await ossPromise.catch(() => [])
      parseWarning.value = e?.message ?? `${toolLabel} returned a report, but Vindicter could not parse structured findings.`
      const scan = await security.recordScan(props.project, {
        effort: effort.value,
        status: ossFindings.length ? 'warning' : 'warning',
        summary: `${toolLabel} returned a report, but Vindicter could not parse it into structured findings.`,
        rawReport: responseText,
        findings: ossFindings,
        parseWarning: parseWarning.value,
      })
      activeScanId.value = scan.id
      finishScanActivity('warning', `${toolLabel} returned a report, but structured findings could not be parsed.${ossFindings.length ? ` ${ossFindings.length} OSS scanner finding${ossFindings.length !== 1 ? 's' : ''} included.` : ''}`, responseText)
      notify('AI scan parse error. OSS scanner results may still be available.', 'warning')
      feed.push({
        category: 'scan_error',
        title: `Scan parse error in ${props.project.name}`,
        body: `${toolLabel} returned output but structured findings could not be extracted.${ossFindings.length ? ` ${ossFindings.length} OSS finding${ossFindings.length !== 1 ? 's' : ''} included.` : ''}`,
        link: '/security',
        meta: { projectId: props.project.id, tool: toolLabel },
      })
    }
  }
  catch (e: any) {
    await ossPromise.catch(() => [])
    scanError.value = e?.message ?? 'AI security scan failed.'
    finishScanActivity('error', scanError.value)
    notify('AI security scan failed.', 'error')
    feed.push({
      category: 'scan_error',
      title: `Scan failed in ${props.project.name}`,
      body: scanError.value,
      link: '/security',
      meta: { projectId: props.project.id },
    })
  }
  finally {
    stopScanActivityTimer()
    stopScanCheckpoint()
    aiScanRunning.value = false
  }
}

function sanitizeFileName(value: string) {
  return value
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 96) || 'security-report'
}

function ensureDocxExtension(path: string) {
  return path.toLowerCase().endsWith('.docx') ? path : `${path}.docx`
}
function ensureMdExtension(path: string) {
  return path.toLowerCase().endsWith('.md') ? path : `${path}.md`
}

function currentDocxReport() {
  const scan = activeScan.value
  const storedProject = projects.projects.find(project => project.id === props.project.id)
  return {
    projectName: props.project.name,
    projectCode: props.project.code,
    projectPath: props.project.absolutePath,
    githubRepo: props.project.githubRepo || storedProject?.githubRepo || null,
    generatedAt: new Date().toISOString(),
    scannedAt: scan?.scannedAt ?? new Date().toISOString(),
    summary: scan?.summary || 'No summary was captured for this security workspace.',
    rawReport: scan?.rawReport || '',
    findings: (scan?.findings.length ? scan.findings : security.findings).map(finding => ({
      id: 'number' in finding ? `SEC-${finding.number}` : finding.id,
      title: finding.title,
      area: finding.area,
      severity: finding.severity,
      status: 'status' in finding ? finding.status : 'open',
      owaspCategory: 'category' in finding ? finding.category : 'Security review',
      detail: finding.detail,
      evidence: finding.evidence,
      recommendation: finding.recommendation,
    })),
  }
}

function scanFindingRoute(finding: SecurityScanFinding) {
  return {
    path: `/findings/${encodeURIComponent(finding.id)}`,
    query: {
      project: props.project.id,
      type: 'scan',
      ...(activeScan.value?.id ? { scan: activeScan.value.id } : {}),
    },
  }
}

function remediationFindingRoute(finding: SecurityFinding) {
  return {
    path: `/findings/${encodeURIComponent(finding.id)}`,
    query: {
      project: props.project.id,
      type: 'remediation',
      ...(finding.scanId ? { scan: finding.scanId } : {}),
    },
  }
}

function openExportModal() {
  pendingExportType.value = null
  showExportModal.value = true
}

function selectExportType(type: 'review' | 'raw' | 'prompts') {
  if (type === 'raw' && !activeScan.value?.rawReport) {
    notify('No raw AI report available for the active scan.', 'warning')
    return
  }
  if (type === 'prompts' && !currentDocxReport().findings.length) {
    notify('No findings available to export fix prompts for.', 'warning')
    return
  }
  if (type === 'prompts') {
    // Fix Prompts is always MD — skip format step
    showExportModal.value = false
    void exportFixPrompts()
    return
  }
  pendingExportType.value = type
  showExportModal.value = false
  showExportFormatModal.value = true
}

async function confirmExportFormat(format: 'docx' | 'md') {
  showExportFormatModal.value = false
  if (pendingExportType.value === 'review') await exportSecurityReview(format)
  else if (pendingExportType.value === 'raw') await exportRawReport(format)
}

async function exportSecurityReview(format: 'docx' | 'md') {
  const report = currentDocxReport()
  exportingFormat.value = 'review'
  exportingDocs.value = true
  showExportModal.value = false
  try {
    const dialog = useTauriDialog()
    const date = new Date(report.scannedAt).toISOString().slice(0, 10)
    const ext = format === 'md' ? 'md' : 'docx'
    const defaultName = sanitizeFileName(`Vindicter Security Review - ${report.projectCode || report.projectName} - ${date}.${ext}`)
    const selected = await dialog.saveFile({
      title: 'Export Security Review',
      defaultPath: defaultName,
      filters: format === 'md'
        ? [{ name: 'Markdown', extensions: ['md'] }]
        : [{ name: 'Word Document', extensions: ['docx'] }],
    })
    if (!selected) return
    const fs = useTauriFs()
    if (format === 'md') {
      await fs.writeFile(ensureMdExtension(selected), new TextEncoder().encode(buildSecurityReviewMarkdown(report)))
      notify('Security review exported as Markdown.', 'success')
    }
    else {
      await fs.writeFile(ensureDocxExtension(selected), createVindicterSecurityDocx(report))
      notify('Security review exported as DOCX.', 'success')
    }
  }
  catch (e: any) {
    notify(e?.message ?? 'Could not export security review.', 'error')
  }
  finally {
    exportingDocs.value = false
    exportingFormat.value = null
  }
}

async function exportRawReport(format: 'docx' | 'md') {
  const report = currentDocxReport()
  if (!report.rawReport) {
    notify('No raw AI report available for the active scan.', 'warning')
    showExportModal.value = false
    return
  }
  exportingFormat.value = 'raw'
  exportingDocs.value = true
  showExportModal.value = false
  try {
    const dialog = useTauriDialog()
    const date = new Date(report.scannedAt).toISOString().slice(0, 10)
    const ext = format === 'md' ? 'md' : 'docx'
    const defaultName = sanitizeFileName(`Vindicter Raw AI Report - ${report.projectCode || report.projectName} - ${date}.${ext}`)
    const selected = await dialog.saveFile({
      title: 'Export Raw AI Report',
      defaultPath: defaultName,
      filters: format === 'md'
        ? [{ name: 'Markdown', extensions: ['md'] }]
        : [{ name: 'Word Document', extensions: ['docx'] }],
    })
    if (!selected) return
    const fs = useTauriFs()
    if (format === 'md') {
      await fs.writeFile(ensureMdExtension(selected), new TextEncoder().encode(buildRawReportMarkdown(report)))
      notify('Raw AI report exported as Markdown.', 'success')
    }
    else {
      await fs.writeFile(ensureDocxExtension(selected), createVindicterRawReportDocx(report))
      notify('Raw AI report exported as DOCX.', 'success')
    }
  }
  catch (e: any) {
    notify(e?.message ?? 'Could not export raw report.', 'error')
  }
  finally {
    exportingDocs.value = false
    exportingFormat.value = null
  }
}

async function exportFixPrompts() {
  const report = currentDocxReport()
  if (!report.findings.length) {
    notify('No findings available to export fix prompts for.', 'warning')
    showExportModal.value = false
    return
  }
  exportingFormat.value = 'prompts'
  exportingDocs.value = true
  showExportModal.value = false
  try {
    const dialog = useTauriDialog()
    const date = new Date(report.scannedAt).toISOString().slice(0, 10)
    const defaultName = sanitizeFileName(`Vindicter Fix Prompts - ${report.projectCode || report.projectName} - ${date}.md`)
    const selected = await dialog.saveFile({
      title: 'Export Fix Prompts',
      defaultPath: defaultName,
      filters: [{ name: 'Markdown', extensions: ['md'] }],
    })
    if (!selected) return
    const fs = useTauriFs()
    const markdown = buildFixPromptsMarkdown(report)
    const ensureMd = (p: string) => p.toLowerCase().endsWith('.md') ? p : `${p}.md`
    await fs.writeFile(ensureMd(selected), new TextEncoder().encode(markdown))
    notify('Fix prompts exported as Markdown.', 'success')
  }
  catch (e: any) {
    notify(e?.message ?? 'Could not export fix prompts.', 'error')
  }
  finally {
    exportingDocs.value = false
    exportingFormat.value = null
  }
}

async function createRemediationItems() {
  const selected = selectedScanFindings.value
  if (!selected.length) return
  creatingRemediation.value = true
  try {
    await security.createRemediationItems(activeScan.value?.id ?? null, selected)
    notify(`Created ${selected.length} remediation item${selected.length === 1 ? '' : 's'}.`, 'success')
    const highRisk = selected.filter(f => f.severity === 'critical' || f.severity === 'high')
    if (highRisk.length) {
      feed.push({
        category: 'finding_new',
        title: `${highRisk.length} high-risk finding${highRisk.length === 1 ? '' : 's'} added in ${props.project.name}`,
        body: highRisk.slice(0, 3).map(f => `[${f.severity.toUpperCase()}] ${f.title}`).join(' • '),
        link: '/security',
        meta: { projectId: props.project.id },
      })
    }
    emit('changeTab', 'findings')
  }
  catch (e: any) {
    notify(e?.message ?? 'Could not create remediation items.', 'error')
  }
  finally {
    creatingRemediation.value = false
  }
}

async function updateFindingStatus(finding: SecurityFinding, status: SecurityFindingStatus) {
  await security.updateFindingStatus(finding.id, status)
}

function joinPath(base: string, child: string) {
  const sep = base.includes('\\') ? '\\' : '/'
  return `${base}${sep}${child}`
}

async function readJsonFile(path: string) {
  const fs = useTauriFs()
  const raw = await fs.readTextFile(path)
  return JSON.parse(raw)
}

async function scanDependencies(showNotice = true) {
  dependencyLoading.value = true
  try {
    const fs = useTauriFs()
    const manifestNames = new Set([
      'package.json',
      'Cargo.toml',
      'Cargo.lock',
      'requirements.txt',
      'pyproject.toml',
      'go.mod',
      'pom.xml',
      'build.gradle',
      'build.gradle.kts',
      'composer.json',
      'Gemfile',
      'Directory.Packages.props',
    ])
    const ignoredDirs = new Set(['.git', 'node_modules', 'dist', '.nuxt', '.output', 'target', 'build', '.cache', 'bin', 'obj'])
    const manifestPaths = new Set<string>()

    async function collectManifests(dir: string, depth: number) {
      if (depth > 3) return
      const entries = await fs.readDir(dir).catch(() => [])
      for (const entry of entries) {
        if (entry.isDir) {
          if (!ignoredDirs.has(entry.name)) await collectManifests(entry.path, depth + 1)
          continue
        }
        if (manifestNames.has(entry.name) || /\.csproj$/i.test(entry.name) || /\.fsproj$/i.test(entry.name) || /\.vbproj$/i.test(entry.name)) {
          manifestPaths.add(entry.path)
        }
      }
    }

    await collectManifests(props.project.absolutePath, 0)

    const inventory: DependencyInventoryItem[] = []

    function addDependency(manifest: string, name: string, version: string, type: string) {
      const cleanName = name.trim()
      if (!cleanName || cleanName.startsWith('#')) return
      inventory.push({ manifest, name: cleanName, version: version.trim() || 'unspecified', type })
    }

    for (const manifestPath of manifestPaths) {
      const fileName = manifestPath.split(/[\\/]/).pop() ?? manifestPath
      const text = await fs.readTextFile(manifestPath).catch(() => '')
      if (!text) continue

      if (fileName === 'package.json' || fileName === 'composer.json') {
        const manifest = JSON.parse(text)
        const sections = fileName === 'package.json'
          ? ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']
          : ['require', 'require-dev']
        for (const type of sections) {
          const deps = manifest[type] as Record<string, string> | undefined
          if (!deps) continue
          for (const [name, version] of Object.entries(deps)) addDependency(manifestPath, name, String(version), type)
        }
        continue
      }

      if (fileName === 'Cargo.toml') {
        let section = ''
        for (const line of text.split(/\r?\n/)) {
          const sectionMatch = line.match(/^\s*\[([^\]]+)\]\s*$/)
          if (sectionMatch) {
            section = sectionMatch[1] ?? ''
            continue
          }
          if (!/dependencies/i.test(section)) continue
          const simple = line.match(/^\s*([A-Za-z0-9_.-]+)\s*=\s*["']([^"']+)["']/)
          const table = line.match(/^\s*([A-Za-z0-9_.-]+)\s*=\s*\{[^}]*version\s*=\s*["']([^"']+)["']/)
          const match = simple ?? table
          if (match) addDependency(manifestPath, match[1] ?? '', match[2] ?? '', section)
        }
        continue
      }

      if (/\.csproj$|\.fsproj$|\.vbproj$|Directory\.Packages\.props$/i.test(fileName)) {
        for (const match of text.matchAll(/<PackageReference[^>]*Include=["']([^"']+)["'][^>]*(?:Version=["']([^"']+)["'])?|<PackageVersion[^>]*Include=["']([^"']+)["'][^>]*Version=["']([^"']+)["']/gi)) {
          addDependency(manifestPath, match[1] ?? match[3] ?? '', match[2] ?? match[4] ?? 'central', '.NET')
        }
        continue
      }

      if (fileName === 'requirements.txt') {
        for (const line of text.split(/\r?\n/)) {
          const match = line.trim().match(/^([A-Za-z0-9_.-]+)\s*([<>=!~]=?.*)?$/)
          if (match) addDependency(manifestPath, match[1] ?? '', match[2] ?? 'unspecified', 'python')
        }
        continue
      }

      if (fileName === 'pyproject.toml') {
        for (const match of text.matchAll(/["']([A-Za-z0-9_.-]+)(?:[<>=!~][^"']*)?["']/g)) {
          addDependency(manifestPath, match[1] ?? '', 'pyproject', 'python')
        }
        continue
      }

      if (fileName === 'go.mod') {
        for (const line of text.split(/\r?\n/)) {
          const match = line.trim().match(/^([A-Za-z0-9_.~/-]+)\s+(v[^\s]+)(?:\s+\/\/.*)?$/)
          if (match && !['module', 'go', 'require', 'replace', 'exclude'].includes(match[1] ?? '')) {
            addDependency(manifestPath, match[1] ?? '', match[2] ?? '', 'go')
          }
        }
        continue
      }

      if (fileName === 'pom.xml') {
        for (const block of text.matchAll(/<dependency>[\s\S]*?<\/dependency>/g)) {
          const value = block[0]
          const group = value.match(/<groupId>([^<]+)<\/groupId>/)?.[1] ?? ''
          const artifact = value.match(/<artifactId>([^<]+)<\/artifactId>/)?.[1] ?? ''
          const version = value.match(/<version>([^<]+)<\/version>/)?.[1] ?? 'managed'
          if (artifact) addDependency(manifestPath, group ? `${group}:${artifact}` : artifact, version, 'maven')
        }
        continue
      }

      if (fileName === 'build.gradle' || fileName === 'build.gradle.kts') {
        for (const match of text.matchAll(/(?:implementation|api|compileOnly|runtimeOnly|testImplementation)\s*\(?\s*["']([^:"']+):([^:"']+):([^"']+)["']/g)) {
          addDependency(manifestPath, `${match[1]}:${match[2]}`, match[3] ?? '', 'gradle')
        }
        continue
      }

      if (fileName === 'Gemfile') {
        for (const match of text.matchAll(/^\s*gem\s+["']([^"']+)["'](?:\s*,\s*["']([^"']+)["'])?/gm)) {
          addDependency(manifestPath, match[1] ?? '', match[2] ?? 'unspecified', 'ruby')
        }
      }
    }
    dependencyInventory.value = inventory.sort((a, b) => a.name.localeCompare(b.name))

    const findings: Omit<SecurityScanFinding, 'selected'>[] = []
    const lockExists = await Promise.all([
      fs.exists(joinPath(props.project.absolutePath, 'pnpm-lock.yaml')).catch(() => false),
      fs.exists(joinPath(props.project.absolutePath, 'package-lock.json')).catch(() => false),
      fs.exists(joinPath(props.project.absolutePath, 'yarn.lock')).catch(() => false),
      fs.exists(joinPath(props.project.absolutePath, 'Cargo.lock')).catch(() => false),
      fs.exists(joinPath(props.project.absolutePath, 'packages.lock.json')).catch(() => false),
      fs.exists(joinPath(props.project.absolutePath, 'poetry.lock')).catch(() => false),
      fs.exists(joinPath(props.project.absolutePath, 'uv.lock')).catch(() => false),
      fs.exists(joinPath(props.project.absolutePath, 'go.sum')).catch(() => false),
      fs.exists(joinPath(props.project.absolutePath, 'composer.lock')).catch(() => false),
      fs.exists(joinPath(props.project.absolutePath, 'Gemfile.lock')).catch(() => false),
      fs.exists(joinPath(props.project.absolutePath, 'gradle.lockfile')).catch(() => false),
    ])
    if (inventory.length && !lockExists.some(Boolean)) {
      findings.push({
        id: 'DEP-LOCKFILE',
        title: 'Dependency manifests have no recognized lockfile',
        severity: 'medium',
        category: 'Dependency integrity',
        source: 'dependency',
        area: 'dependency manifests',
        detail: 'Dependency manifests were found without a recognized lockfile or checksum file, which can make dependency resolution less reproducible.',
        evidence: [...manifestPaths].join('\n'),
        recommendation: 'Commit the package manager lockfile generated by the project and use frozen installs in automation.',
      })
    }
    if (inventory.some(item => item.version === '*' || item.version.toLowerCase() === 'latest')) {
      findings.push({
        id: 'DEP-FLOATING',
        title: 'Floating dependency versions detected',
        severity: 'low',
        category: 'Dependency hygiene',
        source: 'dependency',
        area: 'dependency manifests',
        detail: 'One or more dependencies use latest or wildcard versions, increasing supply-chain drift risk.',
        evidence: inventory.filter(item => item.version === '*' || item.version.toLowerCase() === 'latest').map(item => `${item.name}@${item.version} in ${item.manifest}`).join('\n'),
        recommendation: 'Pin package ranges intentionally and rely on reviewed dependency update workflows.',
      })
    }
    await security.upsertLocalFindings('dependency', findings)
    if (showNotice) notify(`Dependency inventory refreshed: ${inventory.length} package${inventory.length === 1 ? '' : 's'}.`, 'success')
  }
  catch (e: any) {
    if (showNotice) notify(e?.message ?? 'Could not inspect dependencies.', 'error')
  }
  finally {
    dependencyLoading.value = false
  }
}

async function addPendingSecretsToFindings() {
  const selected = pendingSecretFindings.value.filter(f => f.selected)
  if (!selected.length) return
  await security.upsertLocalFindings('secret', selected.map(f => ({
    ...f,
    whitelisted: false,
  })))
  notify(`${selected.length} secret finding${selected.length !== 1 ? 's' : ''} added to Findings.`, 'success')
  pendingSecretFindings.value = []
  secretScanDone.value = false
}

async function whitelistPendingSecret(finding: PendingSecretFinding) {
  await security.addToWhitelist({ id: finding.id, title: finding.title, category: finding.category, area: finding.area })
  pendingSecretFindings.value = pendingSecretFindings.value.filter(f => f.id !== finding.id)
  notify(`"${finding.title}" added to whitelist.`, 'success')
}

async function scanEnvFiles() {
  envLoading.value = true
  envFiles.value = []
  try {
    const fs = useTauriFs()
    const ENV_PATTERN = /^\.env(\.[a-z0-9._-]+)?$/i
    const results: EnvFile[] = []

    async function walk(dir: string, depth: number) {
      if (depth > 4) return
      const entries = await fs.readDir(dir).catch(() => [])
      for (const entry of entries) {
        if (entry.isDir) {
          if (!['node_modules', '.git', 'dist', '.nuxt', '.output', 'target', 'build'].includes(entry.name)) {
            await walk(entry.path, depth + 1)
          }
          continue
        }
        if (!ENV_PATTERN.test(entry.name)) continue
        const text = await fs.readTextFile(entry.path).catch(() => '')
        if (!text) continue
        const vars: EnvVar[] = []
        for (const rawLine of text.split('\n')) {
          const line = rawLine.trim()
          if (!line || line.startsWith('#')) continue
          const eqIdx = line.indexOf('=')
          if (eqIdx === -1) continue
          const key = line.slice(0, eqIdx).trim()
          const value = line.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
          if (key) vars.push({ key, value, redacted: true })
        }
        if (vars.length > 0) {
          const relPath = entry.path.replace(props.project.absolutePath, '').replace(/^[/\\]/, '')
          results.push({ path: entry.path, relPath, vars })
        }
      }
    }

    await walk(props.project.absolutePath, 0)
    envFiles.value = results
    if (!results.length) notify('No .env files found in this project.', 'success')
  }
  catch (e: any) {
    notify(e?.message ?? 'Could not scan .env files.', 'error')
  }
  finally {
    envLoading.value = false
  }
}

async function scanSecrets(showNotice = true) {
  secretsLoading.value = true
  pendingSecretFindings.value = []
  secretScanDone.value = false
  try {
    const fs = useTauriFs()
    const ignoredDirs = new Set(['.git', 'node_modules', 'dist', '.nuxt', '.output', 'target', 'build', '.cache', 'vendor', '__pycache__'])
    const allowedExtensions = /\.(env|envrc|ts|js|mjs|cjs|vue|jsx|tsx|json|yml|yaml|toml|rs|py|rb|go|php|cs|java|kt|swift|sh|bash|zsh|md|txt|conf|config|ini|properties|pem|key|cer)$/i
    const SKIP_FILENAMES = /^(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|.*\.test\.(ts|js)|.*\.spec\.(ts|js))$/i

    interface SecretPattern { label: string; category: string; regex: RegExp; severity: SecuritySeverity }
    const patterns: SecretPattern[] = [
      { label: 'OpenAI API key',        category: 'Credentials', severity: 'critical', regex: /\bsk-[A-Za-z0-9_-]{40,}\b/ },
      { label: 'Anthropic API key',     category: 'Credentials', severity: 'critical', regex: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/ },
      { label: 'GitHub personal token', category: 'Credentials', severity: 'critical', regex: /\bgh[pousr]_[A-Za-z0-9_]{36,}\b/ },
      { label: 'AWS access key',        category: 'Credentials', severity: 'critical', regex: /\bAKIA[0-9A-Z]{16}\b/ },
      { label: 'AWS secret key',        category: 'Credentials', severity: 'critical', regex: /\b(?:aws_?secret[_-]?access[_-]?key|AWS_SECRET_ACCESS_KEY)\s*[:=]\s*['"]?[A-Za-z0-9/+=]{40}['"]?/i },
      { label: 'Private key material',  category: 'Cryptographic key exposure', severity: 'critical', regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/ },
      { label: 'Database password',     category: 'Credentials', severity: 'high', regex: /\b(?:db_?password|database_?password|DB_PASS(?:WORD)?|POSTGRES_PASSWORD|MYSQL_ROOT_PASSWORD)\s*[:=]\s*['"]?[^'"\s]{6,}['"]?/i },
      { label: 'Hard-coded JWT secret', category: 'Secrets management', severity: 'high', regex: /\bjwt[_-]?secret\b\s*[:=]\s*['"][^'"\n]{10,}['"]/i },
      { label: 'Hard-coded password',   category: 'Secrets management', severity: 'high', regex: /\bpassword\s*[:=]\s*['"][^'"\n]{8,}['"]/i },
      { label: 'Supabase service key',  category: 'Credentials', severity: 'high', regex: /\beyJ[A-Za-z0-9_-]{20,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/ },
      { label: 'Generic API key',       category: 'Secrets management', severity: 'medium', regex: /\b(?:api[_-]?key|apikey|API_KEY)\s*[:=]\s*['"][A-Za-z0-9_\-]{20,}['"]/i },
      { label: 'Bearer token literal',  category: 'Secrets management', severity: 'medium', regex: /Bearer\s+[A-Za-z0-9._\-]{30,}/i },
      { label: 'Slack token',           category: 'Credentials', severity: 'high', regex: /\bxox[bpoa]-[0-9A-Za-z]{10,}-[0-9A-Za-z]{10,}/ },
      { label: 'Google API key',        category: 'Credentials', severity: 'high', regex: /\bAIza[0-9A-Za-z\-_]{35}\b/ },
      { label: '.env file committed',   category: 'Secrets exposure', severity: 'high', regex: /^\s*(?!#)[A-Z_]+=.{1,}/m },
    ]

    interface MatchedSecret { pattern: SecretPattern; file: string; line: number; snippet: string }
    const hits: MatchedSecret[] = []

    async function walk(dir: string, depth: number) {
      if (depth > 5 || hits.length >= 50) return
      const entries = await fs.readDir(dir).catch(() => [])
      for (const entry of entries) {
        if (hits.length >= 50) return
        if (entry.isDir) {
          if (!ignoredDirs.has(entry.name)) await walk(entry.path, depth + 1)
          continue
        }
        if (!allowedExtensions.test(entry.name)) continue
        if (SKIP_FILENAMES.test(entry.name)) continue
        const text = await fs.readTextFile(entry.path).catch(() => '')
        if (!text || text.length > 500_000) continue
        const lines = text.split('\n')
        const matchedPatterns = new Set<string>()
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]!
          for (const p of patterns) {
            if (matchedPatterns.has(p.label)) continue
            if (p.regex.test(line)) {
              const snippet = line.trim().slice(0, 120)
              hits.push({ pattern: p, file: entry.path, line: i + 1, snippet })
              matchedPatterns.add(p.label)
            }
          }
        }
      }
    }

    await walk(props.project.absolutePath, 0)

    // Group hits by file — one finding per unique pattern category per file
    const findingMap = new Map<string, MatchedSecret[]>()
    for (const hit of hits) {
      const key = `${hit.pattern.label}::${hit.file}`
      if (!findingMap.has(key)) findingMap.set(key, [])
      findingMap.get(key)!.push(hit)
    }

    const findings = [...findingMap.values()].map((group, i) => {
      const first = group[0]!
      const relPath = first.file.replace(props.project.absolutePath, '').replace(/^[/\\]/, '')
      return {
        id: `SECRET-${i}-${Date.now()}`,
        title: `${first.pattern.label} detected`,
        severity: first.pattern.severity,
        category: first.pattern.category,
        source: 'secret' as const,
        area: relPath,
        detail: `Pattern "${first.pattern.label}" matched in \`${relPath}\` at line ${first.line}.`,
        evidence: group.map(h => `Line ${h.line}: ${h.snippet}`).join('\n'),
        recommendation: 'Remove the secret from source code. Use environment variables, a secrets manager, or a vault. Rotate any exposed credentials immediately.',
        selected: true,
        whitelisted: false,
      }
    })

    // Store as pending — user decides whether to add to Findings or whitelist
    pendingSecretFindings.value = findings
    secretScanDone.value = true
    const count = findings.length
    if (showNotice) {
      notify(
        count
          ? `Secret scan found ${count} potential secret${count !== 1 ? 's' : ''}. Review and add to findings or whitelist.`
          : 'Secret scan finished — no obvious secret patterns found.',
        count ? 'warning' : 'success',
      )
    }
  }
  catch (e: any) {
    if (showNotice) notify(e?.message ?? 'Could not run secret scan.', 'error')
  }
  finally {
    secretsLoading.value = false
  }
}

async function scanConfig() {
  const fs = useTauriFs()
  const envExists = await fs.exists(joinPath(props.project.absolutePath, '.env')).catch(() => false)
  const envExampleExists = await fs.exists(joinPath(props.project.absolutePath, '.env.example')).catch(() => false)
  const tauriConfigExists = await fs.exists(joinPath(props.project.absolutePath, 'apps/desktop/tauri/tauri.conf.json')).catch(() => false)
  const checks: ConfigCheck[] = [
    {
      label: '.env hygiene',
      status: envExists && !envExampleExists ? 'warning' : 'ok',
      detail: envExists && !envExampleExists ? '.env exists without a matching .env.example.' : 'Environment file shape has a safer baseline.',
    },
    {
      label: 'Desktop permissions',
      status: tauriConfigExists ? 'info' : 'ok',
      detail: tauriConfigExists ? 'Desktop configuration detected. Review capabilities and shell permissions during AI scans.' : 'No desktop configuration detected at the default path.',
    },
    {
      label: 'Automatic scan',
      status: security.settings.autoScanEnabled ? 'ok' : 'warning',
      detail: security.settings.autoScanEnabled ? `Existing scan history refreshes when older than ${security.settings.autoScanStaleHours} hours. New projects wait for a manual scan.` : 'Automatic scans are disabled for this project.',
    },
  ]
  configChecks.value = checks
}

async function clearScanHistory() {
  await security.clearScans()
  activeScanId.value = null
  notify('Security scan history cleared.', 'success')
}
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-5 pb-8">
    <div v-if="tab === 'overview'" class="flex justify-end">
      <button
        class="grid size-6 place-items-center rounded text-[var(--text-faint)] transition-colors hover:bg-white/[0.06] hover:text-[var(--text-muted)]"
        :title="metricsCollapsed ? 'Show metrics' : 'Hide metrics'"
        @click="metricsCollapsed = !metricsCollapsed"
      >
        <ChevronDown v-if="metricsCollapsed" class="size-3" />
        <ChevronUp v-else class="size-3" />
      </button>
    </div>

    <Transition
      enter-active-class="transition-all duration-200 ease-out overflow-hidden"
      enter-from-class="opacity-0 -translate-y-2 max-h-0"
      enter-to-class="opacity-100 translate-y-0 max-h-96"
      leave-active-class="transition-all duration-150 ease-in overflow-hidden"
      leave-from-class="opacity-100 translate-y-0 max-h-96"
      leave-to-class="opacity-0 -translate-y-2 max-h-0"
    >
      <section v-if="tab === 'overview' && !metricsCollapsed" class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <div class="flex items-center justify-between">
            <p class="text-xs text-[var(--text-muted)]">Open Findings</p>
            <AlertTriangle class="size-3.5 text-red-300" />
          </div>
          <p class="mt-2 text-2xl font-semibold text-[var(--text)]">{{ security.openFindings }}</p>
        </div>
        <div class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <div class="flex items-center justify-between">
            <p class="text-xs text-[var(--text-muted)]">High Risk</p>
            <Bug class="size-3.5 text-orange-300" />
          </div>
          <p class="mt-2 text-2xl font-semibold text-[var(--text)]">{{ security.highRiskFindings + highRiskScans }}</p>
        </div>
        <div class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <div class="flex items-center justify-between">
            <p class="text-xs text-[var(--text-muted)]">Last Scan</p>
            <Clock3 class="size-3.5 text-indigo-300" />
          </div>
          <p class="mt-2 truncate text-lg font-semibold text-[var(--text)]">{{ formattedLastScan }}</p>
        </div>
        <div class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <div class="flex items-center justify-between">
            <p class="text-xs text-[var(--text-muted)]">Packages</p>
            <PackageSearch class="size-3.5 text-violet-300" />
          </div>
          <p class="mt-2 text-2xl font-semibold text-[var(--text)]">{{ dependencyCount }}</p>
        </div>
      </section>
    </Transition>

    <div v-if="scanError" class="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
      {{ scanError }}
    </div>
    <div v-if="parseWarning" class="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
      {{ parseWarning }}
    </div>

    <section v-if="tab === 'overview'" class="grid gap-5 xl:grid-cols-[1fr_22rem]">
      <main class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
        <div class="flex items-center justify-between border-b border-[var(--border)] p-4">
          <div>
            <h2 class="text-sm font-semibold text-[var(--text)]">Security Overview</h2>
            <p class="mt-0.5 text-xs text-[var(--text-muted)]">Current vulnerability posture for the selected project.</p>
          </div>
          <ShieldCheck class="size-4 text-emerald-300" />
        </div>
        <div class="grid gap-3 p-4 md:grid-cols-2">
          <button class="rounded-lg border border-[var(--border)] bg-black/10 p-4 text-left hover:bg-white/[0.05]" @click="emit('changeTab', 'scanner')">
            <Bot class="size-4 text-emerald-300" />
            <h3 class="mt-3 text-sm font-semibold text-[var(--text)]">AI Vulnerability Scan</h3>
            <p class="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">{{ scanStatusText }}</p>
          </button>
          <button class="rounded-lg border border-[var(--border)] bg-black/10 p-4 text-left hover:bg-white/[0.05]" @click="emit('changeTab', 'findings')">
            <AlertTriangle class="size-4 text-red-300" />
            <h3 class="mt-3 text-sm font-semibold text-[var(--text)]">Remediation Queue</h3>
            <p class="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">{{ security.findings.length }} tracked finding{{ security.findings.length === 1 ? '' : 's' }}.</p>
          </button>
          <button class="rounded-lg border border-[var(--border)] bg-black/10 p-4 text-left hover:bg-white/[0.05]" @click="emit('changeTab', 'dependencies')">
            <PackageSearch class="size-4 text-violet-300" />
            <h3 class="mt-3 text-sm font-semibold text-[var(--text)]">Dependencies</h3>
            <p class="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">{{ dependencyInventory.length }} package{{ dependencyInventory.length === 1 ? '' : 's' }} indexed.</p>
          </button>
          <button class="rounded-lg border border-[var(--border)] bg-black/10 p-4 text-left hover:bg-white/[0.05]" @click="emit('changeTab', 'secrets')">
            <KeyRound class="size-4 text-amber-300" />
            <h3 class="mt-3 text-sm font-semibold text-[var(--text)]">Secrets</h3>
            <p class="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">{{ secretFindings.length }} active secret finding{{ secretFindings.length === 1 ? '' : 's' }}.</p>
          </button>
        </div>
      </main>
      <aside class="space-y-5">
        <section class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <div class="flex items-center gap-2">
            <FileSearch class="size-3.5 text-sky-300" />
            <h2 class="text-sm font-semibold text-[var(--text)]">Config Checks</h2>
          </div>
          <div class="mt-3 space-y-2">
            <div v-for="check in configChecks" :key="check.label" class="rounded-lg border border-[var(--border)] bg-black/10 px-3 py-2">
              <div class="flex items-center justify-between gap-2">
                <p class="text-xs font-medium text-[var(--text)]">{{ check.label }}</p>
                <span class="text-[10px] font-medium capitalize" :class="check.status === 'ok' ? 'text-emerald-300' : check.status === 'warning' ? 'text-amber-300' : 'text-indigo-300'">{{ check.status }}</span>
              </div>
              <p class="mt-1 text-[10px] leading-relaxed text-[var(--text-muted)]">{{ check.detail }}</p>
            </div>
          </div>
        </section>
      </aside>
    </section>

    <section v-else-if="tab === 'scanner'" class="grid gap-5" :class="(scanActivity.length || aiScanRunning || ossRunning || showHistoryDrawer) ? 'xl:grid-cols-[1fr_18rem]' : 'xl:grid-cols-1'">
      <main class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
        <div class="border-b border-[var(--border)] p-4">
          <!-- Title row -->
          <h2 class="text-sm font-semibold text-[var(--text)]">AI Scanner</h2>
          <p class="mt-0.5 text-xs text-[var(--text-muted)] leading-relaxed">{{ activeScan?.summary || 'Run an AI scan against this project to collect vulnerability findings.' }}</p>
          <!-- Action buttons — always on their own row so the description is never squished -->
          <div class="mt-3 flex flex-wrap gap-2">
            <button class="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer" :disabled="!canRunAIScan" @click="openAIScanPicker">
              <Loader2 v-if="aiScanRunning" class="size-3.5 animate-spin" />
              <Bot v-else class="size-3.5" />
              {{ aiScanRunning ? 'AI Scanning…' : 'Run AI Scan' }}
            </button>
            <button v-if="aiScanRunning" class="inline-flex items-center gap-1.5 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300 hover:bg-red-500/18 transition-colors cursor-pointer" @click="cancelScan">
              <X class="size-3.5" />
              Cancel Scan
            </button>
            <button class="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-3 py-2 text-xs font-medium text-indigo-200 hover:bg-indigo-500/15 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer" :disabled="!canExportDocs" @click="openExportModal">
              <Loader2 v-if="exportingDocs" class="size-3.5 animate-spin" />
              <Download v-else class="size-3.5" />
              Export
            </button>
            <button
              class="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors cursor-pointer"
              :class="showHistoryDrawer
                ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/15'
                : 'border-white/10 bg-white/[0.04] text-[var(--text-muted)] hover:bg-white/[0.07] hover:text-[var(--text)]'"
              :title="showHistoryDrawer ? 'Hide history' : 'Show scan history'"
              @click="showHistoryDrawer = !showHistoryDrawer"
            >
              <History class="size-3.5" />
              History
              <span v-if="security.scans.length" class="ml-0.5 tabular-nums text-[10px] opacity-70">{{ security.scans.length }}</span>
            </button>
          </div>
          <!-- Inline scan config + stack + OSS status chips -->
          <div class="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span class="rounded-md border border-[var(--border)] bg-black/10 px-2 py-0.5 text-[10px]" :class="securityToolAccentClass(selectedAITool)">{{ selectedAIToolLabel }}</span>
            <span class="rounded-md border border-indigo-500/20 bg-indigo-500/[0.06] px-2 py-0.5 text-[10px] text-indigo-300">{{ selectedEffortOption.label }}</span>
            <!-- Detected stack badges -->
            <span
              v-for="item in detectedStack"
              :key="item.language"
              class="rounded-md border px-2 py-0.5 text-[10px] font-medium"
              :class="[item.border, item.bg, item.color]"
            >{{ item.language }} · {{ item.manager }}</span>
            <span v-if="!detectedStack.length" class="rounded-md border border-[var(--border)] bg-black/10 px-2 py-0.5 text-[10px] text-[var(--text-faint)] truncate max-w-xs" :title="project.absolutePath">{{ project.name }}</span>
            <template v-for="tool in ossTools" :key="tool.name">
              <span
                v-if="tool.status !== 'idle'"
                class="flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] transition-colors"
                :class="tool.status === 'running' ? 'border-sky-500/20 bg-sky-500/[0.06] text-sky-300'
                  : tool.status === 'done' && tool.count > 0 ? 'border-amber-500/20 bg-amber-500/[0.06] text-amber-300'
                  : tool.status === 'done' ? 'border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-300'
                  : tool.status === 'skipped' ? 'border-[var(--border)] text-[var(--text-faint)]'
                  : 'border-red-500/20 text-red-400'"
              >
                <Loader2 v-if="tool.status === 'running'" class="size-2.5 animate-spin" />
                {{ tool.name }}: {{ ossToolStatusLabel(tool) }}
              </span>
            </template>
          </div>
        </div>

        <div v-if="scanFindings.length" class="border-b border-[var(--border)] px-4 py-3">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p class="text-xs text-[var(--text-muted)]">{{ selectedScanFindings.length }} of {{ scanFindings.length }} selected for remediation</p>
            <button class="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50" :disabled="!selectedScanFindings.length || creatingRemediation" @click="createRemediationItems">
              <Loader2 v-if="creatingRemediation" class="size-3.5 animate-spin" />
              <Plus v-else class="size-3.5" />
              Create remediation items
            </button>
          </div>
        </div>

        <div class="divide-y divide-[var(--border)]">
          <article v-for="finding in filteredScanFindings" :key="finding.id" class="px-4 py-4">
            <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <NuxtLink :to="scanFindingRoute(finding)" class="min-w-0 rounded-lg outline-none transition-colors hover:bg-white/[0.03] focus-visible:ring-2 focus-visible:ring-indigo-500/40">
                <div class="flex flex-wrap items-center gap-2">
                  <span
                    role="checkbox"
                    tabindex="0"
                    :aria-checked="finding.selected"
                    class="grid size-4 shrink-0 place-items-center rounded-md border transition-colors"
                    :class="finding.selected ? 'border-indigo-400 bg-indigo-500 text-white shadow-[0_0_14px_rgba(99,102,241,0.3)]' : 'border-white/15 bg-white/[0.04] text-transparent hover:border-indigo-400/50'"
                    @click.stop.prevent="finding.selected = !finding.selected"
                    @keydown.space.stop.prevent="finding.selected = !finding.selected"
                  >
                    <Check class="size-3" stroke-width="3" />
                  </span>
                  <span class="font-mono text-[10px] text-[var(--text-faint)]">{{ finding.id }}</span>
                  <span class="rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize" :class="severityClasses[finding.severity]">{{ finding.severity }}</span>
                  <span class="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">{{ finding.category }}</span>
                  <span v-if="isAlreadyRemediated(finding)" class="flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                    <CheckCircle2 class="size-2.5" />
                    In Findings
                  </span>
                  <span v-else-if="isAlreadyWhitelisted(finding)" class="flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                    <ShieldMinus class="size-2.5" />
                    Whitelisted
                  </span>
                </div>
                <h3 class="mt-2 text-sm font-semibold text-[var(--text)]">{{ finding.title }}</h3>
                <p class="mt-1 line-clamp-3 break-words text-xs leading-relaxed text-[var(--text-muted)]">{{ finding.detail }}</p>
                <p v-if="finding.evidence" class="mt-2 line-clamp-2 break-words text-[11px] leading-relaxed text-[var(--text-faint)]">{{ finding.evidence }}</p>
              </NuxtLink>
              <div class="rounded-lg border border-[var(--border)] bg-black/10 px-3 py-2 lg:w-52">
                <p class="text-[10px] uppercase tracking-wider text-[var(--text-faint)]">Area</p>
                <p class="mt-1 truncate text-xs text-[var(--text-muted)]">{{ finding.area }}</p>
              </div>
            </div>
            <div class="mt-3 flex items-start gap-2">
              <div class="flex-1 flex items-start gap-2 rounded-lg border border-indigo-500/15 bg-indigo-500/[0.06] p-3">
                <CheckCircle2 class="mt-0.5 size-3.5 shrink-0 text-indigo-300" />
                <p class="text-xs leading-relaxed text-[var(--text-muted)]">{{ finding.recommendation }}</p>
              </div>
              <button
                class="flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors"
                :class="isAlreadyWhitelisted(finding)
                  ? 'cursor-default border-amber-500/20 bg-amber-500/[0.08] text-amber-400 opacity-70'
                  : 'border-[var(--border)] text-[var(--text-faint)] hover:border-amber-500/30 hover:bg-amber-500/[0.06] hover:text-amber-300'"
                :title="isAlreadyWhitelisted(finding) ? 'Already whitelisted — AI will skip this finding in future scans' : 'Add to whitelist — AI skips this in future scans'"
                :disabled="isAlreadyWhitelisted(finding)"
                @click.stop.prevent="whitelistFinding(finding)"
              >
                <ShieldMinus class="size-3.5" />
                {{ isAlreadyWhitelisted(finding) ? 'Whitelisted' : 'Whitelist' }}
              </button>
            </div>
          </article>

          <div v-if="aiScanRunning" class="px-4 py-14 text-center">
            <Loader2 class="mx-auto size-5 animate-spin text-emerald-300" />
            <p class="mt-3 text-sm text-[var(--text-muted)]">{{ scanStatusText }}</p>
            <p class="mt-1 text-xs text-[var(--text-faint)]">{{ scanActivity[activeScanStage]?.detail ?? 'The AI agent is reviewing the project for security findings.' }}</p>
          </div>
          <div v-else-if="!scanFindings.length" class="px-4 py-14 text-center">
            <p class="text-sm text-[var(--text-muted)]">No AI scan findings yet. Run AI Scan to analyze this project.</p>
          </div>
        </div>
      </main>

      <aside v-if="scanActivity.length || aiScanRunning || ossRunning || showHistoryDrawer" class="space-y-4">
        <!-- Scan Activity (shows during/after a scan) -->
        <section v-if="scanActivity.length || aiScanRunning || ossRunning" class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <Bot class="size-3.5 text-emerald-300" />
              <h2 class="text-sm font-semibold text-[var(--text)]">Scan Activity</h2>
            </div>
            <span class="font-mono text-[10px] text-[var(--text-faint)]">{{ scanElapsedLabel }}</span>
          </div>
          <div class="mt-3 space-y-1.5">
            <div v-for="item in scanActivity" :key="item.id" class="rounded-lg border px-3 py-2" :class="scanActivityClasses[item.status]">
              <div class="flex items-center justify-between gap-2">
                <p class="text-xs font-medium">{{ item.label }}</p>
                <span class="text-[10px] font-medium capitalize">{{ item.status }}</span>
              </div>
              <p class="mt-1 text-[10px] leading-relaxed opacity-75">{{ item.detail }}</p>
            </div>
          </div>

          <!-- OSS scanner progress (when running) -->
          <template v-if="ossRunning || ossTools.some(t => t.status !== 'idle')">
            <p class="mt-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">Scanners</p>
            <div class="space-y-1.5">
              <div v-for="tool in ossTools" :key="tool.name" class="flex items-center justify-between rounded-lg border border-[var(--border)] bg-black/10 px-3 py-1.5">
                <div class="flex items-center gap-1.5">
                  <PackageSearch class="size-3 shrink-0 text-[var(--text-faint)]" />
                  <span class="text-xs text-[var(--text-muted)]">{{ tool.name }}</span>
                </div>
                <span class="flex items-center gap-1 text-[10px]" :class="ossToolStatusClass(tool)">
                  <Loader2 v-if="tool.status === 'running'" class="size-2.5 animate-spin" />
                  {{ ossToolStatusLabel(tool) }}
                </span>
              </div>
            </div>
          </template>
        </section>

        <!-- History drawer -->
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 -translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-2"
        >
          <section v-if="showHistoryDrawer" class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
            <!-- History header -->
            <div class="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3">
              <History class="size-3.5 text-indigo-300 shrink-0" />
              <h2 class="flex-1 text-sm font-semibold text-[var(--text)]">Scan History</h2>
              <button
                v-if="security.scans.length"
                class="size-6 grid place-items-center rounded text-[var(--text-faint)] hover:text-red-300 hover:bg-red-500/10 transition-colors"
                title="Clear history"
                @click="clearScanHistory"
              >
                <Trash2 class="size-3" />
              </button>
              <button
                class="size-6 grid place-items-center rounded text-[var(--text-faint)] hover:text-[var(--text)] hover:bg-white/[0.06] transition-colors"
                title="Close history"
                @click="showHistoryDrawer = false"
              >
                <X class="size-3" />
              </button>
            </div>

            <!-- History list -->
            <div v-if="security.scans.length" class="divide-y divide-[var(--border)]">
              <button
                v-for="scan in security.scans"
                :key="scan.id"
                class="w-full px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
                :class="scan.id === activeScanId ? 'bg-indigo-500/[0.07]' : ''"
                @click="activeScanId = scan.id"
              >
                <div class="flex items-center justify-between gap-2">
                  <div
                    class="size-1.5 rounded-full shrink-0"
                    :class="scan.id === activeScanId ? 'bg-indigo-400' : 'bg-[var(--border)]'"
                  />
                  <span class="flex-1 truncate text-[11px] font-medium text-[var(--text)]">
                    {{ new Date(scan.scannedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
                  </span>
                  <span class="shrink-0 rounded-full border border-[var(--border)] px-1.5 py-px text-[9px] text-[var(--text-faint)] tabular-nums">{{ scan.findings.length }}</span>
                </div>
                <p class="mt-1 line-clamp-2 pl-3.5 text-[10px] leading-relaxed text-[var(--text-muted)]">{{ scan.summary || scan.parseWarning || 'No summary captured.' }}</p>
              </button>
            </div>
            <div v-else class="px-4 py-10 text-center">
              <FileJson class="mx-auto size-5 text-[var(--text-faint)]" />
              <p class="mt-2 text-xs text-[var(--text-muted)]">No saved scans yet.</p>
            </div>
          </section>
        </Transition>
      </aside>
    </section>

    <section v-else-if="tab === 'findings'" class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
      <div class="flex flex-col gap-3 border-b border-[var(--border)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-sm font-semibold text-[var(--text)]">Security Findings</h2>
          <p class="mt-0.5 text-xs text-[var(--text-muted)]">Remediation items created from scans and local checks.</p>
        </div>
        <label class="relative w-full sm:w-72">
          <Search class="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[var(--text-faint)]" />
          <input v-model="query" class="h-9 w-full rounded-lg border border-[var(--border)] bg-black/10 pl-9 pr-3 text-xs text-[var(--text)] outline-none placeholder:text-[var(--text-faint)] focus:border-indigo-500/40" placeholder="Search findings">
        </label>
      </div>

      <!-- Bulk action bar -->
      <Transition
        enter-active-class="transition-all duration-150 ease-out"
        enter-from-class="opacity-0 -translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-100 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-1"
      >
        <div v-if="selectedFindingIds.size > 0" class="flex flex-wrap items-center gap-2 border-b border-[var(--border)] bg-indigo-500/[0.05] px-4 py-2.5">
          <span class="text-xs font-semibold text-indigo-300">{{ selectedFindingIds.size }} selected</span>
          <div class="flex items-center gap-1.5 ml-2">
            <select
              v-model="bulkActionStatus"
              class="h-7 rounded-md border border-[var(--border)] bg-black/20 px-2 text-[11px] text-[var(--text)] outline-none"
            >
              <option value="">Change status…</option>
              <option v-for="s in statusOptions" :key="s" :value="s">{{ s.replace('_', ' ') }}</option>
            </select>
            <button
              :disabled="!bulkActionStatus"
              class="inline-flex items-center gap-1 rounded-md border border-indigo-500/25 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-medium text-indigo-300 hover:bg-indigo-500/18 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              @click="applyBulkStatus"
            >
              <Check class="size-3" /> Apply
            </button>
          </div>
          <button class="inline-flex items-center gap-1 rounded-md border border-amber-500/25 bg-amber-500/8 px-2.5 py-1 text-[11px] font-medium text-amber-300 hover:bg-amber-500/15 cursor-pointer transition-colors" @click="applyBulkWhitelist">
            <ShieldMinus class="size-3" /> Whitelist
          </button>
          <button class="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-[var(--text-muted)] hover:bg-white/[0.07] cursor-pointer transition-colors" @click="copyBulkFixPrompts">
            <Clipboard class="size-3" /> Copy Prompts
          </button>
          <button class="ml-auto text-[10px] text-[var(--text-faint)] hover:text-[var(--text-muted)] cursor-pointer" @click="() => { selectedFindingIds = new Set() }">
            Clear selection
          </button>
        </div>
      </Transition>

      <div class="divide-y divide-[var(--border)]">
        <!-- Select-all row -->
        <div v-if="filteredFindings.length" class="flex items-center gap-2.5 px-4 py-2 bg-black/5">
          <input
            type="checkbox"
            class="rounded border-[var(--border)] accent-indigo-500 cursor-pointer"
            :checked="selectedFindingIds.size === filteredFindings.length && filteredFindings.length > 0"
            :indeterminate="selectedFindingIds.size > 0 && selectedFindingIds.size < filteredFindings.length"
            @change="toggleSelectAll"
          />
          <span class="text-[10px] text-[var(--text-faint)]">Select all</span>
        </div>
        <article v-for="finding in filteredFindings" :key="finding.id" class="px-4 py-4" :class="selectedFindingIds.has(finding.id) ? 'bg-indigo-500/[0.04]' : ''">
          <div class="flex items-start gap-3">
            <input
              type="checkbox"
              class="mt-1 rounded border-[var(--border)] accent-indigo-500 cursor-pointer shrink-0"
              :checked="selectedFindingIds.has(finding.id)"
              @change="toggleFindingSelect(finding.id)"
            />
            <div class="flex-1 min-w-0">
              <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <NuxtLink :to="remediationFindingRoute(finding)" class="min-w-0 rounded-lg outline-none transition-colors hover:bg-white/[0.03] focus-visible:ring-2 focus-visible:ring-indigo-500/40">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="font-mono text-[10px] text-[var(--text-faint)]">SEC-{{ finding.number }}</span>
                    <span class="rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize" :class="severityClasses[finding.severity]">{{ finding.severity }}</span>
                    <span class="rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize" :class="statusClasses[finding.status]">{{ finding.status.replace('_', ' ') }}</span>
                    <span class="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">{{ finding.source.replace('_', ' ') }}</span>
                    <span class="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">{{ finding.category }}</span>
                  </div>
                  <h3 class="mt-2 text-sm font-semibold text-[var(--text)]">{{ finding.title }}</h3>
                  <p class="mt-1 line-clamp-3 break-words text-xs leading-relaxed text-[var(--text-muted)]">{{ finding.detail }}</p>
                  <p v-if="finding.evidence" class="mt-2 line-clamp-2 break-words text-[11px] leading-relaxed text-[var(--text-faint)]">{{ finding.evidence }}</p>
                </NuxtLink>
                <div class="space-y-2 lg:w-56">
                  <select class="h-9 w-full rounded-lg border border-[var(--border)] bg-black/20 px-2 text-xs text-[var(--text)] outline-none" :value="finding.status" @change="updateFindingStatus(finding, ($event.target as HTMLSelectElement).value as SecurityFindingStatus)">
                    <option v-for="status in statusOptions" :key="status" :value="status">{{ status.replace('_', ' ') }}</option>
                  </select>
                  <div class="rounded-lg border border-[var(--border)] bg-black/10 px-3 py-2">
                    <p class="text-[10px] uppercase tracking-wider text-[var(--text-faint)]">Area</p>
                    <p class="mt-1 truncate text-xs text-[var(--text-muted)]">{{ finding.area }}</p>
                  </div>
                  <button v-if="auth.isGitHubConnected" class="flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-[var(--text-muted)] transition-colors hover:border-white/20 hover:bg-white/[0.07] hover:text-[var(--text)]" @click="openGitHubIssueModal(finding)">
                    <Github class="size-3.5" />
                    Create Issue
                  </button>
                  <button class="flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-[var(--text-muted)] transition-colors hover:border-white/20 hover:bg-white/[0.07] hover:text-[var(--text)]" @click="copyFixPrompt(finding)">
                    <Clipboard class="size-3.5" />
                    Copy Fix Prompt
                  </button>
                  <button class="flex w-full items-center justify-center gap-1.5 rounded-lg border border-violet-500/20 bg-violet-500/[0.06] px-3 py-2 text-xs font-medium text-violet-300 transition-colors hover:border-violet-500/35 hover:bg-violet-500/10" @click="openValidateModal(finding)">
                    <FlaskConical class="size-3.5" />
                    Validate Fix
                  </button>
                </div>
              </div>
              <div class="mt-3 flex items-start gap-2 rounded-lg border border-indigo-500/15 bg-indigo-500/[0.06] p-3">
                <CheckCircle2 class="mt-0.5 size-3.5 shrink-0 text-indigo-300" />
                <p class="text-xs leading-relaxed text-[var(--text-muted)]">{{ finding.recommendation }}</p>
              </div>
            </div>
          </div>
        </article>
        <div v-if="!filteredFindings.length" class="px-4 py-14 text-center text-sm text-[var(--text-muted)]">No remediation items yet.</div>
      </div>
    </section>

    <section v-else-if="tab === 'dependencies'" class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
      <div class="flex items-center justify-between gap-3 border-b border-[var(--border)] p-4">
        <div>
          <h2 class="text-sm font-semibold text-[var(--text)]">Dependencies</h2>
          <p class="mt-0.5 text-xs text-[var(--text-muted)]">Manifest inventory for Node, Rust, .NET, Python, Go, Java, PHP, and Ruby projects.</p>
        </div>
        <button class="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/20 bg-violet-500/10 px-3 py-2 text-xs font-medium text-violet-200 hover:bg-violet-500/15" @click="scanDependencies()">
          <Loader2 v-if="dependencyLoading" class="size-3.5 animate-spin" />
          <PackageSearch v-else class="size-3.5" />
          Refresh
        </button>
      </div>
      <div class="divide-y divide-[var(--border)]">
        <article v-for="item in dependencyInventory" :key="`${item.manifest}:${item.name}`" class="grid gap-2 px-4 py-3 text-xs md:grid-cols-[1fr_8rem_9rem]">
          <div class="min-w-0">
            <p class="truncate font-medium text-[var(--text)]">{{ item.name }}</p>
            <p class="mt-0.5 truncate text-[10px] text-[var(--text-faint)]">{{ item.manifest }}</p>
          </div>
          <p class="font-mono text-[var(--text-muted)]">{{ item.version }}</p>
          <p class="text-[var(--text-faint)]">{{ item.type }}</p>
        </article>
        <div v-if="dependencyLoading && !dependencyInventory.length" class="px-4 py-14 text-center text-sm text-[var(--text-muted)]">Indexing package manifests...</div>
        <div v-else-if="!dependencyInventory.length" class="px-4 py-14 text-center text-sm text-[var(--text-muted)]">No package manifests indexed yet.</div>
      </div>
    </section>

    <section v-else-if="tab === 'secrets'" class="space-y-4">

      <!-- ── .env File Viewer ─────────────────────────────────────────────── -->
      <div class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
        <div class="flex items-center justify-between gap-3 border-b border-[var(--border)] p-4">
          <div>
            <h2 class="text-sm font-semibold text-[var(--text)]">Environment Variables</h2>
            <p class="mt-0.5 text-xs text-[var(--text-muted)]">All <code class="rounded bg-black/20 px-1">.env*</code> files found in this project. Values are redacted by default.</p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button
              class="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-black/10 px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
              @click="redactAll = !redactAll"
            >
              <EyeOff v-if="redactAll" class="size-3.5" />
              <Eye v-else class="size-3.5" />
              {{ redactAll ? 'Reveal all' : 'Redact all' }}
            </button>
            <button
              class="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-3 py-2 text-xs font-medium text-indigo-200 hover:bg-indigo-500/15 transition-colors cursor-pointer"
              :disabled="envLoading"
              @click="scanEnvFiles"
            >
              <Loader2 v-if="envLoading" class="size-3.5 animate-spin" />
              <FolderOpen v-else class="size-3.5" />
              Scan .env files
            </button>
          </div>
        </div>

        <div v-if="envLoading" class="px-4 py-10 text-center text-sm text-[var(--text-muted)]">
          <Loader2 class="mx-auto size-4 animate-spin mb-2 text-indigo-300" />
          Scanning for .env files…
        </div>
        <div v-else-if="envFiles.length" class="divide-y divide-[var(--border)]">
          <div v-for="ef in envFiles" :key="ef.path">
            <!-- File header -->
            <div class="flex items-center gap-2 px-4 py-2.5 bg-black/10">
              <FileText class="size-3.5 shrink-0 text-amber-300/70" />
              <span class="font-mono text-[11px] text-amber-200/80">{{ ef.relPath }}</span>
              <span class="ml-auto text-[10px] text-[var(--text-faint)]">{{ ef.vars.length }} variable{{ ef.vars.length !== 1 ? 's' : '' }}</span>
            </div>
            <!-- Variable rows -->
            <div class="divide-y divide-[var(--border)]/50">
              <div
                v-for="v in ef.vars"
                :key="v.key"
                class="flex items-center gap-3 px-4 py-2 font-mono text-xs hover:bg-white/[0.02] transition-colors"
              >
                <span class="w-56 shrink-0 truncate text-[var(--text)]">{{ v.key }}</span>
                <span class="flex-1 truncate" :class="(v.redacted && redactAll) ? 'text-[var(--text-faint)] select-none' : 'text-emerald-300/80'">
                  {{ (v.redacted && redactAll) ? '••••••••••••' : v.value || '(empty)' }}
                </span>
                <button
                  class="size-6 shrink-0 grid place-items-center rounded text-[var(--text-faint)] hover:text-[var(--text)] transition-colors cursor-pointer"
                  :title="v.redacted ? 'Reveal value' : 'Redact value'"
                  @click="v.redacted = !v.redacted"
                >
                  <EyeOff v-if="v.redacted" class="size-3" />
                  <Eye v-else class="size-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="px-4 py-10 text-center text-sm text-[var(--text-muted)]">
          Click "Scan .env files" to find and inspect environment files in this project.
        </div>
      </div>

      <!-- ── Pattern-based Secret Scan ─────────────────────────────────────── -->
      <div class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
        <div class="flex items-center justify-between gap-3 border-b border-[var(--border)] p-4">
          <div>
            <h2 class="text-sm font-semibold text-[var(--text)]">Secret Pattern Scan</h2>
            <p class="mt-0.5 text-xs text-[var(--text-muted)]">Scans source files for leaked credentials, tokens, and private keys.</p>
          </div>
          <button
            class="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-200 hover:bg-amber-500/15 transition-colors cursor-pointer"
            :disabled="secretsLoading"
            @click="scanSecrets()"
          >
            <Loader2 v-if="secretsLoading" class="size-3.5 animate-spin" />
            <KeyRound v-else class="size-3.5" />
            Scan
          </button>
        </div>

        <!-- Pending results with review UI -->
        <div v-if="secretScanDone && pendingSecretFindings.length" class="p-4 space-y-4">
          <div class="flex items-center justify-between gap-3">
            <p class="text-xs text-amber-300 font-medium">
              {{ pendingSecretFindings.filter(f => f.selected).length }} of {{ pendingSecretFindings.length }} selected — review before adding to Findings.
            </p>
            <div class="flex items-center gap-2">
              <button
                class="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/25 bg-amber-500/8 px-3 py-1.5 text-xs font-medium text-amber-200 hover:bg-amber-500/15 transition-colors cursor-pointer disabled:opacity-40"
                :disabled="!pendingSecretFindings.some(f => f.selected)"
                @click="addPendingSecretsToFindings"
              >
                <Plus class="size-3.5" /> Add selected to Findings
              </button>
            </div>
          </div>

          <div class="space-y-3">
            <div
              v-for="finding in pendingSecretFindings"
              :key="finding.id"
              class="rounded-xl border p-4 transition-colors"
              :class="finding.selected
                ? 'border-amber-500/25 bg-amber-500/[0.06]'
                : 'border-[var(--border)] bg-black/5 opacity-60'"
            >
              <div class="flex items-start gap-3">
                <input
                  type="checkbox"
                  class="mt-0.5 rounded accent-amber-400 cursor-pointer shrink-0"
                  :checked="finding.selected"
                  @change="finding.selected = !finding.selected"
                />
                <div class="flex-1 min-w-0">
                  <div class="flex flex-wrap items-center gap-2 mb-1.5">
                    <span class="rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize" :class="severityClasses[finding.severity]">{{ finding.severity }}</span>
                    <span class="text-[10px] text-[var(--text-faint)]">{{ finding.category }}</span>
                    <span class="text-[10px] font-mono text-[var(--text-faint)]">{{ finding.area }}</span>
                  </div>
                  <p class="text-xs font-semibold text-[var(--text)]">{{ finding.title }}</p>
                  <p class="mt-1 text-[11px] leading-relaxed text-[var(--text-muted)]">{{ finding.detail }}</p>
                  <pre class="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg border border-[var(--border)] bg-black/20 p-2.5 text-[10px] text-[var(--text-faint)]">{{ finding.evidence }}</pre>
                  <p class="mt-2 text-[11px] leading-relaxed text-indigo-300/70">{{ finding.recommendation }}</p>
                </div>
                <button
                  class="shrink-0 inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] text-[var(--text-faint)] hover:text-amber-300 hover:border-amber-500/25 hover:bg-amber-500/8 transition-colors cursor-pointer"
                  title="Whitelist — suppress on future scans"
                  @click="whitelistPendingSecret(finding)"
                >
                  <ShieldMinus class="size-3" /> Whitelist
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Clean scan result -->
        <div v-else-if="secretScanDone && !pendingSecretFindings.length" class="px-4 py-10 text-center">
          <ShieldCheck class="mx-auto size-5 text-emerald-300 mb-2" />
          <p class="text-sm text-[var(--text-muted)]">No secret patterns found.</p>
        </div>

        <!-- Not yet run -->
        <div v-else class="px-4 py-10 text-center text-sm text-[var(--text-muted)]">
          Click "Scan" to check source files for leaked credentials, API keys, and private key material.
        </div>
      </div>

    </section>

    <section v-else-if="tab === 'whitelist'" class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
      <div class="flex flex-col gap-3 border-b border-[var(--border)] p-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 class="text-sm font-semibold text-[var(--text)]">Whitelist</h2>
          <p class="mt-0.5 text-xs text-[var(--text-muted)]">Suppressed findings. The AI will not re-report these on future scans.</p>
        </div>
        <button
          v-if="security.whitelist.length"
          class="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-red-300 hover:border-red-500/25 hover:bg-red-500/[0.06] transition-colors"
          @click="security.whitelist.forEach(w => security.removeFromWhitelist(w.id))"
        >
          <Trash2 class="size-3.5" /> Clear all
        </button>
      </div>
      <div v-if="security.whitelist.length" class="divide-y divide-[var(--border)]">
        <div v-for="item in security.whitelist" :key="item.id" class="flex items-start gap-3 px-4 py-4">
          <ShieldMinus class="mt-0.5 size-3.5 shrink-0 text-amber-400/70" />
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-2 mb-1">
              <span class="rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">{{ item.category }}</span>
              <span class="text-[10px] text-[var(--text-faint)]">{{ item.area }}</span>
            </div>
            <p class="text-xs font-medium text-[var(--text)]">{{ item.title }}</p>
            <p class="mt-0.5 text-[10px] text-[var(--text-faint)]">Whitelisted {{ new Date(item.addedAt).toLocaleDateString() }}</p>
          </div>
          <button
            class="size-7 shrink-0 grid place-items-center rounded-lg border border-[var(--border)] text-[var(--text-faint)] hover:text-[var(--text)] hover:bg-white/[0.06] transition-colors"
            title="Remove from whitelist"
            @click="security.removeFromWhitelist(item.id)"
          >
            <X class="size-3.5" />
          </button>
        </div>
      </div>
      <div v-else class="px-4 py-14 text-center">
        <ShieldMinus class="mx-auto size-6 text-[var(--text-faint)]" />
        <p class="mt-3 text-sm font-medium text-[var(--text-muted)]">No whitelisted findings</p>
        <p class="mt-1.5 text-xs text-[var(--text-faint)] max-w-sm mx-auto leading-relaxed">
          Click <ShieldMinus class="inline size-3 mx-0.5" /> on any scan result to suppress it. The AI will skip whitelisted findings on future scans.
        </p>
      </div>
    </section>

    <section v-else-if="tab === 'reports'" class="space-y-5">
      <section class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <FileText class="size-4 text-indigo-300" />
            <div>
              <h2 class="text-sm font-semibold text-[var(--text)]">Reports</h2>
              <p class="mt-0.5 text-xs text-[var(--text-muted)]">Export the selected scan or current remediation queue.</p>
            </div>
          </div>
          <button class="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-3 py-2 text-xs font-medium text-indigo-200 hover:bg-indigo-500/15 disabled:cursor-not-allowed disabled:opacity-50" :disabled="!canExportDocs" @click="openExportModal">
            <Loader2 v-if="exportingDocs" class="size-3.5 animate-spin" />
            <Download v-else class="size-3.5" />
            Export DOCX
          </button>
        </div>
      </section>
      <section v-if="activeScan?.rawReport" ref="reportSection" class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <div class="flex items-center gap-2">
          <Terminal class="size-3.5 text-indigo-300" />
          <h2 class="text-sm font-semibold text-[var(--text)]">Latest AI Report</h2>
        </div>
        <pre class="mt-3 max-h-96 overflow-auto whitespace-pre-wrap rounded-lg border border-[var(--border)] bg-black/20 p-3 text-[11px] leading-relaxed text-[var(--text-muted)] custom-scroll">{{ activeScan.rawReport }}</pre>
      </section>
    </section>

    <section v-else-if="tab === 'github_issues'" class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
      <div class="flex flex-col gap-3 border-b border-[var(--border)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-2">
          <Github class="size-4 text-[var(--text-muted)]" />
          <div>
            <h2 class="text-sm font-semibold text-[var(--text)]">GitHub Issues</h2>
            <p v-if="project.githubRepo" class="mt-0.5 font-mono text-[10px] text-[var(--text-faint)]">{{ project.githubRepo }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <div class="flex rounded-lg border border-[var(--border)] text-xs overflow-hidden">
            <button v-for="f in (['open', 'closed', 'all'] as const)" :key="f" class="px-3 py-1.5 capitalize transition-colors" :class="ghIssuesFilter === f ? 'bg-white/[0.08] text-[var(--text)]' : 'text-[var(--text-faint)] hover:text-[var(--text-muted)]'" @click="ghIssuesFilter = f">{{ f }}</button>
          </div>
          <button class="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:bg-white/[0.05]" :disabled="ghIssuesLoading" @click="loadGitHubIssues(true)">
            <Loader2 v-if="ghIssuesLoading" class="size-3.5 animate-spin" />
            <History v-else class="size-3.5" />
            Refresh
          </button>
        </div>
      </div>

      <div v-if="!project.githubRepo" class="px-4 py-12 text-center">
        <Github class="mx-auto size-6 text-[var(--text-faint)]" />
        <p class="mt-3 text-sm font-medium text-[var(--text)]">No repository linked</p>
        <p class="mt-1 text-xs text-[var(--text-muted)]">Link a GitHub repository to this project to browse and create issues.</p>
        <div class="mx-auto mt-4 flex max-w-sm items-center gap-2">
          <input v-model="ghRepoInput" class="h-9 flex-1 rounded-lg border border-[var(--border)] bg-black/20 px-3 text-xs text-[var(--text)] outline-none placeholder:text-[var(--text-faint)] focus:border-white/20" placeholder="owner/repo or full GitHub URL" @keydown.enter="saveGitHubRepo">
          <button class="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.06] px-3 py-2 text-xs text-[var(--text-muted)] hover:bg-white/[0.1] disabled:opacity-40" :disabled="ghRepoSaving || !ghRepoInput.trim()" @click="saveGitHubRepo">
            <Loader2 v-if="ghRepoSaving" class="size-3.5 animate-spin" />
            <Check v-else class="size-3.5" />
            Save
          </button>
        </div>
        <p class="mt-2 text-[10px] text-[var(--text-faint)]">You can also set this in the Settings tab.</p>
      </div>

      <template v-else>
      <div v-if="ghIssuesError" class="m-4 rounded-lg border border-red-500/20 bg-red-500/[0.07] px-3 py-2.5 text-xs text-red-300">
        {{ ghIssuesError }}
      </div>

      <div v-else-if="ghIssuesLoading && !ghIssues.length" class="px-4 py-14 text-center text-sm text-[var(--text-muted)]">
        <Loader2 class="mx-auto size-5 animate-spin text-[var(--text-faint)]" />
        <p class="mt-3">Loading issues...</p>
      </div>

      <div v-else class="divide-y divide-[var(--border)]">
        <article v-for="issue in filteredGhIssues" :key="issue.number" class="flex items-start gap-3 px-4 py-4">
          <div class="mt-0.5 shrink-0">
            <div class="flex size-5 items-center justify-center rounded-full border text-[9px] font-bold" :class="issue.state === 'open' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-white/10 bg-white/[0.04] text-[var(--text-faint)]'">
              {{ issue.state === 'open' ? '●' : '✓' }}
            </div>
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-mono text-[10px] text-[var(--text-faint)]">#{{ issue.number }}</span>
              <span v-for="label in issue.labels" :key="label.name" class="rounded-full px-1.5 py-0.5 text-[9px] font-semibold" :style="{ backgroundColor: `#${label.color}22`, color: `#${label.color}`, borderColor: `#${label.color}44`, borderWidth: '1px', borderStyle: 'solid' }">{{ label.name }}</span>
            </div>
            <p class="mt-1 text-xs font-medium text-[var(--text)]">{{ issue.title }}</p>
            <p v-if="issue.body" class="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[var(--text-muted)]">{{ issue.body.replace(/\n+/g, ' ').trim() }}</p>
            <div class="mt-2 flex items-center gap-3 text-[10px] text-[var(--text-faint)]">
              <span v-if="issue.user">{{ issue.user.login }}</span>
              <span>opened {{ new Date(issue.createdAt).toLocaleDateString() }}</span>
              <a :href="issue.htmlUrl" target="_blank" class="flex items-center gap-0.5 hover:text-[var(--text-muted)]">
                <ExternalLink class="size-2.5" />
                View
              </a>
            </div>
          </div>
        </article>
        <div v-if="!filteredGhIssues.length && !ghIssuesLoading" class="px-4 py-14 text-center text-sm text-[var(--text-muted)]">
          No {{ ghIssuesFilter === 'all' ? '' : ghIssuesFilter + ' ' }}issues found.
        </div>
      </div>
      </template>
    </section>

    <section v-else-if="tab === 'settings'" class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <div class="flex items-center gap-2">
        <Settings class="size-4 text-indigo-300" />
        <h2 class="text-sm font-semibold text-[var(--text)]">Security Settings</h2>
      </div>
      <div class="mt-4 grid gap-4 md:grid-cols-3">
        <div class="rounded-lg border border-[var(--border)] bg-black/10 p-4">
          <span class="text-xs font-medium text-[var(--text)]">Automatic scan</span>
          <button
            type="button"
            class="mt-2 flex items-center gap-2 text-left text-xs text-[var(--text-muted)]"
            @click="security.updateSettings({ autoScanEnabled: !security.settings.autoScanEnabled })"
          >
            <span
              class="grid size-4 shrink-0 place-items-center rounded-md border transition-colors"
              :class="security.settings.autoScanEnabled ? 'border-indigo-400 bg-indigo-500 text-white shadow-[0_0_14px_rgba(99,102,241,0.3)]' : 'border-white/15 bg-white/[0.04] text-transparent hover:border-indigo-400/50'"
            >
              <Check class="size-3" stroke-width="3" />
            </span>
            Refresh existing scans when stale
          </button>
        </div>
        <label class="rounded-lg border border-[var(--border)] bg-black/10 p-4">
          <span class="text-xs font-medium text-[var(--text)]">Stale after hours</span>
          <input :value="security.settings.autoScanStaleHours" type="number" min="1" class="mt-2 h-9 w-full rounded-lg border border-[var(--border)] bg-black/20 px-2 text-xs text-[var(--text)] outline-none" @change="security.updateSettings({ autoScanStaleHours: Number(($event.target as HTMLInputElement).value) || 24 })">
        </label>
        <label class="rounded-lg border border-[var(--border)] bg-black/10 p-4">
          <span class="text-xs font-medium text-[var(--text)]">Auto effort</span>
          <select :value="security.settings.autoScanEffort" class="mt-2 h-9 w-full rounded-lg border border-[var(--border)] bg-black/20 px-2 text-xs text-[var(--text)] outline-none" @change="security.updateSettings({ autoScanEffort: ($event.target as HTMLSelectElement).value as SecurityScanEffort })">
            <option value="low">Quick</option>
            <option value="medium">Balanced</option>
            <option value="high">Deep</option>
          </select>
        </label>
        <label class="rounded-lg border border-[var(--border)] bg-black/10 p-4 md:col-span-3">
          <span class="text-xs font-medium text-[var(--text)]">Default AI finding limit</span>
          <input :value="security.settings.aiFindingLimit" type="number" min="0" max="50" class="mt-2 h-9 w-full rounded-lg border border-[var(--border)] bg-black/20 px-2 text-xs text-[var(--text)] outline-none" @change="security.updateSettings({ aiFindingLimit: Math.max(0, Math.min(50, Math.floor(Number(($event.target as HTMLInputElement).value) || 0))) })">
          <span class="mt-2 block text-[10px] leading-relaxed text-[var(--text-faint)]">Use 0 to remove the explicit cap from the AI prompt. Manual scans can override this in the run modal.</span>
        </label>
      </div>

      <!-- GitHub integration -->
      <div v-if="auth.isGitHubConnected" class="mt-4 rounded-xl border border-[var(--border)] bg-black/10 p-4">
        <div class="flex items-center gap-2">
          <Github class="size-3.5 text-[var(--text-muted)]" />
          <span class="text-xs font-medium text-[var(--text)]">GitHub Repository</span>
        </div>
        <p class="mt-1 text-[11px] text-[var(--text-muted)]">Link a repository to enable issue creation and the Issues tab.</p>
        <div class="mt-2 flex items-center gap-2">
          <input v-model="ghRepoInput" class="h-9 flex-1 rounded-lg border border-[var(--border)] bg-black/20 px-3 text-xs text-[var(--text)] outline-none placeholder:text-[var(--text-faint)] focus:border-white/20" placeholder="owner/repo or full GitHub URL" @keydown.enter="saveGitHubRepo">
          <button class="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.06] px-3 py-2 text-xs text-[var(--text-muted)] hover:bg-white/[0.1] disabled:opacity-40" :disabled="ghRepoSaving" @click="saveGitHubRepo">
            <Loader2 v-if="ghRepoSaving" class="size-3.5 animate-spin" />
            <Check v-else class="size-3.5" />
            Save
          </button>
        </div>
      </div>

      <!-- Danger zone -->
      <div class="mt-5 rounded-xl border border-red-500/20 bg-red-500/[0.04] p-4 space-y-3">
        <p class="text-[10px] font-semibold uppercase tracking-[0.12em] text-red-400/70">Danger Zone</p>

        <div class="flex items-center justify-between gap-4 rounded-lg border border-red-500/10 bg-black/10 px-4 py-3">
          <div class="min-w-0">
            <p class="text-xs font-semibold text-[var(--text)]">Reset All Findings</p>
            <p class="mt-0.5 text-[11px] leading-relaxed text-[var(--text-muted)]">
              Permanently deletes all {{ security.findings.length }} finding{{ security.findings.length === 1 ? '' : 's' }} for this project. Scans and settings are kept.
            </p>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <Transition
              enter-active-class="transition-all duration-150"
              enter-from-class="opacity-0 translate-x-2"
              enter-to-class="opacity-100 translate-x-0"
            >
              <GlassCheckbox
                v-if="confirmClearFindings"
                v-model="confirmClearFindings"
                size="sm"
                class="text-[11px] text-red-200"
              >
                Confirm
              </GlassCheckbox>
            </Transition>
            <GlassButton
              size="sm"
              :class="confirmClearFindings
                ? 'border-red-500/40 bg-red-500/20 text-red-300 hover:bg-red-500/30'
                : 'border-red-500/25 bg-red-500/10 text-red-300 hover:bg-red-500/15'"
              :disabled="security.findings.length === 0"
              @click="confirmClearFindings ? clearAllFindingsConfirmed() : (confirmClearFindings = true)"
            >
              <Trash2 class="size-3.5" />
              {{ confirmClearFindings ? 'Yes, delete all' : 'Reset findings' }}
            </GlassButton>
          </div>
        </div>

        <div class="flex items-center justify-between gap-4 rounded-lg border border-red-500/10 bg-black/10 px-4 py-3">
          <div class="min-w-0">
            <p class="text-xs font-semibold text-[var(--text)]">Clear Scan History</p>
            <p class="mt-0.5 text-[11px] leading-relaxed text-[var(--text-muted)]">Removes all past scan records. Findings are not affected.</p>
          </div>
          <GlassButton
            size="sm"
            class="shrink-0 border-red-500/25 bg-red-500/10 text-red-300 hover:bg-red-500/15"
            :disabled="security.scans.length === 0"
            @click="security.clearScans(); notify('Scan history cleared.', 'success')"
          >
            <Trash2 class="size-3.5" />
            Clear history
          </GlassButton>
        </div>
      </div>
    </section>

    <GlassModal v-model="showToolPicker" title="Run AI Scan" max-width="md">
      <div class="space-y-4">
        <p class="text-sm text-[var(--text-muted)]">Choose the AI tool Vindicter should use for this security review.</p>
        <div class="grid grid-cols-2 gap-2">
          <button
            class="rounded-xl border p-3 text-left transition-colors"
            :class="[
              selectedAITool === 'codex' ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-[var(--border)] bg-black/10 hover:bg-white/[0.05]',
              !toolAvailability.codex.available && !toolAvailability.codex.checking ? 'opacity-50 cursor-not-allowed' : '',
            ]"
            :disabled="!toolAvailability.codex.available && !toolAvailability.codex.checking"
            @click="selectedAITool = 'codex'"
          >
            <div class="flex items-center gap-2 mb-2">
              <div class="size-6 shrink-0 grid place-items-center rounded-md border border-emerald-500/30 bg-emerald-500/15 text-[11px] font-bold text-emerald-200">C</div>
              <p class="text-xs font-semibold text-[var(--text)]">Codex</p>
              <span v-if="toolAvailability.codex.checking" class="ml-auto text-[8px] text-[var(--text-faint)]">…</span>
              <span v-else-if="toolAvailability.codex.available" class="ml-auto rounded-full border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-px text-[8px] font-semibold text-emerald-300">CLI</span>
              <span v-else class="ml-auto rounded-full border border-red-500/25 bg-red-500/10 px-1.5 py-px text-[8px] font-semibold text-red-300">Not found</span>
            </div>
            <p class="text-[10px] text-[var(--text-faint)] leading-relaxed">Read-only local code review via Codex CLI.</p>
          </button>
          <button
            class="rounded-xl border p-3 text-left transition-colors"
            :class="[
              selectedAITool === 'claude' ? 'border-violet-500/30 bg-violet-500/10' : 'border-[var(--border)] bg-black/10 hover:bg-white/[0.05]',
              !toolAvailability.claude.available && !toolAvailability.claude.checking ? 'opacity-50 cursor-not-allowed' : '',
            ]"
            :disabled="!toolAvailability.claude.available && !toolAvailability.claude.checking"
            @click="selectedAITool = 'claude'"
          >
            <div class="flex items-center gap-2 mb-2">
              <div class="size-6 shrink-0 grid place-items-center rounded-md border border-violet-500/30 bg-violet-500/15 text-[11px] font-bold text-violet-200">Cl</div>
              <p class="text-xs font-semibold text-[var(--text)]">Claude</p>
              <span v-if="toolAvailability.claude.checking" class="ml-auto text-[8px] text-[var(--text-faint)]">…</span>
              <span v-else-if="toolAvailability.claude.available" class="ml-auto rounded-full border border-violet-500/25 bg-violet-500/10 px-1.5 py-px text-[8px] font-semibold text-violet-300">CLI</span>
              <span v-else class="ml-auto rounded-full border border-red-500/25 bg-red-500/10 px-1.5 py-px text-[8px] font-semibold text-red-300">Not found</span>
            </div>
            <p class="text-[10px] text-[var(--text-faint)] leading-relaxed">Read-only local code review via Claude CLI.</p>
          </button>
          <button
            class="rounded-xl border p-3 text-left transition-colors"
            :class="[
              selectedAITool === 'openrouter' ? 'border-sky-500/30 bg-sky-500/10' : 'border-[var(--border)] bg-black/10 hover:bg-white/[0.05]',
              !toolAvailability.openrouter.available ? 'opacity-50 cursor-not-allowed' : '',
            ]"
            :disabled="!toolAvailability.openrouter.available"
            @click="selectedAITool = 'openrouter'"
          >
            <div class="flex items-center gap-2 mb-2">
              <div class="size-6 shrink-0 grid place-items-center rounded-md border border-sky-500/30 bg-sky-500/15 text-[11px] font-bold text-sky-200">OR</div>
              <p class="text-xs font-semibold text-[var(--text)]">OpenRouter</p>
            </div>
            <p class="text-[10px] leading-relaxed" :class="toolAvailability.openrouter.available ? 'text-sky-300' : 'text-amber-300'">
              {{ toolAvailability.openrouter.available ? app.openRouter.model : 'Configure API key in AI Models' }}
            </p>
          </button>
          <button
            class="rounded-xl border p-3 text-left transition-colors"
            :class="[
              selectedAITool === 'ollama' ? 'border-orange-500/30 bg-orange-500/10' : 'border-[var(--border)] bg-black/10 hover:bg-white/[0.05]',
              !toolAvailability.ollama.available ? 'opacity-50 cursor-not-allowed' : '',
            ]"
            :disabled="!toolAvailability.ollama.available"
            @click="selectedAITool = 'ollama'"
          >
            <div class="flex items-center gap-2 mb-2">
              <div class="size-6 shrink-0 grid place-items-center rounded-md border border-orange-500/30 bg-orange-500/15 text-[11px] font-bold text-orange-200">Ol</div>
              <p class="text-xs font-semibold text-[var(--text)]">Ollama</p>
            </div>
            <p class="text-[10px] leading-relaxed" :class="toolAvailability.ollama.available ? 'text-orange-300' : 'text-amber-300'">
              {{ toolAvailability.ollama.available ? app.ollama.model : 'Configure Ollama URL in AI Models' }}
            </p>
          </button>
        </div>
        <div class="space-y-2">
          <p class="text-xs font-medium text-[var(--text-muted)]">Effort Level</p>
          <div class="grid gap-2 sm:grid-cols-3">
            <button v-for="option in scanEffortOptions" :key="option.value" class="rounded-xl border px-3 py-3 text-left transition-colors" :class="selectedScanEffort === option.value ? 'border-indigo-500/35 bg-indigo-500/10' : 'border-[var(--border)] bg-black/10 hover:bg-white/[0.05]'" @click="selectedScanEffort = option.value">
              <div class="flex items-center justify-between gap-2">
                <p class="text-xs font-semibold text-[var(--text)]">{{ option.label }}</p>
                <span class="text-[10px] text-[var(--text-faint)]">{{ option.value }}</span>
              </div>
              <p class="mt-1 text-[10px] leading-relaxed text-[var(--text-muted)]">{{ option.detail }}</p>
              <p class="mt-2 text-[10px] font-medium text-indigo-300">{{ option.tokenNote }}</p>
            </button>
          </div>
        </div>
        <label class="block rounded-xl border border-[var(--border)] bg-black/10 p-3">
          <span class="text-xs font-medium text-[var(--text)]">Finding limit</span>
          <input v-model.number="selectedFindingLimit" type="number" min="0" max="50" class="mt-2 h-9 w-full rounded-lg border border-[var(--border)] bg-black/20 px-2 text-xs text-[var(--text)] outline-none">
          <span class="mt-2 block text-[10px] leading-relaxed text-[var(--text-faint)]">Set the maximum number of AI findings for this scan. Use 0 for no explicit cap.</span>
        </label>


        <div class="flex justify-end gap-2 border-t border-[var(--border)] pt-4">
          <button class="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)]" @click="showToolPicker = false">Cancel</button>
          <button class="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-50" :class="securityToolRunButtonClass(selectedAITool)" :disabled="!canRunAIScan" @click="openScopePicker">
            <FileSearch class="size-3.5" />
            Select Scope →
          </button>
        </div>
      </div>
    </GlassModal>

    <GlassModal v-model="showScopePicker" title="Select Scan Scope" max-width="lg">
      <div class="space-y-4">

        <!-- Git branch selector (only if git repo detected) -->
        <div v-if="isGitRepo" class="rounded-xl border border-[var(--border)] bg-black/10 px-4 py-3">
          <div class="flex items-center gap-2 mb-2">
            <Github class="size-3.5 shrink-0 text-emerald-400" />
            <p class="text-xs font-semibold text-[var(--text)]">Git Branch</p>
            <span class="ml-auto text-[10px] text-[var(--text-faint)]">{{ gitCurrentBranch ? `on ${gitCurrentBranch}` : 'detached HEAD' }}</span>
          </div>
          <select
            v-if="gitBranches.length"
            v-model="selectedBranch"
            class="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5 text-xs text-[var(--text)] outline-none focus:border-indigo-500/50"
          >
            <option v-for="b in gitBranches" :key="b" :value="b">{{ b }}{{ b === gitCurrentBranch ? ' (current)' : '' }}</option>
          </select>
          <p v-else class="text-[11px] text-[var(--text-muted)]">No local branches found — using working tree as-is.</p>
        </div>

        <!-- Scan all toggle -->
        <div class="flex items-center justify-between rounded-xl border border-[var(--border)] bg-black/10 px-4 py-3">
          <div>
            <p class="text-xs font-semibold text-[var(--text)]">Scan everything</p>
            <p class="mt-0.5 text-[11px] text-[var(--text-muted)]">Include all project files. Disable to select specific paths.</p>
          </div>
          <button
            class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors"
            :class="scopeScanAll ? 'bg-indigo-500' : 'bg-white/10'"
            @click="scopeScanAll = !scopeScanAll"
          >
            <span class="inline-block size-4 translate-x-0 rounded-full bg-white shadow transition-transform" :class="scopeScanAll ? 'translate-x-4' : 'translate-x-0'" />
          </button>
        </div>

        <!-- File tree -->
        <div v-if="!scopeScanAll" class="space-y-1">
          <div class="flex items-center justify-between">
            <p class="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-faint)]">Project paths</p>
            <div class="flex gap-2">
              <button class="text-[10px] text-indigo-400 hover:text-indigo-300" @click="scopeEntries.forEach(e => e.selected = true)">Select all</button>
              <span class="text-[10px] text-[var(--text-faint)]">·</span>
              <button class="text-[10px] text-[var(--text-faint)] hover:text-[var(--text-muted)]" @click="scopeEntries.forEach(e => e.selected = false)">None</button>
            </div>
          </div>

          <div v-if="scopeLoading" class="flex items-center gap-2 py-6 text-xs text-[var(--text-muted)]">
            <Loader2 class="size-3.5 animate-spin" /> Loading project structure...
          </div>

          <div v-else class="max-h-72 overflow-y-auto rounded-xl border border-[var(--border)] bg-black/10 custom-scroll">
            <label
              v-for="entry in scopeEntries"
              :key="entry.path"
              class="flex cursor-pointer items-center gap-2 border-b border-[var(--border)]/50 px-3 py-2 last:border-0 hover:bg-white/[0.03]"
              :style="{ paddingLeft: `${12 + entry.depth * 16}px` }"
            >
              <input
                type="checkbox"
                class="size-3.5 rounded accent-indigo-500"
                :checked="entry.selected"
                @change="entry.isDir ? toggleScopeParent(entry) : (entry.selected = !entry.selected)"
              >
              <FolderOpen v-if="entry.isDir" class="size-3.5 shrink-0 text-amber-400/70" />
              <FileText v-else class="size-3.5 shrink-0 text-[var(--text-faint)]" />
              <span class="truncate text-xs" :class="entry.selected ? 'text-[var(--text)]' : 'text-[var(--text-faint)] line-through'">{{ entry.name }}</span>
            </label>
            <div v-if="!scopeEntries.length && !scopeLoading" class="px-3 py-6 text-center text-xs text-[var(--text-muted)]">No files found.</div>
          </div>

          <p class="text-[10px] text-[var(--text-faint)]">
            {{ scopeEntries.filter(e => e.selected && e.depth === 0).length }} of {{ scopeEntries.filter(e => e.depth === 0).length }} top-level paths selected
          </p>
        </div>

        <div class="flex justify-end gap-2 border-t border-[var(--border)] pt-3">
          <button class="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)]" @click="showScopePicker = false; showToolPicker = true">← Back</button>
          <button
            class="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            :class="securityToolRunButtonClass(selectedAITool)"
            :disabled="!canRunAIScan || scopeLoading"
            @click="showScopePicker = false; showScanConfirm = true"
          >
            <FileSearch class="size-3.5" />
            Review & Confirm →
          </button>
        </div>
      </div>
    </GlassModal>

    <!-- ── Scan Confirmation Modal ───────────────────────────────────────── -->
    <GlassModal v-model="showScanConfirm" title="Confirm Scan" max-width="md">
      <div class="space-y-4">
        <p class="text-xs text-[var(--text-muted)]">Review your selections before starting the security scan.</p>

        <div class="space-y-2">
          <!-- AI Model -->
          <div class="flex items-center justify-between rounded-xl border border-[var(--border)] bg-black/10 px-4 py-3">
            <span class="text-xs text-[var(--text-muted)]">AI Model</span>
            <span class="text-xs font-semibold" :class="securityToolAccentClass(selectedAITool)">{{ selectedAIToolLabel }}</span>
          </div>

          <!-- Effort level -->
          <div class="flex items-center justify-between rounded-xl border border-[var(--border)] bg-black/10 px-4 py-3">
            <span class="text-xs text-[var(--text-muted)]">Effort Level</span>
            <div class="text-right">
              <span class="text-xs font-semibold text-indigo-300">{{ selectedEffortOption.label }}</span>
              <span class="ml-2 text-[10px] text-[var(--text-faint)]">{{ selectedEffortOption.tokenNote }}</span>
            </div>
          </div>

          <!-- Finding limit -->
          <div class="flex items-center justify-between rounded-xl border border-[var(--border)] bg-black/10 px-4 py-3">
            <span class="text-xs text-[var(--text-muted)]">Finding Limit</span>
            <span class="text-xs font-semibold text-[var(--text)]">{{ normalizedFindingLimit === 0 ? 'No cap' : normalizedFindingLimit }}</span>
          </div>


          <!-- Scope -->
          <div class="rounded-xl border border-[var(--border)] bg-black/10 px-4 py-3">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs text-[var(--text-muted)]">Scan Scope</span>
              <span class="text-xs font-semibold text-[var(--text)]">
                {{ scopeScanAll ? 'Full project' : `${scopeEntries.filter(e => e.selected && e.depth === 0).length} path${scopeEntries.filter(e => e.selected && e.depth === 0).length !== 1 ? 's' : ''}` }}
              </span>
            </div>
            <div v-if="!scopeScanAll" class="space-y-1 max-h-24 overflow-y-auto">
              <p v-for="e in scopeEntries.filter(e => e.selected && e.depth === 0)" :key="e.path"
                class="text-[10px] font-mono truncate" style="color:rgba(255,255,255,0.30);">{{ e.name }}</p>
            </div>
          </div>

          <!-- Git branch -->
          <div v-if="isGitRepo" class="flex items-center justify-between rounded-xl border border-[var(--border)] bg-black/10 px-4 py-3">
            <span class="text-xs text-[var(--text-muted)]">Branch</span>
            <span class="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
              <Github class="size-3 shrink-0" />
              {{ selectedBranch ?? 'detached HEAD' }}
            </span>
          </div>

          <!-- Project -->
          <div class="flex items-center justify-between rounded-xl border border-[var(--border)] bg-black/10 px-4 py-3">
            <span class="text-xs text-[var(--text-muted)]">Project</span>
            <span class="text-xs font-semibold text-[var(--text)] truncate max-w-[60%] text-right">{{ props.project.name }}</span>
          </div>
        </div>

        <div class="flex justify-end gap-2 border-t border-[var(--border)] pt-4">
          <button class="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)]"
            @click="showScanConfirm = false; showScopePicker = true">← Back</button>
          <button
            class="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            :class="securityToolRunButtonClass(selectedAITool)"
            :disabled="!canRunAIScan"
            @click="showScanConfirm = false; runAIScan()"
          >
            <Bot class="size-3.5" />
            Start Scan
          </button>
        </div>
      </div>
    </GlassModal>

    <!-- ── Export Modal — Step 1: choose type ────────────────────────────── -->
    <GlassModal v-model="showExportModal" title="Export Report" max-width="sm">
      <div class="space-y-3">
        <p class="text-xs text-[var(--text-muted)]">Choose what to export.</p>

        <!-- Security Review -->
        <button
          class="flex w-full items-center gap-3 rounded-xl border border-[var(--border)] bg-black/10 px-4 py-3 text-left transition-colors hover:border-indigo-500/30 hover:bg-indigo-500/[0.04]"
          @click="selectExportType('review')"
        >
          <div class="grid size-9 shrink-0 place-items-center rounded-lg border border-indigo-500/20 bg-indigo-500/10">
            <FileText class="size-4 text-indigo-300" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-semibold text-[var(--text)]">Security Review</p>
            <p class="mt-0.5 text-[11px] leading-relaxed text-[var(--text-muted)]">
              Executive summary, risk table, and all findings with evidence and recommended fixes.
            </p>
          </div>
          <span class="shrink-0 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[9px] font-semibold text-indigo-300">DOCX · MD</span>
        </button>

        <!-- Raw AI Report -->
        <button
          class="flex w-full items-center gap-3 rounded-xl border border-[var(--border)] bg-black/10 px-4 py-3 text-left transition-colors"
          :class="activeScan?.rawReport
            ? 'hover:border-sky-500/30 hover:bg-sky-500/[0.04]'
            : 'opacity-50 cursor-not-allowed'"
          :disabled="!activeScan?.rawReport"
          @click="selectExportType('raw')"
        >
          <div class="grid size-9 shrink-0 place-items-center rounded-lg border border-sky-500/20 bg-sky-500/10">
            <FileJson class="size-4 text-sky-300" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-semibold text-[var(--text)]">Raw AI Report</p>
            <p class="mt-0.5 text-[11px] leading-relaxed text-[var(--text-muted)]">
              Verbatim AI output before parsing — useful for audit and debugging.
              <span v-if="!activeScan?.rawReport" class="text-amber-400/70"> No raw report for this scan.</span>
            </p>
          </div>
          <span class="shrink-0 rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[9px] font-semibold text-sky-300">DOCX · MD</span>
        </button>

        <!-- Fix Prompts -->
        <button
          class="flex w-full items-center gap-3 rounded-xl border border-[var(--border)] bg-black/10 px-4 py-3 text-left transition-colors"
          :class="currentDocxReport().findings.length
            ? 'hover:border-emerald-500/30 hover:bg-emerald-500/[0.04]'
            : 'opacity-50 cursor-not-allowed'"
          :disabled="!currentDocxReport().findings.length"
          @click="selectExportType('prompts')"
        >
          <div class="grid size-9 shrink-0 place-items-center rounded-lg border border-emerald-500/20 bg-emerald-500/10">
            <Clipboard class="size-4 text-emerald-300" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-semibold text-[var(--text)]">Fix Prompts</p>
            <p class="mt-0.5 text-[11px] leading-relaxed text-[var(--text-muted)]">
              Ready-to-paste AI fix prompts — one per finding.
            </p>
          </div>
          <span class="shrink-0 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold text-emerald-300">MD only</span>
        </button>

        <div class="flex justify-end border-t border-[var(--border)] pt-3">
          <button
            class="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
            @click="showExportModal = false"
          >
            Cancel
          </button>
        </div>
      </div>
    </GlassModal>

    <!-- ── Export Modal — Step 2: choose format ───────────────────────────── -->
    <GlassModal v-model="showExportFormatModal" title="Choose Format" max-width="xs">
      <div class="space-y-3">
        <p class="text-xs text-[var(--text-muted)]">
          Select the file format for the
          <strong class="text-[var(--text)]">{{ pendingExportType === 'review' ? 'Security Review' : 'Raw AI Report' }}</strong>.
        </p>

        <div class="grid grid-cols-2 gap-3">
          <button
            class="flex flex-col items-center gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/[0.06] px-4 py-5 transition-colors hover:bg-indigo-500/10"
            @click="confirmExportFormat('docx')"
          >
            <FileText class="size-5 text-indigo-300" />
            <span class="text-sm font-semibold text-[var(--text)]">DOCX</span>
            <span class="text-[10px] text-center text-[var(--text-muted)]">Word document with cover page and branding</span>
          </button>
          <button
            class="flex flex-col items-center gap-2 rounded-xl border border-[var(--border)] bg-white/[0.03] px-4 py-5 transition-colors hover:bg-white/[0.06]"
            @click="confirmExportFormat('md')"
          >
            <FileJson class="size-5 text-[var(--text-muted)]" />
            <span class="text-sm font-semibold text-[var(--text)]">Markdown</span>
            <span class="text-[10px] text-center text-[var(--text-muted)]">Plain text, renders in GitHub and any editor</span>
          </button>
        </div>

        <div class="flex justify-end border-t border-[var(--border)] pt-3">
          <button
            class="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
            @click="showExportFormatModal = false; showExportModal = true"
          >
            ← Back
          </button>
        </div>
      </div>
    </GlassModal>

    <!-- ── Validate Finding Modal ──────────────────────────────────────────── -->
    <GlassModal v-model="showValidateModal" title="Validate Fix with AI" max-width="md">
      <div v-if="validateFinding" class="space-y-4">

        <!-- Finding summary -->
        <div class="rounded-lg border border-[var(--border)] bg-black/10 p-3">
          <div class="flex flex-wrap items-center gap-2">
            <span class="rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize" :class="severityClasses[validateFinding.severity]">{{ validateFinding.severity }}</span>
            <span class="rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize" :class="statusClasses[validateFinding.status]">{{ validateFinding.status.replace('_', ' ') }}</span>
            <span class="font-mono text-[10px] text-[var(--text-faint)]">SEC-{{ validateFinding.number }}</span>
          </div>
          <p class="mt-1.5 text-xs font-semibold text-[var(--text)]">{{ validateFinding.title }}</p>
          <p class="mt-0.5 text-[11px] text-[var(--text-muted)]">{{ validateFinding.area }}</p>
        </div>

        <!-- AI tool selector -->
        <div v-if="!validateResult" class="space-y-2">
          <p class="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-faint)]">Choose AI tool</p>
          <div class="grid grid-cols-2 gap-2">
            <button class="rounded-xl border p-3 text-left transition-colors" :class="validateAITool === 'codex' ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-[var(--border)] bg-black/10 hover:bg-white/[0.05]'" @click="validateAITool = 'codex'">
              <div class="flex items-center gap-2 mb-1.5">
                <div class="size-6 shrink-0 grid place-items-center rounded-md border border-emerald-500/30 bg-emerald-500/15 text-[11px] font-bold text-emerald-200">C</div>
                <p class="text-xs font-semibold text-[var(--text)]">Codex</p>
                <span class="ml-auto rounded-full border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-px text-[8px] font-semibold text-emerald-300">CLI</span>
              </div>
              <p class="text-[10px] text-[var(--text-faint)]">Read-only local code review via Codex CLI.</p>
            </button>
            <button class="rounded-xl border p-3 text-left transition-colors" :class="validateAITool === 'claude' ? 'border-violet-500/30 bg-violet-500/10' : 'border-[var(--border)] bg-black/10 hover:bg-white/[0.05]'" @click="validateAITool = 'claude'">
              <div class="flex items-center gap-2 mb-1.5">
                <div class="size-6 shrink-0 grid place-items-center rounded-md border border-violet-500/30 bg-violet-500/15 text-[11px] font-bold text-violet-200">Cl</div>
                <p class="text-xs font-semibold text-[var(--text)]">Claude</p>
                <span class="ml-auto rounded-full border border-violet-500/25 bg-violet-500/10 px-1.5 py-px text-[8px] font-semibold text-violet-300">CLI</span>
              </div>
              <p class="text-[10px] text-[var(--text-faint)]">Read-only local code review via Claude CLI.</p>
            </button>
            <button class="rounded-xl border p-3 text-left transition-colors" :class="validateAITool === 'openrouter' ? 'border-sky-500/30 bg-sky-500/10' : 'border-[var(--border)] bg-black/10 hover:bg-white/[0.05]'" @click="validateAITool = 'openrouter'">
              <div class="flex items-center gap-2 mb-1.5">
                <div class="size-6 shrink-0 grid place-items-center rounded-md border border-sky-500/30 bg-sky-500/15 text-[11px] font-bold text-sky-200">OR</div>
                <p class="text-xs font-semibold text-[var(--text)]">OpenRouter</p>
              </div>
              <p class="text-[10px]" :class="app.openRouter.enabled && app.openRouter.apiKey ? 'text-sky-300' : 'text-amber-300'">
                {{ app.openRouter.enabled && app.openRouter.apiKey ? app.openRouter.model : 'Configure API key first' }}
              </p>
            </button>
            <button class="rounded-xl border p-3 text-left transition-colors" :class="validateAITool === 'ollama' ? 'border-orange-500/30 bg-orange-500/10' : 'border-[var(--border)] bg-black/10 hover:bg-white/[0.05]'" @click="validateAITool = 'ollama'">
              <div class="flex items-center gap-2 mb-1.5">
                <div class="size-6 shrink-0 grid place-items-center rounded-md border border-orange-500/30 bg-orange-500/15 text-[11px] font-bold text-orange-200">Ol</div>
                <p class="text-xs font-semibold text-[var(--text)]">Ollama</p>
              </div>
              <p class="text-[10px]" :class="app.ollama.url ? 'text-orange-300' : 'text-amber-300'">
                {{ app.ollama.url ? app.ollama.model : 'Configure Ollama URL first' }}
              </p>
            </button>
          </div>
        </div>

        <!-- Error -->
        <div v-if="validateError" class="rounded-lg border border-red-500/20 bg-red-500/[0.07] px-3 py-2.5 text-xs text-red-300">
          {{ validateError }}
        </div>

        <!-- Running indicator -->
        <div v-if="validateRunning" class="flex items-center gap-3 rounded-lg border border-violet-500/20 bg-violet-500/[0.06] px-3 py-3">
          <Loader2 class="size-4 shrink-0 animate-spin text-violet-400" />
          <div>
            <p class="text-xs font-semibold text-violet-300">Validating…</p>
            <p class="text-[10px] text-[var(--text-muted)]">AI is inspecting the codebase for this finding.</p>
          </div>
        </div>

        <!-- Result -->
        <div v-if="validateResult && !validateRunning" class="space-y-3">
          <!-- Status banner -->
          <div
            class="flex items-start gap-3 rounded-lg border p-3"
            :class="{
              'border-emerald-500/25 bg-emerald-500/[0.08]': validateResult.status === 'resolved',
              'border-red-500/20 bg-red-500/[0.07]': validateResult.status === 'present',
              'border-amber-500/20 bg-amber-500/[0.07]': validateResult.status === 'regressed',
              'border-violet-500/20 bg-violet-500/[0.07]': validateResult.status === 'new_issue',
            }"
          >
            <component
              :is="{ resolved: ShieldCheck, present: ShieldX, regressed: RotateCcw, new_issue: TriangleAlert }[validateResult.status]"
              class="mt-0.5 size-4 shrink-0"
              :class="{
                'text-emerald-400': validateResult.status === 'resolved',
                'text-red-400': validateResult.status === 'present',
                'text-amber-400': validateResult.status === 'regressed',
                'text-violet-400': validateResult.status === 'new_issue',
              }"
            />
            <div class="min-w-0 flex-1">
              <p
                class="text-xs font-semibold"
                :class="{
                  'text-emerald-300': validateResult.status === 'resolved',
                  'text-red-300': validateResult.status === 'present',
                  'text-amber-300': validateResult.status === 'regressed',
                  'text-violet-300': validateResult.status === 'new_issue',
                }"
              >
                {{ { resolved: 'Resolved', present: 'Still Present', regressed: 'Regression Detected', new_issue: 'New Issue Found' }[validateResult.status] }}
              </p>
              <p class="mt-0.5 text-xs text-[var(--text-muted)]">{{ validateResult.verdict }}</p>
            </div>
          </div>

          <!-- Evidence -->
          <div v-if="validateResult.evidence" class="rounded-lg border border-[var(--border)] bg-black/10 px-3 py-2.5">
            <p class="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">Evidence</p>
            <p class="mt-1 text-[11px] leading-relaxed text-[var(--text-muted)]">{{ validateResult.evidence }}</p>
          </div>

          <!-- Recommendation -->
          <div v-if="validateResult.recommendation" class="flex items-start gap-2 rounded-lg border border-indigo-500/15 bg-indigo-500/[0.06] px-3 py-2.5">
            <SearchCheck class="mt-0.5 size-3.5 shrink-0 text-indigo-300" />
            <p class="text-[11px] leading-relaxed text-[var(--text-muted)]">{{ validateResult.recommendation }}</p>
          </div>

          <!-- New finding detail -->
          <div v-if="validateResult.status === 'new_issue' && validateResult.newFinding" class="space-y-1.5 rounded-lg border border-violet-500/20 bg-violet-500/[0.05] p-3">
            <p class="text-[10px] font-semibold uppercase tracking-wider text-violet-400">New Issue Detected</p>
            <p class="text-xs font-medium text-[var(--text)]">{{ validateResult.newFinding.title }}</p>
            <div class="flex items-center gap-2">
              <span class="rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize" :class="severityClasses[normalizeSeverity(validateResult.newFinding.severity)]">{{ validateResult.newFinding.severity }}</span>
              <span class="text-[10px] text-[var(--text-faint)]">{{ validateResult.newFinding.area }}</span>
            </div>
            <p v-if="validateResult.newFinding.detail" class="text-[11px] text-[var(--text-muted)]">{{ validateResult.newFinding.detail }}</p>
          </div>
        </div>

        <!-- Footer actions -->
        <div class="flex items-center justify-between gap-2 border-t border-[var(--border)] pt-3">
          <button
            v-if="validateResult"
            class="text-xs text-[var(--text-faint)] hover:text-[var(--text-muted)] transition-colors"
            @click="validateResult = null; validateError = ''"
          >
            ← Re-run
          </button>
          <div class="ml-auto flex items-center gap-2">
            <button class="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)]" @click="showValidateModal = false">
              Close
            </button>
            <!-- Run validation -->
            <button
              v-if="!validateResult"
              class="flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              :class="securityToolRunButtonClass(validateAITool)"
              :disabled="validateRunning"
              @click="runValidation"
            >
              <Loader2 v-if="validateRunning" class="size-3.5 animate-spin" />
              <FlaskConical v-else class="size-3.5" />
              {{ validateRunning ? 'Validating…' : `Validate Fix with ${securityToolLabel(validateAITool)}` }}
            </button>
            <!-- Mark resolved -->
            <button
              v-if="validateResult?.status === 'resolved'"
              class="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
              @click="applyValidationResolved"
            >
              <ShieldCheck class="size-3.5" />
              Mark as Resolved
            </button>
            <!-- Add new finding -->
            <button
              v-if="validateResult?.status === 'new_issue' && validateResult.newFinding"
              class="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-violet-500"
              @click="addValidationNewFinding"
            >
              <Plus class="size-3.5" />
              Add to Findings
            </button>
          </div>
        </div>
      </div>
    </GlassModal>

    <GlassModal v-model="showGitHubIssueModal" title="Create GitHub Issue" max-width="md">
      <div v-if="ghIssueFinding" class="space-y-4">
        <div class="rounded-lg border border-[var(--border)] bg-black/10 p-3">
          <div class="flex flex-wrap items-center gap-2">
            <span class="rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize" :class="severityClasses[ghIssueFinding.severity]">{{ ghIssueFinding.severity }}</span>
            <span class="text-xs font-medium text-[var(--text)]">{{ ghIssueFinding.title }}</span>
          </div>
          <p class="mt-1.5 text-[11px] text-[var(--text-muted)]">{{ ghIssueFinding.area }}</p>
        </div>

        <div v-if="project.githubRepo" class="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs text-[var(--text-muted)]">
          <p class="font-medium text-[var(--text)]">Repository</p>
          <p class="mt-0.5 font-mono text-[11px]">{{ project.githubRepo }}</p>
        </div>
        <div v-else class="space-y-1.5">
          <p class="text-xs font-medium text-[var(--text)]">Repository</p>
          <div class="flex items-center gap-2">
            <input v-model="ghRepoInput" class="h-9 flex-1 rounded-lg border border-[var(--border)] bg-black/20 px-3 text-xs text-[var(--text)] outline-none placeholder:text-[var(--text-faint)] focus:border-white/20" placeholder="owner/repo or full GitHub URL" @keydown.enter="saveGitHubRepo">
            <button class="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.06] px-3 py-2 text-xs text-[var(--text-muted)] hover:bg-white/[0.1] disabled:opacity-40" :disabled="ghRepoSaving || !ghRepoInput.trim()" @click="saveGitHubRepo">
              <Loader2 v-if="ghRepoSaving" class="size-3.5 animate-spin" />
              <Check v-else class="size-3.5" />
              Save
            </button>
          </div>
          <p class="text-[10px] text-amber-400">No repository linked — save one above to create the issue.</p>
        </div>

        <p class="text-xs text-[var(--text-muted)]">
          The issue will be created on the linked repository with the finding details and a "Created by Vindicter" attribution. It will appear under your GitHub account.
        </p>

        <div v-if="ghIssueCreatedUrl" class="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.07] px-3 py-2.5">
          <CheckCircle2 class="size-3.5 shrink-0 text-emerald-400" />
          <div class="min-w-0">
            <p class="text-xs font-medium text-emerald-300">Issue created successfully</p>
            <a :href="ghIssueCreatedUrl" target="_blank" class="mt-0.5 flex items-center gap-1 text-[11px] text-emerald-400/70 hover:text-emerald-300">
              <ExternalLink class="size-3" />
              View on GitHub
            </a>
          </div>
        </div>

        <div v-if="ghIssueError" class="rounded-lg border border-red-500/20 bg-red-500/[0.07] px-3 py-2.5 text-xs text-red-300">
          {{ ghIssueError }}
        </div>

        <div class="flex items-center justify-end gap-2 pt-1">
          <button class="rounded-lg border border-[var(--border)] px-4 py-2 text-xs text-[var(--text-muted)] hover:bg-white/[0.05]" @click="showGitHubIssueModal = false">
            {{ ghIssueCreatedUrl ? 'Close' : 'Cancel' }}
          </button>
          <button v-if="!ghIssueCreatedUrl" class="flex items-center gap-1.5 rounded-lg bg-gray-700 px-4 py-2 text-xs font-medium text-white hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50" :disabled="ghIssueCreating || !project.githubRepo" @click="submitGitHubIssue">
            <Loader2 v-if="ghIssueCreating" class="size-3.5 animate-spin" />
            <Github v-else class="size-3.5" />
            {{ ghIssueCreating ? 'Creating…' : 'Create Issue' }}
          </button>
        </div>
      </div>
    </GlassModal>
  </div>
</template>
