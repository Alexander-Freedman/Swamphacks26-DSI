// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import bundled from '../../../../data/learn/compound-interest.json'
import type { Topic } from '../types'
import { CaseCurve } from './CaseCurve'
import { caseCurve } from './caseCurveMath'

afterEach(cleanup)

const topic = bundled as unknown as Topic

/** compound-interest with the per-case curves stripped. */
function withoutCurves(): Topic {
  const t = JSON.parse(JSON.stringify(topic)) as Topic
  for (const c of t.rubric.contrastingCases as { curve?: unknown }[]) delete c.curve
  return t
}

describe('contrast pictures: each case its own curve, computed in code', () => {
  it('the bundled data: compound vs flat vs monthly at year 30 match the cards: $7,612 / $3,100 / $8,116', () => {
    const t = topic
    expect(Math.round(caseCurve(t, 0)!.f(30))).toBe(7612)
    expect(caseCurve(t, 1)!.f(30)).toBe(3100)
    expect(Math.round(caseCurve(t, 2)!.f(30))).toBe(8116)
  })

  it('no per-case curve, no picture (no two identical lines on different cards); no visual, no picture', () => {
    expect(caseCurve(withoutCurves(), 0)).toBeNull()
    expect(caseCurve({ ...topic, visual: null }, 1)).toBeNull()
  })

  it('a broken expression draws nothing', () => {
    const t = JSON.parse(JSON.stringify(topic)) as Topic
    ;(t.rubric.contrastingCases[1] as { curve?: { expr: string } }).curve = { expr: 'P + ((' }
    expect(caseCurve(t, 1)).toBeNull()
  })

  it('renders the tiny curve with its caption', () => {
    render(<CaseCurve topic={topic} index={1} />)
    expect(screen.getByRole('img')).toBeTruthy()
    expect(screen.getByText('a flat $70 a year')).toBeTruthy()
  })

  it('renders nothing for a case without its own curve', () => {
    const { container } = render(<CaseCurve topic={withoutCurves()} index={0} />)
    expect(container.innerHTML).toBe('')
  })
})
