<script setup lang="ts">
import { Bot, Code2, Sparkles, Wrench, Lock } from 'lucide-vue-next'
import type { AIToolSlug } from '~/types/vindicta'

const wizard = useWizardStore()

const tools: { slug: AIToolSlug; name: string; icon: any; available: boolean; note?: string; description: string }[] = [
  {
    slug: 'codex',
    name: 'Codex',
    icon: Sparkles,
    available: true,
    description: 'Plan changes, edit code, run checks, and keep project work moving.',
  },
  {
    slug: 'claude_code',
    name: 'Claude Code',
    icon: Bot,
    available: true,
    description: 'Analyze the codebase and help reason about tickets, gaps, and implementation.',
  },
  {
    slug: 'copilot',
    name: 'GitHub Copilot',
    icon: Code2,
    available: false,
    note: 'coming soon',
    description: 'Pair with IDE assistance when this integration is available.',
  },
  {
    slug: 'codeium',
    name: 'Codeium',
    icon: Sparkles,
    available: false,
    note: 'coming soon',
    description: 'Use Codeium workflows when this integration is available.',
  },
  {
    slug: 'other',
    name: 'Other',
    icon: Wrench,
    available: false,
    note: 'coming soon',
    description: 'Reserve space for another AI tool in your project workflow.',
  },
]

function isSelected(slug: AIToolSlug) {
  return wizard.selectedAITools.includes(slug)
}

function toggleTool(slug: AIToolSlug) {
  if (isSelected(slug)) {
    if (wizard.selectedAITools.length === 1) return
    wizard.selectedAITools = wizard.selectedAITools.filter(tool => tool !== slug)
  }
  else {
    wizard.selectedAITools = [...wizard.selectedAITools, slug]
  }
}
</script>

<template>
  <div class="space-y-5">
    <div>
      <h3 class="text-base font-semibold text-white mb-1">Your AI tools</h3>
      <p class="text-sm text-white/40">
        Select one or more AI tools for this project. Vindicter can track the tools you plan to use and ask which one should drive the project workflow.
      </p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <button
        v-for="tool in tools"
        :key="tool.slug"
        :disabled="!tool.available"
        class="relative glass flex items-start gap-3 p-4 rounded-xl text-left transition-all"
        :class="[
          !tool.available
            ? 'opacity-45 cursor-not-allowed'
            : 'glass-hover',
          isSelected(tool.slug) && tool.available
            ? 'border-indigo-500/50 bg-indigo-500/10 glow-border-purple'
            : '',
        ]"
        @click="tool.available && toggleTool(tool.slug)"
      >
        <div class="size-9 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0">
          <component :is="tool.icon" class="size-4" :class="isSelected(tool.slug) ? 'text-indigo-300' : 'text-white/40'" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium" :class="isSelected(tool.slug) ? 'text-indigo-200' : 'text-white/70'">
              {{ tool.name }}
            </span>
            <span v-if="tool.note" class="text-[10px] text-white/25">{{ tool.note }}</span>
          </div>
          <p class="text-xs text-white/35 mt-1 leading-relaxed">{{ tool.description }}</p>
        </div>
        <div
          class="size-4 rounded border flex items-center justify-center shrink-0 mt-0.5"
          :class="isSelected(tool.slug) && tool.available ? 'border-indigo-400 bg-indigo-500' : 'border-white/15 bg-white/[0.03]'"
        >
          <svg v-if="isSelected(tool.slug) && tool.available" class="size-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          <Lock v-else-if="!tool.available" class="size-2.5 text-white/30" />
        </div>
      </button>
    </div>

    <div class="glass-sm p-4 rounded-xl border-indigo-500/20 bg-indigo-500/5">
      <p class="text-xs text-white/50 leading-relaxed">
        You can select multiple tools now. The first time you open the project, Vindicter will ask which tool should be active for the project workspace.
      </p>
    </div>
  </div>
</template>
