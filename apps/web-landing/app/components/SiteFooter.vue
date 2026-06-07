<script setup lang="ts">
defineProps<{
  year: number
}>()
</script>

<template>
  <footer class="border-t border-white/5 bg-base px-5 py-6 text-[11px] text-white/25 sm:px-8">
    <div class="flex flex-col items-center justify-between gap-4 sm:flex-row">
      <div class="flex flex-col items-center gap-3 sm:flex-row sm:gap-5">
        <div class="flex items-center gap-3">
          <img src="/icon.png" alt="Vindicter" class="h-5 w-5 opacity-60" />
          <span>&copy; {{ year }} Vindicter. All rights reserved.</span>
        </div>
        <span class="hidden text-white/15 sm:inline">/</span>
        <span class="text-white/20">AI-powered security for modern teams.</span>
      </div>

      <div class="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        <NuxtLink to="/standard-beta" class="transition-colors hover:text-white/60">Open Beta</NuxtLink>
        <NuxtLink to="/docs" class="transition-colors hover:text-white/60">Docs</NuxtLink>
        <NuxtLink to="/faq" class="transition-colors hover:text-white/60">FAQ</NuxtLink>
        <NuxtLink to="/support" class="transition-colors hover:text-white/60">Support</NuxtLink>
        <NuxtLink to="/privacy" class="transition-colors hover:text-white/60">Privacy</NuxtLink>
        <NuxtLink to="/terms" class="transition-colors hover:text-white/60">Terms</NuxtLink>
      </div>
    </div>
  </footer>
</template>
