<script setup lang="ts">
import type { HistoryEntry } from '~/types/vindicta'

const props = defineProps<{
  projectPath: string
}>()

const history = ref<HistoryEntry[]>([])
const loading = ref(true)

async function loadHistory() {
  loading.value = true
  try {
    const { read } = useVindicterJson()
    const data = await read(props.projectPath)
    history.value = data.history
  }
  catch {
    history.value = []
  }
  finally {
    loading.value = false
  }
}

watch(() => props.projectPath, loadHistory, { immediate: true })

const actionLabels: Record<string, string> = {
  'project:created': 'Created project',
  'project:updated': 'Updated project',
  'project:docs_updated': 'Updated project docs',
  'project:health_checked': 'Ran engineering health check',
  'project:data_reset': 'Reset project data',
  'ticket:created': 'Created ticket',
  'ticket:updated': 'Updated ticket',
  'ticket:moved': 'Moved ticket',
  'ticket:commented': 'Commented on ticket',
  'ticket:deleted': 'Deleted ticket',
  'sprint:created': 'Created sprint',
  'sprint:started': 'Started sprint',
  'sprint:completed': 'Completed sprint',
  'sprint:ticket_assigned': 'Added ticket to sprint',
  'sprint:ticket_removed': 'Removed ticket from sprint',
  'security:scan_completed': 'Completed security scan',
}
</script>

<template>
  <div class="max-w-2xl">
    <div v-if="loading" class="text-center py-12 text-white/30 text-sm">
      Loading history...
    </div>

    <div v-else-if="history.length === 0" class="text-center py-12 text-white/30 text-sm">
      No history yet. Actions taken on this project will appear here.
    </div>

    <div v-else class="space-y-1">
      <div
        v-for="entry in history"
        :key="entry.id"
        class="flex items-start gap-3 py-3 px-4 rounded-lg hover:bg-white/5 transition-colors"
      >
        <!-- Dot -->
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
        </div>
      </div>
    </div>
  </div>
</template>
