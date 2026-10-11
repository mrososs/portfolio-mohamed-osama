import type Phaser from 'phaser'

export type Pt = [number, number]

/** Multiplies each RGB channel — f < 1 darkens, f > 1 lightens. */
export function shade(color: number, f: number) {
  const r = Math.min(255, Math.round(((color >> 16) & 255) * f))
  const g = Math.min(255, Math.round(((color >> 8) & 255) * f))
  const b = Math.min(255, Math.round((color & 255) * f))
  return (r << 16) | (g << 8) | b
}

export function mix(a: number, b: number, t: number) {
  const ch = (s: number) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t)
  return (ch(16) << 16) | (ch(8) << 8) | ch(0)
}

/** Deterministic hash noise in [0, 1) — keeps procedural art identical every load. */
export function hash(x: number, y: number, seed = 0) {
  let h = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

/**
 * A tiny software pixel canvas. Shapes are rasterised by pixel-centre
 * inclusion, which gives clean 2:1 isometric staircase edges with no
 * anti-aliasing — the whole world shares one pixel density.
 */
export class PixelCanvas {
  readonly data: Uint8ClampedArray

  constructor(
    readonly w: number,
    readonly h: number,
  ) {
    this.data = new Uint8ClampedArray(w * h * 4)
  }

  px(x: number, y: number, color: number, alpha = 1) {
    x = Math.floor(x)
    y = Math.floor(y)
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || alpha <= 0) return
    const i = (y * this.w + x) * 4
    const d = this.data
    const r = (color >> 16) & 255
    const g = (color >> 8) & 255
    const b = color & 255
    if (alpha >= 1) {
      d[i] = r
      d[i + 1] = g
      d[i + 2] = b
      d[i + 3] = 255
      return
    }
    const da = d[i + 3]! / 255
    const oa = alpha + da * (1 - alpha)
    d[i] = (r * alpha + d[i]! * da * (1 - alpha)) / oa
    d[i + 1] = (g * alpha + d[i + 1]! * da * (1 - alpha)) / oa
    d[i + 2] = (b * alpha + d[i + 2]! * da * (1 - alpha)) / oa
    d[i + 3] = oa * 255
  }

  alphaAt(x: number, y: number) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0
    return this.data[(y * this.w + x) * 4 + 3]!
  }

  rect(x: number, y: number, w: number, h: number, color: number, alpha = 1) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, color, alpha)
  }

  poly(points: Pt[], color: number, alpha = 1) {
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const [x, y] of points) {
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }
    for (let y = Math.floor(minY); y < Math.ceil(maxY); y++) {
      for (let x = Math.floor(minX); x < Math.ceil(maxX); x++) {
        if (inside(points, x + 0.5, y + 0.5)) this.px(x, y, color, alpha)
      }
    }
  }

  line(x0: number, y0: number, x1: number, y1: number, color: number, alpha = 1) {
    x0 = Math.round(x0)
    y0 = Math.round(y0)
    x1 = Math.round(x1)
    y1 = Math.round(y1)
    const dx = Math.abs(x1 - x0)
    const dy = -Math.abs(y1 - y0)
    const sx = x0 < x1 ? 1 : -1
    const sy = y0 < y1 ? 1 : -1
    let err = dx + dy
    for (;;) {
      this.px(x0, y0, color, alpha)
      if (x0 === x1 && y0 === y1) break
      const e2 = 2 * err
      if (e2 >= dy) {
        err += dy
        x0 += sx
      }
      if (e2 <= dx) {
        err += dx
        y0 += sy
      }
    }
  }

  /** Isometric 2:1 line (two pixels across per pixel down) — the classic pixel-art iso edge. */
  isoLine(x: number, y: number, steps: number, dirX: 1 | -1, color: number, alpha = 1) {
    for (let i = 0; i < steps; i++) {
      this.px(x + i * 2 * dirX, y + i, color, alpha)
      this.px(x + i * 2 * dirX + dirX, y + i, color, alpha)
    }
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, color: number, alpha = 1) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const nx = (x + 0.5 - cx) / rx
        const ny = (y + 0.5 - cy) / ry
        if (nx * nx + ny * ny <= 1) this.px(x, y, color, alpha)
      }
    }
  }

  /** 1px outline around every opaque pixel — gives sprites a consistent readable silhouette. */
  outline(color: number) {
    const marks: number[] = []
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.alphaAt(x, y) > 0) continue
        if (this.alphaAt(x - 1, y) > 128 || this.alphaAt(x + 1, y) > 128 || this.alphaAt(x, y - 1) > 128 || this.alphaAt(x, y + 1) > 128) {
          marks.push(x, y)
        }
      }
    }
    for (let i = 0; i < marks.length; i += 2) this.px(marks[i]!, marks[i + 1]!, color)
  }

  /** Copies another canvas onto this one at (ox, oy), honouring alpha. */
  blit(src: PixelCanvas, ox: number, oy: number) {
    for (let y = 0; y < src.h; y++) {
      for (let x = 0; x < src.w; x++) {
        const i = (y * src.w + x) * 4
        const a = src.data[i + 3]!
        if (!a) continue
        const c = (src.data[i]! << 16) | (src.data[i + 1]! << 8) | src.data[i + 2]!
        this.px(ox + x, oy + y, c, a / 255)
      }
    }
  }

  toTexture(scene: Phaser.Scene, key: string) {
    const tex = scene.textures.createCanvas(key, this.w, this.h)
    if (!tex) return null
    tex.context.putImageData(new ImageData(new Uint8ClampedArray(this.data), this.w, this.h), 0, 0)
    tex.refresh()
    return tex
  }
}

function inside(pts: Pt[], x: number, y: number) {
  let c = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i]!
    const [xj, yj] = pts[j]!
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c
  }
  return c
}

export interface BoxColors {
  top: number
  left: number
  right: number
  /** Optional 1px highlight along the top face's front edges. */
  rim?: number
}

/**
 * Draws an isometric box whose top face's back corner sits at (tx, ty).
 * a = footprint along grid x (screen down-right), b = along grid y
 * (screen down-left), both in tiles; h = height in pixels.
 */
export function isoBox(pc: PixelCanvas, tx: number, ty: number, a: number, b: number, h: number, c: BoxColors) {
  const T: Pt = [tx, ty]
  const R: Pt = [tx + 16 * a, ty + 8 * a]
  const B: Pt = [tx + 16 * a - 16 * b, ty + 8 * a + 8 * b]
  const L: Pt = [tx - 16 * b, ty + 8 * b]
  const down = (p: Pt): Pt => [p[0], p[1] + h]
  pc.poly([L, B, down(B), down(L)], c.left)
  pc.poly([B, R, down(R), down(B)], c.right)
  pc.poly([T, R, B, L], c.top)
  if (c.rim !== undefined) {
    pc.isoLine(L[0], L[1], 8 * b, 1, c.rim)
    pc.isoLine(R[0] - 1, R[1], 8 * a, -1, c.rim)
  }
  return { T, R, B, L }
}

/** Canvas size + anchor for a box texture of footprint a×b and height h. */
export function boxCanvas(a: number, b: number, h: number, extraTop = 0) {
  const w = 16 * (a + b)
  const hh = 8 * (a + b) + h + extraTop
  return { w, h: hh, tx: 16 * b, ty: extraTop }
}
