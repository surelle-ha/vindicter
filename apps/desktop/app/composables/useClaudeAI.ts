import { runClaude } from '~/composables/useClaudeShell'

export interface ClaudeExecOptions {
  prompt: string
  projectPath: string
  model?: string
  reasoningEffort?: 'low' | 'medium' | 'high'
}

export interface ClaudeExecResult {
  stdout: string
  stderr: string
}

export function friendlyClaudeExecError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('not found') || lower.includes('enoent') || lower.includes('no such file'))
    return 'Claude CLI was not found. Make sure "claude" is installed and available in your PATH.'
  if (lower.includes('permission denied') || lower.includes('access denied'))
    return 'Permission denied when trying to run Claude CLI. Check your system permissions.'
  if (lower.includes('not allowed') || lower.includes('scoped'))
    return 'Claude CLI is not allowed in the configured shell scope. Check Vindicter shell permissions.'
  if (lower.includes('api key') || lower.includes('authentication') || lower.includes('unauthorized'))
    return 'Claude API key is missing or invalid. Run "claude" in a terminal and log in first.'
  if (lower.includes('rate limit') || lower.includes('quota'))
    return 'Claude API rate limit or quota reached. Wait a moment before running another scan.'
  if (lower.includes('timeout'))
    return 'The Claude scan timed out. Try a lower effort level or a smaller project scope.'
  return message || 'Claude scan failed with an unknown error.'
}

export async function runClaudeExec(opts: ClaudeExecOptions): Promise<ClaudeExecResult> {
  return new Promise((resolve, reject) => {
    const stdoutLines: string[] = []
    const stderrLines: string[] = []
    let settled = false

    function safeResolve(result: ClaudeExecResult) {
      if (!settled) { settled = true; resolve(result) }
    }
    function safeReject(err: Error) {
      if (!settled) { settled = true; reject(err) }
    }

    runClaude({
      prompt: opts.prompt,
      projectPath: opts.projectPath,
      model: opts.model,
      onLine(line) {
        try {
          const parsed = JSON.parse(line) as Record<string, unknown>
          const type = parsed?.type as string | undefined

          // Final result block — resolve immediately without waiting for close event.
          // This prevents hangs when the Tauri close-event IPC callback is dropped.
          if (type === 'result') {
            const text = parsed.result ?? (parsed as any)?.content
            if (typeof text === 'string' && text.trim()) {
              stdoutLines.length = 0
              stdoutLines.push(text)
            }
            safeResolve({ stdout: stdoutLines.join(''), stderr: stderrLines.join('') })
            return
          }

          if (type === 'assistant') {
            const content = (parsed as any)?.message?.content
            if (Array.isArray(content)) {
              for (const block of content) {
                if (block?.type === 'text' && typeof block.text === 'string') {
                  stdoutLines.push(block.text)
                }
              }
            }
            return
          }

          if (type === 'text' && typeof parsed.text === 'string') {
            stdoutLines.push(parsed.text as string)
          }
          else if (type === 'message' && Array.isArray((parsed as any)?.message?.content)) {
            for (const block of (parsed as any).message.content) {
              if (block?.type === 'text' && typeof block.text === 'string') {
                stdoutLines.push(block.text)
              }
            }
          }
        }
        catch {
          if (line.trim()) stdoutLines.push(line)
        }
      },
      onClose(stderr) {
        if (stderr.trim()) stderrLines.push(stderr)
        safeResolve({ stdout: stdoutLines.join(''), stderr: stderrLines.join('') })
      },
      onError(err) {
        safeReject(new Error(friendlyClaudeExecError(err)))
      },
    }).catch((err: any) => {
      safeReject(new Error(friendlyClaudeExecError(err?.message ?? String(err))))
    })
  })
}
