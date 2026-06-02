<script setup lang="ts">
definePageMeta({ layout: false })
// Login is now handled inline in the dashboard layout.
// Redirect anyone who visits this URL directly to /dashboard.
await navigateTo('/dashboard', { replace: true })
</script>
