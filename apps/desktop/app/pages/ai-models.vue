<script setup lang="ts">
import { AlertTriangle, Bot, CheckCircle2, Circle, Download, ExternalLink, Loader2, RefreshCw, Router, Save, Volume2, Zap } from 'lucide-vue-next'
import { Command } from '@tauri-apps/plugin-shell'

const app = useAppStore()
const { notify } = useNotifications()

interface ModelStatus {
  id: string
  name: string
  vendor: string
  description: string
  checkCmd: string
  checkArgs: string[]
  installUrl: string
  docsUrl: string
  color: string
  bg: string
  border: string
  version: string | null
  status: 'checking' | 'available' | 'unavailable' | 'idle'
  error: string | null
}

const models = ref<ModelStatus[]>([
  {
    id: 'claude',
    name: 'Claude Code',
    vendor: 'Anthropic',
    description: 'Claude\'s official CLI for AI-assisted development and security scanning. Streams structured JSON output. Powers Vindicter\'s Claude integration.',
    checkCmd: 'claude',
    checkArgs: ['--version'],
    installUrl: 'https://claude.ai/download',
    docsUrl: 'https://docs.anthropic.com/en/docs/claude-code',
    color: 'text-violet-300',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    version: null,
    status: 'idle',
    error: null,
  },
  {
    id: 'codex',
    name: 'Codex',
    vendor: 'OpenAI',
    description: 'OpenAI\'s Codex CLI for AI-powered code analysis and security review. Supports sandboxed read-only execution. Powers Vindicter\'s Codex integration.',
    checkCmd: 'codex',
    checkArgs: ['--version'],
    installUrl: 'https://github.com/openai/codex',
    docsUrl: 'https://github.com/openai/codex#readme',
    color: 'text-emerald-300',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    version: null,
    status: 'idle',
    error: null,
  },
])

const openRouterStatus = {
  name: 'OpenRouter',
  vendor: 'OpenRouter.ai',
  description: 'Unified API gateway for 200+ AI models. Will allow Vindicter to route security scans to any supported model — Mistral, Llama, Gemini, and more.',
}

// Ollama
const ollamaUrl = ref(app.ollama.url)
const ollamaModel = ref(app.ollama.model)
const ollamaChecking = ref(false)
const ollamaError = ref('')
const ollamaOk = ref(false)
const ollamaAvailableModels = ref<string[]>([])

async function saveOllama() {
  await app.setOllama({
    url: ollamaUrl.value.trim() || 'http://localhost:11434',
    model: ollamaModel.value.trim() || 'llama3.2',
  })
  notify('Ollama settings saved.', 'success')
}

async function checkOllama() {
  ollamaChecking.value = true
  ollamaError.value = ''
  ollamaOk.value = false
  ollamaAvailableModels.value = []
  try {
    await saveOllama()
    const base = (ollamaUrl.value.trim() || 'http://localhost:11434').replace(/\/$/, '')
    const response = await fetch(`${base}/api/tags`)
    if (!response.ok) throw new Error(`Ollama returned HTTP ${response.status}`)
    const data = await response.json()
    ollamaAvailableModels.value = (data?.models ?? []).map((m: any) => m?.name ?? '').filter(Boolean)
    ollamaOk.value = true
    notify('Ollama connection verified.', 'success')
  }
  catch (e: any) {
    ollamaError.value = e?.message ?? 'Could not reach Ollama. Make sure it is running.'
  }
  finally {
    ollamaChecking.value = false
  }
}

const openRouterEnabled = ref(app.openRouter.enabled)
const openRouterApiKey = ref(app.openRouter.apiKey)
const openRouterModel = ref(app.openRouter.model)
const openRouterChecking = ref(false)
const openRouterError = ref('')
const openRouterOk = ref(false)

function isWindowsRuntime() {
  return typeof navigator !== 'undefined' && /Windows/i.test(navigator.userAgent)
}

async function windowsCodexEntrypoint() {
  const { homeDir } = await import('@tauri-apps/api/path')
  const home = (await homeDir()).replace(/[\\/]$/, '')
  return `${home}\\AppData\\Roaming\\npm\\node_modules\\@openai\\codex\\bin\\codex.js`
}

async function tryCapability(capabilityName: string, args: string[]): Promise<string> {
  const output = await Command.create(capabilityName, args).execute()
  const text = [output.stdout, output.stderr].filter(Boolean).join('\n')
  if (output.code !== 0) throw new Error(text || `${capabilityName} exited with code ${output.code}`)
  return text
}

async function checkModel(model: ModelStatus) {
  model.status = 'checking'
  model.version = null
  model.error = null

  const capabilities = model.id === 'claude'
    ? (isWindowsRuntime()
        ? [{ name: 'claude-cmd-version', args: model.checkArgs }, { name: 'claude-version-check', args: model.checkArgs }]
        : [{ name: 'claude-version-check', args: model.checkArgs }])
    : (isWindowsRuntime()
        ? [
            { name: 'node-codex-version', args: [await windowsCodexEntrypoint(), ...model.checkArgs] },
            { name: 'codex-cmd-version', args: model.checkArgs },
            { name: 'codex-version', args: model.checkArgs },
          ]
        : [{ name: 'codex-version', args: model.checkArgs }])

  let lastError: any = null
  for (const cap of capabilities) {
    try {
      const output = await tryCapability(cap.name, cap.args)
      const match = output.match(/\d+\.\d+[\.\d]*/)?.[0]
      model.version = match ?? 'installed'
      model.status = 'available'
      return
    }
    catch (e: any) {
      lastError = e
    }
  }

  // All variants failed
  const msg = String(lastError?.message ?? lastError ?? '')
  const lower = msg.toLowerCase()
  if (lower.includes('not found') || lower.includes('enoent') || lower.includes('not allowed')) {
    model.status = 'unavailable'
    model.error = 'CLI not found in PATH. Install it and restart the app.'
  }
  else {
    model.status = 'unavailable'
    model.error = msg || 'Failed to check CLI status.'
  }
}

async function checkAll() {
  await Promise.all(models.value.map(m => checkModel(m)))
}

async function saveOpenRouter() {
  await app.setOpenRouter({
    enabled: openRouterEnabled.value,
    apiKey: openRouterApiKey.value.trim(),
    model: openRouterModel.value.trim() || 'openai/gpt-4.1-mini',
  })
  notify('OpenRouter settings saved.', 'success')
}

async function checkOpenRouter() {
  openRouterChecking.value = true
  openRouterError.value = ''
  openRouterOk.value = false
  try {
    await saveOpenRouter()
    if (!openRouterApiKey.value.trim()) throw new Error('Add an OpenRouter API key first.')
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { Authorization: `Bearer ${openRouterApiKey.value.trim()}` },
    })
    if (!response.ok) throw new Error(`OpenRouter returned HTTP ${response.status}`)
    openRouterOk.value = true
    notify('OpenRouter connection verified.', 'success')
  }
  catch (e: any) {
    openRouterError.value = e?.message ?? 'Could not verify OpenRouter.'
  }
  finally {
    openRouterChecking.value = false
  }
}

// ── Kokoro TTS ─────────────────────────────────────────────────────────────

const KOKORO_HF_BASE = 'https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main'
const KOKORO_VOICE_IDS = [
  'af_heart', 'af_bella', 'af_nicole', 'af_sarah', 'af_kore',
  'af_aoede', 'af_nova', 'af_sky', 'af_alloy', 'af_river', 'af_jessica',
  'am_fenrir', 'am_michael', 'am_puck', 'am_echo', 'am_eric',
  'am_liam', 'am_onyx', 'am_adam', 'am_santa',
  'bf_emma', 'bf_isabella', 'bf_alice', 'bf_lily',
  'bm_fable', 'bm_george', 'bm_daniel', 'bm_lewis',
]

interface KokoroCoreFile { path: string; label: string; cached: boolean | null }

const kokoroCoreFiles = ref<KokoroCoreFile[]>([
  { path: 'config.json',              label: 'config.json',               cached: null },
  { path: 'tokenizer.json',           label: 'tokenizer.json',            cached: null },
  { path: 'tokenizer_config.json',    label: 'tokenizer_config.json',     cached: null },
  { path: 'onnx/model_quantized.onnx', label: 'model_quantized.onnx (~82 MB)', cached: null },
])

const kokoroVoicesCached  = ref(0)
const kokoroChecking      = ref(false)
const kokoroDownloading   = ref(false)
const kokoroDownloadMsg   = ref('')
const kokoroDownloadDone  = ref(0)
const kokoroDownloadTotal = ref(0)

const kokoroCoreReady  = computed(() => kokoroCoreFiles.value.every(f => f.cached === true))
const kokoroVoicesReady = computed(() => kokoroVoicesCached.value >= KOKORO_VOICE_IDS.length)
const kokoroAllReady   = computed(() => kokoroCoreReady.value && kokoroVoicesReady.value)

async function checkKokoroCache() {
  if (typeof caches === 'undefined') return
  kokoroChecking.value = true
  try {
    const tc = await caches.open('transformers-cache')
    const vc = await caches.open('kokoro-voices')
    for (const file of kokoroCoreFiles.value) {
      file.cached = !!(await tc.match(`${KOKORO_HF_BASE}/${file.path}`))
    }
    let count = 0
    for (const id of KOKORO_VOICE_IDS) {
      if (await vc.match(`${KOKORO_HF_BASE}/voices/${id}.bin`)) count++
    }
    kokoroVoicesCached.value = count
  } catch (e) {
    console.warn('[AI Models] Kokoro cache check failed:', e)
  } finally {
    kokoroChecking.value = false
  }
}

/**
 * Download a single URL via the Rust `download_to_temp` command (uses reqwest —
 * completely bypasses WebView CSP / WebView2 network restrictions), then reads
 * the temp file with the Tauri fs plugin and stores the bytes in the given
 * Browser Cache under the original URL key.
 */
async function downloadAndCache(cacheStore: Cache, url: string): Promise<void> {
  const { invoke } = await import('@tauri-apps/api/core')
  const { readFile, remove } = await import('@tauri-apps/plugin-fs')

  // Download via Rust — returns absolute path of temp file
  const tmpPath = await invoke<string>('download_to_temp', { url })

  try {
    // Read binary from temp file
    const bytes = await readFile(tmpPath)
    // Wrap in a synthetic Response that the Cache API will accept
    const response = new Response(new Uint8Array(bytes), {
      status: 200,
      headers: { 'Content-Type': 'application/octet-stream' },
    })
    await cacheStore.put(url, response)
  }
  finally {
    // Always clean up temp file, even on cache write failure
    try { await remove(tmpPath) } catch { /* best effort */ }
  }
}

async function downloadKokoro() {
  if (typeof caches === 'undefined') {
    notify('Browser Cache API is not available in this context.', 'error')
    return
  }
  kokoroDownloading.value  = true
  kokoroDownloadDone.value  = 0
  kokoroDownloadTotal.value = kokoroCoreFiles.value.length + KOKORO_VOICE_IDS.length

  try {
    const tc = await caches.open('transformers-cache')
    const vc = await caches.open('kokoro-voices')

    // Core model files — sequential because model_quantized.onnx is ~82 MB
    for (const file of kokoroCoreFiles.value) {
      const url = `${KOKORO_HF_BASE}/${file.path}`
      kokoroDownloadMsg.value = `Downloading ${file.label}…`
      if (!(await tc.match(url))) {
        await downloadAndCache(tc, url)
        file.cached = true
      }
      else {
        file.cached = true
      }
      kokoroDownloadDone.value++
    }

    // Voice files — 4 concurrent downloads
    const BATCH = 4
    for (let i = 0; i < KOKORO_VOICE_IDS.length; i += BATCH) {
      const batch = KOKORO_VOICE_IDS.slice(i, i + BATCH)
      kokoroDownloadMsg.value = `Downloading voices (${Math.min(i + BATCH, KOKORO_VOICE_IDS.length)}/${KOKORO_VOICE_IDS.length})…`
      await Promise.all(batch.map(async (id) => {
        const url = `${KOKORO_HF_BASE}/voices/${id}.bin`
        if (!(await vc.match(url))) {
          await downloadAndCache(vc, url)
        }
        kokoroDownloadDone.value++
      }))
    }

    kokoroDownloadMsg.value = ''
    notify('Kokoro TTS files downloaded successfully.', 'success')
    await checkKokoroCache()
  }
  catch (e: any) {
    kokoroDownloadMsg.value = ''
    notify(`Kokoro download failed: ${e?.message ?? String(e)}`, 'error')
  }
  finally {
    kokoroDownloading.value = false
  }
}

onMounted(() => {
  void checkAll()
  if (typeof caches !== 'undefined') void checkKokoroCache()
})
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-6 pb-8">
    <!-- Header -->
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-start gap-3">
        <div class="grid size-10 shrink-0 place-items-center rounded-xl border border-violet-500/20 bg-violet-500/10">
          <Bot class="size-5 text-violet-300" />
        </div>
        <div>
          <h1 class="font-display text-lg font-bold text-[var(--text)]">AI Models</h1>
          <p class="text-xs text-[var(--text-muted)]">Status and configuration for AI tools used in security scanning.</p>
        </div>
      </div>
      <button
        class="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-muted)] transition-colors hover:bg-white/[0.05] hover:text-[var(--text)]"
        @click="checkAll"
      >
        <RefreshCw class="size-3.5" />
        Refresh
      </button>
    </div>

    <!-- Active integrations -->
    <div class="space-y-3">
      <p class="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-faint)]">Active Integrations</p>
      <div
        v-for="model in models"
        :key="model.id"
        class="rounded-xl border bg-[var(--bg-card)] p-5 transition-colors"
        :class="model.border"
      >
        <div class="flex items-start gap-4">
          <!-- Status indicator -->
          <div
            class="mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl border"
            :class="[model.bg, model.border]"
          >
            <Loader2 v-if="model.status === 'checking'" class="size-5 animate-spin" :class="model.color" />
            <CheckCircle2 v-else-if="model.status === 'available'" class="size-5" :class="model.color" />
            <AlertTriangle v-else-if="model.status === 'unavailable'" class="size-5 text-amber-400" />
            <Circle v-else class="size-5 text-[var(--text-faint)]" />
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <p class="text-sm font-semibold text-[var(--text)]">{{ model.name }}</p>
              <span class="text-[10px] text-[var(--text-faint)]">by {{ model.vendor }}</span>
              <!-- Status badge -->
              <span
                class="ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold"
                :class="model.status === 'available'
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : model.status === 'unavailable'
                    ? 'bg-amber-500/15 text-amber-300'
                    : model.status === 'checking'
                      ? 'bg-indigo-500/15 text-indigo-300'
                      : 'bg-white/[0.06] text-[var(--text-faint)]'"
              >
                {{ model.status === 'available' ? (model.version ? `v${model.version}` : 'Available') : model.status === 'unavailable' ? 'Not found' : model.status === 'checking' ? 'Checking…' : 'Idle' }}
              </span>
            </div>

            <p class="mt-1.5 text-xs leading-relaxed text-[var(--text-muted)]">{{ model.description }}</p>

            <!-- Error message -->
            <div v-if="model.error" class="mt-2.5 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2">
              <AlertTriangle class="size-3.5 text-amber-400 mt-0.5 shrink-0" />
              <p class="text-xs text-amber-200">{{ model.error }}</p>
            </div>

            <!-- Links -->
            <div class="mt-3 flex items-center gap-3">
              <a
                :href="model.installUrl"
                target="_blank"
                class="inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
              >
                <Zap class="size-3" />
                Install
              </a>
              <a
                :href="model.docsUrl"
                target="_blank"
                class="inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
              >
                <ExternalLink class="size-3" />
                Docs
              </a>
              <button
                class="ml-auto inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)] transition-colors hover:text-[var(--text)] disabled:opacity-40"
                :disabled="model.status === 'checking'"
                @click="checkModel(model)"
              >
                <RefreshCw class="size-3" :class="model.status === 'checking' ? 'animate-spin' : ''" />
                Re-check
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- OpenRouter -->
    <div class="space-y-3">
      <p class="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-faint)]">API Integrations</p>
      <div class="rounded-xl border border-sky-500/20 bg-[var(--bg-card)] p-5">
        <div class="flex items-start gap-4">
          <div class="grid size-10 shrink-0 place-items-center rounded-xl border border-sky-500/20 bg-sky-500/10">
            <Router class="size-5 text-sky-300" />
          </div>
          <div class="flex-1 min-w-0 space-y-4">
            <div class="flex items-center gap-2 flex-wrap">
              <p class="text-sm font-semibold text-[var(--text)]">{{ openRouterStatus.name }}</p>
              <span class="text-[10px] text-[var(--text-faint)]">by {{ openRouterStatus.vendor }}</span>
              <span
                class="ml-auto rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                :class="openRouterOk
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                  : openRouterEnabled
                    ? 'border-sky-500/20 bg-sky-500/10 text-sky-300'
                    : 'border-[var(--border)] bg-white/[0.04] text-[var(--text-faint)]'"
              >
                {{ openRouterOk ? 'Verified' : openRouterEnabled ? 'Enabled' : 'Disabled' }}
              </span>
            </div>
            <p class="mt-1.5 text-xs leading-relaxed text-[var(--text-muted)]">{{ openRouterStatus.description }}</p>

            <div class="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <GlassInput v-model="openRouterApiKey" label="API key" type="password" placeholder="sk-or-..." />
              <GlassInput v-model="openRouterModel" label="Model" placeholder="openai/gpt-4.1-mini" />
              <GlassCheckbox v-model="openRouterEnabled" size="sm" class="items-end pb-2 text-xs text-[var(--text-muted)]">
                Enabled
              </GlassCheckbox>
            </div>

            <div v-if="openRouterError" class="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2">
              <AlertTriangle class="size-3.5 text-amber-400 mt-0.5 shrink-0" />
              <p class="text-xs text-amber-200">{{ openRouterError }}</p>
            </div>

            <div class="flex flex-wrap gap-2">
              <GlassButton size="sm" variant="ghost" @click="saveOpenRouter">
                <Save class="size-3.5" />
                Save
              </GlassButton>
              <GlassButton size="sm" :disabled="openRouterChecking" @click="checkOpenRouter">
                <Loader2 v-if="openRouterChecking" class="size-3.5 animate-spin" />
                <RefreshCw v-else class="size-3.5" />
                Verify
              </GlassButton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Ollama -->
    <div class="rounded-xl border border-orange-500/20 bg-[var(--bg-card)] p-5">
      <div class="flex items-start gap-4">
        <div class="grid size-10 shrink-0 place-items-center rounded-xl border border-orange-500/20 bg-orange-500/10">
          <Bot class="size-5 text-orange-300" />
        </div>
        <div class="flex-1 min-w-0 space-y-4">
          <div class="flex items-center gap-2 flex-wrap">
            <p class="text-sm font-semibold text-[var(--text)]">Ollama</p>
            <span class="text-[10px] text-[var(--text-faint)]">Local AI Server</span>
            <span
              class="ml-auto rounded-full border px-2 py-0.5 text-[10px] font-semibold"
              :class="ollamaOk
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                : ollamaUrl
                  ? 'border-orange-500/20 bg-orange-500/10 text-orange-300'
                  : 'border-[var(--border)] bg-white/[0.04] text-[var(--text-faint)]'"
            >
              {{ ollamaOk ? 'Connected' : ollamaUrl ? 'Configured' : 'Not set' }}
            </span>
          </div>
          <p class="text-xs leading-relaxed text-[var(--text-muted)]">
            Run LLMs locally via Ollama. Powers the Academy professor and AI security scans without sending data to external APIs. Requires Ollama running on your machine.
          </p>

          <div class="grid gap-3 sm:grid-cols-2">
            <GlassInput v-model="ollamaUrl" label="Server URL" placeholder="http://localhost:11434" />
            <GlassInput v-model="ollamaModel" label="Model" placeholder="llama3.2" />
          </div>

          <div v-if="ollamaAvailableModels.length" class="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] px-3 py-2">
            <p class="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-emerald-300/70">Available models</p>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="m in ollamaAvailableModels"
                :key="m"
                class="rounded border px-2 py-0.5 text-[10px] transition-colors"
                :class="ollamaModel === m
                  ? 'border-orange-500/40 bg-orange-500/15 text-orange-200'
                  : 'border-[var(--border)] text-[var(--text-muted)] hover:border-orange-500/25 hover:text-orange-300'"
                @click="ollamaModel = m"
              >
                {{ m }}
              </button>
            </div>
          </div>

          <div v-if="ollamaError" class="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2">
            <AlertTriangle class="size-3.5 text-amber-400 mt-0.5 shrink-0" />
            <p class="text-xs text-amber-200">{{ ollamaError }}</p>
          </div>

          <div class="flex flex-wrap gap-2">
            <GlassButton size="sm" variant="ghost" @click="saveOllama">
              <Save class="size-3.5" />
              Save
            </GlassButton>
            <GlassButton size="sm" :disabled="ollamaChecking" @click="checkOllama">
              <Loader2 v-if="ollamaChecking" class="size-3.5 animate-spin" />
              <RefreshCw v-else class="size-3.5" />
              Verify
            </GlassButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Kokoro TTS -->
    <div class="space-y-3">
      <p class="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-faint)]">Local TTS Models</p>
      <div class="rounded-xl border border-teal-500/20 bg-[var(--bg-card)] p-5">
        <div class="flex items-start gap-4">
          <!-- Icon -->
          <div class="mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl border border-teal-500/20 bg-teal-500/10">
            <Volume2 class="size-5 text-teal-300" />
          </div>

          <div class="flex-1 min-w-0 space-y-4">
            <!-- Title row -->
            <div class="flex items-center gap-2 flex-wrap">
              <p class="text-sm font-semibold text-[var(--text)]">Kokoro TTS</p>
              <span class="rounded-full border border-teal-500/20 bg-teal-500/10 px-2 py-0.5 text-[9px] font-semibold text-teal-300">Narration</span>
              <span
                class="ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold"
                :class="kokoroChecking
                  ? 'bg-indigo-500/15 text-indigo-300'
                  : kokoroAllReady
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : 'bg-amber-500/15 text-amber-300'"
              >
                {{ kokoroChecking ? 'Checking…' : kokoroAllReady ? 'Ready' : 'Incomplete' }}
              </span>
              <button
                class="flex items-center gap-1 text-[11px] text-[var(--text-muted)] transition-colors hover:text-[var(--text)] disabled:opacity-40"
                :disabled="kokoroChecking || kokoroDownloading"
                @click="checkKokoroCache"
              >
                <RefreshCw class="size-3" :class="kokoroChecking ? 'animate-spin' : ''" />
                Refresh
              </button>
            </div>

            <p class="text-xs leading-relaxed text-[var(--text-muted)]">
              Kokoro-82M ONNX — offline text-to-speech model for Academy lesson narration. Runs entirely in-browser via WebGPU or WebAssembly. Required for the TTS feature in the Academy.
            </p>

            <!-- Core file list -->
            <div class="space-y-1.5">
              <p class="text-[10px] font-semibold text-[var(--text-faint)] uppercase tracking-widest">Model Files</p>
              <div class="space-y-1">
                <div
                  v-for="file in kokoroCoreFiles"
                  :key="file.path"
                  class="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white/[0.02] px-3 py-1.5"
                >
                  <Loader2 v-if="file.cached === null" class="size-3 animate-spin text-[var(--text-faint)]" />
                  <CheckCircle2 v-else-if="file.cached" class="size-3 text-emerald-400 shrink-0" />
                  <Circle v-else class="size-3 text-[var(--text-faint)] shrink-0" />
                  <span class="flex-1 font-mono text-[11px] text-[var(--text-muted)]">{{ file.label }}</span>
                  <span v-if="file.cached" class="text-[9px] text-emerald-400/70">cached</span>
                  <span v-else-if="file.cached === false" class="text-[9px] text-amber-400/70">missing</span>
                </div>
              </div>
            </div>

            <!-- Voice files row -->
            <div class="flex items-center justify-between rounded-lg border border-[var(--border)] bg-white/[0.02] px-3 py-2">
              <div class="flex items-center gap-2">
                <CheckCircle2 v-if="kokoroVoicesReady" class="size-3 text-emerald-400" />
                <Circle v-else class="size-3 text-[var(--text-faint)]" />
                <span class="text-[11px] text-[var(--text-muted)]">Voice files ({{ KOKORO_VOICE_IDS.length }})</span>
              </div>
              <span
                class="text-[10px] font-semibold"
                :class="kokoroVoicesReady ? 'text-emerald-400' : 'text-amber-400/80'"
              >
                {{ kokoroVoicesCached }}/{{ KOKORO_VOICE_IDS.length }} cached
              </span>
            </div>

            <!-- Download progress -->
            <div v-if="kokoroDownloading" class="space-y-2">
              <div class="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
                <div
                  class="h-full rounded-full bg-teal-500 transition-all duration-300"
                  :style="{ width: kokoroDownloadTotal > 0 ? (kokoroDownloadDone / kokoroDownloadTotal * 100) + '%' : '0%' }"
                />
              </div>
              <p v-if="kokoroDownloadMsg" class="text-[10px] text-[var(--text-faint)]">{{ kokoroDownloadMsg }}</p>
            </div>

            <!-- Warning note -->
            <div class="flex items-start gap-2 rounded-lg border border-amber-500/15 bg-amber-500/[0.04] px-3 py-2.5">
              <AlertTriangle class="mt-0.5 size-3.5 shrink-0 text-amber-400/80" />
              <p class="text-[11px] leading-relaxed text-[var(--text-muted)]">
                First download is ~250 MB and may take 10–20 minutes on slower connections. Voice files (~1–3 MB each) download in parallel. All files are cached locally after the first download.
              </p>
            </div>

            <!-- Action buttons -->
            <div class="flex flex-wrap gap-2">
              <GlassButton
                size="sm"
                :disabled="kokoroDownloading"
                @click="downloadKokoro"
              >
                <Loader2 v-if="kokoroDownloading" class="size-3.5 animate-spin" />
                <Download v-else class="size-3.5" />
                {{ kokoroAllReady ? 'Re-download' : 'Download Model Files' }}
              </GlassButton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Info panel -->
    <div class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-2">
      <p class="text-xs font-semibold text-[var(--text)]">How AI models are used</p>
      <p class="text-xs leading-relaxed text-[var(--text-muted)]">
        Vindicter can use locally installed AI CLIs (Claude Code, Codex) or the configured OpenRouter API model for AI-assisted workflows such as Academy and security scans.
      </p>
      <p class="text-xs leading-relaxed text-[var(--text-muted)]">
        If a CLI shows "Not found", install it globally and ensure it's accessible on your system PATH. Restart Vindicter after installation.
      </p>
    </div>
  </div>
</template>
