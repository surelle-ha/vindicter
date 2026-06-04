// Global registry of active scan kill-handlers.
// Each active scan registers a function; calling abortAllScans() kills them all.
const _killHandlers = new Set<() => void>()

export function registerScanKillHandler(fn: () => void) {
  _killHandlers.add(fn)
  return () => _killHandlers.delete(fn)
}

export function abortAllScans() {
  for (const fn of _killHandlers) {
    try { fn() } catch { /* ignore */ }
  }
  _killHandlers.clear()
}

export function hasActiveScans() {
  return _killHandlers.size > 0
}
