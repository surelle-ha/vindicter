<script setup lang="ts">
import { AlertTriangle, CheckCircle2, Download, Loader2, Stethoscope, Wrench, XCircle } from 'lucide-vue-next'
import { Command } from '@tauri-apps/plugin-shell'

const emit = defineEmits<{ close: [] }>()
const app = useAppStore()
const { notify } = useNotifications()

type DoctorStatus = 'ok' | 'warning' | 'error'
interface DoctorCheck { id: string; label: string; detail: string; status: DoctorStatus }

const checks = ref<DoctorCheck[]>([])
const running = ref(false)
const codexInstalling = ref(false)
const claudeInstalling = ref(false)

const summary = computed(() => {
  const errors = checks.value.filter(c => c.status === 'error').length
  const warnings = checks.value.filter(c => c.status === 'warning').length
  if (!checks.value.length) return 'Checking your setup…'
  if (errors) return `${errors} issue${errors !== 1 ? 's' : ''} need attention`
  if (warnings) return `${warnings} warning${warnings !== 1 ? 's' : ''}`
  return 'Everything looks good!'
})

function isWin() {
  return typeof navigator !== 'undefined' && /Windows/i.test(navigator.userAgent)
}

async function runCmd(candidates: string[], args: string[]): Promise<{ code: number | null; out: string }> {
  let last: unknown
  for (const name of candidates) {
    try {
      const result = await Command.create(name, args).execute()
      return { code: result.code, out: [result.stdout, result.stderr].filter(Boolean).join('\n') }
    }
    catch (e) { last = e }
  }
  throw last
}

async function runDoctor() {
  running.value = true
  const list: DoctorCheck[] = []
  const win = isWin()

  // Codex
  try {
    const r = await runCmd(win ? ['codex-cmd-version', 'codex-version'] : ['codex-version'], ['--version'])
    list.push({ id: 'codex', label: 'Codex CLI', detail: r.code === 0 ? 'Codex is installed.' : 'Codex not found.', status: r.code === 0 ? 'ok' : 'error' })
  }
  catch { list.push({ id: 'codex', label: 'Codex CLI', detail: 'Not found. Install it to enable AI security scans.', status: 'error' }) }

  // Claude
  try {
    const r = await runCmd(win ? ['claude-cmd-version', 'claude-version-check'] : ['claude-version-check'], ['--version'])
    list.push({ id: 'claude', label: 'Claude Code', detail: r.code === 0 ? 'Claude Code is installed.' : 'Claude Code not found.', status: r.code === 0 ? 'ok' : 'error' })
  }
  catch { list.push({ id: 'claude', label: 'Claude Code', detail: 'Not found. Install it to enable Claude-powered scans.', status: 'error' }) }

  // OpenRouter
  list.push({
    id: 'openrouter',
    label: 'OpenRouter',
    detail: app.openRouter.enabled && app.openRouter.apiKey ? `Configured — model: ${app.openRouter.model}` : 'API key not set. Configure it in AI Models.',
    status: app.openRouter.enabled && app.openRouter.apiKey ? 'ok' : 'warning',
  })

  // Ollama
  try {
    const base = (app.ollama.url || 'http://localhost:11434').replace(/\/$/, '')
    const res = await fetch(`${base}/api/tags`)
    if (res.ok) {
      const data = await res.json() as { models?: { name: string }[] }
      list.push({ id: 'ollama', label: 'Ollama', detail: `Connected — ${data.models?.length ?? 0} model(s) available.`, status: 'ok' })
    }
    else {
      throw new Error(`HTTP ${res.status}`)
    }
  }
  catch { list.push({ id: 'ollama', label: 'Ollama', detail: app.ollama.url ? `Not reachable at ${app.ollama.url}. Make sure Ollama is running.` : 'Not configured. Download from ollama.com/download.', status: 'warning' }) }

  checks.value = list
  running.value = false
}

async function tryInstallCli(pkgName: string, which: 'codex' | 'claude') {
  const win = isWin()
  const suffix = which === 'codex' ? 'codex' : 'claude-code'
  const npm = win ? [`npm-cmd-install-${suffix}`, `npm-install-${suffix}`] : [`npm-install-${suffix}`]
  const pnpm = win ? [`pnpm-cmd-install-${suffix}`, `pnpm-install-${suffix}`] : [`pnpm-install-${suffix}`]

  for (const name of [...pnpm, ...npm]) {
    try {
      const r = await Command.create(name, []).execute()
      if (r.code === 0) return true
    }
    catch { /* try next */ }
  }
  return false
}

async function installCodex() {
  codexInstalling.value = true
  try {
    const ok = await tryInstallCli('@openai/codex', 'codex')
    if (ok) { notify('Codex installed.', 'success'); await runDoctor() }
    else { notify('Install failed — open AI Models for manual options.', 'error') }
  }
  finally { codexInstalling.value = false }
}

async function installClaude() {
  claudeInstalling.value = true
  try {
    const ok = await tryInstallCli('@anthropic-ai/claude-code', 'claude')
    if (ok) { notify('Claude Code installed.', 'success'); await runDoctor() }
    else {
      const { open } = await import('@tauri-apps/plugin-shell')
      await open('https://claude.ai/download').catch(() => {})
      notify('Opening claude.ai/download in your browser.', 'info')
    }
  }
  finally { claudeInstalling.value = false }
}

async function openOllama() {
  try {
    const { open } = await import('@tauri-apps/plugin-shell')
    await open('https://ollama.com/download')
  }
  catch { /* browser dev mode */ }
}

async function dismiss() {
  await app.dismissDoctorModal()
  emit('close')
}

onMounted(() => void runDoctor())
</script>

<template>
  <GlassModal :model-value="true" title="Setup Check" max-width="md" @close="dismiss">
    <div class="space-y-4">
      <div class="flex items-center gap-3 rounded-xl border border-indigo-500/20 bg-indigo-500/[0.06] p-3">
        <Stethoscope class="size-4 shrink-0 text-indigo-300" />
        <div>
          <p class="text-xs font-semibold text-[var(--text)]">{{ summary }}</p>
          <p class="mt-0.5 text-[10px] text-[var(--text-muted)]">Fix any issues here or in Settings → Doctor later.</p>
        </div>
        <button
          class="ml-auto grid size-6 place-items-center rounded text-[var(--text-faint)] transition-colors hover:text-[var(--text)]"
          :disabled="running"
          @click="runDoctor"
        >
          <Loader2 v-if="running" class="size-3.5 animate-spin" />
          <Wrench v-else class="size-3.5" />
        </button>
      </div>

      <div v-if="running && !checks.length" class="flex justify-center py-4">
        <Loader2 class="size-5 animate-spin text-indigo-400/50" />
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="check in checks"
          :key="check.id"
          class="flex items-start gap-3 rounded-lg border px-3 py-2.5"
          :class="check.status === 'ok'
            ? 'border-emerald-500/15 bg-emerald-500/5'
            : check.status === 'warning'
              ? 'border-amber-500/20 bg-amber-500/5'
              : 'border-red-500/20 bg-red-500/5'"
        >
          <CheckCircle2 v-if="check.status === 'ok'" class="mt-0.5 size-3.5 shrink-0 text-emerald-400" />
          <AlertTriangle v-else-if="check.status === 'warning'" class="mt-0.5 size-3.5 shrink-0 text-amber-400" />
          <XCircle v-else class="mt-0.5 size-3.5 shrink-0 text-red-400" />
          <div class="min-w-0 flex-1">
            <p class="text-xs font-medium text-[var(--text)]">{{ check.label }}</p>
            <p class="mt-0.5 text-[10px] text-[var(--text-muted)]">{{ check.detail }}</p>
          </div>
          <button
            v-if="check.id === 'codex' && check.status !== 'ok'"
            class="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-1.5 text-[10px] font-medium text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:opacity-60"
            :disabled="codexInstalling || running"
            @click="installCodex"
          >
            <Loader2 v-if="codexInstalling" class="size-3 animate-spin" />
            <Download v-else class="size-3" />
            Install
          </button>
          <button
            v-if="check.id === 'claude' && check.status !== 'ok'"
            class="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-violet-500/20 bg-violet-500/10 px-2 py-1.5 text-[10px] font-medium text-violet-300 transition-colors hover:bg-violet-500/20 disabled:opacity-60"
            :disabled="claudeInstalling || running"
            @click="installClaude"
          >
            <Loader2 v-if="claudeInstalling" class="size-3 animate-spin" />
            <Download v-else class="size-3" />
            Install
          </button>
          <button
            v-if="check.id === 'ollama' && check.status !== 'ok'"
            class="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-orange-500/20 bg-orange-500/10 px-2 py-1.5 text-[10px] font-medium text-orange-300 transition-colors hover:bg-orange-500/20"
            @click="openOllama"
          >
            <Download class="size-3" />
            Download
          </button>
        </div>
      </div>

      <div class="flex justify-end gap-2 border-t border-[var(--border)] pt-3">
        <GlassButton variant="ghost" size="sm" @click="dismiss">
          Skip for now
        </GlassButton>
        <GlassButton size="sm" @click="dismiss">
          <CheckCircle2 class="size-3.5" />
          Done
        </GlassButton>
      </div>
    </div>
  </GlassModal>
</template>
