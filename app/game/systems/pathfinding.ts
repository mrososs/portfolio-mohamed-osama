/**
 * Grid A* over the world's walkability map (the same cells and blocked set
 * the collision system uses). 8-directional with corner-cutting prevented:
 * a diagonal step needs both orthogonal neighbours open, so the player's
 * footprint can always follow the path without clipping a prop corner.
 */

export type Cell = [number, number]
export type IsOpen = (gx: number, gy: number) => boolean

const DIRS: [number, number, number][] = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, Math.SQRT2],
  [1, -1, Math.SQRT2],
  [-1, 1, Math.SQRT2],
  [-1, -1, Math.SQRT2],
]

const octile = (ax: number, ay: number, bx: number, by: number) => {
  const dx = Math.abs(ax - bx)
  const dy = Math.abs(ay - by)
  return dx + dy + (Math.SQRT2 - 2) * Math.min(dx, dy)
}

/** Returns the cells from start to goal (inclusive), or null when unreachable. */
export function findPath(isOpen: IsOpen, start: Cell, goal: Cell, maxExpanded = 6000): Cell[] | null {
  const [sx, sy] = start
  const [gx, gy] = goal
  if (!isOpen(gx, gy)) return null
  const k = (x: number, y: number) => `${x},${y}`

  const g = new Map<string, number>([[k(sx, sy), 0]])
  const parent = new Map<string, string>()
  const closed = new Set<string>()
  // Binary min-heap of [f, x, y].
  const heap: [number, number, number][] = [[octile(sx, sy, gx, gy), sx, sy]]
  const push = (n: [number, number, number]) => {
    heap.push(n)
    let i = heap.length - 1
    while (i > 0) {
      const p = (i - 1) >> 1
      if (heap[p]![0] <= heap[i]![0]) break
      ;[heap[p], heap[i]] = [heap[i]!, heap[p]!]
      i = p
    }
  }
  const pop = () => {
    const top = heap[0]!
    const last = heap.pop()!
    if (heap.length) {
      heap[0] = last
      let i = 0
      for (;;) {
        const l = i * 2 + 1
        const r = l + 1
        let m = i
        if (l < heap.length && heap[l]![0] < heap[m]![0]) m = l
        if (r < heap.length && heap[r]![0] < heap[m]![0]) m = r
        if (m === i) break
        ;[heap[m], heap[i]] = [heap[i]!, heap[m]!]
        i = m
      }
    }
    return top
  }

  let expanded = 0
  while (heap.length) {
    const [, x, y] = pop()
    const ck = k(x, y)
    if (closed.has(ck)) continue
    if (x === gx && y === gy) {
      const path: Cell[] = [[x, y]]
      let cur = ck
      while (parent.has(cur)) {
        cur = parent.get(cur)!
        const [px, py] = cur.split(',').map(Number) as Cell
        path.push([px, py])
      }
      return path.reverse()
    }
    closed.add(ck)
    if (++expanded > maxExpanded) return null

    const base = g.get(ck)!
    for (const [dx, dy, cost] of DIRS) {
      const nx = x + dx
      const ny = y + dy
      if (!isOpen(nx, ny)) continue
      if (dx !== 0 && dy !== 0 && (!isOpen(x + dx, y) || !isOpen(x, y + dy))) continue
      const nk = k(nx, ny)
      if (closed.has(nk)) continue
      const ng = base + cost
      if (ng < (g.get(nk) ?? Infinity)) {
        g.set(nk, ng)
        parent.set(nk, ck)
        push([ng + octile(nx, ny, gx, gy), nx, ny])
      }
    }
  }
  return null
}

/** Nearest open cell to (gx, gy) within `radius` cells (Chebyshev rings), or null. */
export function nearestOpen(isOpen: IsOpen, gx: number, gy: number, radius = 2): Cell | null {
  if (isOpen(gx, gy)) return [gx, gy]
  for (let r = 1; r <= radius; r++) {
    let best: Cell | null = null
    let bestD = Infinity
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r || !isOpen(gx + dx, gy + dy)) continue
        const d = dx * dx + dy * dy
        if (d < bestD) {
          bestD = d
          best = [gx + dx, gy + dy]
        }
      }
    }
    if (best) return best
  }
  return null
}

/**
 * String-pulling: drops intermediate waypoints whenever the straight
 * segment between two points is clear (checked by `clear`), so the walk
 * looks natural instead of zig-zagging cell to cell.
 */
export function smooth<P>(points: P[], clear: (a: P, b: P) => boolean): P[] {
  if (points.length <= 2) return points
  const out: P[] = [points[0]!]
  let anchor = 0
  while (anchor < points.length - 1) {
    let next = points.length - 1
    while (next > anchor + 1 && !clear(points[anchor]!, points[next]!)) next--
    out.push(points[next]!)
    anchor = next
  }
  return out
}
