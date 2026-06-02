export const VINDICTA_SCHEMA_VERSION = 8

export type TicketStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled'
export type TicketType = 'feature' | 'bug' | 'fix' | 'chore' | 'spike'
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical'
export type EditorSlug = 'vscode' | 'cursor' | 'zed' | 'neovim' | 'webstorm' | 'other'
export type AIToolSlug = 'codex' | 'claude_code' | 'copilot' | 'codeium' | 'other'
export type SecuritySeverity = 'critical' | 'high' | 'medium' | 'low'
export type SecurityFindingStatus = 'open' | 'triaged' | 'in_progress' | 'resolved' | 'ignored'
export type SecurityFindingSource = 'ai_review' | 'dependency' | 'secret' | 'config'
export type SecurityScanEffort = 'low' | 'medium' | 'high'
export type SecurityScanStatus = 'done' | 'warning' | 'error'

export interface Role {
  id: string
  name: string
  color: string
}

export interface KanbanColumn {
  id: string
  displayName: string
  status: TicketStatus
  order: number
  visible: boolean
}

export interface ProjectSettings {
  roles: Role[]
  kanbanColumns: KanbanColumn[]
}

export interface Member {
  id: string
  name: string
  email: string | null
  avatarUrl: string | null
  isAI: boolean
  roleIds: string[]
  joinedAt: string
}

export interface HistoryEntry {
  id: string
  at: string
  actor: string
  action: string
  payload: Record<string, unknown>
}

export interface Comment {
  id: string
  text: string
  author: string
  isAI: boolean
  parentId: string | null
  likes: number
  createdAt: string
}

export interface TicketGitControl {
  enabled: boolean
  branch: string
  autoCommit: boolean
  autoPush: boolean
}

export interface Ticket {
  id: string
  number: number
  type: TicketType
  status: TicketStatus
  priority: TicketPriority
  title: string
  description: string
  gitControl: TicketGitControl
  labels: string[]
  roleIds: string[]
  sprintId: string | null
  comments: Comment[]
  likes: number
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
  createdBy: string
}

export interface Sprint {
  id: string
  name: string
  goal: string
  startDate: string
  endDate: string
  ticketIds: string[]
  status: 'planned' | 'active' | 'completed'
  createdAt: string
}

export interface SecurityFinding {
  id: string
  number: number
  title: string
  severity: SecuritySeverity
  status: SecurityFindingStatus
  category: string
  source: SecurityFindingSource
  area: string
  detail: string
  evidence: string
  recommendation: string
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
  scanId: string | null
}

export interface SecurityScanFinding {
  id: string
  title: string
  severity: SecuritySeverity
  category: string
  source: SecurityFindingSource
  area: string
  detail: string
  evidence: string
  recommendation: string
  selected: boolean
  whitelisted?: boolean
}

export interface SecurityScan {
  id: string
  projectId: string
  projectName: string
  projectCode: string
  projectPath: string
  scannedAt: string
  source: SecurityFindingSource
  effort: SecurityScanEffort
  status: SecurityScanStatus
  summary: string
  rawReport: string
  findings: SecurityScanFinding[]
  parseWarning: string | null
}

export interface SecuritySettings {
  autoScanEnabled: boolean
  autoScanStaleHours: number
  autoScanEffort: SecurityScanEffort
  aiFindingLimit: number
}

export interface WhitelistedFinding {
  id: string
  title: string
  category: string
  area: string
  addedAt: string
}

export interface SecurityData {
  findingCounter: number
  findings: SecurityFinding[]
  scans: SecurityScan[]
  settings: SecuritySettings
  whitelist: WhitelistedFinding[]
}

export interface ProjectMeta {
  id: string
  name: string
  description: string
  absolutePath: string
  githubRepo: string | null
  editor: EditorSlug
  aiTool: AIToolSlug
  aiTools: AIToolSlug[]
  activeAITool: AIToolSlug | null
  code: string
  ticketCounter: number
  createdAt: string
  updatedAt: string
  ownedBy: string
  // Pentest feature flags (optional; undefined = never configured)
  pentestEnabled?: boolean
  pentestPromptDismissed?: boolean
  pentestTargetUrl?: string
  pentestTermsAccepted?: boolean
  pentestEnabledAt?: string | null
}

export const DEFAULT_KANBAN_COLUMNS: KanbanColumn[] = [
  { id: 'col_backlog',    displayName: 'Backlog',     status: 'backlog',     order: 0, visible: true },
  { id: 'col_todo',       displayName: 'To Do',       status: 'todo',        order: 1, visible: true },
  { id: 'col_inprogress', displayName: 'In Progress', status: 'in_progress', order: 2, visible: true },
  { id: 'col_inreview',   displayName: 'In Review',   status: 'in_review',   order: 3, visible: true },
  { id: 'col_done',       displayName: 'Done',        status: 'done',        order: 4, visible: true },
]

export const DEFAULT_ROLES: Role[] = [
  { id: 'role_dev',  name: 'Developer',  color: '#6366f1' },
  { id: 'role_qa',   name: 'QA',         color: '#10b981' },
  { id: 'role_lead', name: 'Tech Lead',  color: '#f59e0b' },
]

export interface VindicterJson {
  $schema: string
  version: number
  meta: ProjectMeta
  settings: ProjectSettings
  members: Member[]
  tickets: Ticket[]
  sprints: Sprint[]
  history: HistoryEntry[]
  security: SecurityData
}

export const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  autoScanEnabled: true,
  autoScanStaleHours: 24,
  autoScanEffort: 'low',
  aiFindingLimit: 10,
}

export const DEFAULT_SECURITY_DATA: SecurityData = {
  findingCounter: 0,
  findings: [],
  scans: [],
  settings: DEFAULT_SECURITY_SETTINGS,
  whitelist: [],
}
