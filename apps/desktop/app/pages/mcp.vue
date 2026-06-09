<script setup lang="ts">
import { Plug, Sparkles } from 'lucide-vue-next'
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center select-none">
    <div class="grid size-16 place-items-center rounded-2xl border border-violet-500/25 bg-violet-500/10 mb-6">
      <Plug class="size-7 text-violet-300/70" />
    </div>

    <div class="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/[0.07] px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-violet-300/70 mb-5">
      <Sparkles class="size-3" />
      Coming Soon
    </div>

    <h1 class="text-2xl font-bold tracking-tight text-[var(--text)] mb-3">MCP Integration</h1>
    <p class="max-w-md text-sm leading-relaxed text-[var(--text-muted)]">
      The Vindicter MCP server — exposing your security findings, scan history, and project context to AI agents via the Model Context Protocol — is under active development and will be available in an upcoming release.
    </p>

    <div class="mt-8 grid gap-3 sm:grid-cols-3 max-w-lg w-full">
      <div class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 text-center">
        <p class="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-faint)] mb-1">Protocol</p>
        <p class="text-xs font-semibold text-violet-300">MCP 2024-11-05</p>
      </div>
      <div class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 text-center">
        <p class="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-faint)] mb-1">Tools</p>
        <p class="text-xs font-semibold text-[var(--text)]">6 planned</p>
      </div>
      <div class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 text-center">
        <p class="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-faint)] mb-1">Status</p>
        <p class="text-xs font-semibold text-amber-300">In development</p>
      </div>
    </div>
  </div>
</template>
