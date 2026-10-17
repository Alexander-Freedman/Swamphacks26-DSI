// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { entries } from '../../notebook'
import { session } from './index'
import { f, fPrime } from './math'
import { boxes } from './slopeGeo'
import { sy } from './plot'

vi.setConfig({ testTimeout: 30000 })

beforeAll(() => {
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
  // jsdom has no PointerEvent; a MouseEvent carries clientX/clientY the same way
  if (!('PointerEvent' in window)) (window as unknown as { PointerEvent: typeof MouseEvent }).PointerEvent = class extends MouseEvent {} as typeof MouseEvent
})
afterEach(cleanup)

const Session = session.Component
// jsdom measures 0 wide, so charts fall back to 640px and the svg sits at (0, 0)
const { bot } = boxes(640)
const px = (x: number) => bot.l + (x / 4) * bot.w

function draw(g: (x: number) => number) {
  const pad = screen.getByLabelText(/drawing pad/)
  for (let k = 0; k <= 40; k++) {
    const x = (4 * k) / 40
    const ev = { clientX: px(x), clientY: sy(bot, g(x)), pointerId: 1 }
    fireEvent[k === 0 ? 'pointerDown' : 'pointerMove'](pad, ev)
  }
  fireEvent.pointerUp(pad, { pointerId: 1 })
}

const pickTopic = (name: RegExp) => fireEvent.click(screen.getByRole('button', { name }))

function playThrough(g: (x: number) => number, guess: number) {
  render(<Session onDone={() => {}} />)
  pickTopic(/^Start to finish/)
  expect(screen.getByText('Draw the slope.')).toBeTruthy()
  expect((screen.getByText('Check it with a tangent →') as HTMLButtonElement).disabled).toBe(true)
  draw(g)
  fireEvent.click(screen.getByText('Check it with a tangent →'))

  expect(screen.getByText('Drag the tangent.')).toBeTruthy()
  expect(document.activeElement?.textContent).toBe('Drag the tangent.')
  const next = screen.getByText('Now the area →') as HTMLButtonElement
  expect(next.disabled).toBe(true)
  // drag the tangent point from x = 0.2 to x = 1: the readout is the exact slope there
  const chart = screen.getByLabelText('drag the point along the curve')
  fireEvent.pointerDown(chart, { clientX: px(0.2), clientY: 100, pointerId: 2 })
  fireEvent.pointerMove(chart, { clientX: px(1), clientY: 100, pointerId: 2 })
  expect(screen.getByText('slope at x = 1.0')).toBeTruthy()
  expect(screen.getByText('flat')).toBeTruthy()
  fireEvent.pointerMove(chart, { clientX: px(4), clientY: 100, pointerId: 2 })
  fireEvent.pointerUp(chart, { pointerId: 2 })
  expect(screen.getByText(fPrime(4).toFixed(2))).toBeTruthy()
  // dragged all the way right; the 0 → 0.2 start is traced too, so the whole slope is in
  fireEvent.click(screen.getByText('Now the area →'))

  expect(screen.getByText('Fill the area.')).toBeTruthy()
  const bar = screen.getByLabelText('your area guess, in squares')
  // the bar is 0..10 over 640 − 28 px starting at 14
  fireEvent.pointerDown(bar, { clientX: 14 + (guess / 10) * 612, clientY: 40, pointerId: 3 })
  fireEvent.pointerUp(bar, { pointerId: 3 })
  fireEvent.click(screen.getByText('Fill it with rectangles →'))
  expect(screen.getByText('7.500')).toBeTruthy()
  expect(screen.getByText('4.570')).toBeTruthy()
  fireEvent.change(screen.getByLabelText(/Rectangles/), { target: { value: '100' } })
  expect(screen.getByText('200 rectangles, left edges')).toBeTruthy()
  fireEvent.click(screen.getByText('midpoint'))
  expect(screen.getByText('4.570', { selector: '.calc-big' })).toBeTruthy()
  fireEvent.click(screen.getByText('What did my pencil get wrong? →'))
}

describe('calculus session', () => {
  it('a slope sketch that copies the curve is named, and the guess above one rectangle too', () => {
    localStorage.clear()
    playThrough(f, 9)
    expect(screen.getByText('Slope = height of the curve')).toBeTruthy()
    expect(screen.getByText('More rectangles = more area')).toBeTruthy()
    const [e] = entries()
    expect(e).toMatchObject({ session: 'calculus', misconception: 'slope-is-height', rematch: null })
    expect((e as unknown as { mastered: boolean }).mastered).toBe(false)
    expect(e.confidence).toBeUndefined()

    fireEvent.click(screen.getByText('One more picture →'))
    expect(screen.getByText('Same idea, twice.')).toBeTruthy()
    expect(screen.queryByText(/Saved to your notebook/)).toBeNull()
    // a wrong pick says so and lets you try again; the rule and the end bar wait for the right one
    fireEvent.click(screen.getByText('The two curves have the same shape'))
    expect(screen.getByText(/Not quite\./)).toBeTruthy()
    expect(screen.getByText(/position only climbs/)).toBeTruthy()
    expect(screen.queryByText('One undoes the other.')).toBeNull()
    fireEvent.click(screen.getByText('Each graph is the other one, read a different way'))
    expect(screen.getByText('Correct!')).toBeTruthy()
    expect(screen.getByText('One undoes the other.')).toBeTruthy()
    expect(screen.getByText(/Saved to your notebook/)).toBeTruthy()
    expect(screen.queryByText('✓ mastered')).toBeNull()
  })

  it('a right-shaped sketch and a close guess get the quiet mastered check', () => {
    localStorage.clear()
    playThrough((x) => fPrime(x) * 1.2, 4.4)
    expect(screen.getByText('right shape')).toBeTruthy()
    expect(entries()[0]).toMatchObject({ misconception: null })
    fireEvent.click(screen.getByText('One more picture →'))
    fireEvent.click(screen.getByText('Each graph is the other one, read a different way'))
    expect(screen.getByText('✓ mastered')).toBeTruthy()
  })

  it('never uses betting words or points', () => {
    localStorage.clear()
    const { container } = render(<Session onDone={() => {}} />)
    const text = container.textContent!.toLowerCase()
    for (const w of [/\bbet(s|ting)?\b/, /lock it in/, /called it/, /how sure/, /\bxp\b/, /\d+\s*(pts|points?)\b/, /\bscore\b/]) expect(text).not.toMatch(w) // scores, not "a point on the curve"
  })

  it('opens on a course menu: Calc 1, 2 and 3, with the topics not built yet marked', () => {
    localStorage.clear()
    render(<Session onDone={() => {}} />)
    expect(screen.getByText('What do you want to practice?')).toBeTruthy()
    for (const c of ['Calc 1', 'Calc 2', 'Calc 3']) expect(screen.getByRole('heading', { name: c })).toBeTruthy()
    expect((screen.getByRole('button', { name: /^Slices of a surface/ }) as HTMLButtonElement).disabled).toBe(false)
    expect((screen.getByRole('button', { name: /^Taylor polynomials/ }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getAllByText('coming next').length).toBeGreaterThan(5)
  })

  it('Derivatives > The slope of a curve ends on its own mistake card with Finish', () => {
    localStorage.clear()
    render(<Session onDone={() => {}} />)
    pickTopic(/^The slope of a curve/)
    expect(screen.getByText('Calculus · The slope of a curve')).toBeTruthy()
    draw(f)
    fireEvent.click(screen.getByText('Check it with a tangent →'))
    const chart = screen.getByLabelText('drag the point along the curve')
    fireEvent.pointerDown(chart, { clientX: px(0.2), clientY: 100, pointerId: 2 })
    fireEvent.pointerMove(chart, { clientX: px(4), clientY: 100, pointerId: 2 })
    fireEvent.pointerUp(chart, { pointerId: 2 })
    fireEvent.click(screen.getByText('What did my pencil get wrong? →'))
    expect(screen.getByText('Slope = height of the curve')).toBeTruthy()
    expect(screen.queryByText(/More rectangles/)).toBeNull()
    expect(screen.getByText(/Saved to your notebook/)).toBeTruthy()
    expect(entries()[0]).toMatchObject({ session: 'calculus', misconception: 'slope-is-height', calcTopic: 'slope' })
    fireEvent.click(screen.getByText('← All calculus topics'))
    expect(screen.getByText('What do you want to practice?')).toBeTruthy()
  })

  it('Calc 3 > Slices of a surface: two partial-derivative questions, then find the flat spot', () => {
    localStorage.clear()
    render(<Session onDone={() => {}} />)
    pickTopic(/^Slices of a surface/)
    expect(screen.getByRole('img', { name: /3D surface/ })).toBeTruthy()
    // +x from (1, −1) is downhill; "uphill" is named and you try again
    fireEvent.click(screen.getByRole('button', { name: 'uphill' }))
    expect(screen.getByText(/Not quite/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'downhill' }))
    expect(screen.getByText(/∂f\/∂x = -0\.91/)).toBeTruthy()
    // +y from (1, −1) is uphill
    fireEvent.click(screen.getByRole('button', { name: 'uphill' }))
    expect(screen.getByText(/move the dot to where/)).toBeTruthy()
    fireEvent.change(screen.getByLabelText('move the dot in x'), { target: { value: '0' } })
    expect(screen.queryByText(/you’re on top of the hill/)).toBeNull()
    fireEvent.change(screen.getByLabelText('move the dot in y'), { target: { value: '0' } })
    expect(screen.getByText(/you’re on top of the hill/)).toBeTruthy()
    expect(entries()[0]).toMatchObject({ session: 'calculus', misconception: 'partial-wrong-way', calcTopic: 'surface' })
  })
})
