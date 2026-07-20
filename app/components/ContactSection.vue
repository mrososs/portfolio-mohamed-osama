<script setup lang="ts">
import { mdiEmailOutline } from '@mdi/js'

const { profile } = usePortfolio()
</script>

<template>
  <section id="contact" class="section contact">
    <div class="contact__card" data-reveal>
      <div class="contact__halo" aria-hidden="true" />
      <div class="contact__inner">
        <div class="contact__eyebrow font-mono">
          <span class="contact__dash" aria-hidden="true" />
          06 · Get in touch
        </div>
        <h2 class="contact__title">
          Let's build something<br />that <span class="contact__accent">ships</span>.
        </h2>
        <p class="contact__lead">
          Hiring for a senior frontend role, or need a partner to build your product? I'm open to
          both. Tell me what you're working on.
        </p>

        <div class="contact__actions">
          <v-btn
            :href="`mailto:${profile.email}`"
            color="primary"
            size="x-large"
            :prepend-icon="mdiEmailOutline"
            class="contact__cta"
          >
            Email me
          </v-btn>
          <v-btn
            :href="profile.linkedin"
            target="_blank"
            rel="noopener"
            variant="outlined"
            size="x-large"
            class="contact__alt"
          >
            LinkedIn
          </v-btn>
          <v-btn
            :href="profile.github"
            target="_blank"
            rel="noopener"
            variant="outlined"
            size="x-large"
            class="contact__alt"
          >
            GitHub
          </v-btn>
        </div>

        <div class="contact__details font-mono">
          <div class="contact__detail">
            <div class="contact__detail-label">Email</div>
            <a :href="`mailto:${profile.email}`" class="contact__detail-value">{{ profile.email }}</a>
          </div>
          <div class="contact__detail">
            <div class="contact__detail-label">Phone</div>
            <a :href="profile.phoneHref" class="contact__detail-value">{{ profile.phone }}</a>
          </div>
          <div class="contact__detail">
            <div class="contact__detail-label">Based in</div>
            <span class="contact__detail-value">{{ profile.location }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.contact {
  padding-bottom: clamp(40px, 5vw, 60px);
}

.contact__card {
  position: relative;
  background: linear-gradient(160deg, var(--bg-card), var(--bg-soft));
  border: 1px solid var(--line);
  border-radius: 26px;
  padding: clamp(36px, 6vw, 72px);
  overflow: hidden;
}

.contact__halo {
  position: absolute;
  top: -120px;
  right: -80px;
  width: 360px;
  height: 360px;
  background: radial-gradient(circle, var(--accent-soft), transparent 65%);
  pointer-events: none;
}

.contact__inner {
  position: relative;
  max-width: 640px;
}

.contact__eyebrow {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.8rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 22px;
}

.contact__dash {
  width: 30px;
  height: 1px;
  background: var(--accent);
}

.contact__title {
  font-size: clamp(2.4rem, 6.5vw, 4.2rem);
  font-weight: 700;
  color: var(--text-1);
}

.contact__accent {
  color: var(--accent);
}

.contact__lead {
  margin-top: 22px;
  font-size: 1.15rem;
  line-height: 1.6;
  color: var(--text-2);
}

.contact__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 34px;
}

.contact__cta {
  font-weight: 700;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.contact__cta:hover {
  transform: translateY(-3px);
  box-shadow: 0 18px 40px -14px var(--accent-glow);
}

.contact__alt {
  color: var(--text-1);
  border-color: var(--line-strong);
}

.contact__alt:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.contact__details {
  display: flex;
  flex-wrap: wrap;
  gap: 28px;
  margin-top: 40px;
  font-size: 0.85rem;
}

.contact__detail-label {
  color: var(--text-3);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 6px;
}

.contact__detail-value {
  color: var(--text-1);
  text-decoration: none;
}

a.contact__detail-value:hover {
  color: var(--accent);
}
</style>
