<script setup lang="ts">
import { CheckCircle2, CircleDashed, ShieldCheck, Stethoscope, UserCircle2, Zap } from 'lucide-vue-next'

const app = useAppStore()
const user = useUserStore()
const projects = useProjectsStore()
const emit = defineEmits<{ launched: [] }>()

const animating = ref(false)
const launchMessages = [
  'Read the project. Map the risks. Close the findings.',
  'Turn source context into vulnerability scans your team can act on.',
  'Start focused, keep evidence visible, ship with confidence.',
]

const systemChecks = computed(() => [
  {
    label: 'Shell',
    detail: 'Interface ready',
    ok: true,
    icon: Zap,
  },
  {
    label: 'Profile',
    detail: user.complete ? `${user.name || 'Local user'} loaded` : 'Onboarding available',
    ok: user.complete,
    icon: UserCircle2,
  },
  {
    label: 'Projects',
    detail: projects.hasProjects ? `${projects.projects.length} registered` : 'No registry entries yet',
    ok: projects.hasProjects,
    icon: ShieldCheck,
  },
])

function enter() {
  if (animating.value) return
  animating.value = true
  setTimeout(() => {
    app.enter()
    emit('launched')
  }, 350)
}

onMounted(() => {
  document.addEventListener('keydown', onKey)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKey)
})

function onKey(e: KeyboardEvent) {
  if (e.key === 'Enter') enter()
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#0d0d0f]">
    <TitleBar />

    <div class="relative flex-1 overflow-hidden">
      <Dither
        class="z-0"
        :wave-speed="0.035"
        :wave-frequency="2.6"
        :wave-amplitude="0.26"
        :wave-color="[0.42, 0.37, 0.62]"
        :color-num="4"
        :pixel-size="2"
        :disable-animation="false"
        :enable-mouse-interaction="false"
        :mouse-radius="0.85"
      />
      <div class="absolute inset-0 z-[1] pointer-events-none bg-[radial-gradient(circle_at_center,rgba(31,29,38,0.08)_0%,rgba(13,13,15,0.34)_46%,rgba(13,13,15,0.86)_100%)]" />
      <div class="absolute inset-0 z-[2] pointer-events-none bg-black/35" />

      <Transition leave-active-class="transition-[opacity,transform] duration-350 ease-in"
        leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-[1.04]">
        <div v-if="!animating" class="pointer-events-none relative z-10 flex h-full flex-col items-center justify-center select-none">
          <div class="relative flex flex-col items-center gap-8">
            <!-- Logo mark -->
            <div class="flex flex-col items-center gap-4">
              <div class="text-center">
                <img
                  src="/icon.png"
                  alt="Vindicter"
                  class="mx-auto size-24 select-none rounded-2xl object-cover drop-shadow-2xl"
                  draggable="false"
                >
                <h1 class="mt-4 text-2xl font-bold tracking-tight text-white/90">Vindicter</h1>
                <div class="mt-3">
                  <p class="text-sm text-white/30 tracking-wide">Your local security companion</p>
                  <TextType :text="launchMessages" class-name="mt-3 min-h-5 text-sm font-medium text-indigo-100/55"
                    :typing-speed="42" :deleting-speed="22" :pause-duration="1800" :show-cursor="true" cursor-character="|"
                    cursor-class-name="text-indigo-200/50" />
                </div>
              </div>
            </div>

            <!-- Enter button -->
            <div class="flex flex-col items-center gap-4">
              <button
                class="pointer-events-auto cursor-pointer rounded-lg border border-indigo-300/35 bg-white/[0.03] px-8 py-2.5 text-sm font-semibold text-indigo-100 shadow-lg shadow-indigo-950/30 transition-colors hover:border-indigo-200/60 hover:bg-indigo-500/10 hover:text-white"
                @click="enter">
                Enter Vindicter
              </button>
              <p class="max-w-lg text-center text-[10px] leading-relaxed text-white/25">
                By entering and using Vindicter, you accept responsibility for your actions. The developers of Vindicter and the bundled or integrated tools are not liable for damage, misuse, or unauthorized activity.
              </p>
            </div>
          </div>

          <div class="pointer-events-auto absolute bottom-16 left-1/2 w-[min(34rem,calc(100%-2rem))] -translate-x-1/2">
            <div class="relative overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-4 shadow-2xl shadow-black/30 backdrop-blur-md">
              <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(129,140,248,0.16),transparent_58%)]" />
              <div class="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-indigo-200/40 to-transparent" />
              <div class="relative">
                <div class="mb-3 flex items-center justify-between gap-3">
                  <div class="flex items-center gap-2">
                    <Stethoscope class="size-3.5 text-indigo-200/70" />
                    <p class="text-xs font-medium text-white/55">Launch Doctor</p>
                  </div>
                  <span class="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium text-emerald-200/80">
                    System check
                  </span>
                </div>
                <div class="grid gap-2 sm:grid-cols-3">
                  <div
                    v-for="check in systemChecks"
                    :key="check.label"
                    class="rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-2.5"
                  >
                    <div class="flex items-center gap-2">
                      <component :is="check.icon" class="size-3.5 text-white/35" />
                      <p class="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/30">{{ check.label }}</p>
                      <CheckCircle2 v-if="check.ok" class="ml-auto size-3.5 text-emerald-300/75" />
                      <CircleDashed v-else class="ml-auto size-3.5 text-amber-200/65" />
                    </div>
                    <p class="mt-2 truncate text-xs text-white/50">{{ check.detail }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Keyboard hint -->
          <div class="absolute bottom-6 text-[10px] text-white/15 tracking-wide">
            Press <kbd class="px-1 py-0.5 rounded bg-white/[0.06] font-mono text-white/20">Enter</kbd> to continue
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>
