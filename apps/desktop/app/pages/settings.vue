<script setup lang="ts">
import { Sun, Moon, Database, ChevronDown, ChevronUp, FolderOpen, Stethoscope, CheckCircle2, AlertTriangle, XCircle, Wrench, Loader2, Terminal, Download, Github, Heart, Eye, Plug, Zap, Rss, Plus, Trash2 } from 'lucide-vue-next'

const app = useAppStore()
const user = useUserStore()
const projects = useProjectsStore()
const academy = useAcademyStore()
const router = useRouter()
const { notify } = useNotifications()

type SettingsTab = 'general' | 'news' | 'wsl' | 'updates' | 'diagnostics' | 'data'
const activeSettingsTab = ref<SettingsTab>('general')
const settingsTabs: { id: SettingsTab; label: string; description: string }[] = [
  { id: 'general',     label: 'General',     description: 'Theme, startup, navigation, and notifications' },
  { id: 'news',        label: 'News',        description: 'Security RSS sources for Home' },
  { id: 'wsl',         label: 'WSL',         description: 'Backend profiles and cleanup' },
  { id: 'diagnostics', label: 'Doctor',      description: 'Local tooling health checks' },
  { id: 'data',        label: 'Data',        description: 'Raw data and reset actions' },
  { id: 'updates',     label: 'Updates',     description: 'Version, releases, and app information' },
]

// Notifications
const notifs = ref(app.notificationsEnabled)
watch(notifs, (v) => app.setNotifications(v))

// Startup
const autoStart = ref(false)
const autoStartLoading = ref(false)

async function loadAutoStart() {
  autoStartLoading.value = true
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    autoStart.value = await invoke<boolean>('auto_start_enabled')
  }
  catch {
    autoStart.value = false
  }
  finally {
    autoStartLoading.value = false
  }
}

async function setAutoStartPreference(value: boolean) {
  autoStartLoading.value = true
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    autoStart.value = await invoke<boolean>('set_auto_start', { enabled: value })
    notify(autoStart.value ? 'Vindicter will start after boot.' : 'Boot startup disabled.', 'success')
  }
  catch (e: any) {
    autoStart.value = !value
    notify(e?.message ?? 'Could not update boot startup.', 'error')
  }
  finally {
    autoStartLoading.value = false
  }
}

// MCP in sidebar
const mcpInSidebar = ref(app.mcpInSidebar)
watch(mcpInSidebar, (v) => app.setMcpInSidebar(v))

// RSS sources
const rssDrafts = ref(app.rssSources.map(source => ({ ...source })))

watch(() => app.rssSources, (sources) => {
  rssDrafts.value = sources.map(source => ({ ...source }))
}, { deep: true })

function addRssSource() {
  rssDrafts.value.push({
    id: `custom-${Date.now()}`,
    label: 'Security Feed',
    url: '',
    enabled: true,
  })
}

function removeRssSource(id: string) {
  rssDrafts.value = rssDrafts.value.filter(source => source.id !== id)
}

async function saveRssSources() {
  const sources = rssDrafts.value
    .map(source => ({
      ...source,
      label: source.label.trim() || 'Security Feed',
      url: source.url.trim(),
    }))
    .filter(source => source.url)
  await app.setRssSources(sources)
  notify('RSS sources saved.', 'success')
}

// WSL
interface WslDistro {
  name: string
  state: string
  version: string
  default: boolean
}

interface WslInfo {
  installed: boolean
  version: string
  defaultDistro: string
  distributions: WslDistro[]
  error?: string | null
}

const wslLoading = ref(false)
const wslPurging = ref(false)
const wslCleaningProfiles = ref(false)
const wslStarting = ref(false)
const wslPreparingPentest = ref(false)
const wslInfo = ref<WslInfo | null>(null)
const purgeDistro = ref('')
const confirmWslPurge = ref(false)
const cleanProfilesDistro = ref('')
const confirmCleanProfiles = ref(false)
const wslAutoStart = ref(app.wslAutoStart)

watch(wslAutoStart, (value) => app.setWslAutoStart(value))

const wslStatusText = computed(() => {
  if (wslLoading.value) return 'Checking WSL...'
  if (!wslInfo.value?.installed) return 'WSL is not installed or not available.'
  const count = wslInfo.value.distributions.length
  return `${wslInfo.value.version || 'WSL'} with ${count} distribution${count === 1 ? '' : 's'}.`
})

async function refreshWslInfo() {
  wslLoading.value = true
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    wslInfo.value = await invoke<WslInfo>('wsl_info')
    const defaultDistro = wslInfo.value.defaultDistro || wslInfo.value.distributions[0]?.name || ''
    if (!purgeDistro.value) purgeDistro.value = defaultDistro
    if (!cleanProfilesDistro.value) cleanProfilesDistro.value = defaultDistro
    if (wslInfo.value.installed) await app.ensureDefaultWslProfiles(defaultDistro)
  }
  catch (e: any) {
    wslInfo.value = {
      installed: false,
      version: '',
      defaultDistro: '',
      distributions: [],
      error: e?.message ?? String(e),
    }
  }
  finally {
    wslLoading.value = false
  }
}

async function startEnabledWslProfiles(showToast = true) {
  const profiles = app.wslProfiles.filter(profile => profile.enabled)
  if (!profiles.length) return
  wslStarting.value = true
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    await Promise.all(profiles.map(profile => invoke('wsl_start_distribution', { name: profile.distro || wslInfo.value?.defaultDistro || '' })))
    if (showToast) notify('Enabled WSL profiles are running in the background.', 'success')
    await refreshWslInfo()
  }
  catch (e: any) {
    notify(e?.message ?? 'Could not start WSL in the background.', 'error')
  }
  finally {
    wslStarting.value = false
  }
}

async function preparePentestWslAccount() {
  const profile = app.wslProfiles.find(item => item.id === 'pentest')
  if (!profile?.enabled) return
  wslPreparingPentest.value = true
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('wsl_ensure_pentest_backend', { distro: profile.distro || wslInfo.value?.defaultDistro || '' })
    notify('Pentest WSL account is ready.', 'success')
    await refreshWslInfo()
  }
  catch (e: any) {
    notify(e?.message ?? 'Could not prepare the pentest WSL account.', 'error')
  }
  finally {
    wslPreparingPentest.value = false
  }
}

async function cleanVindicterProfiles() {
  if (!cleanProfilesDistro.value || !confirmCleanProfiles.value) return
  wslCleaningProfiles.value = true
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    const result = await invoke<string>('wsl_purge_vindicta_profiles', { distro: cleanProfilesDistro.value })
    notify(result || 'Vindicter profiles removed from WSL.', 'success')
    confirmCleanProfiles.value = false
    await refreshWslInfo()
  }
  catch (e: any) {
    notify(e?.message ?? 'Could not clean Vindicter profiles.', 'error')
  }
  finally {
    wslCleaningProfiles.value = false
  }
}

async function purgeSelectedWsl() {
  if (!purgeDistro.value || !confirmWslPurge.value) return
  wslPurging.value = true
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('wsl_unregister_distribution', { name: purgeDistro.value })
    notify(`${purgeDistro.value} was unregistered from WSL.`, 'success')
    purgeDistro.value = ''
    confirmWslPurge.value = false
    await refreshWslInfo()
  }
  catch (e: any) {
    notify(e?.message ?? 'Could not unregister WSL distribution.', 'error')
  }
  finally {
    wslPurging.value = false
  }
}

async function saveWslProfileDistro(index: number, distro: string) {
  const next = app.wslProfiles.map((profile, i) => i === index ? { ...profile, distro } : profile)
  await app.setWslProfiles(next)
}

async function saveWslProfileEnabled(index: number, enabled: boolean) {
  const next = app.wslProfiles.map((profile, i) => i === index ? { ...profile, enabled } : profile)
  await app.setWslProfiles(next)
}

// Updates
const appVersion = ref('')
const updateChecking = ref(false)
const updateError = ref('')
const latestRelease = ref<{ tagName: string; htmlUrl: string; name: string } | null>(null)

const hasUpdate = computed(() => {
  if (!appVersion.value || !latestRelease.value?.tagName) return false
  return compareVersions(normalizeVersion(latestRelease.value.tagName), normalizeVersion(appVersion.value)) > 0
})

function normalizeVersion(value: string) {
  return value.trim().replace(/^v/i, '')
}

function compareVersions(a: string, b: string) {
  const left = a.split(/[.-]/).map(part => Number.parseInt(part, 10) || 0)
  const right = b.split(/[.-]/).map(part => Number.parseInt(part, 10) || 0)
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    const diff = (left[i] ?? 0) - (right[i] ?? 0)
    if (diff !== 0) return diff
  }
  return 0
}

async function checkForUpdates() {
  updateChecking.value = true
  updateError.value = ''
  try {
    const { getVersion } = await import('@tauri-apps/api/app')
    appVersion.value = await getVersion()
  }
  catch {
    appVersion.value = '0.1.0'
  }

  try {
    const response = await fetch('https://api.github.com/repos/surelle-ha/vindicter/releases/latest', {
      headers: { Accept: 'application/vnd.github+json' },
    })
    if (!response.ok) throw new Error(`GitHub returned HTTP ${response.status}`)
    const release = await response.json()
    latestRelease.value = {
      tagName: String(release.tag_name ?? ''),
      htmlUrl: String(release.html_url ?? 'https://github.com/surelle-ha/vindicter/releases'),
      name: String(release.name ?? release.tag_name ?? 'Latest release'),
    }
  }
  catch (e: any) {
    updateError.value = e?.message ?? 'Could not check GitHub releases.'
  }
  finally {
    updateChecking.value = false
  }
}

async function openLatestRelease() {
  const { open } = await import('@tauri-apps/plugin-shell')
  await open(latestRelease.value?.htmlUrl || 'https://github.com/surelle-ha/vindicter/releases')
}

async function openDataFolder() {
  try {
    const { open } = await import('@tauri-apps/plugin-shell')
    const { appLocalDataDir } = await import('@tauri-apps/api/path')
    const dir = await appLocalDataDir()
    await open(dir)
  } catch {
    // browser dev mode — no-op
  }
}

// Vigilante
const vigilanteWarningOpen = ref(false)

function onVigilanteToggle(e: Event) {
  const checked = (e.target as HTMLInputElement).checked
  if (checked) {
    // Opening — show confirmation modal first; don't enable yet
    vigilanteWarningOpen.value = true
    // Prevent the checkbox from visually changing until confirmed
    ;(e.target as HTMLInputElement).checked = false
  }
  else {
    void app.setVigilante(false)
  }
}

function confirmVigilante() {
  void app.setVigilante(true)
  vigilanteWarningOpen.value = false
}

function cancelVigilante() {
  vigilanteWarningOpen.value = false
}

// Doctor
type DoctorStatus = 'ok' | 'warning' | 'error'
interface DoctorCheck {
  id: string
  label: string
  detail: string
  status: DoctorStatus
  fixable: boolean
}

const doctorChecks = ref<DoctorCheck[]>([])
const doctorRunning = ref(false)
const doctorFixing = ref(false)
const codexInstalling = ref(false)
const codexInstallLog = ref('')
const claudeInstalling = ref(false)
const claudeInstallLog = ref('')
const ollamaInstalling = ref(false)

const doctorSummary = computed(() => {
  const errors = doctorChecks.value.filter(c => c.status === 'error').length
  const warnings = doctorChecks.value.filter(c => c.status === 'warning').length
  if (!doctorChecks.value.length) return 'Run checks to inspect local security tooling.'
  if (errors) return `${errors} error${errors !== 1 ? 's' : ''} found`
  if (warnings) return `${warnings} warning${warnings !== 1 ? 's' : ''} found`
  return 'Everything looks healthy.'
})

const canDoctorFix = computed(() => doctorChecks.value.some(c => c.fixable))
const codexCheck = computed(() => doctorChecks.value.find(c => c.id === 'codex'))
const claudeCheck = computed(() => doctorChecks.value.find(c => c.id === 'claude'))
const ollamaCheck = computed(() => doctorChecks.value.find(c => c.id === 'ollama'))
const shouldShowCodexInstaller = computed(() => !codexCheck.value || codexCheck.value.status !== 'ok')
const shouldShowClaudeInstaller = computed(() => !claudeCheck.value || claudeCheck.value.status !== 'ok')
const shouldShowOllamaInstaller = computed(() => !ollamaCheck.value || ollamaCheck.value.status !== 'ok')

function firstLine(value: string | undefined) {
  return (value ?? '').split('\n').map(line => line.trim()).find(Boolean) ?? ''
}

function codexHealthDetail(value: string | undefined) {
  const text = value ?? ''
  if (/@openai\/codex-win32-x64|Missing optional dependency/i.test(text)) {
    return 'Codex CLI is installed but its Windows runtime dependency is missing. Use Install/Repair Codex to reinstall @openai/codex@latest.'
  }
  return firstLine(text)
}

function isWindowsRuntime() {
  return typeof navigator !== 'undefined' && /Windows/i.test(navigator.userAgent)
}

async function runShellCommand(candidates: string[], args: string[]) {
  const { Command } = await import('@tauri-apps/plugin-shell')
  let lastError: unknown = null
  for (const name of candidates) {
    try {
      return await Command.create(name, args).execute()
    }
    catch (error) {
      lastError = error
    }
  }
  throw lastError
}

async function runCodexCli(args: string[]) {
  const commandName = args[0] === '--version' ? 'codex-version' : 'codex-login-status'
  const windowsCommandName = args[0] === '--version' ? 'codex-cmd-version' : 'codex-cmd-login-status'
  const candidates = isWindowsRuntime() ? [windowsCommandName, commandName] : [commandName]
  return runShellCommand(candidates, args)
}

async function runNpmCli(args: string[]) {
  const candidates = isWindowsRuntime() ? ['npm-cmd-version', 'npm-version'] : ['npm-version']
  return runShellCommand(candidates, args)
}

async function checkNpmHealth(): Promise<DoctorCheck> {
  try {
    const version = await runNpmCli(['--version'])
    if (version.code !== 0) {
      return {
        id: 'npm',
        label: 'npm',
        detail: firstLine(version.stderr) || 'npm did not respond to the version check. Codex install requires npm.',
        status: 'error',
        fixable: false,
      }
    }

    return {
      id: 'npm',
      label: 'npm',
      detail: `npm ${firstLine(version.stdout)} is available for installing Codex.`,
      status: 'ok',
      fixable: false,
    }
  }
  catch (e: any) {
    return {
      id: 'npm',
      label: 'npm',
      detail: e?.message
        ? `npm check failed: ${e.message}. Install Node.js/npm before using the Codex installer.`
        : 'npm is not available to Vindicter. Install Node.js/npm before using the Codex installer.',
      status: 'error',
      fixable: false,
    }
  }
}

async function checkCodexHealth(): Promise<DoctorCheck> {
  try {
    const version = await runCodexCli(['--version'])
    if (version.code !== 0) {
      return {
        id: 'codex',
        label: 'Codex',
        detail: codexHealthDetail([version.stdout, version.stderr].filter(Boolean).join('\n')) || 'Codex CLI did not respond to the version check.',
        status: 'error',
        fixable: false,
      }
    }

    const versionText = firstLine(version.stdout) || 'Codex CLI is installed'
    const login = await runCodexCli(['login', 'status'])
    const loginText = firstLine(login.stdout) || firstLine(login.stderr)
    const connected = login.code === 0 && /logged in|authenticated/i.test(loginText)

    return {
      id: 'codex',
      label: 'Codex',
      detail: connected
        ? `${versionText}; ${loginText}.`
        : `${versionText}; login status could not confirm a connected Codex account. Run codex login from a terminal.`,
      status: connected ? 'ok' : 'warning',
      fixable: false,
    }
  }
  catch (e: any) {
    return {
      id: 'codex',
      label: 'Codex',
      detail: e?.message
        ? `Codex health check failed: ${codexHealthDetail(e.message) || e.message}. Use Install/Repair Codex, or install @openai/codex@latest with npm and rerun Doctor.`
        : 'Codex CLI is not available to Vindicter. Use Install/Repair Codex, or install @openai/codex@latest with npm and rerun Doctor.',
      status: 'error',
      fixable: false,
    }
  }
}

async function tryInstallWithPackageManager(
  pkgName: string,
  candidates: { pnpmExec: string; npmExec: string },
): Promise<{ success: boolean; log: string }> {
  const isWin = isWindowsRuntime()
  const pnpmCandidates = isWin ? [candidates.pnpmExec + '.cmd', candidates.pnpmExec] : [candidates.pnpmExec]
  const npmCandidates = isWin ? [candidates.npmExec + '.cmd', candidates.npmExec] : [candidates.npmExec]

  // Try pnpm first, fall back to npm
  for (const name of [...pnpmCandidates, ...npmCandidates]) {
    try {
      const output = await runShellCommand([name], [])
      const log = [output.stdout, output.stderr].filter(Boolean).join('\n').trim()
      if (output.code === 0) return { success: true, log }
      return { success: false, log }
    }
    catch { /* try next */ }
  }
  return { success: false, log: `No package manager (pnpm/npm) found. Install Node.js first to get npm.` }
}

async function installCodexCli() {
  codexInstalling.value = true
  codexInstallLog.value = ''
  const isWin = isWindowsRuntime()
  try {
    // Try pnpm first, then npm
    const pnpmNames = isWin ? ['pnpm-cmd-install-codex', 'pnpm-install-codex'] : ['pnpm-install-codex']
    const npmNames = isWin ? ['npm-cmd-install-codex', 'npm-install-codex'] : ['npm-install-codex']

    let output: Awaited<ReturnType<typeof runShellCommand>> | null = null
    for (const name of [...pnpmNames, ...npmNames]) {
      try {
        output = await runShellCommand([name], [])
        break
      }
      catch { /* try next */ }
    }

    if (!output) {
      codexInstallLog.value = 'No package manager found (pnpm or npm). Install Node.js from https://nodejs.org to get npm, then retry.'
      notify('No package manager available. Install Node.js first.', 'error')
      return
    }

    codexInstallLog.value = [output.stdout, output.stderr].filter(Boolean).join('\n').trim()
    if (output.code === 0) {
      notify('Codex installed/repaired. Checking connection...', 'success')
      await runDoctor()
    }
    else {
      notify('Codex install failed. Check the installer output.', 'error')
    }
  }
  catch (e: any) {
    codexInstallLog.value = e?.message ?? String(e)
    notify('Codex install could not start', 'error')
  }
  finally {
    codexInstalling.value = false
  }
}

async function installClaudeCli() {
  claudeInstalling.value = true
  claudeInstallLog.value = ''
  const isWin = isWindowsRuntime()
  try {
    const pnpmNames = isWin ? ['pnpm-cmd-install-claude-code', 'pnpm-install-claude-code'] : ['pnpm-install-claude-code']
    const npmNames = isWin ? ['npm-cmd-install-claude-code', 'npm-install-claude-code'] : ['npm-install-claude-code']

    let output: Awaited<ReturnType<typeof runShellCommand>> | null = null
    for (const name of [...pnpmNames, ...npmNames]) {
      try {
        output = await runShellCommand([name], [])
        break
      }
      catch { /* try next */ }
    }

    if (!output) {
      claudeInstallLog.value = 'No package manager found. Install Node.js from https://nodejs.org or download Claude Code from https://claude.ai/download'
      notify('No package manager available. Download Claude Code from claude.ai/download.', 'error')
      return
    }

    claudeInstallLog.value = [output.stdout, output.stderr].filter(Boolean).join('\n').trim()
    if (output.code === 0) {
      notify('Claude Code installed. Checking...', 'success')
      await runDoctor()
    }
    else {
      notify('Claude Code install failed. Try downloading from claude.ai/download.', 'error')
    }
  }
  catch (e: any) {
    claudeInstallLog.value = e?.message ?? String(e)
    notify('Claude Code install could not start', 'error')
  }
  finally {
    claudeInstalling.value = false
  }
}

async function openOllamaDownload() {
  ollamaInstalling.value = true
  try {
    const { open } = await import('@tauri-apps/plugin-shell')
    await open('https://ollama.com/download')
  }
  catch { /* browser dev mode */ }
  finally {
    ollamaInstalling.value = false
  }
}

async function checkClaudeHealth(): Promise<DoctorCheck> {
  try {
    const commandName = isWindowsRuntime() ? 'claude-cmd-version' : 'claude-version-check'
    const result = await runShellCommand([commandName, 'claude-version-check'], ['--version'])
    if (result.code !== 0) {
      return { id: 'claude', label: 'Claude Code', detail: firstLine(result.stderr) || 'Claude Code CLI did not respond to the version check.', status: 'error', fixable: false }
    }
    return { id: 'claude', label: 'Claude Code', detail: `Claude Code CLI ${firstLine(result.stdout)} is available.`, status: 'ok', fixable: false }
  }
  catch {
    return { id: 'claude', label: 'Claude Code', detail: 'Claude Code CLI is not available. Download it from claude.ai/download.', status: 'error', fixable: false }
  }
}

async function checkOpenRouterHealth(): Promise<DoctorCheck> {
  if (!app.openRouter.apiKey) {
    return { id: 'openrouter', label: 'OpenRouter', detail: 'API key not configured. Add your key in AI Models settings.', status: 'warning', fixable: false }
  }
  try {
    const res = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { Authorization: `Bearer ${app.openRouter.apiKey}` },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const model = app.openRouter.model || 'no model selected'
    return { id: 'openrouter', label: 'OpenRouter', detail: `Connected. Active model: ${model}.`, status: 'ok', fixable: false }
  }
  catch (e: any) {
    return { id: 'openrouter', label: 'OpenRouter', detail: `Could not reach OpenRouter API: ${e?.message ?? 'unknown error'}.`, status: 'error', fixable: false }
  }
}

async function checkOllamaHealth(): Promise<DoctorCheck> {
  if (!app.ollama.url) {
    return { id: 'ollama', label: 'Ollama', detail: 'Server URL not configured. Add it in AI Models settings.', status: 'warning', fixable: false }
  }
  try {
    const base = app.ollama.url.replace(/\/$/, '')
    const res = await fetch(`${base}/api/tags`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json() as { models?: { name: string }[] }
    const count = data?.models?.length ?? 0
    return { id: 'ollama', label: 'Ollama', detail: `Connected to ${base}. ${count} model${count !== 1 ? 's' : ''} available.`, status: 'ok', fixable: false }
  }
  catch (e: any) {
    return { id: 'ollama', label: 'Ollama', detail: `Could not reach Ollama at ${app.ollama.url}: ${e?.message ?? 'unknown error'}.`, status: 'error', fixable: false }
  }
}

async function checkKokoroHealth(): Promise<DoctorCheck> {
  try {
    if (typeof caches === 'undefined') {
      return { id: 'kokoro', label: 'Kokoro TTS', detail: 'Cache API unavailable. Kokoro TTS requires a Chromium-based runtime.', status: 'error', fixable: false }
    }
    const cache = await caches.open('transformers-cache')
    const configKey = 'https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/config.json'
    const hit = await cache.match(configKey)
    if (hit) {
      return { id: 'kokoro', label: 'Kokoro TTS', detail: 'Kokoro ONNX model is downloaded and ready for audio narration.', status: 'ok', fixable: false }
    }
    return { id: 'kokoro', label: 'Kokoro TTS', detail: 'Kokoro model not yet downloaded. Open AI Models and download the Kokoro engine to enable TTS.', status: 'warning', fixable: false }
  }
  catch {
    return { id: 'kokoro', label: 'Kokoro TTS', detail: 'Could not check Kokoro model status.', status: 'warning', fixable: false }
  }
}

async function runDoctor() {
  doctorRunning.value = true

  const checks: DoctorCheck[] = []
  try {
    checks.push({
      id: 'profile',
      label: 'Profile',
      detail: user.name ? `Signed in as ${user.name}` : 'Profile name is missing. Complete onboarding to personalize security activity.',
      status: user.name ? 'ok' : 'warning',
      fixable: false,
    })

    checks.push({
      id: 'notifications',
      label: 'Notifications',
      detail: app.notificationsEnabled ? 'In-app notifications are enabled.' : 'In-app notifications are disabled.',
      status: 'ok',
      fixable: false,
    })

    checks.push(await checkNpmHealth())
    checks.push(await checkCodexHealth())
    checks.push(await checkClaudeHealth())
    checks.push(await checkOpenRouterHealth())
    checks.push(await checkOllamaHealth())
    checks.push(await checkKokoroHealth())
  }
  finally {
    doctorChecks.value = checks
    doctorRunning.value = false
  }
}

async function fixDoctorIssues() {
  doctorFixing.value = true
  try {
    notify('Doctor fixes applied', 'success')
    await runDoctor()
  }
  finally {
    doctorFixing.value = false
  }
}

// Advanced
const showRawData = ref(false)
const rawData = computed(() => JSON.stringify({
  userProfile: { ...user.$state },
  projects: projects.projects,
  appSettings: {
    theme: app.theme,
    notificationsEnabled: app.notificationsEnabled,
    wslAutoStart: app.wslAutoStart,
    contact: {
      githubRepo: app.contact.githubRepo,
      githubToken: app.contact.githubToken ? 'saved locally' : '',
    },
    openRouter: {
      enabled: app.openRouter.enabled,
      apiKey: app.openRouter.apiKey ? 'saved locally' : '',
      model: app.openRouter.model,
    },
    wslProfiles: app.wslProfiles,
    rssSources: app.rssSources,
  },
}, null, 2))

// Danger zone confirms
const confirmReset = ref<null | 'profile' | 'projects' | 'academy' | 'all'>(null)

async function resetProfile() {
  await user.reset()
  confirmReset.value = null
  router.push('/onboarding')
}

async function clearProjects() {
  projects.projects = []
  await projects.saveProjects()
  confirmReset.value = null
}

async function resetAcademyProgress() {
  await academy.loadFromDisk()
  await academy.resetProgress(false)
  confirmReset.value = null
  notify('Academy progress and enrollment were reset.', 'success')
}

async function resetAll() {
  await user.reset()
  projects.projects = []
  await projects.saveProjects()
  app.launched = false
  try {
    const { useTauriStore } = await import('~/composables/useTauriStore')
    const store = useTauriStore()
    await store.delete('app-settings')
    await store.delete('user-profile')
    await store.delete('projects')
    await store.save()
  }
  catch {
    localStorage.clear()
  }
  confirmReset.value = null
  router.push('/')
  window.location.reload()
}

onMounted(() => {
  void loadAutoStart()
  void (async () => {
    await refreshWslInfo()
    if (app.wslAutoStart) await startEnabledWslProfiles(false)
  })()
  void checkForUpdates()
})
</script>

<template>
  <div class="max-w-3xl mx-auto py-8 px-6 space-y-8">
    <div>
      <h2 class="text-sm font-semibold text-[var(--text)] tracking-tight">Settings</h2>
      <p class="text-xs text-[var(--text-muted)] mt-0.5">App configuration and preferences</p>
    </div>

    <div class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-1.5">
      <div class="grid gap-1 sm:grid-cols-3 lg:grid-cols-6">
        <button
          v-for="tab in settingsTabs"
          :key="tab.id"
          class="rounded-lg px-3 py-2 text-left transition-colors"
          :class="activeSettingsTab === tab.id ? 'bg-indigo-500/15 text-indigo-200' : 'text-[var(--text-muted)] hover:bg-white/[0.05] hover:text-[var(--text)]'"
          @click="activeSettingsTab = tab.id"
        >
          <span class="block text-xs font-semibold">{{ tab.label }}</span>
          <span class="mt-0.5 block truncate text-[10px] opacity-70">{{ tab.description }}</span>
        </button>
      </div>
    </div>

    <!-- General -->
    <div v-show="activeSettingsTab === 'general'" class="space-y-3">
      <h3 class="text-[10px] font-semibold text-[var(--text-faint)] uppercase tracking-[0.12em]">General</h3>
      <div class="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] space-y-4">
        <!-- Theme -->
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-[var(--text)]">Theme</p>
            <p class="text-xs text-[var(--text-muted)] mt-0.5">{{ app.theme === 'dark' ? 'Dark mode active' : 'Light mode active' }}</p>
          </div>
          <GlassButton variant="ghost" size="sm" @click="app.toggleTheme()">
            <Sun v-if="app.theme === 'dark'" class="size-3.5 mr-1.5" />
            <Moon v-else class="size-3.5 mr-1.5" />
            {{ app.theme === 'dark' ? 'Light' : 'Dark' }}
          </GlassButton>
        </div>

        <div class="h-px bg-[var(--border)]" />

        <!-- Auto-start -->
        <div class="flex items-center justify-between">
          <div class="flex items-start gap-3">
            <div class="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border border-emerald-500/20 bg-emerald-500/10">
              <Zap class="size-3.5 text-emerald-300" />
            </div>
            <div>
              <p class="text-sm text-[var(--text)]">Start after boot</p>
              <p class="text-xs text-[var(--text-muted)] mt-0.5">Launch Vindicter automatically when Windows starts</p>
            </div>
          </div>
          <label class="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
            <input
              :checked="autoStart"
              :disabled="autoStartLoading"
              type="checkbox"
              class="sr-only peer"
              @change="setAutoStartPreference(($event.target as HTMLInputElement).checked)"
            >
            <div class="w-9 h-5 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white/40 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 peer-checked:after:bg-white" />
          </label>
        </div>

        <div class="h-px bg-[var(--border)]" />

        <!-- MCP in Sidebar -->
        <div class="flex items-center justify-between">
          <div class="flex items-start gap-3">
            <div class="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border border-indigo-500/20 bg-indigo-500/10">
              <Plug class="size-3.5 text-indigo-300" />
            </div>
            <div>
              <p class="text-sm text-[var(--text)]">Show MCP in Sidebar</p>
              <p class="text-xs text-[var(--text-muted)] mt-0.5">Display the MCP server item in the navigation sidebar</p>
            </div>
          </div>
          <label class="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
            <input v-model="mcpInSidebar" type="checkbox" class="sr-only peer">
            <div class="w-9 h-5 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white/40 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white" />
          </label>
        </div>

        <div class="h-px bg-[var(--border)]" />

        <!-- Enable Vigilante -->
        <div class="flex items-center justify-between">
          <div class="flex items-start gap-3">
            <div
              class="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border transition-colors"
              :class="app.vigilanteEnabled
                ? 'border-orange-500/30 bg-orange-500/10'
                : 'border-[var(--border)] bg-white/[0.04]'"
            >
              <Eye class="size-3.5" :class="app.vigilanteEnabled ? 'text-orange-300' : 'text-[var(--text-faint)]'" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <p class="text-sm text-[var(--text)]">Enable Vigilante</p>
                <span v-if="app.vigilanteEnabled" class="rounded-full bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-orange-400">Active</span>
                <span v-else class="rounded-full bg-white/[0.05] border border-[var(--border)] px-1.5 py-0.5 text-[10px] text-[var(--text-faint)]">Experimental</span>
              </div>
              <p class="text-xs text-[var(--text-muted)] mt-0.5">Active threat hunting and continuous monitoring mode</p>
            </div>
          </div>
          <label class="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
            <input
              type="checkbox"
              class="sr-only peer"
              :checked="app.vigilanteEnabled"
              @change="onVigilanteToggle"
            >
            <div class="w-9 h-5 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white/40 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-600 peer-checked:after:bg-white" />
          </label>
        </div>
      </div>
    </div>

    <!-- Vigilante confirmation modal -->
    <GlassModal v-model="vigilanteWarningOpen" title="Enable Vigilante Mode?" @close="cancelVigilante">
      <div class="space-y-4">
        <div class="flex items-start gap-3 rounded-xl border border-orange-500/25 bg-orange-500/[0.08] p-4">
          <AlertTriangle class="size-5 text-orange-400 shrink-0 mt-0.5" />
          <div class="space-y-1.5">
            <p class="text-sm font-semibold text-orange-300">Experimental Feature</p>
            <p class="text-xs leading-relaxed text-[var(--text-muted)]">
              Vigilante mode is an advanced active threat-hunting feature currently under development.
              Enabling it today adds the toggle state to your configuration — no active system behavior is attached yet.
            </p>
          </div>
        </div>

        <div class="space-y-2">
          <p class="text-xs font-semibold text-[var(--text)]">Before enabling, acknowledge the following:</p>
          <ul class="space-y-1.5">
            <li v-for="clause in [
              'This feature is experimental and subject to change without notice.',
              'Future versions may perform active network and filesystem monitoring.',
              'You are responsible for ensuring monitoring complies with applicable laws and policies.',
              'You can disable Vigilante at any time from Settings → General.',
            ]" :key="clause" class="flex items-start gap-2 text-xs text-[var(--text-muted)]">
              <Eye class="size-3.5 text-orange-400/60 shrink-0 mt-0.5" />
              {{ clause }}
            </li>
          </ul>
        </div>

        <div class="flex gap-2 justify-end pt-1">
          <GlassButton variant="ghost" size="sm" @click="cancelVigilante">Cancel</GlassButton>
          <GlassButton size="sm" class="bg-orange-600/20 text-orange-300 border-orange-500/30 hover:bg-orange-600/30" @click="confirmVigilante">
            <Eye class="size-3.5" />
            Enable Vigilante
          </GlassButton>
        </div>
      </div>
    </GlassModal>

    <!-- Notifications -->
    <div v-show="activeSettingsTab === 'general'" class="space-y-3">
      <h3 class="text-[10px] font-semibold text-[var(--text-faint)] uppercase tracking-[0.12em]">Notifications</h3>
      <div class="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-[var(--text)]">In-app notifications</p>
            <p class="text-xs text-[var(--text-muted)] mt-0.5">Toast alerts for scans, findings, exports, and app events</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input v-model="notifs" type="checkbox" class="sr-only peer">
            <div class="w-9 h-5 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white/40 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white" />
          </label>
        </div>

      </div>
    </div>

    <!-- RSS Sources -->
    <div v-show="activeSettingsTab === 'news'" class="space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="text-[10px] font-semibold text-[var(--text-faint)] uppercase tracking-[0.12em]">Security News Sources</h3>
        <GlassButton variant="ghost" size="sm" @click="addRssSource">
          <Plus class="size-3.5" />
          Add
        </GlassButton>
      </div>
      <div class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 space-y-3">
        <div class="flex items-start gap-3 rounded-lg border border-cyan-500/20 bg-cyan-500/[0.06] p-3">
          <Rss class="mt-0.5 size-4 shrink-0 text-cyan-300" />
          <p class="text-xs leading-relaxed text-[var(--text-muted)]">These feeds power the Home news section. Disable a source to hide it without deleting the URL.</p>
        </div>

        <div class="space-y-3">
          <div
            v-for="source in rssDrafts"
            :key="source.id"
            class="rounded-xl border border-white/10 bg-black/10 p-3"
          >
            <div class="flex items-center gap-2">
              <label class="relative inline-flex cursor-pointer items-center">
                <input v-model="source.enabled" type="checkbox" class="sr-only peer">
                <div class="h-5 w-9 rounded-full bg-white/10 after:absolute after:left-0.5 after:top-0.5 after:size-4 after:rounded-full after:bg-white/40 after:transition-all after:content-[''] peer-checked:bg-cyan-600 peer-checked:after:translate-x-full peer-checked:after:bg-white" />
              </label>
              <input
                v-model="source.label"
                class="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-white/[0.04] px-3 py-2 text-xs text-[var(--text)] outline-none transition-colors focus:border-cyan-500/40"
                placeholder="Feed label"
              >
              <button
                class="grid size-8 shrink-0 place-items-center rounded-lg text-[var(--text-faint)] transition-colors hover:bg-red-500/10 hover:text-red-300"
                title="Remove source"
                @click="removeRssSource(source.id)"
              >
                <Trash2 class="size-3.5" />
              </button>
            </div>
            <input
              v-model="source.url"
              class="mt-2 w-full rounded-lg border border-[var(--border)] bg-white/[0.04] px-3 py-2 font-mono text-[11px] text-[var(--text-muted)] outline-none transition-colors focus:border-cyan-500/40"
              placeholder="https://example.com/rss"
            >
          </div>
        </div>

        <GlassButton size="sm" class="w-full" @click="saveRssSources">
          Save News Sources
        </GlassButton>
      </div>
    </div>

    <!-- WSL -->
    <div v-show="activeSettingsTab === 'wsl'" class="space-y-3">
      <h3 class="text-[10px] font-semibold text-[var(--text-faint)] uppercase tracking-[0.12em]">WSL Backend</h3>
      <div class="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] space-y-4">
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-start gap-3">
            <div
              class="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border"
              :class="wslInfo?.installed ? 'border-emerald-500/20 bg-emerald-500/10' : 'border-amber-500/20 bg-amber-500/10'"
            >
              <Terminal class="size-4" :class="wslInfo?.installed ? 'text-emerald-300' : 'text-amber-300'" />
            </div>
            <div>
              <p class="text-sm font-semibold text-[var(--text)]">Windows Subsystem for Linux</p>
              <p class="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">{{ wslStatusText }}</p>
              <p v-if="wslInfo?.error" class="mt-1 text-xs text-amber-300">{{ wslInfo.error }}</p>
            </div>
          </div>
          <GlassButton variant="ghost" size="sm" :disabled="wslLoading" @click="refreshWslInfo">
            <Loader2 v-if="wslLoading" class="size-3.5 animate-spin" />
            <Stethoscope v-else class="size-3.5" />
            Check
          </GlassButton>
        </div>

        <div v-if="wslInfo?.installed" class="space-y-3">
          <div class="grid gap-2 rounded-lg border border-emerald-500/15 bg-emerald-500/[0.04] p-3">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-xs font-semibold text-[var(--text)]">Background backend</p>
                <p class="mt-0.5 text-[11px] leading-relaxed text-[var(--text-muted)]">Keep enabled WSL profiles warm so Academy and Pentest can connect without opening a separate terminal first.</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer shrink-0">
                <input v-model="wslAutoStart" type="checkbox" class="sr-only peer">
                <div class="w-9 h-5 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white/40 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white" />
              </label>
            </div>
            <div class="flex flex-wrap gap-2">
              <GlassButton variant="ghost" size="sm" :disabled="wslStarting" @click="startEnabledWslProfiles()">
                <Loader2 v-if="wslStarting" class="size-3.5 animate-spin" />
                <Zap v-else class="size-3.5" />
                Start enabled profiles
              </GlassButton>
              <GlassButton variant="ghost" size="sm" :disabled="wslPreparingPentest" @click="preparePentestWslAccount">
                <Loader2 v-if="wslPreparingPentest" class="size-3.5 animate-spin" />
                <Wrench v-else class="size-3.5" />
                Prepare pentest account
              </GlassButton>
            </div>
          </div>

          <div class="grid gap-2">
            <div
              v-for="distro in wslInfo.distributions"
              :key="distro.name"
              class="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-black/10 px-3 py-2"
            >
              <span class="size-1.5 rounded-full" :class="distro.state === 'Running' ? 'bg-emerald-400' : 'bg-white/25'" />
              <div class="min-w-0 flex-1">
                <p class="truncate text-xs font-medium text-[var(--text)]">{{ distro.name }}</p>
                <p class="text-[10px] text-[var(--text-faint)]">{{ distro.state || 'Installed' }} · WSL {{ distro.version || '?' }}</p>
              </div>
              <span v-if="distro.default" class="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[10px] text-indigo-300">Default</span>
            </div>
          </div>

          <div class="space-y-2 rounded-lg border border-[var(--border)] bg-black/10 p-3">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-xs font-semibold text-[var(--text)]">Profiles</p>
                <p class="mt-0.5 text-[11px] text-[var(--text-faint)]">Assign WSL distributions for Academy and Pentest workflows.</p>
              </div>
              <GlassButton variant="ghost" size="sm" @click="app.ensureDefaultWslProfiles(wslInfo.defaultDistro || wslInfo.distributions[0]?.name || '')">
                Reset profiles
              </GlassButton>
            </div>

            <div v-for="(profile, index) in app.wslProfiles" :key="profile.id" class="grid gap-2 rounded-lg border border-white/[0.06] bg-white/[0.025] p-3">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-xs font-medium text-[var(--text)]">{{ profile.name }}</p>
                  <p class="mt-0.5 text-[11px] text-[var(--text-faint)]">{{ profile.purpose }}</p>
                  <p class="mt-1 font-mono text-[10px] text-[var(--text-faint)]">{{ profile.homePath }}</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    :checked="profile.enabled"
                    type="checkbox"
                    class="sr-only peer"
                    @change="saveWslProfileEnabled(index, ($event.target as HTMLInputElement).checked)"
                  >
                  <div class="w-9 h-5 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white/40 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white" />
                </label>
              </div>
              <select
                class="h-9 rounded-lg border border-[var(--border)] bg-black/20 px-2 text-xs text-[var(--text)] outline-none"
                :value="profile.distro"
                @change="saveWslProfileDistro(index, ($event.target as HTMLSelectElement).value)"
              >
                <option value="">Default distribution</option>
                <option v-for="distro in wslInfo.distributions" :key="distro.name" :value="distro.name">{{ distro.name }}</option>
              </select>
            </div>
          </div>

          <!-- Clean Vindicter profiles only -->
          <div class="space-y-3 rounded-lg border border-amber-500/20 bg-amber-500/[0.04] p-3">
            <div>
              <p class="text-xs font-semibold text-amber-200">Clean Vindicter Profiles</p>
              <p class="mt-0.5 text-[11px] leading-relaxed text-[var(--text-muted)]">Removes only the <span class="font-mono">pentest</span> and <span class="font-mono">academy</span> user accounts and their home directories from the selected distribution. The distribution itself is kept.</p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <select v-model="cleanProfilesDistro" class="h-9 min-w-40 flex-1 rounded-lg border border-amber-500/20 bg-black/20 px-2 text-xs text-[var(--text)] outline-none">
                <option value="">Choose distribution</option>
                <option v-for="distro in wslInfo.distributions" :key="distro.name" :value="distro.name">{{ distro.name }}</option>
              </select>
              <GlassCheckbox v-model="confirmCleanProfiles" size="sm" class="text-[11px] text-[var(--text-muted)]">
                Confirm
              </GlassCheckbox>
              <GlassButton
                size="sm"
                class="bg-amber-600/20 text-amber-300 border-amber-500/30 hover:bg-amber-600/30"
                :disabled="!cleanProfilesDistro || !confirmCleanProfiles || wslCleaningProfiles"
                @click="cleanVindicterProfiles"
              >
                <Loader2 v-if="wslCleaningProfiles" class="size-3.5 animate-spin" />
                <XCircle v-else class="size-3.5" />
                Clean Profiles
              </GlassButton>
            </div>
          </div>

          <!-- Unregister entire distribution (destructive) -->
          <div class="space-y-3 rounded-lg border border-red-500/20 bg-red-500/[0.04] p-3">
            <div>
              <p class="text-xs font-semibold text-red-200">Unregister Entire Distribution</p>
              <p class="mt-0.5 text-[11px] leading-relaxed text-[var(--text-muted)]">Permanently deletes the full Linux filesystem of the selected distribution. This cannot be undone.</p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <select v-model="purgeDistro" class="h-9 min-w-40 flex-1 rounded-lg border border-red-500/20 bg-black/20 px-2 text-xs text-[var(--text)] outline-none">
                <option value="">Choose distribution</option>
                <option v-for="distro in wslInfo.distributions" :key="distro.name" :value="distro.name">{{ distro.name }}</option>
              </select>
              <GlassCheckbox v-model="confirmWslPurge" size="sm" class="text-[11px] text-[var(--text-muted)]">
                Yes, delete everything
              </GlassCheckbox>
              <GlassButton
                size="sm"
                class="bg-red-600/20 text-red-300 border-red-500/30 hover:bg-red-600/30"
                :disabled="!purgeDistro || !confirmWslPurge || wslPurging"
                @click="purgeSelectedWsl"
              >
                <Loader2 v-if="wslPurging" class="size-3.5 animate-spin" />
                <XCircle v-else class="size-3.5" />
                Unregister
              </GlassButton>
            </div>
          </div>
        </div>

        <div v-else class="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] p-3">
          <p class="text-xs text-[var(--text-muted)]">
            Install WSL with <code class="rounded bg-white/[0.07] px-1 py-0.5 font-mono text-[11px]">wsl --install</code>, then come back here to assign Academy and Pentest profiles.
          </p>
        </div>
      </div>
    </div>

    <!-- Updates -->
    <div v-show="activeSettingsTab === 'updates'" class="space-y-3">
      <h3 class="text-[10px] font-semibold text-[var(--text-faint)] uppercase tracking-[0.12em]">Updates</h3>
      <div class="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] space-y-4">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-semibold text-[var(--text)]">Vindicter Desktop</p>
            <p class="mt-1 text-xs text-[var(--text-muted)]">
              Current {{ appVersion ? `v${appVersion}` : 'version unknown' }}
              <span v-if="latestRelease"> · Latest {{ latestRelease.tagName }}</span>
            </p>
            <p v-if="updateError" class="mt-1 text-xs text-amber-300">{{ updateError }}</p>
          </div>
          <GlassButton variant="ghost" size="sm" :disabled="updateChecking" @click="checkForUpdates">
            <Loader2 v-if="updateChecking" class="size-3.5 animate-spin" />
            <Github v-else class="size-3.5" />
            Check
          </GlassButton>
        </div>

        <button
          v-if="hasUpdate"
          class="flex w-full items-center justify-between gap-3 rounded-lg border border-emerald-500/25 bg-emerald-500/[0.08] px-3 py-2.5 text-left transition-colors hover:bg-emerald-500/12"
          @click="openLatestRelease"
        >
          <span>
            <span class="block text-xs font-semibold text-emerald-200">Update available: {{ latestRelease?.name }}</span>
            <span class="mt-0.5 block text-[11px] text-[var(--text-muted)]">Open surelle-ha/vindicter releases to download it.</span>
          </span>
          <Download class="size-4 shrink-0 text-emerald-300" />
        </button>
        <p v-else-if="latestRelease && !updateChecking" class="text-xs text-[var(--text-muted)]">You are on the latest GitHub release.</p>
      </div>
    </div>

    <!-- About -->
    <div v-show="activeSettingsTab === 'updates'" class="space-y-3">
      <h3 class="text-[10px] font-semibold text-[var(--text-faint)] uppercase tracking-[0.12em]">About</h3>
      <div class="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] space-y-4">
        <div class="flex items-start gap-3">
          <div class="grid size-10 shrink-0 place-items-center rounded-xl border border-indigo-500/25 bg-indigo-500/10">
            <Heart class="size-4 text-indigo-300" />
          </div>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-[var(--text)]">Made by Harold Eustaquio</p>
            <p class="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
              Vindicter is a local-first security workspace for scanning projects, tracking remediation, and keeping AI-assisted review grounded in the files you actually ship.
            </p>
          </div>
        </div>
        <a
          href="https://github.com/Surelle-ha"
          target="_blank"
          rel="noreferrer"
          class="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-black/10 px-3 py-2 text-xs font-medium text-[var(--text-muted)] transition-colors hover:bg-white/[0.05] hover:text-[var(--text)]"
        >
          <Github class="size-3.5" />
          github.com/Surelle-ha
        </a>
      </div>
    </div>

    <!-- Doctor -->
    <div v-show="activeSettingsTab === 'diagnostics'" class="space-y-3">
      <h3 class="text-[10px] font-semibold text-[var(--text-faint)] uppercase tracking-[0.12em]">Doctor</h3>
      <div class="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Stethoscope class="size-3.5 text-emerald-300" />
            <div>
              <p class="text-sm text-[var(--text)]">App health</p>
              <p class="text-xs text-[var(--text-muted)] mt-0.5">{{ doctorSummary }}</p>
            </div>
          </div>
          <div class="flex gap-2">
            <GlassButton variant="ghost" size="sm" :disabled="doctorRunning || doctorFixing" @click="runDoctor">
              <Loader2 v-if="doctorRunning" class="size-3.5 animate-spin" />
              <Stethoscope v-else class="size-3.5" />
              Run
            </GlassButton>
            <GlassButton size="sm" :disabled="!canDoctorFix || doctorRunning || doctorFixing" @click="fixDoctorIssues">
              <Loader2 v-if="doctorFixing" class="size-3.5 animate-spin" />
              <Wrench v-else class="size-3.5" />
              Fix
            </GlassButton>
          </div>
        </div>

        <div v-if="doctorChecks.length" class="space-y-2">
          <div
            v-for="check in doctorChecks"
            :key="check.id"
            class="flex items-start gap-3 rounded-lg border px-3 py-2.5"
            :class="check.status === 'ok'
              ? 'border-emerald-500/15 bg-emerald-500/5'
              : check.status === 'warning'
                ? 'border-amber-500/20 bg-amber-500/5'
                : 'border-red-500/20 bg-red-500/5'"
          >
            <CheckCircle2 v-if="check.status === 'ok'" class="size-3.5 mt-0.5 shrink-0 text-emerald-400" />
            <AlertTriangle v-else-if="check.status === 'warning'" class="size-3.5 mt-0.5 shrink-0 text-amber-400" />
            <XCircle v-else class="size-3.5 mt-0.5 shrink-0 text-red-400" />
            <div class="min-w-0 flex-1">
              <p class="text-xs font-medium text-[var(--text)]">{{ check.label }}</p>
              <p class="text-xs text-[var(--text-muted)] mt-0.5 break-words">{{ check.detail }}</p>
            </div>
            <button
              v-if="check.id === 'codex' && shouldShowCodexInstaller"
              class="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1.5 text-[10px] font-medium text-emerald-300 hover:bg-emerald-500/20 transition-colors disabled:opacity-60"
              :disabled="doctorRunning || doctorFixing || codexInstalling"
              @click="installCodexCli"
            >
              <Loader2 v-if="codexInstalling" class="size-3 animate-spin" />
              <Download v-else class="size-3" />
              {{ codexInstalling ? 'Installing…' : 'Install/Repair Codex' }}
            </button>
            <button
              v-if="check.id === 'claude' && shouldShowClaudeInstaller"
              class="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-violet-500/20 bg-violet-500/10 px-2.5 py-1.5 text-[10px] font-medium text-violet-300 hover:bg-violet-500/20 transition-colors disabled:opacity-60"
              :disabled="doctorRunning || doctorFixing || claudeInstalling"
              @click="installClaudeCli"
            >
              <Loader2 v-if="claudeInstalling" class="size-3 animate-spin" />
              <Download v-else class="size-3" />
              {{ claudeInstalling ? 'Installing…' : 'Install Claude Code' }}
            </button>
            <button
              v-if="check.id === 'ollama' && shouldShowOllamaInstaller"
              class="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-orange-500/20 bg-orange-500/10 px-2.5 py-1.5 text-[10px] font-medium text-orange-300 hover:bg-orange-500/20 transition-colors disabled:opacity-60"
              :disabled="ollamaInstalling"
              @click="openOllamaDownload"
            >
              <Loader2 v-if="ollamaInstalling" class="size-3 animate-spin" />
              <Download v-else class="size-3" />
              Download Ollama
            </button>
            <span v-if="check.fixable" class="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 shrink-0">fixable</span>
          </div>
        </div>

        <div v-if="codexInstallLog" class="rounded-lg border border-[var(--border)] bg-black/20 p-3">
          <div class="flex items-center gap-2 mb-2">
            <Terminal class="size-3.5 text-[var(--text-muted)]" />
            <p class="text-xs font-medium text-[var(--text-muted)]">Codex installer output</p>
          </div>
          <pre class="max-h-40 overflow-auto whitespace-pre-wrap text-[10px] leading-relaxed text-[var(--text-muted)] scrollbar-glass">{{ codexInstallLog }}</pre>
        </div>
        <div v-if="claudeInstallLog" class="rounded-lg border border-[var(--border)] bg-black/20 p-3">
          <div class="flex items-center gap-2 mb-2">
            <Terminal class="size-3.5 text-[var(--text-muted)]" />
            <p class="text-xs font-medium text-[var(--text-muted)]">Claude Code installer output</p>
          </div>
          <pre class="max-h-40 overflow-auto whitespace-pre-wrap text-[10px] leading-relaxed text-[var(--text-muted)] scrollbar-glass">{{ claudeInstallLog }}</pre>
        </div>
      </div>
    </div>

    <!-- Advanced -->
    <div v-show="activeSettingsTab === 'data'" class="space-y-3">
      <h3 class="text-[10px] font-semibold text-[var(--text-faint)] uppercase tracking-[0.12em]">Advanced</h3>
      <div class="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] space-y-3">
        <button
          class="flex items-center gap-2 text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          @click="openDataFolder"
        >
          <FolderOpen class="size-3.5" />
          Open data folder in explorer
        </button>
        <div class="h-px bg-[var(--border)]" />
        <button
          class="flex items-center gap-2 text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          @click="showRawData = !showRawData"
        >
          <Database class="size-3.5" />
          View local data (raw JSON)
          <ChevronDown v-if="!showRawData" class="size-3.5 ml-auto" />
          <ChevronUp v-else class="size-3.5 ml-auto" />
        </button>
        <pre v-if="showRawData" class="text-[10px] text-[var(--text-muted)] bg-black/20 rounded-lg p-3 overflow-auto max-h-64 scrollbar-glass">{{ rawData }}</pre>
      </div>
    </div>

    <!-- Danger Zone -->
    <div v-show="activeSettingsTab === 'data'" class="space-y-3">
      <h3 class="text-[10px] font-semibold text-red-400/70 uppercase tracking-[0.12em]">Danger Zone</h3>
      <div class="danger-zone space-y-3">
        <p class="text-xs text-[var(--text-muted)]">
          These actions affect only data stored within Vindicter. Your project files (vindicta.json) are <strong class="text-[var(--text)]">never deleted</strong> by any of these actions.
        </p>

        <!-- Reset profile -->
        <div class="flex items-center justify-between py-2 border-t border-white/[0.05]">
          <div>
            <p class="text-sm text-[var(--text)]">Reset profile</p>
            <p class="text-xs text-[var(--text-muted)]">Clears your name, email, and role</p>
          </div>
          <GlassButton v-if="confirmReset !== 'profile'" variant="ghost" size="sm" class="text-red-400 hover:text-red-300" @click="confirmReset = 'profile'">
            Reset
          </GlassButton>
          <div v-else class="flex gap-2">
            <GlassButton size="sm" class="bg-red-600/20 text-red-400 border-red-500/30 hover:bg-red-600/30" @click="resetProfile">Confirm</GlassButton>
            <GlassButton variant="ghost" size="sm" @click="confirmReset = null">Cancel</GlassButton>
          </div>
        </div>

        <!-- Clear projects -->
        <div class="flex items-center justify-between py-2 border-t border-white/[0.05]">
          <div>
            <p class="text-sm text-[var(--text)]">Clear project list</p>
            <p class="text-xs text-[var(--text-muted)]">Removes all projects from the app registry</p>
          </div>
          <GlassButton v-if="confirmReset !== 'projects'" variant="ghost" size="sm" class="text-red-400 hover:text-red-300" @click="confirmReset = 'projects'">
            Clear
          </GlassButton>
          <div v-else class="flex gap-2">
            <GlassButton size="sm" class="bg-red-600/20 text-red-400 border-red-500/30 hover:bg-red-600/30" @click="clearProjects">Confirm</GlassButton>
            <GlassButton variant="ghost" size="sm" @click="confirmReset = null">Cancel</GlassButton>
          </div>
        </div>

        <!-- Reset academy -->
        <div class="flex items-center justify-between py-2 border-t border-white/[0.05]">
          <div>
            <p class="text-sm text-[var(--text)]">Reset Academy progress</p>
            <p class="text-xs text-[var(--text-muted)]">Clears enrollment, completed lessons, professor chats, and certificate</p>
          </div>
          <GlassButton v-if="confirmReset !== 'academy'" variant="ghost" size="sm" class="text-red-400 hover:text-red-300" @click="confirmReset = 'academy'">
            Reset
          </GlassButton>
          <div v-else class="flex gap-2">
            <GlassButton size="sm" class="bg-red-600/20 text-red-400 border-red-500/30 hover:bg-red-600/30" @click="resetAcademyProgress">Confirm</GlassButton>
            <GlassButton variant="ghost" size="sm" @click="confirmReset = null">Cancel</GlassButton>
          </div>
        </div>

        <!-- Reset all -->
        <div class="flex items-center justify-between py-2 border-t border-white/[0.05]">
          <div>
            <p class="text-sm text-[var(--text)]">Reset all app data</p>
            <p class="text-xs text-[var(--text-muted)]">Wipes all settings, profile, and project registry</p>
          </div>
          <GlassButton v-if="confirmReset !== 'all'" variant="ghost" size="sm" class="text-red-400 hover:text-red-300" @click="confirmReset = 'all'">
            Reset all
          </GlassButton>
          <div v-else class="flex gap-2">
            <GlassButton size="sm" class="bg-red-600/20 text-red-400 border-red-500/30 hover:bg-red-600/30" @click="resetAll">Confirm</GlassButton>
            <GlassButton variant="ghost" size="sm" @click="confirmReset = null">Cancel</GlassButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
