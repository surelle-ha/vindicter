<script setup lang="ts">
import {
  AlertTriangle,
  Award,
  BookOpen,
  ChartSpline,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Download,
  GraduationCap,
  Headphones,
  Loader2,
  Lock,
  Mic,
  MoreHorizontal,
  PartyPopper,
  PanelTopOpen,
  RotateCcw,
  Shield,
  Sparkles,
  Swords,
  Target,
  Volume2,
  Wifi,
  Zap,
} from 'lucide-vue-next'
import { useAcademyStore } from '~/stores/academy'
import { LESSONS, WEEKS, TOTAL_DAYS, INTRO_LESSON_IDS, getLesson, getWeekMeta } from '~/data/curriculum'
import type { Lesson, CustomLesson, Week } from '~/data/curriculum'
import AIProfessorChat from '~/components/academy/AIProfessorChat.vue'
import AcademyAudioPlayer from '~/components/academy/AcademyAudioPlayer.vue'
import AcademyWSLTerminal from '~/components/academy/AcademyWSLTerminal.vue'
import AcademyWhiteboard from '~/components/academy/AcademyWhiteboard.vue'
import { useAcademyTTS } from '~/composables/useAcademyTTS'
import type { TTSScriptModel } from '~/composables/useAcademyTTS'
import { useAcademyStudio } from '~/composables/useAcademyStudio'

const academy = useAcademyStore()
const user = useUserStore()
const tts      = useAcademyTTS()
const studio   = useAcademyStudio()
const { notify } = useNotifications()

type View = 'setup' | 'course' | 'lesson' | 'certificate'
const view = ref<View>('course')
const currentLesson = ref<Lesson | CustomLesson | null>(null)

// ── TTS state ──────────────────────────────────────────────────────────────
const showTTSModal      = ref(false)
const ttsModalLesson    = ref<Lesson | CustomLesson | null>(null)
const ttsModalModel     = ref<TTSScriptModel>('claude')
const currentAudioUrl   = ref<string | null>(null)
const lessonActionMenuId = ref<string | null>(null)
const showLeaveLessonModal = ref(false)
const showCompletionModal = ref(false)
const downloadingCertificate = ref(false)
const windowMaximized = ref(true)
const maximizeWarningDismissed = ref(false)
const showMaximizeLessonWarning = computed(() =>
  view.value === 'lesson'
  && !!currentLesson.value
  && !windowMaximized.value
  && !maximizeWarningDismissed.value,
)
let windowResizeTimer: ReturnType<typeof setTimeout> | null = null

async function refreshWindowMaximized() {
  if (typeof window === 'undefined') return
  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window')
    windowMaximized.value = await getCurrentWindow().isMaximized()
  }
  catch {
    const widthGap = Math.abs(window.outerWidth - window.screen.availWidth)
    const heightGap = Math.abs(window.outerHeight - window.screen.availHeight)
    windowMaximized.value = widthGap <= 24 && heightGap <= 32
  }
}

function scheduleWindowMaximizeCheck() {
  if (windowResizeTimer) clearTimeout(windowResizeTimer)
  windowResizeTimer = setTimeout(() => {
    void refreshWindowMaximized()
  }, 120)
}

function dismissMaximizeLessonWarning() {
  maximizeWarningDismissed.value = true
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('vindicta:academy:maximize-warning-dismissed', 'true')
  }
}

// ── Bulk TTS state ─────────────────────────────────────────────────────────
const showBulkTTSModal    = ref(false)
const bulkTTSModel        = ref<TTSScriptModel>('claude')
const bulkQueue           = ref<string[]>([])
const bulkRunning         = ref(false)
const bulkStopRequested   = ref(false)
const bulkIdx             = ref(0)
const bulkCurrentLesson   = computed(() =>
  bulkRunning.value ? (allLessons.value.find(l => l.id === bulkQueue.value[bulkIdx.value]) ?? null) : null,
)

// ── TTS suggestion modal ───────────────────────────────────────────────────
const showTTSSuggestionModal = ref(false)

const ttsModelOptions: { id: TTSScriptModel; label: string; description: string; disabled?: boolean; soon?: boolean }[] = [
  { id: 'claude',      label: 'Claude',      description: 'Anthropic Claude Code CLI' },
  { id: 'codex',       label: 'Codex',       description: 'OpenAI Codex CLI' },
  { id: 'openrouter',  label: 'OpenRouter',  description: 'Configured OpenRouter model' },
  { id: 'ollama',      label: 'Ollama',      description: 'Local Ollama server' },
  { id: 'core',        label: 'DefendCore',  description: "Vindicta's native AI model — currently in training", disabled: true, soon: true },
]

function openCreateTTSModal(lesson: Lesson | CustomLesson) {
  ttsModalLesson.value = lesson
  ttsModalModel.value = tts.scriptModel.value
  showTTSModal.value   = true
  lessonActionMenuId.value = null
}

async function confirmCreateTTS() {
  if (!ttsModalLesson.value) return
  const lesson = ttsModalLesson.value
  showTTSModal.value = false
  tts.setScriptModel(ttsModalModel.value)
  try {
    await tts.createTTS(lesson, ttsModalModel.value)
    // If we're currently viewing that lesson, load the new audio
    if (currentLesson.value?.id === lesson.id && view.value === 'lesson') {
      if (currentAudioUrl.value) URL.revokeObjectURL(currentAudioUrl.value)
      currentAudioUrl.value = await tts.loadAudio(lesson.id)
    }
  } catch (e: unknown) {
    notify(tts.ttsError.value || 'TTS generation failed.', 'error')
  }
}

async function clearLessonAudio(lesson: Lesson | CustomLesson) {
  lessonActionMenuId.value = null
  await tts.clearAudio(lesson.id)
  if ('embeddedAudio' in lesson && lesson.embeddedAudio) {
    await studio.loadEmbeddedAudio(lesson.id, lesson.embeddedAudio.data)
  }
  if (currentLesson.value?.id === lesson.id) {
    if (currentAudioUrl.value) URL.revokeObjectURL(currentAudioUrl.value)
    currentAudioUrl.value = await tts.loadAudio(lesson.id)
  }
}

function toggleLessonActions(lesson: Lesson | CustomLesson) {
  lessonActionMenuId.value = lessonActionMenuId.value === lesson.id ? null : lesson.id
}

function openBulkTTSModal() {
  bulkQueue.value = LESSONS
    .filter(l => !tts.cachedLessonIds.value.has(l.id) && !tts.generatingLessonIds.value.has(l.id))
    .map(l => l.id)
  bulkTTSModel.value = tts.scriptModel.value
  showBulkTTSModal.value = true
}

function toggleBulkLesson(lessonId: string) {
  if (bulkRunning.value) return
  const idx = bulkQueue.value.indexOf(lessonId)
  if (idx >= 0) bulkQueue.value.splice(idx, 1)
  else bulkQueue.value.push(lessonId)
}

async function startBulkTTS() {
  if (bulkRunning.value || bulkQueue.value.length === 0) return
  bulkRunning.value = true
  bulkStopRequested.value = false
  bulkIdx.value = 0
  tts.setScriptModel(bulkTTSModel.value)
  const queue = [...bulkQueue.value]
  for (let i = 0; i < queue.length; i++) {
    if (bulkStopRequested.value) break
    bulkIdx.value = i
    const lesson = allLessons.value.find(l => l.id === queue[i])
    if (!lesson || tts.cachedLessonIds.value.has(lesson.id)) continue
    try {
      await tts.createTTS(lesson, bulkTTSModel.value)
    } catch {
      // continue to next lesson on error
    }
  }
  bulkRunning.value = false
  bulkIdx.value = 0
}

function stopBulkTTS() {
  bulkStopRequested.value = true
}

function dismissTTSSuggestion(permanent = false) {
  showTTSSuggestionModal.value = false
  if (permanent) {
    localStorage.setItem('vindicta:academy:tts:suggest-dismissed', 'true')
  }
}

function requestLeaveLesson() {
  showLeaveLessonModal.value = true
}

function confirmLeaveLesson() {
  showLeaveLessonModal.value = false
  lessonActionMenuId.value = null
  view.value = 'course'
}

// Load audio when entering lesson view; clear it on exit
watch([view, currentLesson] as const, async ([v, lesson]) => {
  if (currentAudioUrl.value) {
    URL.revokeObjectURL(currentAudioUrl.value)
    currentAudioUrl.value = null
  }
  if (v === 'lesson') {
    void refreshWindowMaximized()
  }
  if (v === 'lesson' && lesson) {
    currentAudioUrl.value = await tts.loadAudio(lesson.id)
  }
})

onMounted(async () => {
  maximizeWarningDismissed.value = localStorage.getItem('vindicta:academy:maximize-warning-dismissed') === 'true'
  window.addEventListener('resize', scheduleWindowMaximizeCheck)
  await refreshWindowMaximized()

  // Seed course-bin from bundled resources on first launch (no-op if already seeded)
  await studio.seedCourseBin()
  // Load custom .va lessons from course-bin directory
  const customLessons = await studio.loadCourseBin()
  academy.setCustomLessons(customLessons)
  // Count non-intro .va lessons toward the progress total so migrated built-in curriculum is tracked
  const introIds = new Set(INTRO_LESSON_IDS)
  const countable = customLessons.filter(l => !introIds.has(l.id))
  if (countable.length > 0) academy.setCustomTotalLessons(countable.length)
  for (const cl of customLessons) {
    if (cl.embeddedAudio) await studio.loadEmbeddedAudio(cl.id, cl.embeddedAudio.data)
  }

  await academy.loadFromDisk()
  setupCertificateName.value = academy.certificateName ?? ''
  if (!academy.setupComplete) {
    view.value = 'setup'
  }
  else if (academy.allCompleted && academy.certificateIssuedAt) {
    view.value = 'course'
  }
  else {
    view.value = 'course'
    // Restore last visited lesson (built-in or custom)
    if (academy.lastVisitedLessonId) {
      const last = allLessons.value.find(l => l.id === academy.lastVisitedLessonId) ?? null
      if (last && isLessonUnlocked(last)) currentLesson.value = last
    }
  }

  // Randomly suggest TTS narration if user hasn't dismissed it and has no audio yet
  const suggestionDismissed = localStorage.getItem('vindicta:academy:tts:suggest-dismissed') === 'true'
  if (!suggestionDismissed) {
    const delay = 20000 + Math.random() * 25000 // 20–45 seconds
    setTimeout(async () => {
      if (
        view.value === 'course' &&
        tts.cachedLessonIds.value.size === 0 &&
        !showBulkTTSModal.value &&
        (await tts.checkKokoroReady())
      ) {
        showTTSSuggestionModal.value = true
      }
    }, delay)
  }
})

// ── Setup ──────────────────────────────────────────────────────────────────

const setupCertificateName = ref('')
const learnerGoal = ref('product-security')
const learnerExperience = ref('starter')
const learnerPace = ref('flexible')

const learnerGoalOptions = [
  { id: 'product-security', label: 'Product Security', description: 'Threat model, review code, and build safer features.', icon: Shield },
  { id: 'red-team', label: 'Red Team', description: 'Practice recon, exploitation, and reporting with authorization.', icon: Swords },
  { id: 'blue-team', label: 'Blue Team', description: 'Learn monitoring, detection, response, and hardening.', icon: Wifi },
]

const learnerExperienceOptions = [
  { id: 'starter', label: 'New to security' },
  { id: 'builder', label: 'Developer / engineer' },
  { id: 'operator', label: 'Security practitioner' },
]

const learnerPaceOptions = [
  { id: 'flexible', label: 'Whenever I am free' },
  { id: 'steady', label: 'A few lessons weekly' },
  { id: 'intensive', label: 'Focused sprint' },
]

const certificateNamePlaceholder = computed(() => user.name?.trim() || 'Vindicta Learner')

async function completeSetup() {
  const name = setupCertificateName.value.trim() || certificateNamePlaceholder.value
  await academy.setSetup('ai-assisted', academy.aiModel ?? 'claude', name)
  view.value = 'course'
}

// ── Course view ────────────────────────────────────────────────────────────

const weekFilter    = ref<number | null>(null)
const sectionFilter = ref<string | null>(null)

function setWeekFilter(n: number | null) {
  weekFilter.value = n
  sectionFilter.value = null
}
function setSectionFilter(s: string | null) {
  sectionFilter.value = s
  weekFilter.value = null
}
function clearFilters() {
  weekFilter.value = null
  sectionFilter.value = null
}

const allLessons = computed<(Lesson | CustomLesson)[]>(() => [
  ...LESSONS,
  ...academy.customLessons,
])

// Groups custom lessons by their section field, sorted by day within each group
const customSections = computed(() => {
  const map = new Map<string, CustomLesson[]>()
  for (const lesson of academy.customLessons) {
    const key = lesson.section?.trim() || 'Unsectioned'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(lesson)
  }
  return Array.from(map.entries())
    .map(([name, lessons]) => ({ name, lessons: lessons.sort((a, b) => a.day - b.day) }))
})

const displayedLessons = computed(() => {
  if (weekFilter.value !== null) return allLessons.value.filter(l => l.week === weekFilter.value)
  if (sectionFilter.value !== null) {
    return academy.customLessons.filter(l => (l.section?.trim() || 'Unsectioned') === sectionFilter.value)
  }
  return allLessons.value
})

const nextStudyLesson = computed(() =>
  allLessons.value.find(lesson => !isIntroLesson(lesson) && isLessonUnlocked(lesson) && !academy.isCompleted(lesson.id))
  ?? allLessons.value.find(lesson => isLessonUnlocked(lesson) && !academy.isCompleted(lesson.id))
  ?? null,
)

const resumeLesson = computed(() => {
  const lastId = academy.lastVisitedLessonId
  const last = lastId ? (allLessons.value.find(l => l.id === lastId) ?? null) : null
  if (last && isLessonUnlocked(last) && !academy.isCompleted(last.id)) return last
  return nextStudyLesson.value
})

const activeMilestones = computed(() => {
  const builtIn = WEEKS
    .filter(week => LESSONS.some(l => l.week === week.number))
    .map(week => {
      const lessons = LESSONS.filter(l => l.week === week.number)
      const completed = lessons.filter(l => academy.isCompleted(l.id)).length
      return { ...week, total: lessons.length, completed, percent: Math.round((completed / lessons.length) * 100) }
    })
  const custom = customSections.value.map(({ name, lessons }) => {
    const completed = lessons.filter(l => academy.isCompleted(l.id)).length
    const c = getSectionColor(name)
    return {
      number: -1,
      title: name,
      theme: '',
      color: c.color,
      bg: c.bg,
      border: c.border,
      total: lessons.length,
      completed,
      percent: lessons.length ? Math.round((completed / lessons.length) * 100) : 0,
      sectionName: name,
    }
  })
  return [...builtIn, ...custom]
})

function weekForLesson(lesson: Lesson | CustomLesson): Week {
  if ('section' in lesson && lesson.week === 99) {
    const c = getSectionColor(lesson.section || 'Unsectioned')
    return { number: 99, title: lesson.section || 'Unsectioned', theme: lesson.section || 'Unsectioned', color: c.color, bg: c.bg, border: c.border }
  }
  return getWeekMeta(lesson.week)
}

function lessonLabel(lesson: Lesson | CustomLesson): string {
  return lesson.week === 0 ? `Intro ${lesson.day}` : `Lesson ${lesson.day}`
}

function isIntroLesson(lesson: Lesson | CustomLesson): boolean {
  return lesson.week === 0
}

function lessonIndex(lesson: Lesson | CustomLesson) {
  return LESSONS.findIndex(item => item.id === lesson.id)
}

function isLessonUnlocked(lesson: Lesson | CustomLesson) {
  // Explicit prerequisite always takes priority — set via Academy Builder or VA file
  if (lesson.prerequisiteId) {
    return academy.isCompleted(lesson.prerequisiteId)
  }

  if ('section' in lesson) {
    // Custom lessons without an explicit prerequisite: sequential within their section by day
    const sectionLessons = academy.customLessons
      .filter(l => (l.section?.trim() || 'Unsectioned') === (lesson.section?.trim() || 'Unsectioned'))
      .sort((a, b) => a.day - b.day)
    const idx = sectionLessons.findIndex(l => l.id === lesson.id)
    if (idx <= 0) return true
    return academy.isCompleted(sectionLessons[idx - 1].id)
  }
  // Built-in lessons without an explicit prerequisite: sequential by LESSONS array
  const index = lessonIndex(lesson)
  if (index <= 0) return true
  const previous = LESSONS[index - 1]
  return previous ? academy.isCompleted(previous.id) : false
}

function lessonCardTheme(lesson: Lesson | CustomLesson): Record<string, string> {
  const palettes: Record<number, { accent: string; glow: string; wash: string; shine: string }> = {
    0:  { accent: '45, 212, 191',  glow: '20, 184, 166',  wash: '13, 148, 136',  shine: '153, 246, 228' },
    1:  { accent: '129, 140, 248', glow: '99, 102, 241',  wash: '79, 70, 229',   shine: '199, 210, 254' },
    2:  { accent: '196, 181, 253', glow: '139, 92, 246',  wash: '124, 58, 237',  shine: '221, 214, 254' },
    3:  { accent: '251, 113, 133', glow: '244, 63, 94',   wash: '225, 29, 72',   shine: '254, 205, 211' },
    4:  { accent: '52, 211, 153',  glow: '16, 185, 129',  wash: '5, 150, 105',   shine: '167, 243, 208' },
    5:  { accent: '251, 191, 36',  glow: '245, 158, 11',  wash: '217, 119, 6',   shine: '253, 230, 138' },
    6:  { accent: '34, 211, 238',  glow: '6, 182, 212',   wash: '8, 145, 178',   shine: '165, 243, 252' },
    7:  { accent: '125, 211, 252', glow: '14, 165, 233',  wash: '2, 132, 199',   shine: '186, 230, 253' },
    99: { accent: '232, 121, 249', glow: '217, 70, 239',  wash: '192, 38, 211',  shine: '245, 208, 254' },
  }
  const palette = palettes[lesson.week] ?? palettes[1]!
  return {
    '--lesson-accent': palette.accent,
    '--lesson-glow': palette.glow,
    '--lesson-wash': palette.wash,
    '--lesson-shine': palette.shine,
  }
}

const professorExtraContext = computed(() => {
  const l = currentLesson.value
  if (l && 'agentNotes' in l && l.agentNotes?.trim()) {
    return `[LESSON CONTEXT FROM COURSE AUTHOR]\n${l.agentNotes.trim()}\n[END CONTEXT]`
  }
  return ''
})

function openLesson(lesson: Lesson | CustomLesson) {
  lessonActionMenuId.value = null
  if (!isLessonUnlocked(lesson)) return
  resetWhiteboardForLesson()
  currentLesson.value = lesson
  view.value = 'lesson'
  void academy.startLesson(lesson.id)
  void academy.setLastVisited('week-' + lesson.week, lesson.id)
}

async function completeLessonAndCelebrate(lesson: Lesson | CustomLesson, allowReplay = false) {
  const wasComplete = academy.allCompleted && !!academy.certificateIssuedAt
  await academy.grantLessonCompletion(lesson.id)
  await nextTick()
  if (academy.allCompleted && academy.certificateIssuedAt && (!wasComplete || allowReplay)) {
    showCompletionModal.value = true
  }
}

function handleLessonCardClick(e: MouseEvent, lesson: Lesson | CustomLesson) {
  if (import.meta.env.DEV && e.ctrlKey && e.shiftKey) {
    void completeLessonAndCelebrate(lesson, true)
    return
  }
  openLesson(lesson)
}

// ── Lesson view ────────────────────────────────────────────────────────────

const lessonContentEl = ref<HTMLElement | null>(null)

// ── Whiteboard ─────────────────────────────────────────────────────────────
type WhiteboardItem = {
  id: string
  type: 'diagram'
  title: string
  content: string
  createdAt: string
}

const showWhiteboard = ref(false)
const whiteboardItems = ref<WhiteboardItem[]>([])
const activeWhiteboardItemId = ref('')
const whiteboardItemSeq = ref(1)

// ── Practice terminal drawer ───────────────────────────────────────────────
const labTerminalVisible = ref(false)
const labSuggestedCommand = ref('')
const terminalHeight = ref(320)
const terminalExpanded = ref(false)
const isResizingTerminal = ref(false)
let terminalResizeStartY = 0
let terminalResizeStartHeight = 0

const appStore = useAppStore()
const wslAcademyDistro = computed(() => {
  const profile = appStore.wslProfiles.find(p => p.id === 'academy')
  return profile?.distro ?? ''
})
const terminalDrawerHeight = computed(() => terminalExpanded.value ? 'calc(100% - 1rem)' : `${terminalHeight.value}px`)

function onMermaidDiagram(code: string) {
  addWhiteboardDiagram(code, true)
}

function syncWhiteboardDiagrams(codes: string[]) {
  showWhiteboard.value = false
  whiteboardItems.value = []
  activeWhiteboardItemId.value = ''
  whiteboardItemSeq.value = 1
  codes.forEach(code => addWhiteboardDiagram(code, false))
  if (whiteboardItems.value[0]) {
    activeWhiteboardItemId.value = whiteboardItems.value[0].id
  }
}

function addWhiteboardDiagram(code: string, openBoard: boolean) {
  const trimmed = code.trim()
  if (!trimmed) return
  const existing = whiteboardItems.value.find(item => item.type === 'diagram' && item.content === trimmed)
  if (existing) {
    activeWhiteboardItemId.value = existing.id
    if (openBoard) showWhiteboard.value = true
    return
  }

  const diagramCount = whiteboardItems.value.filter(item => item.type === 'diagram').length + 1
  const item: WhiteboardItem = {
    id: `diagram-${Date.now()}-${whiteboardItemSeq.value++}`,
    type: 'diagram',
    title: `Chart ${diagramCount}`,
    content: trimmed,
    createdAt: new Date().toISOString(),
  }
  whiteboardItems.value.push(item)
  activeWhiteboardItemId.value = item.id
  if (openBoard) {
    showWhiteboard.value = true
  }
}

function resetWhiteboardForLesson() {
  showWhiteboard.value = false
  whiteboardItems.value = []
  activeWhiteboardItemId.value = ''
  whiteboardItemSeq.value = 1
  labTerminalVisible.value = false
  labSuggestedCommand.value = ''
  terminalExpanded.value = false
}

function selectWhiteboardItem(id: string) {
  activeWhiteboardItemId.value = id
}

function openLabTerminal(command = '') {
  labSuggestedCommand.value = command
  labTerminalVisible.value = true
}

function toggleLabTerminal() {
  labTerminalVisible.value = !labTerminalVisible.value
}

function toggleTerminalExpanded() {
  terminalExpanded.value = !terminalExpanded.value
}

function startTerminalResize(e: MouseEvent) {
  terminalExpanded.value = false
  isResizingTerminal.value = true
  terminalResizeStartY = e.clientY
  terminalResizeStartHeight = terminalHeight.value
  document.addEventListener('mousemove', doTerminalResize)
  document.addEventListener('mouseup', stopTerminalResize)
  e.preventDefault()
}

function doTerminalResize(e: MouseEvent) {
  if (!isResizingTerminal.value) return
  const delta = terminalResizeStartY - e.clientY
  terminalHeight.value = Math.max(220, Math.min(620, terminalResizeStartHeight + delta))
}

function stopTerminalResize() {
  isResizingTerminal.value = false
  document.removeEventListener('mousemove', doTerminalResize)
  document.removeEventListener('mouseup', stopTerminalResize)
}

// ── Chat resize ────────────────────────────────────────────────────────────
const chatWidth = ref(352) // 22rem default
const isResizing = ref(false)
let resizeStartX = 0
let resizeStartWidth = 0
const chatPanelStyle = computed(() => ({
  width: `${chatWidth.value}px`,
  height: labTerminalVisible.value && academy.mode === 'ai-assisted'
    ? `calc(100% - ${terminalDrawerHeight.value})`
    : '100%',
}))

function startResize(e: MouseEvent) {
  isResizing.value = true
  resizeStartX = e.clientX
  resizeStartWidth = chatWidth.value
  document.addEventListener('mousemove', doResize)
  document.addEventListener('mouseup', stopResize)
  e.preventDefault()
}

function doResize(e: MouseEvent) {
  if (!isResizing.value) return
  const delta = resizeStartX - e.clientX
  chatWidth.value = Math.max(260, Math.min(600, resizeStartWidth + delta))
}

function stopResize() {
  isResizing.value = false
  document.removeEventListener('mousemove', doResize)
  document.removeEventListener('mouseup', stopResize)
}

onUnmounted(() => {
  document.removeEventListener('mousemove', doResize)
  document.removeEventListener('mouseup', stopResize)
  document.removeEventListener('mousemove', doTerminalResize)
  document.removeEventListener('mouseup', stopTerminalResize)
  window.removeEventListener('resize', scheduleWindowMaximizeCheck)
  if (windowResizeTimer) clearTimeout(windowResizeTimer)
})

const nextLesson = computed<Lesson | CustomLesson | null>(() => {
  if (!currentLesson.value) return null
  const idx = allLessons.value.findIndex(l => l.id === currentLesson.value!.id)
  const next = (idx < allLessons.value.length - 1 ? allLessons.value[idx + 1] : null) ?? null
  return next && isLessonUnlocked(next) ? next : null
})

const prevLesson = computed<Lesson | CustomLesson | null>(() => {
  if (!currentLesson.value) return null
  const idx = allLessons.value.findIndex(l => l.id === currentLesson.value!.id)
  return (idx > 0 ? allLessons.value[idx - 1] : null) ?? null
})

async function markComplete() {
  if (!currentLesson.value) return
  await completeLessonAndCelebrate(currentLesson.value)
}

function goToLesson(lesson: Lesson | null) {
  if (!lesson || !isLessonUnlocked(lesson)) return
  if (currentLesson.value?.id !== lesson.id) {
    resetWhiteboardForLesson()
  }
  currentLesson.value = lesson
  void academy.startLesson(lesson.id)
  void academy.setLastVisited('week-' + lesson.week, lesson.id)
  lessonContentEl.value?.scrollTo(0, 0)
}

// ── Markdown renderer ──────────────────────────────────────────────────────

function renderMarkdown(text: string): string {
  let html = text
    .replace(/^#\s*Day\s+\d+\s+.\s+/, '# ')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Code fences
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_: string, lang: string, code: string) => {
    return `<pre class="code-block"><code class="lang-${lang}">${code.trimEnd()}</code></pre>`
  })

  // Inline code
  html = html.replace(/`([^`\n]+)`/g, '<code class="inline-code">$1</code>')

  // Tables
  html = html.replace(/\|(.+)\|\n\|[-| :]+\|\n((?:\|.+\|\n?)*)/g, (_: string, header: string, rows: string) => {
    const ths = header.split('|').filter(Boolean).map(h => `<th>${h.trim()}</th>`).join('')
    const trs = rows.trim().split('\n').map(row => {
      const tds = row.split('|').filter(Boolean).map(c => `<td>${c.trim()}</td>`).join('')
      return `<tr>${tds}</tr>`
    }).join('')
    return `<table class="lesson-table"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`
  })

  // Headings
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')

  // Bold / italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // Unordered lists
  html = html.replace(/((?:^- .+\n?)+)/gm, (block: string) => {
    const items = block.trim().split('\n').map(line => `<li>${line.replace(/^- /, '')}</li>`).join('')
    return `<ul>${items}</ul>`
  })

  // Ordered lists
  html = html.replace(/((?:^\d+\. .+\n?)+)/gm, (block: string) => {
    const items = block.trim().split('\n').map(line => `<li>${line.replace(/^\d+\. /, '')}</li>`).join('')
    return `<ol>${items}</ol>`
  })

  // Paragraphs
  html = html.replace(/\n{2,}/g, '</p><p>')
  html = `<p>${html}</p>`
  html = html.replace(/<p>\s*(<(?:h[1-6]|ul|ol|pre|table)[^>]*>)/g, '$1')
  html = html.replace(/(<\/(?:h[1-6]|ul|ol|pre|table)>)\s*<\/p>/g, '$1')
  html = html.replace(/<p><\/p>/g, '')
  html = html.replace(/\n/g, '<br>')
  html = html.replace(/<br>\s*(<(?:li|tr|th|td|\/ul|\/ol))/g, '$1')

  return html
}

// ── Certificate ────────────────────────────────────────────────────────────

const certDate = computed(() => {
  if (!academy.certificateIssuedAt) return ''
  return new Date(academy.certificateIssuedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
})

const certificateName = computed(() => {
  return academy.certificateName || user.name || 'Vindicta Learner'
})

const certificateId = computed(() => {
  const issued = academy.certificateIssuedAt ? new Date(academy.certificateIssuedAt) : new Date()
  const stamp = issued.toISOString().slice(0, 10).replace(/-/g, '')
  return `VND-${stamp}-${String(academy.completedCount).padStart(2, '0')}`
})

const certificateSkills = [
  'Security Foundations',
  'Web App Security',
  'Penetration Testing',
  'Defensive Monitoring',
  'Secure Code Review',
  'Incident Response',
]

function showCertificate() {
  showCompletionModal.value = false
  view.value = 'certificate'
}

function confettiStyle(index: number) {
  return {
    '--i': String(index),
    '--fall-x': `${(index % 7) * 14}%`,
  }
}

function sanitizeFileName(value: string) {
  return value
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120)
    || 'Vindicta Academy Certificate'
}

function pdfText(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
}

function pdfLine(text: string, x: number, y: number, size: number, font = 'F1', color = '1 1 1') {
  return `BT /${font} ${size} Tf ${color} rg ${x} ${y} Td (${pdfText(text)}) Tj ET\n`
}

function buildCertificatePdf() {
  const content = [
    'q\n',
    '0.035 0.039 0.055 rg 0 0 842 595 re f\n',
    '0.96 0.68 0.22 rg 42 42 758 511 re S\n',
    '0.14 0.59 0.54 rg 58 58 726 479 re S\n',
    pdfLine('CERTIFICATE OF COMPLETION', 286, 470, 13, 'F2', '0.96 0.74 0.28'),
    pdfLine('Vindicta Security Academy', 219, 421, 30, 'F2', '1 1 1'),
    pdfLine('Presented to', 382, 365, 12, 'F1', '0.65 0.68 0.76'),
    pdfLine(certificateName.value, 278, 323, 28, 'F2', '1 1 1'),
    pdfLine('For completing the full security engineering curriculum across foundations, application security,', 132, 273, 12, 'F1', '0.78 0.81 0.88'),
    pdfLine('red team practice, defensive operations, secure review, and incident response.', 194, 252, 12, 'F1', '0.78 0.81 0.88'),
    pdfLine(`${TOTAL_DAYS} lessons completed`, 104, 177, 14, 'F2', '0.96 0.74 0.28'),
    pdfLine('100% professor approved', 333, 177, 14, 'F2', '0.34 0.86 0.72'),
    pdfLine(certificateId.value, 569, 177, 12, 'F2', '0.70 0.75 0.98'),
    pdfLine(`Issued on ${certDate.value}`, 347, 108, 12, 'F1', '0.65 0.68 0.76'),
    'Q\n',
  ].join('')

  const encoder = new TextEncoder()
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${encoder.encode(content).length} >>\nstream\n${content}endstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
  ]

  let pdf = '%PDF-1.4\n'
  const offsets: number[] = [0]
  for (let i = 0; i < objects.length; i++) {
    offsets.push(encoder.encode(pdf).length)
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`
  }
  const xrefOffset = encoder.encode(pdf).length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return encoder.encode(pdf)
}

function browserDownload(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

async function downloadCertificatePdf() {
  if (downloadingCertificate.value) return
  downloadingCertificate.value = true
  const filename = sanitizeFileName(`Vindicta Academy Certificate - ${certificateName.value}.pdf`)
  const bytes = buildCertificatePdf()
  try {
    const { save } = await import('@tauri-apps/plugin-dialog')
    const { writeFile } = await import('@tauri-apps/plugin-fs')
    const path = await save({
      defaultPath: filename,
      filters: [{ name: 'PDF document', extensions: ['pdf'] }],
    })
    if (path) {
      await writeFile(path, bytes)
      notify('Certificate PDF saved.', 'success')
    }
  }
  catch {
    browserDownload(bytes, filename)
    notify('Certificate PDF downloaded.', 'success')
  }
  finally {
    downloadingCertificate.value = false
  }
}

async function resetAcademy() {
  await academy.resetProgress(false)
  view.value = 'setup'
  currentLesson.value = null
  weekFilter.value = null
  setupCertificateName.value = ''
  showCompletionModal.value = false
}
</script>

<template>
  <div class="academy-page flex h-full flex-col overflow-hidden">

    <!-- ── SETUP ──────────────────────────────────────────────────────────── -->
    <div v-if="view === 'setup'" class="flex h-full items-center justify-center overflow-y-auto p-6 custom-scroll">
      <div class="w-full max-w-5xl space-y-6">
        <!-- Header -->
        <div class="text-center">
          <div class="mx-auto mb-4 grid size-16 place-items-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10">
            <GraduationCap class="size-8 text-indigo-300" />
          </div>
          <h1 class="font-display text-3xl font-bold text-[var(--text)]">Vindicta Academy Enrollment</h1>
          <p class="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-muted)]">
            Build your security path at your pace. Your professor unlocks lessons when you demonstrate understanding, so learning fits the time you actually have.
          </p>
        </div>

        <div class="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div class="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-faint)]">What are you aiming for?</p>
              <div class="mt-3 grid gap-3 md:grid-cols-3">
                <button
                  v-for="goal in learnerGoalOptions"
                  :key="goal.id"
                  class="rounded-xl border p-3 text-left transition-all"
                  :class="learnerGoal === goal.id ? 'border-teal-500/30 bg-teal-500/10' : 'border-[var(--border)] hover:border-teal-500/20 hover:bg-white/[0.03]'"
                  @click="learnerGoal = goal.id"
                >
                  <component :is="goal.icon" class="size-4 text-teal-300" />
                  <p class="mt-3 text-sm font-semibold text-[var(--text)]">{{ goal.label }}</p>
                  <p class="mt-1 text-[11px] leading-relaxed text-[var(--text-muted)]">{{ goal.description }}</p>
                </button>
              </div>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <div>
                <p class="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-faint)]">Current experience</p>
                <div class="mt-2 space-y-2">
                  <button
                    v-for="option in learnerExperienceOptions"
                    :key="option.id"
                    class="flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-xs transition-all"
                    :class="learnerExperience === option.id ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-200' : 'border-[var(--border)] text-[var(--text-muted)] hover:bg-white/[0.03]'"
                    @click="learnerExperience = option.id"
                  >
                    {{ option.label }}
                    <CheckCircle2 v-if="learnerExperience === option.id" class="size-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <p class="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-faint)]">Learning rhythm</p>
                <div class="mt-2 space-y-2">
                  <button
                    v-for="option in learnerPaceOptions"
                    :key="option.id"
                    class="flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-xs transition-all"
                    :class="learnerPace === option.id ? 'border-violet-500/30 bg-violet-500/10 text-violet-200' : 'border-[var(--border)] text-[var(--text-muted)] hover:bg-white/[0.03]'"
                    @click="learnerPace = option.id"
                  >
                    {{ option.label }}
                    <CheckCircle2 v-if="learnerPace === option.id" class="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
            <div class="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-4">
              <div class="flex items-start gap-3">
                <div class="grid size-10 shrink-0 place-items-center rounded-xl border border-amber-500/25 bg-amber-500/10">
                  <Award class="size-5 text-amber-300" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-[10px] font-semibold uppercase tracking-widest text-amber-200/80">Certificate name</p>
                  <label for="academy-certificate-name" class="mt-2 block text-sm font-semibold text-[var(--text)]">Name to print on your certificate</label>
                  <input
                    id="academy-certificate-name"
                    v-model="setupCertificateName"
                    type="text"
                    autocomplete="name"
                    :placeholder="certificateNamePlaceholder"
                    class="mt-3 h-11 w-full rounded-xl border border-amber-500/20 bg-black/20 px-3 text-sm text-[var(--text)] outline-none transition-colors placeholder:text-[var(--text-faint)] focus:border-amber-400/50 focus:bg-black/30"
                  >
                  <p class="mt-2 text-[11px] leading-relaxed text-[var(--text-muted)]">
                    Leave this blank to use your onboarding name.
                  </p>
                </div>
              </div>
            </div>
        <!-- CTA -->
        <button
          class="w-full rounded-xl bg-indigo-600/80 py-3 text-sm font-semibold text-white transition-all hover:bg-indigo-600 disabled:opacity-40"
          @click="completeSetup"
        >
          Enroll and Open Roadmap
        </button>

        <!-- Stats -->
        <div class="flex justify-center gap-6 text-center">
          <div>
            <p class="text-lg font-bold text-[var(--text)]">{{ TOTAL_DAYS }}</p>
            <p class="text-[10px] text-[var(--text-faint)]">Lessons</p>
          </div>
          <div>
            <p class="text-lg font-bold text-[var(--text)]">~45h</p>
            <p class="text-[10px] text-[var(--text-faint)]">Content</p>
          </div>
          <div>
            <p class="text-lg font-bold text-[var(--text)]">1</p>
            <p class="text-[10px] text-[var(--text-faint)]">Certificate</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ── COURSE VIEW ─────────────────────────────────────────────────────── -->
      </div>
    </div>

    <template v-else-if="view === 'course'">
      <div class="flex shrink-0 items-center gap-3 border-b border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3">
        <div class="grid size-8 shrink-0 place-items-center rounded-lg border border-indigo-500/20 bg-indigo-500/10">
          <GraduationCap class="size-4 text-indigo-300" />
        </div>
        <div class="flex-1 min-w-0">
          <h1 class="text-sm font-semibold text-[var(--text)]">Academy Roadmap</h1>
          <p class="text-[11px] text-[var(--text-muted)]">
            {{ academy.completedCount }}/{{ TOTAL_DAYS }} lessons completed
            · {{ academy.progressPercent }}%
            · <span class="capitalize">{{ academy.mode ?? 'manual' }}</span> mode
          </p>
        </div>
        <!-- Narration button -->
        <button
          class="flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-[11px] text-[var(--text-faint)] transition-colors hover:border-teal-500/30 hover:bg-teal-500/[0.06] hover:text-teal-300"
          :class="bulkRunning ? 'border-teal-500/30 bg-teal-500/[0.06] text-teal-300' : ''"
          title="Manage audio narrations"
          @click="openBulkTTSModal"
        >
          <Loader2 v-if="bulkRunning" class="size-3.5 animate-spin" />
          <Headphones v-else class="size-3.5" />
          <span class="hidden sm:inline">{{ bulkRunning ? `Generating ${bulkIdx + 1}/${bulkQueue.length}` : 'Narration' }}</span>
        </button>
        <!-- Progress bar -->
        <div class="flex items-center gap-3 shrink-0">
          <div class="w-28 rounded-full bg-white/[0.06] h-1.5">
            <div class="h-1.5 rounded-full bg-indigo-500 transition-all" :style="{ width: academy.progressPercent + '%' }" />
          </div>
          <button
            class="text-[10px] text-[var(--text-faint)] hover:text-[var(--text-muted)] transition-colors"
            title="Reset progress"
            @click="resetAcademy"
          >
            <RotateCcw class="size-3" />
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-6 custom-scroll">
        <section class="academy-roadmap-hero overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
          <div class="grid gap-5 lg:grid-cols-[1fr_18rem]">
            <div class="min-w-0">
              <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-300/80">Student roadmap</p>
              <h2 class="mt-2 font-display text-3xl font-bold text-[var(--text)]">Choose the next unlocked lesson and keep moving.</h2>
              <p class="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--text-muted)]">
                The path is flexible, but progress is still professor-gated. Finish a lesson by proving understanding in chat, then the next node opens.
              </p>
              <div class="mt-5 flex flex-wrap gap-2">
                <button
                  v-if="resumeLesson"
                  class="inline-flex items-center gap-2 rounded-xl bg-indigo-600/85 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-600"
                  @click="openLesson(resumeLesson)"
                >
                  Continue: {{ resumeLesson.title }}
                  <ChevronRight class="size-4" />
                </button>
                <button
                  v-if="academy.allCompleted && academy.certificateIssuedAt"
                  class="inline-flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-200 transition-colors hover:bg-amber-500/15"
                  @click="view = 'certificate'"
                >
                  <Award class="size-4" />
                  View Certificate
                </button>
              </div>
            </div>

            <div class="rounded-xl border border-white/10 bg-black/15 p-4">
              <div class="flex items-center justify-between">
                <p class="text-[10px] uppercase tracking-[0.14em] text-[var(--text-faint)]">Progress</p>
                <p class="text-sm font-bold text-[var(--text)]">{{ academy.progressPercent }}%</p>
              </div>
              <div class="mt-3 h-2 rounded-full bg-white/[0.06]">
                <div class="h-2 rounded-full bg-gradient-to-r from-teal-400 via-indigo-400 to-violet-400 transition-all" :style="{ width: academy.progressPercent + '%' }" />
              </div>
              <div class="mt-4 grid grid-cols-2 gap-2">
                <div class="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <p class="text-lg font-bold text-[var(--text)]">{{ academy.completedCount }}</p>
                  <p class="text-[10px] text-[var(--text-faint)]">Completed</p>
                </div>
                <div class="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <p class="text-lg font-bold text-[var(--text)]">{{ TOTAL_DAYS }}</p>
                  <p class="text-[10px] text-[var(--text-faint)]">Lessons</p>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-6 grid gap-2 md:grid-cols-4 xl:grid-cols-8">
            <button
              v-for="milestone in activeMilestones"
              :key="'sectionName' in milestone ? milestone.sectionName : milestone.number"
              class="rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5"
              :class="('sectionName' in milestone ? sectionFilter === milestone.sectionName : weekFilter === milestone.number) ? [milestone.border, milestone.bg] : 'border-white/10 bg-white/[0.03] hover:border-white/20'"
              @click="'sectionName' in milestone ? setSectionFilter(sectionFilter === milestone.sectionName ? null : milestone.sectionName) : setWeekFilter(weekFilter === milestone.number ? null : milestone.number)"
            >
              <p class="truncate text-[10px] font-bold uppercase tracking-widest" :class="milestone.color">{{ milestone.title }}</p>
              <p class="mt-1 truncate text-[11px] text-[var(--text-muted)]">{{ milestone.theme }}</p>
              <div class="mt-3 h-1 rounded-full bg-white/[0.08]">
                <div class="h-1 rounded-full bg-current transition-all" :class="milestone.color" :style="{ width: milestone.percent + '%' }" />
              </div>
            </button>
          </div>
        </section>

        <!-- Filter tabs -->
        <div class="flex items-center gap-1.5 overflow-x-auto">
          <button
            class="shrink-0 rounded-lg border px-3 py-1 text-[11px] font-medium transition-colors"
            :class="weekFilter === null && sectionFilter === null ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300' : 'border-[var(--border)] text-[var(--text-faint)] hover:text-[var(--text-muted)]'"
            @click="clearFilters"
          >
            All Lessons
          </button>
          <button
            v-for="week in WEEKS.filter(w => LESSONS.some(l => l.week === w.number))"
            :key="week.number"
            class="shrink-0 rounded-lg border px-3 py-1 text-[11px] font-medium transition-colors"
            :class="weekFilter === week.number ? [week.border, week.bg, week.color] : 'border-[var(--border)] text-[var(--text-faint)] hover:text-[var(--text-muted)]'"
            @click="setWeekFilter(week.number === weekFilter ? null : week.number)"
          >
            {{ week.title }} — {{ week.theme }}
          </button>
          <button
            v-for="sec in customSections"
            :key="'sec:' + sec.name"
            class="shrink-0 rounded-lg border px-3 py-1 text-[11px] font-medium transition-colors"
            :class="sectionFilter === sec.name
              ? [getSectionColor(sec.name).border, getSectionColor(sec.name).bg, getSectionColor(sec.name).color]
              : 'border-[var(--border)] text-[var(--text-faint)] hover:text-[var(--text-muted)]'"
            @click="setSectionFilter(sectionFilter === sec.name ? null : sec.name)"
          >
            {{ sec.name }}
          </button>
        </div>

        <!-- Weeks + Lessons -->
        <div class="space-y-6">
          <!-- Built-in weeks (only shown when they contain lessons) -->
          <template v-for="week in WEEKS" :key="week.number">
            <div v-if="sectionFilter === null && (weekFilter === null || weekFilter === week.number) && LESSONS.some(l => l.week === week.number)" class="space-y-3">
              <!-- Week header -->
              <div class="flex items-center gap-2.5">
                <div class="h-px flex-1 bg-[var(--border)]" />
                <div class="flex items-center gap-2 rounded-full border px-3 py-1" :class="[week.border, week.bg]">
                  <span class="text-[10px] font-bold uppercase tracking-widest" :class="week.color">{{ week.title }}</span>
                  <span class="text-[10px] text-[var(--text-faint)]">·</span>
                  <span class="text-[10px] text-[var(--text-muted)]">{{ week.theme }}</span>
                </div>
                <div class="h-px flex-1 bg-[var(--border)]" />
              </div>

              <!-- Lesson cards grid -->
              <div class="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <div
                  v-for="lesson in LESSONS.filter(l => l.week === week.number)"
                  :key="lesson.id"
                  class="academy-lesson-card group relative flex flex-col gap-2 overflow-hidden rounded-xl border p-3.5 text-left transition-all"
                  :class="[
                    !isLessonUnlocked(lesson)
                      ? 'is-locked cursor-not-allowed opacity-55'
                      : academy.isCompleted(lesson.id)
                      ? 'is-complete cursor-pointer'
                      : lesson.id === academy.lastVisitedLessonId && !academy.isCompleted(lesson.id)
                        ? 'is-current cursor-pointer'
                        : 'is-open cursor-pointer',
                  ]"
                  :style="lessonCardTheme(lesson)"
                  role="button"
                  tabindex="0"
                  @click="handleLessonCardClick($event, lesson)"
                  @keydown.enter.prevent="openLesson(lesson)"
                  @keydown.space.prevent="openLesson(lesson)"
                >
                  <div class="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(var(--lesson-shine),0.9),transparent)] opacity-70" />
                  <div class="pointer-events-none absolute -right-8 -top-8 size-20 rounded-full bg-[rgba(var(--lesson-glow),0.16)] blur-2xl transition-opacity group-hover:opacity-100" />

                  <!-- Lesson number + status -->
                  <div class="relative flex items-center justify-between">
                    <span class="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest" :class="weekForLesson(lesson).color">
                      {{ lessonLabel(lesson) }}
                    </span>
                    <CheckCircle2 v-if="academy.isCompleted(lesson.id)" class="size-3.5 text-emerald-400" />
                    <Lock v-else-if="!isLessonUnlocked(lesson)" class="size-3.5 text-[var(--text-faint)]" />
                    <div
                      v-else-if="lesson.id === academy.lastVisitedLessonId"
                      class="size-1.5 rounded-full"
                      :class="isIntroLesson(lesson) ? 'bg-teal-400' : 'bg-indigo-400'"
                    />
                    <Circle v-else class="size-3 text-[var(--border)]" />
                  </div>

                  <!-- Title -->
                  <p class="relative min-h-8 text-sm font-semibold leading-snug text-[var(--text)] transition-colors group-hover:text-white">
                    {{ lesson.title }}
                  </p>

                  <!-- Duration -->
                  <div class="relative flex flex-wrap items-center gap-1.5 text-[10px] text-[var(--text-faint)]">
                    <span class="flex items-center gap-1 rounded-full border border-white/10 bg-black/10 px-2 py-0.5">
                      <Clock class="size-2.5 shrink-0" />
                      {{ lesson.duration }}
                    </span>
                    <span
                      v-if="!academy.isCompleted(lesson.id)"
                      class="rounded-full border border-indigo-500/20 bg-indigo-500/[0.08] px-2 py-0.5 font-medium text-indigo-200/80"
                    >
                      Professor-gated
                    </span>
                  </div>

                  <div class="relative mt-auto flex min-h-4 items-center pr-8">
                    <span
                      v-if="tts.cachedLessonIds.value.has(lesson.id)"
                      class="flex items-center gap-1 text-[9px] text-teal-400/80"
                    >
                      <Volume2 class="size-2.5" />
                      Narration ready
                    </span>
                    <span
                      v-else-if="tts.generatingLessonIds.value.has(lesson.id)"
                      class="flex items-center gap-1 text-[9px] text-teal-400/70"
                    >
                      <Loader2 class="size-2.5 animate-spin" />
                      {{ tts.progressByLessonId.value[lesson.id] || 'Creating...' }}
                    </span>
                  </div>

                  <button
                    class="absolute bottom-2 right-2 grid size-6 place-items-center rounded-md text-[var(--text-faint)] transition-colors hover:bg-white/[0.07] hover:text-[var(--text)]"
                    title="Lesson actions"
                    @click.stop="toggleLessonActions(lesson)"
                  >
                    <MoreHorizontal class="size-3.5" />
                  </button>

                  <div
                    v-if="lessonActionMenuId === lesson.id"
                    class="lesson-action-menu absolute bottom-9 right-2 z-20 w-44 overflow-hidden rounded-lg border border-[var(--border)] bg-[#111114]/95 py-1 shadow-2xl shadow-black/40 backdrop-blur-md"
                    @click.stop
                  >
                    <button
                      class="flex w-full items-center gap-2 px-2.5 py-2 text-left text-[11px] text-[var(--text-muted)] transition-colors hover:bg-white/[0.06] hover:text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-50"
                      :disabled="tts.generatingLessonIds.value.has(lesson.id)"
                      @click="openCreateTTSModal(lesson)"
                    >
                      <Mic class="size-3.5 text-teal-300" />
                      <span>{{ tts.cachedLessonIds.value.has(lesson.id) ? 'Regenerate audio' : 'Generate audio' }}</span>
                    </button>
                    <button
                      v-if="tts.cachedLessonIds.value.has(lesson.id)"
                      class="flex w-full items-center gap-2 px-2.5 py-2 text-left text-[11px] text-[var(--text-muted)] transition-colors hover:bg-white/[0.06] hover:text-[var(--text)]"
                      @click="clearLessonAudio(lesson)"
                    >
                      <RotateCcw class="size-3.5 text-amber-300" />
                      <span>Clear audio</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- Custom sections from .va files -->
          <template v-for="sec in customSections" :key="'sec:' + sec.name">
            <div v-if="weekFilter === null && (sectionFilter === null || sectionFilter === sec.name)" class="space-y-3">
              <div class="flex items-center gap-2.5">
                <div class="h-px flex-1 bg-[var(--border)]" />
                <div class="flex items-center gap-2 rounded-full border px-3 py-1" :class="[getSectionColor(sec.name).border, getSectionColor(sec.name).bg]">
                  <span class="text-[10px] font-bold uppercase tracking-widest" :class="getSectionColor(sec.name).color">{{ sec.name }}</span>
                </div>
                <div class="h-px flex-1 bg-[var(--border)]" />
              </div>
              <div class="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <div
                  v-for="lesson in sec.lessons"
                  :key="lesson.id"
                  class="academy-lesson-card group relative flex flex-col gap-2 overflow-hidden rounded-xl border p-3.5 text-left transition-all"
                  :class="[
                    !isLessonUnlocked(lesson)
                      ? 'is-locked cursor-not-allowed opacity-55'
                      : academy.isCompleted(lesson.id)
                      ? 'is-complete cursor-pointer'
                      : lesson.id === academy.lastVisitedLessonId && !academy.isCompleted(lesson.id)
                      ? 'is-active cursor-pointer'
                      : 'cursor-pointer',
                  ]"
                  :style="lessonCardTheme(lesson)"
                  @click="handleLessonCardClick($event, lesson)"
                >
                  <div class="flex items-start justify-between gap-2">
                    <span class="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest" :class="getSectionColor(lesson.section).color">
                      {{ lessonLabel(lesson) }}
                    </span>
                    <Lock v-if="!isLessonUnlocked(lesson)" class="size-3 shrink-0 text-[var(--text-faint)]" />
                    <CheckCircle2 v-else-if="academy.isCompleted(lesson.id)" class="size-3 shrink-0 text-emerald-400" />
                  </div>
                  <div>
                    <p class="text-[11px] font-semibold leading-tight text-[var(--text)]">{{ lesson.title }}</p>
                    <p v-if="lesson.subtitle" class="text-[10px] leading-snug text-[var(--text-faint)] mt-0.5 line-clamp-2">{{ lesson.subtitle }}</p>
                    <div class="mt-1 flex items-center gap-1.5 text-[10px] text-[var(--text-faint)]">
                      <Clock class="size-2.5" />
                      <span>{{ lesson.duration }}</span>
                    </div>
                  </div>
                  <div class="relative mt-auto flex min-h-4 items-center pr-8">
                    <span v-if="tts.cachedLessonIds.value.has(lesson.id)" class="flex items-center gap-1 text-[9px] text-amber-400/80">
                      <Volume2 class="size-2.5" /> Custom audio
                    </span>
                    <span v-else-if="lesson.embeddedAudio" class="flex items-center gap-1 text-[9px] text-teal-400/80">
                      <Volume2 class="size-2.5" /> Built-in audio
                    </span>
                    <span v-else-if="tts.generatingLessonIds.value.has(lesson.id)" class="flex items-center gap-1 text-[9px] text-teal-400/70">
                      <Loader2 class="size-2.5 animate-spin" />
                      {{ tts.progressByLessonId.value[lesson.id] || 'Creating...' }}
                    </span>
                  </div>

                  <button
                    class="absolute bottom-2 right-2 grid size-6 place-items-center rounded-md text-[var(--text-faint)] transition-colors hover:bg-white/[0.07] hover:text-[var(--text)]"
                    title="Lesson actions"
                    @click.stop="toggleLessonActions(lesson)"
                  >
                    <MoreHorizontal class="size-3.5" />
                  </button>

                  <div
                    v-if="lessonActionMenuId === lesson.id"
                    class="lesson-action-menu absolute bottom-9 right-2 z-20 w-44 overflow-hidden rounded-lg border border-[var(--border)] bg-[#111114]/95 py-1 shadow-2xl shadow-black/40 backdrop-blur-md"
                    @click.stop
                  >
                    <button
                      class="flex w-full items-center gap-2 px-2.5 py-2 text-left text-[11px] text-[var(--text-muted)] transition-colors hover:bg-white/[0.06] hover:text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-50"
                      :disabled="tts.generatingLessonIds.value.has(lesson.id)"
                      @click="openCreateTTSModal(lesson)"
                    >
                      <Mic class="size-3.5 text-teal-300" />
                      <span>{{ tts.cachedLessonIds.value.has(lesson.id) ? 'Regenerate audio' : 'Generate audio' }}</span>
                    </button>
                    <button
                      v-if="tts.cachedLessonIds.value.has(lesson.id)"
                      class="flex w-full items-center gap-2 px-2.5 py-2 text-left text-[11px] text-[var(--text-muted)] transition-colors hover:bg-white/[0.06] hover:text-[var(--text)]"
                      @click="clearLessonAudio(lesson)"
                    >
                      <RotateCcw class="size-3.5 text-amber-300" />
                      <span>{{ lesson.embeddedAudio ? 'Revert to built-in' : 'Clear audio' }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </template>

    <!-- ── LESSON VIEW ────────────────────────────────────────────────────── -->
    <template v-else-if="view === 'lesson' && currentLesson">
      <!-- Header -->
      <div class="flex shrink-0 items-center gap-3 border-b border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2.5">
        <button
          class="flex items-center gap-1 text-[11px] text-[var(--text-faint)] transition-colors hover:text-[var(--text-muted)]"
          @click="requestLeaveLesson"
        >
          <ChevronLeft class="size-3.5" />
          Course
        </button>
        <div class="h-3 w-px bg-[var(--border)]" />
        <span
          class="text-[10px] font-bold uppercase tracking-widest"
          :class="weekForLesson(currentLesson).color"
        >
          {{ lessonLabel(currentLesson) }}
        </span>
        <h2 class="flex-1 truncate text-sm font-semibold text-[var(--text)]">{{ currentLesson.title }}</h2>
        <AcademyAudioPlayer
          v-if="currentAudioUrl"
          compact
          class="hidden shrink-0 lg:block"
          :src="currentAudioUrl"
          :lesson-title="currentLesson.title"
          @close="() => { if (currentAudioUrl) { URL.revokeObjectURL(currentAudioUrl); currentAudioUrl = null } }"
        />
        <!-- Whiteboard toggle -->
        <button
          v-if="whiteboardItems.length > 0 && academy.mode === 'ai-assisted'"
          class="flex shrink-0 items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-medium transition-colors"
          :class="showWhiteboard
            ? 'border-teal-500/30 bg-teal-500/10 text-teal-300'
            : 'border-[var(--border)] text-[var(--text-faint)] hover:border-teal-500/25 hover:text-teal-300'"
          title="Toggle whiteboard"
          @click="showWhiteboard = !showWhiteboard"
        >
          <ChartSpline class="size-3" />
          <span>Board</span>
          <span v-if="whiteboardItems.length" class="ml-0.5 text-teal-300/70">{{ whiteboardItems.length }}</span>
        </button>

        <!-- Completion status -->
        <div class="flex shrink-0 items-center gap-2">
          <span class="flex items-center gap-1 text-[10px] text-[var(--text-faint)]">
            <Clock class="size-3" />
            {{ currentLesson.duration }}
          </span>
          <CheckCircle2 v-if="academy.isCompleted(currentLesson.id)" class="size-4 text-emerald-400" />
          <span v-else class="rounded-lg border border-indigo-500/20 bg-indigo-500/[0.06] px-2.5 py-1 text-[11px] font-medium text-indigo-200/80">
            Professor-gated
          </span>
        </div>

        <!-- Prev / Next navigation -->
        <div class="flex items-center gap-1 shrink-0">
          <button
            :disabled="!prevLesson"
            class="flex size-7 items-center justify-center rounded border border-[var(--border)] text-[var(--text-faint)] transition-colors hover:bg-white/[0.05] hover:text-[var(--text)] disabled:opacity-30"
            title="Previous lesson"
            @click="goToLesson(prevLesson)"
          >
            <ChevronLeft class="size-3.5" />
          </button>
          <button
            :disabled="!nextLesson"
            class="flex size-7 items-center justify-center rounded border border-[var(--border)] text-[var(--text-faint)] transition-colors hover:bg-white/[0.05] hover:text-[var(--text)] disabled:opacity-30"
            title="Next lesson"
            @click="goToLesson(nextLesson)"
          >
            <ChevronRight class="size-3.5" />
          </button>
        </div>
      </div>

      <Transition
        enter-active-class="transition-all duration-200 ease-out overflow-hidden"
        enter-from-class="opacity-0 -translate-y-2 max-h-0"
        enter-to-class="opacity-100 translate-y-0 max-h-24"
        leave-active-class="transition-all duration-150 ease-in overflow-hidden"
        leave-from-class="opacity-100 translate-y-0 max-h-24"
        leave-to-class="opacity-0 -translate-y-2 max-h-0"
      >
        <div
          v-if="showMaximizeLessonWarning"
          class="flex shrink-0 items-center gap-3 border-b border-amber-500/20 bg-amber-500/[0.08] px-4 py-2.5"
        >
          <AlertTriangle class="size-4 shrink-0 text-amber-300" />
          <p class="min-w-0 flex-1 text-[11px] leading-relaxed text-amber-100/90">
            Lessons work best in a maximized window so the lesson, professor, whiteboard, and terminal all have room.
          </p>
          <button
            class="shrink-0 rounded-lg border border-amber-400/20 px-2.5 py-1 text-[10px] font-medium text-amber-100 transition-colors hover:bg-amber-400/10"
            @click="dismissMaximizeLessonWarning"
          >
            Dismiss
          </button>
        </div>
      </Transition>

      <!-- Content area: split when AI mode -->
      <div class="relative flex flex-1 overflow-hidden" :class="(isResizing || isResizingTerminal) ? 'select-none' : ''">
        <!-- Lesson content wrapper (relative so whiteboard can overlay it) -->
        <div class="relative flex-1 overflow-hidden">
        <div
          ref="lessonContentEl"
          class="h-full overflow-y-auto p-6 custom-scroll"
          :class="academy.mode !== 'ai-assisted' ? 'mx-auto max-w-3xl' : ''"
        >
          <!-- Objectives -->
          <div
            class="mb-6 rounded-xl border p-4"
            :class="isIntroLesson(currentLesson)
              ? 'border-teal-500/20 bg-teal-500/[0.04]'
              : 'border-[var(--border)] bg-[var(--bg-card)]'"
          >
            <p class="mb-2 text-[10px] font-semibold uppercase tracking-widest" :class="isIntroLesson(currentLesson) ? 'text-teal-400/70' : 'text-[var(--text-faint)]'">
              {{ isIntroLesson(currentLesson) ? 'Orientation Goals' : "Today's Objectives" }}
            </p>
            <ul class="space-y-1.5">
              <li
                v-for="obj in currentLesson.objectives"
                :key="obj"
                class="flex items-start gap-2 text-xs text-[var(--text-muted)]"
              >
                <Target class="mt-0.5 size-3 shrink-0" :class="isIntroLesson(currentLesson) ? 'text-teal-400' : 'text-indigo-400'" />
                {{ obj }}
              </li>
            </ul>
          </div>

          <!-- Main content -->
          <div class="prose-lesson" v-html="renderMarkdown(currentLesson.content)" />

          <!-- Lab hint -->
          <div v-if="currentLesson.labHint" class="mt-8 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-4">
            <p class="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-amber-400">
              {{ isIntroLesson(currentLesson) ? 'Try It Out' : 'Lab Exercise' }}
            </p>
            <p class="text-xs leading-relaxed text-[var(--text-muted)]">{{ currentLesson.labHint }}</p>
          </div>

          <!-- Bottom nav -->
          <div class="mt-8 flex items-center justify-between border-t border-[var(--border)] pt-5">
            <button
              v-if="prevLesson"
              class="flex items-center gap-2 text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
              @click="goToLesson(prevLesson)"
            >
              <ChevronLeft class="size-3.5" />
              <span>{{ lessonLabel(prevLesson) }}: {{ prevLesson.title }}</span>
            </button>
            <div v-else />
            <button
              v-if="nextLesson"
              class="flex items-center gap-2 text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
              @click="goToLesson(nextLesson)"
            >
              <span>{{ lessonLabel(nextLesson) }}: {{ nextLesson.title }}</span>
              <ChevronRight class="size-3.5" />
            </button>
          </div>
        </div>

          <button
            v-if="!showWhiteboard && whiteboardItems.length > 0 && academy.mode === 'ai-assisted'"
            class="absolute right-4 top-4 z-20 flex items-center gap-1.5 rounded-lg border border-teal-500/25 bg-[var(--bg-surface)] px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-teal-300 shadow-lg shadow-black/30 transition-colors hover:border-teal-400/45 hover:bg-teal-500/10"
            title="Open whiteboard"
            @click="showWhiteboard = true"
          >
            <PanelTopOpen class="size-3" />
            Board
            <span v-if="whiteboardItems.length" class="text-teal-300/70">{{ whiteboardItems.length }}</span>
          </button>

          <!-- Whiteboard overlay (absolute, top drawer over lesson content) -->
          <Transition
            enter-active-class="transition-all duration-300 ease-out"
            enter-from-class="opacity-0 -translate-y-full"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition-all duration-200 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-full"
          >
            <div
              v-if="showWhiteboard && academy.mode === 'ai-assisted'"
              class="absolute inset-0 z-30 flex flex-col overflow-visible shadow-2xl shadow-black/60"
            >
              <AcademyWhiteboard
                class="rounded-b-xl"
                :items="whiteboardItems"
                :selected-id="activeWhiteboardItemId"
                @close="showWhiteboard = false"
                @select="selectWhiteboardItem"
              />
            </div>
          </Transition>
        </div>

        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 translate-y-4"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 translate-y-4"
        >
          <div
            v-if="labTerminalVisible && academy.mode === 'ai-assisted'"
            class="absolute inset-x-0 bottom-0 z-50 border-t border-emerald-500/25 bg-[#050507] shadow-2xl shadow-black/70"
            :style="{ height: terminalDrawerHeight }"
          >
            <div
              class="group h-2 cursor-row-resize bg-emerald-500/10 transition-colors hover:bg-emerald-500/25"
              @mousedown="startTerminalResize"
            >
              <div class="mx-auto h-full w-20 rounded-full bg-emerald-400/30 transition-colors group-hover:bg-emerald-300/60" />
            </div>
            <AcademyWSLTerminal
              class="h-[calc(100%_-_0.5rem)] rounded-none border-x-0 border-b-0"
              :distro="wslAcademyDistro"
              :suggested-command="labSuggestedCommand"
              :expanded="terminalExpanded"
              @close="labTerminalVisible = false"
              @toggle-expand="toggleTerminalExpanded"
            />
          </div>
        </Transition>

        <!-- Resize handle + Chat panel (AI mode only) -->
        <template v-if="academy.mode === 'ai-assisted'">
          <!-- Drag handle -->
          <div
            class="group relative shrink-0 w-[5px] cursor-col-resize"
            @mousedown="startResize"
          >
            <div
              class="absolute inset-0 transition-colors"
              :class="isResizing ? 'bg-indigo-500/50' : 'bg-[var(--border)] group-hover:bg-indigo-500/35'"
            />
          </div>

          <!-- Chat panel -->
          <div
            class="shrink-0 flex flex-col overflow-hidden transition-[height] duration-200"
            :style="chatPanelStyle"
          >
            <AIProfessorChat
              :lesson="currentLesson"
              :lesson-completed="academy.isCompleted(currentLesson.id)"
              :terminal-visible="labTerminalVisible"
              :extra-context="professorExtraContext"
              @mark-complete="markComplete"
              @mermaid-diagram="onMermaidDiagram"
              @whiteboard-diagrams="syncWhiteboardDiagrams"
              @toggle-terminal="toggleLabTerminal"
              @open-terminal="openLabTerminal"
            />
          </div>
        </template>
      </div>
    </template>

    <!-- ── CERTIFICATE ─────────────────────────────────────────────────────── -->
    <template v-else-if="view === 'certificate'">
      <div class="flex h-full items-center justify-center overflow-y-auto p-8 custom-scroll">
        <div class="w-full max-w-5xl space-y-6">
          <div class="certificate-panel relative overflow-hidden rounded-3xl border border-amber-500/25 bg-[var(--bg-card)] p-8 text-center shadow-2xl shadow-black/30">
            <div class="pointer-events-none absolute inset-4 rounded-2xl border border-amber-300/20" />
            <div class="relative mx-auto grid size-20 place-items-center rounded-full border border-amber-500/30 bg-amber-500/15">
              <Award class="size-10 text-amber-300" />
            </div>
            <p class="relative mt-6 text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-300">Certificate of Completion</p>
            <h1 class="relative mt-3 font-display text-4xl font-bold text-[var(--text)]">Vindicta Security Academy</h1>
            <p class="relative mt-5 text-xs uppercase tracking-[0.18em] text-[var(--text-faint)]">Presented to</p>
            <p class="relative mt-2 font-display text-3xl font-bold text-white">{{ certificateName }}</p>
            <p class="relative mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-[var(--text-muted)]">
              For completing the full security engineering curriculum across foundations, application security, red team practice, defensive operations, secure review, and incident response.
            </p>

            <div class="relative mt-8 grid gap-3 md:grid-cols-3">
              <div class="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-4">
                <p class="text-2xl font-bold text-[var(--text)]">{{ TOTAL_DAYS }}</p>
                <p class="text-[10px] uppercase tracking-widest text-[var(--text-faint)]">Lessons completed</p>
              </div>
              <div class="rounded-xl border border-teal-500/20 bg-teal-500/[0.06] p-4">
                <p class="text-2xl font-bold text-[var(--text)]">100%</p>
                <p class="text-[10px] uppercase tracking-widest text-[var(--text-faint)]">Professor approved</p>
              </div>
              <div class="rounded-xl border border-indigo-500/20 bg-indigo-500/[0.06] p-4">
                <p class="truncate text-sm font-bold text-[var(--text)]">{{ certificateId }}</p>
                <p class="text-[10px] uppercase tracking-widest text-[var(--text-faint)]">Credential ID</p>
              </div>
            </div>

            <div class="relative mt-6 flex flex-wrap justify-center gap-2">
              <span
                v-for="skill in certificateSkills"
                :key="skill"
                class="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-[var(--text-muted)]"
              >
                {{ skill }}
              </span>
            </div>

            <div class="relative mt-8 border-t border-white/10 pt-5">
              <p class="text-xs text-[var(--text-faint)]">Issued on</p>
              <p class="mt-1 text-sm font-semibold text-[var(--text)]">{{ certDate }}</p>
            </div>
          </div>

          <div class="flex justify-center gap-3">
            <button
              class="flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-200 transition-colors hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="downloadingCertificate"
              @click="downloadCertificatePdf"
            >
              <Loader2 v-if="downloadingCertificate" class="size-4 animate-spin" />
              <Download v-else class="size-4" />
              Download PDF
            </button>
            <button
              class="flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--text-muted)] transition-colors hover:bg-white/[0.04] hover:text-[var(--text)]"
              @click="view = 'course'"
            >
              <GraduationCap class="size-4" />
              Review Course
            </button>
            <button
              class="flex items-center gap-2 rounded-xl border border-red-500/20 px-4 py-2.5 text-sm text-[var(--text-muted)] transition-colors hover:bg-red-500/[0.05] hover:text-red-300"
              @click="resetAcademy"
            >
              <RotateCcw class="size-4" />
              Start Over
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- ── CREATE TTS MODAL ───────────────────────────────────────────────── -->
    <GlassModal v-model="showCompletionModal" title="Academy Complete" max-width="lg">
      <div class="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-[var(--bg-card)] p-6 text-center">
        <div class="celebration-burst pointer-events-none absolute inset-0" />
        <div class="pointer-events-none absolute inset-0 overflow-hidden">
          <span v-for="i in 24" :key="i" class="confetti-piece" :style="confettiStyle(i)" />
        </div>

        <div class="relative mx-auto grid size-20 place-items-center rounded-full border border-amber-400/30 bg-amber-500/15 shadow-[0_0_40px_rgba(251,191,36,0.22)]">
          <PartyPopper class="size-10 text-amber-300" />
        </div>
        <p class="relative mt-5 text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-200/80">Congratulations</p>
        <h2 class="relative mt-2 font-display text-3xl font-bold text-[var(--text)]">You completed Vindicta Academy.</h2>
        <p class="relative mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[var(--text-muted)]">
          Every lesson is complete and your certificate is ready. Nicely done, {{ certificateName }}.
        </p>

        <div class="relative mt-6 grid gap-3 sm:grid-cols-3">
          <div class="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3">
            <p class="text-xl font-bold text-[var(--text)]">{{ TOTAL_DAYS }}</p>
            <p class="text-[10px] uppercase tracking-widest text-[var(--text-faint)]">Lessons</p>
          </div>
          <div class="rounded-xl border border-teal-500/20 bg-teal-500/[0.06] p-3">
            <p class="text-xl font-bold text-[var(--text)]">100%</p>
            <p class="text-[10px] uppercase tracking-widest text-[var(--text-faint)]">Approved</p>
          </div>
          <div class="rounded-xl border border-indigo-500/20 bg-indigo-500/[0.06] p-3">
            <Sparkles class="mx-auto size-5 text-indigo-300" />
            <p class="mt-1 text-[10px] uppercase tracking-widest text-[var(--text-faint)]">Certificate</p>
          </div>
        </div>

        <div class="relative mt-6 flex flex-wrap justify-center gap-2">
          <button
            class="inline-flex items-center gap-2 rounded-xl bg-indigo-600/85 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-600"
            @click="showCertificate"
          >
            <Award class="size-4" />
            View Certificate
          </button>
          <button
            class="inline-flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-200 transition-colors hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="downloadingCertificate"
            @click="downloadCertificatePdf"
          >
            <Loader2 v-if="downloadingCertificate" class="size-4 animate-spin" />
            <Download v-else class="size-4" />
            Download PDF
          </button>
        </div>
      </div>
    </GlassModal>

    <GlassModal v-model="showLeaveLessonModal" title="Leave Lesson?" max-width="sm">
      <div class="space-y-4 p-1">
        <div class="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-3 py-3">
          <div class="grid size-8 shrink-0 place-items-center rounded-lg border border-amber-500/25 bg-amber-500/10">
            <AlertTriangle class="size-4 text-amber-300" />
          </div>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-[var(--text)]">You are leaving the lesson.</p>
            <p class="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
              Your progress and chat history are saved, but the lesson view will close and you will return to the course list.
            </p>
          </div>
        </div>

        <div class="flex gap-2 pt-1">
          <GlassButton class="flex-1" variant="ghost" @click="showLeaveLessonModal = false">
            Stay in Lesson
          </GlassButton>
          <GlassButton class="flex-1" @click="confirmLeaveLesson">
            Leave Lesson
          </GlassButton>
        </div>
      </div>
    </GlassModal>

    <!-- ── BULK TTS MODAL ───────────────────────────────────────────────── -->
    <GlassModal v-model="showBulkTTSModal" title="Audio Narration" max-width="lg">
      <div class="space-y-4 p-1">
        <!-- Running progress bar -->
        <div v-if="bulkRunning" class="rounded-lg border border-teal-500/20 bg-teal-500/[0.06] p-3">
          <div class="flex items-center justify-between gap-2">
            <div class="flex min-w-0 items-center gap-2">
              <Loader2 class="size-3.5 shrink-0 animate-spin text-teal-300" />
              <p class="truncate text-xs text-teal-300">
                {{ bulkIdx + 1 }}/{{ bulkQueue.length }}
                <span v-if="bulkCurrentLesson"> — {{ tts.progressByLessonId.value[bulkCurrentLesson.id] || bulkCurrentLesson.title }}</span>
              </p>
            </div>
            <span class="shrink-0 text-[10px] text-teal-300/70">{{ tts.cachedLessonIds.value.size }} cached</span>
          </div>
          <div class="mt-2 h-1 rounded-full bg-white/[0.08]">
            <div
              class="h-1 rounded-full bg-teal-400 transition-all duration-500"
              :style="{ width: `${Math.round(((bulkIdx) / bulkQueue.length) * 100)}%` }"
            />
          </div>
        </div>

        <!-- Info notice (idle) -->
        <div v-else class="flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2.5">
          <Clock class="mt-0.5 size-3.5 shrink-0 text-amber-400" />
          <p class="text-[11px] leading-relaxed text-[var(--text-muted)]">
            First lesson may take 5–15 min while Kokoro loads into memory. Subsequent narrations generate faster. Audio is cached locally and persists across sessions.
          </p>
        </div>

        <!-- Model picker -->
        <div class="space-y-1.5">
          <p class="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-faint)]">Script generated by</p>
          <div class="grid grid-cols-2 gap-1.5">
            <button
              v-for="opt in ttsModelOptions"
              :key="opt.id"
              class="rounded-lg border px-2.5 py-2 text-xs transition-all"
              :class="[
                opt.id === 'core' ? 'col-span-2' : '',
                opt.disabled
                  ? 'cursor-not-allowed border-[var(--border)] text-[var(--text-faint)] opacity-50'
                  : bulkTTSModel === opt.id
                    ? 'border-teal-500/30 bg-teal-500/10 text-teal-200'
                    : 'border-[var(--border)] text-[var(--text-faint)] hover:border-teal-500/20 hover:text-[var(--text-muted)]',
              ]"
              :disabled="bulkRunning || opt.disabled"
              @click="!opt.disabled && (bulkTTSModel = opt.id)"
            >
              {{ opt.label }}
              <span v-if="opt.soon" class="ml-1 rounded-full border border-rose-500/25 bg-rose-500/10 px-1 py-0.5 text-[8px] font-semibold text-rose-300">Soon</span>
            </button>
          </div>
        </div>

        <!-- Lesson list header -->
        <div class="flex items-center justify-between">
          <p class="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-faint)]">
            Lessons — <span class="text-teal-300">{{ bulkQueue.length }} selected</span>
          </p>
          <div class="flex items-center gap-3">
            <button
              class="text-[10px] text-[var(--text-faint)] transition-colors hover:text-[var(--text-muted)]"
              :disabled="bulkRunning"
              @click="bulkQueue = []"
            >
              Clear
            </button>
            <button
              class="text-[10px] text-teal-400 transition-colors hover:text-teal-300"
              :disabled="bulkRunning"
              @click="bulkQueue = allLessons.filter(l => !tts.cachedLessonIds.value.has(l.id) && !tts.generatingLessonIds.value.has(l.id)).map(l => l.id)"
            >
              Select all uncached
            </button>
          </div>
        </div>

        <!-- Scrollable lesson list grouped by week -->
        <div class="max-h-64 space-y-3 overflow-y-auto custom-scroll">
          <template v-for="week in displayedWeeks" :key="week.number">
            <div class="space-y-0.5">
              <p class="mb-1 text-[10px] font-bold uppercase tracking-widest" :class="week.color">
                {{ week.title }} — {{ week.theme }}
              </p>
              <button
                v-for="lesson in allLessons.filter(l => l.week === week.number)"
                :key="lesson.id"
                class="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="bulkRunning || tts.generatingLessonIds.value.has(lesson.id)"
                @click="toggleBulkLesson(lesson.id)"
              >
                <div
                  class="flex size-3.5 shrink-0 items-center justify-center rounded border transition-all"
                  :class="bulkQueue.includes(lesson.id)
                    ? 'border-teal-500 bg-teal-500'
                    : 'border-white/20 bg-transparent'"
                >
                  <svg v-if="bulkQueue.includes(lesson.id)" class="size-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span class="min-w-0 flex-1 truncate text-[11px] text-[var(--text-muted)]">{{ lesson.title }}</span>
                <span v-if="tts.cachedLessonIds.value.has(lesson.id)" class="shrink-0 text-[9px] text-teal-400">ready</span>
                <span v-else-if="tts.generatingLessonIds.value.has(lesson.id)" class="flex shrink-0 items-center gap-1 text-[9px] text-teal-300/80">
                  <Loader2 class="size-2.5 animate-spin" />
                  {{ (tts.progressByLessonId.value[lesson.id] || '').slice(0, 16) || 'creating...' }}
                </span>
              </button>
            </div>
          </template>
        </div>

        <!-- Actions -->
        <div class="flex gap-2 border-t border-[var(--border)] pt-3">
          <template v-if="!bulkRunning">
            <GlassButton
              class="flex-1"
              :disabled="bulkQueue.length === 0"
              @click="startBulkTTS"
            >
              <Headphones class="size-3.5" />
              Generate ({{ bulkQueue.length }})
            </GlassButton>
            <GlassButton variant="ghost" @click="showBulkTTSModal = false">Cancel</GlassButton>
          </template>
          <template v-else>
            <GlassButton class="flex-1" variant="ghost" @click="stopBulkTTS">
              Stop Queue
            </GlassButton>
            <GlassButton variant="ghost" @click="showBulkTTSModal = false">
              Close (keep running)
            </GlassButton>
          </template>
        </div>
      </div>
    </GlassModal>

    <!-- ── TTS SUGGESTION MODAL ──────────────────────────────────────────── -->
    <GlassModal v-model="showTTSSuggestionModal" title="Enhance Your Learning" max-width="sm">
      <div class="space-y-4 p-1">
        <div class="flex items-start gap-3">
          <div class="grid size-10 shrink-0 place-items-center rounded-xl border border-teal-500/20 bg-teal-500/10">
            <Headphones class="size-5 text-teal-300" />
          </div>
          <div>
            <p class="text-sm font-semibold text-[var(--text)]">Listen while you learn</p>
            <p class="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
              Generate spoken audio narrations for your lessons using Kokoro TTS. Each lesson gets a calm, educational summary you can listen to while studying.
            </p>
          </div>
        </div>

        <div class="flex flex-col gap-2 pt-1">
          <GlassButton
            class="w-full"
            @click="showTTSSuggestionModal = false; openBulkTTSModal()"
          >
            <Headphones class="size-3.5" />
            Generate Audio Narrations
          </GlassButton>
          <div class="flex gap-2">
            <GlassButton class="flex-1" variant="ghost" @click="dismissTTSSuggestion(false)">
              Maybe Later
            </GlassButton>
            <GlassButton class="flex-1" variant="ghost" @click="dismissTTSSuggestion(true)">
              Don't Show Again
            </GlassButton>
          </div>
        </div>
      </div>
    </GlassModal>

    <GlassModal v-model="showTTSModal" title="Create Narration" max-width="sm">
      <div class="space-y-4 p-1">
        <!-- Timing notice -->
        <div class="flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2.5">
          <Clock class="mt-0.5 size-3.5 shrink-0 text-amber-400" />
          <div class="space-y-1 text-[11px] leading-relaxed text-[var(--text-muted)]">
            <p>
              <strong class="text-[var(--text)]">First time:</strong> Kokoro TTS model must load into memory - this can take 5-15 minutes. Subsequent narrations generate faster.
            </p>
            <p>You can start audio for multiple lessons, including locked lessons. Vindicta tracks them separately and safely queues the shared speech engine.</p>
          </div>
        </div>

        <!-- Lesson name -->
        <div v-if="ttsModalLesson" class="rounded-lg border border-[var(--border)] bg-white/[0.03] px-3 py-2">
          <p class="text-[9px] font-semibold uppercase tracking-widest text-[var(--text-faint)]">Lesson</p>
          <p class="mt-0.5 text-xs font-semibold text-[var(--text)]">{{ ttsModalLesson.title }}</p>
        </div>

        <!-- AI model picker for script generation -->
        <div class="space-y-2">
          <p class="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-faint)]">Script generated by</p>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="opt in ttsModelOptions"
              :key="opt.id"
              class="rounded-xl border p-2.5 text-left transition-all"
              :class="[
                opt.id === 'core' ? 'col-span-2' : '',
                opt.disabled
                  ? 'cursor-not-allowed border-[var(--border)] opacity-50'
                  : ttsModalModel === opt.id
                    ? 'border-teal-500/30 bg-teal-500/10'
                    : 'border-[var(--border)] hover:border-teal-500/20 hover:bg-white/[0.02]',
              ]"
              :disabled="opt.disabled"
              @click="!opt.disabled && (ttsModalModel = opt.id)"
            >
              <div class="flex items-center gap-1.5">
                <p class="text-xs font-semibold text-[var(--text)]">{{ opt.label }}</p>
                <span v-if="opt.soon" class="rounded-full border border-rose-500/25 bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-rose-300">Soon</span>
              </div>
              <p class="mt-0.5 text-[10px] text-[var(--text-faint)]">{{ opt.description }}</p>
            </button>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-2 pt-1">
          <GlassButton class="flex-1" @click="confirmCreateTTS">
            <Mic class="size-3.5" />
            Generate Narration
          </GlassButton>
          <GlassButton variant="ghost" @click="showTTSModal = false">
            Cancel
          </GlassButton>
        </div>
      </div>
    </GlassModal>
  </div>
</template>

<style scoped>
.academy-page {
  -webkit-user-select: none;
  user-select: none;
}

.academy-page :deep(input),
.academy-page :deep(textarea),
.academy-page :deep([contenteditable='true']) {
  -webkit-user-select: text;
  user-select: text;
}

.academy-lesson-card {
  border-color: rgba(var(--lesson-accent), 0.22);
  background:
    radial-gradient(circle at 85% 12%, rgba(var(--lesson-glow), 0.16), transparent 34%),
    linear-gradient(135deg, rgba(var(--lesson-wash), 0.10), rgba(255,255,255,0.018) 42%, rgba(0,0,0,0.10));
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
}

.academy-lesson-card::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  border-radius: inherit;
  background: linear-gradient(120deg, transparent 10%, rgba(var(--lesson-shine), 0.5) 30%, rgba(var(--lesson-shine), 0.3) 55%, transparent 75%);
  opacity: 0;
  transform: translateX(-60%);
  transition: opacity 180ms ease, transform 550ms ease;
  pointer-events: none;
}

.academy-lesson-card::after {
  content: '';
  position: absolute;
  inset: 1px;
  z-index: 0;
  border-radius: calc(0.75rem - 1px);
  background: rgba(10,10,14,0.72);
  pointer-events: none;
}

.academy-lesson-card > * {
  z-index: 2;
}

.academy-lesson-card .lesson-action-menu {
  z-index: 30;
}

.academy-lesson-card.is-open:hover,
.academy-lesson-card.is-current {
  border-color: rgba(var(--lesson-accent), 0.52);
  box-shadow:
    0 16px 34px rgba(0,0,0,0.22),
    0 0 0 1px rgba(var(--lesson-accent), 0.08),
    0 0 28px rgba(var(--lesson-glow), 0.16);
  transform: translateY(-1px);
}

.academy-lesson-card.is-open:hover::before,
.academy-lesson-card.is-current::before {
  opacity: 0.8;
  transform: translateX(60%);
}

.academy-lesson-card.is-current {
  animation: academy-card-pulse 3.6s ease-in-out infinite;
}

.academy-lesson-card.is-complete {
  border-color: rgba(52, 211, 153, 0.34);
  background:
    radial-gradient(circle at 85% 12%, rgba(52, 211, 153, 0.16), transparent 34%),
    linear-gradient(135deg, rgba(16, 185, 129, 0.11), rgba(255,255,255,0.018) 42%, rgba(0,0,0,0.10));
}

.academy-lesson-card.is-locked {
  border-color: rgba(255,255,255,0.08);
  background: linear-gradient(135deg, rgba(255,255,255,0.035), rgba(255,255,255,0.012));
}

@keyframes academy-card-pulse {
  0%, 100% {
    box-shadow:
      0 16px 34px rgba(0,0,0,0.22),
      0 0 0 1px rgba(var(--lesson-accent), 0.08),
      0 0 18px rgba(var(--lesson-glow), 0.11);
  }
  50% {
    box-shadow:
      0 16px 34px rgba(0,0,0,0.22),
      0 0 0 1px rgba(var(--lesson-accent), 0.16),
      0 0 34px rgba(var(--lesson-glow), 0.22);
  }
}

.academy-roadmap-hero {
  position: relative;
  isolation: isolate;
}

.academy-roadmap-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    linear-gradient(120deg, rgba(45,212,191,0.12), transparent 36%),
    radial-gradient(circle at 88% 18%, rgba(129,140,248,0.18), transparent 32%),
    radial-gradient(circle at 24% 90%, rgba(196,181,253,0.10), transparent 28%);
}

.certificate-panel {
  isolation: isolate;
}

.certificate-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(circle at 50% 0%, rgba(251,191,36,0.18), transparent 32%),
    linear-gradient(135deg, rgba(20,184,166,0.10), transparent 36%, rgba(99,102,241,0.12));
}

.celebration-burst {
  background:
    radial-gradient(circle at 18% 18%, rgba(45,212,191,0.26), transparent 22%),
    radial-gradient(circle at 82% 20%, rgba(251,191,36,0.24), transparent 24%),
    radial-gradient(circle at 50% 96%, rgba(129,140,248,0.24), transparent 30%);
  animation: celebration-glow 2.4s ease-in-out infinite;
}

.confetti-piece {
  position: absolute;
  top: -12px;
  left: calc(4% + var(--fall-x));
  width: 7px;
  height: 14px;
  border-radius: 2px;
  background: hsl(calc(var(--i) * 31deg), 88%, 66%);
  opacity: 0;
  transform: translateY(-20px) rotate(0deg);
  animation: confetti-fall 2.9s cubic-bezier(.21,.61,.35,1) infinite;
  animation-delay: calc(var(--i) * -0.11s);
}

.confetti-piece:nth-child(3n) {
  width: 10px;
  height: 10px;
  border-radius: 999px;
}

.confetti-piece:nth-child(4n) {
  width: 12px;
  height: 5px;
}

@keyframes celebration-glow {
  0%, 100% { opacity: 0.78; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.03); }
}

@keyframes confetti-fall {
  0% {
    opacity: 0;
    transform: translate3d(0, -24px, 0) rotate(0deg);
  }
  12% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate3d(calc((var(--i) - 12) * 7px), 430px, 0) rotate(calc(var(--i) * 54deg));
  }
}

.prose-lesson :deep(h1) {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text);
  margin-top: 0;
  margin-bottom: 1rem;
}
.prose-lesson :deep(h2) {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
  margin-top: 1.75rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.35rem;
  border-bottom: 1px solid var(--border);
}
.prose-lesson :deep(h3) {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text);
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
}
.prose-lesson :deep(p) {
  font-size: 0.8125rem;
  line-height: 1.75;
  color: var(--text-muted);
  margin-bottom: 0.75rem;
}
.prose-lesson :deep(ul),
.prose-lesson :deep(ol) {
  font-size: 0.8125rem;
  color: var(--text-muted);
  padding-left: 1.25rem;
  margin-bottom: 0.75rem;
  line-height: 1.75;
}
.prose-lesson :deep(ul) { list-style-type: disc; }
.prose-lesson :deep(ol) { list-style-type: decimal; }
.prose-lesson :deep(li) { margin-bottom: 0.25rem; }
.prose-lesson :deep(strong) { color: var(--text); font-weight: 600; }
.prose-lesson :deep(em) { font-style: italic; }
.prose-lesson :deep(.code-block) {
  background: rgba(0,0,0,0.3);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  padding: 1rem;
  font-family: 'Cascadia Code', 'Fira Code', ui-monospace, monospace;
  font-size: 0.75rem;
  line-height: 1.6;
  color: #c9d1d9;
  overflow-x: auto;
  margin: 1rem 0;
  white-space: pre;
}
.prose-lesson :deep(.inline-code) {
  background: rgba(255,255,255,0.07);
  border-radius: 3px;
  padding: 1px 5px;
  font-family: ui-monospace, monospace;
  font-size: 0.73rem;
  color: #c9d1d9;
}
.prose-lesson :deep(.lesson-table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.75rem;
  margin: 1rem 0;
}
.prose-lesson :deep(.lesson-table th) {
  background: rgba(255,255,255,0.04);
  padding: 0.5rem 0.75rem;
  text-align: left;
  font-weight: 600;
  color: var(--text);
  border-bottom: 1px solid var(--border);
}
.prose-lesson :deep(.lesson-table td) {
  padding: 0.4rem 0.75rem;
  color: var(--text-muted);
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
</style>
