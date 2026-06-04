import { defineStore } from 'pinia'
import { INTRO_LESSON_IDS, MAIN_LESSON_COUNT } from '~/data/curriculum'
import type { CustomLesson } from '~/data/curriculum'

export type AcademyMode = 'manual' | 'ai-assisted' | null
export type AcademyAIModel = 'claude' | 'codex' | 'openrouter' | 'ollama' | 'core' | null

export interface AcademyChatMessage {
  id: number
  role: 'professor' | 'student'
  text: string
  createdAt: string
  model: Exclude<AcademyAIModel, null>
  quiz?: AcademyChatQuiz | null
  isContinuation?: boolean
}

export interface AcademyChatQuiz {
  type: 'mc' | 'text' | 'number'
  question: string
  options?: { letter: string; text: string }[]
  answered?: boolean
  selectedAnswer?: string
  studentInput?: string
}

export interface LessonProgress {
  completedAt: string | null
  startedAt: string | null
  quizAttempts: number
  quizCorrect: number
  lastQuizAt: string | null
}

export interface QuizResult {
  correct: boolean
  questionType: 'mc' | 'text' | 'number'
}

export interface AcademyState {
  mode: AcademyMode
  aiModel: AcademyAIModel
  certificateName: string | null
  completedLessons: Record<string, LessonProgress>
  chatSessions: Record<string, AcademyChatMessage[]>
  certificateIssuedAt: string | null
  lastVisitedModuleId: string | null
  lastVisitedLessonId: string | null
  setupComplete: boolean
}

const STORE_FILE = 'vindicter-academy.bin'
const STORE_KEY = 'academy-state'

async function getAcademyStore() {
  const { Store } = await import('@tauri-apps/plugin-store')
  return Store.load(STORE_FILE)
}

export const useAcademyStore = defineStore('academy', () => {
  const mode = ref<AcademyMode>(null)
  const aiModel = ref<AcademyAIModel>(null)
  const certificateName = ref<string | null>(null)
  const completedLessons = ref<Record<string, LessonProgress>>({})
  const chatSessions = ref<Record<string, AcademyChatMessage[]>>({})
  const certificateIssuedAt = ref<string | null>(null)
  const lastVisitedModuleId = ref<string | null>(null)
  const lastVisitedLessonId = ref<string | null>(null)
  const setupComplete = ref(false)
  const customLessons = ref<CustomLesson[]>([])
  const customTotalLessons = ref(0)
  const _loaded = ref(false)

  // Only count main-course lessons (week > 0) toward progress.
  // Intro lessons (intro-1..intro-4) are orientation modules that don't affect the progress bar.
  const _introIds = new Set(INTRO_LESSON_IDS)
  // Falls back to MAIN_LESSON_COUNT when no .va lessons have been loaded yet,
  // so progress stays meaningful before the first course-bin load.
  const totalLessons = computed(() => customTotalLessons.value > 0 ? customTotalLessons.value : MAIN_LESSON_COUNT)
  const completedCount = computed(
    () => Object.entries(completedLessons.value)
      .filter(([id, l]) => !_introIds.has(id) && l.completedAt !== null)
      .length,
  )
  const allCompleted = computed(() => completedCount.value >= totalLessons.value)
  const progressPercent = computed(() => Math.round((completedCount.value / totalLessons.value) * 100))

  function isCompleted(lessonId: string) {
    return !!completedLessons.value[lessonId]?.completedAt
  }

  function isStarted(lessonId: string) {
    return !!completedLessons.value[lessonId]?.startedAt
  }

  function grantLessonCompletion(lessonId: string) {
    return completeLesson(lessonId)
  }

  async function _save() {
    try {
      const store = await getAcademyStore()
      await store.set(STORE_KEY, {
        mode: mode.value,
        aiModel: aiModel.value,
        certificateName: certificateName.value,
        completedLessons: completedLessons.value,
        chatSessions: chatSessions.value,
        certificateIssuedAt: certificateIssuedAt.value,
        lastVisitedModuleId: lastVisitedModuleId.value,
        lastVisitedLessonId: lastVisitedLessonId.value,
        setupComplete: setupComplete.value,
      } satisfies AcademyState)
      await store.save()
    }
    catch (e) {
      console.warn('[Academy] Save failed:', e)
    }
  }

  async function loadFromDisk() {
    if (_loaded.value) return
    try {
      const store = await getAcademyStore()
      const data = await store.get<AcademyState>(STORE_KEY)
      if (data) {
        mode.value = data.mode ?? null
        aiModel.value = data.aiModel ?? null
        certificateName.value = data.certificateName ?? null
        completedLessons.value = data.completedLessons ?? {}
        chatSessions.value = data.chatSessions ?? {}
        certificateIssuedAt.value = data.certificateIssuedAt ?? null
        lastVisitedModuleId.value = data.lastVisitedModuleId ?? null
        lastVisitedLessonId.value = data.lastVisitedLessonId ?? null
        setupComplete.value = data.setupComplete ?? false
      }
    }
    catch (e) {
      console.warn('[Academy] Load failed:', e)
    }
    finally {
      _loaded.value = true
    }
  }

  async function setSetup(m: Exclude<AcademyMode, null>, model: AcademyAIModel, name?: string | null) {
    mode.value = m
    aiModel.value = model
    if (name !== undefined) {
      certificateName.value = name?.trim() || null
    }
    setupComplete.value = true
    await _save()
  }

  async function resetSetup() {
    mode.value = null
    aiModel.value = null
    certificateName.value = null
    setupComplete.value = false
    completedLessons.value = {}
    chatSessions.value = {}
    certificateIssuedAt.value = null
    lastVisitedModuleId.value = null
    lastVisitedLessonId.value = null
    await _save()
  }

  async function resetProgress(keepSetup = true) {
    completedLessons.value = {}
    chatSessions.value = {}
    certificateIssuedAt.value = null
    lastVisitedModuleId.value = null
    lastVisitedLessonId.value = null
    if (!keepSetup) {
      mode.value = null
      aiModel.value = null
      certificateName.value = null
      setupComplete.value = false
    }
    await _save()
  }

  async function setCertificateName(name: string | null) {
    certificateName.value = name?.trim() || null
    await _save()
  }

  function getChatSession(lessonId: string) {
    return chatSessions.value[lessonId] ?? []
  }

  // Keep at most 80 messages per session (40 exchanges).
  // Always retain the first message (lesson initialization) and any message
  // with a quiz so the professor doesn't re-ask questions the student answered.
  function _pruneChatSession(messages: AcademyChatMessage[]): AcademyChatMessage[] {
    const MAX = 80
    if (messages.length <= MAX) return messages
    const first = messages[0]
    const rest = messages.slice(1)
    const quizMessages = rest.filter(m => m.quiz)
    const nonQuiz = rest.filter(m => !m.quiz)
    const keep = quizMessages.length + 1  // first + all quiz messages
    const spare = Math.max(0, MAX - keep)
    const tail = nonQuiz.slice(-spare)
    return first ? [first, ...quizMessages, ...tail] : [...quizMessages, ...tail]
  }

  async function setChatSession(lessonId: string, messages: AcademyChatMessage[]) {
    chatSessions.value = {
      ...chatSessions.value,
      [lessonId]: _pruneChatSession(messages),
    }
    await _save()
  }

  async function clearChatSession(lessonId: string) {
    const next = { ...chatSessions.value }
    delete next[lessonId]
    chatSessions.value = next
    await _save()
  }

  async function recordQuizAttempt(lessonId: string, result: QuizResult) {
    const existing = completedLessons.value[lessonId] ?? {
      completedAt: null,
      startedAt: new Date().toISOString(),
      quizAttempts: 0,
      quizCorrect: 0,
      lastQuizAt: null,
    }
    completedLessons.value = {
      ...completedLessons.value,
      [lessonId]: {
        ...existing,
        quizAttempts: (existing.quizAttempts ?? 0) + 1,
        quizCorrect: (existing.quizCorrect ?? 0) + (result.correct ? 1 : 0),
        lastQuizAt: new Date().toISOString(),
      },
    }
    await _save()
  }

  async function startLesson(lessonId: string) {
    if (!completedLessons.value[lessonId]) {
      completedLessons.value = {
        ...completedLessons.value,
        [lessonId]: { completedAt: null, startedAt: new Date().toISOString(), quizAttempts: 0, quizCorrect: 0, lastQuizAt: null },
      }
      await _save()
    }
  }

  async function completeLesson(lessonId: string) {
    const existing = completedLessons.value[lessonId]
    const nextProgress = {
      ...completedLessons.value,
      [lessonId]: {
        startedAt: existing?.startedAt ?? new Date().toISOString(),
        completedAt: new Date().toISOString(),
      },
    }
    completedLessons.value = nextProgress

    // Issue certificate when all lessons done
    const mainCompleted = Object.entries(nextProgress)
      .filter(([id, progress]) => !_introIds.has(id) && progress.completedAt !== null)
      .length
    if (mainCompleted >= totalLessons.value && !certificateIssuedAt.value) {
      certificateIssuedAt.value = new Date().toISOString()
    }
    await _save()
  }

  function setCustomLessons(lessons: CustomLesson[]) {
    customLessons.value = lessons
  }

  function setCustomTotalLessons(n: number) {
    customTotalLessons.value = n
  }

  async function setLastVisited(moduleId: string, lessonId: string) {
    lastVisitedModuleId.value = moduleId
    lastVisitedLessonId.value = lessonId
    await _save()
  }

  return {
    mode,
    aiModel,
    certificateName,
    completedLessons,
    chatSessions,
    certificateIssuedAt,
    lastVisitedModuleId,
    lastVisitedLessonId,
    setupComplete,
    completedCount,
    allCompleted,
    progressPercent,
    isCompleted,
    isStarted,
    grantLessonCompletion,
    loadFromDisk,
    setSetup,
    setCertificateName,
    resetSetup,
    resetProgress,
    startLesson,
    completeLesson,
    recordQuizAttempt,
    setLastVisited,
    getChatSession,
    setChatSession,
    clearChatSession,
    customLessons,
    setCustomLessons,
    totalLessons,
    setCustomTotalLessons,
  }
})
