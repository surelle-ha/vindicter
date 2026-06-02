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

    runClaude({
      prompt: opts.prompt,
      projectPath: opts.projectPath,
      model: opts.model,
      onLine(line) {
        // --verbose stream-json events from Claude CLI
        try {
          const parsed = JSON.parse(line) as Record<string, unknown>
          const type = parsed?.type as string | undefined

          // Final result block — authoritative full output
          if (type === 'result') {
            const text = parsed.result ?? (parsed as any)?.content
            if (typeof text === 'string' && text.trim()) {
              stdoutLines.length = 0 // discard partial; use the complete result
              stdoutLines.push(text)
            }
            return
          }

          // Assistant turn text content blocks
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

          // Legacy / alternative shapes
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
          // Non-JSON line — treat as raw text output
          if (line.trim()) stdoutLines.push(line)
        }
      },
      onClose(stderr) {
        if (stderr.trim()) stderrLines.push(stderr)
        resolve({
          stdout: stdoutLines.join(''),
          stderr: stderrLines.join(''),
        })
      },
      onError(err) {
        reject(new Error(friendlyClaudeExecError(err)))
      },
    }).catch((err: any) => {
      reject(new Error(friendlyClaudeExecError(err?.message ?? String(err))))
    })
  })
}
