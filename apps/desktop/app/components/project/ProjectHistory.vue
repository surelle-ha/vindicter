<script setup lang="ts">
import { RefreshCw } from 'lucide-vue-next'
import type { HistoryEntry } from '~/types/vindicta'

const props = defineProps<{
  projectPath: string
  projectId?: string | null
}>()

const historyStore = useHistoryStore()
const projects = useProjectsStore()

const history = ref<HistoryEntry[]>([])
const loading = ref(true)

const resolvedProjectId = computed(() => {
  if (props.projectId) return props.projectId
  return projects.projects.find(p => p.absolutePath === props.projectPath)?.id ?? null
})

async function loadHistory() {
  loading.value = true
  history.value = []
  try {
    const id = resolvedProjectId.value
    if (id) {
      history.value = await historyStore.load(id)
      return
    }
    // Legacy fallback: try to read from vindicta.json (migration path)
    const { read } = useVindicterJson()
    const data = await read(props.projectPath)
    history.value = data.history ?? []
    // Migrate legacy entries into the Tauri store
    if (history.value.length && id) {
      for (const entry of [...history.value].reverse()) {
        await historyStore.append(id, { action: entry.action, actor: entry.actor, payload: entry.payload })
      }
    }
  }
  catch {
    history.value = []
  }
  finally {
    loading.value = false
  }
}

watch([() => props.projectPath, resolvedProjectId], loadHistory, { immediate: true })

const actionLabels: Record<string, string> = {
  'project:created': 'Created project',
  'project:updated': 'Updated project',
  'project:docs_updated': 'Updated project docs',
  'project:health_checked': 'Ran engineering health check',
  'project:data_reset': 'Reset project data',
  'security:scan_completed': 'Completed security scan',
  'security:finding_created': 'Created security finding',
  'security:finding_updated': 'Updated finding status',
  'security:finding_whitelisted': 'Whitelisted finding',
}

function actionIcon(action: string): string {
  if (action.startsWith('security:scan')) return '🔍'
  if (action.startsWith('security:finding')) return '🛡️'
  if (action.startsWith('project:')) return '📁'
  return '📝'
}
</script>

<template>
  <div class="max-w-2xl">
    <div class="flex items-center justify-between mb-4">
      <p class="text-xs text-[var(--text-faint)]">{{ history.length }} event{{ history.length !== 1 ? 's' : '' }}</p>
      <button
        class="flex items-center gap-1 text-[10px] text-[var(--text-faint)] hover:text-[var(--text-muted)] transition-colors cursor-pointer"
        @click="loadHistory"
      >
        <RefreshCw class="size-3" :class="loading ? 'animate-spin' : ''" />
        Refresh
      </button>
    </div>

    <div v-if="loading" class="text-center py-12 text-white/30 text-sm">
      Loading history…
    </div>

    <div v-else-if="history.length === 0" class="text-center py-12 text-white/30 text-sm">
      No history yet. Security scans, findings, and settings changes will appear here.
    </div>

    <div v-else class="space-y-1">
      <div
        v-for="entry in history"
        :key="entry.id"
        class="flex items-start gap-3 py-3 px-4 rounded-lg hover:bg-white/5 transition-colors"
      >
        <div class="mt-1.5 size-2 rounded-full bg-indigo-500/50 shrink-0" />

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-sm text-white/80">
              {{ actionLabels[entry.action] ?? entry.action }}
            </span>
            <span v-if="(entry.payload as any)?.name" class="text-xs text-indigo-300 font-medium truncate">
              "{{ (entry.payload as any).name }}"
            </span>
          </div>
          <div class="flex items-center gap-2 mt-0.5">
            <span class="text-xs text-white/30">{{ entry.actor }}</span>
            <span class="text-white/20">·</span>
            <span class="text-xs text-white/30">{{ formatRelative(entry.at) }}</span>
          </div>
          <div v-if="(entry.payload as any)?.findings != null" class="mt-1 text-xs text-white/25">
            {{ (entry.payload as any).findings }} finding{{ (entry.payload as any).findings !== 1 ? 's' : '' }} found
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
