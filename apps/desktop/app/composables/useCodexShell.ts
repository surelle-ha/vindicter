interface CodexExecResult {
  code: number | null
  stdout: string
  stderr: string
  aborted?: boolean
  tokenUsage: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
}

interface CodexExecOptions {
  prompt: string
  projectPath: string
  model?: string
  reasoningEffort?: 'low' | 'medium' | 'high' | 'xhigh'
  sandbox?: 'read-only' | 'workspace-write'
}

function isWindowsPath(path: string) {
  return path.includes('\\') || /^[A-Za-z]:/.test(path)
}

async function windowsCodexEntrypoint() {
  const { homeDir } = await import('@tauri-apps/api/path')
  const home = (await homeDir()).replace(/[\\/]$/, '')
  return `${home}\\AppData\\Roaming\\npm\\node_modules\\@openai\\codex\\bin\\codex.js`
}

function estimateTokens(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return 0
  return Math.max(1, Math.ceil(trimmed.length / 4))
}

export function friendlyCodexExecError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '')

  if (/usage limit|usage_limit|usage.*exhausted|usage.*remaining|quota|billing|insufficient_quota|rate limit|limit.*reached|429|0 usage|out of credits|insufficient balance|credit/i.test(message)) {
    return 'Codex could not start because your AI usage limit appears to be exhausted. Check your plan, billing, or usage limits, then try again.'
  }
  if (/unauthorized|forbidden|authentication|api key|401|403|not logged in/i.test(message)) {
    return 'Codex is not authenticated. Sign in to Codex or update your API key in Settings, then try again.'
  }
  if (/codex.*not.*found|not recognized|ENOENT/i.test(message)) {
    return 'Codex CLI is not available. Open Settings > Doctor and install or repair Codex.'
  }
  if (/@openai\/codex-win32-x64|Missing optional dependency/i.test(message)) {
    return 'Codex CLI is installed but its Windows runtime dependency is missing. Open Settings > Doctor and use Install/Repair Codex, or run npm install -g @openai/codex@latest.'
  }
  if (/sep is not defined/i.test(message)) {
    return 'Vindicter could not prepare the Codex run because of a local path handling error. Please update Vindicter and try again.'
  }

  return message || 'Codex could not run. Check Settings > Doctor, then try again.'
}

export async function runCodexExec(opts: CodexExecOptions): Promise<CodexExecResult> {
  const { Command } = await import('@tauri-apps/plugin-shell')
  const { registerScanKillHandler } = await import('~/composables/useScanAbort')
  const fs = useTauriFs()

  const isWin = isWindowsPath(opts.projectPath)
  const basePath = isWin ? opts.projectPath.replace(/\//g, '\\') : opts.projectPath
  const sep = isWin ? '\\' : '/'
  const stamp = Date.now()
  const outputFile = `${basePath}${sep}.vindicta_codex_output_${stamp}.txt`
  const sandbox = opts.sandbox ?? 'read-only'
  const reasoningEffort = opts.reasoningEffort ?? 'medium'

  const codexArgs = [
    'exec',
    '-c', `model_reasoning_effort="${reasoningEffort}"`,
    '-C', basePath,
    '--skip-git-repo-check',
    '--sandbox', sandbox,
    '--color', 'never',
    '-o', outputFile,
    opts.prompt,
  ]

  const commandName = isWin ? 'node-codex-exec' : 'codex-exec'
  const commandArgs = isWin ? [await windowsCodexEntrypoint(), ...codexArgs] : codexArgs

  const stdoutLines: string[] = []
  const stderrLines: string[] = []
  let aborted = false
  let childProcess: any = null

  // Create command and attach ALL listeners before spawning —
  // Tauri requires this; listeners registered after spawn() may miss the close event.
  const cmd = Command.create(commandName, commandArgs, { cwd: basePath })

  const closePromise = new Promise<{ code: number | null }>((resolve) => {
    cmd.on('close', (data: { code: number | null }) => resolve(data))
    cmd.on('error', () => resolve({ code: null }))
  })
  cmd.stdout.on('data', (line: string) => stdoutLines.push(line))
  cmd.stderr.on('data', (line: string) => stderrLines.push(line))

  // Register kill handler for scan cancellation
  const unregister = registerScanKillHandler(() => {
    aborted = true
    try { childProcess?.kill() } catch { /* ignore */ }
  })

  try {
    childProcess = await cmd.spawn()
    const closeData = await closePromise

    if (aborted) {
      return {
        code: null, stdout: '', stderr: 'Scan was cancelled by the user.',
        aborted: true,
        tokenUsage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      }
    }

    const stdout = stdoutLines.join('\n')
    const stderr = stderrLines.join('\n')
    const commandText = [stderr, stdout].filter(Boolean).join('\n')

    if (closeData.code !== 0 && commandText) {
      const friendlyError = friendlyCodexExecError(commandText)
      return {
        code: closeData.code,
        stdout,
        stderr: friendlyError,
        tokenUsage: {
          inputTokens: estimateTokens(opts.prompt),
          outputTokens: estimateTokens(commandText),
          totalTokens: estimateTokens(opts.prompt) + estimateTokens(commandText),
        },
      }
    }

    const finalMessage = await fs.readTextFile(outputFile).catch(() => '')
    const responseText = finalMessage || stdout || stderr
    const tokenUsage = {
      inputTokens: estimateTokens(opts.prompt),
      outputTokens: estimateTokens(responseText),
      totalTokens: estimateTokens(opts.prompt) + estimateTokens(responseText),
    }

    try {
      await useUserStore().recordTokenUsage({
        ...tokenUsage,
        tool: 'Codex',
        model: opts.model || `Codex CLI default (${reasoningEffort} effort)`,
        prompt: opts.prompt,
      })
    }
    catch { /* token tracking must never block Codex */ }

    return { code: closeData.code, stdout: finalMessage || stdout, stderr, tokenUsage }
  }
  catch (error) {
    if (aborted) {
      return {
        code: null, stdout: '', stderr: 'Scan was cancelled by the user.',
        aborted: true,
        tokenUsage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      }
    }
    throw new Error(friendlyCodexExecError(error))
  }
  finally {
    unregister()
    fs.removeFile(outputFile).catch(() => {})
  }
}
