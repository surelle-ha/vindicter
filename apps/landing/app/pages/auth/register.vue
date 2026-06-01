<script setup lang="ts">
import { Loader2, Eye, EyeOff, Mail, Lock, User } from 'lucide-vue-next'

definePageMeta({ layout: 'auth' })

useLandingSeo({
  title: 'Register - Vindicta',
  description: 'Create a Vindicta account for the dashboard.',
  path: '/auth/register',
})

const router = useRouter()

const loading = ref(false)
const errorMessage = ref('')
const notice = ref('')
const displayName = ref('')
const email = ref('')
const password = ref('')
const showPassword = ref(false)

async function register() {
  errorMessage.value = ''
  notice.value = ''
  loading.value = true
  try {
    const supabase = useSupabase()
    const { data, error } = await supabase.auth.signUp({
      email: email.value.trim(),
      password: password.value,
      options: {
        data: { display_name: displayName.value.trim() },
      },
    })
    if (error) throw error
    if (data.session) {
      await router.push('/dashboard')
      return
    }
    notice.value = 'Account created. Check your email to confirm your account before logging in.'
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to register right now.'
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
      <h1 class="font-display text-[32px] font-black uppercase leading-none" style="color:rgba(255,255,255,0.92);">Create account</h1>
      <p class="mt-2.5 text-[13px] leading-relaxed" style="color:rgba(255,255,255,0.40);">
        New accounts start with the standard user role.
      </p>
    </div>

    <!-- Form card -->
    <div class="rounded-2xl p-6 space-y-4" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);">
      <form class="space-y-4" @submit.prevent="register">

        <!-- Display name -->
        <div>
          <label class="block mb-2 text-[10px] font-semibold uppercase tracking-wider" style="color:rgba(255,255,255,0.35);">Full name</label>
          <div class="relative">
            <User class="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style="color:rgba(255,255,255,0.22);" />
            <input
              v-model="displayName"
              required
              autocomplete="name"
              placeholder="Jane Smith"
              class="w-full rounded-xl pl-9 pr-4 py-2.5 text-[13px] text-white outline-none transition-colors border border-white/8 bg-white/[0.04] focus:border-accent/45"
            />
          </div>
        </div>

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
          <label class="block mb-2 text-[10px] font-semibold uppercase tracking-wider" style="color:rgba(255,255,255,0.35);">Password</label>
          <div class="relative">
            <Lock class="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style="color:rgba(255,255,255,0.22);" />
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              required
              minlength="6"
              autocomplete="new-password"
              placeholder="At least 6 characters"
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

        <!-- Notice -->
        <div v-if="notice" class="rounded-xl px-3.5 py-3 text-[12px]" style="background:rgba(35,165,90,0.08);border:1px solid rgba(35,165,90,0.18);color:rgba(35,165,90,0.85);">
          {{ notice }}
        </div>

        <!-- Submit -->
        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded-xl py-3 text-[13px] font-bold flex items-center justify-center gap-2 transition-colors bg-accent hover:bg-accent/90 disabled:opacity-60 disabled:cursor-not-allowed text-white"
        >
          <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
          {{ loading ? 'Creating account…' : 'Create account' }}
        </button>

      </form>
    </div>

    <!-- Login link -->
    <p class="mt-5 text-center text-[12px]" style="color:rgba(255,255,255,0.35);">
      Already registered?
      <NuxtLink to="/auth/login" class="font-semibold transition-colors text-accent hover:text-accent/80">Sign in</NuxtLink>
    </p>
  </div>
</template>
