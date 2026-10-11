/**
 * Typed Vue ↔ Phaser communication layer.
 *
 * Vue never touches Phaser objects and Phaser never touches Vue state —
 * everything crosses through one GameBridge instance created per game.
 * This module must stay free of Phaser imports so Vue components (and SSR)
 * can import it statically.
 */

export type ZoneId = 'plaza' | 'projects' | 'skills' | 'ai' | 'contact'

export type InteractionTarget =
  | { kind: 'project'; slug: string }
  | { kind: 'archive' }
  | { kind: 'skill'; id: string }
  | { kind: 'ai'; index: number }
  | { kind: 'robot' }
  | { kind: 'contact' }
  | { kind: 'guide' }
  | { kind: 'welcome' }
  | { kind: 'portal' }

export interface FocusInfo {
  /** What the object is, e.g. "iSaned Virtual Office". */
  label: string
  /** What interacting does, e.g. "View project". */
  action: string
  target: InteractionTarget
}

/** Where fast travel / deep links can send the player. */
export type TravelDestination = { zone: ZoneId } | { project: string } | { skill: string }

export interface GameEvents {
  ready: undefined
  zone: ZoneId
  focus: FocusInfo | null
  interact: InteractionTarget
  firstMove: undefined
}

export interface GameCommands {
  travel: TravelDestination
  interact: undefined
  /** Celebrates a contact interaction with a transmission effect. */
  transmit: undefined
}

type Handler<T> = (payload: T) => void

class Channel<Map extends object> {
  private handlers = new Map<keyof Map, Set<Handler<never>>>()

  on<K extends keyof Map>(type: K, handler: Handler<Map[K]>): () => void {
    let set = this.handlers.get(type)
    if (!set) {
      set = new Set()
      this.handlers.set(type, set)
    }
    set.add(handler as Handler<never>)
    return () => set.delete(handler as Handler<never>)
  }

  emit<K extends keyof Map>(type: K, ...[payload]: Map[K] extends undefined ? [] : [Map[K]]): void {
    this.handlers.get(type)?.forEach((h) => (h as Handler<Map[K]>)(payload as Map[K]))
  }

  clear() {
    this.handlers.clear()
  }
}

export class GameBridge {
  /** Game → Vue notifications. */
  readonly events = new Channel<GameEvents>()
  /** Vue → Game commands. */
  readonly commands = new Channel<GameCommands>()

  /**
   * Continuous input state written by Vue (touch joystick) and read by the
   * game every frame — a plain object, not an event, because it changes at
   * pointer-move frequency.
   */
  readonly input = { stickX: 0, stickY: 0 }

  /** When true the world ignores movement/interaction (a dialog is open). */
  paused = false
  muted = true

  destroy() {
    this.events.clear()
    this.commands.clear()
  }
}
