<script setup lang="ts">
const { experience } = usePortfolio()
</script>

<template>
  <section id="experience" class="section">
    <SectionHeader number="03" label="Experience">
      Where I've shipped
    </SectionHeader>

    <v-timeline side="end" align="start" truncate-line="both" class="experience__timeline">
      <v-timeline-item
        v-for="(entry, i) in experience"
        :key="entry.company"
        :dot-color="entry.current ? 'primary' : 'surface-variant'"
        size="x-small"
        width="100%"
      >
        <article class="experience__entry" data-reveal :data-delay="i * 60">
          <div class="experience__meta">
            <v-chip
              :variant="entry.current ? 'flat' : 'outlined'"
              :color="entry.current ? 'primary' : undefined"
              size="small"
              class="experience__period font-mono"
            >
              {{ entry.period }}
            </v-chip>
            <div class="experience__role font-mono">{{ entry.role }}</div>
          </div>
          <div class="experience__body">
            <h3 class="experience__company">
              {{ entry.company }}
              <span v-if="entry.companyNote" class="experience__company-note">{{ entry.companyNote }}</span>
            </h3>
            <ul class="experience__highlights">
              <li v-for="highlight in entry.highlights" :key="highlight" class="experience__highlight">
                <span class="experience__bullet" aria-hidden="true">▹</span>
                {{ highlight }}
              </li>
            </ul>
          </div>
        </article>
      </v-timeline-item>
    </v-timeline>
  </section>
</template>

<style scoped>
.experience__timeline {
  grid-row-gap: clamp(20px, 3vw, 34px);
}

.experience__entry {
  display: grid;
  grid-template-columns: minmax(0, 220px) 1fr;
  gap: clamp(16px, 4vw, 48px);
  padding: clamp(10px, 2vw, 18px) 0 clamp(24px, 3vw, 34px);
  border-bottom: 1px solid var(--line);
}

@media (max-width: 720px) {
  .experience__entry {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

.experience__period {
  font-size: 0.8rem;
}

.experience__role {
  margin-top: 14px;
  color: var(--text-3);
  font-size: 0.9rem;
}

.experience__company {
  font-size: clamp(1.4rem, 3vw, 1.9rem);
  font-weight: 600;
  color: var(--text-1);
}

.experience__company-note {
  color: var(--text-3);
}

.experience__highlights {
  margin: 18px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.experience__highlight {
  display: flex;
  gap: 12px;
  color: var(--text-2);
  line-height: 1.6;
}

.experience__bullet {
  color: var(--accent);
  margin-top: 2px;
}
</style>
