import { Command } from '@tauri-apps/plugin-shell'

function estimateTokens(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return 0
  return Math.max(1, Math.ceil(trimmed.length / 4))
}

interface ClaudeRunOptions {
  prompt: string
  projectPath: string
  model?: string
  onLine: (line: string) => void
  onClose: (stderrBuf: string) => void
  onError: (err: string) => void
}

export async function runClaude(opts: ClaudeRunOptions): Promise<void> {
  const { prompt, projectPath, onLine, onClose, onError } = opts
  const cmdName = 'claude-run'
  const cmdArgs = ['--output-format', 'stream-json', '--verbose', '--print', prompt]

  let stdoutBuf = ''
  let allStdout = ''
  let stderrBuf = ''

  const command = Command.create(cmdName, cmdArgs, { cwd: projectPath })

  command.stdout.on('data', (chunk: string) => {
    allStdout += chunk
    stdoutBuf += chunk
    const lines = stdoutBuf.split('\n')
    stdoutBuf = lines.pop() ?? ''
    for (const line of lines) onLine(line)
  })

  command.stderr.on('data', (data: string) => { stderrBuf += data })

  command.on('close', () => {
    if (stdoutBuf.trim()) onLine(stdoutBuf)
    useUserStore().recordTokenUsage({
      tool: 'Claude',
      model: opts.model || 'Claude CLI default',
      prompt,
      inputTokens: estimateTokens(prompt),
      outputTokens: estimateTokens(allStdout || stderrBuf),
    }).catch(() => {})
    onClose(stderrBuf)
  })

  command.on('error', (err: string) => {
    onError(err)
  })

  try {
    await command.spawn()
  }
  catch (e: any) {
    onError(e?.message ?? 'Failed to spawn claude process')
  }
}
