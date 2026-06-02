import { defineStore } from 'pinia'

export interface LocalProfile {
  name: string
  email: string
  jobRole: string
  projectManagementExperience: string
  softwareEngineeringExperience: string
  aiToolingComfort: string
  preferredPlanningStyle: string
  complete: boolean
  tokenUsage: TokenUsage
}

interface TokenUsageByModel {
  tool: string
  model: string
  runs: number
  inputTokens: number
  outputTokens: number
  totalTokens: number
  lastUsedAt: string | null
}

export interface PromptRunHistory {
  id: string
  tool: string
  model: string
  prompt: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  createdAt: string
}

interface TokenUsage {
  runs: number
  inputTokens: number
  outputTokens: number
  totalTokens: number
  lastUsedAt: string | null
  byModel: TokenUsageByModel[]
  history: PromptRunHistory[]
}

const emptyTokenUsage = () => ({
  runs: 0,
  inputTokens: 0,
  outputTokens: 0,
  totalTokens: 0,
  lastUsedAt: null,
  byModel: [],
  history: [],
})

function normalizeProfile(profile: Partial<LocalProfile>): LocalProfile {
  const usage = profile.tokenUsage as Partial<TokenUsage> & { codexRuns?: number } | undefined
  const legacyRuns = usage?.codexRuns ?? 0
  const inputTokens = usage?.inputTokens ?? 0
  const outputTokens = usage?.outputTokens ?? 0
  const totalTokens = usage?.totalTokens ?? inputTokens + outputTokens
  const lastUsedAt = usage?.lastUsedAt ?? null
  const byModel = usage?.byModel ?? (legacyRuns
    ? [{
        tool: 'Codex',
        model: 'Codex CLI default',
        runs: legacyRuns,
        inputTokens,
        outputTokens,
        totalTokens,
        lastUsedAt,
      }]
    : [])
  const history = (usage?.history ?? []).map((item: Partial<PromptRunHistory>, index) => {
    const itemInput = Math.max(0, Math.round(item.inputTokens ?? 0))
    const itemOutput = Math.max(0, Math.round(item.outputTokens ?? 0))
    return {
      id: item.id ?? `prompt-legacy-${index}`,
      tool: item.tool ?? 'AI Tool',
      model: item.model ?? 'Default model',
      prompt: item.prompt ?? '',
      inputTokens: itemInput,
      outputTokens: itemOutput,
      totalTokens: Math.max(0, Math.round(item.totalTokens ?? itemInput + itemOutput)),
      createdAt: item.createdAt ?? new Date().toISOString(),
    }
  })

  return {
    name: profile.name ?? '',
    email: profile.email ?? '',
    jobRole: profile.jobRole ?? 'Developer',
    projectManagementExperience: profile.projectManagementExperience ?? 'learning',
    softwareEngineeringExperience: profile.softwareEngineeringExperience ?? 'intermediate',
    aiToolingComfort: profile.aiToolingComfort ?? 'guided',
    preferredPlanningStyle: profile.preferredPlanningStyle ?? 'balanced',
    complete: profile.complete ?? false,
    tokenUsage: {
      runs: usage?.runs ?? legacyRuns,
      inputTokens,
      outputTokens,
      totalTokens,
      lastUsedAt,
      byModel,
      history,
    },
  }
}

export const useUserStore = defineStore('user', {
  state: (): LocalProfile => ({
    name: '',
    email: '',
    jobRole: 'Developer',
    projectManagementExperience: 'learning',
    softwareEngineeringExperience: 'intermediate',
    aiToolingComfort: 'guided',
    preferredPlanningStyle: 'balanced',
    complete: false,
    tokenUsage: emptyTokenUsage(),
  }),

  actions: {
    async load() {
      try {
        const { useTauriStore } = await import('~/composables/useTauriStore')
        const store = useTauriStore()
        const saved = await store.get<LocalProfile>('user-profile')
        if (saved) {
          Object.assign(this.$state, normalizeProfile(saved))
          return
        }
      }
      catch { /* Tauri not available */ }

      // Fallback: migrate from old localStorage key
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem('vindicter-user-profile')
        if (raw) {
          try {
            Object.assign(this.$state, normalizeProfile(JSON.parse(raw)))
            // Migrate to TauriStore
            await this._persist()
            localStorage.removeItem('vindicter-user-profile')
          }
          catch { /* corrupt */ }
        }
      }
    },

    async save(data: Partial<Omit<LocalProfile, 'complete'>>) {
      Object.assign(this.$state, data, { complete: true })
      await this._persist()
    },

    async recordTokenUsage(usage: { inputTokens: number; outputTokens: number; tool?: string; model?: string; prompt?: string }) {
      const nextInput = Math.max(0, Math.round(usage.inputTokens || 0))
      const nextOutput = Math.max(0, Math.round(usage.outputTokens || 0))
      const now = new Date().toISOString()
      const tool = usage.tool || 'AI Tool'
      const model = usage.model || 'Default model'
      const byModel = [...this.tokenUsage.byModel]
      const modelIndex = byModel.findIndex(item => item.tool === tool && item.model === model)
      const existing = modelIndex >= 0 ? byModel[modelIndex] : {
        tool,
        model,
        runs: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        lastUsedAt: null,
      }
      byModel[modelIndex >= 0 ? modelIndex : byModel.length] = {
        ...existing,
        runs: existing.runs + 1,
        inputTokens: existing.inputTokens + nextInput,
        outputTokens: existing.outputTokens + nextOutput,
        totalTokens: existing.totalTokens + nextInput + nextOutput,
        lastUsedAt: now,
      }

      const history = [
        {
          id: `prompt-${Date.now()}`,
          tool,
          model,
          prompt: (usage.prompt ?? '').trim().slice(0, 2000),
          inputTokens: nextInput,
          outputTokens: nextOutput,
          totalTokens: nextInput + nextOutput,
          createdAt: now,
        },
        ...this.tokenUsage.history,
      ].slice(0, 25)

      this.tokenUsage = {
        runs: this.tokenUsage.runs + 1,
        inputTokens: this.tokenUsage.inputTokens + nextInput,
        outputTokens: this.tokenUsage.outputTokens + nextOutput,
        totalTokens: this.tokenUsage.totalTokens + nextInput + nextOutput,
        lastUsedAt: now,
        byModel,
        history,
      }
      await this._persist()
    },

    async resetTokenUsage() {
      this.tokenUsage = emptyTokenUsage()
      await this._persist()
    },

    async reset() {
      this.$state = {
        name: '',
        email: '',
        jobRole: 'Developer',
        projectManagementExperience: 'learning',
        softwareEngineeringExperience: 'intermediate',
        aiToolingComfort: 'guided',
        preferredPlanningStyle: 'balanced',
        complete: false,
        tokenUsage: emptyTokenUsage(),
      }
      try {
        const { useTauriStore } = await import('~/composables/useTauriStore')
        const store = useTauriStore()
        await store.delete('user-profile')
        await store.save()
      }
      catch {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('vindicter-user-profile')
        }
      }
    },

    async _persist() {
      try {
        const { useTauriStore } = await import('~/composables/useTauriStore')
        const store = useTauriStore()
        await store.set('user-profile', { ...this.$state })
        await store.save()
      }
      catch {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('vindicter-user-profile', JSON.stringify(this.$state))
        }
      }
    },
  },
})
