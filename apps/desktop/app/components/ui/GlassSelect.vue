<script setup lang="ts">
defineOptions({ inheritAttrs: false })

withDefaults(defineProps<{
  modelValue?: string
  class?: string
}>(), {})

defineEmits<{ 'update:modelValue': [string] }>()
</script>

<template>
  <div class="relative" :class="$props.class">
    <select
      :value="modelValue"
      v-bind="$attrs"
      class="w-full appearance-none rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 pr-7 text-xs text-[var(--text)] outline-none transition-colors focus:border-indigo-500/50 cursor-pointer h-9"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <slot />
    </select>
    <svg
      class="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-[var(--text-faint)]"
      viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6" />
    </svg>
  </div>
</template>
