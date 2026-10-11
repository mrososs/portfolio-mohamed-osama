<script setup lang="ts">
import {
  mdiArrowLeft,
  mdiArrowRight,
  mdiClose,
  mdiEmailOutline,
  mdiGithub,
  mdiLinkedin,
  mdiOpenInNew,
  mdiWalk,
} from '@mdi/js'
import type { TravelDestination, ZoneId } from '~/game/bridge'
import type { WorldPanel } from '~/game/panels'

const props = defineProps<{
  panel: WorldPanel | null
  canGoBack: boolean
  touch: boolean
}>()

const emit = defineEmits<{
  close: []
  back: []
  open: [panel: WorldPanel]
  travel: [destination: TravelDestination]
}>()

const { profile, projects, publishedProjects, capabilities, aiWorkflows, githubProjects, openSource, findProject } =
  usePortfolio()

const open = computed({
  get: () => props.panel !== null,
  set: (v) => {
    if (!v) emit('close')
  },
})

const worldProjects = computed(() =>
  projects.filter((p) => p.world).sort((a, b) => a.world!.slot - b.world!.slot),
)
const otherProjects = computed(() => publishedProjects.filter((p) => !p.world))

const project = computed(() => (props.panel?.type === 'project' ? findProject(props.panel.slug) : undefined))
const capability = computed(() =>
  props.panel?.type === 'skill' ? capabilities.find((c) => c.id === (props.panel as { id: string }).id) : undefined,
)
const workflowIndex = computed(() => (props.panel?.type === 'ai' ? props.panel.index : -1))
const workflow = computed(() => aiWorkflows[workflowIndex.value])
const formBuilder = githubProjects.find((r) => r.name === 'AI-Driven-Form-Builder')

const zones: { id: ZoneId; name: string; where: string; blurb: string }[] = [
  { id: 'projects', name: 'Projects Hall', where: 'North', blurb: 'Interactive displays for my featured projects, plus the full archive.' },
  { id: 'skills', name: 'Skills Workshop', where: 'East', blurb: 'Stations for each part of my craft, linked to real work.' },
  { id: 'ai', name: 'AI Laboratory', where: 'West', blurb: 'How I build with AI agents, MCP and design-to-code pipelines.' },
  { id: 'contact', name: 'Contact Station', where: 'South', blurb: 'Send a message — hiring, freelance or just to say hi.' },
]

const eyebrow = computed(() => {
  switch (props.panel?.type) {
    case 'welcome':
    case 'guide':
      return 'Welcome Plaza'
    case 'projects':
    case 'project':
      return 'Projects Hall'
    case 'skill':
      return 'Skills Workshop'
    case 'ai':
    case 'robot':
      return 'AI Laboratory'
    case 'contact':
      return 'Contact Station'
    default:
      return ''
  }
})

const hireMailto = `mailto:${profile.email}?subject=${encodeURIComponent('Hiring inquiry — via your Dev World')}`

function travel(destination: TravelDestination) {
  emit('travel', destination)
}
</script>

<template>
  <v-dialog
    v-model="open"
    theme="dark"
    max-width="760"
    scrollable
    class="world-dialog"
    :fullscreen="false"
  >
    <div v-if="panel" class="wp" role="document">
      <div class="wp__bar">
        <v-btn
          v-if="canGoBack"
          :icon="mdiArrowLeft"
          variant="text"
          density="comfortable"
          aria-label="Back"
          @click="emit('back')"
        />
        <span class="wp__eyebrow font-mono">{{ eyebrow }}</span>
        <v-spacer />
        <v-btn :icon="mdiClose" variant="text" density="comfortable" aria-label="Close panel (Esc)" @click="emit('close')" />
      </div>

      <div class="wp__body">
        <!-- Welcome -->
        <template v-if="panel.type === 'welcome'">
          <h2 class="wp__title">Hey, I'm Mohamed. Welcome to my world.</h2>
          <p class="wp__lead">Explore my projects, discover my skills, and see what I build.</p>
          <dl class="wp__controls">
            <div>
              <dt class="font-mono">Move</dt>
              <dd>{{ touch ? 'Hold the arrow pad — or tap anywhere to walk there' : 'WASD or arrow keys — or click anywhere to walk there' }}</dd>
            </div>
            <div>
              <dt class="font-mono">Interact</dt>
              <dd>{{ touch ? 'Walk up to a glowing object and tap Interact (or tap the object)' : 'Walk up to a glowing object and press E or Enter' }}</dd>
            </div>
            <div>
              <dt class="font-mono">Shortcuts</dt>
              <dd>Projects, Contact and Map are always in the top bar</dd>
            </div>
          </dl>
          <div class="wp__actions">
            <v-btn color="primary" size="large" @click="emit('close')">Start exploring</v-btn>
            <v-btn variant="outlined" size="large" @click="emit('open', { type: 'projects' })">Browse all projects</v-btn>
            <v-btn variant="text" size="large" to="/">Prefer the classic view? Quick View</v-btn>
          </div>
        </template>

        <!-- Guide bot -->
        <template v-else-if="panel.type === 'guide'">
          <h2 class="wp__title">Beep! I'm Byte, your guide.</h2>
          <p class="wp__lead">
            Every zone is a bridge away from this plaza. Walk there yourself, or I can beam you over.
          </p>
          <ul class="wp__list">
            <li v-for="z in zones" :key="z.id" class="wp__row">
              <div>
                <div class="wp__row-title">
                  {{ z.name }} <span class="wp__tag font-mono">{{ z.where }}</span>
                </div>
                <div class="wp__row-text">{{ z.blurb }}</div>
              </div>
              <v-btn variant="outlined" size="small" :prepend-icon="mdiWalk" @click="travel({ zone: z.id })">Go</v-btn>
            </li>
          </ul>
        </template>

        <!-- Projects index -->
        <template v-else-if="panel.type === 'projects'">
          <h2 class="wp__title">Projects</h2>
          <p class="wp__lead">Everything I've built, in one place — no walking required.</p>

          <h3 class="wp__h font-mono">Featured in the Projects Hall</h3>
          <ul class="wp__list">
            <li v-for="p in worldProjects" :key="p.slug" class="wp__row">
              <button class="wp__row-main" type="button" @click="emit('open', { type: 'project', slug: p.slug })">
                <span class="wp__row-title">{{ p.title }}</span>
                <span class="wp__row-text">{{ p.status === 'draft' ? 'Case study coming soon' : p.subtitle }}</span>
              </button>
              <v-btn
                variant="text"
                size="small"
                :prepend-icon="mdiWalk"
                :aria-label="`Walk to the ${p.title} display`"
                @click="travel({ project: p.slug })"
              >
                Visit
              </v-btn>
            </li>
          </ul>

          <h3 class="wp__h font-mono">More projects</h3>
          <ul class="wp__list">
            <li v-for="p in otherProjects" :key="p.slug" class="wp__row">
              <button class="wp__row-main" type="button" @click="emit('open', { type: 'project', slug: p.slug })">
                <span class="wp__row-title">{{ p.title }}</span>
                <span class="wp__row-text">{{ p.subtitle }}</span>
              </button>
              <v-icon :icon="mdiArrowRight" size="18" aria-hidden="true" />
            </li>
          </ul>

          <h3 class="wp__h font-mono">Open source &amp; GitHub</h3>
          <ul class="wp__list">
            <li class="wp__row">
              <div>
                <div class="wp__row-title">{{ openSource.title }}</div>
                <div class="wp__row-text">{{ openSource.description }}</div>
              </div>
              <v-btn :href="profile.repoUrl" target="_blank" rel="noopener" variant="text" size="small" :icon="mdiGithub" :aria-label="`${openSource.title} on GitHub`" />
            </li>
            <li v-for="r in githubProjects" :key="r.name" class="wp__row">
              <div>
                <div class="wp__row-title font-mono">{{ r.name }}</div>
                <div class="wp__row-text">{{ r.description }}</div>
              </div>
              <div class="wp__row-links">
                <v-btn v-if="r.liveUrl" :href="r.liveUrl" target="_blank" rel="noopener" variant="text" size="small" :icon="mdiOpenInNew" :aria-label="`${r.name} live demo`" />
                <v-btn :href="r.repoUrl" target="_blank" rel="noopener" variant="text" size="small" :icon="mdiGithub" :aria-label="`${r.name} on GitHub`" />
              </div>
            </li>
          </ul>
        </template>

        <!-- Project detail -->
        <template v-else-if="panel.type === 'project' && project">
          <ProjectDetail :project="project" />
          <div class="wp__actions wp__actions--quiet">
            <v-btn v-if="project.world" variant="text" :prepend-icon="mdiWalk" @click="travel({ project: project.slug })">
              Walk to its display
            </v-btn>
            <v-btn variant="text" @click="emit('open', { type: 'projects' })">All projects</v-btn>
          </div>
        </template>

        <!-- Skill station -->
        <template v-else-if="panel.type === 'skill' && capability">
          <h2 class="wp__title">{{ capability.title }}</h2>
          <p class="wp__lead">{{ capability.summary }}</p>
          <h3 class="wp__h font-mono">Tools I use here</h3>
          <div class="wp__chips">
            <v-chip v-for="item in capability.items" :key="item" size="small" variant="outlined" class="font-mono">{{ item }}</v-chip>
          </div>
          <h3 class="wp__h font-mono">See it in real projects</h3>
          <ul class="wp__list">
            <template v-for="slug in capability.projectSlugs" :key="slug">
              <li v-if="findProject(slug)" class="wp__row">
                <button class="wp__row-main" type="button" @click="emit('open', { type: 'project', slug })">
                  <span class="wp__row-title">{{ findProject(slug)!.title }}</span>
                  <span class="wp__row-text">{{ findProject(slug)!.subtitle }}</span>
                </button>
                <v-icon :icon="mdiArrowRight" size="18" aria-hidden="true" />
              </li>
            </template>
          </ul>
        </template>

        <!-- AI workflow -->
        <template v-else-if="panel.type === 'ai' && workflow">
          <h2 class="wp__title">{{ workflow.title }}</h2>
          <p class="wp__lead">{{ workflow.description }}</p>
          <div class="wp__chips">
            <v-chip v-for="t in workflow.tags" :key="t" size="small" variant="outlined" class="font-mono">{{ t }}</v-chip>
          </div>
          <div class="wp__actions">
            <v-btn
              variant="outlined"
              :disabled="workflowIndex <= 0"
              @click="emit('open', { type: 'ai', index: workflowIndex - 1 })"
            >
              Previous
            </v-btn>
            <v-btn
              variant="outlined"
              :disabled="workflowIndex >= aiWorkflows.length - 1"
              @click="emit('open', { type: 'ai', index: workflowIndex + 1 })"
            >
              Next workflow
            </v-btn>
            <v-btn variant="text" @click="emit('open', { type: 'robot' })">Lab overview</v-btn>
          </div>
        </template>

        <!-- Robot -->
        <template v-else-if="panel.type === 'robot'">
          <h2 class="wp__title">Hi, I'm B-07, the lab assistant.</h2>
          <p class="wp__note">
            Heads-up: I'm a scripted guide, not a live AI model. This room is wired so a real assistant can
            plug in later.
          </p>
          <p class="wp__lead">
            Mohamed builds with AI every day — orchestrating coding agents, writing MCP servers and
            shipping AI features to end users. Pick a workflow:
          </p>
          <ul class="wp__list">
            <li v-for="(w, i) in aiWorkflows" :key="w.title" class="wp__row">
              <button class="wp__row-main" type="button" @click="emit('open', { type: 'ai', index: i })">
                <span class="wp__row-title">{{ w.title }}</span>
                <span class="wp__row-text">{{ w.tags.join(' · ') }}</span>
              </button>
              <v-icon :icon="mdiArrowRight" size="18" aria-hidden="true" />
            </li>
          </ul>
          <template v-if="formBuilder">
            <h3 class="wp__h font-mono">Real AI project</h3>
            <div class="wp__row wp__row--card">
              <div>
                <div class="wp__row-title font-mono">{{ formBuilder.name }}</div>
                <div class="wp__row-text">{{ formBuilder.description }}</div>
              </div>
              <div class="wp__row-links">
                <v-btn v-if="formBuilder.liveUrl" :href="formBuilder.liveUrl" target="_blank" rel="noopener" variant="text" size="small" :icon="mdiOpenInNew" aria-label="AI-Driven Form Builder live demo" />
                <v-btn :href="formBuilder.repoUrl" target="_blank" rel="noopener" variant="text" size="small" :icon="mdiGithub" aria-label="AI-Driven Form Builder on GitHub" />
              </div>
            </div>
          </template>
        </template>

        <!-- Contact -->
        <template v-else-if="panel.type === 'contact'">
          <h2 class="wp__title">Let's build something that ships.</h2>
          <p class="wp__lead">
            Hiring for a senior frontend role, or need a partner to build your product? I'm open to both.
            Tell me what you're working on.
          </p>
          <p class="wp__status font-mono"><span class="wp__dot" aria-hidden="true" /> {{ profile.availability }}</p>
          <div class="wp__actions">
            <v-btn :href="hireMailto" color="primary" size="large" :prepend-icon="mdiEmailOutline">Hire me</v-btn>
            <v-btn :href="profile.linkedin" target="_blank" rel="noopener" variant="outlined" size="large" :prepend-icon="mdiLinkedin">LinkedIn</v-btn>
            <v-btn :href="profile.github" target="_blank" rel="noopener" variant="outlined" size="large" :prepend-icon="mdiGithub">GitHub</v-btn>
          </div>
          <dl class="wp__details font-mono">
            <div>
              <dt>Email</dt>
              <dd><a :href="`mailto:${profile.email}`">{{ profile.email }}</a></dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd><a :href="profile.phoneHref">{{ profile.phone }}</a></dd>
            </div>
            <div>
              <dt>Based in</dt>
              <dd>{{ profile.location }}</dd>
            </div>
          </dl>
          <v-btn variant="text" to="/#contact" :append-icon="mdiArrowRight">Contact section in Quick View</v-btn>
        </template>

        <template v-else>
          <p class="wp__lead">This item couldn't be found.</p>
        </template>
      </div>
    </div>
  </v-dialog>
</template>

<style scoped>
.wp {
  display: flex;
  flex-direction: column;
  max-height: min(86vh, 900px);
  border-radius: 18px;
  border: 1px solid rgba(94, 242, 226, 0.28);
  background:
    radial-gradient(600px 240px at 90% -10%, rgba(94, 242, 226, 0.08), transparent 70%),
    radial-gradient(500px 260px at -10% 110%, rgba(176, 124, 255, 0.1), transparent 70%),
    #0b1124;
  color: #e6ecff;
  box-shadow: 0 30px 80px -30px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.03) inset;
  overflow: hidden;

  --text-1: #eef3ff;
  --text-2: #b9c3e6;
  --text-3: #8592bf;
  --line: rgba(255, 255, 255, 0.08);
  --line-strong: rgba(255, 255, 255, 0.18);
  --accent: #5ef2e2;
}

.wp__bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 10px 4px 18px;
}

.wp__eyebrow {
  font-size: 0.72rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--accent);
}

.wp__body {
  grid-template-columns: minmax(0, 1fr);
  overflow-y: auto;
  padding: 6px 24px 26px;
  display: grid;
  gap: 16px;
}

.wp__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(1.45rem, 3vw, 2rem);
  line-height: 1.2;
  color: var(--text-1);
}

.wp__lead {
  margin: 0;
  color: var(--text-2);
  line-height: 1.65;
}

.wp__note {
  margin: 0;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px dashed rgba(176, 124, 255, 0.5);
  color: #d8c6ff;
  font-size: 0.92rem;
}

.wp__h {
  margin: 8px 0 -4px;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-3);
}

.wp__controls {
  margin: 0;
  display: grid;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--line);
}

.wp__controls div {
  display: grid;
  grid-template-columns: 96px 1fr;
  gap: 10px;
}

.wp__controls dt {
  font-size: 0.74rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent);
  padding-top: 2px;
}

.wp__controls dd {
  margin: 0;
  color: var(--text-2);
}

.wp__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.wp__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.02);
}

.wp__row--card {
  border-color: rgba(176, 124, 255, 0.35);
}

.wp__row-main {
  flex: 1;
  display: grid;
  gap: 2px;
  text-align: left;
  color: inherit;
  background: none;
  border: 0;
  padding: 2px 0;
  cursor: pointer;
  font: inherit;
  border-radius: 6px;
}

.wp__row-main:hover .wp__row-title,
.wp__row-main:focus-visible .wp__row-title {
  color: var(--accent);
}

.wp__row-main:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 4px;
}

.wp__row-title {
  font-weight: 700;
  color: var(--text-1);
}

.wp__row-text {
  font-size: 0.88rem;
  color: var(--text-3);
  line-height: 1.5;
}

.wp__row-links {
  display: flex;
  flex-shrink: 0;
}

.wp__tag {
  margin-left: 6px;
  font-size: 0.68rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent);
}

.wp__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* Long labels wrap instead of widening the panel on small screens. */
.wp__body :deep(.v-btn:not(.v-btn--icon)) {
  max-width: 100%;
  height: auto;
  min-height: 40px;
  padding-block: 8px;
}

.wp__body :deep(.v-btn:not(.v-btn--icon) .v-btn__content) {
  white-space: normal;
}

.wp__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.wp__actions--quiet {
  border-top: 1px solid var(--line);
  padding-top: 12px;
}

.wp__status {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  color: #4dffa6;
}

.wp__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4dffa6;
  box-shadow: 0 0 10px #4dffa6;
}

.wp__details {
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  font-size: 0.85rem;
}

.wp__details dt {
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-3);
}

.wp__details dd {
  margin: 4px 0 0;
  color: var(--text-1);
  word-break: break-word;
}

.wp__details a {
  color: inherit;
}

@media (max-width: 600px) {
  .wp__body {
    padding: 4px 16px 20px;
  }

  .wp__controls div {
    grid-template-columns: 1fr;
    gap: 2px;
  }
}
</style>
