<script setup lang="ts">
import { GitBranch } from 'lucide-vue-next'
import type { ProjectMeta } from '~/types/vindicta'

const props = defineProps<{
  project: ProjectMeta
}>()
</script>

<template>
  <div class="flex items-start justify-between gap-6">
    <div class="min-w-0 flex-1">
      <h1 class="text-2xl font-bold text-[var(--text)]">{{ project.name }}</h1>
      <p v-if="project.description" class="text-sm text-[var(--text-muted)] mt-0.5 max-w-xl break-words">{{ project.description }}</p>
      <div class="flex items-center gap-2 mt-2">
        <div class="flex items-center gap-1.5 text-xs text-[var(--text-faint)]">
          <GitBranch class="size-3" />
          <span class="truncate max-w-xs">{{ project.absolutePath }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
