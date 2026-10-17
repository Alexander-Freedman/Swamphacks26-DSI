// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CoinSession } from './CoinSession'

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
    expect(lock.disabled).toBe(false)
    fireEvent.click(lock)
    await act(async () => vi.advanceTimersByTime(50))

    expect(screen.getByText('Now a real coin. Flip it.')).toBeTruthy()
    expect(screen.getByText('6.98')).toBeTruthy() // exact mean in ink
    expect(screen.getByText('97.2%')).toBeTruthy() // exact P(run of 5+)
    expect(screen.getByText(/real average 6\.98 \(exact\)/)).toBeTruthy() // truth line is labeled
    fireEvent.click(screen.getByText('Run 1,000 times'))
    expect(screen.getByText('1,000')).toBeTruthy() // a fresh sample of exactly 1,000

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

    fireEvent.click(screen.getByRole('button', { name: /^A: / }))
    expect(screen.getByText(/B was the real coin/)).toBeTruthy()
    expect(screen.getByText(/In 20 real flips/)).toBeTruthy()

    fireEvent.click(screen.getByText('Done'))
    expect(done).toHaveBeenCalled()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  }, 30000)
})
