<script setup lang="ts">
import { ArrowRight, Loader2, User, Briefcase, Shield } from 'lucide-vue-next'

definePageMeta({ layout: false })
useHead({ title: 'Welcome — Vindicter' })

const { user, updateProfile } = useAuth()
const router = useRouter()

const step = ref(1)
const saving = ref(false)
const err = ref('')

const displayName = ref((user.value as any)?.user_metadata?.display_name ?? '')
const jobRole = ref('')
const experience = ref('')

const jobRoles = [
  'Software Engineer',
  'Security Engineer',
  'DevOps / SRE',
  'Penetration Tester',
  'Security Researcher',
  'Student / Learning',
  'Other',
]

const experienceLevels = [
  { value: 'beginner',      label: 'Beginner',      desc: 'New to security, learning the basics' },
  { value: 'intermediate',  label: 'Intermediate',   desc: 'Familiar with security concepts and tools' },
  { value: 'advanced',      label: 'Advanced',       desc: 'Professional experience in security' },
]

async function finish() {
  if (!jobRole.value || !experience.value) { err.value = 'Please complete all fields.'; return }
  saving.value = true
  err.value = ''
  try {
    await updateProfile({
      displayName:       displayName.value.trim() || undefined,
      jobRole:           jobRole.value,
      experienceLevel:   experience.value,
      onboardingComplete: true,
    })
    await router.push('/news')
  }
  catch (e: any) {
    err.value = e?.message ?? 'Something went wrong. Please try again.'
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center px-5 py-12" style="background:#111215;">
    <!-- Background orb -->
    <div class="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
      <div style="position:absolute;width:700px;height:700px;border-radius:50%;filter:blur(160px);background:radial-gradient(circle,#4c1d95 0%,transparent 70%);top:-200px;left:50%;transform:translateX(-50%);opacity:0.10;" />
    </div>

    <div class="w-full max-w-md">

      <!-- Logo -->
      <div class="flex items-center justify-center gap-3 mb-10">
        <img src="/icon.png" alt="Vindicter" class="h-10 w-10 rounded-xl" />
        <span class="font-display text-[20px] font-black uppercase tracking-widest" style="color:rgba(255,255,255,0.90);">Vindicter</span>
      </div>

      <!-- Step indicators -->
      <div class="flex items-center justify-center gap-2 mb-8">
        <div v-for="s in 2" :key="s"
          class="h-1.5 rounded-full transition-all duration-300"
          :style="s <= step
            ? 'background:rgba(139,92,246,0.80);width:28px;'
            : 'background:rgba(255,255,255,0.12);width:16px;'"
        />
      </div>

      <!-- Step 1: Who are you -->
      <div v-if="step === 1" class="space-y-6">
        <div class="text-center mb-8">
          <div class="mx-auto mb-4 h-14 w-14 flex items-center justify-center rounded-2xl" style="background:rgba(139,92,246,0.12);border:1px solid rgba(139,92,246,0.22);">
            <User class="h-7 w-7" style="color:rgba(167,139,250,0.85);" />
          </div>
          <h1 class="font-display text-[28px] font-black uppercase" style="color:rgba(255,255,255,0.92);">Welcome aboard</h1>
          <p class="mt-2 text-[13px] leading-relaxed" style="color:rgba(255,255,255,0.40);">Let's personalise your experience. This takes under a minute.</p>
        </div>

        <div>
          <label class="block mb-2 text-[10px] font-semibold uppercase tracking-wider" style="color:rgba(255,255,255,0.35);">Your name</label>
          <input
            v-model="displayName"
            placeholder="Jane Smith"
            class="w-full rounded-xl px-4 py-3 text-[13px] text-white outline-none transition-colors border border-white/8 bg-white/[0.04] focus:border-accent/45"
          />
        </div>

        <button
          class="w-full rounded-xl py-3 text-[13px] font-bold flex items-center justify-center gap-2 transition-colors bg-accent hover:bg-accent/90 text-white cursor-pointer"
          @click="step = 2"
        >
          Next <ArrowRight class="h-4 w-4" />
        </button>
      </div>

      <!-- Step 2: Role & experience -->
      <div v-else class="space-y-6">
        <div class="text-center mb-8">
          <div class="mx-auto mb-4 h-14 w-14 flex items-center justify-center rounded-2xl" style="background:rgba(139,92,246,0.12);border:1px solid rgba(139,92,246,0.22);">
            <Shield class="h-7 w-7" style="color:rgba(167,139,250,0.85);" />
          </div>
          <h1 class="font-display text-[28px] font-black uppercase" style="color:rgba(255,255,255,0.92);">Your background</h1>
          <p class="mt-2 text-[13px] leading-relaxed" style="color:rgba(255,255,255,0.40);">Helps us tailor your security learning path.</p>
        </div>

        <!-- Job role -->
        <div>
          <label class="block mb-2 text-[10px] font-semibold uppercase tracking-wider" style="color:rgba(255,255,255,0.35);">
            <Briefcase class="inline h-3 w-3 mr-1" />Your role
          </label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="role in jobRoles" :key="role"
              class="rounded-xl px-3 py-2.5 text-[12px] font-medium text-left transition-colors cursor-pointer"
              :style="jobRole === role
                ? 'background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.30);color:rgba(167,139,250,0.95);'
                : 'background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.45);'"
              @click="jobRole = role"
            >{{ role }}</button>
          </div>
        </div>

        <!-- Experience -->
        <div>
          <label class="block mb-2 text-[10px] font-semibold uppercase tracking-wider" style="color:rgba(255,255,255,0.35);">Security experience</label>
          <div class="space-y-2">
            <button
              v-for="lvl in experienceLevels" :key="lvl.value"
              class="w-full rounded-xl px-4 py-3 text-left transition-colors cursor-pointer"
              :style="experience === lvl.value
                ? 'background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.30);'
                : 'background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);'"
              @click="experience = lvl.value"
            >
              <p class="text-[13px] font-semibold" :style="experience === lvl.value ? 'color:rgba(167,139,250,0.95);' : 'color:rgba(255,255,255,0.70);'">{{ lvl.label }}</p>
              <p class="text-[11px] mt-0.5" style="color:rgba(255,255,255,0.35);">{{ lvl.desc }}</p>
            </button>
          </div>
        </div>

        <p v-if="err" class="text-[11px] text-center" style="color:rgba(242,63,66,0.80);">{{ err }}</p>

        <div class="flex gap-3">
          <button
            class="flex-1 rounded-xl py-3 text-[13px] font-semibold transition-colors cursor-pointer"
            style="border:1px solid rgba(255,255,255,0.10);color:rgba(255,255,255,0.40);"
            @click="step = 1"
          >Back</button>
          <button
            :disabled="saving || !jobRole || !experience"
            class="flex-1 rounded-xl py-3 text-[13px] font-bold flex items-center justify-center gap-2 transition-colors bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-white cursor-pointer"
            @click="finish"
          >
            <Loader2 v-if="saving" class="h-4 w-4 animate-spin" />
            {{ saving ? 'Saving…' : 'Get started' }}
          </button>
        </div>
      </div>

    </div>
  </div>
</template>
