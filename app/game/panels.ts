import type { InteractionTarget } from './bridge'

/** Every HTML overlay the Dev World can show. Rendered by Vue, never by Phaser. */
export type WorldPanel =
  | { type: 'welcome' }
  | { type: 'guide' }
  | { type: 'projects' }
  | { type: 'project'; slug: string }
  | { type: 'skill'; id: string }
  | { type: 'ai'; index: number }
  | { type: 'robot' }
  | { type: 'contact' }

export function panelFor(target: InteractionTarget): WorldPanel | null {
  switch (target.kind) {
    case 'project':
      return { type: 'project', slug: target.slug }
    case 'archive':
      return { type: 'projects' }
    case 'skill':
      return { type: 'skill', id: target.id }
    case 'ai':
      return { type: 'ai', index: target.index }
    case 'robot':
      return { type: 'robot' }
    case 'contact':
      return { type: 'contact' }
    case 'guide':
      return { type: 'guide' }
    case 'welcome':
      return { type: 'welcome' }
    case 'portal':
      return null
  }
}
