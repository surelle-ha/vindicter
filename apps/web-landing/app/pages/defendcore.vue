<script setup lang="ts">
import Radar from '~/components/Radar.vue'

useHead({ title: 'DefendCore — Vindicter' })

const capabilities = [
  {
    title: 'Deep Vulnerability Intelligence',
    desc: 'Goes beyond pattern matching — understands call chains, data flows, and trust boundaries to surface exploitable paths that generic scanners miss.',
    icon: 'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18',
    color: 'text-violet-400',
    bg: 'rgba(139,92,246,0.10)',
    border: 'rgba(139,92,246,0.20)',
  },
  {
    title: 'CVE & CWE Correlation',
    desc: 'Automatically maps findings to known CVEs, CWEs, and CVSS scores. Know exactly what you\'re dealing with and how severe it is before you open a ticket.',
    icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
    color: 'text-sky-400',
    bg: 'rgba(14,165,233,0.10)',
    border: 'rgba(14,165,233,0.20)',
  },
  {
    title: 'Attack Surface Mapping',
    desc: 'Models your codebase as an attacker would — entry points, privilege escalation paths, lateral movement opportunities, and trust boundaries visualised.',
    icon: 'M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15',
    color: 'text-rose-400',
    bg: 'rgba(244,63,94,0.10)',
    border: 'rgba(244,63,94,0.20)',
  },
  {
    title: 'Intelligent Code Remediation',
    desc: 'Produces working patch code — not just advice. Each finding includes a context-aware fix that compiles, with an explanation of why the original pattern was unsafe.',
    icon: 'M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5',
    color: 'text-emerald-400',
    bg: 'rgba(52,211,153,0.10)',
    border: 'rgba(52,211,153,0.20)',
  },
  {
    title: 'Compliance Analysis',
    desc: 'Maps every finding to OWASP Top 10, NIST 800-53, CIS Controls, PCI-DSS, and SOC 2 requirements so your audit trail is already half-written.',
    icon: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
    color: 'text-amber-400',
    bg: 'rgba(251,191,36,0.10)',
    border: 'rgba(251,191,36,0.20)',
  },
  {
    title: 'Supply Chain Threat Detection',
    desc: 'Analyses dependency trees for known malicious packages, typosquatting, suspicious maintainer changes, and packages with anomalous permission requests.',
    icon: 'M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244',
    color: 'text-orange-400',
    bg: 'rgba(251,146,60,0.10)',
    border: 'rgba(251,146,60,0.20)',
  },
  {
    title: 'Zero-Day Pattern Recognition',
    desc: 'Trained on historical zero-day disclosures to recognise structural code patterns that historically preceded vulnerability discoveries — before public CVEs exist.',
    icon: 'M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.75h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008H12v-.008z',
    color: 'text-red-400',
    bg: 'rgba(248,113,113,0.10)',
    border: 'rgba(248,113,113,0.20)',
  },
  {
    title: 'Automated Security Reports',
    desc: 'Generates structured executive and technical reports from scan results — risk summaries, remediation roadmaps, and compliance gap analysis in one click.',
    icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
    color: 'text-teal-400',
    bg: 'rgba(45,212,191,0.10)',
    border: 'rgba(45,212,191,0.20)',
  },
]

const specs = [
  { label: 'Context window',    value: '200K tokens' },
  { label: 'Languages',         value: '40+ supported' },
  { label: 'CVE database',      value: 'NVD + GHSA live sync' },
  { label: 'Compliance maps',   value: 'OWASP · NIST · PCI · SOC 2' },
  { label: 'Runs locally',      value: 'Yes — no data leaves your machine' },
  { label: 'Availability',      value: 'Coming soon' },
]
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <main class="flex-1">

      <!-- Hero -->
      <section class="relative flex flex-col items-center justify-center pt-40 pb-24 px-6 overflow-hidden">
        <!-- Radar background -->
        <ClientOnly>
          <div class="pointer-events-none absolute inset-0 overflow-hidden opacity-30" aria-hidden="true">
            <Radar
              :speed="0.4"
              :scale="0.55"
              :ring-count="8"
              :spoke-count="8"
              :ring-thickness="0.04"
              :spoke-thickness="0.008"
              :sweep-speed="0.6"
              :sweep-width="1.8"
              :sweep-lobes="1"
              color="#8b5cf6"
              background-color="#0a0a0e"
              :falloff="2.5"
              :brightness="0.9"
              :enable-mouse-interaction="false"
              :mouse-influence="0"
              style="width:100%;height:100%;position:absolute;inset:0;"
            />
          </div>
        </ClientOnly>
        <!-- Gradient overlay to blend radar into the page -->
        <div class="pointer-events-none absolute inset-0" style="background: radial-gradient(ellipse 80% 60% at 50% 40%, transparent 30%, #0a0a0e 80%), linear-gradient(to bottom, transparent 60%, #0a0a0e 100%);" aria-hidden="true" />
        <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(139,92,246,0.08),transparent_60%)] pointer-events-none" />

        <div class="relative z-10 flex flex-col items-center text-center max-w-3xl">

          <!-- Badge -->
          <div class="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/8 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-accent/80">
            <span class="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            Coming Soon
          </div>

          <!-- Icon row -->
          <div class="mb-6 flex items-center gap-3">
            <div class="flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/25 bg-accent/10">
              <svg class="h-7 w-7 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
              </svg>
            </div>
          </div>

          <h1
            class="font-display text-[60px] sm:text-[80px] lg:text-[96px] font-black uppercase leading-none tracking-[0.06em] mb-4"
            style="text-shadow: 0 0 80px rgba(139,92,246,0.45), 0 4px 32px rgba(0,0,0,0.8)"
          >
            DefendCore
          </h1>

          <p class="text-[13px] sm:text-[15px] font-semibold uppercase tracking-[0.4em] text-white/35 mb-6">
            Security Intelligence Engine · by Vindicter
          </p>

          <p class="text-[15px] sm:text-[17px] leading-relaxed text-white/55 max-w-xl mb-10">
            A purpose-built AI security engine — a specialised RAG and intelligence layer delivering deep vulnerability analysis, real exploit intelligence, and context-aware code remediation inside Vindicter.
          </p>

          <!-- Spec pills -->
          <div class="flex flex-wrap justify-center gap-2 mb-10">
            <span
              v-for="s in specs"
              :key="s.label"
              class="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-surface/60 px-3 py-1 text-[11px] text-white/45"
            >
              <span class="text-white/25">{{ s.label }}:</span>
              <span class="text-white/65 font-medium">{{ s.value }}</span>
            </span>
          </div>

          <NuxtLink
            to="/standard-beta"
            class="inline-flex items-center gap-2.5 rounded-2xl bg-accent px-8 py-3.5 text-[14px] font-bold text-white shadow-lg transition-all hover:bg-accent/90 hover:scale-[1.03] hover:shadow-accent/40 hover:shadow-2xl active:scale-[0.98]"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            Get Early Access
          </NuxtLink>
        </div>
      </section>

      <!-- Capabilities grid -->
      <section class="border-t border-white/5 px-6 py-24">
        <div class="max-w-6xl mx-auto">
          <div class="text-center mb-14">
            <p class="text-[11px] font-semibold uppercase tracking-[0.3em] text-accent/70 mb-3">Engine capabilities</p>
            <h2 class="text-[36px] sm:text-[44px] font-display font-black uppercase leading-tight">
              Built for the entire<br/>
              <span class="text-white/30">security lifecycle.</span>
            </h2>
          </div>

          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div
              v-for="cap in capabilities"
              :key="cap.title"
              class="relative rounded-2xl border p-5 overflow-hidden hover:-translate-y-1 transition-all duration-300 group cursor-default"
              :style="{ borderColor: cap.border, background: 'rgba(30,31,34,0.7)' }"
            >
              <div
                class="absolute -top-10 -right-10 h-36 w-36 rounded-full blur-3xl pointer-events-none opacity-50 group-hover:opacity-80 transition-opacity"
                :style="{ backgroundColor: cap.bg }"
              />
              <div class="relative z-10">
                <div
                  class="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border"
                  :style="{ background: cap.bg, borderColor: cap.border }"
                >
                  <svg class="h-5 w-5" :class="cap.color" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" :d="cap.icon" />
                  </svg>
                </div>
                <h3 class="text-[13px] font-semibold text-white leading-snug mb-2">{{ cap.title }}</h3>
                <p class="text-[11px] leading-relaxed text-white/40">{{ cap.desc }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Positioning strip -->
      <section class="border-t border-white/5 px-6 py-20">
        <div class="max-w-4xl mx-auto">
          <div class="rounded-2xl border border-accent/15 bg-accent/5 p-8 sm:p-12 flex flex-col lg:flex-row items-center gap-10">
            <div class="shrink-0 flex h-20 w-20 items-center justify-center rounded-3xl border border-accent/25 bg-accent/10">
              <svg class="h-10 w-10 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
              </svg>
            </div>
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-[0.3em] text-accent/70 mb-3">Why DefendCore</p>
              <h3 class="text-[26px] sm:text-[32px] font-display font-black uppercase leading-tight mb-4">
                General models guess.<br/>
                <span class="text-white/35">DefendCore knows.</span>
              </h3>
              <p class="text-[14px] leading-relaxed text-white/50 max-w-lg">
                General-purpose LLMs are trained to be helpful across every domain. DefendCore is trained on a curated corpus of security research, CVE disclosures, exploit write-ups, OWASP guidance, and real-world incident reports — so it reasons about risk the way a senior security engineer does, not a generalist chatbot.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="border-t border-white/5 px-6 py-20 text-center">
        <p class="text-[11px] font-semibold uppercase tracking-[0.3em] text-accent/70 mb-4">Be first in line</p>
        <h2 class="text-[36px] font-display font-black uppercase leading-tight mb-4">
          DefendCore is coming to Vindicter.
        </h2>
        <p class="text-[14px] text-white/40 max-w-md mx-auto mb-8 leading-relaxed">
          Download Vindicter now and DefendCore will be available as an AI provider the moment it launches — no reinstall, no separate account.
        </p>
        <NuxtLink
          to="/standard-beta"
          class="inline-flex items-center gap-2.5 rounded-2xl bg-accent px-10 py-4 text-[15px] font-bold text-white shadow-lg transition-all hover:bg-accent/90 hover:scale-[1.03] hover:shadow-accent/40 hover:shadow-2xl active:scale-[0.98]"
        >
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Download Vindicter
        </NuxtLink>
      </section>

    </main>
  </div>
</template>
