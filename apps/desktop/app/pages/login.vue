<script setup lang="ts">
import { Eye, EyeOff, Loader2, LogIn, TriangleAlert } from 'lucide-vue-next'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'auth' })

const router = useRouter()
const auth   = useAuthStore()

const email       = ref('')
const password    = ref('')
const showPass    = ref(false)
const loading     = ref(false)
const errorMsg    = ref('')
const showPicker  = ref(false)

async function signIn() {
  if (!email.value.trim() || !password.value) return
  loading.value  = true
  errorMsg.value = ''
  try {
    await auth.loginWithApi(email.value.trim(), password.value)
    if (auth.workspaces.length > 1 && !auth.activeWorkspaceId) {
      showPicker.value = true
    } else {
      void router.replace('/')
    }
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : 'Sign in failed.'
  } finally {
    loading.value = false
  }
}

function onWorkspaceSelected(id: string) {
  void auth.setActiveWorkspace(id)
  showPicker.value = false
  void router.replace('/')
}

function onWindowKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !loading.value) void signIn()
}

onMounted(async () => {
  if (auth.isApiAuthenticated) void router.replace('/')
  window.addEventListener('keydown', onWindowKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onWindowKeydown)
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center px-6">
    <div class="w-full max-w-sm space-y-6">
      <!-- Brand -->
      <div class="text-center">
        <p class="text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-300/70">Vindicter</p>
        <h1 class="mt-2 text-xl font-bold tracking-tight text-[var(--text)]">Sign in</h1>
        <p class="mt-1 text-xs text-[var(--text-muted)]">Access your security workspace</p>
      </div>

      <!-- Sign-in card -->
      <div class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4">
        <!-- Error -->
        <div v-if="errorMsg" class="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/[0.07] px-3 py-2.5">
          <TriangleAlert class="mt-0.5 size-3.5 shrink-0 text-red-400" />
          <p class="text-xs text-red-300">{{ errorMsg }}</p>
        </div>

        <!-- Email -->
        <div>
          <label class="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">Email</label>
          <input
            v-model="email"
            type="email"
            autocomplete="email"
            placeholder="Enter your email"
            class="w-full rounded-lg border border-[var(--border)] bg-black/20 px-3 py-2 text-xs text-[var(--text)] outline-none placeholder:text-[var(--text-faint)] transition-colors focus:border-indigo-500/50"
          >
        </div>

        <!-- Password -->
        <div>
          <label class="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">Password</label>
          <div class="relative">
            <input
              v-model="password"
              :type="showPass ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="••••••••"
              class="w-full rounded-lg border border-[var(--border)] bg-black/20 px-3 py-2 pr-9 text-xs text-[var(--text)] outline-none placeholder:text-[var(--text-faint)] transition-colors focus:border-indigo-500/50"
            >
            <button
              type="button"
              class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)] transition-colors hover:text-[var(--text-muted)] cursor-pointer"
              tabindex="-1"
              @click="showPass = !showPass"
            >
              <EyeOff v-if="showPass" class="size-3.5" />
              <Eye v-else class="size-3.5" />
            </button>
          </div>
        </div>

        <!-- Submit -->
        <button
          class="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          :disabled="loading || !email.trim() || !password"
          @click="signIn"
        >
          <Loader2 v-if="loading" class="size-3.5 animate-spin" />
          <LogIn v-else class="size-3.5" />
          {{ loading ? 'Signing in…' : 'Sign In' }}
        </button>
      </div>

      <p class="text-center text-[10px] text-[var(--text-faint)]">
        Contact your administrator if you don't have an account.
      </p>
    </div>

    <!-- Workspace picker (shown when user has multiple workspaces) -->
    <WorkspacePicker
      v-if="showPicker"
      :workspaces="auth.workspaces"
      :model-value="showPicker"
      @update:model-value="showPicker = $event"
      @select="onWorkspaceSelected"
    />
  </div>
</template>
