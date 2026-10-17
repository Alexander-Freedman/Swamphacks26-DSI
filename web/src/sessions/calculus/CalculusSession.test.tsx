// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import App from '../../App'
import { entries, notebook } from '../../notebook'
import { session } from './index'

vi.setConfig({ testTimeout: 30000 })
beforeAll(() => {
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
})
afterEach(cleanup)

const Session = session.Component
const key = (el: Element, k: string, times = 1, shiftKey = false) => {
  for (let i = 0; i < times; i++) fireEvent.keyDown(el, { key: k, shiftKey })
}

/** Points editor: set each handle (x = -2 … 2 by 0.5) to `fn(x)` with the arrow keys (0.1 per press). */
function sketchWithKeys(fn: (x: number) => number) {
  fireEvent.click(screen.getByText('points (keys)'))
  const handles = screen.getAllByRole('slider').filter((h) => h.getAttribute('aria-label')?.startsWith('slope at'))
  expect(handles).toHaveLength(9)
  handles.forEach((h, i) => {
    const x = -2 + i * 0.5
    const n = Math.round(fn(x) * 10)
    key(h, n >= 0 ? 'ArrowUp' : 'ArrowDown', Math.abs(n))
  })
}

function playThrough(sketch: (x: number) => number, areaKeys: number, picks: string[]) {
  // 1: drag the point with keys, shrink h
  const dot = screen.getByRole('slider', { name: /point on the curve/ })
  key(dot, 'ArrowRight', 2)
  expect(dot.getAttribute('aria-valuenow')).toBe('-1.4')
  const next1 = screen.getByText('Next: sketch the slope →') as HTMLButtonElement
  expect(next1.disabled).toBe(true)
  fireEvent.change(screen.getByLabelText(/^h/), { target: { value: '100' } })
  expect(next1.disabled).toBe(false)
  fireEvent.click(next1)

  // 2: sketch with the points editor, then reveal
  expect(screen.getByText('Sketch the slope')).toBeTruthy()
  sketchWithKeys(sketch)
  fireEvent.click(screen.getByText('Show the real slope'))
  fireEvent.click(screen.getByText('Next: fill the area →'))

  // 3: guess the area on the bar, fill, push n up
  const bar = screen.getByRole('slider', { name: /your guess for the area/ })
  key(bar, 'ArrowUp', areaKeys) // from the middle (4), 0.1 per press; negative → down
  key(bar, 'ArrowDown', -areaKeys)
  fireEvent.click(screen.getByText('Fill it with rectangles'))
  const next3 = screen.getByText('Next: a moving car →') as HTMLButtonElement
  expect(next3.disabled).toBe(true)
  fireEvent.change(screen.getByLabelText(/^rectangles/), { target: { value: '60' } })
  fireEvent.click(next3)

  // 4: tap what's the same
  expect(screen.getByText('Same idea, a moving car')).toBeTruthy()
  for (const p of picks) fireEvent.click(screen.getByText(p))
}

const SLOPE = 'Slope of the top graph = height of the bottom one'
const AREA = 'Area under the bottom graph = height of the top one'
const SHAPE = 'The two graphs have the same shape'

describe('calculus session', () => {
  it('is on Home and opens', () => {
    render(<App />)
    fireEvent.click(screen.getByText('Slope and area, by hand'))
    expect(screen.getByText('Slope you can feel')).toBeTruthy()
  })

  it('a right run: no mistake, quiet mastered, saved', () => {
    localStorage.clear()
    const { container } = render(<Session onDone={() => {}} />)
    playThrough((x) => x * x - 1, -13, [SLOPE, AREA]) // area guess 4 - 1.3 = 2.7
    expect(container.textContent).toContain('Saved to your notebook.')
    expect(container.textContent).toContain('✓ mastered')
    const e = entries().at(-1)!
    expect(e.session).toBe('calculus')
    expect(e.misconception).toBeNull()
    expect(e.rematch).toBeNull()
  })

  it('tracing f names "derivative = height"; the box guess and the same-shape tap are caught too', () => {
    localStorage.clear()
    const { container } = render(<Session onDone={() => {}} />)
    playThrough((x) => x ** 3 / 3 - x, 40, [SHAPE, SLOPE, AREA]) // area guess 8 = the box
    expect(container.textContent).toContain('Counted the whole box')
    expect(container.textContent).toContain('Saved to your notebook.')
    expect(container.textContent).not.toContain('mastered')
    const e = entries().at(-1)! as unknown as Record<string, unknown>
    expect(e.misconception).toBe('derivative-is-height')
    expect(e.mistakes).toEqual(['derivative-is-height', 'whole-box', 'same-shape'])
    expect(notebook()[0].label).toBe('The derivative is the curve’s height')
  })

  it('a flipped sketch is "uphill and downhill swapped"', () => {
    render(<Session onDone={() => {}} />)
    const dot = screen.getByRole('slider', { name: /point on the curve/ })
    key(dot, 'End')
    fireEvent.change(screen.getByLabelText(/^h/), { target: { value: '90' } })
    fireEvent.click(screen.getByText('Next: sketch the slope →'))
    sketchWithKeys((x) => 1 - x * x)
    fireEvent.click(screen.getByText('Show the real slope'))
    expect(screen.getByText('Uphill and downhill swapped')).toBeTruthy()
  })

  it('has no betting language', () => {
    const { container } = render(<Session onDone={() => {}} />)
    const words = /\bbet\b|lock it in|called it|how sure/i
    expect(container.textContent).not.toMatch(words)
  })
})
