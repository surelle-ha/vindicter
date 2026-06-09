<script setup lang="ts">
import { Check, Minus } from 'lucide-vue-next'

const model = defineModel<boolean>({ default: false })

const props = withDefaults(defineProps<{
  disabled?: boolean
  size?: 'sm' | 'md'
  checked?: boolean
  indeterminate?: boolean
  accent?: 'indigo' | 'amber' | 'emerald' | 'red'
}>(), {
  disabled: false,
  size: 'md',
  accent: 'indigo',
})

const emit = defineEmits<{ change: [boolean] }>()

const isChecked = computed(() => props.checked !== undefined ? props.checked : model.value)

const checkedClasses: Record<string, string> = {
  indigo:  'border-indigo-400 bg-indigo-500 text-white shadow-[0_0_14px_rgba(99,102,241,0.3)]',
  amber:   'border-amber-400 bg-amber-500 text-white shadow-[0_0_14px_rgba(245,158,11,0.3)]',
  emerald: 'border-emerald-400 bg-emerald-500 text-white shadow-[0_0_14px_rgba(16,185,129,0.3)]',
  red:     'border-red-400 bg-red-500 text-white shadow-[0_0_14px_rgba(239,68,68,0.3)]',
}

const hoverClasses: Record<string, string> = {
  indigo:  'hover:border-indigo-400/50 hover:bg-indigo-500/10',
  amber:   'hover:border-amber-400/50 hover:bg-amber-500/10',
  emerald: 'hover:border-emerald-400/50 hover:bg-emerald-500/10',
  red:     'hover:border-red-400/50 hover:bg-red-500/10',
}

function handleClick() {
  if (props.disabled) return
  const newVal = props.indeterminate ? true : !isChecked.value
  if (props.checked !== undefined) {
    emit('change', newVal)
  } else {
    model.value = newVal
    emit('change', newVal)
  }
}
</script>

<template>
  <button
    type="button"
    class="inline-flex items-center gap-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50"
    :disabled="disabled"
    @click="handleClick"
  >
    <span
      class="grid shrink-0 place-items-center rounded-md border transition-all"
      :class="[
        size === 'sm' ? 'size-4' : 'size-5',
        (isChecked || indeterminate)
          ? checkedClasses[accent]
          : `border-white/15 bg-white/[0.04] text-transparent ${hoverClasses[accent]}`,
      ]"
    >
      <Minus v-if="indeterminate && !isChecked" :class="size === 'sm' ? 'size-3' : 'size-3.5'" stroke-width="3" />
      <Check v-else :class="size === 'sm' ? 'size-3' : 'size-3.5'" stroke-width="3" />
    </span>
    <slot />
  </button>
</template>
