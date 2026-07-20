<script setup lang="ts">
import { mdiArrowUp } from '@mdi/js'

const { profile } = usePortfolio()
const year = new Date().getFullYear()
</script>

<template>
  <footer class="footer section">
    <div class="footer__inner">
      <div class="footer__brand">
        <span class="footer__mark font-mono">M</span>
        <span class="footer__text">© {{ year }} {{ profile.name }} · {{ profile.role }}</span>
      </div>
      <div class="footer__right">
        <span class="footer__note font-mono">Built with Nuxt · Vuetify · GSAP</span>
        <v-btn
          href="#top"
          :icon="mdiArrowUp"
          variant="outlined"
          density="comfortable"
          class="footer__top-btn"
          aria-label="Back to top"
        />
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  padding-top: 0;
  padding-bottom: 40px;
}

.footer__inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 28px;
  border-top: 1px solid var(--line);
}

.footer__brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.footer__mark {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--accent-fill);
  color: var(--on-accent);
  font-weight: 700;
  font-size: 0.9rem;
}

.footer__text {
  color: var(--text-3);
  font-size: 0.9rem;
}

.footer__right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.footer__note {
  font-size: 0.8rem;
  color: var(--text-3);
}

.footer__top-btn {
  color: var(--text-2);
  border-color: var(--line-strong);
}

.footer__top-btn:hover {
  color: var(--accent);
  border-color: var(--accent);
}
</style>
