<script setup lang="ts">
useLandingSeo({
  title: 'Documentation — Vindicter',
  description: 'Read Vindicter setup, scanning, findings, dependency inventory, secret detection, Academy, and configuration documentation.',
  path: '/docs',
})

const sections = [
  { title: 'Getting Started',      desc: 'Install, launch, and register your first project',     icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { title: 'AI Scanning',          desc: 'Configure Claude, OpenRouter, or Ollama for scans',    icon: 'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18' },
  { title: 'Findings & Triaging',  desc: 'Manage severity, status, evidence, and remediation',   icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { title: 'Dependency Inventory', desc: 'Scan Node, Rust, Python, Go, .NET, and more',          icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4' },
  { title: 'Secret Detection',     desc: 'Local pattern checks for tokens, keys, and secrets',   icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z' },
  { title: 'Vindicter Academy',     desc: 'Bootcamp structure, Professor AI, and TTS narration',  icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z' },
  { title: 'Configuration',        desc: 'vindicta.json schema, settings, and local storage',    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  { title: 'AI Providers',         desc: 'Connect Claude, OpenRouter, Ollama, and Core AI',      icon: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z' },
]
</script>

<template>
  <div class="flex flex-1 flex-col">
    <main class="flex-1 flex items-center justify-center px-6 py-24">
      <div class="flex flex-col items-center text-center max-w-lg">

        <!-- Icon -->
        <div class="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl border border-warn/25 bg-warn/8">
          <svg class="h-10 w-10 text-warn" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
        </div>

        <!-- Badge -->
        <div class="mb-6 inline-flex items-center gap-2 rounded-full border border-warn/20 bg-warn/8 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-warn/80">
          <span class="h-1.5 w-1.5 rounded-full bg-warn animate-pulse" />
          Under Maintenance
        </div>

        <!-- Title -->
        <h1 class="font-display text-[44px] sm:text-[56px] font-black uppercase leading-none tracking-wide mb-5">
          Documentation
        </h1>

        <p class="text-[14px] leading-relaxed text-white/45 mb-10 max-w-sm">
          The Vindicter documentation site is currently being written. It will cover installation, configuration, scanning, the Academy, and all AI provider integrations.
        </p>

        <!-- Planned sections preview -->
        <div class="w-full mb-10">
          <p class="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/25 mb-4">Planned sections</p>
          <div class="grid grid-cols-2 gap-2.5 text-left">
            <div
              v-for="section in sections"
              :key="section.title"
              class="rounded-xl border border-white/5 bg-surface/40 px-4 py-3 opacity-50"
            >
              <div class="flex items-center gap-2 mb-1">
                <svg class="h-3.5 w-3.5 text-accent/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" :d="section.icon" />
                </svg>
                <span class="text-[11px] font-semibold text-white/60">{{ section.title }}</span>
              </div>
              <p class="text-[10px] text-white/30 leading-relaxed">{{ section.desc }}</p>
            </div>
          </div>
        </div>

        <!-- Interim contact -->
        <div class="w-full mb-10">
          <p class="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/25 mb-4">Need help now?</p>
          <NuxtLink
            to="/support"
            class="flex items-center gap-4 rounded-xl border border-white/8 bg-surface/60 px-5 py-4 text-left transition-all hover:border-accent/30 hover:bg-surface group"
          >
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 border border-accent/20 group-hover:bg-accent/20 transition-colors">
              <svg class="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
              </svg>
            </div>
            <div>
              <p class="text-[13px] font-semibold text-white">Developer Support</p>
              <p class="text-[11px] text-white/40">Email support for setup and configuration help</p>
            </div>
            <svg class="ml-auto h-4 w-4 text-white/20 group-hover:text-white/50 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </NuxtLink>
        </div>

        <NuxtLink to="/" class="text-[12px] text-white/30 hover:text-white/60 transition-colors">
          ← Back to home
        </NuxtLink>
      </div>
    </main>
  </div>
</template>
