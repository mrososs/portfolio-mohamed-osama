export interface Service {
  index: string
  title: string
  description: string
  tags: string[]
}

export interface StackGroup {
  label: string
  items: string[]
}

export interface ExperienceEntry {
  period: string
  current: boolean
  role: string
  company: string
  companyNote?: string
  highlights: string[]
}

export interface Project {
  category: string
  title: string
  subtitle: string
  description: string
  tags: string[]
  repoUrl?: string
  liveUrl?: string
}

export interface GithubRepo {
  name: string
  description: string
  language: string
  repoUrl: string
  liveUrl?: string
}

export interface AiWorkflow {
  icon: 'agents' | 'mcp' | 'design' | 'product'
  title: string
  description: string
  tags: string[]
}

export interface Stat {
  value: string
  numericValue?: number
  suffix?: string
  label: string
}

const profile = {
  name: 'Mohamed Osama',
  role: 'Senior Frontend Developer',
  email: 'mohamed.osamadesigner@gmail.com',
  phone: '+20 114 368 7888',
  phoneHref: 'tel:+201143687888',
  location: 'Giza · October City, Egypt',
  availability: 'Available for roles & freelance',
  linkedin: 'https://www.linkedin.com/in/mohamedosos98/',
  github: 'https://github.com/mrososs',
  repoUrl: 'https://github.com/mrososs/live-i18n-tool',
  tagline:
    'I build scalable, high-performance frontends — enterprise Angular apps, micro-frontend architectures, and cross-platform products — shipped as clean, accessible code.',
} as const

const stats: Stat[] = [
  { value: '4+', numericValue: 4, suffix: '+', label: 'Years shipping frontends' },
  { value: 'Angular', label: 'Specialty — RxJS, Signals, Material' },
  { value: 'Web + Mobile', label: 'Vue 3 · Ionic / Capacitor' },
  { value: 'SaaS', label: 'Multi-tenant · micro-frontends' },
]

const services: Service[] = [
  {
    index: '01',
    title: 'Need a scalable enterprise frontend?',
    description:
      'I architect large Angular apps that stay fast and maintainable as teams grow — micro-frontends with Native Federation, OnPush performance tuning, and accessible, standards-compliant UI.',
    tags: ['Angular', 'Micro-frontends', 'A11y'],
  },
  {
    index: '02',
    title: 'Building a SaaS product?',
    description:
      'I build multi-tenant SaaS platforms end-to-end — isolated, branded environments on a shared codebase, reactive state with RxJS & Signals, and integrated backends (Supabase, NestJS, Firebase).',
    tags: ['Multi-tenant', 'Supabase', 'NestJS'],
  },
  {
    index: '03',
    title: 'Need a cross-platform mobile app?',
    description:
      'One codebase, iOS + Android + web. I ship native-feeling mobile apps with Ionic & Capacitor — native notifications, smooth navigation, and offline-ready storage.',
    tags: ['Ionic', 'Capacitor', 'PWA'],
  },
  {
    index: '04',
    title: 'Want a fast, SEO-friendly site?',
    description:
      "High-converting landing pages and marketing sites in Vue 3 / Nuxt — SSR for SEO, excellent Core Web Vitals, and a clean component architecture that's easy to extend. Designer's eye included.",
    tags: ['Vue 3', 'Nuxt / SSR', 'SEO'],
  },
]

const stack: StackGroup[] = [
  { label: 'Languages', items: ['TypeScript', 'JavaScript (ES6+)', 'HTML5', 'CSS3', 'SCSS'] },
  {
    label: 'Frameworks & Libraries',
    items: ['Angular', 'Vue 3', 'RxJS', 'Signals', 'Angular Material', 'Ionic', 'Capacitor', 'Tailwind', 'Bootstrap'],
  },
  {
    label: 'Architecture',
    items: ['Micro-frontends', 'Native Federation', 'Nx Monorepos', 'Component Libraries', 'Multi-tenant SaaS', 'PWA'],
  },
  {
    label: 'Tooling & Testing',
    items: ['Git', 'Azure DevOps', 'Storybook', 'Webpack', 'npm / Yarn', 'Vitest', 'Jasmine / Karma', 'Agile / Scrum'],
  },
  { label: 'Backend & API', items: ['REST APIs', 'Supabase', 'Postgres', 'Firebase', 'NestJS'] },
  { label: 'Design', items: ['Figma', 'Adobe XD', 'Photoshop', 'Illustrator', 'UI/UX · Prototyping'] },
]

const experience: ExperienceEntry[] = [
  {
    period: 'Jul 2025 — Present',
    current: true,
    role: 'Senior Frontend Developer',
    company: 'Obeikan Digital Solutions',
    companyNote: '— Saned',
    highlights: [
      'Lead frontend of enterprise multi-tenant Angular apps — isolated, branded environments on a shared codebase.',
      'Architected a micro-frontend platform with Native Federation — portal shell, safety, and visitor-management apps composed at runtime.',
      'Built and maintain a shared Angular UI library consumed across micro-frontends — improving consistency and delivery speed.',
      'Designed reactive state with RxJS & Signals, applying OnPush change detection for performance-critical forms.',
    ],
  },
  {
    period: 'Aug 2022 — Jul 2025',
    current: false,
    role: 'Frontend Developer',
    company: 'Giza Systems',
    highlights: [
      'Built reusable, reliable Angular components across large-scale enterprise and government platforms.',
      'Translated UI/UX designs into high-quality responsive code, optimizing for speed, scalability, and accessibility.',
      'Integrated REST APIs and async data flows with backend developers, designers, and product managers.',
      'Wrote and maintained unit tests with Jasmine & Karma to ensure quality and prevent regressions.',
    ],
  },
  {
    period: 'May 2021 — Aug 2022',
    current: false,
    role: 'Graphic & UI/UX Designer',
    company: 'Xtreme Agency',
    highlights: [
      'Delivered UI design and visual communication across client projects — wireframing and interactive prototyping.',
      'Ran user research and usability testing, partnering with dev teams to ensure design feasibility.',
    ],
  },
]

const openSource = {
  badge: '★ Open source',
  title: 'live-i18n-tool',
  description:
    'An open-source developer tool I authored and maintain that streamlines translation management for Angular projects using ngx-translate — live editing without leaving your workflow. Published on GitHub.',
  highlightWord: 'ngx-translate',
  tags: ['Angular', 'ngx-translate', 'DX tooling'],
  terminal: [
    { text: '$ npm i -D live-i18n-tool', tone: 'muted' },
    { text: '$ live-i18n serve', tone: 'muted' },
    { text: '✓ watching src/assets/i18n', tone: 'accent' },
    { text: '→ editor live at :4321', tone: 'normal' },
    { text: "translate('home.title') // synced", tone: 'code' },
  ],
} as const

const projects: Project[] = [
  {
    category: 'GOV · ENTERPRISE',
    title: 'Daycare Platform',
    subtitle: 'Saudi Arabia Ministry Platform',
    description:
      'Nationwide governmental platform to manage childcare centers — dynamic forms, role-based UI (parents, managers, admins), and center listings. Focused on security, accessibility compliance, and performance.',
    tags: ['Angular', 'Material', 'RxJS'],
  },
  {
    category: 'DESIGN SYSTEM',
    title: 'Shared UI Component Library',
    subtitle: 'Internal Angular library',
    description:
      'A reusable, testable Angular component library that replaced third-party UI dependencies across projects — component isolation, clean input/output bindings, accessibility, and Storybook docs.',
    tags: ['Angular', 'Storybook', 'TypeScript'],
  },
  {
    category: 'MOBILE',
    title: 'MedReminder',
    subtitle: 'Cross-platform mobile app',
    description:
      'A mobile app to manage personal medications and remind patients of dosage and timing, with native notification logic, smooth navigation, and offline storage.',
    tags: ['Ionic', 'Capacitor', 'Angular'],
    repoUrl: 'https://github.com/mrososs/medReminder',
  },
  {
    category: 'MARKETING · SEO',
    title: 'Hospitality Landing Page',
    subtitle: 'Vue 3 · multi-property',
    description:
      'A responsive multi-property hospitality landing page built in Vue 3 with a focus on SEO, performance, and clean component architecture — explored SSR via Nuxt.',
    tags: ['Vue 3', 'Nuxt', 'SEO'],
    repoUrl: 'https://github.com/mrososs/Xperience-hotels',
    liveUrl: 'https://xperience-hotels.vercel.app',
  },
  {
    category: 'LEADERSHIP',
    title: 'Project Management Platform',
    subtitle: 'Frontend Team Lead',
    description:
      'Led the frontend team — planned and distributed tasks, owned critical features, and managed GitFlow branch workflows. Built the dashboard and drove team collaboration.',
    tags: ['Angular', 'Material', 'GitFlow'],
    repoUrl: 'https://github.com/mrososs/ProjectManagment',
    liveUrl: 'https://project-managment-lemon.vercel.app',
  },
]

const githubProjects: GithubRepo[] = [
  {
    name: 'AI-Driven-Form-Builder',
    description:
      'Drag-and-drop form builder with an AI assistant — generate forms from natural-language prompts, preview live, save to Firebase, and export to Vue, React, or Angular components.',
    language: 'Vue 3 · TypeScript',
    repoUrl: 'https://github.com/mrososs/AI-Driven-Form-Builder',
    liveUrl: 'https://form-builder-eight-ivory.vercel.app',
  },
  {
    name: 'math-rummy-game',
    description:
      'Mobile-first multiplayer math card game — ten progressive phases, offline bot practice, and a Supabase backend for live rooms and synchronized matches.',
    language: 'TypeScript · Supabase',
    repoUrl: 'https://github.com/mrososs/math-rummy-game',
  },
  {
    name: 'nawat',
    description:
      'Marketing website for NAWAT, a sovereign AI-ready data-center developer in KSA — a design-system kit ported to a routed, state-managed Vue 3 application.',
    language: 'Vue 3 · Vite',
    repoUrl: 'https://github.com/mrososs/nawat',
    liveUrl: 'https://nawat-two.vercel.app',
  },
  {
    name: 'womans-travel',
    description:
      'Travel platform for women built in an Nx monorepo with Vue 3 — modular workspace architecture with a live Vercel deployment.',
    language: 'Vue 3 · Nx',
    repoUrl: 'https://github.com/mrososs/womans-travel',
    liveUrl: 'https://womans-travel-phi.vercel.app',
  },
]

const aiWorkflows: AiWorkflow[] = [
  {
    icon: 'agents',
    title: 'Agentic development workflows',
    description:
      'I orchestrate AI coding agents — Claude Code, OpenAI Codex — through multi-step pipelines: scaffold, implement, test, review. Complex features ship in hours instead of days, with the architecture and code quality still owned by an engineer.',
    tags: ['Claude Code', 'Codex', 'Multi-agent'],
  },
  {
    icon: 'mcp',
    title: 'Custom MCP servers & tooling',
    description:
      'I expose internal APIs, design systems, and databases as tools agents can call — Model Context Protocol servers that let AI work directly inside your stack instead of guessing about it from the outside.',
    tags: ['MCP', 'Tool design', 'Integrations'],
  },
  {
    icon: 'design',
    title: 'Design-to-code pipelines',
    description:
      'From Figma or Claude Design straight to production Vue and Angular. Agents translate the design system while I enforce component architecture, accessibility, and performance — this very portfolio was built that way.',
    tags: ['Figma MCP', 'Claude Design', 'UI engineering'],
  },
  {
    icon: 'product',
    title: 'AI features inside products',
    description:
      'I ship AI-powered UX for end users: natural-language form generation, smart assistants, prompt-driven tooling — like my open-source AI-Driven Form Builder that turns a prompt into a working, exportable form.',
    tags: ['Vue 3', 'Prompt engineering', 'Firebase'],
  },
]

const navLinks = [
  { label: 'How I help', href: '#help' },
  { label: 'Stack', href: '#stack' },
  { label: 'Experience', href: '#experience' },
  { label: 'Projects', href: '#projects' },
  { label: 'AI', href: '#ai' },
]

export function usePortfolio() {
  return { profile, stats, services, stack, experience, openSource, projects, githubProjects, aiWorkflows, navLinks }
}
