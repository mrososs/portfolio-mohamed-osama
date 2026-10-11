<script setup lang="ts">
import type { GameBridge, TravelDestination } from '~/game/bridge'
import type { WorldContent } from '~/game/types'

/**
 * Mounts the Phaser world. Phaser is imported dynamically on the client
 * only, so it never ships with Quick View and never runs during SSR. The
 * game is destroyed on unmount — no duplicate canvases across navigations.
 */
const props = defineProps<{
  bridge: GameBridge
  content: WorldContent
  start?: TravelDestination
}>()

const emit = defineEmits<{ failed: [reason: string] }>()

const host = useTemplateRef<HTMLDivElement>('host')
let handle: { destroy(): void } | null = null
let disposed = false
let watchdog: ReturnType<typeof setTimeout> | undefined
let offReady: (() => void) | undefined

function canRender() {
  try {
    return !!document.createElement('canvas').getContext('2d')
  } catch {
    return false
  }
}

onMounted(async () => {
  if (!import.meta.client || !host.value) return
  if (!canRender()) {
    emit('failed', 'Your browser cannot render the interactive world.')
    return
  }

  offReady = props.bridge.events.on('ready', () => clearTimeout(watchdog))
  watchdog = setTimeout(() => emit('failed', 'The world took too long to load.'), 15000)

  try {
    const { createWorld } = await import('~/game')
    if (disposed) return
    const created = await createWorld({
      parent: host.value,
      bridge: props.bridge,
      content: props.content,
      start: props.start,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      touch: window.matchMedia('(pointer: coarse)').matches,
    })
    if (disposed) {
      created.destroy()
      return
    }
    handle = created
  } catch (err) {
    clearTimeout(watchdog)
    console.error('[dev-world] failed to start', err)
    emit('failed', 'The interactive world could not be started.')
  }
})

onBeforeUnmount(() => {
  disposed = true
  clearTimeout(watchdog)
  offReady?.()
  handle?.destroy()
  handle = null
})
</script>

<template>
  <div ref="host" class="world-canvas" aria-hidden="true" />
</template>

<style scoped>
.world-canvas {
  position: absolute;
  inset: 0;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.world-canvas :deep(canvas) {
  display: block;
  image-rendering: pixelated;
}
</style>
