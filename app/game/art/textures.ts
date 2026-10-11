import Phaser from 'phaser'
import { PixelCanvas, hash, isoBox, mix, shade, type BoxColors, type Pt } from './pixel'
import { FLOORS, PAL } from './palette'
import type { CellKind } from '../layout'

/**
 * Procedural pixel-art generation. Every texture in the world is produced
 * here at boot from the shared palette — no external images, so there is
 * nothing to license and nothing to download beyond the JS chunk.
 *
 * Prop textures carry their placement anchor in `customData.anchor`: the
 * texture pixel that sits on the ground-level back corner of the prop's
 * footprint (or, for billboards, the bottom-centre).
 */

export const SLAB_DEPTH = 14

type Anchor = { anchor: [number, number]; light?: [number, number] }

function save(scene: Phaser.Scene, key: string, pc: PixelCanvas, meta?: Anchor) {
  const tex = pc.toTexture(scene, key)
  if (tex && meta) Object.assign(tex.customData, meta)
  return tex
}

/** A canvas sized for a footprint a×b with `elev` pixels of art above the ground. */
function footprintCanvas(a: number, b: number, elev: number, padX = 0) {
  const pc = new PixelCanvas(16 * (a + b) + padX * 2, 8 * (a + b) + elev + 1)
  const O: Pt = [16 * b + padX, elev]
  return { pc, O }
}

/** Texture point for grid offset (ga, gb) at `elev` pixels above ground. */
function gp(O: Pt, ga: number, gb: number, elev = 0): Pt {
  return [O[0] + (ga - gb) * 16, O[1] + (ga + gb) * 8 - elev]
}

function box(pc: PixelCanvas, O: Pt, ga: number, gb: number, elev: number, a: number, b: number, h: number, c: BoxColors) {
  const [x, y] = gp(O, ga, gb, elev + h)
  return isoBox(pc, x, y, a, b, h, c)
}

function pedestal(pc: PixelCanvas, O: Pt, a: number, b: number, rim: number) {
  box(pc, O, 0, 0, 0, a, b, 4, { top: PAL.navy600, left: PAL.navy900, right: PAL.navy800, rim })
  // Inner inset plate.
  box(pc, O, 0.25, 0.25, 4, a - 0.5, b - 0.5, 1, { top: PAL.navy700, left: PAL.navy800, right: PAL.navy800 })
}

// ---------------------------------------------------------------------------
// Ground
// ---------------------------------------------------------------------------

function diamond(pc: PixelCanvas, color: number) {
  pc.poly([[16, 0], [32, 8], [16, 16], [0, 8]], color)
}

function floorTile(kind: CellKind, variant: number) {
  const f = FLOORS[kind]
  const pc = new PixelCanvas(32, 16)
  const base = variant === 1 ? f.alt : f.base
  diamond(pc, base)
  // Subtle surface grain.
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 32; x++) {
      if (!pc.alphaAt(x, y)) continue
      const n = hash(x, y, variant * 7 + kind.length)
      if (n > 0.93) pc.px(x, y, shade(base, 1.12))
      else if (n < 0.05) pc.px(x, y, shade(base, 0.88))
    }
  }
  // Bevel: light on back edges, dark grout on front edges.
  pc.isoLine(0, 7, 8, 1, shade(base, 0.72))
  pc.isoLine(31, 7, 8, -1, shade(base, 0.72))
  pc.isoLine(15, 0, 8, -1, shade(base, 1.18))
  pc.isoLine(16, 0, 8, 1, shade(base, 1.18))

  if (variant === 2) {
    // Accent inlay — a glowing inset diamond.
    pc.poly([[16, 4], [24, 8], [16, 12], [8, 8]], mix(base, f.accent, 0.35))
    pc.poly([[16, 6], [20, 8], [16, 10], [12, 8]], mix(base, f.accent, 0.8))
  } else if (variant === 3) {
    // Light strip along the tile's long axis (aisles, runways).
    pc.isoLine(8, 4, 8, 1, mix(base, f.accent, 0.55))
  } else if (variant === 4) {
    // Circuit trace.
    pc.isoLine(4, 8, 4, 1, mix(base, f.accent, 0.6))
    pc.rect(12, 11, 2, 1, mix(base, f.accent, 0.6))
    pc.px(14, 11, f.accent)
  } else if (variant === 5) {
    // Hazard chevrons.
    for (let i = 0; i < 4; i++) pc.isoLine(6 + i * 5, 6 + i * 0, 2, 1, mix(base, f.accent, 0.6))
  }
  return pc
}

/** The slab side faces that give each island its floating thickness. */
function slabSide(kind: CellKind, side: 'l' | 'r') {
  const f = FLOORS[kind]
  const D = SLAB_DEPTH
  const pc = new PixelCanvas(32, 16 + D)
  const face: Pt[] = side === 'l' ? [[0, 8], [16, 16], [16, 16 + D], [0, 8 + D]] : [[16, 16], [32, 8], [32, 8 + D], [16, 16 + D]]
  const body = side === 'l' ? PAL.navy800 : PAL.navy900
  pc.poly(face, body)
  // Horizontal strata, darkening with depth.
  for (let d = 3; d < D; d += 4) {
    const c = shade(body, 0.8)
    if (side === 'l') pc.isoLine(0, 8 + d, 8, 1, c)
    else pc.isoLine(31, 8 + d, 8, -1, c)
  }
  // Neon rim along the top edge.
  if (side === 'l') {
    pc.isoLine(0, 8, 8, 1, f.rim)
    pc.isoLine(0, 9, 8, 1, f.rim, 0.35)
  } else {
    pc.isoLine(31, 8, 8, -1, f.rim)
    pc.isoLine(31, 9, 8, -1, f.rim, 0.35)
  }
  return pc
}

// ---------------------------------------------------------------------------
// Walls (back edges of themed zones)
// ---------------------------------------------------------------------------

function wall(kind: CellKind, axis: 'a' | 'b', variant: number) {
  const f = FLOORS[kind]
  const H = 30
  const a = axis === 'a' ? 1 : 0.25
  const b = axis === 'a' ? 0.25 : 1
  const { pc, O } = footprintCanvas(a, b, H)
  const faceCol = mix(PAL.navy800, f.base, 0.4)
  const pts = box(pc, O, 0, 0, 0, a, b, H, {
    top: PAL.navy500,
    left: axis === 'a' ? faceCol : PAL.navy950,
    right: axis === 'b' ? shade(faceCol, 0.9) : PAL.navy950,
  })
  // Decorate the face that looks into the room.
  if (axis === 'a') {
    const [lx, ly] = pts.L
    pc.isoLine(lx, ly + 3, 8, 1, f.accent)
    pc.isoLine(lx, ly + 4, 8, 1, f.accent, 0.3)
    if (variant === 1) {
      for (let row = 0; row < 12; row++) pc.isoLine(lx + 3, ly + 10 + row, 5, 1, mix(faceCol, f.accent, row % 3 === 0 ? 0.35 : 0.18))
    } else {
      pc.isoLine(lx, ly + H - 3, 8, 1, shade(faceCol, 0.75))
    }
  } else {
    const [bx, by] = pts.B
    pc.isoLine(bx + 16 * 0.25, by + 3 - 2, 8, -1, f.accent)
    pc.isoLine(bx + 16 * 0.25, by + 4 - 2, 8, -1, f.accent, 0.3)
    if (variant === 1) {
      for (let row = 0; row < 12; row++) pc.isoLine(bx + 16 * 0.25 - 4, by + 8 + row - 2, 5, -1, mix(faceCol, f.accent, row % 3 === 0 ? 0.35 : 0.18))
    }
  }
  return { pc, anchor: [O[0], O[1]] as [number, number] }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

function workstation() {
  const { pc, O } = footprintCanvas(2, 2, 40)
  pedestal(pc, O, 2, 2, PAL.blue)
  // Desk.
  box(pc, O, 0.35, 0.45, 5, 1.3, 0.85, 10, { top: 0x3a4a7a, left: 0x1d2850, right: 0x26335f, rim: 0x5d73b0 })
  // Chair.
  box(pc, O, 1.25, 1.35, 5, 0.45, 0.45, 5, { top: 0x2b3a6b, left: 0x151d3c, right: 0x1c2649 })
  box(pc, O, 1.62, 1.35, 10, 0.12, 0.45, 7, { top: 0x2b3a6b, left: 0x151d3c, right: 0x1c2649 })
  // Two monitors on the desk.
  const [cx, cy] = gp(O, 1.0, 0.85, 15)
  const mon = (x: number, y: number, content: 'office' | 'code') => {
    pc.rect(x, y, 15, 11, PAL.outline)
    pc.rect(x + 1, y + 1, 13, 9, 0x0f1d3c)
    if (content === 'office') {
      pc.rect(x + 2, y + 2, 5, 3, 0x2a6fb0)
      pc.rect(x + 8, y + 2, 5, 3, 0x2d8f86)
      pc.rect(x + 2, y + 6, 4, 3, 0x6045a8)
      pc.rect(x + 7, y + 6, 6, 3, 0x2a6fb0)
      pc.px(x + 4, y + 3, PAL.white)
      pc.px(x + 10, y + 3, PAL.amber)
      pc.px(x + 9, y + 7, PAL.white)
      pc.px(x + 3, y + 7, PAL.green)
    } else {
      const cols = [PAL.cyan, PAL.purple, PAL.amber, PAL.cyan, PAL.white]
      cols.forEach((c, i) => pc.rect(x + 2 + (i % 2) * 2, y + 2 + i * 1.6, 5 + ((i * 3) % 5), 1, c))
    }
    pc.rect(x + 6, y + 11, 3, 2, PAL.outline)
  }
  mon(cx - 16, cy - 13, 'office')
  mon(cx + 1, cy - 13, 'code')
  // Keyboard.
  pc.poly([gp(O, 1.05, 0.9, 15), gp(O, 1.45, 0.9, 15), gp(O, 1.45, 1.1, 15), gp(O, 1.05, 1.1, 15)], 0x8ea2d8)
  return { pc, anchor: O }
}

function kiosk() {
  const { pc, O } = footprintCanvas(2, 2, 40)
  pedestal(pc, O, 2, 2, PAL.gold)
  const body = box(pc, O, 0.55, 0.55, 5, 0.9, 0.9, 28, { top: 0x2b3a6b, left: 0x141c3a, right: 0x1b264b, rim: PAL.gold })
  // Gold trim bands.
  for (const d of [6, 24]) {
    pc.isoLine(body.L[0], body.L[1] + d, 7, 1, shade(PAL.gold, 0.8))
    pc.isoLine(body.R[0] - 1, body.R[1] + d, 7, -1, shade(PAL.gold, 0.7))
  }
  // Screen on the front-left face.
  const [lx, ly] = body.L
  pc.poly([[lx + 2, ly + 9], [lx + 13, ly + 14.5], [lx + 13, ly + 23.5], [lx + 2, ly + 18]], 0x103457)
  pc.isoLine(lx + 4, ly + 12, 4, 1, PAL.gold)
  pc.isoLine(lx + 4, ly + 15, 3, 1, PAL.cyan)
  pc.isoLine(lx + 4, ly + 17, 4, 1, PAL.blue, 0.8)
  // Side screen glow on the right face.
  const [bx, by] = body.B
  pc.poly([[bx + 2, by + 4], [bx + 12, by - 1], [bx + 12, by + 7], [bx + 2, by + 12]], 0x1d2f58)
  return { pc, anchor: O }
}

function phone() {
  const { pc, O } = footprintCanvas(2, 2, 52)
  pedestal(pc, O, 2, 2, PAL.pink)
  const [cx, by] = gp(O, 1, 1, 5)
  const w = 24
  const h = 44
  const x = cx - w / 2
  const y = by - h
  // Depth sliver then body.
  pc.rect(x + 3, y + 2, w, h, 0x05070f)
  pc.rect(x, y, w, h, 0x0b0e1a)
  pc.rect(x, y, w, 1, 0x3a4a7a)
  pc.rect(x, y, 1, h, 0x3a4a7a)
  // Screen.
  const sx = x + 2
  const sy = y + 3
  pc.rect(sx, sy, 20, 37, 0x111a33)
  pc.rect(x + 9, y + 1, 6, 1, PAL.navy600)
  pc.rect(sx, sy, 20, 6, 0x1a2550)
  pc.rect(sx + 2, sy + 2, 8, 2, PAL.white)
  pc.rect(sx + 15, sy + 2, 3, 2, PAL.pink)
  const cards = [PAL.cyan, PAL.pink, PAL.amber, PAL.purple, PAL.green, PAL.blue]
  cards.forEach((c, i) => {
    const cxp = sx + 2 + (i % 2) * 9
    const cyp = sy + 8 + Math.floor(i / 2) * 9
    pc.rect(cxp, cyp, 7, 7, 0x1b2648)
    pc.rect(cxp + 1, cyp + 1, 3, 3, c)
    pc.rect(cxp + 1, cyp + 5, 5, 1, PAL.steel)
  })
  pc.rect(sx, sy + 34, 20, 3, 0x1a2550)
  for (let i = 0; i < 3; i++) pc.rect(sx + 3 + i * 6, sy + 35, 2, 1, i === 0 ? PAL.pink : PAL.steel)
  return { pc, anchor: O }
}

function idTerminal() {
  const { pc, O } = footprintCanvas(2, 2, 30)
  pedestal(pc, O, 2, 2, PAL.cyan)
  const post = box(pc, O, 0.7, 0.7, 5, 0.6, 0.6, 16, { top: 0x2b3a6b, left: 0x141c3a, right: 0x1b264b, rim: PAL.cyan })
  // Scanner glow on top.
  pc.poly([post.T, post.R, post.B, post.L].map(([x, y]) => [x, y + 1] as Pt), mix(0x2b3a6b, PAL.cyan, 0.6))
  pc.isoLine(post.L[0] + 2, post.L[1] + 5, 3, 1, PAL.cyan)
  return { pc, anchor: O }
}

function idCard() {
  const pc = new PixelCanvas(28, 18)
  pc.rect(0, 0, 28, 18, 0x0c2a38)
  pc.rect(0, 0, 28, 1, PAL.cyan)
  pc.rect(0, 17, 28, 1, PAL.cyan)
  pc.rect(0, 0, 1, 18, PAL.cyan)
  pc.rect(27, 0, 1, 18, PAL.cyan)
  // Portrait.
  pc.rect(3, 3, 7, 8, 0x1d4a5c)
  pc.rect(4, 4, 5, 2, 0x2a1c18)
  pc.rect(4, 6, 5, 3, 0xd9a07b)
  pc.rect(3, 9, 7, 2, 0x1aa79c)
  pc.rect(3, 13, 8, 1, PAL.ice)
  pc.rect(3, 15, 6, 1, PAL.cyanSoft)
  // QR code with three finder squares.
  const qx = 14
  const qy = 3
  pc.rect(qx, qy, 11, 11, PAL.ice)
  for (let y = 0; y < 11; y++) for (let x = 0; x < 11; x++) if (hash(x, y, 3) > 0.55) pc.px(qx + x, qy + y, 0x0c2a38)
  for (const [fx, fy] of [[0, 0], [7, 0], [0, 7]] as const) {
    pc.rect(qx + fx, qy + fy, 4, 4, 0x0c2a38)
    pc.rect(qx + fx + 1, qy + fy + 1, 2, 2, PAL.ice)
  }
  return pc
}

function archive() {
  const { pc, O } = footprintCanvas(2, 1, 40)
  const body = box(pc, O, 0, 0, 0, 2, 0.8, 38, { top: PAL.navy600, left: PAL.navy900, right: PAL.navy950, rim: PAL.blue })
  const [lx, ly] = body.L
  // Glowing drive bays on the front-left face.
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 4; col++) {
      const n = hash(row, col, 11)
      const c = n > 0.66 ? PAL.cyan : n > 0.33 ? PAL.blue : PAL.purple
      pc.isoLine(lx + 2 + col * 8, ly + 5 + row * 5 + col * 4, 3, 1, mix(PAL.navy700, c, 0.75))
    }
  }
  return { pc, anchor: O }
}

function workbench() {
  const { pc, O } = footprintCanvas(2, 1, 22)
  box(pc, O, 0.1, 0.1, 0, 1.8, 0.8, 10, { top: 0x4a4d6c, left: 0x24263e, right: 0x2e3150, rim: PAL.amber })
  box(pc, O, 0.3, 0.25, 10, 0.4, 0.35, 5, { top: PAL.amber, left: shade(PAL.amber, 0.55), right: shade(PAL.amber, 0.7) })
  box(pc, O, 1.25, 0.2, 10, 0.35, 0.35, 3, { top: PAL.steel, left: PAL.navy700, right: PAL.navy600 })
  // Vertical holo projector emitter.
  const [ex, ey] = gp(O, 1, 0.5, 10)
  pc.rect(ex - 2, ey - 2, 4, 2, PAL.navy500)
  pc.rect(ex - 1, ey - 3, 2, 1, PAL.ice)
  return { pc, anchor: O }
}

const GLYPHS: Record<string, string[]> = {
  frontend: ['..#......#..', '.#........#.', '#....##....#', '.#..#..#..#.', '..#......#..'],
  architecture: ['.##.....##..', '.##.....##..', '...#...#....', '....###.....', '....###.....', '.....#......'],
  mobile: ['...######...', '...#....#...', '...#....#...', '...#....#...', '...#.##.#...', '...######...'],
  backend: ['..########..', '.#........#.', '..########..', '.#........#.', '..########..'],
  creative: ['..########..', '.#.#....##.#', '#.###..#..##', '.#.#....##.#', '..########..'],
}

function holoPanel(id: string, color: number) {
  const pc = new PixelCanvas(22, 14)
  pc.rect(0, 0, 22, 14, mix(PAL.navy900, color, 0.18), 0.85)
  pc.rect(0, 0, 22, 1, color)
  pc.rect(0, 13, 22, 1, color, 0.6)
  const rows = GLYPHS[id] ?? []
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) if (row[x] === '#') pc.px(5 + x, 3 + y + (6 - rows.length) / 2, color)
  })
  return pc
}

function robotFrames() {
  const pc = new PixelCanvas(48, 30)
  for (let f = 0; f < 2; f++) {
    const fr = new PixelCanvas(24, 30)
    const r = (x: number, y: number, w: number, h: number, c: number, a = 1) => fr.rect(x, y, w, h, c, a)
    r(11, 0, 2, 2, PAL.purple)
    r(11, 2, 2, 2, PAL.steel)
    r(5, 4, 14, 10, 0xdde6ff)
    r(5, 12, 14, 2, 0xa8b4d8)
    r(7, 6, 10, 5, 0x10142a)
    if (f === 0) {
      r(9, 7, 2, 2, PAL.cyan)
      r(13, 7, 2, 2, PAL.cyan)
    } else {
      r(9, 8, 2, 1, PAL.cyan)
      r(13, 8, 2, 1, PAL.cyan)
    }
    r(7, 15, 10, 8, 0xc9d3f0)
    r(7, 21, 10, 2, 0x9aa6cc)
    r(11, 17, 2, 2, PAL.purple)
    r(8, 17, 2, 1, PAL.steel)
    r(4, 16, 2, 6, 0xa8b4d8)
    r(18, 16, 2, 6, 0xa8b4d8)
    r(9, 23, 6, 2, PAL.navy600)
    fr.outline(PAL.outline)
    r(10, 26, 4, 1, PAL.cyan, 0.9)
    r(11, 27, 2, 2, PAL.cyan, 0.5)
    pc.blit(fr, f * 24, 0)
  }
  return pc
}

function drone() {
  const pc = new PixelCanvas(16, 14)
  pc.rect(2, 1, 12, 1, PAL.steel)
  pc.rect(7, 2, 2, 2, PAL.steel)
  pc.ellipse(8, 8, 5, 4, 0xdde6ff)
  pc.rect(3, 9, 10, 2, 0xa8b4d8)
  pc.rect(5, 6, 6, 3, 0x10142a)
  pc.rect(7, 7, 2, 1, PAL.cyan)
  pc.outline(PAL.outline)
  return pc
}

function coreBase(accent: number, body: number) {
  const { pc, O } = footprintCanvas(2, 2, 14)
  pedestal(pc, O, 2, 2, accent)
  const ring = box(pc, O, 0.45, 0.45, 5, 1.1, 1.1, 6, { top: body, left: shade(body, 0.5), right: shade(body, 0.68), rim: accent })
  pc.poly([ring.T, ring.R, ring.B, ring.L].map(([x, y], i) => [x + (i === 1 ? -4 : i === 3 ? 4 : 0), y + (i === 0 ? 2 : i === 2 ? -2 : 0)] as Pt), mix(body, accent, 0.55))
  return { pc, anchor: O }
}

/** A flush floor projector — walkable, so the plaza's centre stays an open crossroads. */
function holoPad() {
  const { pc, O } = footprintCanvas(2, 2, 3)
  const plate = box(pc, O, 0.1, 0.1, 0, 1.8, 1.8, 2, { top: 0x163a4a, left: PAL.navy900, right: PAL.navy800, rim: PAL.cyan })
  const ring = (inset: number, color: number, alpha: number) => {
    const [tx, ty] = plate.T
    const s = 1.8 - inset * 2
    pc.poly([
      [tx, ty + inset * 16],
      [tx + 16 * s, ty + inset * 16 + 8 * s],
      [tx, ty + inset * 16 + 16 * s],
      [tx - 16 * s, ty + inset * 16 + 8 * s],
    ], color, alpha)
  }
  ring(0.2, mix(0x163a4a, PAL.cyan, 0.35), 1)
  ring(0.35, 0x0f2a36, 1)
  ring(0.5, mix(0x163a4a, PAL.cyan, 0.7), 1)
  ring(0.62, PAL.ice, 0.9)
  return { pc, anchor: O }
}

function gem() {
  const pc = new PixelCanvas(12, 18)
  pc.poly([[6, 0], [12, 7], [6, 18], [0, 7]], PAL.cyanSoft)
  pc.poly([[6, 0], [6, 18], [0, 7]], PAL.cyan)
  pc.poly([[6, 1], [9, 7], [6, 7]], PAL.ice)
  return pc
}

function orb() {
  const pc = new PixelCanvas(16, 16)
  pc.ellipse(8, 8, 7, 7, PAL.purpleDeep)
  pc.ellipse(8, 8, 5.5, 5.5, PAL.purple)
  pc.ellipse(7, 7, 3, 3, 0xd7b8ff)
  pc.ellipse(6, 6, 1.2, 1.2, PAL.white)
  return pc
}

function aiStand() {
  const { pc, O } = footprintCanvas(1, 1, 24)
  box(pc, O, 0.25, 0.25, 0, 0.5, 0.5, 3, { top: PAL.navy600, left: PAL.navy900, right: PAL.navy800, rim: PAL.purple })
  const [cx, cy] = gp(O, 0.5, 0.5, 3)
  pc.rect(cx - 1, cy - 18, 2, 18, PAL.navy500)
  pc.rect(cx - 1, cy - 18, 1, 18, PAL.steel)
  return { pc, anchor: O }
}

function aiPanel() {
  const pc = new PixelCanvas(24, 16)
  pc.rect(0, 0, 24, 16, 0x1d1240, 0.85)
  pc.rect(0, 0, 24, 1, PAL.purple)
  pc.rect(0, 15, 24, 1, PAL.purple, 0.5)
  pc.rect(2, 3, 9, 1, PAL.ice)
  for (let i = 0; i < 4; i++) pc.rect(2, 6 + i * 2, 5 + ((i * 7) % 11), 1, i % 2 ? PAL.purple : PAL.cyan, 0.9)
  // Mini node graph.
  pc.px(17, 4, PAL.cyan)
  pc.px(20, 8, PAL.purple)
  pc.px(16, 11, PAL.cyan)
  pc.line(17, 4, 20, 8, PAL.steel)
  pc.line(20, 8, 16, 11, PAL.steel)
  return pc
}

function rack() {
  const { pc, O } = footprintCanvas(1, 1, 34)
  const b = box(pc, O, 0.1, 0.1, 0, 0.8, 0.8, 32, { top: PAL.navy600, left: PAL.navy900, right: PAL.navy950, rim: PAL.purple })
  for (let row = 0; row < 7; row++) {
    pc.isoLine(b.L[0] + 2, b.L[1] + 4 + row * 4, 4, 1, PAL.navy700)
    const n = hash(row, 5, 2)
    pc.px(b.L[0] + 3 + (row % 3) * 3, b.L[1] + 5 + row * 4 + (row % 3) * 1, n > 0.5 ? PAL.cyan : PAL.purple)
  }
  return { pc, anchor: O }
}

function commTerminal() {
  const { pc, O } = footprintCanvas(2, 2, 34)
  pedestal(pc, O, 2, 2, PAL.green)
  box(pc, O, 0.35, 0.5, 5, 1.3, 0.9, 12, { top: 0x2b3a6b, left: 0x141c3a, right: 0x1b264b, rim: PAL.green })
  // Angled screen.
  const [sx, sy] = gp(O, 0.9, 0.75, 17)
  pc.rect(sx - 13, sy - 15, 26, 15, PAL.outline)
  pc.rect(sx - 12, sy - 14, 24, 13, 0x0d2a2a)
  pc.rect(sx - 10, sy - 12, 10, 1, PAL.green)
  for (let i = 0; i < 4; i++) pc.rect(sx - 10, sy - 9 + i * 2, 6 + ((i * 5) % 12), 1, i === 3 ? PAL.white : PAL.cyanSoft)
  // Envelope icon.
  pc.rect(sx + 3, sy - 11, 7, 5, PAL.green)
  pc.line(sx + 3, sy - 11, sx + 6, sy - 8, 0x0d2a2a)
  pc.line(sx + 9, sy - 11, sx + 6, sy - 8, 0x0d2a2a)
  pc.poly([gp(O, 1.0, 1.0, 17), gp(O, 1.5, 1.0, 17), gp(O, 1.5, 1.25, 17), gp(O, 1.0, 1.25, 17)], 0x8ea2d8)
  return { pc, anchor: O }
}

function antenna() {
  const { pc, O } = footprintCanvas(1, 1, 70)
  box(pc, O, 0.2, 0.2, 0, 0.6, 0.6, 4, { top: PAL.navy600, left: PAL.navy900, right: PAL.navy800, rim: PAL.green })
  const [cx, cy] = gp(O, 0.5, 0.5, 4)
  const top = cy - 58
  pc.line(cx - 6, cy, cx - 1, top, PAL.steel)
  pc.line(cx + 6, cy, cx + 1, top, PAL.navy500)
  for (let y = cy - 6; y > top + 4; y -= 8) {
    const t = (cy - y) / (cy - top)
    const half = Math.round(6 * (1 - t))
    pc.line(cx - half, y, cx + half, y - 8, PAL.navy500)
  }
  // Dish.
  pc.ellipse(cx + 4, top + 14, 6, 4, 0xc9d3f0)
  pc.ellipse(cx + 5, top + 14, 4, 2.6, 0x8e9ac4)
  pc.rect(cx, top + 13, 4, 1, PAL.steel)
  pc.rect(cx - 1, top - 2, 2, 3, PAL.green)
  return { pc, anchor: O, light: [cx - O[0], top - 1 - O[1]] as [number, number] }
}

function lamp() {
  const { pc, O } = footprintCanvas(1, 1, 34)
  const [cx, cy] = gp(O, 0.5, 0.5, 0)
  pc.ellipse(cx, cy, 3, 1.5, PAL.navy700)
  pc.rect(cx - 1, cy - 28, 2, 28, 0x2c3a66)
  pc.rect(cx - 1, cy - 28, 1, 28, PAL.navy500)
  pc.rect(cx - 3, cy - 31, 6, 3, 0x2c3a66)
  pc.rect(cx - 2, cy - 30, 4, 2, PAL.warm)
  return { pc, anchor: O, light: [cx - O[0], cy - 30 - O[1]] as [number, number] }
}

function tree(variant: number) {
  const { pc, O } = footprintCanvas(1, 1, 46)
  box(pc, O, 0.15, 0.15, 0, 0.7, 0.7, 7, { top: 0x3b2b2a, left: PAL.navy900, right: PAL.navy800, rim: PAL.cyanSoft })
  const [cx, cy] = gp(O, 0.5, 0.5, 7)
  pc.rect(cx - 1, cy - 10, 2, 10, 0x4a3530)
  const dark = variant ? 0x3a2a63 : 0x15584f
  const mid = variant ? 0x6447a8 : 0x1f8a74
  const light = variant ? 0xb08cff : 0x5fe0b8
  pc.ellipse(cx, cy - 22, 11, 11, dark)
  pc.ellipse(cx - 5, cy - 17, 6, 5, dark)
  pc.ellipse(cx + 5, cy - 16, 6, 5, dark)
  pc.ellipse(cx - 1, cy - 24, 9, 8, mid)
  pc.ellipse(cx - 4, cy - 27, 4, 3, light)
  for (let i = 0; i < 9; i++) {
    const x = cx - 8 + Math.floor(hash(i, variant, 4) * 16)
    const y = cy - 30 + Math.floor(hash(variant, i, 9) * 14)
    if (pc.alphaAt(x, y)) pc.px(x, y, variant ? PAL.cyan : PAL.pink)
  }
  pc.outline(PAL.outline)
  return { pc, anchor: O }
}

function bench() {
  const { pc, O } = footprintCanvas(1, 1, 14)
  box(pc, O, 0.05, 0.35, 0, 0.9, 0.35, 5, { top: 0x8a6248, left: 0x4a3330, right: 0x5f4238 })
  box(pc, O, 0.05, 0.3, 5, 0.9, 0.08, 6, { top: 0x8a6248, left: 0x4a3330, right: 0x5f4238 })
  return { pc, anchor: O }
}

function crate() {
  const { pc, O } = footprintCanvas(1, 1, 12)
  const b = box(pc, O, 0.2, 0.2, 0, 0.6, 0.6, 9, { top: 0x5a5d7c, left: 0x2c2e48, right: 0x383b5a, rim: PAL.amber })
  pc.isoLine(b.L[0] + 1, b.L[1] + 4, 4, 1, PAL.amber)
  return { pc, anchor: O }
}

function welcomeSign() {
  const W = 104
  const pc = new PixelCanvas(W, 50)
  // Posts.
  for (const x of [10, W - 12]) {
    pc.rect(x, 24, 3, 26, 0x2c3a66)
    pc.rect(x, 24, 1, 26, PAL.navy500)
  }
  pc.rect(0, 0, W, 30, PAL.cyan)
  pc.rect(1, 1, W - 2, 28, PAL.navy950)
  pc.rect(3, 3, W - 6, 24, PAL.navy900)
  for (let y = 4; y < 26; y += 3) pc.rect(4, y, W - 8, 1, PAL.navy800)
  for (const [x, y] of [[3, 3], [W - 4, 3], [3, 26], [W - 4, 26]] as const) pc.px(x, y, PAL.cyan)
  return { pc, anchor: [W / 2, 49] as [number, number] }
}

function portalFrame() {
  const pc = new PixelCanvas(36, 46)
  const c = 18
  pc.ellipse(c, 16, 16, 16, PAL.navy600)
  pc.ellipse(c, 16, 12, 13, 0)
  pc.rect(2, 16, 6, 30, PAL.navy600)
  pc.rect(28, 16, 6, 30, PAL.navy600)
  // Clear the inner opening fully.
  for (let y = 0; y < 46; y++) {
    for (let x = 0; x < 36; x++) {
      const nx = (x + 0.5 - c) / 11.5
      const ny = (y + 0.5 - 16) / 12.5
      if ((nx * nx + ny * ny <= 1 || (x >= 8 && x < 28 && y >= 16)) && pc.alphaAt(x, y)) {
        const i = (y * 36 + x) * 4
        pc.data[i + 3] = 0
      }
    }
  }
  pc.rect(2, 16, 1, 30, PAL.cyan)
  pc.rect(33, 16, 1, 30, PAL.purple)
  pc.rect(0, 43, 36, 3, PAL.navy700)
  pc.outline(PAL.outline)
  return { pc, anchor: [18, 45] as [number, number] }
}

function portalCore() {
  const pc = new PixelCanvas(22, 32)
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 22; x++) {
      const nx = (x + 0.5 - 11) / 11
      const ny = (y + 0.5 - 14) / 14
      const inArch = nx * nx + ny * ny <= 1 || (y >= 14 && Math.abs(nx) <= 1)
      if (!inArch) continue
      const t = y / 32
      const swirl = hash(x >> 1, y >> 1, 5)
      const col = mix(PAL.cyan, PAL.purple, t)
      pc.px(x, y, swirl > 0.75 ? PAL.ice : col, 0.55 + swirl * 0.3)
    }
  }
  return pc
}

// ---------------------------------------------------------------------------
// Effects
// ---------------------------------------------------------------------------

function radialGlow(scene: Phaser.Scene) {
  const size = 64
  const tex = scene.textures.createCanvas('glow', size, size)
  if (!tex) return
  const g = tex.context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.35, 'rgba(255,255,255,0.45)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  tex.context.fillStyle = g
  tex.context.fillRect(0, 0, size, size)
  tex.refresh()
  tex.setFilter(Phaser.Textures.FilterMode.LINEAR)
}

function floorRing() {
  const pc = new PixelCanvas(48, 24)
  for (let y = 0; y < 24; y++) {
    for (let x = 0; x < 48; x++) {
      const nx = (x + 0.5 - 24) / 24
      const ny = (y + 0.5 - 12) / 12
      const d = nx * nx + ny * ny
      if (d <= 1 && d >= 0.72) pc.px(x, y, 0xffffff)
      else if (d < 0.72) pc.px(x, y, 0xffffff, 0.12)
    }
  }
  return pc
}

function stars() {
  const S = 256
  const pc = new PixelCanvas(S, S)
  for (let i = 0; i < 140; i++) {
    const x = Math.floor(hash(i, 1, 21) * S)
    const y = Math.floor(hash(i, 2, 21) * S)
    const n = hash(i, 3, 21)
    const c = n > 0.85 ? PAL.cyan : n > 0.7 ? PAL.purple : PAL.white
    pc.px(x, y, c, 0.25 + hash(i, 4, 21) * 0.6)
    if (n > 0.96) {
      pc.px(x - 1, y, c, 0.3)
      pc.px(x + 1, y, c, 0.3)
      pc.px(x, y - 1, c, 0.3)
      pc.px(x, y + 1, c, 0.3)
    }
  }
  return pc
}

// ---------------------------------------------------------------------------

export const FLOOR_KINDS: CellKind[] = ['plaza', 'projects', 'skills', 'ai', 'contact', 'bridge']

export function generateTextures(scene: Phaser.Scene) {
  for (const kind of FLOOR_KINDS) {
    for (let v = 0; v <= 5; v++) save(scene, `floor-${kind}-${v}`, floorTile(kind, v))
    save(scene, `side-l-${kind}`, slabSide(kind, 'l'))
    save(scene, `side-r-${kind}`, slabSide(kind, 'r'))
    for (const axis of ['a', 'b'] as const) {
      for (let v = 0; v < 2; v++) {
        const w = wall(kind, axis, v)
        save(scene, `wall-${axis}-${kind}-${v}`, w.pc, { anchor: w.anchor })
      }
    }
  }

  const props: Record<string, () => { pc: PixelCanvas; anchor: Pt | [number, number]; light?: [number, number] }> = {
    workstation,
    kiosk,
    phone,
    'id-terminal': idTerminal,
    archive,
    workbench,
    'core-base': () => coreBase(PAL.purple, 0x2a1f50),
    'holo-pad': holoPad,
    'ai-stand': aiStand,
    rack,
    'comm-terminal': commTerminal,
    antenna,
    lamp,
    'tree-0': () => tree(0),
    'tree-1': () => tree(1),
    bench,
    crate,
    'welcome-sign': welcomeSign,
    'portal-frame': portalFrame,
  }
  for (const [key, make] of Object.entries(props)) {
    const art = make()
    save(scene, key, art.pc, { anchor: [art.anchor[0], art.anchor[1]], light: art.light })
  }

  save(scene, 'id-card', idCard())
  save(scene, 'orb', orb())
  save(scene, 'gem', gem())
  save(scene, 'ai-panel', aiPanel())
  save(scene, 'drone', drone())
  save(scene, 'portal-core', portalCore())
  save(scene, 'ring', floorRing())
  save(scene, 'stars', stars())
  const globe = new PixelCanvas(14, 14)
  globe.ellipse(7, 7, 6.5, 6.5, 0x1d6fa8)
  globe.ellipse(7, 7, 6.5, 2, 0x2a8fd0)
  globe.rect(3, 4, 4, 3, 0x3fbf8a)
  globe.rect(8, 8, 3, 2, 0x3fbf8a)
  globe.rect(6, 0, 1, 14, PAL.gold, 0.7)
  globe.outline(PAL.outline)
  save(scene, 'globe', globe)

  const mote = new PixelCanvas(2, 2)
  mote.rect(0, 0, 2, 2, 0xffffff)
  save(scene, 'mote', mote)

  const shadow = new PixelCanvas(14, 6)
  shadow.ellipse(7, 3, 7, 3, 0x000000, 0.45)
  save(scene, 'shadow', shadow)

  const robot = save(scene, 'robot', robotFrames())
  robot?.add('robot-0', 0, 0, 0, 24, 30)
  robot?.add('robot-1', 0, 24, 0, 24, 30)

  const ids = Object.keys(GLYPHS)
  const colors = [PAL.cyan, PAL.blue, PAL.pink, PAL.green, PAL.amber]
  ids.forEach((id, i) => save(scene, `holo-${id}`, holoPanel(id, colors[i]!)))

  radialGlow(scene)
}

export function anchorOf(scene: Phaser.Scene, key: string) {
  const tex = scene.textures.get(key)
  const src = tex.getSourceImage() as HTMLCanvasElement
  const meta = tex.customData as Partial<Anchor>
  const [ax, ay] = meta.anchor ?? [src.width / 2, src.height]
  return { ox: ax / src.width, oy: ay / src.height, light: meta.light, w: src.width, h: src.height }
}
