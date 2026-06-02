<script setup lang="ts">
import { Bot, Cloud } from 'lucide-vue-next'
import type { Member } from '~/types/vindicta'

defineProps<{ projectPath: string }>()

const claudeMember: Member = {
  id: 'member_claude',
  name: 'Claude',
  email: 'claude@anthropic.com',
  avatarUrl: null,
  isAI: true,
  roleIds: [],
  joinedAt: new Date().toISOString(),
}
</script>

<template>
  <div class="p-6 max-w-xl space-y-5">
    <!-- Cloud edition callout -->
    <div class="flex items-start gap-3 p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
      <Cloud class="size-4 mt-0.5 shrink-0 text-indigo-400" />
      <div>
        <p class="text-sm font-medium text-indigo-300">Team members available in the cloud edition</p>
        <p class="text-xs text-[var(--text-muted)] mt-1">
          Vindicter currently runs locally on this device. Real-time collaboration, role management, and team workspaces are coming in a future cloud release.
        </p>
      </div>
    </div>

    <!-- Claude is always here -->
    <div>
      <h3 class="text-[10px] font-semibold text-[var(--text-faint)] uppercase tracking-[0.12em] mb-3">Default AI Assistant</h3>
      <div class="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-card)]">
        <div class="size-9 rounded-full bg-violet-600/20 border border-violet-500/20 flex items-center justify-center shrink-0">
          <Bot class="size-4 text-violet-300" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-[var(--text)]">Claude</span>
            <span class="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400 font-semibold uppercase tracking-wide">AI</span>
          </div>
          <p class="text-[11px] text-[var(--text-muted)] mt-0.5">Anthropic Claude Code — always available in every project</p>
        </div>
      </div>
    </div>
  </div>
</template>
