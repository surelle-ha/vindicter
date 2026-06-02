// useAcademyTTS — Orchestrates AI narration script generation + Kokoro TTS synthesis + per-lesson audio cache.
//
// Flow:
//   1. User picks AI model (Claude / Codex / OpenRouter)
//   2. Chosen model generates a clean, spoken-word script from the lesson
//   3. Kokoro ONNX synthesises WAV audio for the script
//   4. Audio is stored in the Browser Cache API (persistent across sessions)
//
// Preferences are persisted to localStorage; audio metadata tracked separately.

import { runClaude } from '~/composables/useClaudeShell'
import { runCodexExec } from '~/composables/useCodexShell'
import { runOpenRouterChat } from '~/composables/useOpenRouterAI'
import { runOllamaChat } from '~/composables/useOllamaAI'
import { useKokoro } from '~/composables/useKokoro'
import type { Lesson } from '~/data/curriculum'

// ── Types ─────────────────────────────────────────────────────────────────────

export type TTSScriptModel = 'claude' | 'codex' | 'openrouter' | 'ollama' | 'core'

interface TTSPrefs {
  enabled: boolean
  voice: string
  speed: number
  scriptModel: TTSScriptModel
}

type CacheMeta = Record<string, { voice: string; generatedAt: string; charCount: number }>

// ── Constants ─────────────────────────────────────────────────────────────────

const PREFS_KEY       = 'vindicter:academy:tts:prefs'
const CACHE_META_KEY  = 'vindicter:academy:tts:cache'
const AUDIO_CACHE     = 'vindicter-academy-tts'
const KOKORO_CACHE    = 'transformers-cache'
const KOKORO_CONFIG_URL = 'https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/config.json'

function buildNarrationPrompt(title: string, content: string): string {
  return `Convert the following security lesson into a natural spoken narration for text-to-speech audio.
Rules:
- Write in a calm, educational teaching voice
- Remove ALL markdown (no #, **, \`, |)
- Replace code blocks: instead of reading code, say what it does in plain English
- Replace tables with brief verbal summaries
- Remove lab hints and exercises
- Keep it under 700 words
- No bullet points — use flowing sentences

Lesson title: ${title}
Content:
${content}

Output ONLY the narration text, nothing else.`
}

// ── Singleton module-level state ──────────────────────────────────────────────

const ttsEnabled            = ref(false)
const selectedVoice         = ref('af_heart')
const ttsSpeed              = ref(1.0)
const scriptModel           = ref<TTSScriptModel>('claude')

const cachedLessonIds       = ref<Set<string>>(new Set())
const progressByLessonId    = ref<Record<string, string>>({})
const ttsError              = ref('')

const generating = computed(() => Object.keys(progressByLessonId.value).length > 0)
const generatingLessonIds = computed(() => new Set(Object.keys(progressByLessonId.value)))
const generatingForLessonId = computed(() => Object.keys(progressByLessonId.value)[0] ?? null)
const progressMessage = computed(() => {
  const firstId = generatingForLessonId.value
  return firstId ? progressByLessonId.value[firstId] ?? '' : ''
})

let _prefsLoaded = false
let synthQueue: Promise<void> = Promise.resolve()

function setLessonProgress(lessonId: string, message: string) {
  progressByLessonId.value = { ...progressByLessonId.value, [lessonId]: message }
}

function clearLessonProgress(lessonId: string) {
  const next = { ...progressByLessonId.value }
  delete next[lessonId]
  progressByLessonId.value = next
}

// ── Preference persistence ────────────────────────────────────────────────────

function loadPrefs() {
  if (_prefsLoaded || typeof localStorage === 'undefined') return
  _prefsLoaded = true

  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (raw) {
      const p = JSON.parse(raw) as Partial<TTSPrefs>
      ttsEnabled.value    = p.enabled      ?? false
      selectedVoice.value = p.voice        ?? 'af_heart'
      ttsSpeed.value      = p.speed        ?? 1.0
      scriptModel.value   = (p.scriptModel as TTSScriptModel) ?? 'claude'
    }
  } catch { /* ignore */ }

  try {
    const raw = localStorage.getItem(CACHE_META_KEY)
    if (raw) {
      const meta = JSON.parse(raw) as CacheMeta
      cachedLessonIds.value = new Set(Object.keys(meta))
    }
  } catch { /* ignore */ }
}

function savePrefs() {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(PREFS_KEY, JSON.stringify({
    enabled:     ttsEnabled.value,
    voice:       selectedVoice.value,
    speed:       ttsSpeed.value,
    scriptModel: scriptModel.value,
  } satisfies TTSPrefs))
}

function updateCacheMeta(lessonId: string, info: { voice: string; charCount: number } | null) {
  if (typeof localStorage === 'undefined') return
  let meta: CacheMeta = {}
  try {
    const raw = localStorage.getItem(CACHE_META_KEY)
    if (raw) meta = JSON.parse(raw) as CacheMeta
  } catch { /* ignore */ }

  if (info === null) {
    delete meta[lessonId]
  } else {
    meta[lessonId] = { voice: info.voice, generatedAt: new Date().toISOString(), charCount: info.charCount }
  }
  localStorage.setItem(CACHE_META_KEY, JSON.stringify(meta))
  cachedLessonIds.value = new Set(Object.keys(meta))
}

// ── Kokoro readiness check ────────────────────────────────────────────────────

async function checkKokoroReady(): Promise<boolean> {
  if (typeof caches === 'undefined') return false
  try {
    const cache = await caches.open(KOKORO_CACHE)
    return !!(await cache.match(KOKORO_CONFIG_URL))
  } catch {
    return false
  }
}

// ── Script generation helpers ─────────────────────────────────────────────────

async function getDefaultProjectPath(): Promise<string> {
  try {
    const { homeDir } = await import('@tauri-apps/api/path')
    return await homeDir()
  } catch {
    return '/tmp'
  }
}

async function generateScriptViaClaude(prompt: string): Promise<string> {
  const projectPath = await getDefaultProjectPath()
  return new Promise<string>((resolve, reject) => {
    let collected = ''

    void runClaude({
      prompt,
      projectPath,
      onLine(line: string) {
        try {
          const parsed = JSON.parse(line) as Record<string, unknown>
          const type   = parsed?.type as string | undefined

          if (type === 'result') {
            const result = parsed.result
            if (typeof result === 'string' && result.trim()) collected = result
          }
          else if (type === 'assistant') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const content = (parsed as any)?.message?.content
            if (Array.isArray(content)) {
              for (const block of content) {
                if (block?.type === 'text' && typeof block.text === 'string') {
                  collected += block.text as string
                }
              }
            }
          }
          else if (type === 'text' && typeof parsed.text === 'string') {
            collected += parsed.text as string
          }
        } catch {
          if (line.trim() && !line.startsWith('{')) collected += line + '\n'
        }
      },
      onClose() {
        const result = collected.trim()
        if (result) resolve(result)
        else reject(new Error('Claude returned an empty narration script.'))
      },
      onError(err: string) {
        reject(new Error(err || 'Claude failed to generate the narration script.'))
      },
    })
  })
}

async function generateScriptViaCodex(prompt: string): Promise<string> {
  let projectPath: string
  try {
    const { tempDir } = await import('@tauri-apps/api/path')
    projectPath = await tempDir()
  } catch {
    projectPath = await getDefaultProjectPath()
  }

  const result = await runCodexExec({ prompt, projectPath, reasoningEffort: 'low', sandbox: 'read-only' })
  const text = (result.stdout || result.stderr || '').trim()
  if (!text) throw new Error('Codex returned an empty narration script.')
  return text
}

async function generateScriptViaOpenRouter(prompt: string): Promise<string> {
  const app = useAppStore()
  if (!app.openRouter.apiKey?.trim()) {
    throw new Error('OpenRouter API key is not configured. Add it in AI Models settings.')
  }
  return runOpenRouterChat({
    apiKey: app.openRouter.apiKey,
    model:  app.openRouter.model || 'openai/gpt-4.1-mini',
    messages: [{ role: 'user', content: prompt }],
  })
}

async function generateScript(lesson: Lesson, model: TTSScriptModel): Promise<string> {
  const app = useAppStore()
  const prompt = buildNarrationPrompt(lesson.title, lesson.content)
  switch (model) {
    case 'claude':      return generateScriptViaClaude(prompt)
    case 'codex':       return generateScriptViaCodex(prompt)
    case 'openrouter':  return generateScriptViaOpenRouter(prompt)
    case 'ollama':
      return runOllamaChat({
        url: app.ollama.url,
        model: app.ollama.model,
        messages: [{ role: 'user', content: prompt }],
      })
    case 'core':
      throw new Error('DefendCore is not yet available.')
    default:            throw new Error(`Unknown script model: ${model as string}`)
  }
}

// ── Audio cache management ────────────────────────────────────────────────────

async function saveAudioToCache(lessonId: string, buffer: ArrayBuffer): Promise<void> {
  const cache = await caches.open(AUDIO_CACHE)
  const blob  = new Blob([buffer], { type: 'audio/wav' })
  await cache.put(`lesson-audio-${lessonId}`, new Response(blob, { headers: { 'Content-Type': 'audio/wav' } }))
}

async function loadAudio(lessonId: string): Promise<string | null> {
  if (typeof caches === 'undefined') return null
  try {
    const cache = await caches.open(AUDIO_CACHE)
    const res   = await cache.match(`lesson-audio-${lessonId}`)
    if (!res) return null
    return URL.createObjectURL(await res.blob())
  } catch {
    return null
  }
}

async function clearAudio(lessonId: string): Promise<void> {
  if (typeof caches === 'undefined') return
  try {
    const cache = await caches.open(AUDIO_CACHE)
    await cache.delete(`lesson-audio-${lessonId}`)
  } catch { /* ignore */ }
  updateCacheMeta(lessonId, null)
}

// ── Main TTS creation flow ────────────────────────────────────────────────────

async function createTTS(lesson: Lesson, model: TTSScriptModel): Promise<void> {
  if (progressByLessonId.value[lesson.id]) return
  ttsError.value = ''
  setLessonProgress(lesson.id, 'Checking Kokoro model...')

  const kokoro = useKokoro()

  try {
    // 1 — Verify Kokoro model files are downloaded
    setLessonProgress(lesson.id, 'Checking Kokoro model...')
    if (!(await checkKokoroReady())) {
      throw new Error('Kokoro model files not found. Open AI Models and download Kokoro TTS first.')
    }

    // 2 — Generate a clean spoken-word narration script via the chosen AI model
    setLessonProgress(lesson.id, `Generating narration script via ${model}...`)
    const script = await generateScript(lesson, model)
    if (!script.trim()) throw new Error('Script generation returned empty text.')

    setLessonProgress(lesson.id, 'Waiting for TTS engine...')
    const synthJob = synthQueue.catch(() => {}).then(async () => {

    // 3 — Initialize Kokoro worker if not already running
    if (!kokoro.activeDevice.value && !kokoro.initializing.value) {
      setLessonProgress(lesson.id, 'Initializing Kokoro TTS...')
      await kokoro.init('auto')
    }

    // 4 — Wait for Kokoro model to finish loading.
    //     First-run deserialisation of the 82 MB ONNX file from cache can take 10–15 minutes
    //     on slower hardware, so we allow 20 minutes here.
    if (!kokoro.activeDevice.value) {
      setLessonProgress(lesson.id, 'Loading TTS model into memory...')
      const initDeadline = Date.now() + 1_200_000  // 20 min
      while (!kokoro.activeDevice.value && Date.now() < initDeadline) {
        if (kokoro.error.value) throw new Error(`Kokoro init error: ${kokoro.error.value}`)
        await new Promise(r => setTimeout(r, 500))
        if (kokoro.initStatus.value) setLessonProgress(lesson.id, kokoro.initStatus.value)
      }
      if (!kokoro.activeDevice.value) {
        throw new Error('Kokoro model took too long to load. Try restarting the app or re-downloading the model in AI Models.')
      }
    }

    // 5 — Synthesize speech
    // Clear any previous error so the post-loop checks are clean
    kokoro.error.value = ''
    setLessonProgress(lesson.id, 'Synthesizing audio...')
    kokoro.generate(script, selectedVoice.value, ttsSpeed.value)

    // 6 — Wait for synthesis.
    //     If GPU produces silent audio the worker re-initialises the WASM CPU model while
    //     `generating` stays true — that re-init can itself take 10–15 minutes.
    //     We therefore allow 30 minutes total for the synthesis phase.
    const synthDeadline = Date.now() + 1_800_000  // 30 min
    while (kokoro.generating.value && Date.now() < synthDeadline) {
      if (kokoro.error.value) throw new Error(`TTS error: ${kokoro.error.value}`)
      await new Promise(r => setTimeout(r, 250))
      // Show init-status messages during GPU→CPU fallback (model is being reloaded)
      const status = kokoro.initStatus.value
      if (status) {
        setLessonProgress(lesson.id, status)
      } else if (kokoro.genChunk.value > 0 && kokoro.genTotal.value > 0) {
        setLessonProgress(lesson.id, `Synthesizing chunk ${kokoro.genChunk.value}/${kokoro.genTotal.value}...`)
      }
    }

    if (kokoro.error.value) throw new Error(`TTS error: ${kokoro.error.value}`)
    if (Date.now() >= synthDeadline) {
      throw new Error('TTS synthesis timed out after 30 minutes. Your device may be too slow for on-device TTS.')
    }
    if (!kokoro.audioBuffer.value) {
      throw new Error('TTS synthesis produced no audio. GPU may not support this model — try again, the CPU fallback will be used.')
    }

    // 7 — Persist audio to Browser Cache API
    setLessonProgress(lesson.id, 'Saving audio...')
    await saveAudioToCache(lesson.id, kokoro.audioBuffer.value.slice(0))
    updateCacheMeta(lesson.id, { voice: selectedVoice.value, charCount: script.length })

    })
    synthQueue = synthJob.catch(() => {})
    await synthJob
    clearLessonProgress(lesson.id)
  } catch (e: unknown) {
    ttsError.value = e instanceof Error ? e.message : String(e)
    throw e
  } finally {
    clearLessonProgress(lesson.id)
  }
}

// ── Actions ───────────────────────────────────────────────────────────────────

function toggleTTS() {
  ttsEnabled.value = !ttsEnabled.value
  savePrefs()
}

function setVoice(voice: string) {
  selectedVoice.value = voice
  savePrefs()
}

function setSpeed(speed: number) {
  ttsSpeed.value = speed
  savePrefs()
}

function setScriptModel(model: TTSScriptModel) {
  scriptModel.value = model
  savePrefs()
}

// ── Composable export ─────────────────────────────────────────────────────────

export function useAcademyTTS() {
  if (import.meta.client) loadPrefs()

  return {
    ttsEnabled,
    selectedVoice,
    ttsSpeed,
    scriptModel,
    cachedLessonIds,
    generating,
    generatingLessonIds,
    generatingForLessonId,
    progressMessage,
    progressByLessonId,
    ttsError,
    toggleTTS,
    setVoice,
    setSpeed,
    setScriptModel,
    createTTS,
    loadAudio,
    clearAudio,
    checkKokoroReady,
  }
}
