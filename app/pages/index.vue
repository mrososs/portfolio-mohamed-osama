<script setup lang="ts">
const { profile } = usePortfolio()
const { public: { siteUrl } } = useRuntimeConfig()

const title = `${profile.name} — ${profile.role}`
const description =
  'Senior Frontend Developer with 4+ years of experience building scalable, responsive, and accessible web applications. Specialized in Angular (RxJS, Signals, Material) with hands-on experience in Vue 3, Nuxt, and Ionic/Capacitor. Architect of micro-frontend platforms and multi-tenant SaaS.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogType: 'website',
  ogUrl: siteUrl,
  ogImage: `${siteUrl}/avatar.jpg`,
  ogSiteName: profile.name,
  twitterCard: 'summary',
  twitterTitle: title,
  twitterDescription: description,
  twitterImage: `${siteUrl}/avatar.jpg`,
})

useHead({
  link: [{ rel: 'canonical', href: siteUrl }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: profile.name,
        jobTitle: profile.role,
        email: `mailto:${profile.email}`,
        telephone: profile.phone,
        url: siteUrl,
        image: `${siteUrl}/avatar.jpg`,
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Giza',
          addressRegion: 'October City',
          addressCountry: 'EG',
        },
        sameAs: [profile.linkedin, profile.github],
        knowsAbout: [
          'Angular', 'Vue 3', 'Nuxt', 'TypeScript', 'RxJS', 'Micro-frontends',
          'Ionic', 'Capacitor', 'Multi-tenant SaaS', 'UI/UX Design',
          'AI Agents', 'Claude Code', 'Model Context Protocol', 'AI-assisted development',
        ],
        worksFor: {
          '@type': 'Organization',
          name: 'Obeikan Digital Solutions',
        },
      }),
    },
  ],
})

const pageRef = useTemplateRef<HTMLElement>('page')
useScrollReveal(pageRef)
</script>

<template>
  <div ref="page">
    <HeroSection />
    <ServicesSection />
    <StackSection />
    <ExperienceSection />
    <ProjectsSection />
    <AiSection />
    <ContactSection />
    <AppFooter />
  </div>
</template>
