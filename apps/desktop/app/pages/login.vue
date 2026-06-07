<script setup lang="ts">
import { Check, Copy, Github, Loader2, RefreshCw, TriangleAlert, X } from 'lucide-vue-next'
import { useAuthStore } from '~/stores/auth'

const router = useRouter()
const auth = useAuthStore()

type Step = 'idle' | 'requesting' | 'waiting' | 'fetching-user' | 'success' | 'error'

const step       = ref<Step>('idle')
const errorMsg   = ref('')
const userCode   = ref('')
const verifyUrl  = ref('')
const deviceCode = ref('')
const pollMs     = ref(5000)
const copied     = ref(false)

async function startGitHubLogin() {
  step.value = 'requesting'
  errorMsg.value = ''
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    const resp = await invoke<{
      deviceCode: string
      userCode: string
      verificationUri: string
      expiresIn: number
      interval: number
    }>('github_request_device_code', { scope: 'read:user user:email repo' })

    deviceCode.value = resp.deviceCode
    userCode.value   = resp.userCode
    verifyUrl.value  = resp.verificationUri
    pollMs.value     = (resp.interval || 5) * 1000

    const { open } = await import('@tauri-apps/plugin-shell')
    await open(resp.verificationUri)

    step.value = 'waiting'
    void pollForToken()
  } catch (e: unknown) {
    step.value = 'error'
    errorMsg.value = e instanceof Error ? e.message : String(e)
  }
}

let pollTimer: ReturnType<typeof setTimeout> | null = null
let stopped = false

async function pollForToken() {
  stopped = false
  const tick = async () => {
    if (stopped || step.value !== 'waiting') return
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      const resp = await invoke<{
        accessToken?: string
        scope?: string
        error?: string
        errorDescription?: string
      }>('github_poll_access_token', { deviceCode: deviceCode.value })

      if (resp.accessToken) {
        step.value = 'fetching-user'
        const user = await auth.fetchGitHubUser(resp.accessToken)
        await auth.setGitHubAuth({ accessToken: resp.accessToken, scopes: resp.scope ?? '', user })
        step.value = 'success'
        setTimeout(() => { void router.push('/profile') }, 1200)
        return
      }

      const code = resp.error ?? ''
      if (code === 'authorization_pending' || code === 'slow_down') {
        if (code === 'slow_down') pollMs.value += 5000
        pollTimer = setTimeout(tick, pollMs.value)
      } else {
        step.value = 'error'
        errorMsg.value = resp.errorDescription || resp.error || 'GitHub authorization was denied or expired.'
      }
    } catch (e: unknown) {
      step.value = 'error'
      errorMsg.value = e instanceof Error ? e.message : String(e)
    }
  }
  pollTimer = setTimeout(tick, pollMs.value)
}

function cancelLogin() {
  stopped = true
  if (pollTimer) clearTimeout(pollTimer)
  step.value = 'idle'
  deviceCode.value = userCode.value = verifyUrl.value = ''
}

async function openVerifyUrl() {
  const { open } = await import('@tauri-apps/plugin-shell')
  await open(verifyUrl.value)
}

async function copyCode() {
  await navigator.clipboard.writeText(userCode.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

onUnmounted(() => {
  stopped = true
  if (pollTimer) clearTimeout(pollTimer)
})

onMounted(async () => {
  if (auth.isGitHubConnected) void router.replace('/profile')
})
</script>

<template>
  <div class="mx-auto max-w-md py-10 px-6 space-y-5">
    <div>
      <h2 class="text-sm font-semibold text-[var(--text)] tracking-tight">Connect GitHub</h2>
      <p class="text-xs text-[var(--text-muted)] mt-0.5">Link your GitHub account to import repositories and create issues.</p>
    </div>

    <!-- Success -->
    <div v-if="step === 'success'" class="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4 flex items-center gap-3">
      <div class="grid size-8 shrink-0 place-items-center rounded-full border border-emerald-500/25 bg-emerald-500/15">
        <Check class="size-4 text-emerald-300" />
      </div>
      <div>
        <p class="text-sm font-semibold text-emerald-200">Connected as @{{ auth.githubUser?.login }}</p>
        <p class="text-xs text-[var(--text-muted)] mt-0.5">Redirecting…</p>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="step === 'error'" class="rounded-xl border border-red-500/25 bg-red-500/10 p-4 flex items-start gap-3">
      <TriangleAlert class="size-4 text-red-300 mt-0.5 shrink-0" />
      <div class="min-w-0 flex-1">
        <p class="text-sm font-semibold text-red-200">Authentication failed</p>
        <p class="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">{{ errorMsg }}</p>
        <button class="mt-2 text-xs text-red-300 hover:text-red-200 transition-colors" @click="step = 'idle'">
          Try again
        </button>
      </div>
    </div>

    <!-- Device code: show code + wait -->
    <template v-else-if="step === 'waiting' || step === 'fetching-user'">
      <div class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4">
        <div class="text-center space-y-2">
          <p class="text-xs text-[var(--text-muted)]">Go to <span class="text-indigo-400 cursor-pointer hover:underline" @click="openVerifyUrl">github.com/login/device</span> and enter:</p>
          <div class="mt-2 flex items-center justify-center gap-3">
            <div class="rounded-xl border border-indigo-500/30 bg-indigo-500/[0.08] px-6 py-3">
              <p class="font-mono text-2xl font-bold tracking-[0.25em] text-white">{{ userCode }}</p>
            </div>
            <button
              class="flex size-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-faint)] transition-colors hover:bg-white/[0.05] hover:text-[var(--text)]"
              title="Copy code"
              @click="copyCode"
            >
              <Check v-if="copied" class="size-4 text-emerald-400" />
              <Copy v-else class="size-4" />
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white/[0.03] px-3 py-2.5">
          <Loader2 class="size-3.5 shrink-0 animate-spin" :class="step === 'fetching-user' ? 'text-teal-400' : 'text-indigo-400'" />
          <p class="text-xs text-[var(--text-muted)]">
            {{ step === 'fetching-user' ? 'Fetching your GitHub profile…' : 'Waiting for authorization…' }}
          </p>
        </div>

        <div class="flex gap-2">
          <button
            class="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-indigo-500/25 bg-indigo-500/10 px-3 py-2 text-xs font-medium text-indigo-200 transition-colors hover:bg-indigo-500/15"
            @click="openVerifyUrl"
          >
            <RefreshCw class="size-3.5" />
            Open GitHub
          </button>
          <button
            class="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-2 text-xs text-[var(--text-muted)] transition-colors hover:bg-white/[0.04] hover:text-[var(--text)]"
            @click="cancelLogin"
          >
            <X class="size-3.5" />
            Cancel
          </button>
        </div>
      </div>
    </template>

    <!-- Idle -->
    <template v-else>
      <div class="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-4 space-y-2">
        <p class="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">GitHub Device Flow</p>
        <button
          class="w-full flex items-center gap-3 rounded-lg border border-[var(--border)] px-4 py-3 text-left transition-all hover:border-indigo-500/30 hover:bg-indigo-500/[0.05] cursor-pointer"
          :disabled="step === 'requesting'"
          @click="startGitHubLogin"
        >
          <Loader2 v-if="step === 'requesting'" class="size-4 shrink-0 animate-spin text-indigo-300" />
          <Github v-else class="size-4 shrink-0 text-[var(--text-muted)]" />
          <div>
            <p class="text-xs font-medium text-[var(--text)]">Connect with GitHub</p>
            <p class="text-[10px] text-[var(--text-muted)] mt-0.5">Authorizes via GitHub Device Flow — no password shared</p>
          </div>
        </button>
      </div>
    </template>
  </div>
</template>
