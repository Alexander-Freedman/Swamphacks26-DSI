// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CoinSession } from './CoinSession'
import { sampleLabel } from './hooks'

afterEach(cleanup)

const next = (re: RegExp) => fireEvent.click(screen.getByRole('button', { name: re }))

describe('coin streak session', () => {
  it('plays tap → lock → flip → compare → extremes → card → which is real', async () => {
    vi.useFakeTimers()
    // reduced motion: "run 1,000" lands at once
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), media: q }))
    const done = vi.fn()
    render(<CoinSession onDone={done} />)

    const lock = screen.getByText('Lock it in') as HTMLButtonElement
    expect(lock.disabled).toBe(true)
    // keys H and T tap the coin; alternate every flip (switch rate 100%)
    for (let i = 0; i < 20; i++) fireEvent.keyDown(window, { key: i % 2 ? 'T' : 'H' })
    expect(screen.getByText('20', { selector: '.stats b' })).toBeTruthy()
    // the row is full: 20 real flips deal in under it, with the tally
    expect(screen.getByText('a real coin, 20 flips')).toBeTruthy()
    expect(screen.getByText(/your longest:/).textContent).toMatch(/your longest: 1 · real: \d+/)
    expect(screen.getByText(/In 20 real flips the longest run averages 4\.66/)).toBeTruthy()
    fireEvent.click(screen.getByText('Flip again'))
    fireEvent.change(screen.getByLabelText('Longest run in 100 real flips?'), { target: { value: '3' } })
    // like the birthday session: pick how sure before locking
    expect(lock.disabled).toBe(true)
    expect(lock.textContent).toBe('Pick how sure you are')
    fireEvent.click(screen.getByRole('button', { name: 'certain' }))
    expect(lock.disabled).toBe(false)
    fireEvent.click(lock)
    await act(async () => vi.advanceTimersByTime(50))

    expect(screen.getByText('Now a real coin. Flip it.')).toBeTruthy()
    expect(screen.getByText('6.98')).toBeTruthy() // exact mean in ink
    expect(screen.getByText('97.2%')).toBeTruthy() // exact P(run of 5+)
    expect(screen.getByText(/real average 6\.98 \(exact\)/)).toBeTruthy() // truth line is labeled
    expect(screen.getByText(/you guessed/).textContent).toBe('you guessed 3 in a row (certain)')
    expect(screen.getByText(/^Flipped here: 1 run of 100 flips/)).toBeTruthy()
    fireEvent.click(screen.getByText('Run 1,000 times'))
    expect(screen.getByText(/^Simulated: 1,000 runs of 100 flips,/)).toBeTruthy() // a fresh sample of exactly 1,000
    // flipping after the batch is counted apart, never "1,001 runs"
    fireEvent.click(screen.getByText('Flip 100 again'))
    expect(screen.getByText(/^Simulated: 1,000 runs \+ 1 you flipped, of 100 flips each,/)).toBeTruthy()
    expect(document.body.textContent).not.toMatch(/NaN|1,001/)

    next(/your coin vs the real one/)
    expect(screen.getByText('Your coin vs the real coin')).toBeTruthy()
    expect(screen.getByText(/You switched 100% of the time/)).toBeTruthy()

    next(/push it to 10,000 flips/)
    fireEvent.click(screen.getByRole('button', { name: '10,000' }))
    expect(screen.getByText('13.62')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '10' }))
    expect(screen.getByText('3.66')).toBeTruthy()

    next(/what your taps say/)
    expect(screen.getAllByText('Random means evenly mixed').length).toBeGreaterThan(0)
    expect(screen.getByText(/A real coin goes past 3 in/)).toBeTruthy()
    expect(screen.getByText(/You said/).textContent).toBe('You said 3 (certain). A real 100 averages 6.98.')

    localStorage.clear()
    fireEvent.click(screen.getByRole('button', { name: /^A: / }))
    expect(screen.getByText(/B was the real coin/)).toBeTruthy()
    expect(screen.getByText(/In 20 real flips/)).toBeTruthy()
    // saved to the same notebook as the birthday session, once
    expect(screen.getByText('Saved.')).toBeTruthy()
    const saved = JSON.parse(localStorage.getItem('mm.sessions') ?? '[]')
    expect(saved).toHaveLength(1)
    expect(saved[0]).toMatchObject({ session: 'coin-streak', guess: 3, confidence: 'certain', misconception: 'random-means-evenly-mixed', rematch: 'wrong' })
    expect(document.body.textContent).not.toMatch(/NaN/)

    fireEvent.click(screen.getByText('Done'))
    expect(done).toHaveBeenCalled()
    expect(JSON.parse(localStorage.getItem('mm.sessions') ?? '[]')).toHaveLength(1)
    vi.useRealTimers()
    vi.unstubAllGlobals()
  }, 30000)

  it('keeps the 20-flip deal clean: extra taps, undo, clear, length toggles', () => {
    render(<CoinSession onDone={() => {}} />)
    const H = screen.getByRole('button', { name: 'Heads (key H)' })
    const flips = () => screen.getByText(/^flips/).textContent
    const realRow = () => screen.queryByText('a real coin, 20 flips')

    // a burst of taps past the end stops at exactly 20, mouse or keys
    for (let i = 0; i < 30; i++) fireEvent.click(H)
    expect(flips()).toBe('flips 20/20')
    for (let i = 0; i < 5; i++) fireEvent.keyDown(window, { key: 'T' })
    expect(flips()).toBe('flips 20/20')
    expect(realRow()).toBeTruthy()
    // a held key (auto-repeat) doesn't count
    fireEvent.click(screen.getByText('Clear'))
    fireEvent.keyDown(window, { key: 'H', repeat: true })
    expect(flips()).toBe('flips 0/20')

    for (let i = 0; i < 20; i++) fireEvent.click(H)
    expect(realRow()).toBeTruthy()
    // Undo (button or Backspace) takes the real row away; the 20th tap deals a fresh one
    fireEvent.keyDown(window, { key: 'Backspace' })
    expect(flips()).toBe('flips 19/20')
    expect(realRow()).toBeNull()
    fireEvent.keyDown(window, { key: 'T' })
    expect(realRow()).toBeTruthy()
    fireEvent.click(screen.getByText('Undo'))
    expect(realRow()).toBeNull()
    fireEvent.click(H)
    expect(realRow()).toBeTruthy()

    // clicking the length you're already on never wipes your row
    fireEvent.click(screen.getByRole('radio', { name: '20 flips' }))
    expect(flips()).toBe('flips 20/20')
    // 100 mid-row keeps the taps and carries on
    fireEvent.click(screen.getByRole('radio', { name: '100 flips' }))
    expect(flips()).toBe('flips 20/100')
    expect(screen.queryByText(/a real coin, 100 flips/)).toBeNull()
    fireEvent.click(H)
    expect(flips()).toBe('flips 21/100')
    // back to 20 cuts to 20 and deals at once
    fireEvent.click(screen.getByRole('radio', { name: '20 flips' }))
    expect(flips()).toBe('flips 20/20')
    expect(realRow()).toBeTruthy()
    expect(document.body.textContent).not.toMatch(/NaN/)
  }, 30000)
})

describe('sample label', () => {
  it('never adds flipped strips onto the 1,000 batch', () => {
    expect(sampleLabel(0, 1)).toBe('Flipped here: 1 run of 100 flips')
    expect(sampleLabel(0, 3)).toBe('Flipped here: 3 runs of 100 flips')
    expect(sampleLabel(1000, 0)).toBe('Simulated: 1,000 runs of 100 flips')
    expect(sampleLabel(1000, 2)).toBe('Simulated: 1,000 runs + 2 you flipped, of 100 flips each')
  })
})
