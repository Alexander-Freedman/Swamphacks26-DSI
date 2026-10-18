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
  // no matchMedia in jsdom; say motion is reduced, so the "do it for me" buttons jump to the end instead of animating
  window.matchMedia = ((q: string) => ({ matches: q.includes('reduced-motion') })) as unknown as typeof window.matchMedia
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
})

describe('Calc 2: integrals, harder', () => {
  it('u-substitution: "the stretch changes the area" is named; the area reads 1.000 all the way through the stretch', () => {
    localStorage.clear()
    render(<Session onDone={() => {}} />)
    pickTopic(/^u-substitution/)
    expect(screen.getByText('u-substitution.')).toBeTruthy()
    expect(screen.getByText('1.000')).toBeTruthy()
    expect(screen.getByText('y = 2x·cos(x²)')).toBeTruthy()
    expect(screen.queryByLabelText(/Stretch the axis/)).toBeNull()
    // bigger: named, with the du = 2x dx reason; try again
    fireEvent.click(screen.getByRole('button', { name: /^Bigger/ }))
    expect(screen.getByText(/Not quite/)).toBeTruthy()
    expect(screen.getByText(/shorter by exactly the same factor/)).toBeTruthy()
    expect((screen.getByRole('button', { name: /Bigger/ }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'The same' }))
    expect(screen.getByText('Correct!')).toBeTruthy()
    expect(screen.queryByText(/Saved to your notebook/)).toBeNull()
    // part way: still 1.000, the base wider than 1.25
    const slider = screen.getByLabelText(/Stretch the axis/)
    fireEvent.change(slider, { target: { value: '50' } })
    expect(screen.getByText('50%')).toBeTruthy()
    expect(screen.getByText('stretching…')).toBeTruthy()
    expect(screen.getByText('1.000')).toBeTruthy()
    expect(screen.getAllByText('1.40').length).toBeGreaterThan(0)
    expect(screen.queryByText(/Saved to your notebook/)).toBeNull()
    // all the way: the top picture is cos(u) on [0, π/2], same area
    fireEvent.change(slider, { target: { value: '100' } })
    expect(screen.getAllByText('y = cos(u)')).toHaveLength(2)
    expect(screen.getAllByText('1.57').length).toBeGreaterThan(0)
    expect(screen.getByText('1.000')).toBeTruthy()
    expect(screen.getByText(/sin\(π\/2\) − sin\(0\) = 1/)).toBeTruthy()
    expect(screen.getByText(/Saved to your notebook/)).toBeTruthy()
    expect(screen.getByText(/Caught: “Stretching the axis changes the area”/)).toBeTruthy()
    expect(screen.queryByText('✓ mastered')).toBeNull()
    expect(entries()).toHaveLength(1)
    expect(entries()[0]).toMatchObject({ session: 'calculus', misconception: 'usub-changes-area', calcTopic: 'usub' })
    expect((entries()[0] as unknown as { mastered: boolean }).mastered).toBe(false)
    expect(notebook()[0].label).toBe('Stretching the axis changes the area')
  })

  it('u-substitution: "the same" first time, then the stretch, is mastered', () => {
    localStorage.clear()
    render(<Session onDone={() => {}} />)
    pickTopic(/^u-substitution/)
    fireEvent.click(screen.getByRole('button', { name: 'The same' }))
    fireEvent.click(screen.getByText('stretch it for me')) // reduced motion in jsdom: jumps to the end
    expect(screen.getByText('100%')).toBeTruthy()
    expect(screen.getByText('✓ mastered')).toBeTruthy()
    expect(entries()[0]).toMatchObject({ misconception: null, calcTopic: 'usub' })
    expect((entries()[0] as unknown as { mastered: boolean }).mastered).toBe(true)
  })

  // the chart is 640 wide (jsdom measures 0): x from −1.6 to 2.6 over 600 px starting at 30
  const encPx = (x: number) => 30 + ((x + 1.6) / 4.2) * 600

  it('Area enclosed by two curves: "area under the top curve" is named; the strip sweeps, the strips settle on 4.5', () => {
    localStorage.clear()
    render(<Session onDone={() => {}} />)
    pickTopic(/^Area enclosed by two curves/)
    expect(screen.getByText('Area enclosed by two curves.')).toBeTruthy()
    // which is on top: the parabola is wrong but not a named idea
    fireEvent.click(screen.getByRole('button', { name: 'The parabola y = x²' }))
    expect(screen.getByText(/the line is at 2, the parabola at 0/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'The line y = x + 2' }))
    expect(screen.getByText('Correct!')).toBeTruthy()
    // the area: the top curve alone is the named idea
    fireEvent.click(screen.getByRole('button', { name: 'The area under the line' }))
    expect(screen.getByText(/including the 3 squares under the parabola/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'The area under the line minus the area under the parabola' }))
    expect(screen.getByText(/Drag the strip from one crossing to the other/)).toBeTruthy()
    expect((screen.getByText('Sweep the whole region first') as HTMLButtonElement).disabled).toBe(true)
    // drag the strip across: its height is top − bottom, 0 at the crossing
    const chart = screen.getByLabelText('drag the strip between the curves')
    fireEvent.pointerDown(chart, { clientX: encPx(-1), clientY: 100, pointerId: 5 })
    expect(screen.getByText('strip at x = -1.00')).toBeTruthy()
    fireEvent.pointerMove(chart, { clientX: encPx(0.5), clientY: 100, pointerId: 5 })
    expect(screen.getByText('strip at x = 0.50')).toBeTruthy()
    expect(screen.getByText('2.25')).toBeTruthy()
    expect(screen.getByText(/swept 50%/)).toBeTruthy()
    fireEvent.pointerMove(chart, { clientX: encPx(2), clientY: 100, pointerId: 5 })
    fireEvent.pointerUp(chart, { pointerId: 5 })
    expect(screen.getByText('Whole region swept.')).toBeTruthy()
    fireEvent.click(screen.getByText('Fill it with strips →'))
    expect(screen.getByText('6.750')).toBeTruthy()
    expect(screen.queryByText(/Saved to your notebook/)).toBeNull()
    fireEvent.change(screen.getByLabelText(/Strips:/), { target: { value: '40' } })
    expect(screen.getByText('40 strips')).toBeTruthy()
    expect(screen.getByText('4.501')).toBeTruthy()
    expect(screen.getByText('exact', { selector: '.calc-chip' })).toBeTruthy()
    expect(screen.getByText(/Saved to your notebook/)).toBeTruthy()
    expect(screen.getByText(/Caught: “Area between = area under the top curve”/)).toBeTruthy()
    expect(screen.queryByText('✓ mastered')).toBeNull()
    expect(entries()).toHaveLength(1)
    expect(entries()[0]).toMatchObject({ session: 'calculus', misconception: 'enclosed-top-only', calcTopic: 'enclosed' })
    expect(notebook()[0].label).toBe('Area between = area under the top curve')
  })

  it('Area enclosed by two curves: both answers right first time is mastered', () => {
    localStorage.clear()
    render(<Session onDone={() => {}} />)
    pickTopic(/^Area enclosed by two curves/)
    fireEvent.click(screen.getByRole('button', { name: 'The line y = x + 2' }))
    fireEvent.click(screen.getByRole('button', { name: 'The area under the line minus the area under the parabola' }))
    const chart = screen.getByLabelText('drag the strip between the curves')
    fireEvent.pointerDown(chart, { clientX: encPx(2), clientY: 100, pointerId: 6 })
    fireEvent.pointerMove(chart, { clientX: encPx(-1), clientY: 100, pointerId: 6 })
    fireEvent.pointerUp(chart, { pointerId: 6 })
    fireEvent.click(screen.getByText('Fill it with strips →'))
    fireEvent.change(screen.getByLabelText(/Strips:/), { target: { value: '80' } })
    expect(screen.getByText('✓ mastered')).toBeTruthy()
    expect(entries()[0]).toMatchObject({ misconception: null, calcTopic: 'enclosed' })
    expect((entries()[0] as unknown as { mastered: boolean }).mastered).toBe(true)
  })

  it('Volumes of revolution: spin a full turn, "π · r · thickness" is named, the discs settle on 8π', () => {
    localStorage.clear()
    render(<Session onDone={() => {}} />)
    pickTopic(/^Volumes of revolution/)
    expect(screen.getByText('Volumes of revolution.')).toBeTruthy()
    expect(screen.getByRole('img', { name: /spun 0 degrees/ })).toBeTruthy()
    expect((screen.getByText('Spin it a full turn first') as HTMLButtonElement).disabled).toBe(true)
    fireEvent.change(screen.getByLabelText(/Spin:/), { target: { value: '180' } })
    expect(screen.getByRole('img', { name: /spun 180 degrees/ })).toBeTruthy()
    expect((screen.getByText('Spin it a full turn first') as HTMLButtonElement).disabled).toBe(true)
    fireEvent.change(screen.getByLabelText(/Spin:/), { target: { value: '360' } })
    expect(screen.getByText(/A full turn: the curve has swept out a solid/)).toBeTruthy()
    fireEvent.click(screen.getByText('Slice it into discs →'))
    expect(screen.getByRole('img', { name: /the last disc, from x = 3 to 4/ })).toBeTruthy()
    // not squaring the radius is the named idea; the strip's area is wrong but not named
    fireEvent.click(screen.getByRole('button', { name: 'π · 2 · 1 ≈ 6.28' }))
    expect(screen.getByText(/Not quite/)).toBeTruthy()
    expect(screen.getByText(/The radius gets squared/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '2 · 1 = 2, the strip’s area' }))
    expect(screen.getByText(/flat strip before it spins/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'π · 2² · 1 ≈ 12.57' }))
    expect(screen.getByText('Correct!')).toBeTruthy()
    expect(screen.getByText('1 disc', { selector: '.calc-tag' })).toBeTruthy()
    expect(screen.getAllByText('50.27').length).toBeGreaterThan(0)
    expect(screen.queryByText(/Saved to your notebook/)).toBeNull()
    const slider = screen.getByLabelText(/Discs:/)
    fireEvent.change(slider, { target: { value: '3' } })
    expect(screen.getByText('8 discs', { selector: '.calc-tag' })).toBeTruthy()
    expect(screen.getAllByText('28.27').length).toBeGreaterThan(0)
    expect(screen.queryByText(/exact volume is/)).toBeNull()
    fireEvent.change(slider, { target: { value: '6' } })
    expect(screen.getByText('64 discs', { selector: '.calc-tag' })).toBeTruthy()
    expect(screen.getAllByText('25.53').length).toBeGreaterThan(0)
    expect(screen.getByText('exact', { selector: '.calc-chip' })).toBeTruthy()
    expect(screen.getByText(/V = π ∫₀⁴ \(√x\)² dx/)).toBeTruthy()
    expect(screen.getByText(/Saved to your notebook/)).toBeTruthy()
    expect(screen.getByText(/Caught: “Disc volume = π · r · thickness”/)).toBeTruthy()
    expect(screen.queryByText('✓ mastered')).toBeNull()
    expect(entries()).toHaveLength(1)
    expect(entries()[0]).toMatchObject({ session: 'calculus', misconception: 'disc-radius-not-squared', calcTopic: 'revolution' })
    expect(notebook()[0].label).toBe('Disc volume = π · r · thickness')
  })

  it('Volumes of revolution: the right disc first time is mastered', () => {
    localStorage.clear()
    render(<Session onDone={() => {}} />)
    pickTopic(/^Volumes of revolution/)
    fireEvent.click(screen.getByText('spin it for me')) // reduced motion in jsdom: jumps to a full turn
    fireEvent.click(screen.getByText('Slice it into discs →'))
    fireEvent.click(screen.getByRole('button', { name: 'π · 2² · 1 ≈ 12.57' }))
    fireEvent.change(screen.getByLabelText(/Discs:/), { target: { value: '6' } })
    expect(screen.getByText('✓ mastered')).toBeTruthy()
    expect(entries()[0]).toMatchObject({ misconception: null, calcTopic: 'revolution' })
    expect((entries()[0] as unknown as { mastered: boolean }).mastered).toBe(true)
  })
})
