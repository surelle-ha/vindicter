<script setup lang="ts">
const route = useRoute()
const segment = (route.params.all as string[] | string)
const path = Array.isArray(segment) ? segment.join('/') : (segment ?? '')

// Map old /dashboard/* paths to new equivalents
const redirectMap: Record<string, string> = {
  'profile':             '/profile',
  'updates':             '/updates',
  'subscription':        '/api',
  'admin/users':         '/admin/users',
  'admin/tickets':       '/admin/tickets',
  'admin/beta':          '/admin/beta',
}

await navigateTo(redirectMap[path] ?? '/support', { redirectCode: 301 })
</script>
