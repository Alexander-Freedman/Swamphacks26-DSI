// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { entries, notebook } from '../../notebook'
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

  it('Calc 3 > The gradient: "straight at the top" and "steeper higher up" are named; walking the arrow reaches the top', () => {
    localStorage.clear()
    render(<Session onDone={() => {}} />)
    pickTopic(/^The gradient/)
    expect(screen.getByText('The gradient.')).toBeTruthy()
    expect(screen.getByRole('img', { name: /3D surface z = f\(x, y\), a long hill/ })).toBeTruthy()
    // A points at the top: named, with how much it climbs; try again
    fireEvent.click(screen.getByRole('button', { name: 'arrow A' }))
    expect(screen.getByText(/Not quite/)).toBeTruthy()
    expect(screen.getByText(/A points straight at the top, but walking that way climbs only 0\.99/)).toBeTruthy()
    expect((screen.getByRole('button', { name: /arrow A/ }) as HTMLButtonElement).disabled).toBe(true)
    // C runs level: wrong, but not a named idea
    fireEvent.click(screen.getByRole('button', { name: 'arrow C' }))
    expect(screen.getByText(/your height stays the same/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'arrow B' }))
    expect(screen.getByText('Correct!')).toBeTruthy()
    expect(screen.getByText(/B climbs 1\.23 per step/)).toBeTruthy()
    // the gradient and its two parts, tied to the slices
    expect(screen.getByText(/∂f\/∂x =/)).toBeTruthy()
    expect(screen.getAllByText('-0.55').length).toBeGreaterThan(1)
    expect(screen.getAllByText('-1.10').length).toBeGreaterThan(1)
    expect(screen.getByRole('img', { name: /slice along y: slope -1\.10/ })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /It gets longer/ }))
    expect(screen.getByText(/Height isn’t steepness/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /It shrinks to nothing/ }))
    expect(screen.getByText(/Keep stepping until the arrow is gone/)).toBeTruthy()
    expect(screen.queryByText(/Saved to your notebook/)).toBeNull()
    for (let k = 0; k < 20 && !screen.queryByText(/You’re on top/); k++) fireEvent.click(screen.getByRole('button', { name: 'Take a step along the arrow' }))
    expect(screen.getByText(/You’re on top/)).toBeTruthy()
    expect(screen.getByText(/Saved to your notebook/)).toBeTruthy()
    expect(screen.getByText(/Caught: “Steepest = straight at the top” and “Steeper the higher you go”/)).toBeTruthy()
    expect(screen.queryByText('✓ mastered')).toBeNull()
    expect(entries()).toHaveLength(1)
    expect(entries()[0]).toMatchObject({ session: 'calculus', misconception: 'gradient-points-at-peak', calcTopic: 'gradient' })
    expect((entries()[0] as unknown as { mastered: boolean }).mastered).toBe(false)
    expect(notebook()[0].label).toBe('Steepest = straight at the top')
  })

  it('Calc 3 > The gradient: right first time is mastered', () => {
    localStorage.clear()
    render(<Session onDone={() => {}} />)
    pickTopic(/^The gradient/)
    fireEvent.click(screen.getByRole('button', { name: 'arrow B' }))
    fireEvent.click(screen.getByRole('button', { name: /It shrinks to nothing/ }))
    let steps = 0
    while (!screen.queryByText(/You’re on top/) && steps < 20) {
      fireEvent.click(screen.getByRole('button', { name: 'Take a step along the arrow' }))
      steps++
    }
    expect(steps).toBeLessThanOrEqual(10)
    expect(screen.getByText('✓ mastered')).toBeTruthy()
    expect(entries()[0]).toMatchObject({ misconception: null, calcTopic: 'gradient' })
    expect((entries()[0] as unknown as { mastered: boolean }).mastered).toBe(true)
  })

  // the volume bar is 0..14 over 640 − 28 px starting at 14 (jsdom measures 0 wide)
  const guessVolume = (v: number) => {
    const bar = screen.getByLabelText('your volume guess, in cubic units')
    fireEvent.pointerDown(bar, { clientX: 14 + (v / 14) * 612, clientY: 40, pointerId: 4 })
    fireEvent.pointerUp(bar, { pointerId: 4 })
  }

  it('Calc 3 > Volume under a surface: "more columns = more volume" is named; the sums close in on 8', () => {
    localStorage.clear()
    render(<Session onDone={() => {}} />)
    pickTopic(/^Volume under a surface/)
    expect(screen.getByText('Volume under a surface.')).toBeTruthy()
    expect(screen.getByText('10.50')).toBeTruthy()
    expect((screen.getByText('Drag the pencil on the bar first') as HTMLButtonElement).disabled).toBe(true)
    guessVolume(11)
    expect(screen.getByText('11.0')).toBeTruthy()
    fireEvent.click(screen.getByText('Use thinner columns →'))

    // thinner columns: "bigger" is the named idea; try again
    fireEvent.click(screen.getByRole('button', { name: 'Bigger' }))
    expect(screen.getByText(/Not quite/)).toBeTruthy()
    expect(screen.getByText(/they trim that extra/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Smaller' }))
    expect(screen.getByText('Correct!')).toBeTruthy()
    expect(screen.getByText('4 × 4 = 16 columns')).toBeTruthy()
    expect(screen.getAllByText('9.38').length).toBeGreaterThan(0)
    expect(screen.queryByText(/exact volume is/)).toBeNull()

    // every grid you try shows its number; 40 × 40 brings out the exact volume and reads the guess
    const slider = screen.getByLabelText(/Columns per side/)
    fireEvent.change(slider, { target: { value: '5' } })
    expect(screen.getByText('10 × 10 = 100 columns')).toBeTruthy()
    expect(screen.getAllByText('8.58').length).toBeGreaterThan(0)
    expect(screen.queryByText(/Saved to your notebook/)).toBeNull()
    fireEvent.change(slider, { target: { value: '9' } })
    expect(screen.getByText('40 × 40 = 1600 columns')).toBeTruthy()
    expect(screen.getAllByText('8.15').length).toBeGreaterThan(0)
    expect(screen.getByText('exact', { selector: '.calc-chip' })).toBeTruthy()
    expect(screen.getByText(/at or above even the 2 × 2 total/)).toBeTruthy()
    expect(screen.getByText(/Caught: “More columns = more volume”/)).toBeTruthy()
    expect(entries()).toHaveLength(1)
    expect(entries()[0]).toMatchObject({ session: 'calculus', misconception: 'more-columns-more-volume', calcTopic: 'double', guess: 11 })
    expect(notebook()[0].label).toBe('More columns = more volume')
  })

  it('Calc 3 > Volume under a surface: a close guess and the right prediction are mastered', () => {
    localStorage.clear()
    render(<Session onDone={() => {}} />)
    pickTopic(/^Volume under a surface/)
    guessVolume(8.6)
    fireEvent.click(screen.getByText('Use thinner columns →'))
    fireEvent.click(screen.getByRole('button', { name: 'Smaller' }))
    fireEvent.change(screen.getByLabelText(/Columns per side/), { target: { value: '9' } })
    expect(screen.getByText(/within 15% of the exact volume/)).toBeTruthy()
    expect(screen.getByText('✓ mastered')).toBeTruthy()
    expect(entries()[0]).toMatchObject({ misconception: null, calcTopic: 'double' })
    expect((entries()[0] as unknown as { mastered: boolean }).mastered).toBe(true)
  })

  it('Calc 1 > What a limit is: "a hole means no limit" is named; the jump has no limit', () => {
    localStorage.clear()
    render(<Session onDone={() => {}} />)
    pickTopic(/^What a limit is/)
    expect(screen.getByText('What a limit is.')).toBeTruthy()
    expect(screen.queryByRole('group', { name: 'what is the limit' })).toBeNull()
    fireEvent.change(screen.getByLabelText('zoom in on x = 2'), { target: { value: '100' } })
    expect(screen.getAllByText('4.001').length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: /There’s a hole, so there is no limit/ }))
    expect(screen.getByText(/Not quite/)).toBeTruthy()
    expect(screen.getByText(/Both sides close in on 4/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /the limit is 4/ }))
    expect(screen.getByText('Correct!')).toBeTruthy()
    fireEvent.click(screen.getByText('Now a curve that jumps →'))
    expect(screen.queryByRole('group', { name: 'what is the limit' })).toBeNull()
    fireEvent.change(screen.getByLabelText('zoom in on x = 2'), { target: { value: '100' } })
    expect(screen.getByText('they never meet')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /The limit is 5/ }))
    expect(screen.getByText(/The dot is the value AT x = 2/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /No limit: the two sides disagree/ }))
    expect(screen.getByText(/Saved to your notebook/)).toBeTruthy()
    expect(screen.getByText(/Caught: “A hole means no limit” and “Limit = the value at the point”/)).toBeTruthy()
    expect(entries()[0]).toMatchObject({ session: 'calculus', misconception: 'limit-needs-the-point', calcTopic: 'limit' })
    // one card per entry: the first mistake named is the one saved
    expect(notebook().map((c) => c.label)).toEqual(['A hole means no limit'])
  })

  it('Calc 1 > Chain rule: "the rates add" is named; y stands still where the outside rate is 0', () => {
    localStorage.clear()
    render(<Session onDone={() => {}} />)
    pickTopic(/^Chain rule/)
    expect(screen.getByText('The chain rule.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /5: the two rates add up/ }))
    expect(screen.getByText(/That’s 2 lots of 3, not 2 plus 3/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /6: the stretches multiply/ }))
    expect(screen.getByText(/3 · 2 = 6/)).toBeTruthy()
    expect(screen.getByText('×6')).toBeTruthy()
    fireEvent.click(screen.getByText(/Now a curvy one/))
    expect(screen.getByText(/where y stands still/)).toBeTruthy()
    fireEvent.change(screen.getByLabelText('move x'), { target: { value: '1' } })
    expect(screen.queryByText(/Saved to your notebook/)).toBeNull()
    fireEvent.change(screen.getByLabelText('move x'), { target: { value: '1.25' } })
    expect(screen.getByText(/0 times anything is 0/)).toBeTruthy()
    expect(screen.getByText(/Caught: “Chain rule: the rates add”/)).toBeTruthy()
    expect(entries()[0]).toMatchObject({ misconception: 'chain-rates-add', calcTopic: 'chain' })
  })

  it('Calc 1 > Maximums and minimums: a wrong cut is just wrong, "slope 0 means a maximum" is named', () => {
    localStorage.clear()
    render(<Session onDone={() => {}} />)
    pickTopic(/^Maximums and minimums/)
    expect(screen.getByText('Maximums and minimums.')).toBeTruthy()
    expect((screen.getByLabelText('the cut, x') as HTMLInputElement).disabled).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'cut 1' }))
    expect(screen.getByText(/A cut of 1 makes a box of 100/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'cut 2' }))
    expect(screen.getByText(/8 × 8 × 2 box: 128/)).toBeTruthy()
    const cut = screen.getByLabelText('the cut, x')
    fireEvent.change(cut, { target: { value: '6' } })
    expect(screen.getByText(/Which flat spot is the biggest box/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Both: slope 0 always means a maximum/ }))
    expect(screen.getByText(/the box holds nothing/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /x = 2: the top of the hill/ }))
    expect(screen.getByText(/slide the cut back to the top/)).toBeTruthy()
    expect(screen.queryByText(/Saved to your notebook/)).toBeNull()
    fireEvent.change(cut, { target: { value: '2.1' } })
    expect(screen.getByText(/Caught: “Slope 0 means a maximum”/)).toBeTruthy()
    expect(entries()[0]).toMatchObject({ misconception: 'flat-means-max', calcTopic: 'optimize', guess: 2 })
    expect((entries()[0] as unknown as { mastered: boolean }).mastered).toBe(false)
  })

  it('Calc 1 > Related rates: "both ends move at the same speed" is named; drag past x = y', () => {
    localStorage.clear()
    render(<Session onDone={() => {}} />)
    pickTopic(/^Related rates/)
    expect(screen.getByText('Related rates.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /The same, 1 m\/s/ }))
    expect(screen.getByText(/two different motions/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Slower than the foot' }))
    expect(screen.getByText(/Slower: 0\.75 m\/s/)).toBeTruthy()
    expect(screen.getByText('0.75')).toBeTruthy()
    const foot = screen.getByLabelText('how far out the foot is')
    fireEvent.change(foot, { target: { value: '3.4' } })
    expect(screen.queryByText(/Saved to your notebook/)).toBeNull()
    fireEvent.change(foot, { target: { value: '4.2' } })
    expect(screen.getByText(/faster than the foot\. As the top nears the floor/)).toBeTruthy()
    expect(screen.getByText(/Caught: “Both ends of the ladder move at the same speed”/)).toBeTruthy()
    expect(entries()[0]).toMatchObject({ misconception: 'ladder-same-speed', calcTopic: 'related' })
  })

  it('Calc 1: each new topic is mastered on a clean run', () => {
    localStorage.clear()
    const { unmount } = render(<Session onDone={() => {}} />)
    pickTopic(/^Related rates/)
    fireEvent.click(screen.getByRole('button', { name: 'Slower than the foot' }))
    fireEvent.change(screen.getByLabelText('how far out the foot is'), { target: { value: '4' } })
    expect(screen.getByText('✓ mastered')).toBeTruthy()
    expect(entries()[0]).toMatchObject({ misconception: null, calcTopic: 'related' })
    unmount()
    render(<Session onDone={() => {}} />)
    pickTopic(/^Chain rule/)
    fireEvent.click(screen.getByRole('button', { name: /6: the stretches multiply/ }))
    fireEvent.click(screen.getByText(/Now a curvy one/))
    fireEvent.change(screen.getByLabelText('move x'), { target: { value: '1.26' } })
    expect(screen.getByText('✓ mastered')).toBeTruthy()
    expect(entries()).toHaveLength(2)
    expect(entries()[1]).toMatchObject({ misconception: null, calcTopic: 'chain' })
  })
})
