import { defineStore } from 'pinia'
import type { ApiUser, ApiWorkspace } from '~/composables/useDesktopAuth'

export interface GitHubUser {
  login: string
  name: string | null
  avatarUrl: string
  email: string | null
  htmlUrl: string
  bio: string | null
  publicRepos: number
  followers: number
}

export interface GitHubAuth {
  accessToken: string
  scopes: string
  user: GitHubUser
}

interface AuthState {
  github: GitHubAuth | null
  apiToken: string | null
  apiUser: ApiUser | null
  activeWorkspaceId: string | null
  workspaces: ApiWorkspace[]
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    github: null,
    apiToken: null,
    apiUser: null,
    activeWorkspaceId: null,
    workspaces: [],
  }),

  getters: {
    isGitHubConnected: (state): boolean => !!state.github?.accessToken,
    githubUser: (state): GitHubUser | null => state.github?.user ?? null,
    githubToken: (state): string | null => state.github?.accessToken ?? null,
    isApiAuthenticated: (state): boolean => !!state.apiToken && !!state.apiUser,
    activeWorkspace: (state): ApiWorkspace | null =>
      state.workspaces.find(w => w.id === state.activeWorkspaceId) ?? state.workspaces[0] ?? null,
  },

  actions: {
    async load() {
      try {
        const { useTauriStore } = await import('~/composables/useTauriStore')
        const store = useTauriStore()
        const saved = await store.get<AuthState>('auth-state')
        if (saved) {
          this.github            = saved.github ?? null
          this.apiToken          = saved.apiToken ?? null
          this.apiUser           = saved.apiUser ?? null
          this.activeWorkspaceId = saved.activeWorkspaceId ?? null
          this.workspaces        = saved.workspaces ?? []
        }
      } catch { /* Tauri not available */ }
    },

    async _persist() {
      try {
        const { useTauriStore } = await import('~/composables/useTauriStore')
        const store = useTauriStore()
        await store.set('auth-state', {
          github:            this.github,
          apiToken:          this.apiToken,
          apiUser:           this.apiUser,
          activeWorkspaceId: this.activeWorkspaceId,
          workspaces:        this.workspaces,
        })
        await store.save()
      } catch { /* Tauri not available */ }
    },

    async setGitHubAuth(auth: GitHubAuth) {
      this.github = auth
      await this._persist()
    },

    async logoutGitHub() {
      this.github = null
      await this._persist()
    },

    async loginWithApi(email: string, password: string) {
      const { apiLogin, apiFetchWorkspaces } = await import('~/composables/useDesktopAuth')
      const { token, user } = await apiLogin(email, password)
      this.apiToken = token
      this.apiUser  = user
      const workspaces = await apiFetchWorkspaces(token)
      this.workspaces = workspaces
      if (workspaces.length === 1) {
        this.activeWorkspaceId = workspaces[0]!.id
      }
      await this._persist()
    },

    async logoutApi() {
      this.apiToken          = null
      this.apiUser           = null
      this.activeWorkspaceId = null
      this.workspaces        = []
      await this._persist()
    },

    async setActiveWorkspace(id: string) {
      this.activeWorkspaceId = id
      await this._persist()
    },

    // Fetch authenticated user info from GitHub REST API
    async fetchGitHubUser(token: string): Promise<GitHubUser> {
      const resp = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      })
      if (!resp.ok) throw new Error(`GitHub user fetch failed: ${resp.status}`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await resp.json() as any
      return {
        login: data.login as string,
        name: (data.name as string) ?? null,
        avatarUrl: data.avatar_url as string,
        email: (data.email as string) ?? null,
        htmlUrl: data.html_url as string,
        bio: (data.bio as string) ?? null,
        publicRepos: (data.public_repos as number) ?? 0,
        followers: (data.followers as number) ?? 0,
      }
    },

    // List repos the authenticated user can access (including non-owned)
    async fetchUserRepos(opts: { q?: string; page?: number } = {}): Promise<GitHubRepo[]> {
      if (!this.github?.accessToken) throw new Error('Not authenticated with GitHub')
      const { q, page = 1 } = opts
      const token = this.github.accessToken

      let url: string
      if (q) {
        url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&per_page=30&page=${page}&sort=updated`
      } else {
        url = `https://api.github.com/user/repos?per_page=30&page=${page}&sort=updated&affiliation=owner,collaborator,organization_member`
      }

      const resp = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      })
      if (!resp.ok) throw new Error(`GitHub repos fetch failed: ${resp.status}`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await resp.json() as any
      const items = (q ? (data as { items: unknown[] }).items : data) as Array<Record<string, unknown>>
      return items.map(r => ({
        id: r.id as number,
        fullName: r.full_name as string,
        name: r.name as string,
        owner: (r.owner as Record<string, string>).login,
        private: r.private as boolean,
        description: (r.description as string) ?? null,
        htmlUrl: r.html_url as string,
        cloneUrl: r.clone_url as string,
        defaultBranch: (r.default_branch as string) ?? 'main',
        stargazersCount: (r.stargazers_count as number) ?? 0,
        updatedAt: (r.updated_at as string) ?? '',
      }))
    },

    // Create a GitHub issue on any repo (owned or not — requires write access)
    async createGitHubIssue(opts: {
      owner: string
      repo: string
      title: string
      body?: string
      labels?: string[]
    }): Promise<{ number: number; htmlUrl: string }> {
      if (!this.github?.accessToken) throw new Error('Not authenticated with GitHub')
      const resp = await fetch(`https://api.github.com/repos/${opts.owner}/${opts.repo}/issues`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.github.accessToken}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify({
          title: opts.title,
          body: opts.body ?? '',
          labels: opts.labels ?? [],
        }),
      })
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({})) as Record<string, unknown>
        throw new Error((err.message as string) || `GitHub issue creation failed: ${resp.status}`)
      }
      const issue = await resp.json() as Record<string, unknown>
      return { number: issue.number as number, htmlUrl: issue.html_url as string }
    },
  },
})

export interface GitHubRepo {
  id: number
  fullName: string
  name: string
  owner: string
  private: boolean
  description: string | null
  htmlUrl: string
  cloneUrl: string
  defaultBranch: string
  stargazersCount: number
  updatedAt: string
}
