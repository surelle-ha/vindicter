<script setup lang="ts">
import { Megaphone, ShieldCheck, UsersRound } from 'lucide-vue-next'

const currentYear = new Date().getFullYear()

const notes = [
  { icon: UsersRound, label: 'Distribution lists', value: 'Internal contacts, operators, partners, and controlled groups' },
  { icon: Megaphone, label: 'Comms workflow', value: 'Draft, preview, test, and send through the API SMTP layer' },
  { icon: ShieldCheck, label: 'Internal workspace', value: 'Built for admins and internal teams behind restricted access' },
]
</script>

<template>
  <div class="flex min-h-screen overflow-hidden bg-base">
    <div class="hidden lg:flex lg:w-[460px] xl:w-[520px] relative flex-col shrink-0">
      <div class="absolute inset-0">
        <ClientOnly>
          <Dither
            :wave-speed="0.03"
            :wave-frequency="2.1"
            :wave-amplitude="0.25"
            :wave-color="[0.26, 0.50, 0.48]"
            :color-num="5"
            :pixel-size="2"
            :enable-mouse-interaction="false"
          />
        </ClientOnly>
      </div>
      <div class="absolute inset-0 bg-[linear-gradient(135deg,rgba(17,18,21,0.82),rgba(17,18,21,0.58),rgba(17,18,21,0.30))]" />

      <div class="relative z-10 flex h-full flex-col p-10">
        <NuxtLink to="/" class="flex items-center gap-3 text-white/85 transition-opacity hover:opacity-80">
          <img src="/icon.png" alt="Vindicter" class="h-9 w-9 rounded-md" />
          <span class="font-display text-[20px] font-black uppercase tracking-widest">Vindicter</span>
        </NuxtLink>

        <div class="flex flex-1 flex-col justify-center gap-8">
          <div>
            <p class="mb-3 text-[10px] font-semibold uppercase tracking-[0.30em] text-teal/70">Internal Ops</p>
            <h2 class="font-display text-[34px] font-black uppercase leading-[1.1] text-white/90">
              Internal<br />comms<br />control.
            </h2>
          </div>

          <div class="space-y-4">
            <div v-for="item in notes" :key="item.label" class="flex items-start gap-3.5">
              <div class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-teal/20 bg-teal/10">
                <component :is="item.icon" class="h-3.5 w-3.5 text-teal/80" />
              </div>
              <div>
                <p class="text-[12px] font-semibold text-white/80">{{ item.label }}</p>
                <p class="mt-0.5 text-[11px] leading-relaxed text-white/35">{{ item.value }}</p>
              </div>
            </div>
          </div>
        </div>

        <p class="text-[11px] text-white/25">&copy; {{ currentYear }} Vindicter</p>
      </div>
    </div>

    <div class="hidden w-px shrink-0 bg-white/[0.07] lg:block" />

    <div class="relative flex flex-1 flex-col overflow-y-auto bg-base">
      <div class="absolute inset-0 opacity-20 pointer-events-none lg:hidden">
        <ClientOnly>
          <Dither
            :wave-speed="0.03"
            :wave-frequency="2.1"
            :wave-amplitude="0.25"
            :wave-color="[0.26, 0.50, 0.48]"
            :color-num="5"
            :pixel-size="2"
            :enable-mouse-interaction="false"
          />
        </ClientOnly>
      </div>

      <div class="relative z-10 flex flex-1 items-center justify-center px-6 py-12">
        <div class="w-full max-w-[410px]">
          <NuxtLink to="/" class="mx-auto mb-8 flex w-max items-center gap-3 text-white/80 transition-opacity hover:opacity-80 lg:hidden">
            <img src="/icon.png" alt="Vindicter" class="h-9 w-9 rounded-md" />
            <span class="font-display text-[20px] font-black uppercase tracking-widest">Vindicter</span>
          </NuxtLink>

          <slot />

          <p class="mt-8 text-center text-[11px] text-white/25 lg:hidden">&copy; {{ currentYear }} Vindicter</p>
        </div>
      </div>
    </div>
  </div>
</template>
