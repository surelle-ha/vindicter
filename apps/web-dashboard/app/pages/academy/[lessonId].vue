<script setup lang="ts">
import { Send, Loader2, ArrowLeft, GraduationCap, Settings, Terminal,
  ChevronLeft, CheckCircle2, Target, RotateCcw, X } from 'lucide-vue-next'
import type { WhiteboardItem } from '~/components/AcademyWhiteboard.vue'

definePageMeta({ layout: 'dashboard' })

const route  = useRoute()
const router = useRouter()
const supabase = useSupabase()
const { user } = useAuth()

const DAEMON_PORT = 7476
const lessonId = computed(() => route.params.lessonId as string)

// ── Full curriculum ────────────────────────────────────────────────────────
interface LessonMeta {
  id: string; title: string; moduleLabel: string
  objectives: string[]; content: string
  color: string; border: string; bg: string
}

const ALL_LESSONS: LessonMeta[] = [
  { id: 'intro-1', title: 'Course Orientation', moduleLabel: 'Introduction', color: 'text-teal-300', border: 'rgba(20,184,166,0.30)', bg: 'rgba(20,184,166,0.08)',
    objectives: ['Understand the course structure and progression', 'Learn how the AI Professor gates your advancement', 'Set up your learning environment'],
    content: `## Welcome to Vindicter Academy\n\nThis course is a structured, AI-guided security bootcamp. Unlike passive video courses, **your professor unlocks each lesson only when you demonstrate genuine understanding** — not just clicking next.\n\n### How it works\n\n- The Professor introduces each concept clearly\n- Quiz questions check real comprehension\n- Only when you answer correctly does the lesson unlock\n- A WSL sandbox (if the desktop bridge is running) lets you try live commands\n\n### What you'll build\n\nBy the end of this course you'll be able to perform basic recon, identify common web vulnerabilities, understand defensive strategies, and write a security assessment report.` },
  { id: 'intro-2', title: 'AI Professor Setup', moduleLabel: 'Introduction', color: 'text-teal-300', border: 'rgba(20,184,166,0.30)', bg: 'rgba(20,184,166,0.08)',
    objectives: ['Configure OpenRouter or Ollama as your AI model', 'Understand what the Professor can and cannot do', 'Verify your connection before starting the curriculum'],
    content: `## Configuring your AI Professor\n\nThe Professor is powered by any OpenAI-compatible model. Two options:\n\n### OpenRouter\nConnect any cloud model (GPT-4o, Claude 3.5, Mistral, etc.) using an [OpenRouter](https://openrouter.ai) API key. Best for quality and reliability.\n\n### Ollama\nRun a local model entirely on your machine — no API key needed. Requires Ollama installed and running at \`http://localhost:11434\`.\n\n### Tips\n- GPT-4o-mini via OpenRouter is fast and affordable for learning\n- Ollama with \`llama3\` works well but is slower\n- The Professor will tell you when your connection is failing` },
  { id: 'intro-3', title: 'Terminal & Lab Basics', moduleLabel: 'Introduction', color: 'text-teal-300', border: 'rgba(20,184,166,0.30)', bg: 'rgba(20,184,166,0.08)',
    objectives: ['Navigate the Linux filesystem confidently', 'Understand file permissions and how to change them', 'Use pipes, redirection, and grep effectively'],
    content: `## Linux Terminal Fundamentals\n\n### Navigation\n\`\`\`bash\npwd          # where am I?\nls -la       # list all files with permissions\ncd /etc      # change directory\n\`\`\`\n\n### File permissions\n\`\`\`bash\nchmod 600 ~/.ssh/id_rsa     # owner read/write only\nchown user:group file.txt   # change owner\n\`\`\`\n\n### Pipes and redirection\n\`\`\`bash\ncat /etc/passwd | grep root     # pipe output to grep\nnmap -sV 10.0.0.1 > scan.txt   # redirect to file\n\`\`\`\n\nThe WSL sandbox lets you run these commands safely.` },
  { id: 'intro-4', title: 'Setting Your Goals', moduleLabel: 'Introduction', color: 'text-teal-300', border: 'rgba(20,184,166,0.30)', bg: 'rgba(20,184,166,0.08)',
    objectives: ['Articulate your security learning goal', 'Identify your current experience level', 'Choose the study pace that works for you'],
    content: `## Defining your learning path\n\nThis lesson is a reflection and goal-setting session. The Professor will ask about:\n\n- **Your background** — developer, sysadmin, student, or complete beginner\n- **Your goal** — CTF competitor, career change, defensive monitoring, or general knowledge\n- **Your pace** — intensive daily study vs. casual weekend learning\n\nBeing honest helps the Professor tailor explanations to your level and not waste time on concepts you already know.` },
  { id: 'w1-1', title: 'CIA Triad & Threat Modelling', moduleLabel: 'Week 1 — Security Foundations', color: 'text-indigo-300', border: 'rgba(99,102,241,0.30)', bg: 'rgba(99,102,241,0.08)',
    objectives: ['Define Confidentiality, Integrity, and Availability', 'Apply the CIA triad to real-world scenarios', 'Build a basic threat model for a simple application'],
    content: `## The CIA Triad\n\nEvery security decision maps back to three properties:\n\n| Property | Definition | Example attack |\n|---|---|---|\n| **Confidentiality** | Data only seen by authorised parties | Data breach, eavesdropping |\n| **Integrity** | Data only modified by authorised parties | SQL injection, man-in-the-middle |\n| **Availability** | Systems accessible when needed | DDoS, ransomware |\n\n### Threat Modelling\n\nThreat modelling answers: *what could go wrong?*\n\n1. **Identify assets** — what are you protecting?\n2. **Identify threats** — who wants to attack it and how?\n3. **Identify controls** — what defences do you have?\n4. **Prioritise** — focus on highest-impact threats first` },
  { id: 'w2-1', title: 'SQL Injection', moduleLabel: 'Week 2 — Web App Security', color: 'text-violet-300', border: 'rgba(139,92,246,0.30)', bg: 'rgba(139,92,246,0.08)',
    objectives: ['Explain how SQL injection works at a query level', 'Identify SQL injection vulnerabilities in code', 'Apply parameterised queries and input validation'],
    content: `## SQL Injection\n\nSQL injection occurs when user input is concatenated directly into a SQL query.\n\n### Vulnerable code\n\`\`\`python\nquery = "SELECT * FROM users WHERE email = '" + email + "'"\n\`\`\`\n\nAn attacker inputs: \`' OR '1'='1\`\n\nResulting query: \`SELECT * FROM users WHERE email = '' OR '1'='1'\`\n\n### Safe code (parameterised)\n\`\`\`python\ncursor.execute("SELECT * FROM users WHERE email = ?", (email,))\n\`\`\`\n\n### Types\n- **In-band** — error-based, union-based\n- **Blind** — boolean-based, time-based\n- **Out-of-band** — DNS/HTTP exfiltration` },
]

const lesson = computed((): LessonMeta => {
  const found = ALL_LESSONS.find(l => l.id === lessonId.value)
  return found ?? {
    id: lessonId.value, title: `Lesson: ${lessonId.value}`, moduleLabel: 'Academy',
    color: 'text-indigo-300', border: 'rgba(99,102,241,0.30)', bg: 'rgba(99,102,241,0.08)',
    objectives: ['Complete the lesson objectives as guided by the Professor'],
    content: 'Work through this lesson interactively with the AI Professor.',
  }
})

const currentIdx  = computed(() => ALL_LESSONS.findIndex(l => l.id === lessonId.value))
const prevLesson  = computed(() => currentIdx.value > 0 ? ALL_LESSONS[currentIdx.value - 1] : null)

useHead({ title: computed(() => `${lesson.value.title} — Academy`) })

// ── Model config ──────────────────────────────────────────────────────────
const selectedModel   = ref<'openrouter' | 'ollama'>('openrouter')
const openrouterKey   = ref('')
const openrouterModel = ref('openai/gpt-4o-mini')
const ollamaUrl       = ref('http://localhost:11434')
const ollamaModel     = ref('llama3')
const showModelSettings = ref(false)
const showModelModal    = ref(false)

function loadPrefs() {
  if (typeof localStorage === 'undefined') return
  selectedModel.value   = (localStorage.getItem('academy:model') as any) ?? 'openrouter'
  openrouterKey.value   = localStorage.getItem('academy:or:key') ?? ''
  openrouterModel.value = localStorage.getItem('academy:or:model') ?? 'openai/gpt-4o-mini'
  ollamaUrl.value       = localStorage.getItem('academy:ollama:url') ?? 'http://localhost:11434'
  ollamaModel.value     = localStorage.getItem('academy:ollama:model') ?? 'llama3'
  const configured = selectedModel.value === 'ollama' || !!openrouterKey.value
  if (!configured) showModelModal.value = true
}

function savePrefs() {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem('academy:model',        selectedModel.value)
  localStorage.setItem('academy:or:key',       openrouterKey.value)
  localStorage.setItem('academy:or:model',     openrouterModel.value)
  localStorage.setItem('academy:ollama:url',   ollamaUrl.value)
  localStorage.setItem('academy:ollama:model', ollamaModel.value)
  showModelSettings.value = false
  showModelModal.value    = false
}

// ── Chat types ─────────────────────────────────────────────────────────────
interface OptionItem { letter: string; text: string }
interface QuizMC    { type: 'mc';   question: string; options: OptionItem[]; answered: boolean; selectedAnswer?: string }
interface QuizText  { type: 'text'; question: string; answered: boolean; studentInput: string }
type Quiz = QuizMC | QuizText

interface Message {
  id: number; role: 'professor' | 'student'; text: string
  streaming?: boolean; quiz?: Quiz | null; mermaidCode?: string; isContinuation?: boolean
}

const messages = ref<Message[]>([])
const input    = ref('')
const sending  = ref(false)
const chatEl   = ref<HTMLElement | null>(null)
let nextId = 1

// ── Professor gating ───────────────────────────────────────────────────────
const hasUnansweredQuiz = computed(() =>
  messages.value.some(m => m.role === 'professor' && m.quiz && !m.quiz.answered && !m.streaming)
)

// ── Whiteboard ────────────────────────────────────────────────────────────
const whiteboardVisible = ref(false)
const whiteboardItems   = ref<WhiteboardItem[]>([])

function addDiagram(code: string) {
  const trimmed = code.trim()
  if (!trimmed || whiteboardItems.value.some(i => i.content === trimmed)) {
    whiteboardVisible.value = true; return
  }
  whiteboardItems.value.push({ id: `d-${Date.now()}`, title: `Diagram ${whiteboardItems.value.length + 1}`, content: trimmed, createdAt: new Date().toISOString() })
  whiteboardVisible.value = true
}

// ── Panel resize ──────────────────────────────────────────────────────────
const chatWidth       = ref(52)
const resizeContainer = ref<HTMLElement | null>(null)
const isDragging      = ref(false)

function startPanelDrag(e: MouseEvent) {
  e.preventDefault()
  isDragging.value = true
  const startX = e.clientX
  const startW = chatWidth.value
  const cw = resizeContainer.value?.offsetWidth ?? 800

  function onMove(ev: MouseEvent) {
    const delta = ((ev.clientX - startX) / cw) * 100
    chatWidth.value = Math.min(75, Math.max(25, startW + delta))
  }
  function onUp() {
    isDragging.value = false
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

// ── Terminal (WSL daemon) ─────────────────────────────────────────────────
const terminalVisible = ref(false)
const terminalHeight  = ref(200)
const terminalLines   = ref<{ id: number; text: string; type: 'system' | 'output' | 'input' | 'error' }[]>([])
const terminalInput   = ref('')
const terminalRunning = ref(false)
const daemonConnected = ref(false)
let ws: WebSocket | null = null
let termLineId = 0
const terminalEl = ref<HTMLDivElement | null>(null)

function startTerminalDrag(e: MouseEvent) {
  e.preventDefault()
  const startY = e.clientY
  const startH = terminalHeight.value
  function onMove(ev: MouseEvent) {
    const delta = startY - ev.clientY
    terminalHeight.value = Math.min(500, Math.max(80, startH + delta))
  }
  function onUp() {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

function addTermLine(text: string, type: 'system' | 'output' | 'input' | 'error' = 'output') {
  terminalLines.value.push({ id: termLineId++, text, type })
  if (terminalLines.value.length > 500) terminalLines.value.shift()
  nextTick(() => { if (terminalEl.value) terminalEl.value.scrollTop = terminalEl.value.scrollHeight })
}

async function connectTerminal() {
  try {
    const res = await fetch(`http://127.0.0.1:${DAEMON_PORT}/ping`, { signal: AbortSignal.timeout(800) })
    if (!res.ok) throw new Error()
  } catch {
    addTermLine('Academy WSL Bridge is not running. Start it in Vindicter desktop → Settings → WSL → Academy WSL Bridge.', 'error')
    terminalVisible.value = true; return
  }
  ws = new WebSocket(`ws://127.0.0.1:${DAEMON_PORT}/terminal`)
  ws.onopen    = () => { daemonConnected.value = true }
  ws.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data as string)
      if (msg.type === 'ready') addTermLine(`sandbox: ${msg.distro ?? 'wsl'} — ready`, 'system')
      else if (msg.type === 'data' && msg.text) addTermLine(msg.text.replace(/\n$/, ''))
      else if (msg.type === 'done') { terminalRunning.value = false }
    } catch { /* skip malformed */ }
  }
  ws.onclose = () => { daemonConnected.value = false; addTermLine('disconnected', 'system') }
  terminalVisible.value = true
}

function sendTermCmd(cmd?: string) {
  const command = (cmd ?? terminalInput.value).trim()
  if (!command || !ws || ws.readyState !== WebSocket.OPEN) return
  terminalRunning.value = true
  addTermLine(`$ ${command}`, 'input')
  terminalInput.value = ''
  ws.send(JSON.stringify({ type: 'cmd', cmd: command }))
}

function openTerminalWithCmd(cmd: string) {
  if (!daemonConnected.value) { void connectTerminal().then(() => { if (cmd) setTimeout(() => sendTermCmd(cmd), 500) }) }
  else { terminalVisible.value = true; if (cmd) sendTermCmd(cmd) }
}

// ── Quiz parsing ──────────────────────────────────────────────────────────
function stripSignals(text: string): string {
  return text
    .replace(/^\s*ASSESSMENT\s*:?\s*READY\s*$/gim, '')
    .replace(/^\s*LAB\s*:\s*(SPAWN|CMD[^\n]*)$/gim, '')
    .replace(/^\s*ANSWER\s*:\s*[A-D]\s*$/gim, '')
    .trim()
}

function parseMC(raw: string): QuizMC | null {
  const strictMatch = raw.match(/QUIZ\s*:\s*MC\s*[\r\n]+([\s\S]+?)[\r\n]+([A-D]\)[\s\S]+?)(?:[\r\n]+ANSWER\s*:\s*([A-D]))?(?=[\r\n]+|$)/i)
  if (!strictMatch) {
    const lenient = raw.match(/QUIZ\s*:\s*MC\s*[\r\n]+([\s\S]*)/i)
    if (!lenient) return null
    const block = lenient[1]!
    const lines = block.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    const optLines = lines.filter(l => /^[A-D][).:]\s+/.test(l))
    if (optLines.length < 2) return null
    const optIdx = lines.indexOf(optLines[0]!)
    const question = lines.slice(0, optIdx).join(' ').trim() || 'Which of the following is correct?'
    const options: OptionItem[] = optLines.map(l => { const m = l.match(/^([A-D])[).:]\s*(.+)/); return m ? { letter: m[1]!, text: m[2]!.trim() } : null }).filter((x): x is OptionItem => x !== null)
    return { type: 'mc', question, options, answered: false }
  }
  const question = strictMatch[1]!.trim()
  const optBlock = strictMatch[2]!.trim()
  const optLines = optBlock.split(/\r?\n/).filter(l => /^[A-D][).:]\s+/.test(l.trim()))
  const options: OptionItem[] = optLines.map(l => { const m = l.trim().match(/^([A-D])[).:]\s*(.+)/); return m ? { letter: m[1]!, text: m[2]!.trim() } : null }).filter((x): x is OptionItem => x !== null)
  if (options.length < 2) return null
  return { type: 'mc', question, options, answered: false }
}

function parseTextQuiz(raw: string): QuizText | null {
  const m1 = raw.match(/QUIZ\s*:\s*TEXT\s*[\r\n]+([\s\S]+?)\/QUIZ/i)
  if (m1) return { type: 'text', question: m1[1]!.trim(), answered: false, studentInput: '' }
  const m2 = raw.match(/QUIZ\s*:\s*TEXT\s*[\r\n]+([\s\S]+?)(?=[\r\n]{2,}|$)/i)
  if (m2) return { type: 'text', question: m2[1]!.trim(), answered: false, studentInput: '' }
  return null
}

function parseQuiz(raw: string): { cleanText: string; quiz: Quiz | null; readyForNext: boolean; labCmd: string | null } {
  const normalized = raw.replace(/\r\n/g, '\n')
  const readyForNext = /ASSESSMENT\s*:?\s*READY/i.test(normalized)
  const labCmdMatch = normalized.match(/LAB\s*:\s*CMD\s+(.+)/i)
  const labSpawn = /LAB\s*:\s*SPAWN/i.test(normalized)
  const labCmd = labCmdMatch ? labCmdMatch[1]!.trim() : labSpawn ? '' : null
  const mc = parseMC(normalized)
  if (mc) { const clean = stripSignals(normalized.replace(/QUIZ\s*:\s*MC[\s\S]*?(?=\n\n|$)/i, '')); return { cleanText: clean, quiz: mc, readyForNext, labCmd } }
  const txt = parseTextQuiz(normalized)
  if (txt) { const clean = stripSignals(normalized.replace(/QUIZ\s*:\s*TEXT[\s\S]*?(?:\/QUIZ|$)/i, '')); return { cleanText: clean, quiz: txt, readyForNext, labCmd } }
  return { cleanText: stripSignals(normalized), quiz: null, readyForNext, labCmd }
}

// ── Message finalization ──────────────────────────────────────────────────
function splitByDividers(raw: string): string[] {
  return raw.split(/\n[ \t]*---[ \t]*(?:\n|$)/).map(s => s.trim()).filter(Boolean)
}

function finalize(placeholder: Message, rawText: string) {
  const segments = splitByDividers(rawText)
  const finalized: (Message & { _ready?: boolean; _labCmd?: string | null })[] = segments.map((seg, i) => {
    const { cleanText, quiz, readyForNext, labCmd } = parseQuiz(seg)
    const mermaidMatch = cleanText.match(/```mermaid\n?([\s\S]*?)```/)
    return {
      id: i === 0 ? placeholder.id : nextId++,
      role: 'professor' as const, text: cleanText, quiz: quiz ?? null,
      streaming: false, mermaidCode: mermaidMatch?.[1]?.trim(),
      isContinuation: i > 0, _ready: readyForNext, _labCmd: labCmd,
    }
  })
  const idx = messages.value.indexOf(placeholder)
  if (idx !== -1) messages.value.splice(idx, 1, ...finalized)
  sending.value = false
  for (const msg of finalized) {
    if (msg.mermaidCode) addDiagram(msg.mermaidCode)
    if (msg._labCmd !== null && msg._labCmd !== undefined) openTerminalWithCmd(msg._labCmd)
    if (msg._ready) void markComplete()
  }
  void saveSession()
  nextTick(scrollToBottom)
}

// ── System prompt ─────────────────────────────────────────────────────────
function buildSystemPrompt(): string {
  const objectives = lesson.value.objectives.map(o => `- ${o}`).join('\n')
  return `You are Professor Vindicter, an expert cybersecurity instructor.
Lesson: "${lesson.value.title}"
Objectives:
${objectives}

Teaching rules:
- Be encouraging, concise (3-6 sentences + quiz per turn).
- Teach one concept at a time. Always check understanding before moving on.
- When a student answers correctly: give brief praise, put --- on its own line, then continue.
- NEVER reveal the correct quiz answer before the student responds.
- When the student has mastered ALL objectives, end your response with: ASSESSMENT:READY
- Do NOT tell the student to "mark complete" — the app does this automatically.

QUIZ FORMAT — use exactly this syntax:
Multiple choice:
QUIZ:MC
[your question here]
A) [option]
B) [option]
C) [option]
D) [option]
ANSWER:A

Open text:
QUIZ:TEXT
[your question here]
/QUIZ

DIAGRAMS — when a visual helps, use:
\`\`\`mermaid
graph TD
  A --> B
\`\`\`
Keep diagrams compact (4–8 nodes). They open automatically in the Whiteboard panel.

TERMINAL — when hands-on practice helps (use sparingly):
LAB:SPAWN — opens the WSL sandbox terminal.
LAB:CMD nmap --help — opens terminal and pre-fills a command.

Today: ${new Date().toLocaleDateString()}`
}

function buildConversation(limit = 20) {
  const merged: { role: 'assistant' | 'user'; content: string }[] = []
  for (const m of messages.value.filter(m => !m.streaming)) {
    const parts: string[] = []
    if (m.text.trim()) parts.push(m.text)
    if (m.quiz) {
      parts.push(`[${m.quiz.type.toUpperCase()} quiz: ${m.quiz.question}]`)
      if (m.quiz.answered) { const ans = m.quiz.type === 'mc' ? m.quiz.selectedAnswer : m.quiz.studentInput; if (ans) parts.push(`Student answered: ${ans}`) }
    }
    if (!parts.length) continue
    const role = m.role === 'professor' ? 'assistant' as const : 'user' as const
    const last = merged[merged.length - 1]
    if (last && last.role === role && role === 'assistant') last.content += '\n\n' + parts.join('\n')
    else merged.push({ role, content: parts.join('\n') })
  }
  return merged.slice(-limit)
}

async function callAI(): Promise<string> {
  const conv = buildConversation()
  if (selectedModel.value === 'openrouter') {
    if (!openrouterKey.value) throw new Error('OpenRouter API key not set. Click ⚙ above to configure.')
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${openrouterKey.value}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://dashboard.vindicter.xyz', 'X-Title': 'Vindicter Academy' },
      body: JSON.stringify({ model: openrouterModel.value, messages: [{ role: 'system', content: buildSystemPrompt() }, ...conv] }),
    })
    if (!res.ok) { const t = await res.text(); throw new Error(`OpenRouter ${res.status}: ${t.slice(0, 120)}`) }
    return ((await res.json()) as any).choices?.[0]?.message?.content ?? ''
  }
  const res = await fetch(`${ollamaUrl.value.replace(/\/$/, '')}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: ollamaModel.value, stream: false, messages: [{ role: 'system', content: buildSystemPrompt() }, ...conv] }),
  })
  if (!res.ok) throw new Error(`Ollama ${res.status}`)
  return ((await res.json()) as any).message?.content ?? ''
}

// ── Send ──────────────────────────────────────────────────────────────────
async function send(text?: string) {
  const msg = (text ?? input.value).trim()
  if (!msg || sending.value) return
  input.value = ''
  messages.value.push({ id: nextId++, role: 'student', text: msg })
  void saveSession()
  nextTick(scrollToBottom)
  const placeholder: Message = { id: nextId++, role: 'professor', text: '', streaming: true, quiz: null }
  messages.value.push(placeholder)
  sending.value = true
  try {
    const raw = await callAI()
    if (!raw.trim()) throw new Error('Professor returned an empty response. Check your API key and model selection.')
    finalize(placeholder, raw)
  } catch (e: any) {
    const idx = messages.value.indexOf(placeholder)
    if (idx !== -1) messages.value[idx] = { ...placeholder, text: `Error: ${e?.message ?? 'Unknown error'}. Check your AI model settings (⚙).`, streaming: false, quiz: null }
    sending.value = false
    void saveSession()
  }
}

// ── Quiz handlers ─────────────────────────────────────────────────────────
function answerMC(msg: Message, letter: string) {
  if (!msg.quiz || msg.quiz.type !== 'mc' || msg.quiz.answered) return
  const quiz = msg.quiz as QuizMC
  quiz.answered = true; quiz.selectedAnswer = letter
  const opt = quiz.options.find(o => o.letter === letter)
  void send(`My answer is ${letter}) ${opt?.text ?? ''}`)
}

function submitText(msg: Message) {
  const quiz = msg.quiz as QuizText
  if (!quiz || quiz.type !== 'text' || quiz.answered || !quiz.studentInput.trim()) return
  const answer = quiz.studentInput.trim(); quiz.answered = true
  void send(answer)
}

// ── Text rendering ────────────────────────────────────────────────────────
function renderText(raw: string): string {
  const chips: string[] = []
  let i = 0
  let t = raw.replace(/```mermaid\n?([\s\S]*?)```/g, (_m, code) => {
    chips.push(`<button class="mermaid-chip" data-code="${encodeURIComponent(code.trim())}">📊 View diagram</button>`)
    return `\x01CHIP${i++}\x01`
  })
  t = t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`\n]+)`/g, '<code class="inline-code">$1</code>').replace(/\n/g, '<br>')
  chips.forEach((chip, j) => { t = t.replace(`\x01CHIP${j}\x01`, chip) })
  return t
}

function renderMarkdown(raw: string): string {
  let h = raw
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_m, _lang, code) => `<pre class="md-code"><code>${code.trimEnd()}</code></pre>`)
    .replace(/`([^`\n]+)`/g, '<code class="md-inline">$1</code>')
    .replace(/\|(.+)\|\n\|[-| :]+\|\n((?:\|.+\|\n?)*)/g, (_m, header, rows) => {
      const ths = header.split('|').filter(Boolean).map((c: string) => `<th>${c.trim()}</th>`).join('')
      const trs = rows.trim().split('\n').map((row: string) => `<tr>${row.split('|').filter(Boolean).map((c: string) => `<td>${c.trim()}</td>`).join('')}</tr>`).join('')
      return `<table class="md-table"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`
    })
    .replace(/^### (.+)$/gm, '<h3>$1</h3>').replace(/^## (.+)$/gm, '<h2>$1</h2>').replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/((?:^- .+\n?)+)/gm, (b) => `<ul>${b.trim().split('\n').map(l => `<li>${l.replace(/^- /, '')}</li>`).join('')}</ul>`)
    .replace(/((?:^\d+\. .+\n?)+)/gm, (b) => `<ol>${b.trim().split('\n').map(l => `<li>${l.replace(/^\d+\. /, '')}</li>`).join('')}</ol>`)
    .replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br>')
  return `<p>${h}</p>`.replace(/<p>(<(?:h[1-6]|ul|ol|pre|table)[^>]*>)/g, '$1').replace(/(<\/(?:h[1-6]|ul|ol|pre|table)>)<\/p>/g, '$1')
}

function onChatClick(e: MouseEvent) {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.mermaid-chip')
  if (btn) { const code = decodeURIComponent(btn.dataset.code ?? ''); if (code) addDiagram(code) }
}

function scrollToBottom() { if (chatEl.value) chatEl.value.scrollTop = chatEl.value.scrollHeight }

// ── Progress & session ────────────────────────────────────────────────────
const lessonComplete = ref(false)

async function markComplete() {
  if (lessonComplete.value) return
  lessonComplete.value = true
  const uid = (user.value as any)?.id
  if (!uid) return
  await supabase.from('academy_progress').upsert({ user_id: uid, lesson_id: lessonId.value, completed_at: new Date().toISOString(), started_at: new Date().toISOString() }, { onConflict: 'user_id,lesson_id' })
}

async function loadProgress() {
  const uid = (user.value as any)?.id; if (!uid) return
  const { data } = await supabase.from('academy_progress').select('completed_at').eq('user_id', uid).eq('lesson_id', lessonId.value).single()
  lessonComplete.value = !!data?.completed_at
}

async function saveSession() {
  const uid = (user.value as any)?.id; if (!uid) return
  await supabase.from('academy_chat_sessions').upsert({ user_id: uid, lesson_id: lessonId.value, messages: messages.value.filter(m => !m.streaming), updated_at: new Date().toISOString() }, { onConflict: 'user_id,lesson_id' })
}

async function loadSession() {
  const uid = (user.value as any)?.id
  if (!uid) { await initLesson(); return }
  const { data } = await supabase.from('academy_chat_sessions').select('messages').eq('user_id', uid).eq('lesson_id', lessonId.value).single()
  if (data?.messages?.length) {
    messages.value = (data.messages as Message[]).map(m => ({ ...m, streaming: false }))
    nextId = Math.max(0, ...messages.value.map(m => m.id)) + 1
    for (const m of messages.value) { if (m.mermaidCode) addDiagram(m.mermaidCode) }
    nextTick(scrollToBottom)
  } else { await initLesson() }
}

async function initLesson() {
  await send(`Hello Professor! I'm ready to start "${lesson.value.title}". Please introduce the lesson and what I should focus on.`)
}

async function resetSession() {
  if (!confirm('Reset this session? Your conversation history and progress for this lesson will be cleared.')) return
  const uid = (user.value as any)?.id
  if (uid) {
    await supabase.from('academy_chat_sessions').delete().eq('user_id', uid).eq('lesson_id', lessonId.value)
    await supabase.from('academy_progress').delete().eq('user_id', uid).eq('lesson_id', lessonId.value)
  }
  messages.value = []; lessonComplete.value = false
  whiteboardItems.value = []; whiteboardVisible.value = false
  nextId = 1
  await initLesson()
}

onMounted(async () => {
  loadPrefs()
  await Promise.all([loadProgress(), loadSession()])
})

watch(lessonId, async () => {
  messages.value = []; whiteboardItems.value = []; whiteboardVisible.value = false; lessonComplete.value = false
  await Promise.all([loadProgress(), loadSession()])
})

onUnmounted(() => { ws?.close() })
</script>

<template>
  <!-- ── Model selection modal ─────────────────────────────────────────── -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showModelModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 backdrop-blur-sm" style="background:rgba(0,0,0,0.80);" />
        <div class="relative rounded-2xl p-6 w-full max-w-md mx-4" style="background:rgba(14,15,20,0.99);border:1px solid rgba(139,92,246,0.28);box-shadow:0 40px 80px rgba(0,0,0,0.70);">
          <div class="flex items-center gap-3 mb-6">
            <div class="size-10 rounded-xl flex items-center justify-center" style="background:rgba(139,92,246,0.12);border:1px solid rgba(139,92,246,0.25);">
              <GraduationCap class="size-5" style="color:rgba(167,139,250,0.90);" />
            </div>
            <div>
              <h2 class="text-[17px] font-bold" style="color:rgba(255,255,255,0.92);">Select AI Professor</h2>
              <p class="text-[11px] mt-0.5" style="color:rgba(255,255,255,0.35);">Configure your model before starting this lesson.</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2.5 mb-5">
            <button v-for="m in (['openrouter', 'ollama'] as const)" :key="m"
              class="flex flex-col items-start gap-1.5 rounded-xl p-4 text-left transition-all cursor-pointer"
              :style="selectedModel === m ? 'background:rgba(139,92,246,0.12);border:1px solid rgba(139,92,246,0.32);' : 'background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.09);'"
              @click="selectedModel = m">
              <span class="text-[13px] font-semibold" :style="selectedModel === m ? 'color:rgba(167,139,250,0.95);' : 'color:rgba(255,255,255,0.55);'">
                {{ m === 'openrouter' ? 'OpenRouter' : 'Ollama' }}
              </span>
              <span class="text-[10px] leading-relaxed" style="color:rgba(255,255,255,0.28);">
                {{ m === 'openrouter' ? 'Cloud models (GPT-4o, Claude…)' : 'Local models on-device' }}
              </span>
            </button>
          </div>

          <div class="space-y-3 mb-5">
            <template v-if="selectedModel === 'openrouter'">
              <div>
                <p class="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="color:rgba(255,255,255,0.30);">API Key</p>
                <input v-model="openrouterKey" type="password" placeholder="sk-or-v1-…" class="w-full rounded-xl px-3.5 py-2.5 text-[13px] text-white outline-none" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);" />
              </div>
              <div>
                <p class="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="color:rgba(255,255,255,0.30);">Model</p>
                <input v-model="openrouterModel" placeholder="openai/gpt-4o-mini" class="w-full rounded-xl px-3.5 py-2.5 text-[13px] text-white outline-none" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);" />
              </div>
            </template>
            <template v-else>
              <div>
                <p class="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="color:rgba(255,255,255,0.30);">Ollama URL</p>
                <input v-model="ollamaUrl" placeholder="http://localhost:11434" class="w-full rounded-xl px-3.5 py-2.5 text-[13px] text-white outline-none" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);" />
              </div>
              <div>
                <p class="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="color:rgba(255,255,255,0.30);">Model</p>
                <input v-model="ollamaModel" placeholder="llama3" class="w-full rounded-xl px-3.5 py-2.5 text-[13px] text-white outline-none" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);" />
              </div>
            </template>
          </div>

          <button class="w-full rounded-xl py-3 text-[13px] font-semibold cursor-pointer transition-all hover:opacity-90 active:scale-[0.99]"
            style="background:rgba(139,92,246,0.20);border:1px solid rgba(139,92,246,0.35);color:rgba(167,139,250,0.95);"
            @click="savePrefs">
            Start Lesson
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>

  <div class="academy-lesson flex flex-col overflow-hidden" style="height: calc(100vh - 7.5rem);">

    <!-- ── Top bar ──────────────────────────────────────────────────────── -->
    <div class="flex items-center gap-3 px-1 pb-3 shrink-0">
      <button class="p-1.5 rounded-lg cursor-pointer transition-colors hover:bg-white/[0.06]" style="color:rgba(255,255,255,0.40);" @click="router.push('/academy')">
        <ArrowLeft class="size-4" />
      </button>
      <div class="flex-1 min-w-0">
        <p class="text-[10px] font-semibold uppercase tracking-[0.2em]" :style="`color:${lesson.border.replace('0.30', '0.65')};`">{{ lesson.moduleLabel }}</p>
        <h1 class="text-[16px] font-bold leading-tight truncate" style="color:rgba(255,255,255,0.90);">{{ lesson.title }}</h1>
      </div>
      <div class="flex items-center gap-1.5 shrink-0">
        <span v-if="lessonComplete" class="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
          style="background:rgba(35,165,90,0.12);border:1px solid rgba(35,165,90,0.25);color:rgba(74,222,128,0.90);">
          <CheckCircle2 class="size-3" /> Complete
        </span>
        <button v-if="whiteboardItems.length"
          class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors cursor-pointer"
          :style="whiteboardVisible ? 'background:rgba(20,184,166,0.12);border:1px solid rgba(20,184,166,0.30);color:rgba(20,184,166,0.92);' : 'background:rgba(20,184,166,0.05);border:1px solid rgba(20,184,166,0.18);color:rgba(20,184,166,0.60);'"
          @click="whiteboardVisible = !whiteboardVisible">
          📊 <span>Board</span> <span class="tabular-nums">{{ whiteboardItems.length }}</span>
        </button>
        <button class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors cursor-pointer"
          :style="daemonConnected ? 'background:rgba(99,102,241,0.10);border:1px solid rgba(99,102,241,0.25);color:rgba(165,180,252,0.85);' : 'border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.28);'"
          @click="terminalVisible ? (terminalVisible = false) : connectTerminal()">
          <Terminal class="size-3" /> Terminal
        </button>
        <button class="p-1.5 rounded-lg cursor-pointer transition-colors hover:bg-white/[0.06]" title="Reset session" style="color:rgba(255,255,255,0.30);" @click="resetSession()">
          <RotateCcw class="size-3.5" />
        </button>
        <button class="p-1.5 rounded-lg cursor-pointer transition-colors hover:bg-white/[0.06]" style="color:rgba(255,255,255,0.35);" @click="showModelSettings = !showModelSettings">
          <Settings class="size-4" />
        </button>
      </div>
    </div>

    <!-- ── Model settings panel (redesigned) ─────────────────────────────── -->
    <Transition name="slide-down">
      <div v-if="showModelSettings" class="rounded-xl p-4 mb-3 shrink-0" style="background:rgba(139,92,246,0.04);border:1px solid rgba(139,92,246,0.18);">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <Settings class="size-3.5" style="color:rgba(167,139,250,0.60);" />
            <p class="text-[11px] font-semibold" style="color:rgba(167,139,250,0.80);">AI Professor — Model Settings</p>
          </div>
          <button class="size-6 flex items-center justify-center rounded-md cursor-pointer transition-colors hover:bg-white/[0.06]" style="color:rgba(255,255,255,0.30);" @click="showModelSettings = false">
            <X class="size-3.5" />
          </button>
        </div>
        <div class="grid grid-cols-2 gap-2 mb-4">
          <button v-for="m in (['openrouter', 'ollama'] as const)" :key="m"
            class="flex flex-col items-start gap-1 rounded-xl p-3 text-left cursor-pointer transition-all"
            :style="selectedModel === m ? 'background:rgba(139,92,246,0.12);border:1px solid rgba(139,92,246,0.30);' : 'background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);'"
            @click="selectedModel = m">
            <span class="text-[11px] font-semibold" :style="selectedModel === m ? 'color:rgba(167,139,250,0.95);' : 'color:rgba(255,255,255,0.45);'">
              {{ m === 'openrouter' ? 'OpenRouter' : 'Ollama' }}
            </span>
            <span class="text-[9px]" style="color:rgba(255,255,255,0.25);">{{ m === 'openrouter' ? 'Cloud models' : 'Local models' }}</span>
          </button>
        </div>
        <div class="space-y-2">
          <template v-if="selectedModel === 'openrouter'">
            <input v-model="openrouterKey" type="password" placeholder="OpenRouter API key (sk-or-v1-…)" class="w-full rounded-xl px-3 py-2 text-[12px] text-white outline-none" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);" />
            <input v-model="openrouterModel" placeholder="Model (e.g. openai/gpt-4o-mini)" class="w-full rounded-xl px-3 py-2 text-[12px] text-white outline-none" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);" />
          </template>
          <template v-else>
            <input v-model="ollamaUrl" placeholder="Ollama URL (http://localhost:11434)" class="w-full rounded-xl px-3 py-2 text-[12px] text-white outline-none" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);" />
            <input v-model="ollamaModel" placeholder="Model name (e.g. llama3)" class="w-full rounded-xl px-3 py-2 text-[12px] text-white outline-none" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);" />
          </template>
        </div>
        <button class="mt-3 rounded-xl px-4 py-2 text-[12px] font-semibold cursor-pointer transition-all hover:opacity-90"
          style="background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.28);color:rgba(167,139,250,0.90);" @click="savePrefs">Save</button>
      </div>
    </Transition>

    <!-- ── Main two-panel area ──────────────────────────────────────────── -->
    <div ref="resizeContainer" class="relative flex-1 flex gap-0 overflow-hidden min-h-0" :class="isDragging ? 'select-none cursor-col-resize' : ''">

      <!-- Whiteboard full-width overlay -->
      <Transition name="board-slide">
        <div v-if="whiteboardVisible" class="absolute inset-0 z-10 overflow-hidden rounded-xl">
          <ClientOnly>
            <AcademyWhiteboard :items="whiteboardItems" :visible="true" height="100%" @close="whiteboardVisible = false" />
          </ClientOnly>
        </div>
      </Transition>

      <!-- LEFT: Chat panel -->
      <div class="flex flex-col overflow-hidden rounded-xl shrink-0"
        :style="`width:${chatWidth}%;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.015);`">

        <!-- Messages -->
        <div ref="chatEl" class="flex-1 overflow-y-auto p-4 space-y-3" style="scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.06) transparent;" @click="onChatClick">
          <TransitionGroup name="msg">
            <div v-for="msg in messages" :key="msg.id" class="flex" :class="msg.role === 'student' ? 'justify-end' : 'justify-start'">

              <!-- Professor bubble -->
              <div v-if="msg.role === 'professor'" class="flex items-start gap-2.5 max-w-[92%]">
                <div class="size-7 shrink-0 rounded-lg flex items-center justify-center mt-0.5 professor-avatar" style="background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.28);">
                  <GraduationCap class="size-3.5" style="color:rgba(167,139,250,0.90);" />
                </div>
                <div class="min-w-0 space-y-2 flex-1">
                  <div v-if="msg.isContinuation" class="h-px w-8 rounded-full my-1" style="background:rgba(139,92,246,0.20);" />
                  <div v-if="msg.streaming" class="professor-bubble flex items-center gap-2">
                    <span class="text-[12px] italic" style="color:rgba(255,255,255,0.35);">Professor is thinking</span>
                    <span class="flex gap-1">
                      <span v-for="d in [0,1,2]" :key="d" class="dot-bounce size-1 rounded-full" :style="`background:rgba(139,92,246,0.60);animation-delay:${d*150}ms;`" />
                    </span>
                  </div>
                  <div v-else-if="msg.text.trim()" class="professor-bubble">
                    <!-- eslint-disable-next-line vue/no-v-html -->
                    <span class="text-[13px] leading-relaxed" style="color:rgba(255,255,255,0.82);" v-html="renderText(msg.text)" />
                  </div>

                  <!-- MC Quiz -->
                  <div v-if="msg.quiz?.type === 'mc'" class="quiz-card quiz-mc rounded-xl p-4 space-y-3">
                    <p class="text-[12px] font-semibold" style="color:rgba(255,255,255,0.85);">{{ (msg.quiz as any).question }}</p>
                    <div class="space-y-2">
                      <button v-for="opt in (msg.quiz as any).options" :key="opt.letter"
                        class="mc-option w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] transition-all"
                        :class="[msg.quiz.answered ? 'cursor-default' : 'cursor-pointer mc-option-hover', (msg.quiz as any).selectedAnswer === opt.letter ? 'mc-option-selected' : '']"
                        :disabled="msg.quiz.answered"
                        @click="answerMC(msg, opt.letter)">
                        <span class="mc-letter size-6 flex items-center justify-center rounded-full text-[10px] font-bold shrink-0 transition-all"
                          :class="(msg.quiz as any).selectedAnswer === opt.letter ? 'mc-letter-selected' : 'mc-letter-default'">
                          {{ opt.letter }}
                        </span>
                        <span>{{ opt.text }}</span>
                      </button>
                    </div>
                    <p v-if="msg.quiz.answered" class="text-[10px]" style="color:rgba(255,255,255,0.25);">Answer submitted — waiting for professor.</p>
                  </div>

                  <!-- Text Quiz -->
                  <div v-if="msg.quiz?.type === 'text'" class="quiz-card quiz-text rounded-xl p-4 space-y-3">
                    <p class="text-[12px] font-semibold" style="color:rgba(255,255,255,0.85);">{{ (msg.quiz as any).question }}</p>
                    <template v-if="!(msg.quiz as any).answered">
                      <textarea v-model="(msg.quiz as any).studentInput" rows="3"
                        class="w-full rounded-xl px-3 py-2 text-[12px] text-white outline-none resize-none"
                        style="background:rgba(255,255,255,0.05);border:1px solid rgba(99,102,241,0.25);"
                        placeholder="Type your answer…" />
                      <button class="rounded-xl px-4 py-2 text-[11px] font-semibold cursor-pointer transition-colors hover:opacity-90"
                        style="background:rgba(99,102,241,0.18);border:1px solid rgba(99,102,241,0.30);color:rgba(165,180,252,0.92);"
                        @click="submitText(msg)">Submit answer</button>
                    </template>
                    <p v-else class="text-[11px] italic" style="color:rgba(255,255,255,0.35);">"{{ (msg.quiz as any).studentInput }}"</p>
                  </div>
                </div>
              </div>

              <!-- Student bubble -->
              <div v-else class="max-w-[78%] student-bubble rounded-2xl rounded-tr-md px-4 py-2.5">
                <p class="text-[13px] leading-relaxed whitespace-pre-wrap" style="color:rgba(255,255,255,0.88);">{{ msg.text }}</p>
              </div>
            </div>
          </TransitionGroup>
        </div>

        <!-- Professor gate hint -->
        <div v-if="hasUnansweredQuiz && !sending" class="px-4 py-2.5 border-t text-center shrink-0" style="border-color:rgba(255,255,255,0.06);">
          <p class="text-[11px]" style="color:rgba(255,255,255,0.22);">Answer the question above to continue the conversation.</p>
        </div>

        <!-- Input bar -->
        <div v-else class="flex items-center gap-2 p-3 border-t shrink-0" style="border-color:rgba(255,255,255,0.06);">
          <input v-model="input" :disabled="sending || hasUnansweredQuiz"
            placeholder="Reply to the professor…"
            class="flex-1 rounded-xl px-4 py-2.5 text-[13px] text-white outline-none transition-colors disabled:opacity-50"
            style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);"
            @keydown.enter.prevent="send()" />
          <button :disabled="sending || !input.trim() || hasUnansweredQuiz"
            class="size-10 flex items-center justify-center rounded-xl cursor-pointer transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            style="background:rgba(139,92,246,0.20);border:1px solid rgba(139,92,246,0.32);color:rgba(167,139,250,0.92);"
            @click="send()">
            <Loader2 v-if="sending" class="size-4 animate-spin" />
            <Send v-else class="size-4" />
          </button>
        </div>
      </div>

      <!-- Drag divider -->
      <div class="flex items-center justify-center w-4 cursor-col-resize shrink-0 group" @mousedown.prevent="startPanelDrag">
        <div class="w-0.5 h-10 rounded-full transition-all duration-150 group-hover:h-16 group-hover:bg-violet-500/40" style="background:rgba(255,255,255,0.07);" />
      </div>

      <!-- RIGHT: Lesson content panel -->
      <div class="flex flex-col flex-1 overflow-hidden" style="min-width:25%;">

        <!-- Objectives card -->
        <div class="rounded-xl p-4 mb-3 shrink-0" :style="`background:${lesson.bg};border:1px solid ${lesson.border};`">
          <div class="flex items-center gap-2 mb-3">
            <Target class="size-4 shrink-0" :class="lesson.color" />
            <p class="text-[11px] font-bold uppercase tracking-wider" :class="lesson.color">Learning Objectives</p>
          </div>
          <ul class="space-y-1.5">
            <li v-for="(obj, i) in lesson.objectives" :key="i" class="flex items-start gap-2 text-[12px] leading-relaxed" style="color:rgba(255,255,255,0.70);">
              <span class="shrink-0 mt-0.5 size-4 rounded-full flex items-center justify-center text-[9px] font-bold" :style="`background:${lesson.border};color:rgba(255,255,255,0.70);`">{{ i + 1 }}</span>
              {{ obj }}
            </li>
          </ul>
        </div>

        <!-- Content scroll area -->
        <div class="flex-1 overflow-y-auto rounded-xl content-panel" style="border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.015);scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.06) transparent;">
          <div class="p-5">
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div class="lesson-content" v-html="renderMarkdown(lesson.content)" />
          </div>
        </div>

        <!-- Lesson navigation (professor-gated: no Next button) -->
        <div class="flex items-center justify-between gap-3 mt-3 shrink-0">
          <button v-if="prevLesson"
            class="flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-medium transition-colors cursor-pointer hover:bg-white/[0.05]"
            style="color:rgba(255,255,255,0.40);border:1px solid rgba(255,255,255,0.07);"
            @click="router.push(`/academy/${prevLesson.id}`)">
            <ChevronLeft class="size-3.5" /> {{ prevLesson.title }}
          </button>
          <div v-else />

          <button v-if="lessonComplete"
            class="flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-semibold transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            style="background:rgba(34,197,94,0.10);border:1px solid rgba(34,197,94,0.22);color:rgba(74,222,128,0.85);"
            @click="router.push('/academy')">
            <CheckCircle2 class="size-3.5" /> Back to Academy
          </button>
          <div v-else class="text-[10px]" style="color:rgba(255,255,255,0.20);">Complete this lesson to continue</div>
        </div>
      </div>
    </div>

    <!-- ── WSL Terminal drawer (resizable) ──────────────────────────────── -->
    <Transition name="slide-up">
      <div v-if="terminalVisible" class="shrink-0 mt-2 rounded-xl overflow-hidden"
        :style="`height:${terminalHeight}px;background:rgba(0,0,0,0.80);border:1px solid rgba(99,102,241,0.25);`">
        <!-- Resize handle -->
        <div class="h-4 flex items-center justify-center cursor-n-resize transition-colors hover:bg-white/[0.02] group shrink-0"
          @mousedown.prevent="startTerminalDrag">
          <div class="w-10 h-1 rounded-full transition-colors group-hover:bg-indigo-400/40" style="background:rgba(255,255,255,0.10);" />
        </div>
        <!-- Header -->
        <div class="flex items-center gap-2 px-3 py-1.5 border-b shrink-0" style="border-color:rgba(99,102,241,0.18);">
          <Terminal class="size-3.5" style="color:rgba(165,180,252,0.65);" />
          <span class="flex-1 text-[10px] font-semibold uppercase tracking-wider" style="color:rgba(165,180,252,0.55);">WSL Sandbox</span>
          <span class="size-1.5 rounded-full" :class="daemonConnected ? 'bg-emerald-400' : 'bg-red-400/60'" />
          <button class="text-[10px] transition-colors cursor-pointer hover:text-white/50" style="color:rgba(255,255,255,0.30);" @click="terminalVisible = false">✕</button>
        </div>
        <!-- Output -->
        <div ref="terminalEl" class="overflow-y-auto p-2 font-mono text-[11px] leading-relaxed" style="height:calc(100% - 72px);scrollbar-width:thin;">
          <div v-for="line in terminalLines" :key="line.id"
            :style="line.type === 'system' ? 'color:rgba(20,184,166,0.70);' : line.type === 'input' ? 'color:rgba(165,180,252,0.80);' : line.type === 'error' ? 'color:rgba(248,113,113,0.75);' : 'color:rgba(255,255,255,0.65);'"
            class="whitespace-pre-wrap">{{ line.text }}</div>
        </div>
        <!-- Input -->
        <div class="flex items-center gap-2 border-t px-2 py-1 shrink-0" style="border-color:rgba(99,102,241,0.14);">
          <span class="font-mono text-[11px]" style="color:rgba(99,102,241,0.55);">$</span>
          <input v-model="terminalInput" :disabled="!daemonConnected || terminalRunning" class="flex-1 bg-transparent font-mono text-[11px] outline-none disabled:opacity-40" style="color:rgba(255,255,255,0.75);" placeholder="enter command…"
            @keydown.enter.prevent="sendTermCmd()" />
          <button v-if="terminalRunning" class="text-[10px] cursor-pointer" style="color:rgba(248,113,113,0.65);" @click="() => ws?.send(JSON.stringify({type:'kill'}))">^C</button>
        </div>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
.msg-enter-active { transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }
.msg-enter-from  { opacity: 0; transform: translateY(12px) scale(0.97); }
.msg-leave-active { display: none; }

.slide-down-enter-active, .slide-down-leave-active { transition: all 0.2s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-8px); }

.slide-up-enter-active, .slide-up-leave-active { transition: all 0.25s ease; }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translateY(12px); }

.board-slide-enter-active, .board-slide-leave-active { transition: all 0.30s cubic-bezier(0.4, 0, 0.2, 1); }
.board-slide-enter-from, .board-slide-leave-to { opacity: 0; transform: scaleY(0.96); transform-origin: top; }

.modal-enter-active, .modal-leave-active { transition: all 0.20s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

@keyframes dot-bounce { 0%,80%,100% { transform: scale(0.7); opacity:.4 } 40% { transform: scale(1); opacity:1 } }
.dot-bounce { display: inline-block; animation: dot-bounce 1.2s ease-in-out infinite; }

.professor-bubble {
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px 16px 16px 4px; padding: 10px 14px;
}
.student-bubble { background: rgba(139,92,246,0.12); border: 1px solid rgba(139,92,246,0.22); }
.quiz-mc  { background: rgba(139,92,246,0.05); border: 1px solid rgba(139,92,246,0.18); }
.quiz-text { background: rgba(99,102,241,0.05); border: 1px solid rgba(99,102,241,0.18); }
.mc-option { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); }
.mc-option-hover:hover { background: rgba(139,92,246,0.09); border-color: rgba(139,92,246,0.25); }
.mc-option-selected { background: rgba(139,92,246,0.14) !important; border-color: rgba(139,92,246,0.35) !important; color: rgba(167,139,250,0.95) !important; }
.mc-letter-default  { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.45); }
.mc-letter-selected { background: rgba(139,92,246,0.30); border: 1px solid rgba(139,92,246,0.50); color: rgba(167,139,250,1); }

:deep(.mermaid-chip) {
  display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 6px;
  font-size: 11px; cursor: pointer; background: rgba(20,184,166,0.10);
  border: 1px solid rgba(20,184,166,0.22); color: rgba(20,184,166,0.85); transition: all 0.15s ease; vertical-align: middle;
}
:deep(.mermaid-chip:hover) { background: rgba(20,184,166,0.18); }
:deep(.inline-code) { background: rgba(255,255,255,0.09); padding: 1px 5px; border-radius: 4px; font-size: 11px; font-family: monospace; }

.lesson-content :deep(h1) { font-size: 18px; font-weight: 700; color: rgba(255,255,255,0.88); margin: 0 0 12px; }
.lesson-content :deep(h2) { font-size: 15px; font-weight: 600; color: rgba(255,255,255,0.75); margin: 20px 0 8px; }
.lesson-content :deep(h3) { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.65); margin: 16px 0 6px; }
.lesson-content :deep(p)  { font-size: 13px; line-height: 1.7; color: rgba(255,255,255,0.58); margin: 0 0 10px; }
.lesson-content :deep(strong) { color: rgba(255,255,255,0.80); }
.lesson-content :deep(em)     { color: rgba(167,139,250,0.80); }
.lesson-content :deep(ul), .lesson-content :deep(ol) { margin: 0 0 10px 16px; }
.lesson-content :deep(li) { font-size: 13px; line-height: 1.65; color: rgba(255,255,255,0.58); margin-bottom: 4px; }
.lesson-content :deep(.md-code) {
  background: rgba(0,0,0,0.40); border: 1px solid rgba(255,255,255,0.09); border-radius: 8px;
  padding: 12px 14px; font-size: 12px; font-family: 'Fira Code', monospace;
  color: rgba(167,139,250,0.85); overflow-x: auto; margin: 10px 0; line-height: 1.6;
}
.lesson-content :deep(.md-inline) { background: rgba(139,92,246,0.12); padding: 1px 5px; border-radius: 4px; font-size: 11.5px; font-family: monospace; color: rgba(167,139,250,0.85); }
.lesson-content :deep(.md-table) { width: 100%; border-collapse: collapse; font-size: 12px; margin: 10px 0; }
.lesson-content :deep(.md-table th) { background: rgba(139,92,246,0.10); color: rgba(167,139,250,0.80); padding: 6px 10px; text-align: left; font-size: 11px; font-weight: 600; border: 1px solid rgba(255,255,255,0.08); }
.lesson-content :deep(.md-table td) { padding: 6px 10px; color: rgba(255,255,255,0.58); border: 1px solid rgba(255,255,255,0.07); }
.lesson-content :deep(.md-table tr:hover td) { background: rgba(255,255,255,0.02); }

@keyframes avatar-glow { 0%,100% { box-shadow: 0 0 0 0 rgba(139,92,246,0); } 50% { box-shadow: 0 0 0 4px rgba(139,92,246,0.25); } }
.professor-avatar { animation: avatar-glow 2s ease-in-out infinite; }
</style>
