<script setup lang="ts">
import { mdiWeatherNight, mdiWhiteBalanceSunny } from '@mdi/js'

const { isDark, toggleTheme } = useSiteTheme()
</script>

<template>
  <v-btn
    :icon="isDark ? mdiWhiteBalanceSunny : mdiWeatherNight"
    variant="text"
    density="comfortable"
    class="theme-toggle"
    :aria-label="isDark ? 'Switch to light theme' : 'Switch to dark theme'"
    @click="toggleTheme"
  />
</template>

<style scoped>
.theme-toggle {
  color: var(--text-2);
  border: 1px solid var(--line);
  transition: color 0.25s ease, border-color 0.25s ease, transform 0.25s ease;
}

.theme-toggle:hover {
  color: var(--accent);
  border-color: var(--accent);
  transform: rotate(12deg);
}
</style>
