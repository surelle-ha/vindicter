import { defineStore } from 'pinia'
import type { HistoryEntry } from '~/types/vindicta'
import { generateId } from '~/utils/id'
import { nowISO } from '~/utils/date'

const STORE_KEY_PREFIX = 'project-history:'
const MAX_ENTRIES = 200

export const useHistoryStore = defineStore('history', () => {
  // In-memory cache: projectId → entries (newest first)
  const cache = ref<Record<string, HistoryEntry[]>>({})

  async function _tauriStore() {
    try {
      const { useTauriStore } = await import('~/composables/useTauriStore')
      return useTauriStore()
    }
    catch { return null }
  }

  async function load(projectId: string): Promise<HistoryEntry[]> {
    if (cache.value[projectId]) return cache.value[projectId]!
    try {
      const store = await _tauriStore()
      if (store) {
        const saved = await store.get<HistoryEntry[]>(`${STORE_KEY_PREFIX}${projectId}`)
        if (saved?.length) {
          cache.value[projectId] = saved
          return saved
        }
      }
    }
    catch { /* fallback */ }
    cache.value[projectId] = []
    return []
  }

  async function append(projectId: string, entry: Omit<HistoryEntry, 'id' | 'at'>) {
    const existing = await load(projectId)
    const full: HistoryEntry = { id: generateId(), at: nowISO(), ...entry }
    const next = [full, ...existing].slice(0, MAX_ENTRIES)
    cache.value[projectId] = next
    try {
      const store = await _tauriStore()
      if (store) {
        await store.set(`${STORE_KEY_PREFIX}${projectId}`, next)
        await store.save()
      }
    }
    catch { /* non-critical */ }
    return full
  }

  async function clearForProject(projectId: string) {
    cache.value[projectId] = []
    try {
      const store = await _tauriStore()
      if (store) {
        await store.delete(`${STORE_KEY_PREFIX}${projectId}`)
        await store.save()
      }
    }
    catch { /* non-critical */ }
  }

  return { load, append, clearForProject }
})
