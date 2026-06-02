<script setup lang="ts">
import { Maximize2, Minimize2, RefreshCw, Terminal as TerminalIcon, Trash2, X } from 'lucide-vue-next'
import 'xterm/css/xterm.css'

const props = defineProps<{
  distro: string
  suggestedCommand?: string
  expanded?: boolean
}>()

const emit = defineEmits<{
  close: []
  toggleExpand: []
}>()

type TerminalChunk = {
  runId: string
  stream: 'stdout' | 'stderr' | 'system'
  text: string
  done: boolean
  code: number | null
}

const app = useAppStore()
const termEl = ref<HTMLElement | null>(null)
const backendReady = ref(false)
const backendLoading = ref(false)
const backendError = ref('')
const running = ref(false)

let term: any = null
let fitAddon: any = null
let resizeObserver: ResizeObserver | null = null
let unlistenTerminal: (() => void) | null = null
let dataDisposable: { dispose: () => void } | null = null
let inputBuffer = props.suggestedCommand ?? ''
let commandHistory: string[] = []
let commandHistoryIdx = -1
let currentRunId = ''
let promptVisible = false
let lastWriteEndedWithNewline = true

const effectiveDistro = computed(() => {
  if (props.distro) return props.distro
  const profile = app.wslProfiles.find(p => p.id === 'academy')
  return profile?.distro ?? ''
})

function promptText() {
  return `\x1b[32macademy@${effectiveDistro.value || 'wsl'}\x1b[0m:\x1b[34m~/vindicta/workspace\x1b[0m$ `
}

function write(data: string) {
  term?.write(data)
  lastWriteEndedWithNewline = data.endsWith('\n') || data.endsWith('\r\n')
}

function writeLine(data = '') {
  term?.writeln(data)
  lastWriteEndedWithNewline = true
}

function focusTerminal() {
  requestAnimationFrame(() => term?.focus())
}

function fitTerminal() {
  requestAnimationFrame(() => {
    try {
      fitAddon?.fit()
    }
    catch {
      // xterm can throw while its container is transitioning size.
    }
  })
}

function showPrompt() {
  if (!term) return
  promptVisible = true
  write(promptText() + inputBuffer)
  focusTerminal()
}

function redrawPrompt() {
  if (!term || !promptVisible) return
  write(`\r\x1b[2K${promptText()}${inputBuffer}`)
}

function terminalText(text: string) {
  return text.replace(/\r?\n/g, '\r\n')
}

async function ensureBackend(force = false, showPromptOnFinish = true) {
  if (backendReady.value && !force) return true
  backendLoading.value = true
  backendError.value = ''
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('wsl_ensure_academy_backend', { distro: effectiveDistro.value })
    backendReady.value = true
    writeLine(`\x1b[36mAcademy sandbox ready - ${effectiveDistro.value || 'default distro'} - user: academy\x1b[0m`)
    return true
  }
  catch (e: any) {
    backendReady.value = false
    backendError.value = e?.message ?? 'Could not start academy WSL backend.'
    writeLine(`\x1b[31m${backendError.value}\x1b[0m`)
    return false
  }
  finally {
    backendLoading.value = false
    if (showPromptOnFinish && !running.value && !promptVisible) showPrompt()
  }
}

function nextRunId() {
  return globalThis.crypto?.randomUUID?.() ?? `academy-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

async function runCommand() {
  const command = inputBuffer.trim()
  if (!command || running.value) return

  promptVisible = false
  inputBuffer = ''
  commandHistoryIdx = -1
  if (!commandHistory.includes(command)) commandHistory.unshift(command)
  if (commandHistory.length > 80) commandHistory.pop()
  write('\r\n')

  const ready = await ensureBackend(false, false)
  if (!ready) {
    showPrompt()
    return
  }

  running.value = true
  currentRunId = nextRunId()
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('wsl_run_academy_command_stream', {
      distro: effectiveDistro.value,
      command,
      runId: currentRunId,
    })
  }
  catch (e: any) {
    writeLine(`\x1b[31m${e?.message ?? 'Command failed.'}\x1b[0m`)
    running.value = false
    currentRunId = ''
    showPrompt()
  }
}

function completeRun(code: number | null) {
  if (!lastWriteEndedWithNewline) write('\r\n')
  if (code !== null && code !== 0) {
    writeLine(`\x1b[31m[vindicter] command exited with code ${code}\x1b[0m`)
  }
  running.value = false
  currentRunId = ''
  showPrompt()
}

function handleChunk(payload: TerminalChunk) {
  if (!payload || payload.runId !== currentRunId) return
  if (payload.text) {
    write(terminalText(payload.text))
  }
  if (payload.done) {
    completeRun(payload.code)
  }
}

function setInput(value: string) {
  inputBuffer = value
  redrawPrompt()
}

function handleHistory(direction: 'up' | 'down') {
  if (!commandHistory.length || running.value) return
  if (direction === 'up') {
    commandHistoryIdx = Math.min(commandHistoryIdx + 1, commandHistory.length - 1)
    setInput(commandHistory[commandHistoryIdx] ?? '')
  }
  else if (commandHistoryIdx > 0) {
    commandHistoryIdx--
    setInput(commandHistory[commandHistoryIdx] ?? '')
  }
  else {
    commandHistoryIdx = -1
    setInput('')
  }
}

function handleData(data: string) {
  if (running.value) {
    if (data === '\x03') {
      write('^C\r\n')
      writeLine('\x1b[33m[vindicter] Detached from this command. Non-interactive commands auto-stop after 30s.\x1b[0m')
      running.value = false
      currentRunId = ''
      showPrompt()
    }
    return
  }

  if (data === '\r') {
    void runCommand()
    return
  }
  if (data === '\u007F') {
    if (inputBuffer.length > 0) {
      inputBuffer = inputBuffer.slice(0, -1)
      write('\b \b')
    }
    return
  }
  if (data === '\x1b[A') {
    handleHistory('up')
    return
  }
  if (data === '\x1b[B') {
    handleHistory('down')
    return
  }
  if (data === '\x0c') {
    clearTerminal()
    return
  }
  if (data === '\x03') {
    setInput('')
    write('^C\r\n')
    showPrompt()
    return
  }

  const printable = data.replace(/[\x00-\x08\x0B-\x1F\x7F]/g, '')
  if (!printable) return
  inputBuffer += printable
  write(printable)
}

function clearTerminal() {
  term?.clear()
  inputBuffer = ''
  promptVisible = false
  lastWriteEndedWithNewline = true
  showPrompt()
}

async function reconnectBackend() {
  backendReady.value = false
  if (promptVisible) {
    promptVisible = false
    write('\r\n')
  }
  await ensureBackend(true)
}

onMounted(async () => {
  const [{ Terminal }, { FitAddon }, { listen }] = await Promise.all([
    import('xterm'),
    import('@xterm/addon-fit'),
    import('@tauri-apps/api/event'),
  ])

  term = new Terminal({
    allowTransparency: true,
    convertEol: false,
    cursorBlink: true,
    cursorStyle: 'bar',
    fontFamily: 'JetBrains Mono, Cascadia Mono, Consolas, monospace',
    fontSize: 12,
    lineHeight: 1.15,
    scrollback: 5000,
    tabStopWidth: 2,
    theme: {
      background: '#050507',
      foreground: '#d7e0dc',
      cursor: '#5eead4',
      selectionBackground: '#134e4a',
      black: '#111827',
      red: '#f87171',
      green: '#34d399',
      yellow: '#fbbf24',
      blue: '#60a5fa',
      magenta: '#c084fc',
      cyan: '#22d3ee',
      white: '#e5e7eb',
      brightBlack: '#6b7280',
      brightRed: '#fca5a5',
      brightGreen: '#6ee7b7',
      brightYellow: '#fde68a',
      brightBlue: '#93c5fd',
      brightMagenta: '#d8b4fe',
      brightCyan: '#67e8f9',
      brightWhite: '#ffffff',
    },
  })
  fitAddon = new FitAddon()
  term.loadAddon(fitAddon)
  term.open(termEl.value!)
  dataDisposable = term.onData(handleData)
  unlistenTerminal = await listen<TerminalChunk>('academy-terminal-chunk', event => handleChunk(event.payload))

  resizeObserver = new ResizeObserver(fitTerminal)
  if (termEl.value) resizeObserver.observe(termEl.value)

  fitTerminal()
  writeLine('\x1b[36m== Vindicter Academy Practice Sandbox ==\x1b[0m')
  writeLine('\x1b[90m  Dedicated WSL account: academy\x1b[0m')
  writeLine('\x1b[90m  Commands run in ~/vindicta/workspace and stream live output.\x1b[0m')
  await ensureBackend()
})

onBeforeUnmount(() => {
  unlistenTerminal?.()
  dataDisposable?.dispose()
  resizeObserver?.disconnect()
  term?.dispose()
})

watch(() => props.suggestedCommand, (cmd) => {
  if (!cmd || running.value) return
  setInput(cmd)
  focusTerminal()
})

watch(() => props.expanded, () => {
  fitTerminal()
})
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden rounded-xl border border-emerald-500/20 bg-[#050507]">
    <div class="flex h-10 shrink-0 items-center gap-2 border-b border-white/[0.06] bg-white/[0.025] px-3">
      <div class="grid size-6 shrink-0 place-items-center rounded border border-emerald-500/20 bg-emerald-500/10">
        <TerminalIcon class="size-3.5 text-emerald-400" />
      </div>
      <span class="min-w-0 flex-1 truncate text-[11px] font-semibold text-emerald-300">Academy Sandbox</span>
      <span class="hidden font-mono text-[10px] text-[var(--text-faint)] sm:inline">academy@{{ effectiveDistro || 'wsl' }}</span>
      <span
        class="size-1.5 shrink-0 rounded-full"
        :class="backendReady ? 'bg-emerald-400' : backendLoading ? 'animate-pulse bg-sky-400' : 'bg-amber-400'"
      />
      <button
        class="rounded p-1 text-[var(--text-faint)] transition-colors hover:bg-white/[0.06] hover:text-[var(--text)]"
        title="Reconnect backend"
        @click="reconnectBackend"
      >
        <RefreshCw class="size-3.5" :class="backendLoading ? 'animate-spin' : ''" />
      </button>
      <button
        class="rounded p-1 text-[var(--text-faint)] transition-colors hover:bg-white/[0.06] hover:text-[var(--text)]"
        title="Clear terminal"
        @click="clearTerminal"
      >
        <Trash2 class="size-3.5" />
      </button>
      <button
        class="rounded p-1 text-[var(--text-faint)] transition-colors hover:bg-white/[0.06] hover:text-[var(--text)]"
        :title="expanded ? 'Restore terminal' : 'Expand terminal'"
        @click="emit('toggleExpand')"
      >
        <Minimize2 v-if="expanded" class="size-3.5" />
        <Maximize2 v-else class="size-3.5" />
      </button>
      <button
        class="rounded p-1 text-[var(--text-faint)] transition-colors hover:bg-red-500/10 hover:text-red-300"
        title="Close terminal"
        @click="emit('close')"
      >
        <X class="size-3.5" />
      </button>
    </div>

    <div v-if="backendError" class="shrink-0 border-b border-amber-500/20 bg-amber-500/[0.06] px-3 py-1.5">
      <p class="truncate text-[11px] text-amber-200">{{ backendError }}</p>
    </div>

    <div ref="termEl" class="min-h-0 flex-1 p-2" @click="focusTerminal" />
  </div>
</template>

<style scoped>
:deep(.xterm) {
  height: 100%;
  padding: 2px;
}

:deep(.xterm-viewport) {
  background-color: transparent !important;
}

:deep(.xterm-screen) {
  width: 100% !important;
}
</style>
