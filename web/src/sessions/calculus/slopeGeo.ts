import { X0, X1, xs } from './math'
import type { Box } from './plot'

// Layout of the two-panel slope chart, shared by the chart, the session and the tests.

export const FINE = 161
export const fineXs = Array.from({ length: FINE }, (_, i) => X0 + ((X1 - X0) * i) / (FINE - 1))
export const SLOPE_Y: [number, number] = [-2.5, 5.5]

export function boxes(w: number) {
  const phone = w < 480
  const l = 30
  const r = 10
  const top: Box = { l, t: 22, w: w - l - r, h: phone ? 140 : 170, x0: X0, x1: X1, y0: 0, y1: 3.6 }
  const gap = 46
  const bot: Box = { l, t: top.t + top.h + gap, w: w - l - r, h: phone ? 190 : 210, x0: X0, x1: X1, y0: SLOPE_Y[0], y1: SLOPE_Y[1] }
  return { top, bot, h: bot.t + bot.h + 26 }
}

/** Pencil values at the fine xs, from the 41 resampled ones. */
export function pencilAt(sketch: number[], x: number) {
  const k = ((x - X0) / (X1 - X0)) * (xs.length - 1)
  const i = Math.min(xs.length - 2, Math.floor(k))
  return sketch[i] + (k - i) * (sketch[i + 1] - sketch[i])
}

