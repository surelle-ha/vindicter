<script setup lang="ts">
useLandingSeo({
  title: 'Vindicter - AI-Powered Security Platform',
  description: 'Vindicter is an AI-powered security platform for teams. Automate vulnerability scanning, track findings, inspect dependencies, and detect secrets.',
  path: '/',
})

// ── Scroll-reveal ─────────────────────────────────────────────────────────────
const revealed = ref<Set<string>>(new Set())

onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(e => {
        if (e.isIntersecting && e.target instanceof HTMLElement && e.target.dataset.reveal) {
          revealed.value = new Set([...revealed.value, e.target.dataset.reveal])
        }
      })
    },
    { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
  )
  document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el))
  onUnmounted(() => observer.disconnect())
})

function isRevealed(id: string) {
  return revealed.value.has(id)
}

// ── Features ──────────────────────────────────────────────────────────────────
const features = [
  {
    title: 'Local Project Registry',
    badge: 'Offline',
    badgeColor: 'ok',
    desc: 'Register real codebases and keep full security context tied to the files that live on your machine.',
    icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
    bullets: ['Point to any local directory', 'Security state stored per project', 'Works fully offline'],
  },
  {
    title: 'AI Security Scanning',
    badge: 'Multi-model',
    badgeColor: 'accent',
    desc: 'Run read-only AI reviews for concrete vulnerabilities, abuse paths, evidence, and remediation guidance in seconds.',
    icon: 'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18',
    bullets: ['4 AI providers supported', 'Multi-model aggregate & collaborative modes', '300+ VAPT checks injected into prompt'],
  },
  {
    title: 'Findings Tracker',
    badge: 'Triaged',
    badgeColor: 'warn',
    desc: 'Convert scan results into tracked security items with severity, status, evidence, and remediation guidance.',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    bullets: ['Open / Triaged / Resolved / Wontfix statuses', 'Code evidence with syntax highlighting', 'One-click GitHub issue creation'],
  },
  {
    title: 'Dependency Inventory',
    badge: 'Multi-lang',
    badgeColor: 'accent',
    desc: 'Inspect package manifests across Node, Rust, .NET, Python, Go, Java, PHP, and Ruby ecosystems.',
    icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4',
    bullets: ['8 package ecosystems parsed', 'Shows name, version, license type', 'Feeds directly into scan context'],
  },
  {
    title: 'Secret Detection',
    badge: 'Local',
    badgeColor: 'ok',
    desc: 'Scan text files with conservative local patterns for exposed tokens, keys, passwords, and private key material.',
    icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z',
    bullets: ['API keys, tokens, passwords', 'PEM / private key detection', 'All processing stays local'],
  },
  {
    title: 'Reports & Export',
    badge: 'DOCX',
    badgeColor: 'ok',
    desc: 'Export security reports in multiple formats — Word documents, Markdown, and fix-prompt bundles ready for AI agents.',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    bullets: ['DOCX security review reports', 'Raw AI report export to Markdown', 'Fix-prompt bundles for AI remediation'],
  },
  {
    title: 'Team Workspaces',
    badge: 'Pro',
    badgeColor: 'accent',
    desc: 'Organize projects under team workspaces with seat-based plans and per-workspace subscription management.',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    bullets: ['Free · Pro · Enterprise tiers', 'Seat and project limits per plan', 'Shared workspace findings'],
  },
  {
    title: 'Free to Start',
    badge: 'Free',
    badgeColor: 'ok',
    desc: 'Sign up and start scanning for free. Upgrade to Pro or Enterprise when your team grows.',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    bullets: ['No credit card required', 'Up to 3 projects on free tier', 'Upgrade only when you need more'],
  },
]

// ── Scan types ────────────────────────────────────────────────────────────────
const scanTypes = [
  {
    name: 'Quick Scan',
    subtitle: 'Surface-level · Fast results',
    badge: 'Fast',
    badgeColor: '#23a55a',
    badgeBg: 'rgba(35,165,90,0.15)',
    desc: 'Rapid triage of obvious vulnerabilities. Great for routine checks after commits or dependency updates.',
    stats: [
      { label: 'Speed',         value: 'Very Fast',   color: '#23a55a' },
      { label: 'Finding limit', value: '~20 items',   color: 'rgba(255,255,255,0.6)' },
      { label: 'Depth',         value: 'Surface',     color: 'rgba(255,255,255,0.6)' },
      { label: 'Best for',      value: 'Daily checks',color: 'rgba(255,255,255,0.6)' },
    ],
  },
  {
    name: 'Balanced',
    subtitle: 'Standard depth · Recommended',
    badge: 'Default',
    badgeColor: '#3b82f6',
    badgeBg: 'rgba(59,130,246,0.15)',
    desc: 'Default review depth for routine project checks. Covers core source, API boundaries, config, dependency risks, and trust boundaries.',
    stats: [
      { label: 'Speed',         value: 'Medium',          color: '#3b82f6' },
      { label: 'Finding limit', value: 'Moderate',        color: 'rgba(255,255,255,0.6)' },
      { label: 'Depth',         value: 'Core paths',      color: '#3b82f6' },
      { label: 'Best for',      value: 'Regular reviews', color: 'rgba(255,255,255,0.6)' },
    ],
  },
  {
    name: 'Deep Scan',
    subtitle: 'Full analysis · Evidence-rich',
    badge: 'Thorough',
    badgeColor: '#8b5cf6',
    badgeBg: 'rgba(139,92,246,0.15)',
    desc: 'Exhaustive review with full call-chain traces, abuse paths, and remediation code. Best for pre-release audits.',
    stats: [
      { label: 'Speed',         value: 'Slow–Med',    color: '#f0b232' },
      { label: 'Finding limit', value: 'Unlimited',   color: 'rgba(255,255,255,0.6)' },
      { label: 'Depth',         value: 'Full trace',  color: '#8b5cf6' },
      { label: 'Best for',      value: 'Pre-release', color: 'rgba(255,255,255,0.6)' },
    ],
  },
]

const badgeClass: Record<string, string> = {
  accent: 'bg-accent/15 text-accent',
  ok:     'bg-ok/15 text-ok',
  warn:   'bg-warn/15 text-warn',
}

// ── VAPT framework data ───────────────────────────────────────────────────────
const vaptTypes = [
  { key: 'web_application',      icon: '🌐', label: 'Web App',         count: 30 },
  { key: 'api',                  icon: '⚡', label: 'API / REST',      count: 20 },
  { key: 'mobile_application',   icon: '📱', label: 'Mobile',          count: 15 },
  { key: 'desktop_application',  icon: '🖥️', label: 'Desktop',         count: 10 },
  { key: 'cloud_infrastructure', icon: '☁️', label: 'Cloud Infra',     count: 15 },
  { key: 'iot_embedded',         icon: '🔌', label: 'IoT / Embedded',  count: 13 },
  { key: 'network_infrastructure', icon: '🔗', label: 'Network',       count: 13 },
  { key: 'source_code_library',  icon: '📦', label: 'Library / SDK',   count: 13 },
  { key: 'other',                icon: '🔒', label: 'General',         count: 6  },
]

const vaptPillars = [
  {
    icon: '🎯',
    title: 'Classification-aware checks',
    desc: 'Each project gets a type label — Web App, API, Mobile, Cloud, IoT, and more. Vindicter selects the right catalog automatically.',
    checks: ['Injection flaws (SQLi, XSS, SSTI)', 'Authentication & session attacks', 'Business logic & access control', 'Supply chain & dependency risks', 'Secrets, keys & credential leaks'],
  },
  {
    icon: '🤖',
    title: 'Injected into every AI prompt',
    desc: 'Selected checks are serialized as explicit instructions in the scan prompt — the AI must evaluate and report on each one, even if nothing is found.',
    checks: ['Per-check prompt instructions', 'Granular select / deselect UI', 'Persisted per project', 'Works with all 4 AI providers', 'Multi-model aggregate mode'],
  },
  {
    icon: '📋',
    title: 'Structured, trackable output',
    desc: 'Every finding is parsed into a structured object with title, severity, area, evidence, and recommendation — ready for remediation and GitHub issues.',
    checks: ['Critical / High / Medium / Low / Info', 'File path & code evidence', 'One-click GitHub issue creation', 'Remediation queue tracking', 'Export to DOCX / Markdown'],
  },
]
</script>

<template>
  <div class="flex flex-1 flex-col overflow-x-hidden">
    <!-- ── Hero ─────────────────────────────────────────────────────────────── -->
    <section class="relative flex flex-col items-center justify-center min-h-[92vh] overflow-hidden">

      <!-- Dither background -->
      <div class="absolute inset-0">
        <ClientOnly>
          <Dither
            :wave-speed="0.04"
            :wave-frequency="2.5"
            :wave-amplitude="0.28"
            :wave-color="[0.44, 0.36, 0.58]"
            :color-num="5"
            :pixel-size="2"
            :enable-mouse-interaction="false"
            :mouse-radius="0.9"
          />
        </ClientOnly>
      </div>

      <!-- Bottom gradient fade -->
      <div class="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-base to-transparent pointer-events-none z-10" />

      <!-- Content -->
      <div class="relative z-20 flex flex-col items-center text-center px-6 select-none">

        <!-- Icon + badge -->
        <div class="animate-fade-in mb-8 flex flex-col items-center gap-5" style="animation-delay:0.1s">
          <div class="animate-float relative">
            <img
              src="/icon.png"
              alt="Vindicter"
              class="h-20 w-20 icon-glow"
            />
          </div>
          <div class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-1.5 text-[11px] font-medium uppercase tracking-widest text-white/50 backdrop-blur-sm">
            <span class="h-1.5 w-1.5 rounded-full bg-ok animate-pulse" />
            Scan · Defend · Collaborate · Free
          </div>
        </div>

        <!-- Title -->
        <h1
          class="animate-fade-up font-display text-[72px] sm:text-[96px] lg:text-[120px] font-black uppercase leading-none tracking-[0.08em]"
          style="animation-delay:0.2s; text-shadow: 0 0 120px rgba(139,92,246,0.5), 0 4px 40px rgba(0,0,0,0.8)"
        >
          VINDICTER
        </h1>
        <p
          class="animate-fade-up text-[13px] sm:text-[16px] font-semibold uppercase tracking-[0.5em] text-white/40 mt-1"
          style="animation-delay:0.35s"
        >
          Security Workspace
        </p>

        <!-- Tagline -->
        <p
          class="animate-fade-up mt-7 max-w-lg text-[15px] sm:text-[17px] leading-relaxed text-white/60"
          style="animation-delay:0.45s"
        >
          AI security platform for teams.<br class="hidden sm:inline" />
          Scan codebases, track findings, and keep your security posture sharp — together.
        </p>

        <!-- CTA buttons -->
        <div
          class="animate-fade-up mt-10 flex flex-col sm:flex-row items-center gap-4"
          style="animation-delay:0.55s"
        >
          <NuxtLink
            to="/standard-beta"
            class="group flex items-center gap-2.5 rounded-2xl bg-accent px-8 py-3.5 text-[14px] font-bold text-white shadow-lg transition-all hover:bg-accent/90 hover:scale-[1.03] hover:shadow-accent/40 hover:shadow-2xl active:scale-[0.98]"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            Join the Open Beta
          </NuxtLink>
        </div>

        <p class="animate-fade-up mt-5 text-[11px] text-white/25" style="animation-delay:0.65s">
          Free tier available · Team workspaces · Windows 10/11
        </p>
      </div>

      <!-- Scroll indicator -->
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce opacity-30">
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>

    <!-- ── Marquee strip ─────────────────────────────────────────────────────── -->
    <div class="relative overflow-hidden border-y border-white/5 bg-surface/60 py-3">
      <div class="marquee-track flex gap-12 text-[11px] font-semibold uppercase tracking-widest text-white/25">
        <template v-for="_ in 4" :key="_">
          <span>AI Security Scanning</span><span class="text-accent/40">·</span>
          <span>Claude</span><span class="text-accent/40">·</span>
          <span>OpenRouter</span><span class="text-accent/40">·</span>
          <span>Ollama</span><span class="text-accent/40">·</span>
          <span>Findings Tracker</span><span class="text-accent/40">·</span>
          <span>Dependency Inventory</span><span class="text-accent/40">·</span>
          <span>Secret Detection</span><span class="text-accent/40">·</span>
          <span>Team Workspaces</span><span class="text-accent/40">·</span>
          <span>Free Forever</span><span class="text-accent/40">·</span>
        </template>
      </div>
    </div>

    <!-- ── Stats strip ───────────────────────────────────────────────────────── -->
    <div class="border-b border-white/5 bg-white/[0.015] px-6 py-8">
      <div class="mx-auto grid max-w-4xl grid-cols-2 gap-6 sm:grid-cols-4">
        <div
          v-for="(stat, i) in [
            { value: '300+', label: 'VAPT checks', sub: 'across 9 project types' },
            { value: '4',    label: 'AI providers', sub: 'Claude · Codex · OpenRouter · Ollama' },
            { value: '5',    label: 'severity levels', sub: 'Critical to Info' },
            { value: '100%', label: 'local-capable', sub: 'runs fully on your machine' },
          ]"
          :key="stat.value"
          :data-reveal="`stat-${i}`"
          :class="['transition-all duration-700 text-center', isRevealed(`stat-${i}`) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4']"
          :style="{ transitionDelay: `${i * 80}ms` }"
        >
          <p class="text-[32px] font-display font-black leading-none text-white">{{ stat.value }}</p>
          <p class="mt-1 text-[12px] font-semibold text-white/60">{{ stat.label }}</p>
          <p class="mt-0.5 text-[10px] text-white/25">{{ stat.sub }}</p>
        </div>
      </div>
    </div>

    <!-- ── Features ─────────────────────────────────────────────────────────── -->
    <section id="features" class="px-6 py-24 max-w-6xl mx-auto w-full">
      <div
        data-reveal="feat-header"
        :class="['transition-all duration-700', isRevealed('feat-header') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6']"
        class="text-center mb-16"
      >
        <p class="text-[11px] font-semibold uppercase tracking-[0.3em] text-accent/70 mb-3">Everything you need</p>
        <h2 class="text-[36px] sm:text-[44px] font-display font-black uppercase leading-tight">
          Built for security review.<br/>
          <span class="text-white/30">Works with your team.</span>
        </h2>
        <p class="mt-4 max-w-xl mx-auto text-[13px] leading-relaxed text-white/40">
          Every workflow from first scan to closed finding is covered — scanning, tracking, reporting, and collaborating.
        </p>
      </div>

      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="(f, i) in features"
          :key="f.title"
          :data-reveal="`feat-${i}`"
          :class="['transition-all duration-700', isRevealed(`feat-${i}`) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8']"
          :style="{ transitionDelay: `${i * 60}ms` }"
          class="group relative rounded-2xl border border-white/5 bg-surface/60 p-6 hover:border-accent/30 hover:bg-surface transition-all duration-300 hover:-translate-y-1 cursor-default flex flex-col"
        >
          <!-- Top row: icon + badge -->
          <div class="mb-4 flex items-start justify-between">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 group-hover:bg-accent/20 transition-colors">
              <svg class="h-[1.125rem] w-[1.125rem] text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" :d="f.icon" />
              </svg>
            </div>
            <span class="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider" :class="badgeClass[f.badgeColor]">
              {{ f.badge }}
            </span>
          </div>
          <h3 class="text-[13px] font-semibold text-white leading-snug">{{ f.title }}</h3>
          <p class="mt-2 text-[11px] leading-relaxed text-white/40 flex-1">{{ f.desc }}</p>

          <!-- Sub-bullets -->
          <ul class="mt-4 space-y-1.5">
            <li v-for="b in f.bullets" :key="b" class="flex items-center gap-2 text-[10px] text-white/30">
              <span class="size-1 rounded-full bg-accent/50 shrink-0" />
              {{ b }}
            </li>
          </ul>

          <!-- Accent line on hover -->
          <div class="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </section>

    <!-- ── AI Providers ────────────────────────────────────────────────────── -->
    <section class="px-6 py-20 border-t border-white/5">
      <div class="max-w-5xl mx-auto">
        <div
          data-reveal="providers-header"
          :class="['transition-all duration-700 text-center mb-10', isRevealed('providers-header') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6']"
        >
          <p class="text-[11px] font-semibold uppercase tracking-[0.3em] text-accent/70 mb-3">Bring your own model</p>
          <h2 class="text-[32px] font-display font-black uppercase leading-tight">Works with the AI you already use</h2>
          <p class="mt-3 text-[13px] text-white/40 max-w-lg mx-auto">Choose any supported provider — scans run through whichever model you configure in settings.</p>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div
            v-for="(provider, i) in [
              { name: 'Claude',      sub: 'Anthropic · CLI',      detail: 'Deep code understanding via Claude Code CLI. Reads your project files directly — no upload.', badge: 'Live', badgeCls: 'bg-ok/15 text-ok',  link: null, icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z', glow: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.20)' },
              { name: 'Codex',       sub: 'OpenAI · CLI',         detail: 'OpenAI Codex CLI for code-aware security review. Runs locally against your working tree.', badge: 'Live', badgeCls: 'bg-ok/15 text-ok',  link: null, icon: 'M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5', glow: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.20)' },
              { name: 'OpenRouter',  sub: 'Multi-model · Cloud',  detail: 'Access GPT-4o, Gemini, Mistral, and hundreds of other models through a single API key.', badge: 'Live', badgeCls: 'bg-ok/15 text-ok',  link: null, icon: 'M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z', glow: 'rgba(14,165,233,0.10)', border: 'rgba(14,165,233,0.20)' },
              { name: 'Ollama',      sub: 'Local · Private',      detail: 'Run Llama 3, Qwen, DeepSeek, and other open models on your own hardware. No data leaves your machine.', badge: 'Live', badgeCls: 'bg-ok/15 text-ok', link: null, icon: 'M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 15V5.25m19.5 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 7.409a2.25 2.25 0 01-1.07-1.916V5.25', glow: 'rgba(249,115,22,0.10)', border: 'rgba(249,115,22,0.20)' },
            ]"
            :key="provider.name"
            :data-reveal="`provider-${i}`"
            :class="['transition-all duration-700', isRevealed(`provider-${i}`) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8']"
            :style="{ transitionDelay: `${i * 80}ms`, borderColor: provider.border, background: 'rgba(30,31,34,0.6)' }"
            class="relative rounded-2xl border p-5 flex flex-col gap-3 overflow-hidden hover:-translate-y-0.5 transition-transform duration-200 min-h-[160px]"
          >
            <div
              class="absolute -top-8 -right-8 h-28 w-28 rounded-full blur-3xl pointer-events-none opacity-70"
              :style="{ backgroundColor: provider.glow }"
            />
            <div class="relative z-10 flex items-start justify-between">
              <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] border border-white/8">
                <svg class="h-4 w-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" :d="provider.icon" />
                </svg>
              </div>
              <span class="text-[9px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5" :class="provider.badgeCls">{{ provider.badge }}</span>
            </div>
            <div class="relative z-10 flex-1 flex flex-col">
              <p class="text-[13px] font-semibold text-white">{{ provider.name }}</p>
              <p class="text-[11px] text-white/35 mt-0.5">{{ provider.sub }}</p>
              <p class="mt-2.5 text-[11px] leading-relaxed text-white/35 flex-1">{{ provider.detail }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Integrations ─────────────────────────────────────────────────────── -->
    <section id="integrations" class="px-6 py-20 border-t border-white/5">
      <div class="max-w-5xl mx-auto">
        <div
          data-reveal="integrations-header"
          :class="['transition-all duration-700 text-center mb-10', isRevealed('integrations-header') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6']"
        >
          <p class="text-[11px] font-semibold uppercase tracking-[0.3em] text-accent/70 mb-3">Integrations</p>
          <h2 class="text-[32px] font-display font-black uppercase leading-tight">Works with tools you already trust</h2>
          <p class="mt-3 text-[13px] text-white/40 max-w-lg mx-auto">Connect Vindicter to your existing workflow — from issue tracking to repository platforms.</p>
        </div>

        <div class="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <div
            v-for="(integration, i) in [
              { name: 'GitHub',    sub: 'Issues & Auth',        badge: 'Live', badgeCls: 'bg-ok/15 text-ok',        icon: 'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22', glow: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.12)' },
              { name: 'Trivy',     sub: 'Container & IaC',      badge: 'Soon', badgeCls: 'bg-white/8 text-white/40', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', glow: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.15)' },
              { name: 'Snyk',      sub: 'Dep & code security',  badge: 'Soon', badgeCls: 'bg-white/8 text-white/40', icon: 'M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4', glow: 'rgba(139,92,246,0.06)', border: 'rgba(139,92,246,0.15)' },
              { name: 'GitLab',    sub: 'Issues & CI',          badge: 'Soon', badgeCls: 'bg-white/8 text-white/40', icon: 'M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5', glow: 'rgba(249,115,22,0.06)', border: 'rgba(249,115,22,0.15)' },
              { name: 'Bitbucket', sub: 'Repo & pipelines',     badge: 'Soon', badgeCls: 'bg-white/8 text-white/40', icon: 'M6 3v18M18 6a3 3 0 100-6 3 3 0 000 6zM6 21a3 3 0 100-6 3 3 0 000 6zm12-15v6a6 6 0 01-6 6H6', glow: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.15)' },
            ]"
            :key="integration.name"
            :data-reveal="`integration-${i}`"
            :class="['transition-all duration-700', isRevealed(`integration-${i}`) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8']"
            :style="{ transitionDelay: `${i * 80}ms`, borderColor: integration.border, background: 'rgba(30,31,34,0.6)' }"
            class="relative rounded-2xl border p-5 flex flex-col gap-3 overflow-hidden hover:-translate-y-0.5 transition-transform duration-200"
          >
            <div class="absolute -top-8 -right-8 h-28 w-28 rounded-full blur-3xl pointer-events-none opacity-70" :style="{ backgroundColor: integration.glow }" />
            <div class="relative z-10 flex items-start justify-between">
              <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] border border-white/8">
                <svg class="h-4 w-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" :d="integration.icon" />
                </svg>
              </div>
              <span class="text-[9px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5" :class="integration.badgeCls">{{ integration.badge }}</span>
            </div>
            <div class="relative z-10">
              <p class="text-[13px] font-semibold text-white">{{ integration.name }}</p>
              <p class="text-[11px] text-white/35 mt-0.5">{{ integration.sub }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Scan types ────────────────────────────────────────────────────────── -->
    <section id="scans" class="px-6 py-20 border-t border-white/5">
      <div class="max-w-4xl mx-auto">
        <div
          data-reveal="scans-header"
          :class="['transition-all duration-700 text-center mb-12', isRevealed('scans-header') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6']"
        >
          <p class="text-[11px] font-semibold uppercase tracking-[0.3em] text-accent/70 mb-3">Three scan depths, one workspace</p>
          <h2 class="text-[36px] font-display font-black uppercase leading-tight">Choose your depth</h2>
          <p class="mt-3 text-[14px] text-white/40">Switch between scan modes anytime from the scan panel.</p>
        </div>

        <div class="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div
            v-for="(s, i) in scanTypes"
            :key="s.name"
            :data-reveal="`scan-${i}`"
            :class="['transition-all duration-700', isRevealed(`scan-${i}`) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8']"
            :style="{ transitionDelay: `${i * 120}ms` }"
            class="relative rounded-2xl border border-white/5 bg-surface p-6 overflow-hidden hover:border-white/10 transition-colors"
          >
            <!-- Glow blob -->
            <div
              class="absolute -top-16 -right-16 h-48 w-48 rounded-full opacity-10 blur-3xl pointer-events-none"
              :style="{ backgroundColor: s.badgeColor }"
            />

            <div class="relative z-10">
              <div class="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p class="text-[16px] font-bold text-white">{{ s.name }}</p>
                  <p class="text-[11px] text-white/40">{{ s.subtitle }}</p>
                </div>
                <span
                  class="rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider flex-shrink-0"
                  :style="{ color: s.badgeColor, backgroundColor: s.badgeBg }"
                >
                  {{ s.badge }}
                </span>
              </div>

              <p class="mb-5 text-[12px] leading-relaxed text-white/50">{{ s.desc }}</p>

              <div class="space-y-2">
                <div v-for="stat in s.stats" :key="stat.label" class="flex items-center justify-between text-[11px]">
                  <span class="text-white/35">{{ stat.label }}</span>
                  <span class="font-semibold" :style="{ color: stat.color }">{{ stat.value }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── VAPT Framework ────────────────────────────────────────────────────── -->
    <section id="vapt" class="border-t border-white/5 px-6 py-24">
      <div class="mx-auto max-w-5xl">

        <!-- Header -->
        <div
          data-reveal="vapt-header"
          :class="['transition-all duration-700 text-center mb-16', isRevealed('vapt-header') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6']"
        >
          <p class="text-[11px] font-semibold uppercase tracking-[0.3em] text-accent/70 mb-3">Built-in VAPT Check Catalog</p>
          <h2 class="text-[36px] font-display font-black uppercase leading-tight">Security checks for every target</h2>
          <p class="mt-4 max-w-xl mx-auto text-[14px] leading-relaxed text-white/40">
            Vindicter ships with hundreds of pre-built vulnerability checks across 9 project classification types.
            Select your target, and the right checks are injected directly into every AI scan prompt.
          </p>
        </div>

        <!-- 9-type grid illustration -->
        <div
          data-reveal="vapt-grid"
          :class="['transition-all duration-700 mb-16', isRevealed('vapt-grid') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8']"
        >
          <div class="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
            <div
              v-for="(t, i) in vaptTypes"
              :key="t.key"
              :style="{ transitionDelay: `${i * 60}ms` }"
              class="group flex flex-col items-center gap-2 rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-center transition-all hover:border-accent/30 hover:bg-accent/[0.05]"
            >
              <span class="text-2xl">{{ t.icon }}</span>
              <p class="text-[10px] font-semibold leading-tight text-white/50 group-hover:text-white/80 transition-colors">{{ t.label }}</p>
              <span class="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] text-white/30">{{ t.count }}+</span>
            </div>
          </div>
        </div>

        <!-- Framework breakdown: 3 pillars -->
        <div class="grid gap-6 sm:grid-cols-3">
          <div
            v-for="(pillar, i) in vaptPillars"
            :key="pillar.title"
            :data-reveal="`vapt-pillar-${i}`"
            :class="['transition-all duration-700', isRevealed(`vapt-pillar-${i}`) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8']"
            :style="{ transitionDelay: `${i * 100}ms` }"
            class="rounded-2xl border border-white/5 bg-white/[0.02] p-6"
          >
            <div class="mb-4 flex size-10 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-xl">
              {{ pillar.icon }}
            </div>
            <h3 class="mb-2 text-[14px] font-bold text-white">{{ pillar.title }}</h3>
            <p class="mb-4 text-[12px] leading-relaxed text-white/40">{{ pillar.desc }}</p>
            <ul class="space-y-1.5">
              <li v-for="item in pillar.checks" :key="item" class="flex items-center gap-2 text-[11px] text-white/35">
                <span class="size-1 rounded-full bg-accent/60 shrink-0" />
                {{ item }}
              </li>
            </ul>
          </div>
        </div>

        <!-- Prompt injection callout -->
        <div
          data-reveal="vapt-callout"
          :class="['transition-all duration-700 mt-10', isRevealed('vapt-callout') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6']"
          class="rounded-2xl border border-accent/15 bg-accent/[0.04] px-8 py-6"
        >
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="text-[13px] font-semibold text-white">Checks are injected directly into the AI prompt</p>
              <p class="mt-1 text-[12px] text-white/40">Every selected check includes a specific instruction the model must evaluate and report on — even if nothing is found.</p>
            </div>
            <div class="shrink-0 rounded-xl border border-white/5 bg-black/30 px-4 py-2 font-mono text-[10px] text-accent/80 whitespace-nowrap">
              → VAPT check instructions injected
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- ── How it works ──────────────────────────────────────────────────────── -->
    <section class="px-6 py-24 border-t border-white/5">
      <div class="max-w-4xl mx-auto">
        <div
          data-reveal="how-header"
          :class="['transition-all duration-700 mb-14 text-center', isRevealed('how-header') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6']"
        >
          <p class="text-[11px] font-semibold uppercase tracking-[0.3em] text-accent/70 mb-3">End-to-end workflow</p>
          <h2 class="text-[36px] font-display font-black uppercase leading-tight">From code to closed finding</h2>
          <p class="mt-4 text-[13px] text-white/40 max-w-lg mx-auto">A single workspace handles the full security review lifecycle — no separate tools, no context switching.</p>
        </div>

        <div class="relative">
          <!-- Connector line -->
          <div class="absolute left-5 top-6 bottom-6 w-px bg-gradient-to-b from-accent/40 via-accent/20 to-transparent hidden sm:block" />

          <div class="space-y-6">
            <div
              v-for="(step, i) in [
                { n: '01', title: 'Register your project', desc: 'Point Vindicter at any local directory. Your project gets its own workspace with an isolated security state — scans, findings, and history all live here.', tags: ['Windows / macOS / Linux', 'Git-aware branch selector', 'Any language or framework'] },
                { n: '02', title: 'Configure your scan', desc: 'Choose your AI model, effort level, and target type. Select from 300+ VAPT checks pre-loaded for your classification — Web App, API, Cloud, IoT, and more.', tags: ['4 AI providers', 'Quick / Balanced / Deep scan', 'Multi-model collaborative mode'] },
                { n: '03', title: 'Review AI findings', desc: 'The AI returns structured findings with severity, category, evidence, and file paths. Each finding is parsed, deduplicated, and shown in a code-highlighted detail view.', tags: ['Critical → Info severity', 'Code evidence with syntax highlight', 'OSS scanner results merged in'] },
                { n: '04', title: 'Add to remediation queue', desc: 'Select findings to promote into your tracked remediation queue. Assign status, write notes, and link directly to the affected code.', tags: ['Open / Triaged / Resolved / Wontfix', 'Full evidence preserved', 'Whitelist false positives'] },
                { n: '05', title: 'Export and close', desc: 'Export a professional security report as a Word document, raw Markdown, or fix-prompt bundle. Create GitHub issues from any finding in one click.', tags: ['DOCX security review report', 'GitHub issue automation', 'Fix-prompt bundles for AI agents'] },
              ]"
              :key="step.n"
              :data-reveal="`step-${i}`"
              :class="['transition-all duration-700', isRevealed(`step-${i}`) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8']"
              :style="{ transitionDelay: `${i * 80}ms` }"
              class="relative flex gap-5 sm:pl-14"
            >
              <!-- Step number -->
              <div class="relative z-10 shrink-0 flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/10 border border-accent/20 sm:absolute sm:left-0 sm:top-0">
                <span class="font-mono text-[11px] font-bold text-accent">{{ step.n }}</span>
              </div>
              <!-- Content -->
              <div class="rounded-2xl border border-white/5 bg-white/[0.02] p-5 flex-1 hover:border-white/10 transition-colors">
                <p class="text-[14px] font-semibold text-white mb-2">{{ step.title }}</p>
                <p class="text-[12px] leading-relaxed text-white/40 mb-3">{{ step.desc }}</p>
                <div class="flex flex-wrap gap-2">
                  <span v-for="tag in step.tags" :key="tag" class="rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-0.5 text-[10px] text-white/35">{{ tag }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Why Vindicter ────────────────────────────────────────────────────── -->
    <section id="why" class="border-t border-white/5 px-6 py-24">
      <div class="mx-auto max-w-5xl">
        <div
          data-reveal="why-header"
          :class="['transition-all duration-700 mb-14 text-center', isRevealed('why-header') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6']"
        >
          <p class="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-accent/70">Common question</p>
          <h2 class="text-[36px] font-display font-black uppercase leading-tight">Why not just use an AI chatbot?</h2>
          <p class="mx-auto mt-4 max-w-xl text-[13px] leading-relaxed text-white/40">
            You can. But there's a gap between a raw AI response and a repeatable, trackable security workflow. Vindicter closes that gap.
          </p>
        </div>

        <!-- Comparison grid -->
        <div class="grid gap-4 sm:grid-cols-2">

          <!-- Left: raw prompting -->
          <div
            data-reveal="why-left"
            :class="['transition-all duration-700', isRevealed('why-left') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8']"
            class="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6"
          >
            <p class="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/30">Prompting Claude / Codex directly</p>
            <ul class="space-y-3">
              <li v-for="item in [
                'Findings vanish when you close the chat',
                'Severity and category assigned by eye',
                'No evidence linking findings to exact code',
                'Re-run the scan next week — zero comparison',
                'No remediation queue or status tracking',
                'Missed checks if you forget to ask',
                'One model, one perspective',
                'Copy-paste to create a GitHub issue',
              ]" :key="item" class="flex items-start gap-2.5 text-[12px] text-white/40">
                <span class="mt-0.5 size-4 shrink-0 rounded-full border border-white/10 bg-white/[0.04] grid place-items-center text-white/20">✕</span>
                {{ item }}
              </li>
            </ul>
          </div>

          <!-- Right: Vindicter -->
          <div
            data-reveal="why-right"
            :class="['transition-all duration-700 delay-100', isRevealed('why-right') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8']"
            class="rounded-2xl border border-accent/20 bg-accent/[0.04] p-6"
          >
            <p class="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent/70">With Vindicter</p>
            <ul class="space-y-3">
              <li v-for="item in [
                'Every finding persisted with full evidence and history',
                'Structured output — severity, category, area auto-parsed',
                'File paths and code blocks extracted from AI evidence',
                'Run again anytime — compare against previous scans',
                'Remediation queue with open / triaged / resolved status',
                'VAPT check catalog tailored to your project type',
                'Switch between Claude, Codex, OpenRouter, or Ollama',
                'One click to open a GitHub issue from any finding',
              ]" :key="item" class="flex items-start gap-2.5 text-[12px] text-white/70">
                <span class="mt-0.5 size-4 shrink-0 rounded-full border border-accent/30 bg-accent/10 grid place-items-center text-accent text-[9px] font-bold">✓</span>
                {{ item }}
              </li>
            </ul>
          </div>
        </div>

        <!-- Bottom callout -->
        <p
          data-reveal="why-footer"
          :class="['transition-all duration-700 mt-10 text-center text-[12px] leading-relaxed text-white/30', isRevealed('why-footer') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4']"
        >
          Vindicter is not a replacement for Claude or Codex — it's the layer that makes their output <span class="text-white/60">actionable</span>.
        </p>
      </div>
    </section>

    <!-- ── CTA ───────────────────────────────────────────────────────────────── -->
    <section class="relative overflow-hidden border-t border-white/5 px-6 py-24">

      <!-- Dither accent background -->
      <div class="absolute inset-0 opacity-40">
        <ClientOnly>
          <Dither
            :wave-speed="0.02"
            :wave-frequency="2"
            :wave-amplitude="0.2"
            :wave-color="[0.42, 0.34, 0.56]"
            :color-num="4"
            :pixel-size="3"
            :enable-mouse-interaction="false"
          />
        </ClientOnly>
      </div>
      <div class="absolute inset-0 bg-gradient-to-b from-base via-transparent to-base pointer-events-none" />

      <div
        data-reveal="cta"
        :class="['relative z-10 flex flex-col items-center gap-8 text-center transition-all duration-700', isRevealed('cta') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8']"
      >
        <img src="/icon.png" alt="Vindicter" class="h-14 w-14 icon-glow" />
        <div>
          <h2 class="text-[40px] sm:text-[52px] font-display font-black uppercase tracking-wider leading-tight">
            Start securing.<br/>
            <span class="text-white/30">With your team.</span>
          </h2>
          <p class="mt-4 max-w-lg mx-auto text-[14px] text-white/40 leading-relaxed">
            Sign up for the open beta, invite your team, and run your first scan in minutes — no infrastructure, no setup, free to start.
          </p>
        </div>

        <!-- Trust pills -->
        <div class="flex flex-wrap justify-center gap-2">
          <span v-for="pill in ['Free tier available', 'No credit card required', 'Windows 10/11', 'Open beta']" :key="pill"
            class="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-white/35"
          >{{ pill }}</span>
        </div>

        <div class="flex flex-col sm:flex-row items-center gap-4">
          <NuxtLink
            to="/standard-beta"
            class="group flex items-center gap-2.5 rounded-2xl bg-accent px-10 py-4 text-[15px] font-bold text-white shadow-lg transition-all hover:bg-accent/90 hover:scale-[1.03] hover:shadow-accent/40 hover:shadow-2xl active:scale-[0.98]"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            Join the Open Beta
          </NuxtLink>
          <a
            href="https://github.com/surelle-ha/vindicter"
            target="_blank"
            rel="noopener"
            class="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-8 py-4 text-[14px] font-semibold text-white/60 transition-all hover:border-white/20 hover:text-white/80 hover:bg-white/[0.07]"
          >
            <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            View on GitHub
          </a>
        </div>

        <!-- Mini feature checklist -->
        <div class="grid grid-cols-2 gap-x-10 gap-y-1.5 mt-2">
          <p v-for="item in ['AI-powered security scanning', 'Multi-model collaborative mode', 'GitHub issue automation', 'Structured DOCX reports', 'VAPT check catalog (300+)', 'Windows desktop app']" :key="item"
            class="flex items-center gap-2 text-[11px] text-white/30"
          >
            <svg class="h-3 w-3 shrink-0 text-accent/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {{ item }}
          </p>
        </div>
      </div>
    </section>
  </div>
</template>
