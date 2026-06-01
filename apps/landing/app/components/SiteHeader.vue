<script setup lang="ts">
const isLoggedIn = ref(false)
let unsubscribe: (() => void) | undefined

onMounted(async () => {
  try {
    const supabase = useSupabase()
    const { data } = await supabase.auth.getSession()
    isLoggedIn.value = Boolean(data.session)

    const listener = supabase.auth.onAuthStateChange((_event, session) => {
      isLoggedIn.value = Boolean(session)
    })
    unsubscribe = () => listener.data.subscription.unsubscribe()
  } catch {
    isLoggedIn.value = false
  }
})

onUnmounted(() => unsubscribe?.())
</script>

<template>
  <nav class="nav-glass fixed left-0 right-0 top-0 z-50 flex w-full items-center justify-between px-5 py-4 sm:px-8">
    <NuxtLink to="/" class="flex items-center gap-3">
      <img src="/icon.png" alt="Vindicta" class="h-7 w-7" />
      <span class="font-display text-[17px] font-black uppercase tracking-widest select-none">Vindicta</span>
      <span class="hidden rounded-full bg-accent/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-accent sm:inline">Security</span>
    </NuxtLink>

    <div class="flex items-center gap-4 text-[13px] text-white/50 sm:gap-6">
      <NuxtLink to="/#features" class="hidden transition-colors hover:text-white sm:inline">Features</NuxtLink>
      <NuxtLink to="/#academy" class="hidden transition-colors hover:text-white sm:inline">Academy</NuxtLink>
      <NuxtLink to="/defendcore" class="hidden transition-colors hover:text-white sm:inline">DefendCore</NuxtLink>
      <NuxtLink
        to="/dashboard"
        class="inline-flex items-center rounded-lg border border-white/10 px-4 py-1.5 text-[12px] font-semibold text-white/70 transition hover:border-accent/40 hover:bg-white/[0.04] hover:text-white"
      >
        {{ isLoggedIn ? 'Dashboard' : 'Login' }}
      </NuxtLink>
      <NuxtLink
        to="/standard-beta"
        class="hidden items-center gap-1.5 rounded-lg bg-accent px-4 py-1.5 text-[12px] font-semibold text-white transition hover:bg-accent/90 active:scale-[0.98] sm:flex"
      >
        <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
        </svg>
        Join Beta
      </NuxtLink>
    </div>
  </nav>
</template>
