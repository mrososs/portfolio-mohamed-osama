import type { ZoneId } from './bridge'

/**
 * World geometry. The map is an isometric grid (2:1 diamonds) of floating
 * islands: a central plaza with four themed zones placed at the screen's
 * compass points, joined by bridges.
 *
 *            Projects Hall (N)
 *   AI Lab (W)   Plaza    Skills Workshop (E)
 *            Contact Station (S)
 */

export const TILE_W = 32
export const TILE_H = 16
const HW = TILE_W / 2
const HH = TILE_H / 2

/** Top corner of grid cell (gx, gy) in world pixels. Fractional input → any point. */
export function toWorld(gx: number, gy: number) {
  return { x: (gx - gy) * HW, y: (gx + gy) * HH }
}

/** Inverse of toWorld — continuous grid coordinates of a world point. */
export function toGrid(x: number, y: number) {
  return { gx: (x / HW + y / HH) / 2, gy: (y / HH - x / HW) / 2 }
}

/** Centre of a cell in world pixels. */
export function cellCenter(gx: number, gy: number) {
  return toWorld(gx + 0.5, gy + 0.5)
}

export interface ZoneDef {
  id: ZoneId
  name: string
  cx: number
  cy: number
  /** Half-width in cells — the zone spans cx-half..cx+half. */
  half: number
  /** Accent colour used for lights, rims and HUD. */
  accent: number
}

export const ZONES: Record<ZoneId, ZoneDef> = {
  plaza: { id: 'plaza', name: 'Welcome Plaza', cx: 32, cy: 32, half: 6, accent: 0x5ef2e2 },
  projects: { id: 'projects', name: 'Projects Hall', cx: 16, cy: 16, half: 7, accent: 0x55c8ff },
  skills: { id: 'skills', name: 'Skills Workshop', cx: 48, cy: 16, half: 6, accent: 0xffb547 },
  ai: { id: 'ai', name: 'AI Laboratory', cx: 16, cy: 48, half: 6, accent: 0xb07cff },
  contact: { id: 'contact', name: 'Contact Station', cx: 48, cy: 48, half: 6, accent: 0x4dffa6 },
}

export const ZONE_ORDER: ZoneId[] = ['plaza', 'projects', 'skills', 'ai', 'contact']

export type CellKind = ZoneId | 'bridge'

export interface MapData {
  cells: Map<string, CellKind>
  blocked: Set<string>
}

export const key = (gx: number, gy: number) => `${gx},${gy}`

/** Bridges run tip-to-tip from the plaza to each zone. */
const BRIDGES: { from: [number, number]; dir: [number, number]; len: number }[] = [
  { from: [26, 26], dir: [-1, -1], len: 5 }, // → Projects (north)
  { from: [38, 26], dir: [1, -1], len: 5 }, // → Skills (east)
  { from: [26, 38], dir: [-1, 1], len: 5 }, // → AI Lab (west)
  { from: [38, 38], dir: [1, 1], len: 5 }, // → Contact (south)
]

export function buildMap(): MapData {
  const cells = new Map<string, CellKind>()
  for (const zone of Object.values(ZONES)) {
    for (let gx = zone.cx - zone.half; gx <= zone.cx + zone.half; gx++) {
      for (let gy = zone.cy - zone.half; gy <= zone.cy + zone.half; gy++) {
        cells.set(key(gx, gy), zone.id)
      }
    }
  }
  for (const b of BRIDGES) {
    // Perpendicular offsets widen the bridge to three cells.
    const perp: [number, number][] =
      b.dir[0] === b.dir[1] ? [[0, 0], [1, 0], [0, 1]] : [[0, 0], [1, 0], [-1, 0]]
    for (let t = 0; t <= b.len; t++) {
      for (const [ox, oy] of perp) {
        const gx = b.from[0] + b.dir[0] * t + ox
        const gy = b.from[1] + b.dir[1] * t + oy
        const k = key(gx, gy)
        if (!cells.has(k)) cells.set(k, 'bridge')
      }
    }
  }
  return { cells, blocked: new Set() }
}

export function zoneAt(map: MapData, gx: number, gy: number): CellKind | undefined {
  return map.cells.get(key(Math.floor(gx), Math.floor(gy)))
}
