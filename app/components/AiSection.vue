<script setup lang="ts">
import {
  mdiAutoFix,
  mdiCreationOutline,
  mdiPaletteSwatchOutline,
  mdiPowerPlugOutline,
  mdiRobotOutline,
} from '@mdi/js'

const { aiWorkflows } = usePortfolio()

const icons: Record<string, string> = {
  agents: mdiRobotOutline,
  mcp: mdiPowerPlugOutline,
  design: mdiPaletteSwatchOutline,
  product: mdiCreationOutline,
}
</script>

<template>
  <section id="ai" class="section">
    <SectionHeader
      number="05"
      label="AI & agentic workflows"
      lead="I pair engineering judgment with AI agents to build things a solo developer couldn't ship alone — and I bring that leverage to teams."
    >
      AI is my co-engineer.<br /><span class="muted">I direct, it accelerates.</span>
    </SectionHeader>

    <div class="ai__grid">
      <v-card
        v-for="(workflow, i) in aiWorkflows"
        :key="workflow.title"
        class="ai-card"
        variant="flat"
        data-reveal
        :data-delay="(i % 2) * 80"
      >
        <div class="ai-card__icon-wrap">
          <v-icon :icon="icons[workflow.icon]" size="22" class="ai-card__icon" />
        </div>
        <h3 class="ai-card__title">{{ workflow.title }}</h3>
        <p class="ai-card__desc">{{ workflow.description }}</p>
        <div class="ai-card__tags">
          <v-chip
            v-for="tag in workflow.tags"
            :key="tag"
            size="small"
            variant="outlined"
            class="ai-card__tag font-mono"
          >
            {{ tag }}
          </v-chip>
        </div>
      </v-card>
    </div>

    <p class="ai__proof font-mono" data-reveal>
      <v-icon :icon="mdiAutoFix" size="16" class="ai__proof-icon" />
      Proof of work: this site was built in pair with Claude Code — design imported over MCP,
      animations tuned by an AI tool server, architecture and polish by me.
    </p>
  </section>
</template>

<style scoped>
.ai__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.ai-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: clamp(26px, 3vw, 34px);
  background: linear-gradient(180deg, var(--bg-card), var(--bg-soft));
  border: 1px solid var(--line);
  border-radius: 18px !important;
  transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}

.ai-card:hover {
  transform: translateY(-6px);
  border-color: var(--accent);
  box-shadow: var(--shadow-card);
}

.ai-card__icon-wrap {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--accent-soft);
  border: 1px solid var(--line);
}

.ai-card__icon {
  color: var(--accent);
}

.ai-card__title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-1);
}

.ai-card__desc {
  color: var(--text-2);
  line-height: 1.65;
  flex: 1;
}

.ai-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ai-card__tag {
  font-size: 0.72rem;
  color: var(--text-3);
  border-color: var(--line-strong);
}

.ai__proof {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 28px;
  padding: 16px 20px;
  border: 1px dashed var(--line-strong);
  border-radius: 14px;
  font-size: 0.8rem;
  line-height: 1.7;
  color: var(--text-3);
}

.ai__proof-icon {
  color: var(--accent);
  flex: none;
}
</style>
