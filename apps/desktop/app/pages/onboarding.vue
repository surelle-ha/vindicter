<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const user = useUserStore()
const router = useRouter()

const name = ref(user.name)
const email = ref(user.email)
const jobRole = ref(user.jobRole || 'Security Practitioner')
const projectManagementExperience = ref(user.projectManagementExperience || 'learning')
const softwareEngineeringExperience = ref(user.softwareEngineeringExperience || 'intermediate')
const aiToolingComfort = ref(user.aiToolingComfort || 'guided')
const preferredPlanningStyle = ref(user.preferredPlanningStyle || 'balanced')

const roles = ['Security Practitioner', 'Developer', 'DevSecOps', 'Pentester', 'Blue Team Analyst', 'Security Engineer', 'Tech Lead', 'Other']
const projectManagementOptions = [
  { value: 'new', label: 'New to security reviews' },
  { value: 'learning', label: 'Learning vulnerability workflows' },
  { value: 'comfortable', label: 'Comfortable triaging findings' },
  { value: 'advanced', label: 'Advanced security lead' },
]
const engineeringOptions = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'senior', label: 'Senior engineer' },
  { value: 'principal', label: 'Principal / architect' },
]
const aiComfortOptions = [
  { value: 'guided', label: 'Guide me step by step' },
  { value: 'collaborative', label: 'Collaborative partner' },
  { value: 'autonomous', label: 'Let AI work autonomously' },
]
const planningStyleOptions = [
  { value: 'lightweight', label: 'Fast triage' },
  { value: 'balanced', label: 'Balanced assessment' },
  { value: 'structured', label: 'Structured evidence-first review' },
]

function submit() {
  if (!name.value.trim()) return
  user.save({
    name: name.value.trim(),
    email: email.value.trim(),
    jobRole: jobRole.value,
    projectManagementExperience: projectManagementExperience.value,
    softwareEngineeringExperience: softwareEngineeringExperience.value,
    aiToolingComfort: aiToolingComfort.value,
    preferredPlanningStyle: preferredPlanningStyle.value,
  })
  router.push('/')
}

function skip() {
  user.save({
    name: 'You',
    email: '',
    jobRole: jobRole.value,
    projectManagementExperience: projectManagementExperience.value,
    softwareEngineeringExperience: softwareEngineeringExperience.value,
    aiToolingComfort: aiToolingComfort.value,
    preferredPlanningStyle: preferredPlanningStyle.value,
  })
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-[#0d0d0f] px-4">
    <!-- Ambient -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-indigo-600/[0.05] blur-[100px]" />
    </div>

    <div class="relative w-full max-w-2xl">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-xl font-bold text-white/90 tracking-tight">Set up your security workspace</h1>
        <p class="text-xs text-white/30 mt-2">Personalize the AI-powered security platform. This stays on your device.</p>
      </div>

      <!-- Form -->
      <div class="space-y-5 p-6 rounded-xl bg-white/[0.03] border border-white/[0.08]">
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="text-xs text-white/40 font-medium mb-1.5 block">Name *</label>
            <GlassInput
              v-model="name"
              placeholder="Your name"
              autofocus
              @keydown.enter="submit"
            />
          </div>

          <div>
            <label class="text-xs text-white/40 font-medium mb-1.5 block">Email</label>
            <GlassInput
              v-model="email"
              placeholder="you@example.com (optional)"
              type="email"
            />
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="text-xs text-white/40 font-medium mb-1.5 block">Role</label>
            <GlassSelect v-model="jobRole" class="w-full">
              <option v-for="r in roles" :key="r" :value="r">{{ r }}</option>
            </GlassSelect>
          </div>

          <div>
            <label class="text-xs text-white/40 font-medium mb-1.5 block">Technical experience</label>
            <GlassSelect v-model="softwareEngineeringExperience" class="w-full">
              <option v-for="option in engineeringOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
            </GlassSelect>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="text-xs text-white/40 font-medium mb-1.5 block">Security review experience</label>
            <GlassSelect v-model="projectManagementExperience" class="w-full">
              <option v-for="option in projectManagementOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
            </GlassSelect>
          </div>

          <div>
            <label class="text-xs text-white/40 font-medium mb-1.5 block">Assessment style</label>
            <GlassSelect v-model="preferredPlanningStyle" class="w-full">
              <option v-for="option in planningStyleOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
            </GlassSelect>
          </div>
        </div>

        <div>
          <label class="text-xs text-white/40 font-medium mb-1.5 block">AI security copilot preference</label>
          <GlassSelect v-model="aiToolingComfort" class="w-full">
            <option v-for="option in aiComfortOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </GlassSelect>
        </div>

        <div class="rounded-lg border border-indigo-500/15 bg-indigo-500/[0.06] px-3 py-2.5">
          <p class="text-xs leading-relaxed text-white/45">
            Vindicter uses this local profile to tune scan depth, pentest workflows, and vulnerability review detail.
          </p>
        </div>

        <div class="pt-2 flex gap-2">
          <GlassButton full-width :disabled="!name.trim()" @click="submit">
            Get started
          </GlassButton>
          <GlassButton variant="ghost" @click="skip">Skip</GlassButton>
        </div>
      </div>
    </div>
  </div>
</template>
