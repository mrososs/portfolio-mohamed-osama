<script setup lang="ts">
import { useDisplay } from 'vuetify'
import { mdiClose, mdiGamepadVariantOutline, mdiMenu } from '@mdi/js'

const { profile, navLinks } = usePortfolio()
const { mdAndUp } = useDisplay()
const route = useRoute()

// Section anchors live on the home page; prefix them when rendered elsewhere.
const anchor = (hash: string) => (route.path === '/' ? hash : `/${hash}`)

const scrolled = shallowRef(false)
const menuOpen = shallowRef(false)
const progress = shallowRef(0)

function onScroll() {
  scrolled.value = window.scrollY > 24
  const max = document.documentElement.scrollHeight - window.innerHeight
  progress.value = max > 0 ? Math.min(window.scrollY / max, 1) : 0
}

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})

watch(mdAndUp, (isDesktop) => {
  if (isDesktop) menuOpen.value = false
})

function closeMenu() {
  menuOpen.value = false
}
</script>

<template>
  <header class="app-nav">
    <div
      class="app-nav__progress"
      aria-hidden="true"
      :style="{ transform: `scaleX(${progress})` }"
    />

    <nav aria-label="Primary" class="app-nav__bar" :class="{ 'app-nav__bar--scrolled': scrolled }">
      <a :href="anchor('#top')" class="app-nav__brand" aria-label="Mohamed Osama — home">
        <span class="app-nav__mark font-mono">M</span>
        <span class="app-nav__name">{{ profile.name }}</span>
      </a>

      <div v-if="mdAndUp" class="app-nav__links">
        <a v-for="link in navLinks" :key="link.href" :href="anchor(link.href)" class="app-nav__link">
          {{ link.label }}
        </a>
        <NuxtLink to="/world" class="app-nav__link app-nav__world">
          <v-icon :icon="mdiGamepadVariantOutline" size="18" aria-hidden="true" />
          Explore World
        </NuxtLink>
        <ThemeToggle />
        <v-btn :href="anchor('#contact')" color="primary" class="app-nav__cta" size="default">
          Let's talk
        </v-btn>
      </div>

      <div v-else class="app-nav__mobile-actions">
        <ThemeToggle />
        <v-btn
          :icon="menuOpen ? mdiClose : mdiMenu"
          variant="outlined"
          density="comfortable"
          class="app-nav__burger"
          :aria-expanded="menuOpen"
          aria-label="Toggle menu"
          @click="menuOpen = !menuOpen"
        />
      </div>
    </nav>

    <v-expand-transition>
      <div v-if="!mdAndUp && menuOpen" class="app-nav__sheet">
        <a
          v-for="link in navLinks"
          :key="link.href"
          :href="anchor(link.href)"
          class="app-nav__sheet-link"
          @click="closeMenu"
        >
          {{ link.label }}
        </a>
        <NuxtLink to="/world" class="app-nav__sheet-link app-nav__world" @click="closeMenu">
          <v-icon :icon="mdiGamepadVariantOutline" size="18" aria-hidden="true" />
          Explore World
        </NuxtLink>
        <v-btn :href="anchor('#contact')" color="primary" block size="large" class="mt-3" @click="closeMenu">
          Let's talk
        </v-btn>
      </div>
    </v-expand-transition>
  </header>
</template>

<style scoped>
.app-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  padding: 0 clamp(10px, 3vw, 16px);
}

.app-nav__progress {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--accent);
  transform-origin: left;
  transform: scaleX(0);
  z-index: 60;
}

.app-nav__bar {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 18px clamp(16px, 4vw, 28px);
  background: var(--nav-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid transparent;
  border-bottom: 1px solid var(--line);
  border-radius: 0;
  transition:
    max-width 0.5s cubic-bezier(0.4, 0, 0.2, 1),
    margin 0.5s cubic-bezier(0.4, 0, 0.2, 1),
    padding 0.5s cubic-bezier(0.4, 0, 0.2, 1),
    background 0.4s ease,
    border-radius 0.5s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.4s ease,
    border-color 0.4s ease;
}

.app-nav__bar--scrolled {
  max-width: 920px;
  margin: 14px auto 0;
  padding: 10px 12px 10px 18px;
  background: var(--nav-bg-scrolled);
  border-color: var(--line);
  border-radius: 999px;
  box-shadow: 0 20px 55px -22px rgba(0, 0, 0, 0.4);
}

.app-nav__brand {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-1);
  text-decoration: none;
}

.app-nav__mark {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--accent-fill);
  color: var(--on-accent);
  font-weight: 700;
  font-size: 1.05rem;
}

.app-nav__name {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1rem;
  letter-spacing: -0.01em;
}

.app-nav__links {
  display: flex;
  align-items: center;
  gap: clamp(14px, 2.4vw, 30px);
}

.app-nav__link {
  color: var(--text-2);
  font-size: 0.95rem;
  font-weight: 500;
  text-decoration: none;
  transition: color 0.25s ease;
}

.app-nav__link:hover {
  color: var(--accent);
}

.app-nav__cta {
  font-weight: 700;
}

.app-nav__mobile-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.app-nav__burger {
  color: var(--text-1);
  border-color: var(--line-strong);
}

.app-nav__sheet {
  max-width: 640px;
  margin: 10px auto 0;
  border: 1px solid var(--line);
  background: var(--bg-soft);
  border-radius: 20px;
  box-shadow: 0 20px 50px -20px rgba(0, 0, 0, 0.5);
  padding: 12px 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.app-nav__sheet-link {
  padding: 12px 4px;
  color: var(--text-1);
  font-weight: 600;
  font-size: 1.05rem;
  text-decoration: none;
  border-bottom: 1px solid var(--line);
}
</style>
