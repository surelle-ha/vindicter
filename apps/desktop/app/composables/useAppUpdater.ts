import type { Update } from '@tauri-apps/plugin-updater'

// ── Singleton state ────────────────────────────────────────────────────────────
// Shared across all callsites so the banner and the trigger agree on state.

const updateReady   = ref(false)
const updateVersion = ref('')
const updateNotes   = ref('')
const downloading   = ref(false)
const progress      = ref(0)
const dismissed     = ref(false)

let _pending: Update | null = null
let _started = false

// ── Composable ─────────────────────────────────────────────────────────────────

export function useAppUpdater() {
  async function checkAndDownload() {
    if (_started || updateReady.value) return
    _started = true

    try {
      const { check } = await import('@tauri-apps/plugin-updater')
      const update = await check()
      if (!update?.available) return

      _pending = update
      updateVersion.value = update.version
      updateNotes.value   = update.body ?? ''
      downloading.value   = true
      progress.value      = 0

      let contentLength = 0
      let downloaded    = 0

      await update.download((event) => {
        if (event.event === 'Started') {
          contentLength = event.data.contentLength ?? 0
        } else if (event.event === 'Progress') {
          downloaded += event.data.chunkLength
          if (contentLength > 0) {
            progress.value = Math.round((downloaded / contentLength) * 100)
          }
        } else if (event.event === 'Finished') {
          progress.value = 100
        }
      })

      downloading.value = false
      updateReady.value = true
    } catch {
      // best-effort — offline or dev environment, silently ignore
      downloading.value = false
      _started = false  // allow retry on next launch
    }
  }

  async function install() {
    if (!_pending) return
    try {
      await _pending.install()
    } catch {
      // user may have cancelled the UAC prompt — no-op
    }
  }

  function dismiss() {
    dismissed.value = true
  }

  return {
    checkAndDownload,
    install,
    dismiss,
    updateReady,
    updateVersion,
    updateNotes,
    downloading,
    progress,
    dismissed,
  }
}
