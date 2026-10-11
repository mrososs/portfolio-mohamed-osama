<script setup lang="ts">
import { mdiGestureTap } from '@mdi/js'
import type { GameBridge } from '~/game/bridge'

/**
 * Mobile RPG controls: a 4-way D-pad (bottom-left) and a contextual
 * interact button (bottom-right).
 *
 * The D-pad doesn't move anything itself — it writes a direction vector
 * into `bridge.input`, the same channel the game's movement system reads
 * every frame (and normalises, so diagonals aren't faster). Interact calls
 * the game's existing interaction through the bridge.
 */
const props = defineProps<{
  bridge: GameBridge
  /** Label of the focused object's action, or null when nothing is in reach. */
  actionLabel: string | null
}>()

const emit = defineEmits<{ action: [] }>()

type Dir = 'up' | 'down' | 'left' | 'right'
const DIRS: Dir[] = ['up', 'left', 'right', 'down']
const ARIA: Record<Dir, string> = { up: 'Move up', down: 'Move down', left: 'Move left', right: 'Move right' }

const pad = useTemplateRef<HTMLElement>('pad')
/** Active pointers on the pad → the directions each one presses. */
const pointers = new Map<number, Set<Dir>>()
const active = reactive<Record<Dir, boolean>>({ up: false, down: false, left: false, right: false })

/**
 * Maps a pointer to directions by angle from the pad centre (8 sectors),
 * so sliding a thumb across the pad changes direction without lifting,
 * and the corners give diagonals.
 */
function dirsAt(clientX: number, clientY: number): Set<Dir> {
  const el = pad.value
  const out = new Set<Dir>()
  if (!el) return out
  const r = el.getBoundingClientRect()
  const dx = clientX - (r.left + r.width / 2)
  const dy = clientY - (r.top + r.height / 2)
  const dist = Math.hypot(dx, dy)
  if (dist < r.width * 0.1) return out
  const t = Math.sin(Math.PI / 8) * dist // ±22.5° sectors
  if (dx > t) out.add('right')
  if (dx < -t) out.add('left')
  if (dy > t) out.add('down')
  if (dy < -t) out.add('up')
  return out
}

function sync() {
  const all = new Set<Dir>()
  pointers.forEach((dirs) => dirs.forEach((d) => all.add(d)))
  for (const d of DIRS) active[d] = all.has(d)
  props.bridge.input.stickX = (active.right ? 1 : 0) - (active.left ? 1 : 0)
  props.bridge.input.stickY = (active.down ? 1 : 0) - (active.up ? 1 : 0)
}

function onDown(e: PointerEvent) {
  ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
  pointers.set(e.pointerId, dirsAt(e.clientX, e.clientY))
  sync()
  if (navigator.vibrate && e.pointerType === 'touch') navigator.vibrate(4)
}

function onMove(e: PointerEvent) {
  if (!pointers.has(e.pointerId)) return
  pointers.set(e.pointerId, dirsAt(e.clientX, e.clientY))
  sync()
}

function onUp(e: PointerEvent) {
  if (!pointers.delete(e.pointerId)) return
  sync()
}

/** Never leave a direction held: blur, tab switch, or unmount releases everything. */
function releaseAll() {
  pointers.clear()
  sync()
}

function onVisibility() {
  if (document.hidden) releaseAll()
}

onMounted(() => {
  window.addEventListener('blur', releaseAll)
  document.addEventListener('visibilitychange', onVisibility)
})

onBeforeUnmount(() => {
  window.removeEventListener('blur', releaseAll)
  document.removeEventListener('visibilitychange', onVisibility)
  releaseAll()
})
</script>

<template>
  <div class="touch">
    <div
      ref="pad"
      class="dpad"
      role="group"
      aria-label="Movement controls"
      @pointerdown.prevent="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onUp"
      @lostpointercapture="onUp"
      @contextmenu.prevent
    >
      <span
        v-for="d in DIRS"
        :key="d"
        class="dpad__btn"
        :class="[`dpad__btn--${d}`, { 'dpad__btn--on': active[d] }]"
        role="button"
        :aria-label="ARIA[d]"
        :aria-pressed="active[d]"
      >
        <!-- Pixel arrow, drawn on a 7×7 grid with crisp edges. -->
        <svg viewBox="0 0 7 7" class="dpad__arrow" aria-hidden="true" shape-rendering="crispEdges">
          <rect x="3" y="0" width="1" height="1" /><rect x="2" y="1" width="3" height="1" /><rect x="1" y="2" width="5" height="1" /><rect x="0" y="3" width="7" height="1" /><rect x="2" y="4" width="3" height="3" />
        </svg>
      </span>
      <span class="dpad__hub" aria-hidden="true" />
    </div>

    <div class="act">
      <Transition name="act-label">
        <span v-if="actionLabel" class="act__label" aria-hidden="true">{{ actionLabel }}</span>
      </Transition>
      <button
        type="button"
        class="act__btn"
        :class="{ 'act__btn--ready': actionLabel }"
        :disabled="!actionLabel"
        :aria-label="actionLabel ? `Interact: ${actionLabel}` : 'Interact (nothing in reach)'"
        @pointerdown.prevent
        @click="emit('action')"
      >
        <v-icon :icon="mdiGestureTap" size="28" aria-hidden="true" />
        <span class="act__text">Interact</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.touch {
  position: absolute;
  inset: auto 0 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 0 max(14px, env(safe-area-inset-right)) max(14px, env(safe-area-inset-bottom)) max(14px, env(safe-area-inset-left));
  pointer-events: none;
  z-index: 5;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
}

.touch > * {
  pointer-events: auto;
}

/* ------------------------------------------------------------ D-pad */
.dpad {
  --cell: 46px;
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, var(--cell));
  grid-template-rows: repeat(3, var(--cell));
  padding: 6px;
  border-radius: 22px;
  background: rgba(9, 13, 29, 0.55);
  border: 1px solid rgba(94, 242, 226, 0.22);
  box-shadow: 0 10px 30px -12px rgba(0, 0, 0, 0.7), inset 0 0 0 1px rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  touch-action: none;
}

.dpad__btn {
  display: grid;
  place-items: center;
  margin: 2px;
  border-radius: 10px;
  background: rgba(20, 30, 60, 0.7);
  border: 1px solid rgba(94, 242, 226, 0.28);
  color: #5ef2e2;
  transition: transform 0.08s ease, background 0.12s ease, box-shadow 0.12s ease, color 0.12s ease;
  pointer-events: none; /* the pad resolves direction from the pointer position */
}

.dpad__btn--up {
  grid-area: 1 / 2;
}

.dpad__btn--left {
  grid-area: 2 / 1;
}

.dpad__btn--right {
  grid-area: 2 / 3;
}

.dpad__btn--down {
  grid-area: 3 / 2;
}

.dpad__btn--on {
  transform: scale(0.92);
  background: rgba(94, 242, 226, 0.22);
  border-color: #5ef2e2;
  color: #e9fffc;
  box-shadow: 0 0 16px rgba(94, 242, 226, 0.45), inset 0 2px 0 rgba(0, 0, 0, 0.25);
}

.dpad__arrow {
  width: 18px;
  height: 18px;
  fill: currentColor;
  filter: drop-shadow(0 0 3px rgba(94, 242, 226, 0.45));
}

.dpad__btn--down .dpad__arrow {
  transform: rotate(180deg);
}

.dpad__btn--left .dpad__arrow {
  transform: rotate(-90deg);
}

.dpad__btn--right .dpad__arrow {
  transform: rotate(90deg);
}

.dpad__hub {
  grid-area: 2 / 2;
  place-self: center;
  width: 14px;
  height: 14px;
  border-radius: 4px;
  background: rgba(94, 242, 226, 0.18);
  border: 1px solid rgba(94, 242, 226, 0.35);
}

/* ------------------------------------------------------------ Interact */
.act {
  display: flex;
  align-items: center;
  gap: 10px;
}

.act__label {
  max-width: 42vw;
  padding: 7px 12px;
  border-radius: 999px;
  background: rgba(9, 13, 29, 0.78);
  border: 1px solid rgba(94, 242, 226, 0.4);
  color: #eef3ff;
  font: 600 0.82rem var(--font-body);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  backdrop-filter: blur(8px);
}

.act__btn {
  display: grid;
  place-items: center;
  align-content: center;
  gap: 1px;
  width: 76px;
  height: 76px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(9, 13, 29, 0.55);
  color: #6c78a6;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  touch-action: manipulation;
  transition: transform 0.1s ease, background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.act__text {
  font: 700 0.62rem var(--font-mono);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.act__btn--ready {
  border-color: #5ef2e2;
  background: radial-gradient(circle at 35% 30%, rgba(94, 242, 226, 0.35), rgba(9, 13, 29, 0.85) 70%);
  color: #e9fffc;
  box-shadow: 0 0 24px rgba(94, 242, 226, 0.4);
  animation: ready-pulse 1.8s ease-in-out infinite;
}

.act__btn--ready:active {
  transform: scale(0.92);
}

@keyframes ready-pulse {
  50% {
    box-shadow: 0 0 34px rgba(94, 242, 226, 0.6);
  }
}

.act-label-enter-active,
.act-label-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.act-label-enter-from,
.act-label-leave-to {
  opacity: 0;
  transform: translateX(8px);
}

/* Small or landscape phones: tighter controls so the world stays visible. */
@media (max-height: 480px), (max-width: 359px) {
  .dpad {
    --cell: 40px;
  }

  .act__btn {
    width: 64px;
    height: 64px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .act__btn--ready {
    animation: none;
  }
}
</style>
