/**
 * Tiny synthesised sound effects (WebAudio oscillators) — no audio files.
 * Muted by default; the AudioContext is only created once the visitor
 * unmutes, which is always a user gesture, so browsers allow playback.
 */
export class Sfx {
  private ctx: AudioContext | null = null

  constructor(private isMuted: () => boolean) {}

  private context() {
    if (this.isMuted()) return null
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return null
      this.ctx = new Ctor()
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    return this.ctx
  }

  private tone(freq: number, start: number, dur: number, type: OscillatorType, gain = 0.05) {
    const ctx = this.context()
    if (!ctx) return
    const t = ctx.currentTime + start
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t)
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(gain, t + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    osc.connect(g).connect(ctx.destination)
    osc.start(t)
    osc.stop(t + dur + 0.02)
  }

  focus() {
    this.tone(880, 0, 0.08, 'sine', 0.025)
  }

  interact() {
    this.tone(660, 0, 0.12, 'triangle')
    this.tone(990, 0.07, 0.16, 'triangle')
  }

  zone() {
    this.tone(392, 0, 0.25, 'sine', 0.03)
    this.tone(587, 0.1, 0.3, 'sine', 0.03)
  }

  transmit() {
    for (let i = 0; i < 5; i++) this.tone(700 + i * 160, i * 0.06, 0.1, 'square', 0.015)
  }

  destroy() {
    void this.ctx?.close()
    this.ctx = null
  }
}
