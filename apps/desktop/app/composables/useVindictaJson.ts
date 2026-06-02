import type { VindicterJson, ProjectMeta, ProjectSettings, Ticket, Sprint, HistoryEntry, Member, SecurityData } from '~/types/vindicta'
import { VINDICTA_SCHEMA_VERSION, DEFAULT_KANBAN_COLUMNS, DEFAULT_ROLES, DEFAULT_SECURITY_DATA } from '~/types/vindicta'
import { deriveProjectCode } from '~/utils/ticket'
import { migrateVindicterJson } from '~/utils/migration'
import { generateId } from '~/utils/id'
import { nowISO } from '~/utils/date'

const FILENAME = 'vindicta.json'
const SCHEMA_URL = 'https://raw.githubusercontent.com/surelle-ha/vindicter/main/schema/v8.json'

export function useVindicterJson() {
  const fs = useTauriFs()

  function vindictaPath(projectPath: string): string {
    return `${projectPath}/${FILENAME}`
  }

  async function read(projectPath: string): Promise<VindicterJson> {
    const path = vindictaPath(projectPath)
    const raw = await fs.readTextFile(path)
    const parsed = JSON.parse(raw)
    return migrateVindicterJson(parsed)
  }

  async function write(projectPath: string, data: VindicterJson): Promise<void> {
    const path = vindictaPath(projectPath)
    await fs.writeTextFile(path, JSON.stringify(data, null, 2))
  }

  async function createProject(
    projectPath: string,
    meta: Omit<ProjectMeta, 'id' | 'createdAt' | 'updatedAt' | 'ticketCounter'>,
  ): Promise<VindicterJson> {
    const now = nowISO()
    const data: VindicterJson = {
      $schema: SCHEMA_URL,
      version: VINDICTA_SCHEMA_VERSION,
      meta: {
        ...meta,
        code: meta.code || deriveProjectCode(meta.name),
        id: generateId(),
        ticketCounter: 0,
        createdAt: now,
        updatedAt: now,
      },
      settings: {
        roles: DEFAULT_ROLES,
        kanbanColumns: DEFAULT_KANBAN_COLUMNS,
      },
      members: [
        { id: 'member_claude', name: 'Claude', email: null, avatarUrl: null, isAI: true, roleIds: [], joinedAt: now },
      ],
      tickets: [],
      sprints: [],
      security: structuredClone(DEFAULT_SECURITY_DATA),
      history: [{
        id: generateId(),
        at: now,
        actor: meta.ownedBy,
        action: 'project:created',
        payload: { name: meta.name },
      }],
    }
    await write(projectPath, data)
    return data
  }

  async function patchTickets(projectPath: string, tickets: Ticket[]): Promise<void> {
    const data = await read(projectPath)
    data.tickets = tickets
    data.meta.updatedAt = nowISO()
    data.meta.ticketCounter = tickets.reduce((max, t) => Math.max(max, t.number ?? 0), 0)
    await write(projectPath, data)
  }

  async function patchMeta(projectPath: string, partial: Partial<ProjectMeta>): Promise<void> {
    const data = await read(projectPath)
    data.meta = { ...data.meta, ...partial, updatedAt: nowISO() }
    await write(projectPath, data)
  }

  async function patchSprints(projectPath: string, sprints: Sprint[]): Promise<void> {
    const data = await read(projectPath)
    data.sprints = sprints
    data.meta.updatedAt = nowISO()
    await write(projectPath, data)
  }

  async function appendHistory(projectPath: string, entry: Omit<HistoryEntry, 'id' | 'at'>): Promise<void> {
    const data = await read(projectPath)
    data.history.unshift({
      id: generateId(),
      at: nowISO(),
      ...entry,
    })
    await write(projectPath, data)
  }

  async function patchSettings(projectPath: string, settings: Partial<ProjectSettings>): Promise<void> {
    const data = await read(projectPath)
    data.settings = { ...data.settings, ...settings }
    data.meta.updatedAt = nowISO()
    await write(projectPath, data)
  }

  async function patchMembers(projectPath: string, members: Member[]): Promise<void> {
    const data = await read(projectPath)
    data.members = members
    data.meta.updatedAt = nowISO()
    await write(projectPath, data)
  }

  async function patchSecurity(projectPath: string, security: SecurityData): Promise<void> {
    const data = await read(projectPath)
    data.security = security
    data.meta.updatedAt = nowISO()
    await write(projectPath, data)
  }

  async function resetProjectData(projectPath: string): Promise<void> {
    const data = await read(projectPath)
    data.tickets = []
    data.sprints = []
    data.history = [{
      id: generateId(),
      at: nowISO(),
      actor: 'system',
      action: 'project:data_reset',
      payload: {},
    }]
    data.meta.updatedAt = nowISO()
    data.meta.ticketCounter = 0
    await write(projectPath, data)
  }

  async function fileExists(projectPath: string): Promise<boolean> {
    return fs.exists(vindictaPath(projectPath))
  }

  return { read, write, createProject, patchTickets, patchSprints, patchSettings, patchMembers, patchMeta, patchSecurity, appendHistory, fileExists, resetProjectData }
}
