<script setup lang="ts">
import { mdiArrowTopRight } from '@mdi/js'

const { services } = usePortfolio()
</script>

<template>
  <section id="help" class="section">
    <SectionHeader
      number="01"
      label="How I can help you"
      lead="Whether you're a company scaling an enterprise product or a founder building from zero, here's exactly how I move your frontend forward."
    >
      Tell me your problem.<br /><span class="muted">I'll ship the solution.</span>
    </SectionHeader>

    <div class="services__grid">
      <v-card
        v-for="(service, i) in services"
        :key="service.index"
        class="service-card"
        variant="flat"
        data-reveal
        :data-delay="i * 80"
      >
        <div class="service-card__top">
          <span class="service-card__index font-mono">{{ service.index }}</span>
          <v-icon :icon="mdiArrowTopRight" size="20" class="service-card__arrow" />
        </div>
        <h3 class="service-card__title">{{ service.title }}</h3>
        <p class="service-card__desc">{{ service.description }}</p>
        <div class="service-card__tags">
          <v-chip
            v-for="tag in service.tags"
            :key="tag"
            size="small"
            variant="outlined"
            class="service-card__tag font-mono"
          >
            {{ tag }}
          </v-chip>
        </div>
      </v-card>
    </div>
  </section>
</template>

<style scoped>
.services__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.service-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: clamp(26px, 3vw, 34px);
  background: linear-gradient(180deg, var(--bg-card), var(--bg-soft));
  border: 1px solid var(--line);
  border-radius: 18px !important;
  transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}

.service-card:hover {
  transform: translateY(-6px);
  border-color: var(--accent);
  box-shadow: var(--shadow-card);
}

.service-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.service-card__index {
  color: var(--accent);
  font-size: 0.9rem;
}

.service-card__arrow {
  color: var(--text-3);
  transition: color 0.3s ease, transform 0.3s ease;
}

.service-card:hover .service-card__arrow {
  color: var(--accent);
  transform: translate(2px, -2px);
}

.service-card__title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-1);
}

.service-card__desc {
  color: var(--text-2);
  line-height: 1.65;
  flex: 1;
}

.service-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.service-card__tag {
  font-size: 0.72rem;
  color: var(--text-3);
  border-color: var(--line-strong);
}
</style>
