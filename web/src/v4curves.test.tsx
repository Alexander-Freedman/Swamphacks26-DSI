// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Predict } from './components/Predict'
import { Reveal } from './components/Reveal'
import { areaUnder, computeTruth, leftSum, limitAt, slopeAt } from './truth'
import type { Item, Round } from './types'

afterEach(cleanup)

const curve = (show: 'tangent' | 'riemann' | 'limit', expr: string, extra: Record<string, number> = {}): Item => ({
  id: 'i1',
  prompt: 'q',
  input_type: 'slider',
  slider: { min: 0, max: 20, step: 0.5, unit: '' },
  bands: [{ min: 0, max: 20, misconception_id: null }],
  truth: { widget: 'curve', expr, x_min: -1, x_max: 5, x_label: 'x', y_label: 'y', show, ...extra },
  computed: true,
})
const round = (item: Item): Round => ({ schema_version: 1, slug: 's', topic: 't', concept: 'c', reviewed: false, misconceptions: [], items: [item] })

describe('engine v4 calculus truths are computed, not read off the curve', () => {
  it('slope, area, Riemann sums and limits match closed forms', () => {
    const sq = (x: number) => x * x
    expect(slopeAt(sq, 3, 6)).toBeCloseTo(6, 6)
    expect(areaUnder(sq, 0, 3)).toBeCloseTo(9, 6)
    expect(leftSum(sq, 0, 3, 1)).toBe(0)
    expect(leftSum(sq, 0, 3, 3)).toBeCloseTo(5, 9) // 0 + 1 + 4
    expect(limitAt((x) => Math.sin(x) / x, 0, 6)).toBeCloseTo(1, 4)
    expect(limitAt((x) => (x > 0 ? 1 : -1), 0, 6)).toBeNull()
  })

  it('a tangent item at x = 3 on x^2 answers 6 (the slope), not 9 (the height)', () => {
    const c = computeTruth(curve('tangent', 'x^2', { ask_x: 3 }))
    expect(c.value).toBeCloseTo(6, 4)
    expect(c.kind === 'curve' && c.point?.y).toBeCloseTo(9, 6)
  })

  it('a riemann item answers the exact area; a limit item the two-sided limit', () => {
    expect(computeTruth(curve('riemann', 'x^2', { area_from: 0, area_to: 3 })).value).toBeCloseTo(9, 4)
    expect(computeTruth(curve('limit', '(x^2 - 4)/(x - 2)', { ask_x: 2 })).value).toBeCloseTo(4, 3)
  })
})

describe('the guess is drawn on the curve', () => {
  it('tangent: a pencil tangent turns with the slider, then the ink tangent shows slope 6', () => {
    const item = curve('tangent', 'x^2', { ask_x: 3 })
    render(<Predict item={item} onLock={() => {}} />)
    expect(document.querySelector('.curve-tangent-pencil')).toBeNull()
    fireEvent.change(screen.getByLabelText('your guess'), { target: { value: '4' } })
    expect(document.querySelector('.curve-tangent-pencil')).toBeTruthy()
    expect(document.querySelector('.curve-tangent')).toBeNull() // the answer stays hidden
    expect(screen.getByText('your tangent: slope 4')).toBeTruthy()
    cleanup()
    render(<Reveal item={item} round={round(item)} answer={{ value: 4, optionId: null, confidence: 'pretty sure' }} truth={computeTruth(item)} signals={{}} />)
    expect(document.querySelector('.curve-tangent')).toBeTruthy()
    expect(document.querySelector('.curve-tangent-pencil')).toBeTruthy()
    expect(screen.getByText('slope 6')).toBeTruthy()
  })

  it('riemann: your area as one pencil rectangle, then rectangles close in on the exact area', () => {
    const item = curve('riemann', 'x^2', { area_from: 0, area_to: 3 })
    render(<Predict item={item} onLock={() => {}} />)
    fireEvent.change(screen.getByLabelText('your guess'), { target: { value: '12' } })
    expect(document.querySelector('.curve-guess-rect')).toBeTruthy()
    cleanup()
    render(<Reveal item={item} round={round(item)} answer={{ value: 12, optionId: null, confidence: 'pretty sure' }} truth={computeTruth(item)} signals={{}} />)
    expect(document.querySelectorAll('.curve-rect')).toHaveLength(1)
    fireEvent.change(screen.getByLabelText('number of rectangles'), { target: { value: '8' } })
    expect(document.querySelectorAll('.curve-rect')).toHaveLength(200)
    expect(screen.getByText(/200 rectangles/)).toBeTruthy()
  })

  it('a plain value question draws nothing before the guess (no answer give-away)', () => {
    const item = curve('tangent', 'x^2', { ask_x: 3 })
    const plain: Item = { ...item, truth: { ...item.truth, show: null } as Item['truth'] }
    render(<Predict item={plain} onLock={() => {}} />)
    expect(document.querySelector('svg.curve')).toBeNull()
  })
})
