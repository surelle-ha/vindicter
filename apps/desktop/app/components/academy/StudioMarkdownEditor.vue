<script setup lang="ts">
import { renderMarkdown } from '~/utils/markdown'

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const showPreview = ref(true)

const rendered = computed(() => {
  if (!props.modelValue) return '<p class="text-[var(--text-faint)] italic">Nothing to preview yet.</p>'
  return renderMarkdown(props.modelValue) as string
})
</script>

<template>
  <div class="flex h-full min-h-0 gap-2">
    <div class="flex flex-col min-w-0" :class="showPreview ? 'w-1/2' : 'w-full'">
      <div class="flex items-center justify-between mb-1.5">
        <span class="text-[10px] text-[var(--text-faint)] font-medium uppercase tracking-wide">Markdown</span>
        <button
          class="text-[10px] text-[var(--text-faint)] hover:text-[var(--text-muted)] transition-colors"
          @click="showPreview = !showPreview"
        >
          {{ showPreview ? 'Hide preview' : 'Show preview' }}
        </button>
      </div>
      <textarea
        :value="modelValue"
        :placeholder="placeholder ?? 'Write markdown here…'"
        class="flex-1 w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2.5 font-mono text-xs text-[var(--text)] placeholder-[var(--text-faint)] focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-colors leading-relaxed"
        spellcheck="false"
        @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      />
    </div>

    <div v-if="showPreview" class="w-1/2 flex flex-col min-w-0">
      <span class="text-[10px] text-[var(--text-faint)] font-medium uppercase tracking-wide mb-1.5">Preview</span>
      <div
        class="flex-1 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 prose prose-invert prose-sm max-w-none text-xs text-[var(--text)] leading-relaxed"
        v-html="rendered"
      />
    </div>
  </div>
</template>
