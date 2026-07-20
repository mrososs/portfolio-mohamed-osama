<script setup lang="ts">
defineProps<{
  number: string
  label: string
  lead?: string
}>()
</script>

<template>
  <div class="section-header" data-reveal>
    <div class="section-header__eyebrow font-mono">
      <span class="section-header__dash" aria-hidden="true" />
      {{ number }} · {{ label }}
    </div>
    <h2 class="section-header__title">
      <slot />
    </h2>
    <p v-if="lead" class="section-header__lead">{{ lead }}</p>
  </div>
</template>

<style scoped>
.section-header {
  max-width: 760px;
  margin-bottom: clamp(40px, 6vw, 60px);
}

.section-header__eyebrow {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.8rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 20px;
}

.section-header__dash {
  width: 30px;
  height: 1px;
  background: var(--accent);
}

.section-header__title {
  font-size: clamp(2.1rem, 5.5vw, 3.4rem);
  font-weight: 700;
  color: var(--text-1);
}

.section-header__title :deep(.muted) {
  color: var(--text-3);
}

.section-header__title :deep(.accented) {
  color: var(--accent);
}

.section-header__lead {
  margin-top: 20px;
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text-2);
}
</style>
