<script setup lang="ts">
import { Bot, ChevronRight, Loader2, RefreshCw, Router, Send, Sparkles, Terminal, User, Zap } from 'lucide-vue-next'
import { runClaude } from '~/composables/useClaudeShell'
import { runCodexExec } from '~/composables/useCodexShell'
import { runOpenRouterChat } from '~/composables/useOpenRouterAI'
import { runOllamaChat } from '~/composables/useOllamaAI'
import { checkDefendCoreAvailable, fetchRAGContext } from '~/composables/useDefendCoreRAG'
import { useAcademyStore } from '~/stores/academy'
import type { AcademyAIModel, AcademyChatMessage, AcademyChatQuiz } from '~/stores/academy'
import type { Lesson } from '~/data/curriculum'

const props = defineProps<{
  lesson: Lesson
  lessonCompleted: boolean
  terminalVisible: boolean
  extraContext?: string
}>()

const emit = defineEmits<{
  markComplete: []
  'mermaid-diagram': [code: string]
  'whiteboard-diagrams': [codes: string[]]
  'toggle-terminal': []
  'open-terminal': [command: string]
}>()

interface ChatMessage {
  id: number
  role: 'professor' | 'student'
  text: string
  streaming?: boolean
  quiz?: ParsedQuiz | null
  createdAt?: string
  model?: Exclude<AcademyAIModel, null>
  mermaidCode?: string
  isContinuation?: boolean
}

type ParsedQuiz = AcademyChatQuiz

const academy = useAcademyStore()
const app = useAppStore()
const projects = useProjectsStore()
const { toolStatus, checkAIToolAvailability } = useAIToolAvailability()

const ragAvailable = ref(false)
const ragEnabled   = ref(false)

// ── Session gate ──────────────────────────────────────────────────────────
const sessionStarted = ref(false)
// Pre-fill from stored preference, default to claude
const pendingModel = ref<AcademyAIModel>(academy.aiModel ?? 'claude')

const modelOptions = computed(() => [
  {
    id: 'claude' as AcademyAIModel,
    label: 'Claude',
    sublabel: 'Anthropic Claude Code',
    color: 'text-violet-300',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/25',
    icon: Sparkles,
    disabled: !toolStatus.claude.available && !toolStatus.claude.checking,
    checking: toolStatus.claude.checking,
    notReady: !toolStatus.claude.available && !toolStatus.claude.checking,
  },
  {
    id: 'codex' as AcademyAIModel,
    label: 'Codex',
    sublabel: 'OpenAI Codex CLI',
    color: 'text-emerald-300',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/25',
    icon: Zap,
    disabled: !toolStatus.codex.available && !toolStatus.codex.checking,
    checking: toolStatus.codex.checking,
    notReady: !toolStatus.codex.available && !toolStatus.codex.checking,
  },
  {
    id: 'openrouter' as AcademyAIModel,
    label: 'OpenRouter',
    sublabel: 'Configured OpenRouter model',
    note: toolStatus.openrouter.available ? app.openRouter.model : 'Configure API key in AI Models',
    color: 'text-sky-300',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/25',
    icon: Router,
    disabled: !toolStatus.openrouter.available,
    checking: false,
    notReady: !toolStatus.openrouter.available,
  },
  {
    id: 'ollama' as AcademyAIModel,
    label: 'Ollama',
    sublabel: 'Local Ollama server',
    note: toolStatus.ollama.available ? `${app.ollama.model} · ${app.ollama.url}` : 'Configure in AI Models',
    color: 'text-orange-300',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/25',
    icon: Terminal,
    disabled: !toolStatus.ollama.available,
    checking: false,
    notReady: !toolStatus.ollama.available,
  },
])

onMounted(() => {
  void checkAIToolAvailability()
  checkDefendCoreAvailable().then(ok => {
    ragAvailable.value = ok
    if (!ok) ragEnabled.value = false
  })
})

async function beginSession() {
  // Save the model selection to the store
  await academy.setSetup(academy.mode ?? 'ai-assisted', pendingModel.value)
  sessionStarted.value = true
  await nextTick()
  if (!messages.value.length) await startSession()
}

// ── Chat state ────────────────────────────────────────────────────────────
const messages = ref<ChatMessage[]>([])
const studentInput = ref('')
const isStreaming = ref(false)
const chatEl = ref<HTMLElement | null>(null)
let nextId = 1

// ── WSL Practice Terminal ─────────────────────────────────────────────────
function activeModel(): Exclude<AcademyAIModel, null> {
  return academy.aiModel ?? 'claude'
}

function restoreSession() {
  const stored = academy.getChatSession(props.lesson.id)
  const restoredDiagrams: string[] = []
  messages.value = stored.map((message) => {
    const mermaidMatch = message.text.match(/```mermaid\n?([\s\S]*?)```/m)
    const mermaidCode = mermaidMatch?.[1]?.trim() || undefined
    if (mermaidCode && !restoredDiagrams.includes(mermaidCode)) {
      restoredDiagrams.push(mermaidCode)
    }
    return {
      id: message.id,
      role: message.role,
      text: message.text,
      quiz: message.quiz ?? null,
      createdAt: message.createdAt,
      model: message.model,
      mermaidCode,
      isContinuation: message.isContinuation,
    }
  })
  nextId = Math.max(0, ...messages.value.map(message => message.id)) + 1
  sessionStarted.value = messages.value.length > 0
  pendingModel.value = academy.aiModel ?? 'claude'
  emit('whiteboard-diagrams', restoredDiagrams)
  void nextTick().then(scrollToBottom)
}

function serializableMessages(): AcademyChatMessage[] {
  return messages.value
    .filter(message => message.text.trim() || message.quiz)
    .map(message => ({
      id: message.id,
      role: message.role,
      text: message.text,
      createdAt: message.createdAt ?? new Date().toISOString(),
      model: message.model ?? activeModel(),
      quiz: message.quiz ?? null,
      isContinuation: message.isContinuation,
    }))
}

async function persistMessages() {
  await academy.setChatSession(props.lesson.id, serializableMessages())
}

// ── Quiz parsing ──────────────────────────────────────────────────────────
function parseQuiz(text: string): { cleanText: string; quiz: ParsedQuiz | null; readyForNext: boolean; labSpawn: boolean; labCmd: string | null } {
  const normalized = text.replace(/\r\n/g, '\n')
  const readyForNext = /^\s*ASSESSMENT\s*:\s*READY\s*$/im.test(normalized)

  // Lab terminal signals
  const labCmdMatch = normalized.match(/^\s*LAB:CMD\s+(.+)$/im)
  const labSpawn = !!(normalized.match(/^\s*LAB:SPAWN\s*$/im) || labCmdMatch)
  const labCmd = labCmdMatch ? (labCmdMatch[1] ?? '').trim() : null

  const withoutSignals = normalized
    .replace(/^\s*ASSESSMENT\s*:\s*READY\s*$/gim, '')
    .replace(/^\s*LAB:SPAWN\s*$/gim, '')
    .replace(/^\s*LAB:CMD\s+.+$/gim, '')
    .trim()

  const mcMatch = withoutSignals.match(/QUIZ:MC\s*\n([\s\S]*?)(?=\n\s*A\)\s+)([\s\S]*?)\n\s*ANSWER\s*:\s*([A-D])\b/i)
  if (mcMatch) {
    const question = (mcMatch[1] ?? '').trim()
    const optionLines = (mcMatch[2] ?? '').trim().split('\n').filter(line => /^[A-D]\)\s+/.test(line.trim()))
    const options = optionLines.map((line) => {
      const m = line.match(/^([A-D])\)\s*(.+)/)
      return m ? { letter: m[1] ?? '', text: (m[2] ?? '').trim() } : null
    }).filter((x): x is { letter: string; text: string } => x !== null)
    const cleanText = stripLeakedAnswer(withoutSignals.replace(mcMatch[0], '')).trim()
    return { cleanText, quiz: { type: 'mc', question, options, answered: false }, readyForNext, labSpawn, labCmd }
  }

  const textMatch = withoutSignals.match(/QUIZ:TEXT\s*\n([\s\S]+?)\/QUIZ/i)
  if (textMatch) {
    const question = (textMatch[1] ?? '').trim()
    const cleanText = stripLeakedAnswer(withoutSignals.replace(textMatch[0], '')).trim()
    return { cleanText, quiz: { type: 'text', question, answered: false, studentInput: '' }, readyForNext, labSpawn, labCmd }
  }

  const numMatch = withoutSignals.match(/QUIZ:NUMBER\s*\n([\s\S]+?)\/QUIZ/i)
  if (numMatch) {
    const question = (numMatch[1] ?? '').trim()
    const cleanText = stripLeakedAnswer(withoutSignals.replace(numMatch[0], '')).trim()
    return { cleanText, quiz: { type: 'number', question, answered: false, studentInput: '' }, readyForNext, labSpawn, labCmd }
  }

  return { cleanText: stripLeakedAnswer(withoutSignals), quiz: null, readyForNext, labSpawn, labCmd }
}

function stripLeakedAnswer(text: string): string {
  return text
    .replace(/^\s*ANSWER\s*:\s*[A-D]\s*$/gim, '')
    .replace(/^\s*ASSESSMENT\s*:\s*READY\s*$/gim, '')
    .trim()
}

function streamingProfessorText(text: string): string {
  let visible = stripLeakedAnswer(text.replace(/\r\n/g, '\n'))
  // Collapse --- dividers into a subtle inline separator while streaming
  visible = visible.replace(/\n[ \t]*---[ \t]*(?=\n|$)/gm, '\n\n· · ·\n\n')
  // Hide incomplete mermaid blocks while streaming
  visible = visible.replace(/```mermaid[\s\S]*?```/gm, '⏳ Generating diagram…')
  visible = visible.replace(/```mermaid[\s\S]*$/m, '⏳ Generating diagram…')
  const quizIndex = visible.search(/\n?\s*QUIZ:(MC|TEXT|NUMBER)\b/i)
  if (quizIndex === -1) return visible
  const intro = visible.slice(0, quizIndex).trim()
  return intro ? `${intro}\n\nPreparing a question...` : 'Preparing a question...'
}

function splitByDividers(raw: string): string[] {
  return raw
    .split(/\n[ \t]*---[ \t]*(?:\n|$)/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
}

async function finalizeProfessorMessage(profMsg: ChatMessage, rawText: string) {
  const segments = splitByDividers(rawText)
  const now = new Date().toISOString()

  // Build a finalized ChatMessage from each segment
  const finalized: ChatMessage[] = segments.map((seg, i) => {
    const { cleanText, quiz, readyForNext, labSpawn, labCmd } = parseQuiz(seg)
    const mermaidMatch = cleanText.match(/```mermaid\n?([\s\S]*?)```/m)
    return {
      id: i === 0 ? profMsg.id : nextId++,
      role: 'professor' as const,
      text: cleanText,
      quiz,
      streaming: false,
      createdAt: now,
      model: profMsg.model,
      mermaidCode: mermaidMatch?.[1]?.trim(),
      isContinuation: i > 0,
      _readyForNext: readyForNext,
      _labSpawn: labSpawn,
      _labCmd: labCmd,
    } as ChatMessage & { _readyForNext: boolean; _labSpawn: boolean; _labCmd: string | null }
  })

  // Replace the single streaming placeholder with all finalized segments
  const idx = messages.value.indexOf(profMsg)
  if (idx !== -1) {
    messages.value.splice(idx, 1, ...finalized)
  }

  isStreaming.value = false
  await persistMessages()

  // Side-effects: mermaid diagrams, completion signal, lab terminal
  for (const msg of finalized) {
    if (msg.mermaidCode) {
      emit('mermaid-diagram', msg.mermaidCode)
    }
    const meta = msg as any
    if (meta._readyForNext && !props.lessonCompleted) {
      emit('markComplete')
    }
    if (meta._labSpawn) {
      emit('open-terminal', meta._labCmd ?? '')
    }
  }

  await nextTick()
  scrollToBottom()
}

// ── Prompt building ───────────────────────────────────────────────────────
function buildSystemPrompt(): string {
  const objectivesList = props.lesson.objectives.map(o => `- ${o}`).join('\n')
  const contentSummary = props.lesson.content.slice(0, 800) + (props.lesson.content.length > 800 ? '...' : '')
  const authorContext = props.extraContext?.trim() ? `${props.extraContext.trim()}\n\n` : ''

  return `${authorContext}You are Professor Vindicter, an expert cybersecurity instructor for a flexible, self-paced security bootcamp.
The student is currently studying "${props.lesson.title}".

Lesson objectives:
${objectivesList}

Lesson content excerpt:
${contentSummary}

Your teaching approach:
- Be encouraging, clear, and engaging. Use real-world analogies.
- Explain concepts step by step. Check understanding before moving on.
- Ask comprehension questions using the QUIZ format below.
- Give constructive feedback on student answers — praise correct reasoning, gently correct mistakes.
- When a student answers correctly: give your feedback/praise, then place "---" on its own line, then continue with the next concept or question. This creates a natural message break between your encouragement and the next teaching step. Use "---" ONLY at this transition — do not use it mid-explanation or for any other purpose.
- Never expose the correct answer in visible text before the student answers.
- When the student demonstrates solid understanding of all objectives, end your response with this hidden control line on its own line: ASSESSMENT:READY
- Do not tell the student to mark the lesson complete. The app will unlock the next lesson after ASSESSMENT:READY.
- Keep each response concise (3-6 sentences + optional quiz). Do not dump everything at once.

QUIZ FORMAT (use when asking questions):
Multiple choice:
QUIZ:MC
[Your question here]
A) [option]
B) [option]
C) [option]
D) [option]
ANSWER:[correct letter]

The ANSWER line is for the app parser only. Do not repeat the answer key anywhere else.

Open text:
QUIZ:TEXT
[Your question here]
/QUIZ

DIAGRAMS (optional, use sparingly):
When a concept benefits from a visual — flowchart, sequence diagram, tree, or process flow — include a Mermaid diagram.
Wrap it in a fenced code block:
\`\`\`mermaid
graph TD
  A --> B
\`\`\`
Keep diagrams compact (4–8 nodes max). The diagram will open automatically in the student's whiteboard panel beside the lesson.

PRACTICE TERMINAL (WSL academy sandbox):
The student has access to a live Linux sandbox. Use it sparingly — only when hands-on practice genuinely reinforces the concept.
Place one of these signals on its own line in your message:

LAB:SPAWN — Opens the practice terminal for free exploration.
LAB:CMD nmap --help — Opens the terminal and pre-fills the suggested command.

Use the terminal when: you want the student to observe a real command, explore a tool's help page, or practice a safe CLI operation.
Do NOT use for: quizzes, theory, or commands that scan external targets or modify system files.

Current date: ${new Date().toLocaleDateString()}
Be conversational and specific to today's lesson.`
}

function conversationText(message: ChatMessage): string {
  const parts: string[] = []
  if (message.text.trim()) parts.push(message.text.trim())
  if (message.quiz) {
    const quizLines = [`[Professor asked a ${message.quiz.type.toUpperCase()} quiz]`, `Question: ${message.quiz.question}`]
    if (message.quiz.type === 'mc' && message.quiz.options?.length) {
      quizLines.push(...message.quiz.options.map(option => `${option.letter}) ${option.text}`))
    }
    if (message.quiz.answered) {
      const answer = message.quiz.type === 'mc'
        ? message.quiz.selectedAnswer
        : message.quiz.studentInput
      if (answer) quizLines.push(`Student answered: ${answer}`)
    }
    else {
      quizLines.push('Student has not answered this quiz yet.')
    }
    parts.push(quizLines.join('\n'))
  }
  return parts.join('\n\n').trim()
}

function conversationMessages(limit = 18) {
  const merged: { role: 'assistant' | 'user'; content: string }[] = []
  for (const message of messages.value.filter(m => !m.streaming)) {
    const content = conversationText(message)
    if (!content.trim()) continue
    const role = message.role === 'professor' ? 'assistant' as const : 'user' as const
    const last = merged[merged.length - 1]
    // Merge consecutive professor segments (split bubbles) back into one assistant turn
    if (last && last.role === role && role === 'assistant') {
      last.content += '\n\n' + content
    }
    else {
      merged.push({ role, content })
    }
  }
  return merged.slice(-limit)
}

function buildPrompt(): string {
  const priorMessages = messages.value.filter(message => !message.streaming)
  // Merge consecutive professor segments before formatting history
  const merged: { role: 'professor' | 'student'; text: string; model?: string }[] = []
  for (const m of priorMessages) {
    const last = merged[merged.length - 1]
    if (last && last.role === m.role && m.role === 'professor') {
      last.text += '\n\n' + conversationText(m)
    }
    else {
      merged.push({ role: m.role, text: conversationText(m), model: m.model })
    }
  }
  const history = merged.slice(-14).map(m => {
    const prefix = m.role === 'professor' ? 'Professor' : 'Student'
    return `${prefix}: ${m.text}`
  }).join('\n\n')
  const memory = merged.length
    ? merged.map(m => `${m.role === 'professor' ? 'Professor' : 'Student'} (${m.model ?? 'saved'}): ${m.text}`).slice(-24).join('\n')
    : 'No previous lesson conversation yet.'

  return `${buildSystemPrompt()}

--- Persistent session memory ---
${memory}

--- Conversation so far ---
${history}

Professor:`
}

// ── Message sending ───────────────────────────────────────────────────────
async function sendMessage(text: string) {
  if (!text.trim() || isStreaming.value) return

  messages.value.push({ id: nextId++, role: 'student', text: text.trim(), createdAt: new Date().toISOString(), model: activeModel() })
  void persistMessages()
  studentInput.value = ''
  await nextTick()
  scrollToBottom()

  const profMsg: ChatMessage = { id: nextId++, role: 'professor', text: '', streaming: true, quiz: null, createdAt: new Date().toISOString(), model: activeModel() }
  messages.value.push(profMsg)
  isStreaming.value = true

  let rawBuffer = ''
  const projectPath = projects.activeProject?.absolutePath ?? '.'

  try {
    // RAG only for cloud APIs — Claude/Codex build their own context from the prompt
    const ragCtx = (ragEnabled.value && ragAvailable.value && (activeModel() === 'openrouter' || activeModel() === 'ollama'))
      ? await fetchRAGContext(props.lesson.title)
      : ''
    const sysPrompt = ragCtx
      ? `${buildSystemPrompt()}\n\n---\n${ragCtx}`
      : buildSystemPrompt()

    if (activeModel() === 'openrouter') {
      const result = await runOpenRouterChat({
        apiKey: app.openRouter.apiKey,
        model: app.openRouter.model,
        messages: [
          { role: 'system', content: sysPrompt },
          ...conversationMessages(),
        ],
      })
      rawBuffer = result
      await finalizeProfessorMessage(profMsg, rawBuffer)
      return
    }

    if (activeModel() === 'ollama') {
      const result = await runOllamaChat({
        url: app.ollama.url,
        model: app.ollama.model,
        messages: [
          { role: 'system', content: sysPrompt },
          ...conversationMessages(),
        ],
      })
      rawBuffer = result
      await finalizeProfessorMessage(profMsg, rawBuffer)
      return
    }

    if (activeModel() === 'codex') {
      const result = await runCodexExec({
        prompt: buildPrompt(),
        projectPath,
        sandbox: 'read-only',
        reasoningEffort: 'medium',
      })
      rawBuffer = result.stdout || result.stderr
      await finalizeProfessorMessage(profMsg, rawBuffer || 'Codex finished without a readable professor response.')
      return
    }

    await runClaude({
      prompt: buildPrompt(),
      projectPath,
      onLine(line: string) {
        try {
          const parsed = JSON.parse(line) as Record<string, unknown>
          const type = parsed?.type as string | undefined

          if (type === 'result') {
            const result = parsed.result
            if (typeof result === 'string' && result.trim()) {
              rawBuffer = result
              profMsg.text = streamingProfessorText(result)
            }
          }
          else if (type === 'assistant') {
            const content = (parsed as any)?.message?.content
            if (Array.isArray(content)) {
              for (const block of content) {
                if (block?.type === 'text' && typeof block.text === 'string') {
                  rawBuffer += block.text
                  profMsg.text = streamingProfessorText(rawBuffer)
                }
              }
            }
          }
          else if (type === 'text' && typeof parsed.text === 'string') {
            rawBuffer += parsed.text as string
            profMsg.text = streamingProfessorText(rawBuffer)
          }
        }
        catch {
          if (line.trim() && !line.startsWith('{')) {
            rawBuffer += line
            profMsg.text = streamingProfessorText(rawBuffer)
          }
        }
        void nextTick().then(scrollToBottom)
      },
      onClose() {
        void finalizeProfessorMessage(profMsg, rawBuffer)
      },
      onError(err: string) {
        profMsg.text = `I'm having trouble connecting right now (${err}). Make sure Claude CLI is installed and logged in.`
        profMsg.streaming = false
        isStreaming.value = false
        void persistMessages()
      },
    })
  }
  catch (e: any) {
    profMsg.text = `Connection error: ${e?.message ?? 'Unknown error'}`
    profMsg.streaming = false
    isStreaming.value = false
    void persistMessages()
  }
}

// ── Session control ───────────────────────────────────────────────────────
async function startSession() {
  await sendMessage(`Hello Professor! I'm ready to learn about ${props.lesson.title}. Please introduce the topic and what I should focus on.`)
}

async function resetSession() {
  messages.value = []
  await academy.clearChatSession(props.lesson.id)
  sessionStarted.value = false
  pendingModel.value = academy.aiModel ?? 'claude'
  emit('whiteboard-diagrams', [])
}

// ── Quiz handlers ─────────────────────────────────────────────────────────
function answerMC(msg: ChatMessage, letter: string) {
  if (!msg.quiz || msg.quiz.answered) return
  msg.quiz.answered = true
  msg.quiz.selectedAnswer = letter
  void persistMessages()
  void sendMessage(`My answer is ${letter}) ${msg.quiz.options?.find(o => o.letter === letter)?.text ?? ''}`)
}

function submitTextAnswer(msg: ChatMessage) {
  if (!msg.quiz || msg.quiz.answered || !msg.quiz.studentInput?.trim()) return
  const answer = msg.quiz.studentInput.trim()
  msg.quiz.answered = true
  void persistMessages()
  void sendMessage(answer)
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    void sendMessage(studentInput.value)
  }
}

function scrollToBottom() {
  if (chatEl.value) {
    chatEl.value.scrollTop = chatEl.value.scrollHeight
  }
}

function handleBubbleClick(e: MouseEvent, msg: ChatMessage) {
  if ((e.target as Element).classList.contains('mermaid-chip') && msg.mermaidCode) {
    emit('mermaid-diagram', msg.mermaidCode)
  }
}

// ── Text renderer ─────────────────────────────────────────────────────────
function renderText(text: string): string {
  // Extract mermaid blocks before HTML-escaping so their content is preserved
  const mermaidCount = { n: 0 }
  let processed = text.replace(/```mermaid\n?([\s\S]*?)```/gm, () => {
    mermaidCount.n++
    return '\x01MERMAID\x01'
  })

  processed = processed
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    .replace(/\n/g, '<br>')

  // Replace placeholder with a chip
  processed = processed.replace(/\x01MERMAID\x01/g,
    '<span class="mermaid-chip">📊 Open diagram in whiteboard →</span>',
  )

  return processed
}

onMounted(() => {
  restoreSession()
})

watch(() => props.lesson.id, () => {
  restoreSession()
})
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden rounded-xl border border-indigo-500/20 bg-black/20">

    <!-- ── PRE-SESSION: Model selection ────────────────────────────────── -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
      mode="out-in"
    >
      <div v-if="!sessionStarted" class="flex h-full flex-col items-center justify-center gap-5 p-5">
        <!-- Icon + title -->
        <div class="text-center space-y-1">
          <div class="mx-auto grid size-12 place-items-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10">
            <Bot class="size-6 text-indigo-300" />
          </div>
          <p class="text-sm font-semibold text-[var(--text)]">Professor Vindicter</p>
          <p class="text-[11px] text-[var(--text-muted)]">
            AI tutor for <span class="text-[var(--text)]">{{ lesson.title }}</span>
          </p>
          <p v-if="messages.length" class="text-[10px] text-emerald-300/75">
            Saved session found. Continue with any model.
          </p>
        </div>

        <!-- Model picker -->
        <div class="w-full space-y-2">
          <p class="text-center text-[10px] font-semibold uppercase tracking-widest text-[var(--text-faint)]">
            Choose AI model
          </p>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="m in modelOptions"
              :key="m.id ?? ''"
              class="rounded-xl border p-2.5 text-left transition-all"
              :class="[
                m.id === 'core' ? 'col-span-2' : '',
                m.disabled
                  ? 'cursor-not-allowed border-[var(--border)] opacity-50'
                  : pendingModel === m.id
                    ? [m.border, m.bg]
                    : 'border-[var(--border)] hover:border-white/10 hover:bg-white/[0.02]',
              ]"
              :disabled="m.disabled"
              @click="!m.disabled && (pendingModel = m.id)"
            >
              <div class="flex items-center gap-1.5 mb-1">
                <component :is="m.icon" class="size-3.5 shrink-0" :class="m.color" />
                <span class="text-xs font-semibold text-[var(--text)]">{{ m.label }}</span>
                <span v-if="m.checking" class="ml-auto text-[8px] text-[var(--text-faint)]">…</span>
                <span v-else-if="m.id === 'claude' && !m.notReady" class="ml-auto rounded-full border border-violet-500/25 bg-violet-500/10 px-1.5 py-px text-[8px] font-semibold text-violet-300">Best</span>
                <span v-else-if="m.notReady && !m.soon" class="ml-auto rounded-full border border-red-500/25 bg-red-500/10 px-1.5 py-px text-[8px] font-semibold text-red-300">Not found</span>
                <span v-if="m.soon" class="ml-auto rounded-full border border-rose-500/25 bg-rose-500/10 px-1.5 py-px text-[9px] font-semibold text-rose-300">Soon</span>
              </div>
              <p class="text-[10px] text-[var(--text-faint)] leading-relaxed">{{ m.sublabel }}</p>
              <p v-if="m.note" class="mt-0.5 text-[10px] text-amber-400/70 italic">{{ m.note }}</p>
            </button>
          </div>
        </div>

        <!-- RAG KB toggle -->
        <label class="flex items-center gap-2.5 rounded-xl border px-3 py-2 cursor-pointer transition-colors"
          :class="ragAvailable ? 'border-violet-500/20 bg-violet-500/[0.04] hover:bg-violet-500/[0.07]' : 'border-[var(--border)] bg-black/10 opacity-50 cursor-not-allowed'">
          <div class="relative shrink-0 h-5 w-9 rounded-full transition-colors duration-200 overflow-hidden"
            :style="(ragEnabled && ragAvailable) ? 'background:rgba(139,92,246,0.70);' : 'background:rgba(255,255,255,0.12);'"
            @click.prevent="ragAvailable && (ragEnabled = !ragEnabled)">
            <span class="absolute top-[2px] h-4 w-4 rounded-full transition-all duration-200"
              :style="(ragEnabled && ragAvailable) ? 'left:18px;background:white;' : 'left:2px;background:rgba(255,255,255,0.55);'" />
          </div>
          <div class="min-w-0">
            <p class="text-[11px] font-medium text-[var(--text)]">Enhance with Knowledge Base</p>
            <p class="text-[9px] text-[var(--text-faint)]">
              {{ ragAvailable ? 'DefendCore KB context injected into each professor prompt' : 'KB unavailable — enable in admin panel' }}
            </p>
          </div>
        </label>

        <!-- Start button -->
        <button
          class="w-full rounded-xl bg-indigo-600/70 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-600"
          @click="beginSession"
        >
          Start Learning Session →
        </button>

        <p class="text-center text-[10px] text-[var(--text-faint)] leading-relaxed">
          The professor remembers this lesson's prior conversation, even if you switch models later.
        </p>
      </div>

      <!-- ── ACTIVE CHAT ─────────────────────────────────────────────────── -->
      <div v-else class="flex h-full flex-col overflow-hidden">
        <!-- Header -->
        <div class="flex shrink-0 items-center gap-2.5 border-b border-indigo-500/15 px-4 py-2.5">
          <div class="grid size-7 shrink-0 place-items-center rounded-lg border border-indigo-500/20 bg-indigo-500/10">
            <Bot class="size-4 text-indigo-300" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-semibold text-[var(--text)]">Professor Vindicter</p>
            <p class="text-[10px] text-[var(--text-faint)]">
              {{ academy.aiModel === 'codex' ? 'Codex' : academy.aiModel === 'openrouter' ? 'OpenRouter' : academy.aiModel === 'ollama' ? 'Ollama' : 'Claude' }} · saved memory
            </p>
          </div>
          <button
            class="flex size-6 items-center justify-center rounded text-[var(--text-faint)] transition-colors hover:bg-white/[0.05] hover:text-[var(--text-muted)]"
            title="Change model / reset session"
            @click="resetSession"
          >
            <RefreshCw class="size-3" />
          </button>
        </div>

        <!-- Messages -->
        <div ref="chatEl" class="flex-1 space-y-3 overflow-y-auto p-4 custom-scroll">
          <div v-if="messages.length === 0" class="flex h-full items-center justify-center">
            <Loader2 class="size-5 animate-spin text-indigo-400/50" />
          </div>

          <template v-for="msg in messages" :key="msg.id">
            <!-- Professor message -->
            <div v-if="msg.role === 'professor'" class="flex items-start gap-2" :class="msg.isContinuation ? '-mt-1' : ''">
              <div
                class="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-indigo-500/20 bg-indigo-500/10"
                :class="msg.isContinuation ? 'invisible' : ''"
              >
                <Bot class="size-3.5 text-indigo-300" />
              </div>
              <div class="flex-1 min-w-0 space-y-2">
                <!-- Text -->
                <div
                  v-if="msg.text"
                  class="professor-bubble border border-indigo-500/15 bg-indigo-500/[0.08] px-3 py-2.5 text-xs leading-relaxed text-[var(--text-muted)]"
                  :class="msg.isContinuation ? 'rounded-xl' : 'rounded-xl rounded-tl-none'"
                  v-html="renderText(msg.text)"
                  @click="handleBubbleClick($event, msg)"
                />
                <!-- Streaming indicator -->
                <div v-if="msg.streaming && !msg.text" class="flex items-center gap-1.5 px-1">
                  <span class="size-1 rounded-full bg-indigo-400 animate-bounce" style="animation-delay:0ms" />
                  <span class="size-1 rounded-full bg-indigo-400 animate-bounce" style="animation-delay:150ms" />
                  <span class="size-1 rounded-full bg-indigo-400 animate-bounce" style="animation-delay:300ms" />
                </div>

                <!-- Quiz: Multiple Choice -->
                <div
                  v-if="msg.quiz && msg.quiz.type === 'mc' && msg.quiz.options"
                  class="rounded-xl border border-indigo-500/20 bg-black/20 p-3 space-y-2"
                >
                  <p class="text-[11px] font-semibold text-[var(--text)]">{{ msg.quiz.question }}</p>
                  <div class="space-y-1.5">
                    <button
                      v-for="opt in msg.quiz.options"
                      :key="opt.letter"
                      class="flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-[11px] transition-colors"
                      :class="[
                        msg.quiz.answered
                          ? (opt.letter === msg.quiz.selectedAnswer
                              ? 'border-indigo-500/40 bg-indigo-500/15 text-indigo-200'
                              : 'border-[var(--border)] text-[var(--text-faint)] opacity-50')
                          : 'border-[var(--border)] hover:border-indigo-500/30 hover:bg-indigo-500/[0.06] text-[var(--text-muted)] cursor-pointer',
                      ]"
                      :disabled="msg.quiz.answered"
                      @click="answerMC(msg, opt.letter)"
                    >
                      <span class="grid size-5 shrink-0 place-items-center rounded border border-current text-[10px] font-bold">
                        {{ opt.letter }}
                      </span>
                      {{ opt.text }}
                    </button>
                  </div>
                </div>

                <!-- Quiz: Text / Number -->
                <div
                  v-if="msg.quiz && (msg.quiz.type === 'text' || msg.quiz.type === 'number') && !msg.quiz.answered"
                  class="rounded-xl border border-indigo-500/20 bg-black/20 p-3 space-y-2"
                >
                  <p class="text-[11px] font-semibold text-[var(--text)]">{{ msg.quiz.question }}</p>
                  <div class="flex items-center gap-2">
                    <input
                      v-model="msg.quiz.studentInput"
                      :type="msg.quiz.type === 'number' ? 'number' : 'text'"
                      placeholder="Your answer…"
                      class="flex-1 rounded-lg border border-[var(--border)] bg-black/20 px-3 py-1.5 text-xs text-[var(--text)] placeholder-[var(--text-faint)] outline-none focus:border-indigo-500/40"
                      @keydown.enter="submitTextAnswer(msg)"
                    >
                    <button
                      class="flex items-center gap-1 rounded-lg bg-indigo-600/20 px-2.5 py-1.5 text-[11px] text-indigo-300 transition-colors hover:bg-indigo-600/30"
                      @click="submitTextAnswer(msg)"
                    >
                      <ChevronRight class="size-3" />
                      Submit
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Student message -->
            <div v-else class="flex items-start gap-2 flex-row-reverse">
              <div class="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-[var(--border)] bg-white/[0.04]">
                <User class="size-3.5 text-[var(--text-faint)]" />
              </div>
              <div class="max-w-[85%] rounded-xl rounded-tr-none border border-[var(--border)] bg-white/[0.04] px-3 py-2 text-xs text-[var(--text-muted)]">
                {{ msg.text }}
              </div>
            </div>
          </template>

          <div v-if="!lessonCompleted && messages.length > 4" class="flex justify-center pt-1">
            <p class="rounded-full border border-indigo-500/20 bg-indigo-500/[0.06] px-3 py-1.5 text-[11px] text-indigo-200/80">
              Professor Vindicter will unlock the next lesson when you are ready.
            </p>
          </div>
        </div>

        <!-- Input -->
        <div class="shrink-0 border-t border-indigo-500/15 p-3">
          <div class="flex items-end gap-2 rounded-xl border border-indigo-500/20 bg-black/20 px-3 py-2 focus-within:border-indigo-500/40">
            <textarea
              v-model="studentInput"
              rows="1"
              placeholder="Ask a question or respond…"
              class="flex-1 resize-none bg-transparent text-[12px] text-[var(--text)] placeholder-[var(--text-faint)] outline-none"
              style="max-height: 80px; overflow-y: auto;"
              :disabled="isStreaming"
              @keydown="onKeyDown"
              @input="(e: Event) => {
                const t = e.target as HTMLTextAreaElement
                t.style.height = 'auto'
                t.style.height = t.scrollHeight + 'px'
              }"
            />
            <button
              :disabled="!studentInput.trim() || isStreaming"
              class="flex size-6 shrink-0 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-300 transition-colors hover:bg-indigo-600/30 disabled:opacity-40"
              @click="sendMessage(studentInput)"
            >
              <Loader2 v-if="isStreaming" class="size-3.5 animate-spin" />
              <Send v-else class="size-3.5" />
            </button>
            <!-- Manual terminal toggle -->
            <button
              class="flex size-6 shrink-0 items-center justify-center rounded-lg transition-colors"
              :class="terminalVisible
                ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                : 'text-[var(--text-faint)] hover:bg-white/[0.06] hover:text-[var(--text-muted)]'"
              title="Toggle practice terminal"
              @click="emit('toggle-terminal')"
            >
              <Terminal class="size-3.5" />
            </button>
          </div>
          <p class="mt-1 px-1 text-[10px] text-[var(--text-faint)]">Enter to send · Shift+Enter for new line · <span class="text-emerald-400/60">⬛ terminal</span></p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.professor-bubble :deep(.inline-code) {
  background: rgba(255,255,255,0.08);
  border-radius: 3px;
  padding: 1px 4px;
  font-family: ui-monospace, monospace;
  font-size: 10.5px;
}

.professor-bubble :deep(strong) {
  color: var(--text);
  font-weight: 600;
}

.professor-bubble :deep(.mermaid-chip) {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin: 4px 0;
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px solid rgba(20, 184, 166, 0.25);
  background: rgba(20, 184, 166, 0.08);
  color: rgb(94, 234, 212);
  font-size: 10.5px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.professor-bubble :deep(.mermaid-chip:hover) {
  background: rgba(20, 184, 166, 0.18);
  border-color: rgba(20, 184, 166, 0.45);
}
</style>
