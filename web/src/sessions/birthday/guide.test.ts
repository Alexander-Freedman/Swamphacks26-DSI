import { describe, expect, it } from 'vitest'
import { frameFor, guessLabelSpot, handWidth, TRUTH, curveHits } from './chart'
import { CALLED_IT, guideFor } from './guide'
import { lineFromGuess } from './math'

describe('card guidance line (#150)', () => {
  it('says why it works on a called-it card, names the mistake otherwise', () => {
    expect(guideFor(6, 23)[1]).toBe(CALLED_IT)
    expect(guideFor(6, 20)[1]).toBe(CALLED_IT)
    expect(guideFor(6, 180)[1]).toMatch(/mistake your guess points to/)
    expect(guideFor(6, 2)[1]).toMatch(/mistake your guess points to/)
    expect(guideFor(5, 23)[1]).not.toBe(CALLED_IT)
  })
})

describe('guess label placement (#152)', () => {
  for (const w of [290, 320, 340, 600])
    for (const g of [2, 3, 10, 23, 40, 57, 70, 80]) {
      it(`keeps "your guess: ${g}" off the lines at width ${w}`, () => {
        const f = frameFor(w)
        const text = `your guess: ${g}`
        const curves = [lineFromGuess(g), TRUTH]
        const s = guessLabelSpot(f, g, text, curves)
        const tw = handWidth(text)
        const box = { x0: s.textAnchor === 'start' ? s.x : s.x - tw, x1: s.textAnchor === 'start' ? s.x + tw : s.x, y0: s.y - 14, y1: s.y + 4.2 }
        expect(curves.some((c) => curveHits(f, c, box))).toBe(false)
        expect(box.x0).toBeGreaterThanOrEqual(s.y < f.t ? 4 : f.l)
        expect(box.x1).toBeLessThanOrEqual(s.y < f.t ? f.w - 4 : f.w - f.r)
        expect(box.y0).toBeGreaterThanOrEqual(0)
      })
    }
})
