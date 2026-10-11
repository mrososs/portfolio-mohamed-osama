import Phaser from 'phaser'
import { PixelCanvas } from '../art/pixel'
import { PAL } from '../art/palette'

/** Sits on the floor: above the baked ground and light pools, below props. */
const MARKER_DEPTH = -780

function isoRing(w: number, h: number, thickness: number) {
  const pc = new PixelCanvas(w, h)
  const rx = w / 2
  const ry = h / 2
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = (x + 0.5 - rx) / rx
      const ny = (y + 0.5 - ry) / ry
      const d = Math.sqrt(nx * nx + ny * ny)
      const inner = 1 - thickness / rx
      if (d <= 1 && d >= inner) pc.px(x, y, 0xffffff)
    }
  }
  return pc
}

function makeTextures(scene: Phaser.Scene) {
  if (scene.textures.exists('marker-ring')) return
  isoRing(26, 13, 2.2).toTexture(scene, 'marker-ring')
  isoRing(26, 13, 1.2).toTexture(scene, 'marker-pulse')

  const dot = new PixelCanvas(6, 4)
  dot.ellipse(3, 2, 3, 2, PAL.ice)
  dot.toTexture(scene, 'marker-dot')

  // Downward chevron that hovers over the destination.
  const chev = new PixelCanvas(9, 6)
  const rows = ['#.......#', '##.....##', '.##...##.', '..##.##..', '...###...', '....#....']
  rows.forEach((row, y) => [...row].forEach((c, x) => c === '#' && chev.px(x, y, 0xffffff)))
  chev.outline(PAL.outline)
  chev.toTexture(scene, 'marker-chevron')

  const cross = new PixelCanvas(11, 7)
  for (let i = 0; i < 7; i++) {
    cross.rect(i * 1.5, i, 2, 1, 0xffffff)
    cross.rect(9 - i * 1.5, i, 2, 1, 0xffffff)
  }
  cross.toTexture(scene, 'marker-invalid')
}

/**
 * The "my character is going HERE" indicator for tap/click-to-move:
 * a flattened (isometric) cyan ring with a centre dot, a repeating pulse,
 * and a bobbing chevron. Positioned in world coordinates, so it stays
 * glued to the floor under camera scroll and zoom.
 */
export class DestinationMarker {
  private root: Phaser.GameObjects.Container
  private ring: Phaser.GameObjects.Image
  private pulse: Phaser.GameObjects.Image
  private dot: Phaser.GameObjects.Image
  private chevron: Phaser.GameObjects.Image
  private loops: Phaser.Tweens.Tween[] = []

  constructor(
    private scene: Phaser.Scene,
    private reducedMotion: boolean,
  ) {
    makeTextures(scene)
    this.ring = scene.add.image(0, 0, 'marker-ring').setTint(PAL.cyan)
    this.pulse = scene.add.image(0, 0, 'marker-pulse').setTint(PAL.cyan).setBlendMode(Phaser.BlendModes.ADD)
    this.dot = scene.add.image(0, 0, 'marker-dot')
    this.chevron = scene.add.image(0, -14, 'marker-chevron').setTint(PAL.cyan)
    this.root = scene.add.container(0, 0, [this.pulse, this.ring, this.dot]).setDepth(MARKER_DEPTH).setVisible(false)
    // The chevron floats above props in front of the target so it is never hidden.
    this.chevron.setDepth(89000).setVisible(false)
  }

  /** Shows the marker at a world point (the player's feet will stop here). */
  show(x: number, y: number) {
    this.stopLoops()
    this.scene.tweens.killTweensOf([this.root, this.ring, this.pulse, this.dot, this.chevron])
    this.root.setPosition(x, y).setVisible(true).setAlpha(1).setScale(1)
    this.ring.setTint(PAL.cyan).setScale(1).setAlpha(1)
    this.dot.setScale(1).setAlpha(1).setVisible(true)
    this.pulse.setTint(PAL.cyan).setScale(1).setAlpha(0)
    this.chevron.setTexture('marker-chevron').setTint(PAL.cyan).setPosition(x, y - 14).setAlpha(1).setVisible(true)

    if (this.reducedMotion) return
    // Pop in, then pulse while travelling.
    this.ring.setScale(0.4)
    this.scene.tweens.add({ targets: this.ring, scale: 1, duration: 180, ease: 'Back.out' })
    this.loops.push(
      this.scene.tweens.add({ targets: this.pulse, scale: { from: 0.6, to: 1.7 }, alpha: { from: 0.9, to: 0 }, duration: 900, repeat: -1, ease: 'Quad.out' }),
      this.scene.tweens.add({ targets: this.chevron, y: y - 18, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.inOut' }),
    )
  }

  /** Arrival: a quick expanding flash, then fade out. */
  arrive() {
    if (!this.root.visible) return
    this.stopLoops()
    this.chevron.setVisible(false)
    if (this.reducedMotion) {
      this.hide()
      return
    }
    this.pulse.setAlpha(1).setScale(1)
    this.scene.tweens.add({ targets: this.pulse, scale: 2.2, alpha: 0, duration: 380, ease: 'Quad.out' })
    this.scene.tweens.add({ targets: this.dot, scale: 1.8, alpha: 0, duration: 260, ease: 'Quad.out' })
    this.scene.tweens.add({
      targets: this.ring,
      scale: 1.35,
      alpha: 0,
      duration: 380,
      ease: 'Quad.out',
      onComplete: () => this.root.setVisible(false),
    })
  }

  /** Cancelled (manual input, new tap, overlay opened): fade quietly. */
  hide() {
    this.stopLoops()
    this.chevron.setVisible(false)
    if (!this.root.visible) return
    if (this.reducedMotion) {
      this.root.setVisible(false)
      return
    }
    this.scene.tweens.add({ targets: this.root, alpha: 0, duration: 160, onComplete: () => this.root.setVisible(false) })
  }

  /** Brief red cross where the tap could not be reached. */
  invalid(x: number, y: number) {
    this.hide()
    const cross = this.scene.add.image(x, y, 'marker-invalid').setTint(PAL.pink).setDepth(MARKER_DEPTH)
    if (this.reducedMotion) {
      this.scene.time.delayedCall(500, () => cross.destroy())
      return
    }
    this.scene.tweens.add({ targets: cross, x: { from: x - 1.5, to: x + 1.5 }, duration: 50, yoyo: true, repeat: 2 })
    this.scene.tweens.add({ targets: cross, alpha: 0, delay: 350, duration: 300, onComplete: () => cross.destroy() })
  }

  private stopLoops() {
    this.loops.forEach((t) => t.stop())
    this.loops = []
  }
}
