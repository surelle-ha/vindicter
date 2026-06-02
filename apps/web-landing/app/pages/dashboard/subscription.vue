<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })
useHead({ title: 'DefendCore — Vindicter' })
</script>

<template>
  <div class="max-w-3xl mx-auto">

    <div class="mb-8">
      <p class="text-[11px] font-semibold uppercase tracking-[0.25em] mb-1" style="color:rgba(139,92,246,0.70);">Subscription</p>
      <h1 class="text-[26px] font-display font-black uppercase tracking-wide" style="color:rgba(255,255,255,0.90);">DefendCore</h1>
      <p class="mt-1 text-[13px]" style="color:rgba(255,255,255,0.40);">Vindicter's dedicated security intelligence model.</p>
    </div>

    <!-- Coming soon hero -->
    <div class="rounded-2xl p-8 mb-6 text-center" style="background:rgba(79,70,229,0.08);border:1px solid rgba(79,70,229,0.18);">
      <div class="flex justify-center mb-5">
        <div class="flex h-16 w-16 items-center justify-center rounded-2xl" style="background:rgba(79,70,229,0.15);border:1px solid rgba(79,70,229,0.25);">
          <svg class="h-8 w-8" style="color:rgb(129,140,248);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
          </svg>
        </div>
      </div>

      <div class="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-4 text-[10px] font-semibold uppercase tracking-widest" style="background:rgba(245,158,11,0.10);border:1px solid rgba(245,158,11,0.20);color:rgba(245,158,11,0.80);">
        <span class="h-1.5 w-1.5 rounded-full animate-pulse" style="background:rgba(245,158,11,0.80);" />
        Under Development
      </div>

      <h2 class="text-[22px] font-display font-black uppercase mb-3" style="color:rgba(255,255,255,0.90);">Subscription Management</h2>
      <p class="text-[13px] leading-relaxed max-w-md mx-auto" style="color:rgba(255,255,255,0.45);">
        DefendCore subscription and billing management is currently being built. You'll be able to manage your plan, usage, and billing details here once it launches.
      </p>
    </div>

    <!-- What's coming -->
    <p class="text-[10px] font-semibold uppercase tracking-[0.2em] mb-3" style="color:rgba(255,255,255,0.25);">What's included in DefendCore</p>
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div
        v-for="feat in [
          { title: 'Deep Vulnerability Intelligence', desc: 'Full call-chain analysis beyond pattern matching.' },
          { title: 'CVE & CWE Correlation', desc: 'Auto-maps findings to CVSS scores and known advisories.' },
          { title: 'Attack Surface Mapping', desc: 'Models your codebase as an attacker would.' },
          { title: 'Intelligent Remediation', desc: 'Context-aware working patch code per finding.' },
          { title: 'Compliance Analysis', desc: 'Maps findings to OWASP, NIST, CIS, PCI-DSS.' },
          { title: 'Zero-Day Pattern Recognition', desc: 'Recognises structural patterns that precede disclosures.' },
        ]"
        :key="feat.title"
        class="rounded-xl px-4 py-3.5"
        style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);"
      >
        <p class="text-[12px] font-semibold mb-0.5" style="color:rgba(255,255,255,0.75);">{{ feat.title }}</p>
        <p class="text-[11px]" style="color:rgba(255,255,255,0.35);">{{ feat.desc }}</p>
      </div>
    </div>

    <div class="mt-6 rounded-xl px-5 py-4 flex items-start gap-3" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);">
      <svg class="h-4 w-4 shrink-0 mt-0.5" style="color:rgba(255,255,255,0.25);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      </svg>
      <p class="text-[12px] leading-relaxed" style="color:rgba(255,255,255,0.35);">
        You'll receive an email notification when DefendCore subscriptions go live. If you joined the beta programme, you'll get priority access.
      </p>
    </div>

  </div>
</template>
