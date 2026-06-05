<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  icon?: object
  iconColor?: string
  iconBg?: string
  height?: string
}>()
</script>

<template>
  <div class="relative overflow-hidden" :style="`height: ${height ?? '10rem'}`">
    <!-- Dither background -->
    <ClientOnly>
      <Dither
        class="absolute inset-0"
        :wave-speed="0.025"
        :wave-frequency="2.0"
        :wave-amplitude="0.28"
        :wave-color="[0.28, 0.24, 0.55]"
        :color-num="5"
        :pixel-size="2"
        :disable-animation="false"
        :enable-mouse-interaction="false"
        :mouse-radius="0.6"
      />
    </ClientOnly>

    <!-- Gradient overlay -->
    <div
      class="absolute inset-0"
      style="background: linear-gradient(to bottom, rgba(17,18,21,0.15) 0%, rgba(17,18,21,0.80) 100%);"
    />

    <!-- Content -->
    <div class="absolute inset-0 flex flex-col justify-end px-6 pb-5">
      <div class="flex items-end gap-3">
        <!-- Icon slot or prop icon -->
        <div
          v-if="icon || $slots.icon"
          class="h-8 w-8 flex items-center justify-center rounded-lg shrink-0"
          :style="`background:${iconBg ?? 'rgba(139,92,246,0.25)'};border:1px solid ${iconColor ?? 'rgba(139,92,246,0.40)'};backdrop-filter:blur(8px);`"
        >
          <slot name="icon">
            <component :is="icon" class="h-4 w-4" :style="`color:${iconColor ?? 'rgba(167,139,250,0.95)'};`" />
          </slot>
        </div>

        <div class="flex-1">
          <h1
            class="font-display font-black uppercase tracking-wide leading-none"
            style="font-size: clamp(18px, 3vw, 22px); color: rgba(255,255,255,0.95);"
          >{{ title }}</h1>
          <p v-if="subtitle" class="text-[11px] mt-0.5" style="color: rgba(255,255,255,0.50);">{{ subtitle }}</p>
        </div>

        <!-- Right slot for actions -->
        <div class="shrink-0">
          <slot name="actions" />
        </div>
      </div>
    </div>
  </div>
</template>
