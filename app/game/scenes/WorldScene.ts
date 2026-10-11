import Phaser from 'phaser'
import type { InteractionTarget, TravelDestination, ZoneId } from '../bridge'
import type { WorldOptions } from '../types'
import { buildMap, key, toGrid, toWorld, ZONES, type CellKind, type MapData } from '../layout'
import { anchorOf, generateTextures, SLAB_DEPTH } from '../art/textures'
import { makePlayerAnims, makePlayerTexture, type Facing } from '../art/characters'
import { PAL } from '../art/palette'
import { Sfx } from '../audio'
import { DestinationMarker } from '../systems/DestinationMarker'
import { findPath, nearestOpen, smooth } from '../systems/pathfinding'

interface Interactable {
  target: InteractionTarget
  label: string
  action: string
  /** Where the player is placed by fast travel / click-to-walk. */
  x: number
  y: number
  /** Focus centre — the object can be used from any side within `radius`. */
  fx: number
  fy: number
  radius: number
  accent: number
  ring: Phaser.GameObjects.Image
  sprite?: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite
  /** Static in-world name tag; hidden while the richer prompt is showing. */
  labelObj?: Phaser.GameObjects.Text
  promptX: number
  promptY: number
}

const SPEED = 64
const LABEL_DEPTH = 90000
const PROMPT_DEPTH = 100000
const FONT = '"Space Grotesk", "Manrope", system-ui, sans-serif'
/** Half-size of the player's footprint, in tiles. */
const FOOT = 0.18

const hex = (c: number) => `#${c.toString(16).padStart(6, '0')}`

export class WorldScene extends Phaser.Scene {
  private map!: MapData
  private player!: Phaser.GameObjects.Sprite
  private shadow!: Phaser.GameObjects.Image
  private facing: Facing = 'up'
  private interactables: Interactable[] = []
  private focused: Interactable | null = null
  private zone: ZoneId | null = null
  private keys!: Record<string, Phaser.Input.Keyboard.Key>
  private prompt!: Phaser.GameObjects.Container
  private promptBg!: Phaser.GameObjects.Graphics
  private promptTitle!: Phaser.GameObjects.Text
  private promptAction!: Phaser.GameObjects.Text
  private promptTween?: Phaser.Tweens.Tween
  private focusFx?: Phaser.FX.Glow
  private ringTween?: Phaser.Tweens.Tween
  private stars!: Phaser.GameObjects.TileSprite
  private burst?: Phaser.GameObjects.Particles.ParticleEmitter
  private antennaTop = { x: 0, y: 0 }
  /** Tap/click-to-move route: remaining world-space waypoints (last = destination). */
  private route: { x: number; y: number }[] | null = null
  private marker!: DestinationMarker
  private pending: Interactable | null = null
  private stuck = 0
  private moved = false
  private wasPaused = false
  private sfx!: Sfx
  private unsubs: (() => void)[] = []
  private spawns = {} as Record<ZoneId, { x: number; y: number }>

  constructor(private opts: WorldOptions) {
    super('world')
  }

  create() {
    if (!this.textures.exists('player')) {
      generateTextures(this)
      makePlayerTexture(this)
    }
    if (!this.anims.exists('walk-down')) makePlayerAnims(this)

    this.sfx = new Sfx(() => this.opts.bridge.muted)
    this.map = buildMap()
    this.createBackdrop()
    const bounds = this.bakeGround()

    this.buildPlaza()
    this.buildProjectsHall()
    this.buildSkillsWorkshop()
    this.buildAiLab()
    this.buildContactStation()
    this.buildBridgeSigns()

    this.createPlayer()
    this.createPrompt()
    this.createEffects()
    this.marker = new DestinationMarker(this, this.opts.reducedMotion)
    this.setupCamera(bounds)
    this.setupInput()
    this.setupBridge()

    const start = this.opts.start ? this.destinationPoint(this.opts.start) : null
    const spawn = start ?? this.spawns.plaza
    this.player.setPosition(spawn.x, spawn.y)
    this.cameras.main.centerOn(spawn.x, spawn.y)
    this.updateZone(true)
    this.opts.bridge.events.emit('ready')
  }

  // -------------------------------------------------------------------------
  // World construction
  // -------------------------------------------------------------------------

  private createBackdrop() {
    const { width, height } = this.scale
    this.stars = this.add.tileSprite(width / 2, height / 2, width, height, 'stars').setScrollFactor(0).setDepth(-3000)
    const nebulae: [number, number, number, number][] = [
      [-420, 260, PAL.purple, 14],
      [460, 300, 0x2fb8b0, 12],
      [0, 900, 0x3050c0, 16],
      [-300, 820, PAL.purpleDeep, 10],
      [380, 760, 0x1aa79c, 9],
    ]
    for (const [x, y, c, s] of nebulae) {
      this.add.image(x, y, 'glow').setScale(s).setTint(c).setAlpha(0.09).setBlendMode(Phaser.BlendModes.ADD).setScrollFactor(0.5).setDepth(-2500)
    }
  }

  private bakeGround() {
    const cells = [...this.map.cells.entries()]
      .map(([k, kind]) => {
        const [gx, gy] = k.split(',').map(Number) as [number, number]
        return { gx, gy, kind }
      })
      .sort((a, b) => a.gx + a.gy - (b.gx + b.gy) || a.gx - b.gx)

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const { gx, gy } of cells) {
      const p = toWorld(gx, gy)
      minX = Math.min(minX, p.x - 16)
      maxX = Math.max(maxX, p.x + 16)
      minY = Math.min(minY, p.y)
      maxY = Math.max(maxY, p.y + 16 + SLAB_DEPTH)
    }
    const rt = this.add.renderTexture(minX, minY, maxX - minX, maxY - minY).setOrigin(0).setDepth(-1000)
    rt.beginDraw()
    for (const { gx, gy, kind } of cells) {
      const p = toWorld(gx, gy)
      const x = p.x - 16 - minX
      const y = p.y - minY
      rt.batchDrawFrame(`floor-${kind}-${this.floorVariant(kind, gx, gy)}`, undefined, x, y)
      if (!this.map.cells.has(key(gx, gy + 1))) rt.batchDrawFrame(`side-l-${kind}`, undefined, x, y)
      if (!this.map.cells.has(key(gx + 1, gy))) rt.batchDrawFrame(`side-r-${kind}`, undefined, x, y)
    }
    rt.endDraw()
    return new Phaser.Geom.Rectangle(minX, minY, maxX - minX, maxY - minY)
  }

  private floorVariant(kind: CellKind, gx: number, gy: number) {
    const checker = (gx + gy) % 2 === 0 ? 0 : 1
    if (kind === 'bridge') return 3
    const z = ZONES[kind]
    const dx = gx - z.cx
    const dy = gy - z.cy
    const d = Math.max(Math.abs(dx), Math.abs(dy))
    switch (kind) {
      case 'plaza':
        if (d === 4) return 2
        if (d >= 2 && (dx === dy || dx === -dy)) return 3
        return checker
      case 'projects':
        return Math.abs(dx - dy) <= 1 ? 3 : checker
      case 'skills':
        return d === z.half ? 5 : checker
      case 'ai': {
        const n = Math.sin(gx * 12.9898 + gy * 78.233) * 43758.5453
        return n - Math.floor(n) > 0.82 ? 4 : checker
      }
      case 'contact':
        return d === 3 ? 2 : checker
    }
  }

  private block(gx: number, gy: number) {
    this.map.blocked.add(key(gx, gy))
  }

  /** Places a footprint prop whose back corner sits on cell (gx, gy). */
  private prop(texture: string, gx: number, gy: number, a: number, b: number, block = true) {
    const p = toWorld(gx, gy)
    const an = anchorOf(this, texture)
    const img = this.add.image(p.x, p.y, texture).setOrigin(an.ox, an.oy)
    img.setDepth(toWorld(gx + a / 2, gy + b / 2).y)
    if (block) {
      for (let i = 0; i < Math.ceil(a); i++) for (let j = 0; j < Math.ceil(b); j++) this.block(gx + i, gy + j)
    }
    return img
  }

  /** A camera-facing sprite standing at world point (x, y). */
  private billboard(texture: string, x: number, y: number, frame?: string) {
    const img = this.add.sprite(x, y, texture, frame).setOrigin(0.5, 1).setDepth(y)
    return img
  }

  private light(x: number, y: number, color: number, scale = 1, alpha = 0.45, flicker = true) {
    const g = this.add.image(x, y, 'glow').setTint(color).setScale(scale).setAlpha(alpha).setBlendMode(Phaser.BlendModes.ADD).setDepth(LABEL_DEPTH - 1)
    if (flicker && !this.opts.reducedMotion) {
      this.tweens.add({
        targets: g,
        alpha: alpha * 0.65,
        duration: 1400 + Math.random() * 1600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
        delay: Math.random() * 1000,
      })
    }
    return g
  }

  /** A flattened light pool on the floor. */
  private pool(x: number, y: number, color: number, scale = 1.5, alpha = 0.22) {
    return this.add.image(x, y, 'glow').setTint(color).setScale(scale, scale * 0.5).setAlpha(alpha).setBlendMode(Phaser.BlendModes.ADD).setDepth(-900)
  }

  private bob<T extends Phaser.GameObjects.Components.Transform>(obj: T, amp = 2, duration = 1600) {
    if (this.opts.reducedMotion) return
    this.tweens.add({ targets: obj, y: obj.y - amp, duration, yoyo: true, repeat: -1, ease: 'Sine.inOut', delay: Math.random() * 600 })
  }

  private text(x: number, y: number, str: string, size: number, color: number, weight = 600) {
    const t = this.add
      .text(x, y, str, {
        fontFamily: FONT,
        fontSize: `${size}px`,
        fontStyle: String(weight),
        color: hex(color),
        align: 'center',
        resolution: 8,
      })
      .setOrigin(0.5, 1)
      .setDepth(LABEL_DEPTH)
    t.texture.setFilter(Phaser.Textures.FilterMode.LINEAR)
    return t
  }

  private neon(x: number, y: number, str: string, color: number, size = 9) {
    const t = this.text(x, y, str, size, color, 700)
    t.setShadow(0, 0, hex(color), 6, false, true)
    t.setLetterSpacing(1)
    t.texture.setFilter(Phaser.Textures.FilterMode.LINEAR)
    this.bob(t, 1.5, 2200)
    return t
  }

  private addInteractable(it: Omit<Interactable, 'ring' | 'radius' | 'fx' | 'fy'> & { radius?: number; ringX: number; ringY: number; ringScale: number }) {
    const ring = this.add
      .image(it.ringX, it.ringY, 'ring')
      .setTint(it.accent)
      .setAlpha(0.28)
      .setScale(it.ringScale)
      .setDepth(-800)
    const entry: Interactable = { ...it, fx: it.ringX, fy: it.ringY, radius: it.radius ?? 24 + 18 * it.ringScale, ring }
    this.interactables.push(entry)
    return entry
  }

  private walls(zone: ZoneId, skip: (side: 'a' | 'b', offset: number) => boolean) {
    const z = ZONES[zone]
    const h = z.half
    for (let o = -h; o <= h; o++) {
      const v = (o + h) % 3 === 1 ? 1 : 0
      if (!skip('a', o)) this.prop(`wall-a-${zone}-${v}`, z.cx + o, z.cy - h, 1, 0.25)
      if (!skip('b', o)) this.prop(`wall-b-${zone}-${v}`, z.cx - h, z.cy + o, 0.25, 1)
    }
  }

  private lampAt(gx: number, gy: number, color: number = PAL.warm) {
    const img = this.prop('lamp', gx, gy, 1, 1)
    const an = anchorOf(this, 'lamp')
    const p = toWorld(gx, gy)
    if (an.light) {
      this.light(p.x + an.light[0], p.y + an.light[1], color, 0.55, 0.55)
      const base = toWorld(gx + 0.5, gy + 0.5)
      this.pool(base.x, base.y, color, 1.4, 0.16)
    }
    return img
  }

  private buildPlaza() {
    const z = ZONES.plaza
    const P = toWorld(z.cx, z.cy)
    this.spawns.plaza = { x: P.x, y: P.y + 44 }

    // Central floor projector with a floating crystal. It's walkable on
    // purpose: the plaza centre is an open crossroads to all four bridges.
    this.prop('holo-pad', z.cx - 1, z.cy - 1, 2, 2, false).setDepth(-850)
    const gemImg = this.billboard('gem', P.x, P.y - 22).setDepth(P.y + 1)
    this.bob(gemImg, 3, 1800)
    if (!this.opts.reducedMotion) {
      this.tweens.add({ targets: gemImg, scaleX: 0.35, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.inOut' })
    }
    this.light(P.x, P.y - 22, PAL.cyan, 1.4, 0.5)
    this.pool(P.x, P.y + 4, PAL.cyan, 3, 0.25)

    // Welcome sign.
    const sp = toWorld(z.cx - 4, z.cy + 0.5)
    const sign = this.billboard('welcome-sign', sp.x, sp.y)
    sign.setOrigin(0.5, 49 / 50)
    for (const x of [-40, 40]) {
      const g = toGrid(sp.x + x, sp.y - 2)
      this.block(Math.floor(g.gx), Math.floor(g.gy))
    }
    this.text(sp.x, sp.y - 38, "MOHAMED'S", 6, PAL.cyan, 700).setLetterSpacing(2).setDepth(sign.depth + 1)
    this.text(sp.x, sp.y - 24, 'DEV WORLD', 12, PAL.white, 700).setLetterSpacing(1).setShadow(0, 0, hex(PAL.cyan), 5, false, true).setDepth(sign.depth + 1)
    this.light(sp.x, sp.y - 34, PAL.cyan, 1.3, 0.22, false)
    this.addInteractable({
      target: { kind: 'welcome' },
      label: "Mohamed's Dev World",
      action: 'Read the welcome',
      x: sp.x,
      y: sp.y + 16,
      accent: PAL.cyan,
      sprite: sign,
      promptX: sp.x,
      promptY: sp.y - 54,
      ringX: sp.x,
      ringY: sp.y + 2,
      ringScale: 1.8,
    })

    // Portal back to Quick View.
    const pp = toWorld(z.cx + 1.5, z.cy - 4.5)
    const core = this.billboard('portal-core', pp.x, pp.y - 3).setBlendMode(Phaser.BlendModes.ADD).setDepth(pp.y - 0.5)
    const frame = this.billboard('portal-frame', pp.x, pp.y)
    this.block(z.cx + 1, z.cy - 5)
    this.block(z.cx + 1, z.cy - 4)
    if (!this.opts.reducedMotion) {
      this.tweens.add({ targets: core, alpha: 0.55, scaleY: 0.94, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.inOut' })
      this.add
        .particles(0, 0, 'mote', {
          x: { min: pp.x - 9, max: pp.x + 9 },
          y: { min: pp.y - 30, max: pp.y - 6 },
          lifespan: 1400,
          speedY: { min: -14, max: -4 },
          alpha: { start: 0.9, end: 0 },
          scale: { start: 1, end: 0.3 },
          tint: [PAL.cyan, PAL.purple, PAL.ice],
          frequency: 120,
          blendMode: Phaser.BlendModes.ADD,
        })
        .setDepth(pp.y + 1)
    }
    this.light(pp.x, pp.y - 18, PAL.purple, 1.1, 0.4)
    this.text(pp.x, pp.y - 48, 'QUICK VIEW', 6, PAL.ice, 700).setLetterSpacing(2)
    this.addInteractable({
      target: { kind: 'portal' },
      label: 'Quick View portal',
      action: 'Switch to the classic portfolio',
      x: pp.x,
      y: pp.y + 14,
      accent: PAL.purple,
      sprite: frame,
      promptX: pp.x,
      promptY: pp.y - 58,
      ringX: pp.x,
      ringY: pp.y + 2,
      ringScale: 1,
    })

    // Guide bot.
    const gp = toWorld(z.cx + 3.2, z.cy + 0.6)
    const shadow = this.add.image(gp.x, gp.y, 'shadow').setDepth(gp.y - 1).setAlpha(0.6)
    const drone = this.billboard('drone', gp.x, gp.y - 10).setDepth(gp.y)
    this.bob(drone, 3, 1300)
    this.light(gp.x, gp.y - 16, PAL.cyan, 0.45, 0.4)
    this.block(z.cx + 3, z.cy + 0)
    void shadow
    this.addInteractable({
      target: { kind: 'guide' },
      label: 'Byte · guide bot',
      action: 'Ask for directions',
      x: gp.x - 4,
      y: gp.y + 12,
      accent: PAL.cyan,
      sprite: drone,
      promptX: gp.x,
      promptY: gp.y - 30,
      ringX: gp.x,
      ringY: gp.y,
      ringScale: 0.7,
    })

    // Lamps flanking every bridge.
    const flanks: [number, number][] = [
      [-6, -4], [-4, -6], [4, -6], [6, -4], [6, 4], [4, 6], [-4, 6], [-6, 4],
    ]
    for (const [ox, oy] of flanks) this.lampAt(z.cx + ox, z.cy + oy)

    // Planters and benches.
    this.prop('tree-0', z.cx + 6, z.cy, 1, 1)
    this.prop('tree-1', z.cx, z.cy + 6, 1, 1)
    this.prop('tree-0', z.cx - 6, z.cy - 1, 1, 1)
    this.prop('tree-1', z.cx + 5, z.cy - 6, 1, 1)
    this.prop('bench', z.cx + 4, z.cy + 1, 1, 1)
    this.prop('bench', z.cx + 1, z.cy + 4, 1, 1)
  }

  private buildProjectsHall() {
    const z = ZONES.projects
    const C = toWorld(z.cx, z.cy)
    this.spawns.projects = toWorld(z.cx + 3.5, z.cy + 3.5)
    this.walls('projects', () => false)

    // Two rows flanking a central aisle that leads to the archive.
    const slots: [number, number][] = [
      [-5, 3],
      [3, -5],
      [-6, -2],
      [-2, -6],
    ]
    for (const project of this.opts.content.projects) {
      const slot = slots[project.slot]
      if (!slot) continue
      const [ox, oy] = slot
      const gx = z.cx + ox
      const gy = z.cy + oy
      const img = this.prop(project.display, gx, gy, 2, 2)
      const center = toWorld(gx + 1, gy + 1)
      const top = img.y - img.displayHeight * img.originY
      const accent = { workstation: PAL.blue, kiosk: PAL.gold, phone: PAL.pink, 'id-terminal': PAL.cyan }[project.display]

      if (project.display === 'kiosk') {
        const globe = this.billboard('globe', center.x, center.y - 34).setDepth(img.depth + 1)
        this.bob(globe, 2, 1500)
        if (!this.opts.reducedMotion) this.tweens.add({ targets: globe, scaleX: -1, duration: 2400, yoyo: true, repeat: -1, ease: 'Sine.inOut' })
      } else if (project.display === 'id-terminal') {
        const card = this.billboard('id-card', center.x, center.y - 26).setDepth(img.depth + 1).setAlpha(0.92)
        this.bob(card, 3, 1700)
        if (!this.opts.reducedMotion) this.tweens.add({ targets: card, alpha: 0.7, duration: 240, yoyo: true, repeat: -1, repeatDelay: 2600 })
      }
      this.light(center.x, center.y - 22, accent, 1, 0.3)
      this.pool(center.x, center.y, accent, 2.2, 0.2)

      const labelY = Math.min(top, center.y - 34) - 2
      const label = this.text(center.x, labelY, project.title, 6, project.draft ? PAL.steel : PAL.white, 700)

      this.addInteractable({
        labelObj: label,
        target: { kind: 'project', slug: project.slug },
        label: project.title,
        action: project.draft ? 'Preview — details coming soon' : 'View project',
        x: center.x,
        y: center.y + 22,
        accent,
        sprite: img,
        promptX: center.x,
        promptY: labelY - 10,
        ringX: center.x,
        ringY: center.y,
        ringScale: 1.45,
      })
    }

    // Project archive rack at the back of the hall.
    const ax = z.cx - 6
    const ay = z.cy - 6
    const archive = this.prop('archive', ax, ay, 2, 1)
    const ac = toWorld(ax + 1, ay + 0.5)
    this.light(ac.x, ac.y - 24, PAL.blue, 1.1, 0.3)
    const aTop = archive.y - archive.displayHeight * archive.originY
    const aLabel = this.text(ac.x, aTop - 3, 'Project archive', 6, PAL.white, 700)
    this.addInteractable({
      labelObj: aLabel,
      target: { kind: 'archive' },
      label: 'Project archive',
      action: 'Browse every project',
      x: ac.x,
      y: ac.y + 22,
      accent: PAL.blue,
      sprite: archive,
      promptX: ac.x,
      promptY: aTop - 14,
      ringX: ac.x,
      ringY: ac.y + 2,
      ringScale: 1.3,
    })

    this.lampAt(z.cx + 7, z.cy + 4, PAL.blue)
    this.lampAt(z.cx + 4, z.cy + 7, PAL.blue)
    this.prop('tree-1', z.cx + 7, z.cy - 6, 1, 1)
    this.prop('tree-0', z.cx - 6, z.cy + 7, 1, 1)
    this.motes(C.x, C.y, PAL.blue)
  }

  private buildSkillsWorkshop() {
    const z = ZONES.skills
    const C = toWorld(z.cx, z.cy)
    this.spawns.skills = toWorld(z.cx - 3, z.cy + 3)
    this.walls('skills', (side, o) => side === 'b' && o > 3)

    const spots: [number, number][] = [
      [-3, -5],
      [1, -4],
      [2, 0],
      [-1, 3],
      [-5, -2],
    ]
    this.opts.content.skills.forEach((skill, i) => {
      const spot = spots[i]
      if (!spot) return
      const gx = z.cx + spot[0]
      const gy = z.cy + spot[1]
      const bench = this.prop('workbench', gx, gy, 2, 1)
      const c = toWorld(gx + 1, gy + 0.5)
      const panel = this.billboard(`holo-${skill.id}`, c.x, c.y - 20).setDepth(bench.depth + 1).setBlendMode(Phaser.BlendModes.SCREEN)
      this.bob(panel, 2, 1900)
      this.light(c.x, c.y - 26, PAL.amber, 0.9, 0.28)
      this.pool(c.x, c.y, PAL.amber, 1.8, 0.16)
      const label = this.text(c.x, c.y - 37, skill.title, 6, PAL.white, 700)
      this.addInteractable({
        labelObj: label,
        target: { kind: 'skill', id: skill.id },
        label: skill.title,
        action: 'Inspect station',
        x: c.x,
        y: c.y + 20,
        accent: PAL.amber,
        sprite: bench,
        promptX: c.x,
        promptY: c.y - 47,
        ringX: c.x,
        ringY: c.y,
        ringScale: 1.3,
      })
    })

    this.prop('crate', z.cx + 5, z.cy + 4, 1, 1)
    this.prop('crate', z.cx + 5, z.cy + 5, 1, 1)
    this.prop('crate', z.cx + 4, z.cy + 5, 1, 1)
    this.prop('crate', z.cx + 4, z.cy - 5, 1, 1)
    this.lampAt(z.cx - 4, z.cy + 6, PAL.amber)
    this.lampAt(z.cx + 6, z.cy - 2, PAL.amber)
    this.motes(C.x, C.y, PAL.amber)
  }

  private buildAiLab() {
    const z = ZONES.ai
    const C = toWorld(z.cx, z.cy)
    this.spawns.ai = toWorld(z.cx + 3, z.cy - 3)
    this.walls('ai', (side, o) => side === 'a' && o > 3)

    // Neural core.
    this.prop('core-base', z.cx - 1, z.cy - 1, 2, 2)
    const orbImg = this.billboard('orb', C.x, C.y - 16).setDepth(C.y + 1)
    this.bob(orbImg, 3, 1500)
    this.light(C.x, C.y - 24, PAL.purple, 1.6, 0.5)
    this.pool(C.x, C.y + 2, PAL.purple, 3, 0.28)
    if (!this.opts.reducedMotion) {
      this.add
        .particles(0, 0, 'mote', {
          x: C.x,
          y: C.y - 24,
          lifespan: 1800,
          speed: { min: 6, max: 16 },
          alpha: { start: 0.9, end: 0 },
          tint: [PAL.purple, PAL.cyan],
          frequency: 160,
          blendMode: Phaser.BlendModes.ADD,
        })
        .setDepth(C.y + 2)
    }

    // Robot assistant (scripted — not a live model).
    const rp = toWorld(z.cx + 3.5, z.cy - 1.5)
    this.add.image(rp.x, rp.y, 'shadow').setDepth(rp.y - 1).setScale(1.2, 1)
    const robot = this.billboard('robot', rp.x, rp.y - 4, 'robot-0')
    this.block(z.cx + 3, z.cy - 2)
    this.bob(robot, 2, 1400)
    this.time.addEvent({
      delay: 2600,
      loop: true,
      callback: () => {
        robot.setFrame('robot-1')
        this.time.delayedCall(140, () => robot.setFrame('robot-0'))
      },
    })
    this.light(rp.x, rp.y - 22, PAL.cyan, 0.6, 0.35)
    const robotLabel = this.text(rp.x, rp.y - 38, 'B-07 · lab assistant', 5, PAL.ice, 600)
    this.addInteractable({
      labelObj: robotLabel,
      target: { kind: 'robot' },
      label: 'B-07 · lab assistant',
      action: 'Talk to the robot',
      x: rp.x - 2,
      y: rp.y + 16,
      accent: PAL.cyan,
      sprite: robot,
      promptX: rp.x,
      promptY: rp.y - 48,
      ringX: rp.x,
      ringY: rp.y,
      ringScale: 0.8,
    })

    // AI workflow displays.
    const spots: [number, number][] = [
      [-4, -3],
      [-1, -5],
      [-5, 0],
      [-1, 3],
    ]
    this.opts.content.ai.forEach((item, i) => {
      const spot = spots[i]
      if (!spot) return
      const gx = z.cx + spot[0]
      const gy = z.cy + spot[1]
      const stand = this.prop('ai-stand', gx, gy, 1, 1)
      const c = toWorld(gx + 0.5, gy + 0.5)
      const panel = this.billboard('ai-panel', c.x, c.y - 18).setDepth(stand.depth + 1)
      this.bob(panel, 1.5, 2100)
      if (!this.opts.reducedMotion) this.tweens.add({ targets: panel, alpha: 0.75, duration: 180, yoyo: true, repeat: -1, repeatDelay: 3200 + i * 700 })
      this.light(c.x, c.y - 26, PAL.purple, 0.8, 0.3)
      const label = this.text(c.x, c.y - 37, item.title, 5, PAL.white, 700)
      this.addInteractable({
        labelObj: label,
        target: { kind: 'ai', index: i },
        label: item.title,
        action: 'Open workflow',
        x: c.x,
        y: c.y + 16,
        accent: PAL.purple,
        sprite: panel,
        promptX: c.x,
        promptY: c.y - 46,
        ringX: c.x,
        ringY: c.y,
        ringScale: 0.8,
      })
    })

    for (const [ox, oy] of [[1, -5], [2, -5], [-5, 3], [-5, 4]] as const) this.prop('rack', z.cx + ox, z.cy + oy, 1, 1)
    this.lampAt(z.cx + 6, z.cy - 4, PAL.purple)
    this.lampAt(z.cx + 4, z.cy + 6, PAL.purple)
    this.motes(C.x, C.y, PAL.purple)
  }

  private buildContactStation() {
    const z = ZONES.contact
    const C = toWorld(z.cx, z.cy)
    this.spawns.contact = toWorld(z.cx - 3, z.cy - 3)
    this.walls('contact', (_side, o) => o < -2)

    const term = this.prop('comm-terminal', z.cx - 1, z.cy - 1, 2, 2)
    const termTop = term.y - term.displayHeight * term.originY
    this.light(C.x, C.y - 18, PAL.green, 1.1, 0.35)
    this.pool(C.x, C.y, PAL.green, 2.6, 0.24)
    const termLabel = this.text(C.x, termTop - 3, "Let's build something", 6, PAL.white, 700)
    this.addInteractable({
      labelObj: termLabel,
      target: { kind: 'contact' },
      label: 'Contact terminal',
      action: 'Get in touch',
      x: C.x,
      y: C.y + 22,
      accent: PAL.green,
      sprite: term,
      promptX: C.x,
      promptY: termTop - 14,
      ringX: C.x,
      ringY: C.y,
      ringScale: 1.45,
    })

    const ax = z.cx + 2
    const ay = z.cy - 4
    this.prop('antenna', ax, ay, 1, 1)
    const an = anchorOf(this, 'antenna')
    const ap = toWorld(ax, ay)
    if (an.light) {
      this.antennaTop = { x: ap.x + an.light[0], y: ap.y + an.light[1] }
      const beacon = this.light(this.antennaTop.x, this.antennaTop.y, PAL.green, 0.5, 0.7, false)
      if (!this.opts.reducedMotion) this.tweens.add({ targets: beacon, alpha: 0.1, duration: 700, yoyo: true, repeat: -1 })
    }

    this.prop('tree-0', z.cx - 5, z.cy + 3, 1, 1)
    this.prop('tree-1', z.cx + 3, z.cy + 5, 1, 1)
    this.prop('bench', z.cx - 4, z.cy + 2, 1, 1)
    this.prop('bench', z.cx + 2, z.cy + 4, 1, 1)
    this.lampAt(z.cx - 2, z.cy - 6, PAL.green)
    this.lampAt(z.cx - 6, z.cy - 2, PAL.green)
    this.lampAt(z.cx + 6, z.cy + 6, PAL.green)
    this.motes(C.x, C.y, PAL.green)
  }

  private buildBridgeSigns() {
    const signs: [ZoneId, number, number][] = [
      ['projects', 24, 24],
      ['skills', 40, 24],
      ['ai', 24, 40],
      ['contact', 40, 40],
    ]
    for (const [zone, gx, gy] of signs) {
      const p = toWorld(gx + 0.5, gy + 0.5)
      const z = ZONES[zone]
      this.neon(p.x, p.y - 18, z.name.toUpperCase(), z.accent, 8)
    }
  }

  private motes(x: number, y: number, color: number) {
    if (this.opts.reducedMotion) return
    this.add
      .particles(0, 0, 'mote', {
        x: { min: x - 110, max: x + 110 },
        y: { min: y - 50, max: y + 60 },
        lifespan: 4200,
        speedY: { min: -9, max: -3 },
        speedX: { min: -2, max: 2 },
        alpha: { start: 0.7, end: 0 },
        scale: { start: 1, end: 0.4 },
        tint: color,
        frequency: 420,
        blendMode: Phaser.BlendModes.ADD,
      })
      .setDepth(LABEL_DEPTH - 2)
  }

  // -------------------------------------------------------------------------
  // Player, prompt, camera, input
  // -------------------------------------------------------------------------

  private createPlayer() {
    this.shadow = this.add.image(0, 0, 'shadow')
    this.player = this.add.sprite(0, 0, 'player', 'up-0').setOrigin(0.5, 23 / 24)
  }

  private createPrompt() {
    this.promptBg = this.add.graphics()
    this.promptTitle = this.text(0, 0, '', 6, PAL.white, 700).setOrigin(0.5, 0)
    this.promptAction = this.text(0, 0, '', 5, PAL.cyan, 600).setOrigin(0.5, 0)
    this.prompt = this.add.container(0, 0, [this.promptBg, this.promptTitle, this.promptAction]).setDepth(PROMPT_DEPTH).setVisible(false)
  }

  private createEffects() {
    if (this.opts.reducedMotion) return
    this.burst = this.add.particles(0, 0, 'mote', {
      speed: { min: 20, max: 70 },
      lifespan: 700,
      alpha: { start: 1, end: 0 },
      scale: { start: 1.2, end: 0.2 },
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    })
    this.burst.setDepth(PROMPT_DEPTH - 1)
  }

  private setupCamera(bounds: Phaser.Geom.Rectangle) {
    const cam = this.cameras.main
    const pad = 140
    cam.setBounds(bounds.x - pad, bounds.y - pad, bounds.width + pad * 2, bounds.height + pad * 2)
    const lerp = this.opts.reducedMotion ? 1 : 0.1
    cam.startFollow(this.player, true, lerp, lerp, 0, 10)
    this.applyZoom()
    this.scale.on(Phaser.Scale.Events.RESIZE, this.applyZoom, this)
  }

  private applyZoom() {
    const { width, height } = this.scale
    const z = Phaser.Math.Clamp(Math.floor(Math.min(width / 380, height / 250)), 2, 4)
    this.cameras.main.setZoom(z)
    this.stars.setPosition(width / 2, height / 2).setSize(width / z + 4, height / z + 4)
  }

  private setupInput() {
    const kb = this.input.keyboard
    if (kb) {
      // The world page never scrolls, and dialogs/HUD buttons need their keys.
      kb.disableGlobalCapture()
      this.keys = kb.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT', false) as Record<string, Phaser.Input.Keyboard.Key>
      const onAction = (e: KeyboardEvent) => {
        const el = document.activeElement
        const onControl = el && el !== document.body && el.tagName !== 'CANVAS'
        if (onControl && (e.key === 'Enter' || e.key === ' ')) return
        this.tryInteract()
      }
      kb.on('keydown-E', onAction)
      kb.on('keydown-ENTER', onAction)
      kb.on('keydown-SPACE', onAction)
    }

    this.input.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
      if (this.opts.bridge.paused) return
      // HUD, overlays and touch controls are DOM above the canvas; ignore
      // anything that didn't start on the canvas itself.
      if (pointer.downElement && pointer.downElement !== this.game.canvas) return
      // worldX/worldY already account for camera scroll and zoom.
      const wx = pointer.worldX
      const wy = pointer.worldY
      const hit = this.interactables.find((it) => it.sprite?.getBounds().contains(wx, wy) || Math.hypot(it.fx - wx, (it.fy - wy) * 1.6) < it.radius * 0.6)
      if (hit && hit === this.focused) {
        this.cancelRoute()
        this.tryInteract()
        return
      }
      if (hit) this.navigateTo(hit.x, hit.y, hit)
      else this.navigateTo(wx, wy, null)
    })
  }

  private setupBridge() {
    const { bridge } = this.opts
    this.unsubs.push(
      bridge.commands.on('travel', (d) => this.travel(d)),
      bridge.commands.on('interact', () => this.tryInteract()),
      bridge.commands.on('transmit', () => this.transmit()),
    )
    const cleanup = () => {
      this.unsubs.forEach((u) => u())
      this.unsubs = []
      this.scale.off(Phaser.Scale.Events.RESIZE, this.applyZoom, this)
      this.sfx.destroy()
    }
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup)
    this.events.once(Phaser.Scenes.Events.DESTROY, cleanup)
  }

  // -------------------------------------------------------------------------
  // Tap / click to move
  // -------------------------------------------------------------------------

  private cellOpen = (gx: number, gy: number) => {
    const k = key(gx, gy)
    return this.map.cells.has(k) && !this.map.blocked.has(k)
  }

  private walkableAt(x: number, y: number) {
    const g = toGrid(x, y)
    return this.walkable(g.gx, g.gy)
  }

  /** True when the player's footprint can slide straight from a to b. */
  private segmentClear(a: { x: number; y: number }, b: { x: number; y: number }) {
    const ga = toGrid(a.x, a.y)
    const gb = toGrid(b.x, b.y)
    const steps = Math.ceil(Math.hypot(gb.gx - ga.gx, gb.gy - ga.gy) / 0.1)
    for (let i = 1; i <= steps; i++) {
      const t = i / steps
      if (!this.walkable(ga.gx + (gb.gx - ga.gx) * t, ga.gy + (gb.gy - ga.gy) * t)) return false
    }
    return true
  }

  /**
   * Plans an A* route over the collision grid to a world point and starts
   * walking it. A new tap replaces any previous route; unreachable taps
   * show an invalid marker and leave the player where they are.
   */
  private navigateTo(wx: number, wy: number, interactWith: Interactable | null) {
    this.cancelRoute(true)
    const tap = toGrid(wx, wy)
    const goalCell = nearestOpen(this.cellOpen, Math.floor(tap.gx), Math.floor(tap.gy), interactWith ? 3 : 1)
    const p = toGrid(this.player.x, this.player.y)
    const startCell = nearestOpen(this.cellOpen, Math.floor(p.gx), Math.floor(p.gy), 1)
    const cells = goalCell && startCell ? findPath(this.cellOpen, startCell, goalCell) : null
    if (!goalCell || !cells) {
      this.marker.invalid(wx, wy)
      return
    }

    // Stop exactly where tapped when the feet fit there, else at the cell centre.
    const exact = this.walkableAt(wx, wy) && Math.floor(tap.gx) === goalCell[0] && Math.floor(tap.gy) === goalCell[1]
    const dest = exact ? { x: wx, y: wy } : toWorld(goalCell[0] + 0.5, goalCell[1] + 0.5)

    const points = [
      { x: this.player.x, y: this.player.y },
      ...cells.slice(1, -1).map(([cx, cy]) => toWorld(cx + 0.5, cy + 0.5)),
      dest,
    ]
    const route = smooth(points, (a, b) => this.segmentClear(a, b)).slice(1)
    if (!route.length || Math.hypot(dest.x - this.player.x, dest.y - this.player.y) < 2) {
      if (interactWith && this.focused === interactWith) this.tryInteract()
      return
    }
    this.route = route
    this.pending = interactWith
    this.stuck = 0
    this.marker.show(dest.x, dest.y)
  }

  private finishRoute() {
    this.route = null
    this.stuck = 0
    this.marker.arrive()
  }

  /** Drops the current route; `replacing` skips the fade when a new tap follows. */
  private cancelRoute(replacing = false) {
    this.route = null
    this.pending = null
    this.stuck = 0
    if (!replacing) this.marker?.hide()
  }

  // -------------------------------------------------------------------------
  // Frame update
  // -------------------------------------------------------------------------

  override update(_time: number, delta: number) {
    // Cap long frames (tab switches) without slowing low-FPS devices.
    const dt = Math.min(delta, 100) / 1000
    const { bridge } = this.opts

    if (bridge.paused !== this.wasPaused) {
      this.wasPaused = bridge.paused
      this.cancelRoute()
    }

    let vx = 0
    let vy = 0
    if (!bridge.paused) {
      const k = this.keys
      if (k) {
        if (k.A!.isDown || k.LEFT!.isDown) vx -= 1
        if (k.D!.isDown || k.RIGHT!.isDown) vx += 1
        if (k.W!.isDown || k.UP!.isDown) vy -= 1
        if (k.S!.isDown || k.DOWN!.isDown) vy += 1
      }
      vx += bridge.input.stickX
      vy += bridge.input.stickY
      const len = Math.hypot(vx, vy)
      if (len > 0.15) {
        // Manual input (keyboard or D-pad) always wins over a tap route.
        if (this.route) this.cancelRoute()
        const m = Math.min(len, 1) / len
        vx *= m
        vy *= m
      } else if (this.route) {
        const step = SPEED * dt
        let wp = this.route[0]!
        let d = Math.hypot(wp.x - this.player.x, wp.y - this.player.y)
        // Advance past waypoints we're already on.
        while (d <= step && this.route.length > 1) {
          this.route.shift()
          wp = this.route[0]!
          d = Math.hypot(wp.x - this.player.x, wp.y - this.player.y)
        }
        if (d <= step) {
          // Final waypoint: land exactly on it, then arrive.
          if (this.walkableAt(wp.x, wp.y)) this.player.setPosition(wp.x, wp.y)
          this.finishRoute()
          vx = 0
          vy = 0
        } else {
          vx = (wp.x - this.player.x) / d
          vy = (wp.y - this.player.y) / d
        }
      } else {
        vx = 0
        vy = 0
      }
    }

    const moving = vx !== 0 || vy !== 0
    if (moving) {
      const ok = this.tryMove(vx * SPEED * dt, vy * SPEED * dt)
      if (!ok && this.route) {
        this.stuck += dt
        if (this.stuck > 0.3) this.cancelRoute()
      } else {
        this.stuck = 0
      }
      if (Math.abs(vx) > Math.abs(vy) * 1.2) {
        this.facing = 'side'
        this.player.setFlipX(vx < 0)
      } else {
        this.facing = vy < 0 ? 'up' : 'down'
        this.player.setFlipX(false)
      }
      this.player.anims.play(`walk-${this.facing}`, true)
      if (!this.moved) {
        this.moved = true
        bridge.events.emit('firstMove')
      }
    } else if (this.player.anims.isPlaying) {
      this.player.anims.stop()
      this.player.setFrame(`${this.facing}-0`)
    }

    this.player.setDepth(this.player.y)
    this.shadow.setPosition(this.player.x, this.player.y).setDepth(this.player.y - 0.5)

    this.updateFocus()
    if (this.pending && this.focused === this.pending) {
      this.pending = null
      if (this.route) this.finishRoute()
      this.tryInteract()
    }
    // The route ended without reaching its object: forget the queued interaction.
    if (this.pending && !this.route) this.pending = null
    this.updateZone()

    const cam = this.cameras.main
    this.stars.tilePositionX = cam.scrollX * 0.15
    this.stars.tilePositionY = cam.scrollY * 0.15
  }

  /** The player's feet are a small square in grid space; every corner must stand on open floor. */
  private walkable(gx: number, gy: number) {
    for (const ox of [-FOOT, FOOT]) {
      for (const oy of [-FOOT, FOOT]) {
        const k = key(Math.floor(gx + ox), Math.floor(gy + oy))
        if (!this.map.cells.has(k) || this.map.blocked.has(k)) return false
      }
    }
    return true
  }

  /**
   * Moves the player by a screen-space delta. Collision runs in grid space,
   * one axis at a time: every wall and prop footprint is axis-aligned there,
   * so the player slides smoothly along isometric edges instead of sticking.
   */
  private tryMove(dx: number, dy: number) {
    const p = this.player
    const g = toGrid(p.x, p.y)
    const d = toGrid(dx, dy)
    let gx = g.gx
    let gy = g.gy
    if (d.gx !== 0 && this.walkable(gx + d.gx, gy)) gx += d.gx
    if (d.gy !== 0 && this.walkable(gx, gy + d.gy)) gy += d.gy
    if (gx === g.gx && gy === g.gy) return false
    const w = toWorld(gx, gy)
    p.setPosition(w.x, w.y)
    return true
  }

  private updateFocus() {
    let best: Interactable | null = null
    let bestD = Infinity
    if (!this.opts.bridge.paused) {
      for (const it of this.interactables) {
        const d = Math.hypot(it.fx - this.player.x, (it.fy - this.player.y) * 1.6)
        if (d < it.radius && d < bestD) {
          best = it
          bestD = d
        }
      }
    }
    if (best !== this.focused) this.setFocus(best)
  }

  private setFocus(it: Interactable | null) {
    const prev = this.focused
    if (prev) {
      this.ringTween?.stop()
      prev.ring.setAlpha(0.28)
      prev.labelObj?.setVisible(true)
      if (this.focusFx) prev.sprite?.preFX?.remove(this.focusFx)
      this.focusFx = undefined
    }
    this.focused = it
    this.promptTween?.stop()

    if (!it) {
      this.prompt.setVisible(false)
      this.opts.bridge.events.emit('focus', null)
      return
    }

    it.ring.setAlpha(0.9)
    it.labelObj?.setVisible(false)
    if (!this.opts.reducedMotion) {
      this.ringTween = this.tweens.add({ targets: it.ring, alpha: 0.5, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.inOut' })
    }
    if (it.sprite?.preFX) {
      it.sprite.preFX.setPadding(4)
      this.focusFx = it.sprite.preFX.addGlow(it.accent, 2, 0, false, 0.1, 8)
    }

    this.promptTitle.setText(it.label)
    this.promptAction.setText(`${this.opts.touch ? 'Tap' : 'E'}  ·  ${it.action}`)
    this.promptTitle.texture.setFilter(Phaser.Textures.FilterMode.LINEAR)
    this.promptAction.texture.setFilter(Phaser.Textures.FilterMode.LINEAR)
    const w = Math.max(this.promptTitle.width, this.promptAction.width) + 12
    const h = 21
    this.promptTitle.setPosition(0, -h + 3)
    this.promptAction.setPosition(0, -h + 12)
    this.promptBg.clear()
    this.promptBg.fillStyle(PAL.navy950, 0.92)
    this.promptBg.fillRoundedRect(-w / 2, -h, w, h, 3)
    this.promptBg.lineStyle(0.75, it.accent, 0.9)
    this.promptBg.strokeRoundedRect(-w / 2, -h, w, h, 3)
    this.promptBg.fillStyle(PAL.navy950, 0.92)
    this.promptBg.fillTriangle(-3, 0, 3, 0, 0, 3)
    this.prompt.setPosition(it.promptX, it.promptY).setVisible(true).setAlpha(1)
    if (!this.opts.reducedMotion) {
      this.prompt.setY(it.promptY + 3).setAlpha(0)
      this.promptTween = this.tweens.add({ targets: this.prompt, y: it.promptY, alpha: 1, duration: 160, ease: 'Quad.out' })
    }
    this.sfx.focus()
    this.opts.bridge.events.emit('focus', { label: it.label, action: it.action, target: it.target })
  }

  private tryInteract() {
    const it = this.focused
    if (!it || this.opts.bridge.paused) return
    this.sfx.interact()
    if (this.burst) {
      this.burst.particleTint = it.accent
      this.burst.explode(14, it.ring.x, it.ring.y - 10)
    }
    if (it.target.kind === 'contact') this.transmit()
    this.opts.bridge.events.emit('interact', it.target)
  }

  private updateZone(force = false) {
    const g = toGrid(this.player.x, this.player.y)
    const kind = this.map.cells.get(key(Math.floor(g.gx), Math.floor(g.gy)))
    if (!kind || kind === 'bridge') return
    if (kind !== this.zone || force) {
      const first = this.zone === null
      this.zone = kind
      if (!first) this.sfx.zone()
      this.opts.bridge.events.emit('zone', kind)
    }
  }

  // -------------------------------------------------------------------------
  // Commands
  // -------------------------------------------------------------------------

  private destinationPoint(d: TravelDestination) {
    if ('zone' in d) return this.spawns[d.zone] ?? null
    const it = this.interactables.find((i) =>
      'project' in d ? i.target.kind === 'project' && i.target.slug === d.project : i.target.kind === 'skill' && i.target.id === d.skill,
    )
    return it ? { x: it.x, y: it.y } : null
  }

  private travel(d: TravelDestination) {
    const pt = this.destinationPoint(d)
    if (!pt) return
    const cam = this.cameras.main
    this.cancelRoute()
    const go = () => {
      this.player.setPosition(pt.x, pt.y)
      this.facing = 'up'
      this.player.setFrame('up-0')
      cam.centerOn(pt.x, pt.y)
      this.updateZone()
    }
    if (this.opts.reducedMotion) {
      go()
      return
    }
    cam.fadeOut(180, 5, 8, 18)
    cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      go()
      cam.fadeIn(280, 5, 8, 18)
    })
  }

  private transmit() {
    this.sfx.transmit()
    if (this.opts.reducedMotion || !this.burst) return
    const { x, y } = this.antennaTop
    this.burst.particleTint = PAL.green
    this.burst.explode(24, x, y)
    const ring = this.add.image(x, y, 'glow').setTint(PAL.green).setBlendMode(Phaser.BlendModes.ADD).setDepth(PROMPT_DEPTH - 2).setScale(0.2)
    this.tweens.add({ targets: ring, scale: 2.4, alpha: 0, duration: 900, ease: 'Quad.out', onComplete: () => ring.destroy() })
  }
}
