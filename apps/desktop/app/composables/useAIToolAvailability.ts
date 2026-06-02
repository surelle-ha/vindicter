// Shared AI-tool availability check.
// Call checkAll() once to run async CLI probes; the reactive results update immediately.
// OpenRouter/Ollama are config-based (instant), Codex/Claude require a CLI spawn.

export type AIToolId = 'codex' | 'claude' | 'openrouter' | 'ollama'

export interface AIToolStatus {
  available: boolean
  checking: boolean
}

const state = reactive<Record<AIToolId, AIToolStatus>>({
  codex:      { available: false, checking: false },
  claude:     { available: false, checking: false },
  openrouter: { available: false, checking: false },
  ollama:     { available: false, checking: false },
})

let checked = false

function isWin() {
  return typeof navigator !== 'undefined' && /Windows/i.test(navigator.userAgent)
}

async function tryCmd(candidates: string[], args: string[]): Promise<boolean> {
  const { Command } = await import('@tauri-apps/plugin-shell')
  for (const name of candidates) {
    try {
      const r = await Command.create(name, args).execute()
      if (r.code === 0) return true
    }
    catch { /* try next */ }
  }
  return false
}

export async function checkAIToolAvailability() {
  const app = useAppStore()
  const win = isWin()

  state.codex.checking  = true
  state.claude.checking = true

  state.openrouter = {
    available: app.openRouter.enabled && Boolean(app.openRouter.apiKey.trim()),
    checking: false,
  }
  state.ollama = {
    available: Boolean(app.ollama.url.trim()),
    checking: false,
  }

  const [codexOk, claudeOk] = await Promise.all([
    tryCmd(win ? ['codex-cmd-version', 'codex-version'] : ['codex-version'], ['--version']),
    tryCmd(win ? ['claude-cmd-version', 'claude-version-check'] : ['claude-version-check'], ['--version']),
  ])

  state.codex  = { available: codexOk,  checking: false }
  state.claude = { available: claudeOk, checking: false }
  checked = true
}

export function useAIToolAvailability() {
  const app = useAppStore()

  // Sync config-based tools immediately on first use without re-checking CLIs
  if (!checked) {
    state.openrouter.available = app.openRouter.enabled && Boolean(app.openRouter.apiKey.trim())
    state.ollama.available     = Boolean(app.ollama.url.trim())
  }

  // Keep config-based tools live-synced with store changes
  watch(
    () => [app.openRouter.enabled, app.openRouter.apiKey, app.ollama.url],
    () => {
      state.openrouter.available = app.openRouter.enabled && Boolean(app.openRouter.apiKey.trim())
      state.ollama.available     = Boolean(app.ollama.url.trim())
    },
  )

  return {
    toolStatus: state as Readonly<typeof state>,
    checkAIToolAvailability,
    isChecked: computed(() => checked),
  }
}
