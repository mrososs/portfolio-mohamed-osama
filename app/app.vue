<script setup lang="ts">
import type { gsap as Gsap } from 'gsap'

useSiteTheme()

const nuxtApp = useNuxtApp()
const haloRef = useTemplateRef<HTMLElement>('halo')
const gridRef = useTemplateRef<HTMLElement>('grid')

let ctx: ReturnType<typeof Gsap.context> | undefined

onMounted(() => {
  const gsap = nuxtApp.$gsap as typeof Gsap | undefined
  if (!gsap || !haloRef.value || !gridRef.value) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  // Background parallax: the halo and grid layers drift down at different
  // speeds as the page scrolls, so the fixed backdrop reads as depth layers
  // behind the faster-moving content.
  ctx = gsap.context(() => {
    const scrub = {
      trigger: document.body,
      start: 'top top',
      end: 'max',
      scrub: 0.8,
    }
    gsap.to(haloRef.value, { y: 190, ease: 'none', force3D: true, scrollTrigger: scrub })
    gsap.to(gridRef.value, { y: 90, ease: 'none', force3D: true, scrollTrigger: { ...scrub } })
  })
})

onUnmounted(() => {
  ctx?.revert()
})
</script>

<template>
  <v-app>
    <a href="#main" class="skip-link">Skip to content</a>
    <div id="top" class="app-shell">
      <div ref="halo" class="app-shell__halo" aria-hidden="true" />
      <div ref="grid" class="app-shell__grid" aria-hidden="true" />
      <AppNav />
      <v-main id="main">
        <NuxtPage />
      </v-main>
    </div>
  </v-app>
</template>

<style scoped>
.app-shell {
  position: relative;
  min-height: 100vh;
  background: var(--bg);
  color: var(--text-1);
  overflow-x: hidden;
  transition: background 0.4s ease, color 0.4s ease;
}

.app-shell__halo {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background:
    radial-gradient(900px 500px at 78% -8%, var(--halo-a), transparent 60%),
    radial-gradient(700px 500px at 8% 12%, var(--halo-b), transparent 60%);
}

.app-shell__grid {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  opacity: 0.5;
  background-image:
    linear-gradient(var(--grid-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
  background-size: 64px 64px;
  mask-image: radial-gradient(circle at 50% 30%, black, transparent 85%);
}

.app-shell :deep(main) {
  position: relative;
  z-index: 1;
}
</style>

<style>
.v-application {
  background: var(--bg) !important;
  color: var(--text-1) !important;
  font-family: var(--font-body) !important;
}
</style>
