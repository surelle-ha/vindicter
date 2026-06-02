<script setup lang="ts">
import { FolderKanban, ArrowRight, GitBranch, X } from 'lucide-vue-next'
import type { AIToolSlug, ProjectMeta } from '~/types/vindicta'

const props = defineProps<{
  project: ProjectMeta
}>()

const emit = defineEmits<{
  open: [id: string]
  delete: [id: string]
}>()

const { notify } = useNotifications()
const showDeleteModal = ref(false)
const confirmName = ref('')
const deleting = ref(false)

const nameMatches = computed(() => confirmName.value.trim() === props.project.name)
const aiToolNames: Record<AIToolSlug, string> = {
  codex: 'Codex',
  claude_code: 'Claude Code',
  copilot: 'GitHub Copilot',
  codeium: 'Codeium',
  other: 'Other',
}
const aiToolBadges = computed(() => {
  const tools = props.project.aiTools?.length ? props.project.aiTools : [props.project.aiTool]
  return [...new Set(tools)].map(tool => aiToolNames[tool] ?? tool)
})

watch(showDeleteModal, (open) => {
  if (!open) confirmName.value = ''
})

async function removeOnly() {
  if (!nameMatches.value) return
  deleting.value = true
  emit('delete', props.project.id)
  notify(`Project "${props.project.name}" removed`, 'success')
  showDeleteModal.value = false
  deleting.value = false
}

async function deleteFiles() {
  if (!nameMatches.value) return
  deleting.value = true
  const fs = useTauriFs()
  try {
    await fs.removeFile(`${props.project.absolutePath}/vindicta.json`)
  }
  catch { /* file may already be gone */ }
  emit('delete', props.project.id)
  notify(`Project "${props.project.name}" deleted`, 'success')
  showDeleteModal.value = false
  deleting.value = false
}
</script>

<template>
  <div
    class="glass glass-hover p-5 cursor-pointer group relative"
    @click="$emit('open', project.id)"
  >
    <!-- Delete button (hover-revealed) -->
    <button
      class="absolute top-3 right-3 size-6 flex items-center justify-center rounded-md text-[var(--text-faint)] hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all z-10"
      @click.stop="showDeleteModal = true"
    >
      <X class="size-3.5" />
    </button>

    <!-- Header -->
    <div class="flex items-start justify-between mb-4">
      <div class="size-10 rounded-xl bg-gradient-to-br from-indigo-500/30 to-violet-500/30 border border-indigo-500/20 flex items-center justify-center">
        <FolderKanban class="size-5 text-indigo-300" />
      </div>
      <ArrowRight class="size-4 text-[var(--text-faint)] group-hover:text-[var(--text-muted)] transition-colors translate-x-0 group-hover:translate-x-1 transition-transform" />
    </div>

    <!-- Name & description -->
    <h3 class="font-semibold text-[var(--text)] text-sm mb-1 truncate">{{ project.name }}</h3>
    <p v-if="project.description" class="text-xs text-[var(--text-muted)] mb-4 line-clamp-2">{{ project.description }}</p>

    <!-- Footer -->
    <div class="flex items-center gap-3 mt-auto">
      <GlassBadge variant="purple" size="sm">{{ project.editor }}</GlassBadge>
      <GlassBadge v-for="tool in aiToolBadges" :key="tool" variant="info" size="sm">{{ tool }}</GlassBadge>
    </div>

    <!-- Path -->
    <div class="mt-3 flex items-center gap-1.5 text-xs text-[var(--text-faint)]">
      <GitBranch class="size-3 shrink-0" />
      <span class="truncate">{{ project.absolutePath }}</span>
    </div>
  </div>

  <!-- Delete modal -->
  <GlassModal v-model="showDeleteModal" title="Remove project" max-width="sm">
    <div class="space-y-4">
      <p class="text-sm text-[var(--text-muted)]">
        This will remove <span class="text-[var(--text)] font-semibold">{{ project.name }}</span> from Vindicter.
      </p>

      <div>
        <label class="text-xs text-[var(--text-muted)] mb-1.5 block">
          Type <span class="text-[var(--text)] font-mono font-medium">{{ project.name }}</span> to confirm
        </label>
        <GlassInput
          v-model="confirmName"
          :placeholder="project.name"
          @keydown.enter="nameMatches && removeOnly()"
        />
      </div>

      <p class="text-xs text-[var(--text-faint)] bg-[var(--bg-card)] rounded-lg p-3 border border-[var(--border)]">
        Your project files are never deleted unless you choose "Delete project files" below.
      </p>

      <div class="flex flex-col gap-2 pt-1">
        <GlassButton
          size="sm"
          variant="ghost"
          class="justify-start"
          :disabled="!nameMatches || deleting"
          @click="removeOnly"
        >
          Remove from Vindicter only
          <span class="ml-auto text-[var(--text-faint)] text-[10px]">keeps your files</span>
        </GlassButton>
        <GlassButton
          size="sm"
          class="justify-start bg-red-600/10 text-red-400 border-red-500/20 hover:bg-red-600/20"
          :disabled="!nameMatches || deleting"
          @click="deleteFiles"
        >
          Delete project files
          <span class="ml-auto text-red-400/50 text-[10px]">removes vindicta.json</span>
        </GlassButton>
        <GlassButton variant="ghost" size="sm" @click="showDeleteModal = false">Cancel</GlassButton>
      </div>
    </div>
  </GlassModal>
</template>
