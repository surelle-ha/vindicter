<script setup lang="ts">
import { Loader2, Eye, EyeOff, Mail, Lock } from 'lucide-vue-next'

definePageMeta({ layout: 'auth' })

useLandingSeo({
  title: 'Login - Vindicter',
  description: 'Login to your Vindicter dashboard.',
  path: '/auth/login',
})

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const errorMessage = ref('')
const email = ref('')
const password = ref('')
const showPassword = ref(false)

async function login() {
  errorMessage.value = ''
  loading.value = true
  try {
    const supabase = useSupabase()
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value.trim(),
      password: password.value,
    })
    if (error) throw error
    await router.push(String(route.query.redirect ?? '/dashboard'))
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to login right now.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-7">
      <p class="text-[10px] font-semibold uppercase tracking-[0.28em] mb-2" style="color:rgba(139,92,246,0.70);">Member Portal</p>
      <h1 class="font-display text-[32px] font-black uppercase leading-none" style="color:rgba(255,255,255,0.92);">Welcome back</h1>
      <p class="mt-2.5 text-[13px] leading-relaxed" style="color:rgba(255,255,255,0.40);">
        Sign in to access your Vindicter dashboard.
      </p>
    </div>

    <!-- Form card -->
    <div class="rounded-2xl p-6 space-y-4" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);">
      <form class="space-y-4" @submit.prevent="login">

        <!-- Email -->
        <div>
          <label class="block mb-2 text-[10px] font-semibold uppercase tracking-wider" style="color:rgba(255,255,255,0.35);">Email address</label>
          <div class="relative">
            <Mail class="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style="color:rgba(255,255,255,0.22);" />
            <input
              v-model="email"
              type="email"
              required
              autocomplete="email"
              placeholder="you@example.com"
              class="w-full rounded-xl pl-9 pr-4 py-2.5 text-[13px] text-white outline-none transition-colors border border-white/8 bg-white/[0.04] focus:border-accent/45"
            />
          </div>
        </div>

        <!-- Password -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-[10px] font-semibold uppercase tracking-wider" style="color:rgba(255,255,255,0.35);">Password</label>
            <span class="text-[10px]" style="color:rgba(139,92,246,0.35);">Forgot password?</span>
          </div>
          <div class="relative">
            <Lock class="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style="color:rgba(255,255,255,0.22);" />
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              required
              autocomplete="current-password"
              placeholder="Your password"
              class="w-full rounded-xl pl-9 pr-10 py-2.5 text-[13px] text-white outline-none transition-colors border border-white/8 bg-white/[0.04] focus:border-accent/45"
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:text-white/50"
              style="color:rgba(255,255,255,0.22);"
              @click="showPassword = !showPassword"
            >
              <Eye v-if="!showPassword" class="h-3.5 w-3.5" />
              <EyeOff v-else class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <!-- Error -->
        <div v-if="errorMessage" class="rounded-xl px-3.5 py-3 text-[12px]" style="background:rgba(242,63,66,0.08);border:1px solid rgba(242,63,66,0.18);color:rgba(242,63,66,0.85);">
          {{ errorMessage }}
        </div>

        <!-- Submit -->
        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded-xl py-3 text-[13px] font-bold flex items-center justify-center gap-2 transition-colors bg-accent hover:bg-accent/90 disabled:opacity-60 disabled:cursor-not-allowed text-white"
        >
          <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
          {{ loading ? 'Signing in…' : 'Sign in' }}
        </button>

      </form>
    </div>

    <!-- Register link -->
    <p class="mt-5 text-center text-[12px]" style="color:rgba(255,255,255,0.35);">
      New to Vindicter?
      <NuxtLink to="/auth/register" class="font-semibold transition-colors text-accent hover:text-accent/80">Create an account</NuxtLink>
    </p>
  </div>
</template>
