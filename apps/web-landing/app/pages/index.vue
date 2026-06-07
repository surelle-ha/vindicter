<script setup lang="ts">
useLandingSeo({
  title: 'Vindicter - AI-Powered Security Platform',
  description: 'Vindicter is an AI-powered security platform for teams. Automate vulnerability scanning, track findings, inspect dependencies, detect secrets, and level up with the built-in security Academy.',
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
  },
  {
    title: 'AI Security Scanning',
    badge: 'Claude',
    badgeColor: 'accent',
    desc: 'Run read-only AI reviews for concrete vulnerabilities, abuse paths, evidence, and remediation guidance in seconds.',
    icon: 'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18',
  },
  {
    title: 'Findings Tracker',
    badge: 'Triaged',
    badgeColor: 'warn',
    desc: 'Convert scan results into tracked security items with severity, status, evidence, and remediation guidance.',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  },
  {
    title: 'Dependency Inventory',
    badge: 'Multi-lang',
    badgeColor: 'accent',
    desc: 'Inspect package manifests across Node, Rust, .NET, Python, Go, Java, PHP, and Ruby ecosystems.',
    icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4',
  },
  {
    title: 'Secret Detection',
    badge: 'Local',
    badgeColor: 'ok',
    desc: 'Scan text files with conservative local patterns for exposed tokens, keys, passwords, and private key material.',
    icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z',
  },
  {
    title: 'Portable Security Record',
    badge: 'Workspace',
    badgeColor: 'ok',
    desc: 'Store scans, findings, and history tied to your workspace. Export or review your security record anytime.',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    title: 'Security Academy',
    badge: 'Growing',
    badgeColor: 'accent',
    desc: 'A structured bootcamp from security fundamentals to penetration testing. AI-guided by Professor Vindicter with a completion certificate.',
    icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z',
  },
  {
    title: 'Free to Start',
    badge: 'Free',
    badgeColor: 'ok',
    desc: 'Sign up and start scanning for free. Upgrade to Pro or Enterprise when your team grows.',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  },
]

// ── Academy curriculum ─────────────────────────────────────────────────────
const academyPhases = [
  {
    label: 'Intro',
    theme: 'Getting Started',
    lessons: 4,
    color: 'text-teal-300',
    bg: 'rgba(20,184,166,0.10)',
    border: 'rgba(20,184,166,0.25)',
    glow: 'rgba(20,184,166,0.15)',
    topics: ['Course orientation', 'How the AI Professor works', 'Terminal & lab setup', 'Setting your goals'],
  },
  {
    label: 'Week 1',
    theme: 'Security Foundations',
    lessons: 7,
    color: 'text-indigo-300',
    bg: 'rgba(99,102,241,0.10)',
    border: 'rgba(99,102,241,0.25)',
    glow: 'rgba(99,102,241,0.15)',
    topics: ['CIA triad & threat modelling', 'Auth & access control', 'Cryptography basics', 'Secure SDLC', 'OWASP Top 10 intro'],
  },
  {
    label: 'Week 2',
    theme: 'Web App Security',
    lessons: 7,
    color: 'text-violet-300',
    bg: 'rgba(139,92,246,0.10)',
    border: 'rgba(139,92,246,0.25)',
    glow: 'rgba(139,92,246,0.15)',
    topics: ['SQL injection & XSS', 'CSRF & SSRF', 'Insecure deserialization', 'API security', 'Burp Suite basics'],
  },
  {
    label: 'Week 3',
    theme: 'Penetration Testing',
    lessons: 7,
    color: 'text-rose-300',
    bg: 'rgba(244,63,94,0.10)',
    border: 'rgba(244,63,94,0.25)',
    glow: 'rgba(244,63,94,0.15)',
    topics: ['Recon & footprinting', 'Network scanning', 'Exploitation basics', 'Privilege escalation', 'Report writing'],
  },
  {
    label: 'Week 4',
    theme: 'Defensive Security',
    lessons: 7,
    color: 'text-emerald-300',
    bg: 'rgba(16,185,129,0.10)',
    border: 'rgba(16,185,129,0.25)',
    glow: 'rgba(16,185,129,0.15)',
    topics: ['Logging & SIEM', 'IDS/IPS setup', 'Incident response', 'Hardening & patching', 'Blue team tactics'],
  },
  {
    label: 'Capstone',
    theme: 'Full Assessment',
    lessons: 2,
    color: 'text-amber-300',
    bg: 'rgba(245,158,11,0.10)',
    border: 'rgba(245,158,11,0.25)',
    glow: 'rgba(245,158,11,0.15)',
    topics: ['End-to-end pentest simulation', 'Certificate of completion'],
  },
]

// ── Scan types ────────────────────────────────────────────────────────────────
const scanTypes = [
  {
    name: 'Quick Scan',
    subtitle: 'Surface-level · Fast results',
    badge: 'Default',
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
            Scan · Learn · Defend · Offline · Free
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
          AI security platform and learning hub for teams.<br class="hidden sm:inline" />
          Scan codebases, track findings, and master security — together.
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
          <span>Security Academy</span><span class="text-accent/40">·</span>
          <span>30 Lessons</span><span class="text-accent/40">·</span>
          <span>AI Professor</span><span class="text-accent/40">·</span>
          <span>100% Offline</span><span class="text-accent/40">·</span>
          <span>Free Forever</span><span class="text-accent/40">·</span>
        </template>
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
          <span class="text-white/30">Runs without the cloud.</span>
        </h2>
      </div>

      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="(f, i) in features"
          :key="f.title"
          :data-reveal="`feat-${i}`"
          :class="['transition-all duration-700', isRevealed(`feat-${i}`) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8']"
          :style="{ transitionDelay: `${i * 60}ms` }"
          class="group relative rounded-2xl border border-white/5 bg-surface/60 p-6 hover:border-accent/30 hover:bg-surface transition-all duration-300 hover:-translate-y-1 cursor-default"
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
          <p class="mt-2 text-[11px] leading-relaxed text-white/40">{{ f.desc }}</p>

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

        <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div
            v-for="(provider, i) in [
              { name: 'Claude',      sub: 'Anthropic',      badge: 'Live', badgeCls: 'bg-ok/15 text-ok',         link: null, icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z', glow: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.20)' },
              { name: 'OpenRouter',  sub: 'Multi-model',    badge: 'Live', badgeCls: 'bg-ok/15 text-ok',         link: null, icon: 'M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z', glow: 'rgba(14,165,233,0.10)', border: 'rgba(14,165,233,0.20)' },
              { name: 'Ollama',      sub: 'Local / Offline', badge: 'Live', badgeCls: 'bg-ok/15 text-ok',        link: null, icon: 'M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 15V5.25m19.5 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 7.409a2.25 2.25 0 01-1.07-1.916V5.25', glow: 'rgba(249,115,22,0.10)', border: 'rgba(249,115,22,0.20)' },
              { name: 'DefendCore',  sub: 'Security Engine', badge: 'Soon', badgeCls: 'bg-white/8 text-white/40', link: '/defendcore', icon: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z', glow: 'rgba(139,92,246,0.07)', border: 'rgba(139,92,246,0.12)' },
            ]"
            :key="provider.name"
            :data-reveal="`provider-${i}`"
            :class="['transition-all duration-700', isRevealed(`provider-${i}`) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8']"
            :style="{ transitionDelay: `${i * 80}ms`, borderColor: provider.border, background: 'rgba(30,31,34,0.6)' }"
            class="relative rounded-2xl border p-5 flex flex-col gap-3 overflow-hidden hover:-translate-y-0.5 transition-transform duration-200"
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
            <div class="relative z-10">
              <p class="text-[13px] font-semibold text-white">{{ provider.name }}</p>
              <p class="text-[11px] text-white/35 mt-0.5">{{ provider.sub }}</p>
              <NuxtLink
                v-if="provider.link"
                :to="provider.link"
                class="mt-2 inline-flex items-center gap-1 text-[10px] text-accent/60 hover:text-accent transition-colors"
              >
                Learn more
                <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </NuxtLink>
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
          <p class="text-[11px] font-semibold uppercase tracking-[0.3em] text-accent/70 mb-3">Two scan depths, one workspace</p>
          <h2 class="text-[36px] font-display font-black uppercase leading-tight">Choose your depth</h2>
          <p class="mt-3 text-[14px] text-white/40">Switch between scan modes anytime from the scan panel.</p>
        </div>

        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
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

    <!-- ── Academy ──────────────────────────────────────────────────────────── -->
    <section id="academy" class="px-6 py-24 border-t border-white/5">
      <div class="max-w-6xl mx-auto">

        <!-- Header -->
        <div
          data-reveal="academy-header"
          :class="['transition-all duration-700 mb-16', isRevealed('academy-header') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6']"
        >
          <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-[0.3em] text-accent/70 mb-3">Built-in learning</p>
              <h2 class="text-[36px] sm:text-[44px] font-display font-black uppercase leading-tight">
                Vindicter Academy.<br/>
                <span class="text-white/30">From zero to pentest.</span>
              </h2>
              <p class="mt-4 max-w-xl text-[14px] leading-relaxed text-white/45">
                A structured 30-lesson security bootcamp built right into the app. Learn security fundamentals, web attack vectors, penetration testing, and defensive tactics — guided by an AI professor.
              </p>
            </div>
            <!-- CTA -->
            <div class="flex flex-col items-start lg:items-end gap-3 shrink-0">
              <a
                href="https://dashboard.vindicter.xyz/academy"
                class="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-[13px] font-bold text-white transition hover:bg-accent/90 active:scale-[0.98]"
              >
                Start learning
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
              <p class="text-[11px] text-white/30">Free account required</p>
            </div>
          </div>
        </div>

        <!-- Curriculum phase cards -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="(phase, i) in academyPhases"
            :key="phase.label"
            :data-reveal="`phase-${i}`"
            :class="['transition-all duration-700', isRevealed(`phase-${i}`) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8']"
            :style="{ transitionDelay: `${i * 70}ms`, borderColor: phase.border, background: phase.bg }"
            class="group relative rounded-2xl border p-5 overflow-hidden hover:-translate-y-1 transition-all duration-300"
          >
            <!-- Glow -->
            <div
              class="absolute -top-10 -right-10 h-36 w-36 rounded-full blur-3xl pointer-events-none opacity-60"
              :style="{ backgroundColor: phase.glow }"
            />
            <div class="relative z-10">
              <!-- Label row -->
              <div class="flex items-center justify-between mb-3">
                <span
                  class="text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border"
                  :class="phase.color"
                  :style="{ borderColor: phase.border, background: phase.bg }"
                >
                  {{ phase.label }}
                </span>
                <span class="text-[10px] text-white/25 font-mono">{{ phase.label }}</span>
              </div>

              <h3 class="text-[15px] font-bold text-white mb-3">{{ phase.theme }}</h3>

              <!-- Topics -->
              <ul class="space-y-1.5">
                <li
                  v-for="topic in phase.topics"
                  :key="topic"
                  class="flex items-start gap-2 text-[11px] text-white/45"
                >
                  <svg class="h-3 w-3 mt-0.5 shrink-0" :class="phase.color" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                  {{ topic }}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Professor Vindicter + TTS callout -->
        <div
          data-reveal="academy-footer"
          :class="['transition-all duration-700 mt-8', isRevealed('academy-footer') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6']"
        >
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

            <!-- Professor Vindicter -->
            <div class="col-span-1 lg:col-span-2 rounded-2xl border border-accent/20 bg-accent/5 p-6 flex items-start gap-5">
              <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/15 border border-accent/25">
                <svg class="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .3 2.7-1.1 2.7H3.9c-1.4 0-2.1-1.7-1.1-2.7L4.2 15.3" />
                </svg>
              </div>
              <div>
                <p class="text-[13px] font-bold text-white">Professor Vindicter — AI Tutor</p>
                <p class="mt-1.5 text-[12px] leading-relaxed text-white/50">
                  An AI professor powered by OpenRouter or Ollama sits alongside every lesson. It teaches interactively, asks quiz questions, and only unlocks the next lesson once you demonstrate real understanding — not just reading.
                </p>
                <div class="mt-3 flex flex-wrap gap-2">
                  <span class="rounded-full bg-accent/10 border border-accent/20 px-2.5 py-0.5 text-[10px] font-semibold text-accent">OpenRouter</span>
                  <span class="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-white/40">Ollama</span>
                  <span class="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-white/40 opacity-50">DefendCore <span class="text-[8px]">Soon</span></span>
                  <span class="rounded-full bg-ok/10 border border-ok/20 px-2.5 py-0.5 text-[10px] font-semibold text-ok">Professor-gated completion</span>
                </div>
              </div>
            </div>

            <!-- Audio narration -->
            <div class="rounded-2xl border border-white/5 bg-surface/60 p-6 flex flex-col justify-between gap-4">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-ok/10 border border-ok/20">
                <svg class="h-5 w-5 text-ok" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <div>
                <p class="text-[13px] font-bold text-white">Audio Narration</p>
                <p class="mt-1.5 text-[12px] leading-relaxed text-white/50">
                  Generate full offline narrations for any lesson. Uses an on-device TTS engine — listen while you work.
                </p>
              </div>
              <span class="self-start rounded-full bg-ok/10 border border-ok/20 px-2.5 py-0.5 text-[10px] font-semibold text-ok">On-device · No API key</span>
            </div>

          </div>
        </div>

      </div>
    </section>

    <!-- ── How it works ──────────────────────────────────────────────────────── -->
    <section class="px-6 py-24 border-t border-white/5">
      <div class="max-w-3xl mx-auto text-center">
        <div
          data-reveal="how-header"
          :class="['transition-all duration-700 mb-14', isRevealed('how-header') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6']"
        >
          <p class="text-[11px] font-semibold uppercase tracking-[0.3em] text-accent/70 mb-3">Simple setup</p>
          <h2 class="text-[36px] font-display font-black uppercase leading-tight">Up in three steps</h2>
        </div>

        <div class="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div
            v-for="(step, i) in [
              { n: '01', title: 'Add a Project', desc: 'Register a local codebase directory. Vindicter attaches scan state directly to the source.' },
              { n: '02', title: 'Run the Scan', desc: 'Pick a scan depth and let the AI review security-sensitive paths for vulnerabilities and risks.' },
              { n: '03', title: 'Track & Fix', desc: 'Open full evidence, create findings, assign sprint tasks, and move issues to closure.' },
            ]"
            :key="step.n"
            :data-reveal="`step-${i}`"
            :class="['transition-all duration-700', isRevealed(`step-${i}`) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8']"
            :style="{ transitionDelay: `${i * 100}ms` }"
            class="flex flex-col items-center gap-3"
          >
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 border border-accent/20">
              <span class="font-mono text-[13px] font-bold text-accent">{{ step.n }}</span>
            </div>
            <p class="text-[14px] font-semibold text-white">{{ step.title }}</p>
            <p class="text-[12px] leading-relaxed text-white/40 max-w-[200px]">{{ step.desc }}</p>
          </div>
        </div>
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
        :class="['relative z-10 flex flex-col items-center gap-6 text-center transition-all duration-700', isRevealed('cta') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8']"
      >
        <img src="/icon.png" alt="Vindicter" class="h-14 w-14 icon-glow" />
        <h2 class="text-[40px] sm:text-[52px] font-display font-black uppercase tracking-wider leading-tight">
          Start securing.<br/>
          <span class="text-white/30">With your team.</span>
        </h2>
        <p class="max-w-md text-[14px] text-white/40 leading-relaxed">
          Sign up for the open beta, invite your team, and run your first scan — free to start.
        </p>
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
        </div>
        <p class="text-[11px] text-white/20">Free tier · Team workspaces · Windows 10/11</p>
      </div>
    </section>
  </div>
</template>
