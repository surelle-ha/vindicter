<script setup lang="ts">
import { BookOpen, CheckCircle2, Lock, GraduationCap, ChevronRight, Award, X, Sparkles } from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Academy — Vindicter' })

const supabase = useSupabase()
const { user } = useAuth()
const router   = useRouter()

// ── Curriculum ─────────────────────────────────────────────────────────────
interface Lesson { id: string; title: string; description?: string; prereqId?: string | null }
interface Module { id: string; label: string; theme: string; color: string; bg: string; border: string; lessons: Lesson[] }

const curriculum: Module[] = [
  {
    id: 'intro', label: 'Introduction', theme: 'Getting Started', color: 'text-teal-300',
    bg: 'rgba(20,184,166,0.08)', border: 'rgba(20,184,166,0.22)',
    lessons: [
      { id: 'intro-1', title: 'Course Orientation',   description: 'How Vindicter Academy works and what to expect.' },
      { id: 'intro-2', title: 'AI Professor Setup',    description: 'Configure your AI model for interactive learning.' },
      { id: 'intro-3', title: 'Terminal & Lab Basics', description: 'Essential command-line foundations for security work.' },
      { id: 'intro-4', title: 'Setting Your Goals',    description: 'Define what you want to achieve in this course.' },
    ],
  },
  {
    id: 'week1', label: 'Week 1', theme: 'Security Foundations', color: 'text-indigo-300',
    bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.22)',
    lessons: [
      { id: 'w1-1', title: 'CIA Triad & Threat Modelling',    description: 'Confidentiality, integrity, availability — the bedrock of security thinking.' },
      { id: 'w1-2', title: 'Authentication & Access Control', description: 'How identity verification and authorisation work under the hood.' },
      { id: 'w1-3', title: 'Cryptography Basics',            description: 'Symmetric vs asymmetric encryption, hashing, TLS fundamentals.' },
      { id: 'w1-4', title: 'Secure Software Development',    description: 'Integrating security into every phase of the SDLC.' },
      { id: 'w1-5', title: 'OWASP Top 10 Overview',          description: 'The most critical web application security risks.' },
      { id: 'w1-6', title: 'Network Security Fundamentals',  description: 'Firewalls, VPNs, DMZs, and network segmentation.' },
      { id: 'w1-7', title: 'Security Policies & Compliance', description: 'NIST, ISO 27001, SOC 2 — what they mean and why they matter.' },
    ],
  },
  {
    id: 'week2', label: 'Week 2', theme: 'Web App Security', color: 'text-violet-300',
    bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.22)',
    lessons: [
      { id: 'w2-1', title: 'SQL Injection',             description: 'Exploiting and preventing the most prevalent web vulnerability.' },
      { id: 'w2-2', title: 'Cross-Site Scripting (XSS)', description: 'Reflected, stored, and DOM-based XSS attacks and defences.' },
      { id: 'w2-3', title: 'CSRF & Clickjacking',        description: 'Cross-site request forgery and UI redressing attacks.' },
      { id: 'w2-4', title: 'SSRF & Path Traversal',      description: 'Server-side request forgery and directory traversal exploitation.' },
      { id: 'w2-5', title: 'Insecure Deserialization',   description: 'How malicious payloads exploit object deserialisation.' },
      { id: 'w2-6', title: 'API Security',               description: 'REST, GraphQL, and gRPC attack surfaces and hardening.' },
      { id: 'w2-7', title: 'Burp Suite Essentials',      description: 'Hands-on web application testing with Burp Suite Community.' },
    ],
  },
  {
    id: 'week3', label: 'Week 3', theme: 'Penetration Testing', color: 'text-rose-300',
    bg: 'rgba(244,63,94,0.08)', border: 'rgba(244,63,94,0.22)',
    lessons: [
      { id: 'w3-1', title: 'Recon & OSINT',                description: 'Passive and active reconnaissance techniques.' },
      { id: 'w3-2', title: 'Network Scanning with Nmap',   description: 'Host discovery, port scanning, and service fingerprinting.' },
      { id: 'w3-3', title: 'Vulnerability Assessment',     description: 'Identifying, classifying, and prioritising vulnerabilities.' },
      { id: 'w3-4', title: 'Exploitation Basics',          description: 'Understanding exploit development and Metasploit fundamentals.' },
      { id: 'w3-5', title: 'Post-Exploitation',            description: 'Privilege escalation, lateral movement, and persistence.' },
      { id: 'w3-6', title: 'Web App Pentesting Workflow',  description: 'End-to-end methodology for web application assessments.' },
      { id: 'w3-7', title: 'Writing Pentest Reports',      description: 'Communicating findings professionally to technical and non-technical audiences.' },
    ],
  },
  {
    id: 'week4', label: 'Week 4', theme: 'Defensive Security', color: 'text-emerald-300',
    bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.22)',
    lessons: [
      { id: 'w4-1', title: 'Blue Team Fundamentals',      description: 'Detection, response, and the blue team mindset.' },
      { id: 'w4-2', title: 'SIEM & Log Analysis',          description: 'Collecting, correlating, and alerting on security events.' },
      { id: 'w4-3', title: 'Incident Response',            description: 'Preparation, identification, containment, eradication, and recovery.' },
      { id: 'w4-4', title: 'Threat Intelligence',          description: 'Using threat feeds, IOCs, and TTPs to improve defences.' },
      { id: 'w4-5', title: 'Hardening & Configuration',   description: 'System, network, and application hardening baselines.' },
      { id: 'w4-6', title: 'Cloud Security Essentials',   description: 'AWS, GCP, Azure — shared responsibility and key controls.' },
      { id: 'w4-7', title: 'Security in CI/CD',            description: 'Integrating security scanning and gates into DevSecOps pipelines.' },
    ],
  },
]

// ── Progress ──────────────────────────────────────────────────────────────
interface ProgressRecord { lesson_id: string; completed_at: string | null; started_at: string }
const progress        = ref<Record<string, ProgressRecord>>({})
const loadingProgress = ref(true)

async function loadProgress() {
  const uid = (user.value as any)?.id
  if (!uid) return
  const { data } = await supabase.from('academy_progress').select('lesson_id, started_at, completed_at').eq('user_id', uid)
  const map: Record<string, ProgressRecord> = {}
  for (const row of data ?? []) map[row.lesson_id] = row
  progress.value    = map
  loadingProgress.value = false
}

const allLessons      = computed(() => curriculum.flatMap(m => m.lessons))
const totalLessons    = computed(() => allLessons.value.length)
const completedCount  = computed(() => Object.values(progress.value).filter(p => p.completed_at).length)
const progressPercent = computed(() => totalLessons.value ? Math.round((completedCount.value / totalLessons.value) * 100) : 0)
const allComplete     = computed(() => !loadingProgress.value && completedCount.value >= totalLessons.value && totalLessons.value > 0)

function isCompleted(id: string) { return !!progress.value[id]?.completed_at }
function isStarted(id: string)   { return !!progress.value[id] }

function isLocked(lesson: Lesson, mod: Module): boolean {
  if (lesson.id === 'intro-1') return false
  if (lesson.prereqId) return !isCompleted(lesson.prereqId)
  const modIdx    = curriculum.findIndex(m => m.id === mod.id)
  const lessonIdx = mod.lessons.findIndex(l => l.id === lesson.id)
  if (lessonIdx === 0 && modIdx > 0) {
    const prevMod         = curriculum[modIdx - 1]!
    const prevLastLesson  = prevMod.lessons[prevMod.lessons.length - 1]!
    return !isCompleted(prevLastLesson.id)
  }
  if (lessonIdx > 0) return !isCompleted(mod.lessons[lessonIdx - 1]!.id)
  return false
}

function goToLesson(lesson: Lesson, mod: Module) {
  if (isLocked(lesson, mod)) return
  void router.push(`/academy/${lesson.id}`)
}

// ── Onboarding ─────────────────────────────────────────────────────────────
const showOnboarding  = ref(false)
const learnerName     = ref('')
const learnerGoal     = ref('')
const learnerLevel    = ref('')

const GOALS  = ['Become a penetration tester', 'Defend systems & respond to incidents', 'Learn security for development work', 'Compete in CTF challenges', 'General security knowledge']
const LEVELS = ['Complete beginner', 'Some IT background', 'Developer with no security background', 'Security professional']

function checkOnboarding() {
  if (typeof localStorage === 'undefined') return
  const done = localStorage.getItem('academy:onboarded')
  if (!done) showOnboarding.value = true
  learnerName.value = localStorage.getItem('academy:name') ?? ''
}

function finishOnboarding() {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem('academy:onboarded', '1')
  localStorage.setItem('academy:name', learnerName.value)
  localStorage.setItem('academy:goal', learnerGoal.value)
  localStorage.setItem('academy:level', learnerLevel.value)
  showOnboarding.value = false
}

// ── Certificate ────────────────────────────────────────────────────────────
const showCertificate = ref(false)
const completionDate  = computed(() => {
  const dates = Object.values(progress.value).filter(p => p.completed_at).map(p => new Date(p.completed_at!))
  if (!dates.length) return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const latest = new Date(Math.max(...dates.map(d => d.getTime())))
  return latest.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
})
const certName = computed(() => {
  if (typeof localStorage !== 'undefined') return localStorage.getItem('academy:name') || 'Security Graduate'
  return 'Security Graduate'
})

onMounted(() => {
  checkOnboarding()
  void loadProgress()
})
</script>

<template>
  <!-- ── Onboarding modal ─────────────────────────────────────────────────── -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showOnboarding" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 backdrop-blur-sm" style="background:rgba(0,0,0,0.80);" />
        <div class="relative rounded-2xl p-7 w-full max-w-lg mx-4" style="background:rgba(14,15,20,0.99);border:1px solid rgba(139,92,246,0.28);box-shadow:0 40px 80px rgba(0,0,0,0.70);">

          <div class="flex items-center gap-3 mb-2">
            <div class="size-10 rounded-xl flex items-center justify-center" style="background:rgba(139,92,246,0.12);border:1px solid rgba(139,92,246,0.25);">
              <GraduationCap class="size-5" style="color:rgba(167,139,250,0.90);" />
            </div>
            <div>
              <h2 class="text-[18px] font-bold" style="color:rgba(255,255,255,0.92);">Welcome to Academy</h2>
              <p class="text-[11px] mt-0.5" style="color:rgba(255,255,255,0.35);">Let's personalise your learning experience.</p>
            </div>
          </div>

          <div class="h-px my-5" style="background:rgba(255,255,255,0.07);" />

          <div class="space-y-5">
            <div>
              <p class="text-[11px] font-semibold mb-2" style="color:rgba(255,255,255,0.50);">Your name <span style="color:rgba(255,255,255,0.25);">(for your certificate)</span></p>
              <input v-model="learnerName" placeholder="e.g. Alex Rivera" class="w-full rounded-xl px-3.5 py-2.5 text-[13px] text-white outline-none" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);" />
            </div>

            <div>
              <p class="text-[11px] font-semibold mb-2" style="color:rgba(255,255,255,0.50);">Your primary goal</p>
              <div class="grid grid-cols-1 gap-1.5">
                <button v-for="g in GOALS" :key="g"
                  class="rounded-lg px-3 py-2 text-left text-[12px] transition-all cursor-pointer"
                  :style="learnerGoal === g ? 'background:rgba(139,92,246,0.14);border:1px solid rgba(139,92,246,0.30);color:rgba(167,139,250,0.95);' : 'background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);color:rgba(255,255,255,0.50);'"
                  @click="learnerGoal = g">{{ g }}</button>
              </div>
            </div>

            <div>
              <p class="text-[11px] font-semibold mb-2" style="color:rgba(255,255,255,0.50);">Your experience level</p>
              <div class="grid grid-cols-2 gap-1.5">
                <button v-for="l in LEVELS" :key="l"
                  class="rounded-lg px-3 py-2 text-left text-[12px] transition-all cursor-pointer"
                  :style="learnerLevel === l ? 'background:rgba(99,102,241,0.14);border:1px solid rgba(99,102,241,0.30);color:rgba(165,180,252,0.95);' : 'background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);color:rgba(255,255,255,0.50);'"
                  @click="learnerLevel = l">{{ l }}</button>
              </div>
            </div>
          </div>

          <button class="mt-6 w-full rounded-xl py-3 text-[13px] font-semibold cursor-pointer transition-all hover:opacity-90"
            style="background:rgba(139,92,246,0.20);border:1px solid rgba(139,92,246,0.35);color:rgba(167,139,250,0.95);"
            @click="finishOnboarding">
            Start Learning
          </button>
          <button class="mt-2 w-full rounded-xl py-2 text-[11px] cursor-pointer transition-colors hover:bg-white/[0.04]"
            style="color:rgba(255,255,255,0.25);" @click="finishOnboarding">Skip for now</button>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ── Certificate modal ───────────────────────────────────────────────── -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showCertificate" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 backdrop-blur-sm" style="background:rgba(0,0,0,0.85);" @click="showCertificate = false" />
        <div class="relative rounded-2xl overflow-hidden w-full max-w-lg" style="background:#0e0f14;border:1.5px solid rgba(139,92,246,0.35);box-shadow:0 0 80px rgba(139,92,246,0.20);">
          <button class="absolute top-4 right-4 z-10 size-7 flex items-center justify-center rounded-lg cursor-pointer transition-colors hover:bg-white/[0.08]" style="color:rgba(255,255,255,0.35);" @click="showCertificate = false">
            <X class="size-4" />
          </button>

          <!-- Certificate content -->
          <div class="p-10 text-center relative overflow-hidden">
            <!-- Background glow -->
            <div class="absolute inset-0 pointer-events-none" style="background:radial-gradient(ellipse at center, rgba(139,92,246,0.08) 0%, transparent 70%);" />

            <div class="relative">
              <div class="size-16 rounded-2xl mx-auto mb-5 flex items-center justify-center" style="background:rgba(139,92,246,0.15);border:1.5px solid rgba(139,92,246,0.35);">
                <Award class="size-8" style="color:rgba(167,139,250,0.90);" />
              </div>

              <p class="text-[10px] font-bold uppercase tracking-[0.3em] mb-2" style="color:rgba(139,92,246,0.60);">Certificate of Completion</p>
              <p class="text-[13px] mb-3" style="color:rgba(255,255,255,0.45);">This certifies that</p>
              <h2 class="text-[28px] font-display font-black mb-3" style="color:rgba(255,255,255,0.95);">{{ certName }}</h2>
              <p class="text-[13px] leading-relaxed mb-4" style="color:rgba(255,255,255,0.50);">has successfully completed the<br><strong style="color:rgba(167,139,250,0.85);">Vindicter Academy Security Bootcamp</strong><br>covering all {{ totalLessons }} lessons across 5 modules.</p>

              <div class="h-px my-5" style="background:rgba(255,255,255,0.07);" />

              <div class="flex items-center justify-center gap-6 text-[11px]" style="color:rgba(255,255,255,0.30);">
                <div class="text-center">
                  <p class="font-semibold" style="color:rgba(255,255,255,0.55);">Completed</p>
                  <p>{{ completionDate }}</p>
                </div>
                <div class="w-px h-8" style="background:rgba(255,255,255,0.08);" />
                <div class="text-center">
                  <p class="font-semibold" style="color:rgba(255,255,255,0.55);">Lessons</p>
                  <p>{{ totalLessons }} / {{ totalLessons }}</p>
                </div>
                <div class="w-px h-8" style="background:rgba(255,255,255,0.08);" />
                <div class="text-center">
                  <p class="font-semibold" style="color:rgba(255,255,255,0.55);">Issued by</p>
                  <p>Vindicter</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <div class="max-w-5xl mx-auto">

    <!-- Certificate banner (shown when all complete) -->
    <Transition name="cert-banner">
      <div v-if="allComplete" class="mb-6 rounded-xl p-5 flex items-center justify-between gap-4" style="background:linear-gradient(135deg,rgba(139,92,246,0.10) 0%,rgba(99,102,241,0.06) 100%);border:1px solid rgba(139,92,246,0.25);">
        <div class="flex items-center gap-3">
          <div class="size-10 rounded-xl flex items-center justify-center shrink-0" style="background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.28);">
            <Award class="size-5" style="color:rgba(167,139,250,0.90);" />
          </div>
          <div>
            <p class="text-[13px] font-bold" style="color:rgba(255,255,255,0.90);">Bootcamp Complete!</p>
            <p class="text-[11px] mt-0.5" style="color:rgba(255,255,255,0.40);">You've completed all {{ totalLessons }} lessons. Your certificate is ready.</p>
          </div>
        </div>
        <button class="flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-semibold cursor-pointer transition-all hover:scale-[1.02] shrink-0"
          style="background:rgba(139,92,246,0.20);border:1px solid rgba(139,92,246,0.32);color:rgba(167,139,250,0.95);"
          @click="showCertificate = true">
          <Sparkles class="size-3.5" /> View Certificate
        </button>
      </div>
    </Transition>

    <!-- Header + progress -->
    <div class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="h-9 w-9 flex items-center justify-center rounded-xl shrink-0"
          style="background:rgba(139,92,246,0.10);border:1px solid rgba(139,92,246,0.20);">
          <GraduationCap class="h-4 w-4" style="color:rgba(139,92,246,0.80);" />
        </div>
        <div>
          <h1 class="text-[22px] font-display font-black uppercase tracking-wide" style="color:rgba(255,255,255,0.90);">Academy</h1>
          <p class="text-[12px] mt-0.5" style="color:rgba(255,255,255,0.35);">AI-guided security bootcamp · {{ completedCount }} / {{ totalLessons }} lessons complete.</p>
        </div>
      </div>
      <div class="flex items-center gap-3 shrink-0">
        <div class="w-40 h-1.5 rounded-full overflow-hidden" style="background:rgba(255,255,255,0.08);">
          <div class="h-full rounded-full transition-all duration-700" style="background:rgba(139,92,246,0.75);" :style="{ width: progressPercent + '%' }" />
        </div>
        <span class="text-[12px] font-semibold tabular-nums" style="color:rgba(167,139,250,0.80);">{{ progressPercent }}%</span>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loadingProgress" class="space-y-4">
      <div v-for="i in 3" :key="i" class="h-32 rounded-xl animate-pulse" style="background:rgba(255,255,255,0.03);" />
    </div>

    <!-- Modules -->
    <div v-else class="space-y-6">
      <div v-for="mod in curriculum" :key="mod.id">
        <!-- Module header -->
        <div class="flex items-center gap-3 mb-3">
          <span class="text-[10px] font-bold uppercase tracking-[0.18em] px-2 py-0.5 rounded-full border" :class="mod.color" :style="{ borderColor: mod.border, background: mod.bg }">{{ mod.label }}</span>
          <h2 class="text-[14px] font-bold" style="color:rgba(255,255,255,0.70);">{{ mod.theme }}</h2>
          <div class="flex-1 h-px" style="background:rgba(255,255,255,0.06);" />
          <span class="text-[10px]" style="color:rgba(255,255,255,0.20);">
            {{ mod.lessons.filter(l => isCompleted(l.id)).length }} / {{ mod.lessons.length }}
          </span>
        </div>

        <!-- Lessons grid -->
        <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <button
            v-for="lesson in mod.lessons"
            :key="lesson.id"
            class="text-left rounded-xl p-4 transition-all group"
            :class="isLocked(lesson, mod) ? 'opacity-45 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-0.5'"
            :style="isCompleted(lesson.id)
              ? `background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.20);`
              : isStarted(lesson.id)
                ? 'background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);'
                : 'background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);'"
            @click="goToLesson(lesson, mod)"
          >
            <div class="flex items-start justify-between gap-2 mb-2">
              <CheckCircle2 v-if="isCompleted(lesson.id)" class="size-4 shrink-0 mt-0.5" style="color:rgba(167,139,250,0.80);" />
              <div v-else-if="isStarted(lesson.id)" class="size-4 shrink-0 mt-0.5 rounded-full border-2" style="border-color:rgba(255,255,255,0.25);" />
              <Lock v-else-if="isLocked(lesson, mod)" class="size-4 shrink-0 mt-0.5" style="color:rgba(255,255,255,0.20);" />
              <BookOpen v-else class="size-4 shrink-0 mt-0.5" style="color:rgba(255,255,255,0.30);" />
              <ChevronRight v-if="!isLocked(lesson, mod)" class="size-3.5 shrink-0 mt-0.5 opacity-0 group-hover:opacity-60 transition-opacity" style="color:rgba(255,255,255,0.50);" />
            </div>
            <p class="text-[12px] font-semibold leading-snug" :style="isCompleted(lesson.id) ? 'color:rgba(167,139,250,0.90);' : 'color:rgba(255,255,255,0.75);'">
              {{ lesson.title }}
            </p>
            <p v-if="lesson.description" class="mt-1 text-[10px] leading-relaxed" style="color:rgba(255,255,255,0.30);">
              {{ lesson.description }}
            </p>
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: all 0.20s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

.cert-banner-enter-active { transition: all 0.40s cubic-bezier(0.34, 1.56, 0.64, 1); }
.cert-banner-enter-from { opacity: 0; transform: translateY(-8px); }
.cert-banner-leave-active { transition: all 0.20s ease; }
.cert-banner-leave-to { opacity: 0; }
</style>
