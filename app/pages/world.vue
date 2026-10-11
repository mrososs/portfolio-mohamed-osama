<script setup lang="ts">
import { GameBridge, type FocusInfo, type InteractionTarget, type TravelDestination, type ZoneId } from '~/game/bridge'
import { ZONES } from '~/game/layout'
import { panelFor, type WorldPanel } from '~/game/panels'
import type { WorldContent } from '~/game/types'
import type { Project } from '~/composables/usePortfolio'

definePageMeta({ immersive: true })

const { profile, projects, publishedProjects, capabilities, aiWorkflows, findProject } = usePortfolio()
const router = useRouter()
const { public: { siteUrl } } = useRuntimeConfig()

const title = `Mohamed's Dev World — Interactive Portfolio | ${profile.name}`
const description =
  "Don't just view my portfolio. Explore it. Walk through an interactive pixel world of Mohamed Osama's projects, skills and AI work."

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogType: 'website',
  ogUrl: `${siteUrl}/world`,
  ogImage: `${siteUrl}/avatar.jpg`,
  twitterCard: 'summary',
  twitterTitle: title,
  twitterDescription: description,
})
useHead({
  htmlAttrs: { class: 'world-mode' },
  // viewport-fit=cover exposes safe-area insets for the HUD and touch controls.
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }],
  noscript: [{ innerHTML: '<style>.world__nojs{display:grid!important}.world__loading{display:none!important}</style>' }],
  link: [{ rel: 'canonical', href: `${siteUrl}/world` }],
})

// ---------------------------------------------------------------------------
// Shared content → world labels (one source of truth: usePortfolio)
// ---------------------------------------------------------------------------

const content: WorldContent = {
  projects: projects
    .filter((p) => p.world)
    .map((p) => ({ slug: p.slug, title: p.title, display: p.world!.display, slot: p.world!.slot, draft: p.status === 'draft' })),
  skills: capabilities.map((c) => ({ id: c.id, title: c.title })),
  ai: aiWorkflows.map((w) => ({ title: w.title })),
}

// ---------------------------------------------------------------------------
// World state
// ---------------------------------------------------------------------------

const bridge = markRaw(new GameBridge())
const zone = shallowRef<ZoneId>('plaza')
/** Deep-link state is read from the real URL after mount: /world is prerendered. */
const booted = shallowRef(false)
const start = shallowRef<TravelDestination>()
let deepProject: Project | undefined
const focus = shallowRef<FocusInfo | null>(null)
const stack = ref<WorldPanel[]>([])
const panel = computed(() => stack.value.at(-1) ?? null)
const ready = shallowRef(false)
const failed = shallowRef<string | null>(null)
const muted = shallowRef(true)
const touch = shallowRef(false)
const compact = shallowRef(false)
const moved = shallowRef(false)
const toast = shallowRef<string | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | undefined

const zoneName = computed(() => ZONES[zone.value].name)
const zoneColor = computed(() => `#${ZONES[zone.value].accent.toString(16).padStart(6, '0')}`)

function openPanel(p: WorldPanel) {
  stack.value = [...stack.value, p]
}

function closePanel() {
  stack.value = []
}

function back() {
  stack.value = stack.value.slice(0, -1)
}

function travel(destination: TravelDestination) {
  closePanel()
  bridge.commands.emit('travel', destination)
}

function onInteract(target: InteractionTarget) {
  if (target.kind === 'portal') {
    navigateTo('/')
    return
  }
  const p = panelFor(target)
  if (p) openPanel(p)
}

function toggleSound() {
  muted.value = !muted.value
  bridge.muted = muted.value
}

// Pause the world while an overlay is open and keep the URL shareable.
watch(panel, (p) => {
  bridge.paused = p !== null
  if (!import.meta.client) return
  const slug = p?.type === 'project' ? p.slug : undefined
  if (booted.value && slug !== router.currentRoute.value.query.project) {
    router.replace({ query: slug ? { project: slug } : {} })
  }
})

function readFlag(key: string) {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function writeFlag(key: string) {
  try {
    sessionStorage.setItem(key, '1')
  } catch {
    // Storage unavailable (private mode) — welcome simply shows again.
  }
}

const offs: (() => void)[] = []

// Prerendered pages hydrate on the bare /world path and Nuxt restores the
// real URL (with its query) only after hydration — so read deep links here.
onNuxtReady(() => {
  const { query } = router.currentRoute.value
  deepProject = typeof query.project === 'string' ? findProject(query.project) : undefined
  const deepZone = (Object.keys(ZONES) as ZoneId[]).find((z) => z === query.zone)
  if (deepProject?.world) start.value = { project: deepProject.slug }
  else if (deepZone) start.value = { zone: deepZone }
  booted.value = true
})

onMounted(() => {
  // Touch controls: phones/tablets up front, or any device the moment it's touched.
  touch.value = window.matchMedia('(pointer: coarse)').matches
  if (!touch.value) {
    const onFirstTouch = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return
      touch.value = true
      window.removeEventListener('pointerdown', onFirstTouch)
    }
    window.addEventListener('pointerdown', onFirstTouch)
    offs.push(() => window.removeEventListener('pointerdown', onFirstTouch))
  }

  const mq = window.matchMedia('(max-width: 820px), (max-height: 500px)')
  compact.value = mq.matches
  const onMq = (e: MediaQueryListEvent) => (compact.value = e.matches)
  mq.addEventListener('change', onMq)
  offs.push(() => mq.removeEventListener('change', onMq))

  offs.push(
    bridge.events.on('ready', () => {
      ready.value = true
      if (deepProject) {
        openPanel({ type: 'project', slug: deepProject.slug })
      } else if (!readFlag('dev-world-welcomed')) {
        writeFlag('dev-world-welcomed')
        openPanel({ type: 'welcome' })
      }
    }),
    bridge.events.on('zone', (z) => {
      const changed = z !== zone.value
      zone.value = z
      if (changed && ready.value) {
        toast.value = ZONES[z].name
        clearTimeout(toastTimer)
        toastTimer = setTimeout(() => (toast.value = null), 2200)
      }
    }),
    bridge.events.on('focus', (f) => (focus.value = f)),
    bridge.events.on('interact', onInteract),
    bridge.events.on('firstMove', () => (moved.value = true)),
  )
})

onUnmounted(() => {
  offs.forEach((off) => off())
  clearTimeout(toastTimer)
  bridge.destroy()
})
</script>

<template>
  <div class="world">
    <!-- Text alternative: everything important is reachable as plain HTML. -->
    <h1 class="sr-only">Mohamed's Dev World — the interactive portfolio of {{ profile.name }}</h1>
    <nav class="sr-only" aria-label="Portfolio without the game">
      <ul>
        <li><NuxtLink to="/">Quick View — the classic portfolio</NuxtLink></li>
        <li v-for="p in publishedProjects" :key="p.slug">
          <NuxtLink :to="`/projects/${p.slug}`">{{ p.title }} — case study</NuxtLink>
        </li>
        <li><a :href="`mailto:${profile.email}`">Email {{ profile.name }}</a></li>
      </ul>
    </nav>

    <ClientOnly>
      <WorldCanvas v-if="booted && !failed" :bridge="bridge" :content="content" :start="start" @failed="failed = $event" />
    </ClientOnly>

    <div class="world__vignette" aria-hidden="true" />

    <Transition name="fade">
      <div v-if="!ready && !failed" class="world__loading" role="status">
        <div class="world__loader" aria-hidden="true"><span /><span /><span /></div>
        <p class="font-mono">Booting Mohamed's Dev World…</p>
      </div>
    </Transition>

    <div v-if="failed" class="world__fallback" role="alert">
      <h2>The world couldn't load here</h2>
      <p>{{ failed }} Everything is still available — explore it the classic way:</p>
      <div class="world__fallback-actions">
        <v-btn to="/" class="world__primary">Open Quick View</v-btn>
        <v-btn variant="outlined" @click="openPanel({ type: 'projects' })">Browse projects</v-btn>
        <v-btn variant="outlined" @click="openPanel({ type: 'contact' })">Contact</v-btn>
      </div>
    </div>

    <v-theme-provider theme="dark">
      <WorldHud
        :zone-name="zoneName"
        :zone-color="zoneColor"
        :muted="muted"
        :compact="compact"
        @projects="openPanel({ type: 'projects' })"
        @contact="openPanel({ type: 'contact' })"
        @travel="travel({ zone: $event })"
        @toggle-sound="toggleSound"
      />
    </v-theme-provider>

    <Transition name="toast">
      <div v-if="toast" class="world__toast font-mono" aria-hidden="true">
        <span>Entering</span> {{ toast }}
      </div>
    </Transition>

    <Transition name="fade">
      <p v-if="ready && !touch && !moved && !panel" class="world__hint font-mono">
        <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or arrows to move · <kbd>E</kbd> to interact · click to walk
      </p>
    </Transition>

    <WorldTouchControls
      v-if="ready && touch"
      :bridge="bridge"
      :action-label="focus?.action ?? null"
      @action="bridge.commands.emit('interact')"
    />

    <WorldPanel
      :panel="panel"
      :can-go-back="stack.length > 1"
      :touch="touch"
      @close="closePanel"
      @back="back"
      @open="openPanel"
      @travel="travel"
    />

    <!-- Revealed by the <noscript> style in the head when JavaScript is off. -->
    <div class="world__fallback world__nojs">
      <h2>Mohamed's Dev World needs JavaScript</h2>
      <p><a href="/">Open the classic portfolio (Quick View)</a></p>
    </div>
  </div>
</template>

<style scoped>
.world {
  position: fixed;
  inset: 0;
  z-index: 10;
  overflow: hidden;
  background: #050812;
  color: #eef3ff;
}

.world__vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse at center, transparent 55%, rgba(2, 4, 10, 0.55) 100%);
  z-index: 1;
}

.world__loading {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 14px;
  z-index: 4;
  background: #050812;
  color: #8592bf;
  font-size: 0.85rem;
  letter-spacing: 0.06em;
}

.world__loader {
  display: flex;
  gap: 8px;
}

.world__loader span {
  width: 10px;
  height: 10px;
  background: #5ef2e2;
  animation: blink 1s infinite steps(2);
}

.world__loader span:nth-child(2) {
  animation-delay: 0.2s;
  background: #55c8ff;
}

.world__loader span:nth-child(3) {
  animation-delay: 0.4s;
  background: #b07cff;
}

@keyframes blink {
  50% {
    opacity: 0.2;
  }
}

.world__fallback {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: grid;
  place-content: center;
  gap: 12px;
  padding: 24px;
  text-align: center;
  max-width: 560px;
  margin: 0 auto;
}

.world__fallback h2 {
  margin: 0;
  font-family: var(--font-display);
}

.world__fallback p {
  margin: 0;
  color: #b9c3e6;
}

.world__fallback a {
  color: #5ef2e2;
}

.world__fallback-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 8px;
}

.world__nojs {
  display: none;
}

.world__primary {
  background: #5ef2e2 !important;
  color: #06101a !important;
}

.world__toast {
  position: absolute;
  top: calc(max(12px, env(safe-area-inset-top)) + 66px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
  padding: 8px 18px;
  border-radius: 999px;
  background: rgba(9, 13, 29, 0.78);
  border: 1px solid rgba(94, 242, 226, 0.3);
  font-size: 0.82rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  white-space: nowrap;
  pointer-events: none;
}

.world__toast span {
  color: #8592bf;
  margin-right: 6px;
}

.world__hint {
  position: absolute;
  left: 50%;
  bottom: 22px;
  transform: translateX(-50%);
  z-index: 3;
  margin: 0;
  padding: 8px 16px;
  border-radius: 999px;
  background: rgba(9, 13, 29, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #b9c3e6;
  font-size: 0.78rem;
  white-space: nowrap;
  pointer-events: none;
}

.world__hint kbd {
  display: inline-block;
  min-width: 20px;
  margin: 0 1px;
  padding: 1px 5px;
  border-radius: 5px;
  border: 1px solid rgba(94, 242, 226, 0.4);
  color: #5ef2e2;
  font: inherit;
  text-align: center;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.35s ease, transform 0.35s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -8px);
}

@media (max-width: 820px), (max-height: 500px) {
  .world__toast {
    top: calc(max(8px, env(safe-area-inset-top)) + 58px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .world__loader span {
    animation: none;
  }
}
</style>

<style>
html.world-mode,
html.world-mode body {
  overflow: hidden;
  overscroll-behavior: none;
}

/* World overlays use the world's cyan accent for primary actions. */
.world-dialog .bg-primary {
  background: #5ef2e2 !important;
  color: #06101a !important;
}
</style>
