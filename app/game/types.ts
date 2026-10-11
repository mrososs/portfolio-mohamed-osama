import type { GameBridge, TravelDestination } from './bridge'

export type WorldDisplay = 'workstation' | 'kiosk' | 'phone' | 'id-terminal'

/**
 * The slice of portfolio content the world needs to label itself.
 * Built by the Vue page from usePortfolio() — the game never owns copy.
 */
export interface WorldContent {
  projects: { slug: string; title: string; display: WorldDisplay; slot: number; draft: boolean }[]
  skills: { id: string; title: string }[]
  ai: { title: string }[]
}

export interface WorldOptions {
  parent: HTMLElement
  bridge: GameBridge
  content: WorldContent
  start?: TravelDestination
  reducedMotion: boolean
  touch: boolean
}
