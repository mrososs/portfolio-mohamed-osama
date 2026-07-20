import type { gsap as Gsap } from 'gsap'

/**
 * Animates every `[data-reveal]` element inside `root` when it scrolls
 * into view. Elements stay visible for SSR / no-JS; GSAP takes over on
 * the client. `data-delay` (ms) staggers siblings.
 */
export function useScrollReveal(root: Readonly<Ref<HTMLElement | null>>) {
  const nuxtApp = useNuxtApp()

  onMounted(() => {
    const gsap = nuxtApp.$gsap as typeof Gsap | undefined
    const el = root.value
    if (!gsap || !el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const targets = Array.from(el.querySelectorAll<HTMLElement>('[data-reveal]'))

    for (const target of targets) {
      const delay = Number.parseInt(target.dataset.delay ?? '0', 10) / 1000

      gsap.from(target, {
        opacity: 0,
        y: 28,
        duration: 0.9,
        delay,
        ease: 'power3.out',
        clearProps: 'all',
        scrollTrigger: {
          trigger: target,
          start: 'top 88%',
          once: true,
        },
      })
    }
  })

  onUnmounted(() => {
    const ScrollTrigger = nuxtApp.$ScrollTrigger as typeof import('gsap/ScrollTrigger').ScrollTrigger | undefined
    ScrollTrigger?.getAll().forEach(trigger => trigger.kill())
  })
}
