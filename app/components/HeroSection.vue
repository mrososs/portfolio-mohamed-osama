<script setup lang="ts">
import type { gsap as Gsap } from 'gsap'
import { mdiArrowRight, mdiEmailOutline, mdiGamepadVariantOutline, mdiGithub, mdiLinkedin } from '@mdi/js'

const { profile, stats } = usePortfolio()

const nuxtApp = useNuxtApp()
const rootRef = useTemplateRef<HTMLElement>('root')

const titleWords = profile.name.split(' ')

let ctx: ReturnType<typeof Gsap.context> | undefined

onMounted(() => {
  const gsap = nuxtApp.$gsap as typeof Gsap | undefined
  const root = rootRef.value
  if (!gsap || !root) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  ctx = gsap.context(() => {
    // Staggered entrance: kicker → masked title words → tagline → CTAs → socials,
    // code card and stats overlapping. Transform/opacity only, GPU-forced.
    const tl = gsap.timeline({ defaults: { ease: 'power3.out', force3D: true } })

    // Targets are plain wrapper divs (never Vuetify component roots), and
    // every tween clears its inline styles on complete so CSS hover
    // transforms keep working afterwards.
    tl.from('.hero__id', { y: 24, opacity: 0, duration: 0.7, clearProps: 'all' })
      .from('.hero__kicker', { y: 18, opacity: 0, duration: 0.5, clearProps: 'all' }, '-=0.35')
      .from('.hero__title-word', {
        yPercent: 115,
        duration: 0.95,
        stagger: 0.12,
        ease: 'power4.out',
        clearProps: 'all',
      }, '-=0.25')
      .from('.hero__tagline', { y: 26, opacity: 0, duration: 0.7, clearProps: 'all' }, '-=0.5')
      .from('.hero__ctas > .hero__anim-item', { y: 20, opacity: 0, duration: 0.5, stagger: 0.09, clearProps: 'all' }, '-=0.4')
      .from('.hero__socials > .hero__anim-item', { y: 16, opacity: 0, duration: 0.45, stagger: 0.07, clearProps: 'all' }, '-=0.35')
      .from('.hero__card', { y: 44, opacity: 0, rotate: 1.5, duration: 1, clearProps: 'all' }, 0.4)
      .from('.hero__stat', { y: 24, opacity: 0, duration: 0.7, stagger: 0.08, clearProps: 'all' }, '-=0.45')

    // Count-up for the numeric "4+" stat
    const counter = root.querySelector<HTMLElement>('.hero__stat-number')
    if (counter) {
      const target = { n: 0 }
      gsap.to(target, {
        n: 4,
        duration: 1.4,
        delay: 0.6,
        ease: 'power2.out',
        onUpdate: () => {
          counter.textContent = `${Math.round(target.n)}+`
        },
      })
    }

    // Scroll parallax: foreground text drifts up faster, code card lags
    // behind for depth. Scrubbed, transform-only.
    const parallax = {
      trigger: root,
      start: 'top top',
      end: 'bottom top',
      scrub: 0.6,
    }
    gsap.to('.hero__intro', { yPercent: -10, ease: 'none', scrollTrigger: parallax })
    gsap.to('.hero__card-wrap', { yPercent: 7, ease: 'none', scrollTrigger: { ...parallax } })
  }, root)
})

onUnmounted(() => {
  ctx?.revert()
})
</script>

<template>
  <section ref="root" class="hero section">
    <div class="hero__grid">
      <div class="hero__intro">
        <div class="hero__id">
          <span class="hero__avatar-ring">
            <img
              src="/avatar.jpg"
              alt="Portrait of Mohamed Osama"
              width="66"
              height="66"
              class="hero__avatar"
            />
            <span class="hero__status-dot" aria-hidden="true" />
          </span>
          <div class="hero__badge font-mono">
            <span class="hero__pulse" aria-hidden="true" />
            {{ profile.availability }}
          </div>
        </div>

        <p class="hero__kicker font-mono">// {{ profile.role }}</p>
        <h1 class="hero__title" :aria-label="profile.name">
          <span
            v-for="word in titleWords"
            :key="word"
            class="hero__title-mask"
            aria-hidden="true"
          ><span class="hero__title-word">{{ word }}</span></span>
        </h1>
        <p class="hero__tagline">
          I build <span class="hero__tagline-accent">scalable, high-performance frontends</span> —
          enterprise Angular apps, micro-frontend architectures, and cross-platform products —
          shipped as clean, accessible code.
        </p>

        <div class="hero__ctas">
          <div class="hero__anim-item">
            <v-btn href="#contact" color="primary" size="large" class="hero__cta-main" :append-icon="mdiArrowRight">
              Let's work together
            </v-btn>
          </div>
          <div class="hero__anim-item">
            <v-btn href="#projects" variant="outlined" size="large" class="hero__cta-alt">
              View my work
            </v-btn>
          </div>
          <div class="hero__anim-item">
            <v-btn
              to="/world"
              variant="text"
              size="large"
              class="hero__cta-world"
              :prepend-icon="mdiGamepadVariantOutline"
              title="Don't just view my portfolio. Explore it."
            >
              Explore my world
            </v-btn>
          </div>
        </div>

        <div class="hero__socials">
          <div class="hero__anim-item">
            <v-btn
              :href="profile.linkedin"
              target="_blank"
              rel="noopener"
              :icon="mdiLinkedin"
              variant="outlined"
              class="hero__social-btn"
              aria-label="LinkedIn"
            />
          </div>
          <div class="hero__anim-item">
            <v-btn
              :href="profile.github"
              target="_blank"
              rel="noopener"
              :icon="mdiGithub"
              variant="outlined"
              class="hero__social-btn"
              aria-label="GitHub"
            />
          </div>
          <div class="hero__anim-item">
            <v-btn
              :href="`mailto:${profile.email}`"
              variant="outlined"
              class="hero__email-btn font-mono"
              :prepend-icon="mdiEmailOutline"
            >
              {{ profile.email }}
            </v-btn>
          </div>
        </div>
      </div>

      <div class="hero__card-wrap">
        <div class="hero__card">
          <div class="hero__card-bar">
            <div class="hero__dots" aria-hidden="true">
              <span class="hero__dot hero__dot--red" />
              <span class="hero__dot hero__dot--yellow" />
              <span class="hero__dot hero__dot--green" />
            </div>
            <span class="hero__card-file font-mono">engineer.ts</span>
          </div>
          <pre class="hero__code font-mono"><span class="tok-kw">const</span> <span class="tok-var">engineer</span> <span class="tok-op">=</span> {
  name<span class="tok-op">:</span> <span class="tok-str">'Mohamed Osama'</span>,
  role<span class="tok-op">:</span> <span class="tok-str">'Senior Frontend Developer'</span>,
  years<span class="tok-op">:</span> <span class="tok-num">4</span>,
  core<span class="tok-op">:</span> [<span class="tok-str">'Angular'</span>, <span class="tok-str">'RxJS'</span>, <span class="tok-str">'Signals'</span>],
  alsoBuilds<span class="tok-op">:</span> [<span class="tok-str">'Vue 3'</span>, <span class="tok-str">'Ionic'</span>, <span class="tok-str">'SaaS'</span>],
  architects<span class="tok-op">:</span> <span class="tok-str">'micro-frontends'</span>,
  ships<span class="tok-op">:</span> () <span class="tok-kw">=&gt;</span> <span class="tok-str">'clean · accessible · fast'</span>,
}<span class="hero__cursor">_</span></pre>
        </div>
      </div>
    </div>

    <div class="hero__stats">
      <div v-for="(stat, i) in stats" :key="stat.label" class="hero__stat">
        <div class="hero__stat-value">
          <span v-if="stat.numericValue" class="hero__stat-number">{{ stat.value }}</span>
          <template v-else>{{ stat.value }}</template>
        </div>
        <div class="hero__stat-label">{{ stat.label }}</div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  padding-top: clamp(120px, 13vw, 160px);
  padding-bottom: clamp(60px, 8vw, 96px);
}

.hero__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(330px, 1fr));
  gap: clamp(36px, 5vw, 64px);
  align-items: center;
}

.hero__id {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 26px;
}

.hero__avatar-ring {
  position: relative;
  flex: none;
  width: 66px;
  height: 66px;
  border-radius: 50%;
  padding: 2.5px;
  background: linear-gradient(140deg, var(--accent-fill), var(--accent-soft));
  box-shadow: 0 8px 26px -10px var(--accent-glow);
}

.hero__avatar {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  border: 2px solid var(--bg);
}

.hero__status-dot {
  position: absolute;
  bottom: 1px;
  right: 1px;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: #28c840;
  border: 2.5px solid var(--bg);
}

.hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 0.78rem;
  letter-spacing: 0.05em;
  color: var(--text-2);
  background: var(--accent-soft);
  border: 1px solid var(--line);
  padding: 7px 14px;
  border-radius: 999px;
}

.hero__pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  animation: pulse-dot 2.2s infinite;
}

@keyframes pulse-dot {
  0% { box-shadow: 0 0 0 0 var(--accent-glow); }
  70% { box-shadow: 0 0 0 9px transparent; }
  100% { box-shadow: 0 0 0 0 transparent; }
}

.hero__kicker {
  color: var(--accent);
  font-size: 0.9rem;
  letter-spacing: 0.04em;
  margin-bottom: 14px;
}

.hero__title {
  font-size: clamp(2.9rem, 8vw, 5.4rem);
  font-weight: 700;
  color: var(--text-1);
}

.hero__title-mask {
  display: inline-block;
  overflow: hidden;
  vertical-align: top;
  padding-bottom: 0.08em;
  margin-bottom: -0.08em;
}

.hero__title-mask:not(:last-child) {
  margin-right: 0.24em;
}

.hero__title-word {
  display: inline-block;
  will-change: transform;
}

.hero__tagline {
  margin-top: 24px;
  font-size: clamp(1.12rem, 2.3vw, 1.5rem);
  line-height: 1.5;
  color: var(--text-2);
  max-width: 34ch;
  font-weight: 500;
}

.hero__tagline-accent {
  color: var(--accent);
}

.hero__ctas {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
  margin-top: 34px;
}

.hero__anim-item {
  display: inline-flex;
  will-change: transform;
}

.hero__cta-main {
  font-weight: 700;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.hero__cta-main:hover {
  transform: translateY(-3px);
  box-shadow: 0 18px 40px -14px var(--accent-glow);
}

.hero__cta-alt {
  color: var(--text-1);
  border-color: var(--line-strong);
  transition: border-color 0.25s ease, color 0.25s ease;
}

.hero__cta-alt:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.hero__cta-world {
  color: var(--accent);
}

.hero__socials {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-top: 34px;
}

.hero__social-btn,
.hero__email-btn {
  color: var(--text-2);
  border-color: var(--line-strong);
  transition: all 0.25s ease;
}

.hero__social-btn:hover,
.hero__email-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
  transform: translateY(-2px);
}

.hero__email-btn {
  font-size: 0.82rem;
  letter-spacing: 0;
}

/* Code card */
.hero__card-wrap {
  justify-self: stretch;
}

.hero__card {
  position: relative;
  background: #0d0d0f;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 40px 90px -40px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(198, 243, 46, 0.04);
  overflow: hidden;
}

.hero__card-bar {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  background: rgba(255, 255, 255, 0.02);
}

.hero__dots {
  display: flex;
  gap: 7px;
}

.hero__dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.hero__dot--red { background: #ff5f57; }
.hero__dot--yellow { background: #febc2e; }
.hero__dot--green { background: #28c840; }

.hero__card-file {
  font-size: 0.78rem;
  color: #82828a;
}

.hero__code {
  margin: 0;
  padding: 24px 22px;
  font-size: clamp(0.78rem, 1.5vw, 0.92rem);
  line-height: 1.85;
  color: #c9c9cf;
  overflow-x: auto;
}

.tok-kw { color: #c586ff; }
.tok-var { color: #7fd0ff; }
.tok-op { color: #6b6b70; }
.tok-str { color: #c6f32e; }
.tok-num { color: #ffb454; }

.hero__cursor {
  color: #c6f32e;
  animation: blink 1.1s step-end infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* Stats band */
.hero__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1px;
  margin-top: clamp(48px, 7vw, 80px);
  background: var(--line);
  border: 1px solid var(--line);
  border-radius: 16px;
  overflow: hidden;
}

.hero__stat {
  background: var(--bg-soft);
  padding: 24px clamp(18px, 3vw, 28px);
}

.hero__stat-value {
  font-family: var(--font-display);
  font-size: clamp(1.7rem, 4vw, 2.4rem);
  font-weight: 700;
  color: var(--accent);
}

.hero__stat-label {
  color: var(--text-3);
  font-size: 0.9rem;
  margin-top: 6px;
}
</style>
