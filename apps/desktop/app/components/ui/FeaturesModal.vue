<script setup lang="ts">
import { Bot, FileSearch, KeyRound, PackageSearch, ShieldCheck, Zap } from 'lucide-vue-next'

const app = useAppStore()

const dontShowAgain = ref(false)
const show = computed(() => app.launched && !app.featuresModalDismissed)

function close() {
  if (dontShowAgain.value) {
    app.dismissFeaturesModal()
  }
  else {
    // Dismiss for this session only (don't persist)
    app.featuresModalDismissed = true
  }
}

const features = [
  {
    icon: ShieldCheck,
    color: 'text-emerald-300',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    title: 'AI Security Workspace',
    description: 'Run automated vulnerability scans using Codex or Claude against any local project. Get OWASP-mapped findings with evidence and remediation steps.',
  },
  {
    icon: Bot,
    color: 'text-violet-300',
    bg: 'bg-violet-500/10 border-violet-500/20',
    title: 'Multi-AI Support',
    description: 'Use Codex CLI or Claude CLI for security analysis. Switch between AI tools per scan to get different perspectives on your codebase.',
  },
  {
    icon: FileSearch,
    color: 'text-indigo-300',
    bg: 'bg-indigo-500/10 border-indigo-500/20',
    title: 'Remediation Tracking',
    description: 'Convert scan findings into tracked remediation items. Update status, view full evidence, and export professional security reports as DOCX.',
  },
  {
    icon: PackageSearch,
    color: 'text-sky-300',
    bg: 'bg-sky-500/10 border-sky-500/20',
    title: 'Dependency Inventory',
    description: 'Automatically indexes packages from npm, Cargo, .NET, Python, Go, Maven, Gradle, PHP, and Ruby projects. Flags missing lockfiles and floating versions.',
  },
  {
    icon: KeyRound,
    color: 'text-amber-300',
    bg: 'bg-amber-500/10 border-amber-500/20',
    title: 'Secrets Scanner',
    description: 'Scans source files for API keys, tokens, passwords, and private key material using conservative local pattern matching — no data leaves your machine.',
  },
  {
    icon: Zap,
    color: 'text-orange-300',
    bg: 'bg-orange-500/10 border-orange-500/20',
    title: 'MCP Server',
    description: 'Expose Vindicter as an MCP server so AI agents can run diagnostics, query findings, and trigger scans programmatically from external tools.',
  },
]
</script>

<template>
  <GlassModal :model-value="show" title="Welcome to Vindicter" max-width="lg" @update:model-value="close">
    <div class="space-y-5">
      <p class="text-sm leading-relaxed text-[var(--text-muted)]">
        Vindicter is an AI-powered security platform. Here's everything you can do:
      </p>

      <div class="grid gap-3 sm:grid-cols-2">
        <div
          v-for="feature in features"
          :key="feature.title"
          class="rounded-xl border p-4"
          :class="feature.bg"
        >
          <div class="flex items-center gap-2">
            <component :is="feature.icon" class="size-4 shrink-0" :class="feature.color" />
            <h3 class="text-sm font-semibold text-[var(--text)]">{{ feature.title }}</h3>
          </div>
          <p class="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">{{ feature.description }}</p>
        </div>
      </div>

      <div class="flex items-center justify-between border-t border-[var(--border)] pt-4">
        <GlassCheckbox v-model="dontShowAgain" size="sm" class="text-xs text-[var(--text-muted)]">
          Don't show this again
        </GlassCheckbox>
        <button
          class="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500"
          @click="close"
        >
          Get Started
        </button>
      </div>
    </div>
  </GlassModal>
</template>
