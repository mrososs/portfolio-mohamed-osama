import Phaser from 'phaser'
import { WorldScene } from './scenes/WorldScene'
import { PAL } from './art/palette'
import type { WorldOptions } from './types'

export interface WorldHandle {
  destroy(): void
}

/**
 * Boots the Dev World into `opts.parent`. Loaded only through a dynamic
 * import from the /world page, so Phaser never ships with the rest of the
 * portfolio and never runs during SSR.
 */
export async function createWorld(opts: WorldOptions): Promise<WorldHandle> {
  // In-world labels use the site's display font; wait briefly so the first
  // frame doesn't bake a fallback font into the text textures.
  await Promise.race([
    document.fonts?.load('700 12px "Space Grotesk"').catch(() => undefined),
    new Promise((resolve) => setTimeout(resolve, 1500)),
  ])

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: opts.parent,
    backgroundColor: PAL.void,
    pixelArt: true,
    roundPixels: true,
    banner: false,
    audio: { noAudio: true },
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: opts.parent.clientWidth || window.innerWidth,
      height: opts.parent.clientHeight || window.innerHeight,
    },
    // windowEvents off: only presses that start on the canvas reach the world,
    // so taps on the Vue HUD / controls / overlays never move the player.
    input: { gamepad: false, windowEvents: false },
    scene: [new WorldScene(opts)],
  })

  // Dev-only handle for automated QA (stripped from production builds).
  if (import.meta.dev) (window as unknown as { __devWorld?: Phaser.Game }).__devWorld = game

  return {
    destroy() {
      game.destroy(true)
      if (import.meta.dev) delete (window as unknown as { __devWorld?: Phaser.Game }).__devWorld
    },
  }
}
