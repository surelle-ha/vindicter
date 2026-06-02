import { defineStore } from 'pinia'
import type { AIToolSlug, ProjectMeta } from '~/types/vindicta'

function normalizeProjectMeta(project: ProjectMeta): ProjectMeta {
  const legacyTool = (project.aiTool ?? 'claude_code') as AIToolSlug
  const aiTools = project.aiTools?.length ? project.aiTools : [legacyTool]
  return {
    ...project,
    aiTool: legacyTool,
    aiTools,
    activeAITool: project.activeAITool ?? null,
  }
}

export const useProjectsStore = defineStore('projects', {
  state: () => ({
    projects: [] as ProjectMeta[],
    activeProjectId: null as string | null,
    loading: false,
  }),

  getters: {
    activeProject: (s) => s.projects.find((p) => p.id === s.activeProjectId) ?? null,
    hasProjects: (s) => s.projects.length > 0,
  },

  actions: {
    async loadProjects() {
      let activeProjectId: string | null = null
      try {
        const { useTauriStore } = await import('~/composables/useTauriStore')
        const store = useTauriStore()
        const projects = await store.get<ProjectMeta[]>('projects')
        activeProjectId = await store.get<string>('active-project-id')
        if (projects) this.projects = projects.map(normalizeProjectMeta)
      }
      catch {
        const raw = localStorage.getItem('vindicter_projects')
        if (raw) this.projects = JSON.parse(raw).map(normalizeProjectMeta)
        activeProjectId = localStorage.getItem('vindicter_active_project_id')
      }

      if (activeProjectId && this.projects.some(p => p.id === activeProjectId)) {
        this.activeProjectId = activeProjectId
      }
      else if (!this.activeProjectId || !this.projects.some(p => p.id === this.activeProjectId)) {
        this.activeProjectId = this.projects[0]?.id ?? null
      }
    },

    async saveProjects() {
      try {
        const { useTauriStore } = await import('~/composables/useTauriStore')
        const store = useTauriStore()
        await store.set('projects', this.projects)
        await store.save()
      }
      catch {
        localStorage.setItem('vindicter_projects', JSON.stringify(this.projects))
      }
    },

    async addProject(meta: ProjectMeta) {
      this.projects.push(normalizeProjectMeta(meta))
      await this.saveProjects()
    },

    async removeProject(id: string) {
      this.projects = this.projects.filter((p) => p.id !== id)
      await this.saveProjects()
    },

    async updateProjectMeta(id: string, partial: Partial<ProjectMeta>) {
      const idx = this.projects.findIndex((p) => p.id === id)
      if (idx === -1) return
      this.projects[idx] = { ...this.projects[idx]!, ...partial }
      await this.saveProjects()
    },

    setActive(id: string) {
      this.activeProjectId = id
      void this.saveActiveProject()
    },

    async saveActiveProject() {
      try {
        const { useTauriStore } = await import('~/composables/useTauriStore')
        const store = useTauriStore()
        await store.set('active-project-id', this.activeProjectId)
        await store.save()
      }
      catch {
        if (this.activeProjectId) {
          localStorage.setItem('vindicter_active_project_id', this.activeProjectId)
        }
        else {
          localStorage.removeItem('vindicter_active_project_id')
        }
      }
    },
  },
})
