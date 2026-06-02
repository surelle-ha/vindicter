<script setup lang="ts">
import { Settings } from 'lucide-vue-next'
import type { EditorSlug } from '~/types/vindicta'
import type { Component } from 'vue'

const wizard = useWizardStore()

// Inline SVG components as render functions for brand logos
const VSCodeLogo = defineComponent({
  render() {
    return h('svg', { viewBox: '0 0 100 100', fill: 'none', xmlns: 'http://www.w3.org/2000/svg', class: 'size-7' }, [
      h('mask', { id: 'vs-mask', maskUnits: 'userSpaceOnUse', x: '0', y: '0', width: '100', height: '100' }, [
        h('path', { d: 'M70.9 3.48L38.06 33.75 15.9 17.95 5 23.74v52.52l10.9 5.79 22.25-15.8L70.9 96.52 95 85.3V14.7L70.9 3.48zm0 69.01L49.3 50l21.6-22.49V72.5z', fill: 'white' }),
      ]),
      h('g', { mask: 'url(#vs-mask)' }, [
        h('path', { d: 'M95 14.7L70.9 3.48 38.06 33.75 15.9 17.95 5 23.74v52.52l10.9 5.79 22.25-15.8L70.9 96.52 95 85.3V14.7z', fill: '#0065A9' }),
        h('path', { d: 'M95 14.7L70.9 3.48v93.04L95 85.3V14.7z', fill: '#007ACC' }),
        h('path', { d: 'M5 23.74l10.9-5.79v52.1L5 76.26V23.74z', fill: '#1F9CF0' }),
      ]),
    ])
  },
})

const CursorLogo = defineComponent({
  render() {
    return h('svg', { viewBox: '0 0 100 100', fill: 'none', xmlns: 'http://www.w3.org/2000/svg', class: 'size-7' }, [
      h('rect', { width: '100', height: '100', rx: '20', fill: '#1A1A1A' }),
      h('path', { d: 'M50 15L85 72.5H15L50 15Z', fill: 'white', opacity: '0.9' }),
      h('path', { d: 'M50 38L69 72.5H31L50 38Z', fill: '#1A1A1A' }),
    ])
  },
})

const ZedLogo = defineComponent({
  render() {
    return h('svg', { viewBox: '0 0 100 100', fill: 'none', xmlns: 'http://www.w3.org/2000/svg', class: 'size-7' }, [
      h('rect', { width: '100', height: '100', rx: '18', fill: '#084CCF' }),
      h('text', { x: '15', y: '75', fill: 'white', 'font-size': '62', 'font-weight': '800', 'font-family': 'system-ui, sans-serif', 'letter-spacing': '-4' }, 'Z'),
    ])
  },
})

const NeovimLogo = defineComponent({
  render() {
    return h('svg', { viewBox: '0 0 100 100', fill: 'none', xmlns: 'http://www.w3.org/2000/svg', class: 'size-7' }, [
      h('path', { d: 'M10 10L35 10L35 65L65 10L90 10L90 90L65 90L65 35L35 90L10 90Z', fill: '#57A143' }),
      h('path', { d: 'M10 10L35 65L10 90Z', fill: '#3E8031' }),
    ])
  },
})

const WebStormLogo = defineComponent({
  render() {
    return h('svg', { viewBox: '0 0 100 100', fill: 'none', xmlns: 'http://www.w3.org/2000/svg', class: 'size-7' }, [
      h('defs', [
        h('linearGradient', { id: 'ws-grad', x1: '0', y1: '0', x2: '100', y2: '100', gradientUnits: 'userSpaceOnUse' }, [
          h('stop', { 'stop-color': '#22D3EE' }),
          h('stop', { offset: '1', 'stop-color': '#6366F1' }),
        ]),
      ]),
      h('rect', { width: '100', height: '100', rx: '18', fill: 'url(#ws-grad)' }),
      h('rect', { x: '15', y: '70', width: '40', height: '14', rx: '3', fill: 'black' }),
      h('text', { x: '18', y: '82', fill: 'white', 'font-size': '11', 'font-weight': '700', 'font-family': 'system-ui, sans-serif' }, 'WS'),
      h('path', { d: 'M20 20H80V55L57 35L20 55Z', fill: 'rgba(0,0,0,0.4)' }),
      h('path', { d: 'M20 20L57 35L20 55Z', fill: 'rgba(0,0,0,0.2)' }),
    ])
  },
})

const editors: { slug: EditorSlug; name: string; logo: Component }[] = [
  { slug: 'vscode',    name: 'VS Code',   logo: VSCodeLogo },
  { slug: 'cursor',    name: 'Cursor',    logo: CursorLogo },
  { slug: 'zed',       name: 'Zed',       logo: ZedLogo },
  { slug: 'neovim',    name: 'Neovim',    logo: NeovimLogo },
  { slug: 'webstorm',  name: 'WebStorm',  logo: WebStormLogo },
  { slug: 'other',     name: 'Other',     logo: Settings },
]
</script>

<template>
  <div class="space-y-5">
    <div>
      <h3 class="text-base font-semibold text-[var(--text)] mb-1">Which editor do you use?</h3>
      <p class="text-sm text-[var(--text-muted)]">Helps Vindicter tailor integrations for your workflow.</p>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <button
        v-for="editor in editors"
        :key="editor.slug"
        class="glass glass-hover flex flex-col items-center gap-2 py-5 px-3 rounded-xl transition-all"
        :class="[
          wizard.selectedEditor === editor.slug
            ? 'border-indigo-500/50 bg-indigo-500/10 glow-border-purple'
            : '',
        ]"
        @click="wizard.selectedEditor = editor.slug"
      >
        <component :is="editor.logo" class="size-7" />
        <span
          class="text-xs font-medium transition-colors"
          :class="wizard.selectedEditor === editor.slug ? 'text-indigo-300' : 'text-[var(--text-muted)]'"
        >
          {{ editor.name }}
        </span>
        <div
          v-if="wizard.selectedEditor === editor.slug"
          class="size-4 rounded-full bg-indigo-500 flex items-center justify-center"
        >
          <svg class="size-2.5" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <div v-else class="size-4 rounded-full border border-white/20" />
      </button>
    </div>
  </div>
</template>
