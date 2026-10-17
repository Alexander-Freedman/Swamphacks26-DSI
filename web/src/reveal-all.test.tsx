// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { Answer } from './components/Predict'
import { Reveal } from './components/Reveal'
import { CheckedTag } from './components/CheckedTag'
import { num, withUnit } from './format'
import { answerValue, computeTruth } from './truth'
import type { Item, Round } from './types'

afterEach(cleanup)

const files = import.meta.glob<Round>('../../data/rounds/extra/*.json', { eager: true, import: 'default' })
const rounds: Record<string, Round> = Object.fromEntries(Object.values(files).map((r) => [r.slug, r]))
const item = (slug: string, id: string) => rounds[slug].items.find((i) => i.id === id)!

// A middling slider guess, or the first (often wrong) option.
function answerFor(it: Item): Answer {
  if (it.input_type === 'slider' && it.slider) {
    const { min, max, step } = it.slider
    return { value: Math.round((min + (max - min) / 2) / step) * step, optionId: null, confidence: 'pretty sure' }
  }
  return { value: null, optionId: it.options![0].id, confidence: 'certain' }
}

function reveal(slug: string, it: Item, answer = answerFor(it)) {
  return render(<Reveal item={it} round={rounds[slug]} answer={answer} truth={computeTruth(it)} signals={{}} />)
}

describe('every extra round reveals the truth', () => {
  for (const r of Object.values(rounds)) {
    for (const q of r.items) {
      it(`${r.slug} / ${q.id} (${q.truth.widget}, ${q.input_type})`, () => {
        const { container } = reveal(r.slug, q)
        const text = container.textContent ?? ''
        expect(text).toMatch(/Reality:/)
        expect(text).not.toMatch(/NaN|undefined|Infinity/)
        if (q.input_type === 'choice') {
          const right = q.options!.find((o) => o.misconception_id === null)!
          expect(container.querySelector('.reality-value')!.textContent).toBe(right.text)
        }
        if (q.truth.widget === 'stepper') expect(container.querySelectorAll('.steps li')).toHaveLength(q.truth.steps.length)
        for (const el of container.querySelectorAll('svg text')) expect(el.textContent).not.toMatch(/NaN/)
      })
    }
  }
})

describe('reality numbers match the data', () => {
  it('Monty Hall: switching wins 66.7%, with the guess and the gap', () => {
    const q = item('monty-hall', 'switch-win-chance')
    reveal('monty-hall', q, { value: 50, optionId: null, confidence: 'certain' })
    expect(document.querySelector('.reality-value')!.textContent).toBe('66.7%')
    expect(screen.getByText('you: 50%')).toBeTruthy()
    expect(screen.getByText('16.7 points', { selector: '.reality-gap strong' })).toBeTruthy()
    expect(screen.getByLabelText('your guess 50% vs reality 66.7%, 16.7 points apart')).toBeTruthy()
  })
  it('compound interest: $110.41 on the curve, next to the right option', () => {
    const q = item('compound-interest', 'hundred-at-two-percent')
    reveal('compound-interest', q)
    // the right option already says $110.41, so no second number line
    expect(document.querySelector('.reality-value')!.textContent).toContain('$110.41')
    expect(document.querySelector('.reality-num')).toBeNull()
    expect(screen.getByLabelText(/reality: \$110\.41/)).toBeTruthy()
  })
  it('doubling at 8%: about 9.01 years, an x on the curve', () => {
    const q = item('compound-interest', 'doubling-time')
    const t = computeTruth(q)
    expect(t.kind === 'curve' && t.point?.axis).toBe('x')
    expect(t.value).toBeCloseTo(9.006, 2)
    reveal('compound-interest', q, { value: 12, optionId: null, confidence: 'guessing' })
    expect(document.querySelector('.reality-value')!.textContent).toBe('9.01 years')
    expect(screen.getByText('2.99 years', { selector: '.reality-gap strong' })).toBeTruthy()
  })
  it('$10,000 at 7% for 30 years: about $76,123', () => {
    const q = item('compound-interest', 'thirty-years')
    const t = computeTruth(q)
    expect(t.kind === 'curve' && t.point?.axis).toBe('y')
    expect(t.value).toBeCloseTo(10000 * 1.07 ** 30, 2)
    reveal('compound-interest', q, { value: 40000, optionId: null, confidence: 'pretty sure' })
    expect(document.querySelector('.reality-value')!.textContent).toBe('$76,123')
    expect(screen.getByText('$36,123', { selector: '.reality-gap strong' })).toBeTruthy()
  })
  it('gravity at the station is a y (unit matches the y axis), lily pads day 47 is an x', () => {
    const g = computeTruth(item('orbits', 'gravity-at-station'))
    expect(g.kind === 'curve' && g.point && [g.point.axis, Math.round(g.point.x)]).toEqual(['y', 400])
    const l = computeTruth(item('doubling', 'lily-pads'))
    expect(l.kind === 'curve' && l.point && [l.point.axis, l.point.x, l.point.y]).toEqual(['x', 47, 50])
  })
  it('an estimate choice shows its number with the unit', () => {
    reveal('doubling', item('doubling', 'chessboard-last-square'))
    expect(screen.getByText('9.22 quintillion grains')).toBeTruthy()
  })
  it('the stepper shows its worked steps', () => {
    const q = item('opportunity-cost', 'free-concert')
    reveal('opportunity-cost', q)
    expect(screen.getByText('Worked through:')).toBeTruthy()
    if (q.truth.widget === 'stepper') expect(screen.getByText(q.truth.steps[0])).toBeTruthy()
  })
})

describe('curve ask_x / ask_y', () => {
  const base = { id: 'a', prompt: '', input_type: 'slider' as const, slider: { min: 0, max: 15000, step: 100, unit: '$' } }
  it('ask_x: the truth is the curve at that x', () => {
    const q = {
      ...base,
      truth: { widget: 'curve', expr: '1000*(1+r/100)^x', x_min: 0, x_max: 40, x_label: 'years', y_label: 'value ($)', ask_x: 30 },
      explore: { param: 'r', label: 'rate', min: 1, max: 12, step: 0.5, default: 7 },
      answer_claimed: 7612,
    } as Item
    const t = computeTruth(q)
    expect(t.value).toBeCloseTo(1000 * 1.07 ** 30, 6)
    render(<Reveal item={q} round={{ misconceptions: [] } as unknown as Round} answer={{ value: 3000, optionId: null, confidence: 'certain' }} truth={t} signals={{}} />)
    expect(document.querySelector('.reality-value')!.textContent).toBe('$7,612')
  })
  it('ask_y: the truth is the x where the curve reaches it', () => {
    const q = {
      ...base,
      slider: { min: 0, max: 60, step: 1, unit: 'hours' },
      truth: { widget: 'curve', expr: '400*0.5^(x/h)', x_min: 0, x_max: 36, x_label: 'hours', y_label: 'mg left', ask_y: 50 },
      explore: { param: 'h', label: 'half-life', min: 1, max: 24, step: 1, default: 6 },
      answer_expr: '6*3',
    } as Item
    const t = computeTruth(q)
    expect(t.kind === 'curve' && t.point).toEqual({ x: 18, y: 50, axis: 'x' })
    expect(t.value).toBe(18)
  })
})

describe('formatting', () => {
  it('reads like a person wrote it', () => {
    expect(withUnit(2 / 3 * 100, '%')).toBe('66.7%')
    expect(withUnit(100 * 1.02 ** 5, '$')).toBe('$110.41')
    expect(withUnit(50000, '$ per year')).toBe('$50,000 per year')
    expect(withUnit(88.5, '% of ground gravity')).toBe('88.5% of ground gravity')
    expect(num(Math.log(2) / Math.log(1.08))).toBe('9.01')
  })
  it('answerValue computes answer_expr, falls back to the claim', () => {
    expect(answerValue({ answer_expr: '10000*1.07^30' } as Item)).toBeCloseTo(76122.55, 1)
    expect(answerValue({ answer_expr: 'nonsense(', answer_claimed: 3 } as Item)).toBe(3)
    expect(answerValue({} as Item)).toBeNull()
  })
})

describe('checked tag', () => {
  it('is a quiet label with a tooltip, not a badge', () => {
    render(<CheckedTag reviewed />)
    expect(screen.getByText('hand-checked').getAttribute('title')).toMatch(/person checked/)
    cleanup()
    render(<CheckedTag reviewed={false} />)
    expect(screen.getByText('auto-checked').getAttribute('title')).toMatch(/no person/)
  })
})
