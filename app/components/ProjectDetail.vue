<script setup lang="ts">
import { mdiArrowRight, mdiEmailOutline, mdiGithub, mdiOpenInNew } from '@mdi/js'
import type { Project, ProjectStatus } from '~/composables/usePortfolio'

const props = withDefaults(
  defineProps<{
    project: Project
    /** Show the "View full case study" link (hidden on the case-study page itself). */
    showCaseStudyLink?: boolean
    headingLevel?: 'h1' | 'h2'
  }>(),
  { showCaseStudyLink: true, headingLevel: 'h2' },
)

const { profile } = usePortfolio()

const status = computed<ProjectStatus>(() => props.project.status ?? 'shipped')
const statusLabel: Record<ProjectStatus, string> = {
  shipped: 'Shipped',
  demo: 'Functional demo',
  'in-progress': 'In progress',
  draft: 'Case study in preparation',
}
const stack = computed(() => props.project.stack ?? props.project.tags)
const isDraft = computed(() => status.value === 'draft')
const mailto = computed(
  () => `mailto:${profile.email}?subject=${encodeURIComponent(`About ${props.project.title}`)}`,
)
</script>

<template>
  <article class="pd">
    <header class="pd__head">
      <div class="pd__meta font-mono">
        <span class="pd__category">{{ project.category }}</span>
        <span class="pd__status" :class="`pd__status--${status}`">{{ statusLabel[status] }}</span>
      </div>
      <component :is="headingLevel" class="pd__title">{{ project.title }}</component>
      <p v-if="!isDraft" class="pd__subtitle font-mono">{{ project.subtitle }}</p>
    </header>

    <template v-if="isDraft">
      <p class="pd__lead">
        This project is part of my featured work, and its full case study — screenshots, stack and
        results — is being prepared. Ask me about it directly in the meantime.
      </p>
    </template>

    <template v-else>
      <div v-if="project.media?.length" class="pd__media">
        <template v-for="m in project.media" :key="m.src">
          <img v-if="m.type === 'image'" :src="m.src" :alt="m.alt" loading="lazy" />
          <video v-else :src="m.src" :aria-label="m.alt" controls muted playsinline preload="metadata" />
        </template>
      </div>

      <p class="pd__lead">{{ project.description }}</p>

      <p v-if="project.statusNote" class="pd__note">
        <strong>Status:</strong> {{ project.statusNote }}
      </p>

      <section v-if="project.problem" class="pd__section">
        <h3 class="pd__h">Problem solved</h3>
        <p>{{ project.problem }}</p>
      </section>

      <section v-if="project.role" class="pd__section">
        <h3 class="pd__h">My role</h3>
        <p>{{ project.role }}</p>
      </section>

      <section v-if="project.features?.length" class="pd__section">
        <h3 class="pd__h">Main features</h3>
        <ul class="pd__features">
          <li v-for="f in project.features" :key="f">{{ f }}</li>
        </ul>
      </section>

      <section v-if="stack.length" class="pd__section">
        <h3 class="pd__h">Tech stack</h3>
        <div class="pd__chips">
          <v-chip v-for="s in stack" :key="s" size="small" variant="outlined" class="font-mono">{{ s }}</v-chip>
        </div>
      </section>
    </template>

    <div class="pd__actions">
      <v-btn
        v-if="project.liveUrl"
        :href="project.liveUrl"
        target="_blank"
        rel="noopener"
        color="primary"
        :append-icon="mdiOpenInNew"
      >
        Live demo
      </v-btn>
      <v-btn
        v-if="project.repoUrl"
        :href="project.repoUrl"
        target="_blank"
        rel="noopener"
        variant="outlined"
        :prepend-icon="mdiGithub"
      >
        GitHub
      </v-btn>
      <v-btn
        v-if="showCaseStudyLink && !isDraft"
        :to="`/projects/${project.slug}`"
        variant="outlined"
        :append-icon="mdiArrowRight"
      >
        View full case study
      </v-btn>
      <v-btn variant="text" :prepend-icon="mdiEmailOutline" :href="mailto">
        Talk to me about this
      </v-btn>
    </div>
  </article>
</template>

<style scoped>
.pd {
  display: grid;
  gap: 18px;
}

.pd__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  color: var(--text-3);
}

.pd__status {
  padding: 2px 10px;
  border-radius: 999px;
  border: 1px solid var(--line-strong);
  color: var(--text-2);
}

.pd__status--shipped {
  border-color: var(--accent);
  color: var(--accent);
}

.pd__status--demo,
.pd__status--in-progress {
  border-color: #ffb547;
  color: #ffb547;
}

.pd__title {
  margin: 8px 0 0;
  font-family: var(--font-display);
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  line-height: 1.15;
  color: var(--text-1);
}

.pd__subtitle {
  margin: 6px 0 0;
  font-size: 0.85rem;
  color: var(--text-3);
}

.pd__lead {
  margin: 0;
  font-size: 1.02rem;
  line-height: 1.65;
  color: var(--text-2);
}

.pd__note {
  margin: 0;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px dashed var(--line-strong);
  color: var(--text-2);
  font-size: 0.92rem;
  line-height: 1.55;
}

.pd__media {
  display: grid;
  gap: 12px;
}

.pd__media img,
.pd__media video {
  width: 100%;
  border-radius: 12px;
  border: 1px solid var(--line);
}

.pd__section p {
  margin: 0;
  color: var(--text-2);
  line-height: 1.6;
}

.pd__h {
  margin: 0 0 8px;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-3);
}

.pd__features {
  margin: 0;
  padding-left: 1.1rem;
  display: grid;
  gap: 6px;
  color: var(--text-2);
  line-height: 1.55;
}

.pd__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pd__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding-top: 4px;
}
</style>
