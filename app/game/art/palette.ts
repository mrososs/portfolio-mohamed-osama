import type { CellKind } from '../layout'

/**
 * One palette for the whole world: dark navy environments, cyan/teal light,
 * subtle purple, warm ambient amber. Every texture is built from these.
 */
export const PAL = {
  void: 0x050812,
  outline: 0x080b18,
  navy950: 0x090d1d,
  navy900: 0x0d1329,
  navy800: 0x131c3a,
  navy700: 0x1a2650,
  navy600: 0x243466,
  navy500: 0x30447f,
  steel: 0x5b6b9c,
  cyan: 0x5ef2e2,
  cyanSoft: 0x2fb8b0,
  ice: 0xc8fff8,
  blue: 0x55c8ff,
  purple: 0xb07cff,
  purpleDeep: 0x5b3aa6,
  amber: 0xffb547,
  warm: 0xffe0a8,
  gold: 0xf2c14e,
  green: 0x4dffa6,
  pink: 0xff7ab8,
  white: 0xeef3ff,
} as const

export interface FloorStyle {
  base: number
  alt: number
  accent: number
  rim: number
}

export const FLOORS: Record<CellKind, FloorStyle> = {
  plaza: { base: 0x283252, alt: 0x2d385b, accent: PAL.cyan, rim: PAL.cyan },
  projects: { base: 0x1b2444, alt: 0x1f294c, accent: PAL.blue, rim: PAL.blue },
  skills: { base: 0x2a2b40, alt: 0x2f3047, accent: PAL.amber, rim: PAL.amber },
  ai: { base: 0x241d42, alt: 0x29214a, accent: PAL.purple, rim: PAL.purple },
  contact: { base: 0x1a3140, alt: 0x1d3747, accent: PAL.green, rim: PAL.green },
  bridge: { base: 0x22304f, alt: 0x22304f, accent: PAL.cyan, rim: PAL.cyanSoft },
}
