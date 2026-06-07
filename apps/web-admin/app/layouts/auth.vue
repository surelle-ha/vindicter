<script setup lang="ts">
import { ShieldCheck, Lock, Megaphone } from 'lucide-vue-next'
const currentYear = new Date().getFullYear()
const features = [
  { icon: ShieldCheck,  label: 'Admin Control',   desc: 'Manage users, tickets, beta requests, and pricing plans.' },
  { icon: Megaphone,    label: 'Internal Comms',   desc: 'Compose and send internal email campaigns via SMTP.' },
  { icon: Lock,         label: 'Restricted Access', desc: 'Admin and internal team accounts only.' },
]
</script>

<template>
  <div class="flex min-h-screen overflow-hidden" style="background:#111215;">

    <!-- Left panel -->
    <div class="hidden lg:flex lg:w-[420px] xl:w-[480px] relative flex-col shrink-0">
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
      <div class="absolute inset-0" style="background:linear-gradient(135deg,rgba(17,18,21,0.80) 0%,rgba(17,18,21,0.50) 55%,transparent 100%);" />
      <div class="absolute inset-0" style="background:radial-gradient(circle at 20% 25%,rgba(245,158,11,0.22),transparent 55%);" />

      <div class="relative z-10 flex flex-col h-full p-10">
        <div class="flex items-center gap-3" style="color:rgba(255,255,255,0.85);">
          <img src="/icon.png" alt="Vindicter" class="h-8 w-8" />
          <span class="font-display text-[18px] font-black uppercase tracking-widest">Vindicter</span>
        </div>

        <div class="flex-1 flex flex-col justify-center gap-8">
          <div>
            <p class="text-[10px] font-semibold uppercase tracking-[0.28em] mb-3" style="color:rgba(245,158,11,0.70);">Internal Portal</p>
            <h2 class="font-display text-[30px] font-black uppercase leading-[1.1]" style="color:rgba(255,255,255,0.92);">
              Admin &<br />Marketing<br />Panel
            </h2>
          </div>
          <div class="space-y-5">
            <div v-for="f in features" :key="f.label" class="flex items-start gap-3.5">
              <div class="shrink-0 mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center" style="background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.22);">
                <component :is="f.icon" class="h-3.5 w-3.5" style="color:rgba(245,158,11,0.80);" />
              </div>
              <div>
                <p class="text-[12px] font-semibold" style="color:rgba(255,255,255,0.80);">{{ f.label }}</p>
                <p class="text-[11px] mt-0.5 leading-relaxed" style="color:rgba(255,255,255,0.35);">{{ f.desc }}</p>
              </div>
            </div>
          </div>
        </div>

        <p class="text-[11px]" style="color:rgba(255,255,255,0.22);">&copy; {{ currentYear }} Vindicter. Internal use only.</p>
      </div>
    </div>

    <div class="hidden lg:block w-px shrink-0" style="background:rgba(255,255,255,0.07);" />

    <!-- Right panel: form -->
    <div class="relative flex flex-1 flex-col overflow-y-auto" style="background:#111215;">
      <div class="lg:hidden absolute inset-0 opacity-15 pointer-events-none">
        <ClientOnly>
          <Dither :wave-speed="0.035" :wave-frequency="2.4" :wave-amplitude="0.28" :wave-color="[0.44, 0.36, 0.58]" :color-num="5" :pixel-size="2" :enable-mouse-interaction="false" />
        </ClientOnly>
      </div>
      <div class="relative z-10 flex flex-1 items-center justify-center px-6 py-12">
        <div class="w-full max-w-[400px]">
          <div class="lg:hidden mx-auto mb-8 flex w-max items-center gap-3" style="color:rgba(255,255,255,0.80);">
            <img src="/icon.png" alt="Vindicter" class="h-8 w-8" />
            <span class="font-display text-[18px] font-black uppercase tracking-widest">Vindicter</span>
          </div>
          <slot />
          <p class="lg:hidden mt-8 text-center text-[11px]" style="color:rgba(255,255,255,0.22);">&copy; {{ currentYear }} Vindicter</p>
        </div>
      </div>
    </div>

  </div>
</template>
