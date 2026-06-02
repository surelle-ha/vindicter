interface CodexExecResult {
  code: number | null
  stdout: string
  stderr: string
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
  const fs = useTauriFs()
  const isWin = isWindowsPath(opts.projectPath)
  const basePath = isWin ? opts.projectPath.replace(/\//g, '\\') : opts.projectPath
  const sep = isWin ? '\\' : '/'
  const stamp = Date.now()
  const outputFile = `${basePath}${sep}.vindicta_codex_output_${stamp}.txt`
  const sandbox = opts.sandbox ?? 'read-only'

  try {
    const reasoningEffort = opts.reasoningEffort ?? 'medium'
    const effortArgs = ['-c', `model_reasoning_effort="${reasoningEffort}"`]
    const codexArgs = [
      'exec',
      ...effortArgs,
      '-C',
      basePath,
      '--skip-git-repo-check',
      '--sandbox',
      sandbox,
      '--color',
      'never',
      '-o',
      outputFile,
      opts.prompt,
    ]

    const commandName = isWin ? 'node-codex-exec' : 'codex-exec'
    const commandArgs = isWin ? [await windowsCodexEntrypoint(), ...codexArgs] : codexArgs
    const output = await Command.create(commandName, commandArgs, { cwd: basePath }).execute()
    const commandText = [output.stderr, output.stdout].filter(Boolean).join('\n')
    if (output.code !== 0 && commandText) {
      const friendlyError = friendlyCodexExecError(commandText)
      return {
        code: output.code,
        stdout: output.stdout,
        stderr: friendlyError,
        tokenUsage: {
          inputTokens: estimateTokens(opts.prompt),
          outputTokens: estimateTokens(commandText),
          totalTokens: estimateTokens(opts.prompt) + estimateTokens(commandText),
        },
      }
    }

    const finalMessage = await fs.readTextFile(outputFile).catch(() => '')
    const responseText = finalMessage || output.stdout || output.stderr
    const tokenUsage = {
      inputTokens: estimateTokens(opts.prompt),
      outputTokens: estimateTokens(responseText),
      totalTokens: estimateTokens(opts.prompt) + estimateTokens(responseText),
    }

    try {
      await useUserStore().recordTokenUsage({
        ...tokenUsage,
        tool: 'Codex',
        model: opts.model || (opts.reasoningEffort ? `Codex CLI default (${opts.reasoningEffort} effort)` : 'Codex CLI default'),
        prompt: opts.prompt,
      })
    }
    catch { /* token usage tracking should never block Codex work */ }

    return {
      code: output.code,
      stdout: finalMessage || output.stdout,
      stderr: output.stderr,
      tokenUsage,
    }
  }
  catch (error) {
    throw new Error(friendlyCodexExecError(error))
  }
  finally {
    fs.removeFile(outputFile).catch(() => {})
  }
}
