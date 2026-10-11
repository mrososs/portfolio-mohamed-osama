import type Phaser from 'phaser'
import { PixelCanvas } from './pixel'
import { PAL } from './palette'

export const CHAR_W = 16
export const CHAR_H = 24
export type Facing = 'down' | 'up' | 'side'
const FACINGS: Facing[] = ['down', 'up', 'side']

const P = {
  skin: 0xd9a07b,
  skinShade: 0xb47a58,
  hair: 0x2a1c18,
  hairLight: 0x4a3128,
  hoodie: 0x1aa79c,
  hoodieShade: 0x11746d,
  hoodieLight: 0x46d6c8,
  accent: PAL.ice,
  pants: 0x2b3157,
  pantsShade: 0x1d2242,
  shoe: 0xe9ecf5,
  sole: 0x8e97b8,
  eye: 0x131525,
}

/**
 * Draws the developer avatar — dark hair, teal hoodie, navy trousers,
 * white sneakers — for one facing and walk phase (0–3).
 */
function drawAvatar(pc: PixelCanvas, ox: number, oy: number, facing: Facing, phase: number) {
  const bob = phase % 2 === 1 ? -1 : 0
  const liftL = phase === 1 ? 1 : 0
  const liftR = phase === 3 ? 1 : 0
  const r = (x: number, y: number, w: number, h: number, c: number) => pc.rect(ox + x, oy + y, w, h, c)

  if (facing === 'side') {
    // Legs — stride front/back.
    const front = phase === 1 ? 9 : phase === 3 ? 5 : 7
    const back = phase === 1 ? 4 : phase === 3 ? 8 : 6
    r(back, 18, 3, 3, P.pantsShade)
    r(back, 21, 4, 1, P.shoe)
    r(back, 22, 4, 1, P.sole)
    r(front, 18, 3, 3, P.pants)
    r(front, 21, 4, 1, P.shoe)
    r(front, 22, 4, 1, P.sole)
    // Torso.
    r(6, 11 + bob, 5, 7, P.hoodie)
    r(6, 11 + bob, 1, 7, P.hoodieShade)
    r(6, 17 + bob, 5, 1, P.hoodieShade)
    r(10, 12 + bob, 1, 2, P.accent)
    // Arm swings opposite to the front leg.
    const armX = phase === 1 ? 6 : phase === 3 ? 9 : 8
    r(armX, 12 + bob, 2, 4, P.hoodieShade)
    r(armX, 16 + bob, 2, 1, P.skin)
    // Head.
    r(5, 2 + bob, 6, 9, P.skin)
    r(5, 2 + bob, 6, 3, P.hair)
    r(5, 5 + bob, 3, 4, P.hair)
    r(6, 2 + bob, 3, 1, P.hairLight)
    r(7, 7 + bob, 1, 1, P.skinShade)
    r(9, 7 + bob, 1, 1, P.eye)
    r(11, 7 + bob, 1, 1, P.skin)
    r(9, 9 + bob, 2, 1, P.skinShade)
    r(10, 5 + bob, 1, 1, P.hair)
    return
  }

  // Legs.
  r(5, 18, 3, 3 - liftL, P.pants)
  r(5, 21 - liftL, 3, 1, P.shoe)
  r(5, 22 - liftL, 3, 1, P.sole)
  r(8, 18, 3, 3 - liftR, P.pants)
  r(8, 21 - liftR, 3, 1, P.shoe)
  r(8, 22 - liftR, 3, 1, P.sole)
  r(7, 18, 2, 1, P.pantsShade)

  // Torso + arms.
  r(5, 11 + bob, 6, 7, P.hoodie)
  r(5, 17 + bob, 6, 1, P.hoodieShade)
  const armL = phase === 3 ? -1 : 0
  const armR = phase === 1 ? -1 : 0
  r(3, 12 + bob, 2, 5 + armL, P.hoodieShade)
  r(3, 17 + bob + armL, 2, 1, P.skin)
  r(11, 12 + bob, 2, 5 + armR, P.hoodieShade)
  r(11, 17 + bob + armR, 2, 1, P.skin)

  if (facing === 'down') {
    r(5, 11 + bob, 6, 1, P.hoodieLight)
    r(6, 15 + bob, 4, 2, P.hoodieShade)
    r(7, 13 + bob, 2, 1, P.accent)
    // Head.
    r(4, 3 + bob, 8, 8, P.skin)
    r(5, 2 + bob, 6, 1, P.hair)
    r(4, 3 + bob, 8, 2, P.hair)
    r(4, 5 + bob, 3, 1, P.hair)
    r(9, 5 + bob, 3, 1, P.hair)
    r(4, 6 + bob, 1, 2, P.hair)
    r(11, 6 + bob, 1, 2, P.hair)
    r(6, 2 + bob, 3, 1, P.hairLight)
    r(6, 7 + bob, 1, 1, P.eye)
    r(9, 7 + bob, 1, 1, P.eye)
    r(7, 9 + bob, 2, 1, P.skinShade)
    r(5, 10 + bob, 6, 1, P.skinShade)
  } else {
    r(6, 11 + bob, 4, 3, P.hoodieShade)
    r(7, 12 + bob, 2, 1, P.hoodie)
    r(4, 3 + bob, 8, 8, P.hair)
    r(5, 2 + bob, 6, 1, P.hair)
    r(6, 3 + bob, 3, 2, P.hairLight)
    r(4, 7 + bob, 1, 1, P.skin)
    r(11, 7 + bob, 1, 1, P.skin)
    r(5, 10 + bob, 6, 1, P.skinShade)
  }
}

/** Builds the 'player' sheet: frames named `${facing}-${phase}`. */
export function makePlayerTexture(scene: Phaser.Scene) {
  const pc = new PixelCanvas(CHAR_W * 4 * FACINGS.length, CHAR_H)
  FACINGS.forEach((facing, fi) => {
    for (let phase = 0; phase < 4; phase++) {
      const frame = new PixelCanvas(CHAR_W, CHAR_H)
      drawAvatar(frame, 0, 0, facing, phase)
      frame.outline(PAL.outline)
      pc.blit(frame, (fi * 4 + phase) * CHAR_W, 0)
    }
  })
  const tex = pc.toTexture(scene, 'player')
  if (!tex) return
  FACINGS.forEach((facing, fi) => {
    for (let phase = 0; phase < 4; phase++) {
      tex.add(`${facing}-${phase}`, 0, (fi * 4 + phase) * CHAR_W, 0, CHAR_W, CHAR_H)
    }
  })
}

export function makePlayerAnims(scene: Phaser.Scene) {
  for (const facing of FACINGS) {
    scene.anims.create({
      key: `walk-${facing}`,
      frames: [0, 1, 2, 3].map((p) => ({ key: 'player', frame: `${facing}-${p}` })),
      frameRate: 9,
      repeat: -1,
    })
  }
}
