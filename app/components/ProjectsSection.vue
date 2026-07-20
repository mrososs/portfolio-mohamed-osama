<script setup lang="ts">
import { mdiArrowRight, mdiArrowTopRight, mdiGithub, mdiOpenInNew } from '@mdi/js'

const { openSource, projects, githubProjects, profile } = usePortfolio()
</script>

<template>
  <section id="projects" class="section">
    <SectionHeader number="04" label="Featured projects">
      Things I've built
    </SectionHeader>

    <!-- Open source highlight -->
    <article class="oss" data-reveal>
      <div class="oss__info">
        <div class="oss__badge font-mono">{{ openSource.badge }}</div>
        <h3 class="oss__title">{{ openSource.title }}</h3>
        <p class="oss__desc">
          An open-source developer tool I authored and maintain that streamlines translation
          management for Angular projects using
          <span class="oss__accent font-mono">ngx-translate</span> — live editing without leaving
          your workflow. Published on GitHub.
        </p>
        <div class="oss__actions">
          <v-btn
            :href="profile.repoUrl"
            target="_blank"
            rel="noopener"
            color="primary"
            :prepend-icon="mdiGithub"
            class="oss__cta"
          >
            View on GitHub
          </v-btn>
          <div class="oss__tags">
            <v-chip
              v-for="tag in openSource.tags"
              :key="tag"
              size="small"
              variant="outlined"
              class="oss__tag font-mono"
            >
              {{ tag }}
            </v-chip>
          </div>
        </div>
      </div>
      <div class="oss__terminal-wrap">
        <div class="oss__terminal font-mono">
          <div v-for="line in openSource.terminal" :key="line.text" :class="`oss__line oss__line--${line.tone}`">
            {{ line.text }}
          </div>
        </div>
      </div>
    </article>

    <div class="projects__grid">
      <v-card
        v-for="(project, i) in projects"
        :key="project.title"
        class="project-card"
        variant="flat"
        data-reveal
        :data-delay="(i % 3) * 80"
      >
        <div class="project-card__top">
          <span class="project-card__category font-mono">{{ project.category }}</span>
          <div v-if="project.repoUrl || project.liveUrl" class="project-card__links">
            <v-btn
              v-if="project.repoUrl"
              :href="project.repoUrl"
              target="_blank"
              rel="noopener"
              :icon="mdiGithub"
              variant="text"
              density="comfortable"
              size="small"
              class="project-card__link"
              :aria-label="`${project.title} on GitHub`"
            />
            <v-btn
              v-if="project.liveUrl"
              :href="project.liveUrl"
              target="_blank"
              rel="noopener"
              :icon="mdiOpenInNew"
              variant="text"
              density="comfortable"
              size="small"
              class="project-card__link"
              :aria-label="`${project.title} live demo`"
            />
          </div>
        </div>
        <h3 class="project-card__title">{{ project.title }}</h3>
        <p class="project-card__subtitle font-mono">{{ project.subtitle }}</p>
        <p class="project-card__desc">{{ project.description }}</p>
        <div class="project-card__tags">
          <v-chip
            v-for="tag in project.tags"
            :key="tag"
            size="x-small"
            variant="outlined"
            class="project-card__tag font-mono"
          >
            {{ tag }}
          </v-chip>
        </div>
      </v-card>

      <a href="#contact" class="project-card project-card--cta" data-reveal data-delay="160">
        <v-icon :icon="mdiArrowRight" size="28" class="project-card__cta-icon" />
        <h3 class="project-card__title">Have a project in mind?</h3>
        <p class="project-card__desc">
          Let's talk about what you're building — I'll tell you exactly how I'd approach it.
        </p>
      </a>
    </div>

    <!-- More on GitHub -->
    <div class="gh-more" data-reveal>
      <div class="gh-more__head">
        <span class="gh-more__label font-mono">// More on GitHub</span>
        <v-btn
          :href="profile.github"
          target="_blank"
          rel="noopener"
          variant="text"
          class="gh-more__all"
          :append-icon="mdiArrowTopRight"
        >
          All repositories
        </v-btn>
      </div>
      <div class="gh-more__grid">
        <v-card
          v-for="(repo, i) in githubProjects"
          :key="repo.name"
          class="gh-card"
          variant="flat"
          data-reveal
          :data-delay="(i % 4) * 60"
        >
          <div class="gh-card__top">
            <h3 class="gh-card__name font-mono">{{ repo.name }}</h3>
            <div class="gh-card__links">
              <v-btn
                :href="repo.repoUrl"
                target="_blank"
                rel="noopener"
                :icon="mdiGithub"
                variant="text"
                density="comfortable"
                size="small"
                class="gh-card__link"
                :aria-label="`${repo.name} on GitHub`"
              />
              <v-btn
                v-if="repo.liveUrl"
                :href="repo.liveUrl"
                target="_blank"
                rel="noopener"
                :icon="mdiOpenInNew"
                variant="text"
                density="comfortable"
                size="small"
                class="gh-card__link"
                :aria-label="`${repo.name} live demo`"
              />
            </div>
          </div>
          <p class="gh-card__desc">{{ repo.description }}</p>
          <span class="gh-card__lang font-mono">{{ repo.language }}</span>
        </v-card>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Open source highlight */
.oss {
  position: relative;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: clamp(24px, 4vw, 48px);
  align-items: center;
  padding: clamp(28px, 4vw, 44px);
  background: linear-gradient(135deg, var(--accent-soft), transparent);
  border: 1px solid var(--accent);
  border-radius: 20px;
  margin-bottom: 20px;
  overflow: hidden;
}

.oss__badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.74rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--on-accent);
  background: var(--accent-fill);
  padding: 6px 12px;
  border-radius: 999px;
  font-weight: 600;
  margin-bottom: 18px;
}

.oss__title {
  font-size: clamp(1.7rem, 4vw, 2.4rem);
  font-weight: 700;
  color: var(--text-1);
}

.oss__desc {
  margin-top: 14px;
  color: var(--text-2);
  line-height: 1.65;
  font-size: 1.05rem;
  max-width: 52ch;
}

.oss__accent {
  color: var(--accent);
}

.oss__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 26px;
  align-items: center;
}

.oss__cta {
  font-weight: 700;
}

.oss__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.oss__tag {
  font-size: 0.72rem;
  color: var(--text-2);
  border-color: var(--line-strong);
}

.oss__terminal-wrap {
  align-self: stretch;
  display: flex;
  align-items: center;
}

.oss__terminal {
  width: 100%;
  background: #0b0b0d;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  padding: 20px;
  font-size: 0.82rem;
  line-height: 1.9;
  color: #c9c9cf;
  box-shadow: 0 30px 70px -40px rgba(0, 0, 0, 0.9);
}

.oss__line--muted { color: #6b6b70; }
.oss__line--accent { color: #c6f32e; }
.oss__line--normal { color: #c9c9cf; }
.oss__line--code { color: #c586ff; }

/* Project cards */
.projects__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.project-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: clamp(24px, 3vw, 32px);
  background: var(--bg-soft);
  border: 1px solid var(--line);
  border-radius: 18px !important;
  transition: transform 0.3s ease, border-color 0.3s ease;
}

.project-card:hover {
  transform: translateY(-6px);
  border-color: var(--line-strong);
}

.project-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 32px;
}

.project-card__category {
  font-size: 0.74rem;
  color: var(--text-3);
  letter-spacing: 0.05em;
}

.project-card__links {
  display: flex;
  gap: 2px;
}

.project-card__link {
  color: var(--text-3);
}

.project-card__link:hover {
  color: var(--accent);
}

.project-card__title {
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--text-1);
}

.project-card__subtitle {
  font-size: 0.85rem;
  color: var(--text-3);
  margin-top: -4px;
}

.project-card__desc {
  color: var(--text-2);
  line-height: 1.6;
  flex: 1;
}

.project-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.project-card__tag {
  font-size: 0.7rem;
  color: var(--text-3);
  border-color: var(--line-strong);
}

/* CTA tile */
.project-card--cta {
  justify-content: center;
  border-style: dashed;
  border-color: var(--line-strong);
  background: linear-gradient(180deg, var(--bg-card), var(--bg-soft));
  text-decoration: none;
  gap: 12px;
}

.project-card--cta:hover {
  border-color: var(--accent);
}

.project-card__cta-icon {
  color: var(--accent);
}

/* More on GitHub */
.gh-more {
  margin-top: clamp(40px, 6vw, 64px);
}

.gh-more__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
}

.gh-more__label {
  font-size: 0.9rem;
  letter-spacing: 0.04em;
  color: var(--accent);
}

.gh-more__all {
  color: var(--text-2);
  font-weight: 600;
}

.gh-more__all:hover {
  color: var(--accent);
}

.gh-more__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.gh-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 22px;
  background: var(--bg-soft);
  border: 1px solid var(--line);
  border-radius: 16px !important;
  transition: transform 0.3s ease, border-color 0.3s ease;
}

.gh-card:hover {
  transform: translateY(-4px);
  border-color: var(--accent);
}

.gh-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.gh-card__name {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-1);
  overflow-wrap: anywhere;
}

.gh-card__links {
  display: flex;
  gap: 2px;
  flex: none;
}

.gh-card__link {
  color: var(--text-3);
}

.gh-card__link:hover {
  color: var(--accent);
}

.gh-card__desc {
  color: var(--text-2);
  line-height: 1.55;
  font-size: 0.92rem;
  flex: 1;
}

.gh-card__lang {
  font-size: 0.72rem;
  color: var(--text-3);
}
</style>
