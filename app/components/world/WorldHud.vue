<script setup lang="ts">
import {
  mdiArrowLeft,
  mdiEmailOutline,
  mdiFolderStarOutline,
  mdiMapMarkerRadiusOutline,
  mdiViewDashboardOutline,
  mdiVolumeHigh,
  mdiVolumeOff,
} from '@mdi/js'
import type { ZoneId } from '~/game/bridge'

/**
 * World HUD. Desktop: brand + location on the left, labelled shortcuts and
 * Quick View on the right. Compact (phones): one slim glass strip with
 * icon-only actions, so the world stays visible.
 */
defineProps<{
  zoneName: string
  zoneColor: string
  muted: boolean
  compact: boolean
}>()

const emit = defineEmits<{
  projects: []
  contact: []
  travel: [zone: ZoneId]
  toggleSound: []
}>()

const zones: { id: ZoneId; name: string; where: string }[] = [
  { id: 'plaza', name: 'Welcome Plaza', where: 'Centre' },
  { id: 'projects', name: 'Projects Hall', where: 'North' },
  { id: 'skills', name: 'Skills Workshop', where: 'East' },
  { id: 'ai', name: 'AI Laboratory', where: 'West' },
  { id: 'contact', name: 'Contact Station', where: 'South' },
]
</script>

<template>
  <header class="hud" :class="{ 'hud--compact': compact }">
    <div class="hud__bar">
      <div class="hud__brand">
        <span class="hud__mark font-mono" aria-hidden="true">M</span>
        <div class="hud__titles">
          <span v-if="!compact" class="hud__title">Mohamed's Dev World</span>
          <span class="hud__zone font-mono" aria-live="polite">
            <span class="hud__dot" :style="{ background: zoneColor, boxShadow: `0 0 8px ${zoneColor}` }" aria-hidden="true" />
            <span class="sr-only">Current location: </span>
            <span class="hud__zone-name">{{ zoneName }}</span>
          </span>
        </div>
      </div>

      <nav class="hud__actions" aria-label="World shortcuts">
        <v-menu location="bottom end" theme="dark" offset="8">
          <template #activator="{ props: menu }">
            <button v-bind="menu" type="button" class="hud__btn" aria-label="Map — fast travel">
              <v-icon :icon="mdiMapMarkerRadiusOutline" size="20" aria-hidden="true" />
              <span v-if="!compact" class="hud__btn-text">Map</span>
            </button>
          </template>
          <v-list density="comfortable" class="hud__menu" nav>
            <v-list-subheader>Fast travel</v-list-subheader>
            <v-list-item v-for="z in zones" :key="z.id" :title="z.name" :subtitle="z.where" @click="emit('travel', z.id)" />
          </v-list>
        </v-menu>
        <button type="button" class="hud__btn" aria-label="All projects" @click="emit('projects')">
          <v-icon :icon="mdiFolderStarOutline" size="20" aria-hidden="true" />
          <span v-if="!compact" class="hud__btn-text">Projects</span>
        </button>
        <button type="button" class="hud__btn" aria-label="Contact" @click="emit('contact')">
          <v-icon :icon="mdiEmailOutline" size="20" aria-hidden="true" />
          <span v-if="!compact" class="hud__btn-text">Contact</span>
        </button>
        <button
          type="button"
          class="hud__btn"
          :aria-label="muted ? 'Turn sound on' : 'Turn sound off'"
          :aria-pressed="!muted"
          @click="emit('toggleSound')"
        >
          <v-icon :icon="muted ? mdiVolumeOff : mdiVolumeHigh" size="20" aria-hidden="true" />
        </button>
        <span class="hud__sep" aria-hidden="true" />
        <NuxtLink to="/" class="hud__quick" aria-label="Quick View — the classic portfolio">
          <v-icon :icon="compact ? mdiViewDashboardOutline : mdiArrowLeft" size="18" aria-hidden="true" />
          <span v-if="!compact">Quick View</span>
        </NuxtLink>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.hud {
  position: absolute;
  inset: 0 0 auto;
  padding: max(12px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) 0 max(16px, env(safe-area-inset-left));
  pointer-events: none;
  z-index: 5;
}

.hud__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.hud__brand,
.hud__actions {
  pointer-events: auto;
  display: flex;
  align-items: center;
  height: 52px;
  border-radius: 14px;
  background: rgba(8, 12, 27, 0.82);
  border: 1px solid rgba(94, 242, 226, 0.2);
  box-shadow: 0 10px 30px -14px rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(14px) saturate(140%);
  -webkit-backdrop-filter: blur(14px) saturate(140%);
}

.hud__brand {
  gap: 10px;
  min-width: 0;
  padding: 0 16px 0 8px;
}

.hud__mark {
  flex: none;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: linear-gradient(135deg, #5ef2e2, #b07cff);
  color: #070b18;
  font-weight: 700;
}

.hud__titles {
  display: grid;
  min-width: 0;
  line-height: 1.25;
}

.hud__title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.95rem;
  color: #eef3ff;
  white-space: nowrap;
}

.hud__zone {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #b9c3e6;
}

.hud__zone-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hud__dot {
  flex: none;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  transition: background 0.4s ease;
}

.hud__actions {
  flex: none;
  gap: 2px;
  padding: 0 6px;
}

.hud__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 44px;
  height: 40px;
  padding: 0 12px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: #dbe4ff;
  font: 600 0.9rem var(--font-body);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.hud__btn:hover,
.hud__btn[aria-expanded='true'] {
  background: rgba(94, 242, 226, 0.1);
  color: #5ef2e2;
}

.hud__btn:focus-visible,
.hud__quick:focus-visible {
  outline: 2px solid #5ef2e2;
  outline-offset: 2px;
}

.hud__sep {
  width: 1px;
  height: 24px;
  margin: 0 6px;
  background: rgba(255, 255, 255, 0.1);
}

.hud__quick {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 40px;
  min-width: 44px;
  padding: 0 16px;
  border-radius: 10px;
  background: #5ef2e2;
  color: #06101a;
  font: 700 0.9rem var(--font-body);
  text-decoration: none;
  white-space: nowrap;
  box-shadow: 0 0 18px -4px rgba(94, 242, 226, 0.6);
  transition: filter 0.15s ease;
}

.hud__quick:hover {
  filter: brightness(1.08);
}

.hud__menu {
  background: #0b1124 !important;
}

/* ---------------------------------------------------------------- Compact */
.hud--compact {
  padding: max(8px, env(safe-area-inset-top)) max(8px, env(safe-area-inset-right)) 0 max(8px, env(safe-area-inset-left));
}

/* One slim strip: the two surfaces merge into a single bar. */
.hud--compact .hud__bar {
  gap: 0;
  height: 48px;
  border-radius: 14px;
  background: rgba(8, 12, 27, 0.82);
  border: 1px solid rgba(94, 242, 226, 0.2);
  box-shadow: 0 10px 30px -14px rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(14px) saturate(140%);
  -webkit-backdrop-filter: blur(14px) saturate(140%);
  pointer-events: auto;
}

.hud--compact .hud__brand,
.hud--compact .hud__actions {
  height: 100%;
  background: none;
  border: 0;
  box-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.hud--compact .hud__brand {
  flex: 1;
  gap: 8px;
  padding: 0 4px 0 6px;
}

.hud--compact .hud__mark {
  width: 30px;
  height: 30px;
  font-size: 0.85rem;
}

.hud--compact .hud__zone {
  gap: 6px;
  font-size: 0.66rem;
  letter-spacing: 0.02em;
}

.hud--compact .hud__actions {
  padding: 0 4px;
  gap: 0;
}

.hud--compact .hud__btn {
  min-width: 40px;
  width: 40px;
  height: 40px;
  padding: 0;
}

.hud--compact .hud__sep {
  margin: 0 4px;
}

.hud--compact .hud__quick {
  width: 40px;
  min-width: 40px;
  padding: 0;
}

@media (max-width: 374px) {
  .hud--compact .hud__mark {
    display: none;
  }

  .hud--compact .hud__btn {
    width: 38px;
    min-width: 38px;
  }
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
