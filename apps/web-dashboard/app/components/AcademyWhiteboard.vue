<script setup lang="ts">
import { ChartSpline, ZoomIn, ZoomOut, RotateCcw, X, ChevronUp } from 'lucide-vue-next'

export interface WhiteboardItem {
  id: string
  title: string
  content: string
  createdAt: string
}

const props = defineProps<{
  items: WhiteboardItem[]
  visible: boolean
  height?: string
}>()

const emit = defineEmits<{ close: []; select: [id: string] }>()

const selectedId = ref<string>('')
const viewportRef = ref<HTMLDivElement | null>(null)
const diagramRef = ref<HTMLDivElement | null>(null)
const renderError = ref('')
const rendering = ref(false)
const scale = ref(1)
const pan = reactive({ x: 0, y: 0 })
const isDragging = ref(false)
let dragStartX = 0, dragStartY = 0
let mermaidInit = false

const activeItem = computed(() =>
  props.items.find(i => i.id === selectedId.value) ?? props.items[props.items.length - 1] ?? null,
)

watch(() => props.items, (items) => {
  if (items.length && !selectedId.value) selectedId.value = items[items.length - 1]!.id
  if (items.length) selectedId.value = items[items.length - 1]!.id
}, { deep: true })

function zoomBy(delta: number) {
  scale.value = Math.min(3, Math.max(0.3, +(scale.value + delta).toFixed(2)))
}

function resetView() { scale.value = 1; pan.x = 0; pan.y = 0 }

function onWheel(e: WheelEvent) {
  e.preventDefault()
  zoomBy(e.deltaY > 0 ? -0.08 : 0.08)
}

function startPan(e: PointerEvent) {
  if (e.button !== 0 || renderError.value) return
  isDragging.value = true
  dragStartX = e.clientX; dragStartY = e.clientY
  viewportRef.value?.setPointerCapture(e.pointerId)
}

function movePan(e: PointerEvent) {
  if (!isDragging.value) return
  pan.x += e.clientX - dragStartX; pan.y += e.clientY - dragStartY
  dragStartX = e.clientX; dragStartY = e.clientY
}

function stopPan(e: PointerEvent) {
  if (!isDragging.value) return
  isDragging.value = false
  viewportRef.value?.hasPointerCapture(e.pointerId) && viewportRef.value.releasePointerCapture(e.pointerId)
}

async function renderDiagram() {
  if (!activeItem.value) { if (diagramRef.value) diagramRef.value.innerHTML = ''; return }
  rendering.value = true
  renderError.value = ''
  resetView()
  try {
    const mermaid = (await import('mermaid')).default
    if (!mermaidInit) {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        themeVariables: {
          primaryColor: '#4338ca', primaryTextColor: '#e2e8f0', primaryBorderColor: '#6366f1',
          lineColor: '#64748b', secondaryColor: '#1e1b4b', tertiaryColor: '#0f172a',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        },
      })
      mermaidInit = true
    }
    const id = 'wb-' + Math.random().toString(36).slice(2, 9)
    const { svg } = await mermaid.render(id, activeItem.value.content)
    await nextTick()
    if (diagramRef.value) {
      diagramRef.value.innerHTML = svg
      const svgEl = diagramRef.value.querySelector('svg')
      if (svgEl) {
        svgEl.style.maxWidth = 'none'; svgEl.style.height = 'auto'
        const vb = svgEl.getAttribute('viewBox')?.split(/\s+/).map(Number)
        if (vb?.length === 4 && vb.every(Number.isFinite)) {
          svgEl.style.width = `${vb[2]}px`; svgEl.style.height = `${vb[3]}px`
        }
        svgEl.removeAttribute('height')
      }
    }
  }
  catch (e) { renderError.value = e instanceof Error ? e.message : 'Render failed' }
  finally { rendering.value = false }
}

watch(() => activeItem.value?.id, () => void renderDiagram())
watch(() => props.visible, (v) => { if (v && activeItem.value) void renderDiagram() })

onUnmounted(() => { isDragging.value = false })
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 -translate-y-4"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 -translate-y-4"
  >
    <div v-if="visible" class="flex overflow-hidden rounded-xl border" :style="`height:${props.height ?? '300px'};border-color:rgba(20,184,166,0.25);background:rgba(0,0,0,0.40);`">

      <!-- Sidebar: diagram list -->
      <aside class="flex w-44 shrink-0 flex-col border-r" style="border-color:rgba(20,184,166,0.15);">
        <div class="flex items-center gap-2 border-b px-3 py-2 shrink-0" style="border-color:rgba(20,184,166,0.15);">
          <span class="flex-1 text-[10px] font-bold uppercase tracking-widest" style="color:rgba(20,184,166,0.80);">Visuals</span>
          <button class="cursor-pointer transition-colors hover:text-white/60" style="color:rgba(255,255,255,0.30);" @click="emit('close')">
            <ChevronUp class="size-3.5" />
          </button>
        </div>
        <div class="flex-1 overflow-y-auto p-1.5 space-y-1" style="scrollbar-width:thin;">
          <button
            v-for="item in items"
            :key="item.id"
            class="flex w-full items-center gap-1.5 rounded-md border px-2 py-1.5 text-left text-[11px] transition-colors cursor-pointer"
            :style="activeItem?.id === item.id
              ? 'border-color:rgba(20,184,166,0.30);background:rgba(20,184,166,0.10);color:rgba(20,184,166,0.90);'
              : 'border-color:transparent;color:rgba(255,255,255,0.35);'"
            @click="selectedId = item.id"
          >
            <ChartSpline class="size-3 shrink-0" />
            <span class="truncate font-medium">{{ item.title }}</span>
          </button>
          <div v-if="!items.length" class="flex h-24 items-center justify-center px-3 text-center">
            <p class="text-[10px] leading-relaxed" style="color:rgba(255,255,255,0.20);">Professor diagrams appear here.</p>
          </div>
        </div>
      </aside>

      <!-- Viewport -->
      <div class="relative flex-1 overflow-hidden">
        <!-- Toolbar -->
        <div class="absolute left-2 top-2 z-10 flex items-center gap-1">
          <button class="h-6 w-6 grid place-items-center rounded border cursor-pointer transition-colors hover:bg-white/[0.08]" style="border-color:rgba(255,255,255,0.10);color:rgba(255,255,255,0.45);" @click="zoomBy(0.1)"><ZoomIn class="size-3" /></button>
          <button class="h-6 w-6 grid place-items-center rounded border cursor-pointer transition-colors hover:bg-white/[0.08]" style="border-color:rgba(255,255,255,0.10);color:rgba(255,255,255,0.45);" @click="zoomBy(-0.1)"><ZoomOut class="size-3" /></button>
          <button class="h-6 w-6 grid place-items-center rounded border cursor-pointer transition-colors hover:bg-white/[0.08]" style="border-color:rgba(255,255,255,0.10);color:rgba(255,255,255,0.45);" @click="resetView"><RotateCcw class="size-3" /></button>
          <span class="text-[9px] tabular-nums ml-1" style="color:rgba(255,255,255,0.25);">{{ Math.round(scale * 100) }}%</span>
        </div>

        <!-- Pan/zoom area -->
        <div
          ref="viewportRef"
          class="absolute inset-0 overflow-hidden"
          :style="{ cursor: isDragging ? 'grabbing' : 'grab' }"
          @wheel.prevent="onWheel"
          @pointerdown="startPan"
          @pointermove="movePan"
          @pointerup="stopPan"
          @pointercancel="stopPan"
        >
          <div class="absolute left-1/2 top-1/2" :style="{ transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${scale})`, transformOrigin: 'center center' }">
            <div v-if="rendering" class="text-[11px]" style="color:rgba(255,255,255,0.30);">Rendering…</div>
            <div v-else-if="renderError" class="max-w-xs rounded-lg border border-red-500/25 bg-red-500/8 p-4 text-[11px] text-red-300">{{ renderError }}</div>
            <div v-else ref="diagramRef" class="select-none" />
          </div>
        </div>
      </div>

    </div>
  </Transition>
</template>
