<script setup lang="ts">
import { ShieldCheck, HardDrive, Cpu } from 'lucide-vue-next'

const currentYear = new Date().getFullYear()

const features = [
  {
    icon: ShieldCheck,
    label: 'AI-Powered Scanning',
    desc: 'Automated vulnerability detection with Claude, Codex, and local models.',
  },
  {
    icon: HardDrive,
    label: 'Local-First Privacy',
    desc: 'All analysis runs on your machine — no code leaves your environment.',
  },
  {
    icon: Cpu,
    label: 'Multi-Model Support',
    desc: 'Claude, OpenRouter, Ollama — pick the AI that fits your workflow.',
  },
]
</script>

<template>
  <div class="flex min-h-screen overflow-hidden" style="background:#111215;">

    <!-- Left panel: Dither + branding (desktop only) -->
    <div class="hidden lg:flex lg:w-[440px] xl:w-[500px] relative flex-col shrink-0">
      <div class="absolute inset-0">
        <ClientOnly>
          <Dither
            :wave-speed="0.035"
            :wave-frequency="2.4"
            :wave-amplitude="0.28"
            :wave-color="[0.44, 0.36, 0.58]"
            :color-num="5"
            :pixel-size="2"
            :enable-mouse-interaction="false"
          />
        </ClientOnly>
      </div>
      <div class="absolute inset-0" style="background:linear-gradient(135deg,rgba(17,18,21,0.75) 0%,rgba(17,18,21,0.45) 55%,transparent 100%);" />
      <div class="absolute inset-0" style="background:radial-gradient(circle at 20% 25%,rgba(139,92,246,0.24),transparent 55%);" />

      <div class="relative z-10 flex flex-col h-full p-10">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-3 transition-opacity hover:opacity-80" style="color:rgba(255,255,255,0.88);">
          <img src="/icon.png" alt="Vindicta" class="h-9 w-9" />
          <span class="font-display text-[20px] font-black uppercase tracking-widest">Vindicta</span>
        </NuxtLink>

        <!-- Center content -->
        <div class="flex-1 flex flex-col justify-center gap-10">
          <div>
            <p class="text-[10px] font-semibold uppercase tracking-[0.30em] mb-3" style="color:rgba(139,92,246,0.75);">Security Platform</p>
            <h2 class="font-display text-[34px] font-black uppercase leading-[1.1]" style="color:rgba(255,255,255,0.92);">
              Local-first<br />AI security<br />review.
            </h2>
            <p class="mt-4 text-[13px] leading-relaxed" style="color:rgba(255,255,255,0.38);">
              The professional toolkit for developers who take security seriously.
            </p>
          </div>

          <div class="space-y-5">
            <div v-for="f in features" :key="f.label" class="flex items-start gap-3.5">
              <div class="shrink-0 mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center" style="background:rgba(139,92,246,0.12);border:1px solid rgba(139,92,246,0.22);">
                <component :is="f.icon" class="h-3.5 w-3.5" style="color:rgba(139,92,246,0.80);" />
              </div>
              <div>
                <p class="text-[12px] font-semibold" style="color:rgba(255,255,255,0.80);">{{ f.label }}</p>
                <p class="text-[11px] mt-0.5 leading-relaxed" style="color:rgba(255,255,255,0.35);">{{ f.desc }}</p>
              </div>
            </div>
          </div>
        </div>

        <p class="text-[11px]" style="color:rgba(255,255,255,0.22);">
          &copy; {{ currentYear }} Surelle-ha. Local-first security review.
        </p>
      </div>
    </div>

    <!-- Divider -->
    <div class="hidden lg:block w-px shrink-0" style="background:rgba(255,255,255,0.07);" />

    <!-- Right panel: Form area -->
    <div class="relative flex flex-1 flex-col overflow-y-auto" style="background:#111215;">

      <!-- Mobile: subtle dither -->
      <div class="lg:hidden absolute inset-0 opacity-20 pointer-events-none">
        <ClientOnly>
          <Dither
            :wave-speed="0.035"
            :wave-frequency="2.4"
            :wave-amplitude="0.28"
            :wave-color="[0.44, 0.36, 0.58]"
            :color-num="5"
            :pixel-size="2"
            :enable-mouse-interaction="false"
          />
        </ClientOnly>
      </div>
      <div class="lg:hidden absolute inset-0 pointer-events-none" style="background:radial-gradient(circle at 50% 0%,rgba(139,92,246,0.12),transparent 50%);" />

      <div class="relative z-10 flex flex-1 items-center justify-center px-6 py-12">
        <div class="w-full max-w-[400px]">

          <!-- Mobile logo -->
          <NuxtLink to="/" class="lg:hidden mx-auto mb-8 flex w-max items-center gap-3 transition-opacity hover:opacity-80" style="color:rgba(255,255,255,0.80);">
            <img src="/icon.png" alt="Vindicta" class="h-9 w-9" />
            <span class="font-display text-[20px] font-black uppercase tracking-widest">Vindicta</span>
          </NuxtLink>

          <slot />

          <p class="lg:hidden mt-8 text-center text-[11px]" style="color:rgba(255,255,255,0.22);">
            &copy; {{ currentYear }} Surelle-ha
          </p>
        </div>
      </div>
    </div>

  </div>
</template>
