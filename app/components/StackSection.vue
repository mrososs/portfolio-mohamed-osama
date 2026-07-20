<script setup lang="ts">
const { stack } = usePortfolio()
</script>

<template>
  <section id="stack" class="section">
    <SectionHeader number="02" label="Tech stack">
      The tools I reach for
    </SectionHeader>

    <div class="stack__grid">
      <v-card
        v-for="(group, i) in stack"
        :key="group.label"
        class="stack-card"
        variant="flat"
        data-reveal
        :data-delay="(i % 3) * 60"
      >
        <h3 class="stack-card__label font-mono">{{ group.label }}</h3>
        <div class="stack-card__items">
          <span v-for="item in group.items" :key="item" class="stack-card__item">
            {{ item }}
          </span>
        </div>
      </v-card>
    </div>
  </section>
</template>

<style scoped>
.stack__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 18px;
}

.stack-card {
  background: var(--bg-soft);
  border: 1px solid var(--line);
  border-radius: 16px !important;
  padding: 26px;
  transition: border-color 0.3s ease;
}

.stack-card:hover {
  border-color: var(--line-strong);
}

.stack-card__label {
  font-size: 0.82rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--accent);
  font-weight: 500;
  margin-bottom: 18px;
}

.stack-card__items {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
}

.stack-card__item {
  font-size: 0.9rem;
  padding: 8px 13px;
  background: var(--accent-soft);
  border: 1px solid var(--line);
  border-radius: 10px;
  color: var(--text-1);
  transition: border-color 0.25s ease;
}

.stack-card__item:hover {
  border-color: var(--accent);
}
</style>
