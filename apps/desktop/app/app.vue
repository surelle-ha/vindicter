<script setup lang="ts">
const app = useAppStore()
const user = useUserStore()
const projects = useProjectsStore()
const auth = useAuthStore()
const updater = useAppUpdater()
const router = useRouter()

// Init persisted settings and apply theme before first render
await app.init()
await Promise.all([user.load(), projects.loadProjects(), auth.load()])

// Apply theme to <html> element
useHead({
  htmlAttrs: {
    'data-theme': computed(() => app.theme),
  },
})

onMounted(() => {
  document.addEventListener('contextmenu', (e) => e.preventDefault())
  if (app.wslAutoStart) {
    void startConfiguredWslBackends()
  }
  // Check for updates silently in the background 30s after launch
  setTimeout(() => { void updater.checkAndDownload() }, 30_000)
})

async function onLaunched() {
  if (!user.complete) {
    await router.push('/onboarding')
  } else {
    await router.push('/')
  }
}

async function startConfiguredWslBackends() {
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    const profiles = app.wslProfiles.filter(profile => profile.enabled)
    await Promise.all(profiles.map(profile => invoke('wsl_start_distribution', { name: profile.distro })))
  }
  catch {
    // WSL is optional. Settings exposes the detailed status and remediation.
  }
}
</script>

<template>
  <LaunchScreen v-if="!app.launched" @launched="onLaunched" />
  <template v-else>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <ContextMenu />
  </template>
</template>
