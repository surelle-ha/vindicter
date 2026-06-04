<script setup lang="ts">
const emit = defineEmits<{ token: [string]; error: [] }>()

const { public: { turnstileSiteKey } } = useRuntimeConfig()
const containerId = `ts-${Math.random().toString(36).slice(2, 9)}`
let widgetId: string | null = null

function loadTurnstile(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as any).turnstile) { resolve(); return }
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.onload = () => resolve()
    document.head.appendChild(script)
  })
}

onMounted(async () => {
  await loadTurnstile()
  const ts = (window as any).turnstile
  if (!ts) return
  widgetId = ts.render(`#${containerId}`, {
    sitekey: turnstileSiteKey,
    theme: 'dark',
    callback: (token: string) => emit('token', token),
    'error-callback': () => emit('error'),
    'expired-callback': () => emit('error'),
  })
})

onUnmounted(() => {
  if (widgetId !== null) {
    try { (window as any).turnstile?.remove(widgetId) } catch { /* ignore */ }
  }
})
</script>

<template>
  <div :id="containerId" />
</template>
