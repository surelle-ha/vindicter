import type { VindicterJson } from '~/types/vindicta'
import { VINDICTA_SCHEMA_VERSION, DEFAULT_KANBAN_COLUMNS, DEFAULT_ROLES, DEFAULT_SECURITY_DATA } from '~/types/vindicta'
import { nowISO } from '~/utils/date'

const VINDICTA_SCHEMA_URL = 'https://raw.githubusercontent.com/Vindicter/vindicter/main/schema/v8.json'

function deriveProjectCode(name: string): string {
  const letters = name.toUpperCase().replace(/[^A-Z]/g, '')
  return letters.slice(0, 3).padEnd(3, 'X')
}

type Migrator = (raw: Record<string, unknown>) => Record<string, unknown>

const migrations: Record<number, Migrator> = {
  1: (raw) => ({
    ...raw,
    version: 2,
    tickets: (raw.tasks as unknown[] | undefined) ?? [],
    sprints: [],
    tasks: undefined,
  }),
  2: (raw) => ({
    ...raw,
    version: 3,
    settings: {
      roles: DEFAULT_ROLES,
      kanbanColumns: DEFAULT_KANBAN_COLUMNS,
    },
    tickets: ((raw.tickets as unknown[]) ?? []).map((t: any) => ({
      ...t,
      roleIds: t.roleIds ?? [],
    })),
  }),
  3: (raw) => ({
    ...raw,
    version: 4,
    members: [
      {
        id: 'member_claude',
        name: 'Claude',
        email: null,
        avatarUrl: null,
        isAI: true,
        roleIds: [],
        joinedAt: nowISO(),
      },
    ],
  }),

  4: (raw) => {
    const meta = (raw.meta as Record<string, unknown>) ?? {}
    const tickets = ((raw.tickets as unknown[]) ?? [])
      .slice()
      .sort((a: any, b: any) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''))
    const migratedTickets = tickets.map((t: any, i: number) => ({
      ...t,
      number: i + 1,
      comments: t.comments ?? [],
      likes: t.likes ?? 0,
    }))
    return {
      ...raw,
      version: 5,
      meta: {
        ...meta,
        code: (meta.code as string | undefined) ?? deriveProjectCode((meta.name as string | undefined) ?? 'PRJ'),
        ticketCounter: migratedTickets.length,
      },
      tickets: migratedTickets,
    }
  },

  5: (raw) => ({
    ...raw,
    version: 6,
    tickets: ((raw.tickets as unknown[]) ?? []).map((t: any) => ({
      ...t,
      gitControl: t.gitControl ?? {
        enabled: false,
        branch: '',
        autoCommit: false,
        autoPush: false,
      },
    })),
  }),

  6: (raw) => {
    const meta = (raw.meta as Record<string, unknown>) ?? {}
    const aiTool = (meta.aiTool as string | undefined) ?? 'claude_code'
    const aiTools = ((meta.aiTools as string[] | undefined) ?? [aiTool])
      .filter(Boolean)

    return {
      ...raw,
      version: 7,
      meta: {
        ...meta,
        aiTool,
        aiTools: aiTools.length ? aiTools : ['claude_code'],
        activeAITool: (meta.activeAITool as string | undefined) ?? null,
      },
    }
  },

  7: (raw) => ({
    ...raw,
    version: 8,
    security: {
      ...DEFAULT_SECURITY_DATA,
      ...(raw.security as Record<string, unknown> | undefined),
      settings: {
        ...DEFAULT_SECURITY_DATA.settings,
        ...((raw.security as any)?.settings ?? {}),
      },
    },
  }),
}

export function migrateVindicterJson(raw: unknown): VindicterJson {
  let data = raw as Record<string, unknown>

  if (!data.version) {
    data = { ...data, version: 1 }
  }

  let v = data.version as number
  while (v < VINDICTA_SCHEMA_VERSION) {
    const migrator = migrations[v]
    if (!migrator) throw new Error(`No migrator for vindicta.json version ${v}`)
    data = migrator(data)
    v = data.version as number
  }

  return { ...data, $schema: VINDICTA_SCHEMA_URL } as unknown as VindicterJson
}
