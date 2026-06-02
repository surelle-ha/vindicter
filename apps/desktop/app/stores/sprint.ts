import { defineStore } from 'pinia'
import type { Sprint } from '~/types/vindicta'
import { generateId } from '~/utils/id'
import { nowISO } from '~/utils/date'

export const useSprintStore = defineStore('sprint', {
  state: () => ({
    sprints: [] as Sprint[],
    projectPath: null as string | null,
  }),

  getters: {
    activeSprint: (s) => s.sprints.find((sp) => sp.status === 'active') ?? null,
    plannedSprints: (s) => s.sprints.filter((sp) => sp.status === 'planned'),
    completedSprints: (s) => s.sprints.filter((sp) => sp.status === 'completed'),
  },

  actions: {
    load(sprints: Sprint[], projectPath: string) {
      this.sprints = sprints
      this.projectPath = projectPath
    },

    async createSprint(partial: Partial<Sprint>): Promise<Sprint> {
      const sprint: Sprint = {
        id: generateId(),
        name: partial.name ?? `Vibe Sprint ${this.sprints.length + 1}`,
        goal: partial.goal ?? '',
        startDate: partial.startDate ?? nowISO(),
        endDate: partial.endDate ?? nowISO(),
        ticketIds: partial.ticketIds ?? [],
        status: 'planned',
        createdAt: nowISO(),
      }
      this.sprints.push(sprint)
      await this.persist()
      await this.recordHistory('sprint:created', 'local', {
        id: sprint.id,
        name: sprint.name,
        goal: sprint.goal,
      })
      return sprint
    },

    async startSprint(id: string) {
      const sprint = this.sprints.find((s) => s.id === id)
      if (!sprint) return
      sprint.status = 'active'
      await this.persist()
      await this.recordHistory('sprint:started', 'local', {
        id: sprint.id,
        name: sprint.name,
      })
    },

    async completeSprint(id: string, completedTicketIds?: string[]) {
      const sprint = this.sprints.find((s) => s.id === id)
      if (!sprint) return
      if (completedTicketIds) sprint.ticketIds = completedTicketIds
      sprint.status = 'completed'
      await this.persist()
      await this.recordHistory('sprint:completed', 'local', {
        id: sprint.id,
        name: sprint.name,
        completedTicketIds: completedTicketIds ?? sprint.ticketIds,
      })
    },

    async assignTicket(ticketId: string, sprintId: string) {
      const sprint = this.sprints.find((s) => s.id === sprintId)
      if (!sprint || sprint.ticketIds.includes(ticketId)) return
      sprint.ticketIds.push(ticketId)
      await this.persist()
      await this.recordHistory('sprint:ticket_assigned', 'local', {
        id: sprint.id,
        name: sprint.name,
        ticketId,
      })
    },

    async removeTicket(ticketId: string, sprintId: string) {
      const sprint = this.sprints.find((s) => s.id === sprintId)
      if (!sprint) return
      sprint.ticketIds = sprint.ticketIds.filter((id) => id !== ticketId)
      await this.persist()
      await this.recordHistory('sprint:ticket_removed', 'local', {
        id: sprint.id,
        name: sprint.name,
        ticketId,
      })
    },

    async persist() {
      if (!this.projectPath) return
      const { useVindicterJson } = await import('~/composables/useVindicterJson')
      const { patchSprints } = useVindicterJson()
      await patchSprints(this.projectPath, this.sprints)
    },

    async recordHistory(action: string, actor: string, payload: Record<string, unknown>) {
      if (!this.projectPath) return
      const { useVindicterJson } = await import('~/composables/useVindicterJson')
      const { appendHistory } = useVindicterJson()
      await appendHistory(this.projectPath, { action, actor, payload }).catch(() => {})
    },
  },
})
