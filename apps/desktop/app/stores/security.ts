import { defineStore } from 'pinia'
import type {
  ProjectMeta,
  SecurityData,
  SecurityFinding,
  SecurityFindingSource,
  SecurityFindingStatus,
  SecurityScan,
  SecurityScanEffort,
  SecurityScanFinding,
  SecurityScanStatus,
  SecuritySeverity,
} from '~/types/vindicta'
import { DEFAULT_SECURITY_DATA } from '~/types/vindicta'
import { generateId } from '~/utils/id'
import { nowISO } from '~/utils/date'

function cloneDefaultSecurity(): SecurityData {
  return {
    findingCounter: DEFAULT_SECURITY_DATA.findingCounter,
    findings: [],
    scans: [],
    settings: { ...DEFAULT_SECURITY_DATA.settings },
    whitelist: [],
  }
}

function normalizeSeverity(value: unknown): SecuritySeverity {
  const text = String(value ?? '').toLowerCase()
  if (text === 'critical' || text === 'high' || text === 'medium' || text === 'low') return text
  return 'medium'
}

function normalizeStatus(value: unknown): SecurityFindingStatus {
  const text = String(value ?? '').toLowerCase()
  if (text === 'open' || text === 'triaged' || text === 'in_progress' || text === 'resolved' || text === 'ignored') return text
  return 'open'
}

function normalizeSource(value: unknown): SecurityFindingSource {
  const text = String(value ?? '').toLowerCase()
  if (text === 'ai_review' || text === 'dependency' || text === 'secret' || text === 'config') return text
  return 'ai_review'
}

function normalizeEffort(value: unknown): SecurityScanEffort {
  const text = String(value ?? '').toLowerCase()
  if (text === 'low' || text === 'medium' || text === 'high') return text
  return 'low'
}

function normalizeScanStatus(value: unknown): SecurityScanStatus {
  const text = String(value ?? '').toLowerCase()
  if (text === 'done' || text === 'warning' || text === 'error') return text
  return 'done'
}

function normalizeFindingLimit(value: unknown): number {
  const limit = Number(value)
  if (!Number.isFinite(limit)) return DEFAULT_SECURITY_DATA.settings.aiFindingLimit
  return Math.max(0, Math.min(50, Math.floor(limit)))
}

function stringValue(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function normalizeScanFinding(value: any, index: number): SecurityScanFinding {
  return {
    id: stringValue(value?.id, `SCAN-FINDING-${String(index + 1).padStart(3, '0')}`),
    title: stringValue(value?.title, 'Untitled security finding'),
    severity: normalizeSeverity(value?.severity),
    category: stringValue(value?.category ?? value?.owaspCategory, 'Security review'),
    source: normalizeSource(value?.source),
    area: stringValue(value?.area, 'Project'),
    detail: stringValue(value?.detail, 'No detail provided.'),
    evidence: Array.isArray(value?.evidence) ? value.evidence.map(String).join('\n') : stringValue(value?.evidence),
    recommendation: stringValue(value?.recommendation, 'Review the referenced code path and define remediation.'),
    selected: Boolean(value?.selected ?? true),
    whitelisted: Boolean(value?.whitelisted ?? false),
  }
}

function normalizeFinding(value: any, index: number): SecurityFinding {
  const status = normalizeStatus(value?.status)
  return {
    id: stringValue(value?.id, generateId()),
    number: Number.isFinite(value?.number) ? Number(value.number) : index + 1,
    title: stringValue(value?.title, 'Untitled security finding'),
    severity: normalizeSeverity(value?.severity),
    status,
    category: stringValue(value?.category ?? value?.owaspCategory, 'Security review'),
    source: normalizeSource(value?.source),
    area: stringValue(value?.area, 'Project'),
    detail: stringValue(value?.detail, ''),
    evidence: stringValue(value?.evidence),
    recommendation: stringValue(value?.recommendation),
    createdAt: stringValue(value?.createdAt, nowISO()),
    updatedAt: stringValue(value?.updatedAt, nowISO()),
    resolvedAt: value?.resolvedAt ? String(value.resolvedAt) : status === 'resolved' || status === 'ignored' ? nowISO() : null,
    scanId: value?.scanId ? String(value.scanId) : null,
  }
}

function normalizeScan(value: any): SecurityScan {
  return {
    id: stringValue(value?.id, generateId()),
    projectId: stringValue(value?.projectId),
    projectName: stringValue(value?.projectName, 'Project'),
    projectCode: stringValue(value?.projectCode),
    projectPath: stringValue(value?.projectPath),
    scannedAt: stringValue(value?.scannedAt, nowISO()),
    source: normalizeSource(value?.source),
    effort: normalizeEffort(value?.effort),
    status: normalizeScanStatus(value?.status),
    summary: stringValue(value?.summary),
    rawReport: stringValue(value?.rawReport),
    findings: Array.isArray(value?.findings) ? value.findings.map(normalizeScanFinding) : [],
    parseWarning: value?.parseWarning ? String(value.parseWarning) : null,
  }
}

function normalizeSecurityData(value: unknown): SecurityData {
  const raw = value as any
  const findings = Array.isArray(raw?.findings) ? raw.findings.map(normalizeFinding) : []
  const whitelist = Array.isArray(raw?.whitelist) ? raw.whitelist : []
  return {
    findingCounter: Number.isFinite(raw?.findingCounter)
      ? Number(raw.findingCounter)
      : findings.reduce((max: number, finding: SecurityFinding) => Math.max(max, finding.number), 0),
    findings,
    scans: Array.isArray(raw?.scans) ? raw.scans.map(normalizeScan) : [],
    settings: {
      ...DEFAULT_SECURITY_DATA.settings,
      ...(raw?.settings ?? {}),
      autoScanEffort: normalizeEffort(raw?.settings?.autoScanEffort),
      autoScanStaleHours: Number.isFinite(raw?.settings?.autoScanStaleHours) ? Number(raw.settings.autoScanStaleHours) : 24,
      autoScanEnabled: Boolean(raw?.settings?.autoScanEnabled ?? true),
      aiFindingLimit: normalizeFindingLimit(raw?.settings?.aiFindingLimit),
    },
    whitelist,
  }
}

function mergeSecurityData(projectData: SecurityData, backupData: SecurityData | null): SecurityData {
  if (!backupData) return projectData
  const findings = new Map<string, SecurityFinding>()
  for (const finding of projectData.findings) findings.set(finding.id, finding)
  for (const finding of backupData.findings) findings.set(finding.id, finding)

  const scans = new Map<string, SecurityScan>()
  for (const scan of projectData.scans) scans.set(scan.id, scan)
  for (const scan of backupData.scans) scans.set(scan.id, scan)

  const mergedFindings = [...findings.values()].sort((a, b) => b.number - a.number)
  const mergedScans = [...scans.values()]
    .sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime())
    .slice(0, 30)
  const whitelist = new Map<string, SecurityData['whitelist'][number]>()
  for (const item of projectData.whitelist ?? []) whitelist.set(`${item.title}||${item.category}`, item)
  for (const item of backupData.whitelist ?? []) whitelist.set(`${item.title}||${item.category}`, item)

  return {
    findingCounter: Math.max(
      projectData.findingCounter,
      backupData.findingCounter,
      mergedFindings.reduce((max, finding) => Math.max(max, finding.number), 0),
    ),
    findings: mergedFindings,
    scans: mergedScans,
    settings: {
      ...projectData.settings,
      ...backupData.settings,
      autoScanEffort: normalizeEffort(backupData.settings.autoScanEffort),
      autoScanStaleHours: Number.isFinite(backupData.settings.autoScanStaleHours) ? Number(backupData.settings.autoScanStaleHours) : projectData.settings.autoScanStaleHours,
      autoScanEnabled: Boolean(backupData.settings.autoScanEnabled),
      aiFindingLimit: normalizeFindingLimit(backupData.settings.aiFindingLimit),
    },
    whitelist: [...whitelist.values()],
  }
}

// Serializes all Tauri-store writes so concurrent scans don't race each other.
let _persistQueue: Promise<void> = Promise.resolve()

export const useSecurityStore = defineStore('security', {
  state: () => ({
    projectPath: null as string | null,
    projectId: null as string | null,
    data: cloneDefaultSecurity(),
    loading: false,
  }),

  getters: {
    findings: state => state.data.findings,
    scans: state => state.data.scans,
    settings: state => state.data.settings,
    latestScan: state => state.data.scans[0] ?? null,
    openFindings: state => state.data.findings.filter(finding => finding.status === 'open').length,
    highRiskFindings: state => state.data.findings.filter(finding => finding.severity === 'critical' || finding.severity === 'high').length,
    dependencyFindings: state => state.data.findings.filter(finding => finding.source === 'dependency'),
    secretFindings: state => state.data.findings.filter(finding => finding.source === 'secret'),
    whitelist: state => state.data.whitelist ?? [],
  },

  actions: {
    async load(projectPath: string, projectId?: string | null) {
      if (projectPath !== this.projectPath) _persistQueue = Promise.resolve()
      this.loading = true
      this.projectPath = projectPath
      this.projectId = projectId ?? null
      let hadCorruption = false
      try {
        let projectSecurity: SecurityData | null = null
        try {
          const { read } = useVindicterJson()
          const data = await read(projectPath)
          this.projectId = projectId ?? data.meta.id
          projectSecurity = normalizeSecurityData(data.security)
        }
        catch {
          projectSecurity = null
        }

        let backupSecurity: SecurityData | null = null
        try {
          backupSecurity = await this.loadBackup()
        }
        catch {
          backupSecurity = null
          hadCorruption = true
        }

        this.data = mergeSecurityData(projectSecurity ?? cloneDefaultSecurity(), backupSecurity)
        if (backupSecurity && projectSecurity) await this.persist()
      }
      finally {
        this.loading = false
        if (hadCorruption) {
          try {
            const { useNotifications } = await import('~/composables/useNotifications')
            useNotifications().notify(
              'Security data could not be fully loaded — some entries may have been reset. The store has been rebuilt from available data.',
              'warning',
            )
          }
          catch { /* non-critical */ }
        }
      }
    },

    backupKeys() {
      const keys = new Set<string>()
      if (this.projectId) keys.add(`security-${this.projectId}`)
      if (this.projectPath) keys.add(`security-path-${this.projectPath.replace(/[^A-Za-z0-9_.-]+/g, '_')}`)
      if (this.projectId) keys.add(`security:${this.projectId}`)
      if (this.projectPath) keys.add(`security:${this.projectPath}`)
      keys.add('security-unknown')
      return [...keys]
    },

    async loadBackup(): Promise<SecurityData | null> {
      const keys = this.backupKeys()
      try {
        const { useTauriStore } = await import('~/composables/useTauriStore')
        const store = useTauriStore()
        for (const key of keys) {
          const saved = await store.get<SecurityData>(key)
          if (saved) return normalizeSecurityData(saved)
        }
        return null
      }
      catch {
        if (typeof localStorage === 'undefined') return null
        for (const key of keys) {
          const raw = localStorage.getItem(`vindicter-${key}`)
          if (raw) return normalizeSecurityData(JSON.parse(raw))
        }
        return null
      }
    },

    async persistBackup() {
      const keys = this.backupKeys()
      const snapshot = JSON.parse(JSON.stringify(this.data)) as SecurityData
      try {
        const { useTauriStore } = await import('~/composables/useTauriStore')
        const store = useTauriStore()
        for (const key of keys.slice(0, 2)) {
          await store.set(key, snapshot)
        }
        await store.save()
      }
      catch {
        if (typeof localStorage !== 'undefined') {
          for (const key of keys.slice(0, 2)) {
            localStorage.setItem(`vindicter-${key}`, JSON.stringify(snapshot))
          }
        }
      }
    },

    persist(): Promise<void> {
      if (!this.projectPath) return Promise.resolve()
      _persistQueue = _persistQueue.then(() => this.persistBackup(), () => this.persistBackup())
      return _persistQueue
    },

    shouldAutoScan() {
      if (!this.data.settings.autoScanEnabled) return false
      const latest = this.latestScan
      if (!latest) return false
      const scannedAt = new Date(latest.scannedAt).getTime()
      if (!Number.isFinite(scannedAt)) return false
      return Date.now() - scannedAt > this.data.settings.autoScanStaleHours * 60 * 60 * 1000
    },

    async recordScan(project: ProjectMeta, input: {
      effort: SecurityScanEffort
      status: SecurityScanStatus
      summary: string
      rawReport: string
      findings: SecurityScanFinding[]
      parseWarning: string | null
    }) {
      const scan: SecurityScan = {
        id: generateId(),
        projectId: project.id,
        projectName: project.name,
        projectCode: project.code,
        projectPath: project.absolutePath,
        scannedAt: nowISO(),
        source: 'ai_review',
        effort: input.effort,
        status: input.status,
        summary: input.summary,
        rawReport: input.rawReport,
        findings: input.findings.map(finding => ({ ...finding })),
        parseWarning: input.parseWarning,
      }
      this.data.scans = [scan, ...this.data.scans].slice(0, 30)
      await this.persist()
      // Log to Tauri-backed history store
      try {
        const { useHistoryStore } = await import('~/stores/history')
        await useHistoryStore().append(project.id, {
          action: 'security:scan_completed',
          actor: 'AI',
          payload: {
            name: `Security scan — ${new Date(scan.scannedAt).toLocaleString()}`,
            findings: scan.findings.length,
            effort: input.effort,
          },
        })
      }
      catch { /* non-critical */ }
      return scan
    },

    async createRemediationItems(scanId: string | null, selected: SecurityScanFinding[]) {
      const now = nowISO()
      const created = selected.map((finding) => {
        const number = this.data.findingCounter + 1
        this.data.findingCounter = number
        return {
          id: generateId(),
          number,
          title: finding.title,
          severity: finding.severity,
          status: 'triaged' as SecurityFindingStatus,
          category: finding.category,
          source: finding.source,
          area: finding.area,
          detail: finding.detail,
          evidence: finding.evidence,
          recommendation: finding.recommendation,
          createdAt: now,
          updatedAt: now,
          resolvedAt: null,
          scanId,
        }
      })

      this.data.findings = [...created, ...this.data.findings]
      if (scanId) {
        const scan = this.data.scans.find(item => item.id === scanId)
        if (scan) {
          const ids = new Set(selected.map(finding => finding.id))
          scan.findings = scan.findings.map(finding => ids.has(finding.id) ? { ...finding, selected: false } : finding)
        }
      }
      await this.persist()
      return created
    },

    async upsertLocalFindings(source: SecurityFindingSource, items: Omit<SecurityScanFinding, 'selected'>[]) {
      const now = nowISO()
      const existing = this.data.findings.filter(finding => finding.source !== source)
      const created = items.map((item) => {
        const number = this.data.findingCounter + 1
        this.data.findingCounter = number
        return {
          id: generateId(),
          number,
          title: item.title,
          severity: item.severity,
          status: 'open' as SecurityFindingStatus,
          category: item.category,
          source,
          area: item.area,
          detail: item.detail,
          evidence: item.evidence,
          recommendation: item.recommendation,
          createdAt: now,
          updatedAt: now,
          resolvedAt: null,
          scanId: null,
        }
      })
      this.data.findings = [...created, ...existing]
      await this.persist()
      return created
    },

    async updateFindingStatus(id: string, status: SecurityFindingStatus) {
      const finding = this.data.findings.find(item => item.id === id)
      if (!finding) return
      finding.status = status
      finding.updatedAt = nowISO()
      finding.resolvedAt = status === 'resolved' || status === 'ignored' ? nowISO() : null
      await this.persist()
    },

    async updateSettings(settings: Partial<SecurityData['settings']>) {
      this.data.settings = { ...this.data.settings, ...settings }
      await this.persist()
    },

    async clearScans() {
      this.data.scans = []
      await this.persist()
    },

    async clearAllFindings() {
      this.data.findings = []
      await this.persist()
    },

    async addToWhitelist(finding: { id: string; title: string; category: string; area: string }) {
      if (!this.data.whitelist) this.data.whitelist = []
      const existing = this.data.whitelist.find(w => w.title === finding.title && w.category === finding.category)
      if (!existing) {
        this.data.whitelist.push({
          id: `wl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          title: finding.title,
          category: finding.category,
          area: finding.area,
          addedAt: new Date().toISOString(),
        })
      }
      for (const scan of this.data.scans) {
        scan.findings = scan.findings.map(f =>
          f.title === finding.title && f.category === finding.category
            ? { ...f, whitelisted: true }
            : f,
        )
      }
      await this.persist()
    },

    async removeFromWhitelist(id: string) {
      if (!this.data.whitelist) return
      const removed = this.data.whitelist.find(w => w.id === id)
      this.data.whitelist = this.data.whitelist.filter(w => w.id !== id)
      if (removed) {
        for (const scan of this.data.scans) {
          scan.findings = scan.findings.map(f =>
            f.title === removed.title && f.category === removed.category
              ? { ...f, whitelisted: false }
              : f,
          )
        }
      }
      await this.persist()
    },
  },
})
