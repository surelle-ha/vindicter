<script setup lang="ts">
import { Building2, Crown, Loader2, Plus, Shield } from 'lucide-vue-next'
import type { ApiWorkspace } from '~/composables/useDesktopAuth'

const props = defineProps<{
  workspaces: ApiWorkspace[]
  modelValue: boolean
}>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  select: [workspaceId: string]
  create: [name: string]
}>()

const auth = useAuthStore()
const newName   = ref('')
const creating  = ref(false)
const createErr = ref('')

function planBadge(ws: ApiWorkspace) {
  const name = ws.subscription?.plan?.name ?? 'Free'
  return name
}

function roleIcon(role: string) {
  if (role === 'owner') return Crown
  if (role === 'admin') return Shield
  return Building2
}

function select(id: string) {
  emit('select', id)
  emit('update:modelValue', false)
}

async function createWorkspace() {
  if (!newName.value.trim()) return
  creating.value  = true
  createErr.value = ''
  try {
    const { apiCreateWorkspace } = await import('~/composables/useDesktopAuth')
    const ws = await apiCreateWorkspace(auth.apiToken!, newName.value.trim())
    auth.workspaces = [...auth.workspaces, ws]
    await auth.setActiveWorkspace(ws.id)
    emit('update:modelValue', false)
  } catch (e) {
    createErr.value = e instanceof Error ? e.message : 'Failed to create workspace.'
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <GlassModal :model-value="modelValue" title="Choose Workspace" max-width="sm" @update:model-value="emit('update:modelValue', $event)">
    <div class="space-y-3">
      <p class="text-xs text-[var(--text-muted)]">Select the workspace you want to work in.</p>

      <div class="space-y-1.5 max-h-64 overflow-y-auto">
        <button
          v-for="ws in workspaces"
          :key="ws.id"
          class="w-full flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 text-left transition-all hover:border-violet-500/30 hover:bg-violet-500/[0.04] cursor-pointer"
          :class="auth.activeWorkspaceId === ws.id ? 'border-violet-500/40 bg-violet-500/[0.06]' : ''"
          @click="select(ws.id)"
        >
          <component :is="roleIcon(ws.memberRole)" class="size-4 shrink-0 text-[var(--text-muted)]" />
          <div class="flex-1 min-w-0">
            <p class="text-xs font-semibold text-[var(--text)] truncate">{{ ws.name }}</p>
            <p class="text-[10px] text-[var(--text-faint)] mt-0.5 capitalize">{{ ws.memberRole }}</p>
          </div>
          <span class="shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border border-amber-500/20 bg-amber-500/10 text-amber-300">
            {{ planBadge(ws) }}
          </span>
        </button>
      </div>

      <div class="border-t border-[var(--border)] pt-3 space-y-2">
        <p class="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">New workspace</p>
        <div class="flex gap-2">
          <GlassInput v-model="newName" placeholder="Workspace name" class="flex-1 text-xs" @keydown.enter="createWorkspace" />
          <GlassButton size="sm" :disabled="!newName.trim() || creating" @click="createWorkspace">
            <Loader2 v-if="creating" class="size-3.5 animate-spin" />
            <Plus v-else class="size-3.5" />
          </GlassButton>
        </div>
        <p v-if="createErr" class="text-[10px] text-red-400">{{ createErr }}</p>
      </div>
    </div>
  </GlassModal>
</template>
