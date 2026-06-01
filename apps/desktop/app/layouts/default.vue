<script setup lang="ts">
const aiActivity = useAIActivityStore()
const feed = useNotificationFeedStore()

onMounted(() => {
  void aiActivity.load()
  feed.load()
})
</script>

<template>
  <div class="h-screen flex flex-col overflow-hidden" style="background: var(--bg-base);">
    <AppBackground />
    <TitleBar />
    <div class="relative z-10 flex flex-1 overflow-hidden">
      <AppSidebar />
      <main class="flex-1 overflow-auto p-5 custom-scroll">
        <slot />
      </main>
    </div>
    <NotificationToast />
    <NotificationDrawer />
    <FloatingAIActivity />
    <FeaturesModal />
    <AppUpdateBanner />
  </div>
</template>
