<script setup lang="ts">
const currentYear = new Date().getFullYear()
</script>

<template>
  <div class="flex min-h-screen flex-col overflow-x-hidden">
    <SiteHeader />
    <slot />
    <SiteFooter :year="currentYear" />
  </div>
</template>
