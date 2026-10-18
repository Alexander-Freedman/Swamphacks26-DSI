// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import bundled from '../../../../data/learn/compound-interest.json'
import type { Topic } from '../types'
import { CaseCurve } from './CaseCurve'
import { caseCurve } from './caseCurveMath'

afterEach(cleanup)

const topic = bundled as unknown as Topic

/** compound-interest with per-case curves, the shape the data would carry. */
function withCurves(): Topic {
  const t = JSON.parse(JSON.stringify(topic)) as Topic
  const cases = t.rubric.contrastingCases as (Topic['rubric']['contrastingCases'][number] & { curve?: unknown })[]
  cases[0].curve = { knobs: { r: 7 }, label: '7% on the current balance' }
  cases[1].curve = { expr: 'P + 70*x', label: 'a flat $70 a year' }
  cases[2].curve = { expr: 'P*(1+r/1200)^(12*x)', label: '7% paid monthly' }
  return t
}

describe('contrast pictures: each case its own curve, computed in code', () => {
  it('compound vs flat vs monthly at year 30: $7,612 / $3,100 / $8,116', () => {
    const t = withCurves()
    expect(Math.round(caseCurve(t, 0)!.f(30))).toBe(7612)
    expect(caseCurve(t, 1)!.f(30)).toBe(3100)
    expect(Math.round(caseCurve(t, 2)!.f(30))).toBe(8116)
  })

  it('no per-case curve, no picture (no two identical lines on different cards); no visual, no picture', () => {
    expect(caseCurve(topic, 0)).toBeNull()
    expect(caseCurve({ ...withCurves(), visual: null }, 1)).toBeNull()
  })

  it('a broken expression draws nothing', () => {
    const t = withCurves()
    ;(t.rubric.contrastingCases[1] as { curve?: { expr: string } }).curve = { expr: 'P + ((' }
    expect(caseCurve(t, 1)).toBeNull()
  })

  it('renders the tiny curve with its caption', () => {
    render(<CaseCurve topic={withCurves()} index={1} />)
    expect(screen.getByRole('img')).toBeTruthy()
    expect(screen.getByText('a flat $70 a year')).toBeTruthy()
  })

  it('renders nothing for a case without its own curve', () => {
    const { container } = render(<CaseCurve topic={topic} index={0} />)
    expect(container.innerHTML).toBe('')
  })
})
