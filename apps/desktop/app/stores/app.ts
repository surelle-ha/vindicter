import { defineStore } from 'pinia'

export type AppTheme = 'dark' | 'light'

export interface SmtpSettings {
  enabled: boolean
  host: string
  port: number
  secure: boolean
  username: string
  password: string
  fromName: string
  fromEmail: string
}

export interface ContactSettings {
  githubRepo: string
  githubToken: string
}

export interface OpenRouterSettings {
  enabled: boolean
  apiKey: string
  model: string
}

export interface OllamaSettings {
  url: string
  model: string
}

export interface WslProfile {
  id: string
  name: string
  purpose: string
  distro: string
  homePath: string
  enabled: boolean
}

export interface RssSource {
  id: string
  label: string
  url: string
  enabled: boolean
}

interface AppSettings {
  theme: AppTheme
  notificationsEnabled: boolean
  wslAutoStart: boolean
  smtp: SmtpSettings
  contact: ContactSettings
  openRouter: OpenRouterSettings
  ollama: OllamaSettings
  wslProfiles: WslProfile[]
  rssSources: RssSource[]
  featuresModalDismissed: boolean
  vigilanteEnabled: boolean
  mcpInSidebar: boolean
  doctorModalSeen: boolean
}

const DEFAULT_SMTP: SmtpSettings = {
  enabled: false,
  host: '',
  port: 587,
  secure: false,
  username: '',
  password: '',
  fromName: '',
  fromEmail: '',
}

const DEFAULT_CONTACT: ContactSettings = {
  githubRepo: 'Vindicter/vindicter',
  githubToken: '',
}

const DEFAULT_OPENROUTER: OpenRouterSettings = {
  enabled: false,
  apiKey: '',
  model: 'openai/gpt-4.1-mini',
}

const DEFAULT_OLLAMA: OllamaSettings = {
  url: 'http://localhost:11434',
  model: 'llama3.2',
}

export const DEFAULT_WSL_PROFILES: WslProfile[] = [
  {
    id: 'academy',
    name: 'Academy',
    purpose: 'Isolated learning labs and course exercises',
    distro: '',
    homePath: '~/vindicta/academy',
    enabled: true,
  },
  {
    id: 'pentest',
    name: 'Pentesting',
    purpose: 'Recon, scanning, and exploit tooling workspace',
    distro: '',
    homePath: '~/vindicta/pentest',
    enabled: true,
  },
]

export const DEFAULT_RSS_SOURCES: RssSource[] = [
  {
    id: 'cshub-attacks',
    label: 'CSHub Attacks',
    url: 'https://www.cshub.com/rss/categories/attacks',
    enabled: true,
  },
  {
    id: 'cshub-articles',
    label: 'CSHub Articles',
    url: 'https://www.cshub.com/rss/articles',
    enabled: true,
  },
  {
    id: 'cshub-reports',
    label: 'CSHub Reports',
    url: 'https://www.cshub.com/rss/reports',
    enabled: true,
  },
]

export const useAppStore = defineStore('app', {
  state: (): AppSettings & { launched: boolean } => ({
    launched: false,
    theme: 'dark',
    notificationsEnabled: true,
    wslAutoStart: true,
    smtp: { ...DEFAULT_SMTP },
    contact: { ...DEFAULT_CONTACT },
    openRouter: { ...DEFAULT_OPENROUTER },
    ollama: { ...DEFAULT_OLLAMA },
    wslProfiles: DEFAULT_WSL_PROFILES.map(profile => ({ ...profile })),
    rssSources: DEFAULT_RSS_SOURCES.map(source => ({ ...source })),
    featuresModalDismissed: false,
    vigilanteEnabled: false,
    mcpInSidebar: true,
    doctorModalSeen: false,
  }),

  actions: {
    async init() {
      try {
        const { useTauriStore } = await import('~/composables/useTauriStore')
        const store = useTauriStore()
        const saved = await store.get<AppSettings>('app-settings')
        if (saved) {
          this.theme = saved.theme ?? 'dark'
          this.notificationsEnabled = saved.notificationsEnabled ?? true
          this.wslAutoStart = saved.wslAutoStart ?? true
          this.smtp = { ...DEFAULT_SMTP, ...(saved.smtp ?? {}) }
          this.contact = { ...DEFAULT_CONTACT, ...(saved.contact ?? {}) }
          this.openRouter = { ...DEFAULT_OPENROUTER, ...(saved.openRouter ?? {}) }
          this.ollama = { ...DEFAULT_OLLAMA, ...(saved.ollama ?? {}) }
          this.wslProfiles = normalizeWslProfiles(saved.wslProfiles)
          this.rssSources = normalizeRssSources(saved.rssSources)
          this.featuresModalDismissed = saved.featuresModalDismissed ?? false
          this.vigilanteEnabled = saved.vigilanteEnabled ?? false
          this.mcpInSidebar = saved.mcpInSidebar ?? true
          this.doctorModalSeen = (saved as any).doctorModalSeen ?? false
        }
      }
      catch {
        const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('vindicter-app-settings') : null
        if (raw) {
          try {
            const saved = JSON.parse(raw) as Partial<AppSettings>
            this.theme = saved.theme ?? 'dark'
            this.notificationsEnabled = saved.notificationsEnabled ?? true
            this.wslAutoStart = saved.wslAutoStart ?? true
            this.smtp = { ...DEFAULT_SMTP, ...(saved.smtp ?? {}) }
            this.contact = { ...DEFAULT_CONTACT, ...(saved.contact ?? {}) }
            this.openRouter = { ...DEFAULT_OPENROUTER, ...(saved.openRouter ?? {}) }
            this.ollama = { ...DEFAULT_OLLAMA, ...(saved.ollama ?? {}) }
            this.wslProfiles = normalizeWslProfiles(saved.wslProfiles)
            this.rssSources = normalizeRssSources(saved.rssSources)
            this.featuresModalDismissed = saved.featuresModalDismissed ?? false
            this.vigilanteEnabled = saved.vigilanteEnabled ?? false
            this.mcpInSidebar = saved.mcpInSidebar ?? true
            this.doctorModalSeen = (saved as any).doctorModalSeen ?? false
          }
          catch { /* ignore */ }
        }
      }
    },

    async enter() {
      this.launched = true
      await this._persist()
    },

    async toggleTheme() {
      this.theme = this.theme === 'dark' ? 'light' : 'dark'
      await this._persist()
    },

    async setNotifications(value: boolean) {
      this.notificationsEnabled = value
      await this._persist()
    },

    async setWslAutoStart(value: boolean) {
      this.wslAutoStart = value
      await this._persist()
    },

    async setSmtp(settings: Partial<SmtpSettings>) {
      this.smtp = { ...this.smtp, ...settings }
      await this._persist()
    },

    async setContact(settings: Partial<ContactSettings>) {
      this.contact = { ...this.contact, ...settings }
      await this._persist()
    },

    async setOpenRouter(settings: Partial<OpenRouterSettings>) {
      this.openRouter = { ...this.openRouter, ...settings }
      await this._persist()
    },

    async setOllama(settings: Partial<OllamaSettings>) {
      this.ollama = { ...this.ollama, ...settings }
      await this._persist()
    },

    async setWslProfiles(profiles: WslProfile[]) {
      this.wslProfiles = normalizeWslProfiles(profiles)
      await this._persist()
    },

    async setRssSources(sources: RssSource[]) {
      this.rssSources = normalizeRssSources(sources)
      await this._persist()
    },

    async ensureDefaultWslProfiles(defaultDistro = '') {
      const existing = new Map(this.wslProfiles.map(profile => [profile.id, profile]))
      this.wslProfiles = DEFAULT_WSL_PROFILES.map(profile => ({
        ...profile,
        distro: existing.get(profile.id)?.distro || defaultDistro,
        homePath: existing.get(profile.id)?.homePath || profile.homePath,
        enabled: existing.get(profile.id)?.enabled ?? profile.enabled,
      }))
      await this._persist()
    },

    async dismissFeaturesModal() {
      this.featuresModalDismissed = true
      await this._persist()
    },

    async dismissDoctorModal() {
      this.doctorModalSeen = true
      await this._persist()
    },

    async setVigilante(value: boolean) {
      this.vigilanteEnabled = value
      await this._persist()
    },

    async setMcpInSidebar(value: boolean) {
      this.mcpInSidebar = value
      await this._persist()
    },

    async _persist() {
      const settings: AppSettings = {
        theme: this.theme,
        notificationsEnabled: this.notificationsEnabled,
        wslAutoStart: this.wslAutoStart,
        smtp: this.smtp,
        contact: this.contact,
        openRouter: this.openRouter,
        ollama: this.ollama,
        wslProfiles: this.wslProfiles,
        rssSources: this.rssSources,
        featuresModalDismissed: this.featuresModalDismissed,
        vigilanteEnabled: this.vigilanteEnabled,
        mcpInSidebar: this.mcpInSidebar,
        doctorModalSeen: this.doctorModalSeen,
      }
      try {
        const { useTauriStore } = await import('~/composables/useTauriStore')
        const store = useTauriStore()
        await store.set('app-settings', settings)
        await store.save()
      }
      catch {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('vindicter-app-settings', JSON.stringify(settings))
        }
      }
    },
  },
})

function normalizeWslProfiles(profiles: unknown): WslProfile[] {
  if (!Array.isArray(profiles) || !profiles.length) {
    return DEFAULT_WSL_PROFILES.map(profile => ({ ...profile }))
  }

  return profiles.map((profile: any, index) => ({
    id: String(profile?.id || `profile-${index + 1}`),
    name: String(profile?.name || 'WSL Profile'),
    purpose: String(profile?.purpose || ''),
    distro: String(profile?.distro || ''),
    homePath: String(profile?.homePath || '~/vindicta'),
    enabled: profile?.enabled !== false,
  }))
}

function normalizeRssSources(sources: unknown): RssSource[] {
  if (!Array.isArray(sources) || !sources.length) {
    return DEFAULT_RSS_SOURCES.map(source => ({ ...source }))
  }

  const defaultsById = new Map(DEFAULT_RSS_SOURCES.map(source => [source.id, source]))
  const normalized = sources
    .map((source: any, index) => ({
      id: String(source?.id || `rss-${index + 1}`),
      label: String(source?.label || 'Security Feed'),
      url: String(source?.url || ''),
      enabled: source?.enabled !== false,
    }))
    .filter(source => source.url.trim())

  const savedById = new Map(normalized.map(source => [source.id, source]))
  const mergedDefaults = DEFAULT_RSS_SOURCES.map(source => ({
    ...source,
    ...(savedById.get(source.id) ?? {}),
  }))
  const custom = normalized.filter(source => !defaultsById.has(source.id))

  return [...mergedDefaults, ...custom]
}
