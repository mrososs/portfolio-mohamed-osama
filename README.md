# Mohamed Osama — Portfolio

Personal portfolio for Mohamed Osama, Senior Frontend Developer. Built with **Nuxt 4**, **Vuetify 3**, and **GSAP** (ScrollTrigger), with full SSR/SEO support and light + dark themes.

**Live:** https://portfolio-mohamed-osama.vercel.app
**Repo:** https://github.com/mrososs/portfolio-mohamed-osama

## Stack

- **Nuxt 4** — SSR + prerendering for SEO
- **Vuetify 3** (`vuetify-nuxt-module`) — buttons, cards, chips, timeline, transitions, theming
- **GSAP + ScrollTrigger** — hero intro timeline, scroll reveals, stat count-up
- **SCSS design tokens** — one token set per theme (`app/assets/css/main.scss`)

## Commands

```bash
npm install       # install dependencies
npm run dev       # dev server on http://localhost:3000
npm run build     # production build (SSR)
npm run generate  # static site generation
npm run preview   # preview the production build
```

## Where things live

| What | Where |
| --- | --- |
| All portfolio content (profile, services, stack, experience, projects) | `app/composables/usePortfolio.ts` |
| Light/dark theme tokens | `app/assets/css/main.scss` + `nuxt.config.ts` (Vuetify themes) |
| Theme persistence (cookie, SSR-safe) | `app/composables/useSiteTheme.ts` |
| GSAP setup | `app/plugins/gsap.client.ts` |
| Scroll reveal animation | `app/composables/useScrollReveal.ts` (add `data-reveal` + optional `data-delay` to any element) |
| SEO meta + JSON-LD | `app/pages/index.vue` |
| Section components | `app/components/` |

## Deployment

The GitHub repo is connected to the Vercel project (`portfolio-mohamed-osama`), so **every push to `main` auto-deploys to production** and branch pushes get preview URLs.

`.github/workflows/deploy.yml` is an optional CI-driven deploy path: it runs only when the `VERCEL_TOKEN` secret is configured (plus `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`), and skips gracefully otherwise. Create a token at https://vercel.com/account/tokens if you want CI deploys instead of the Git integration.

## Nice-to-haves

- Replace `public/avatar.jpg` with a higher-resolution photo and add a dedicated 1200×630 `og.png` for social sharing.
- Point a custom domain at the Vercel project and update `siteUrl`, `robots.txt`, and `sitemap.xml`.
