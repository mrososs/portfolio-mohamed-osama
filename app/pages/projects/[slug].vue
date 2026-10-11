<script setup lang="ts">
import { mdiArrowLeft, mdiGamepadVariantOutline } from '@mdi/js'

const route = useRoute()
const { findProject, profile } = usePortfolio()
const { public: { siteUrl } } = useRuntimeConfig()

const slug = String(route.params.slug)
const project = findProject(slug)

// Drafts have no public case study yet.
if (!project || project.status === 'draft') {
  throw createError({ statusCode: 404, statusMessage: 'Project not found', fatal: true })
}

const url = `${siteUrl}/projects/${project.slug}`
const title = `${project.title} — Case study | ${profile.name}`
const description = project.description

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogType: 'article',
  ogUrl: url,
  ogImage: `${siteUrl}/avatar.jpg`,
  twitterCard: 'summary',
  twitterTitle: title,
  twitterDescription: description,
})

useHead({
  link: [{ rel: 'canonical', href: url }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        name: project.title,
        description,
        url,
        author: { '@type': 'Person', name: profile.name, url: siteUrl },
        keywords: (project.stack ?? project.tags).join(', '),
        ...(project.repoUrl ? { codeRepository: project.repoUrl } : {}),
      }),
    },
  ],
})

const inWorld = !!project.world
</script>

<template>
  <div class="case section">
    <nav class="case__nav" aria-label="Breadcrumb">
      <v-btn to="/#projects" variant="text" :prepend-icon="mdiArrowLeft">All projects</v-btn>
      <v-btn
        v-if="inWorld"
        :to="{ path: '/world', query: { project: project!.slug } }"
        variant="outlined"
        :prepend-icon="mdiGamepadVariantOutline"
      >
        See it in the Dev World
      </v-btn>
    </nav>
    <div class="case__card">
      <ProjectDetail :project="project!" :show-case-study-link="false" heading-level="h1" />
    </div>
  </div>
</template>

<style scoped>
.case {
  max-width: 860px;
  margin: 0 auto;
  padding-top: 120px;
  padding-bottom: 96px;
}

.case__nav {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
}

.case__card {
  padding: clamp(20px, 4vw, 40px);
  border-radius: 20px;
  border: 1px solid var(--line);
  background: var(--bg-card);
}
</style>
