let permissionRequested = false

async function ensurePermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  if (permissionRequested) return false
  permissionRequested = true
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export async function sendDesktopNotification(title: string, body?: string): Promise<void> {
  const granted = await ensurePermission()
  if (!granted) return
  try {
    new Notification(title, {
      body,
      silent: false,
    })
  }
  catch { /* not supported in this context */ }
}
