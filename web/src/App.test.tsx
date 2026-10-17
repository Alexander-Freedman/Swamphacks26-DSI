// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { Reveal } from './components/Reveal'
import { showcaseRound } from './rounds'
import { computeTruth } from './truth'

beforeEach(() => history.replaceState(null, '', import.meta.env.BASE_URL))
afterEach(cleanup)

describe('coin streak on Home', () => {
  it('shows one coin entry, and it opens the coin session', () => {
    render(<App />)
    // the old "Streaks in coin flips" round shares the coin-streak slug, so the session replaces it
    expect(screen.queryByText('Streaks in coin flips')).toBeNull()
    expect(screen.getAllByText('Be a coin')).toHaveLength(1)
    expect(screen.getByText(/Tap out 20 flips/)).toBeTruthy()
    fireEvent.click(screen.getByText('Be a coin'))
    expect(screen.getByText('Be a coin. Tap out 20 flips.')).toBeTruthy()
    expect((screen.getByText('Lock it in') as HTMLButtonElement).disabled).toBe(true)
  })
})

describe('other showcases', () => {
  it('positive test reveals 9.2% with the icon array + card', async () => {
    vi.useFakeTimers()
    render(<App />)
    fireEvent.click(screen.getByText(/positive/i))
    fireEvent.change(screen.getByLabelText('your guess'), { target: { value: '90' } })
    fireEvent.click(screen.getByText('certain'))
    fireEvent.click(screen.getByText('Lock it in'))
    await act(async () => vi.advanceTimersByTime(500))
    expect(screen.getByLabelText(/of 1000 test positive; 9 of them are sick/)).toBeTruthy()
    expect(screen.getByText(/reality: 9\.2%/)).toBeTruthy()
    expect(screen.getByLabelText(/your guess 90% vs reality 9\.2%, 80\.8 points apart/)).toBeTruthy()
    expect(document.activeElement?.className).toBe('verdict-row')
    expect(screen.getByText('This looks like…')).toBeTruthy()
    vi.useRealTimers()
  })
  // Home opens the birthday session now; the round's curve reveal is still what other curve rounds use.
  it('birthday round reveals 23 on the curve', () => {
    const round = showcaseRound('birthday')!
    const item = round.items[0]
    render(<Reveal item={item} round={round} answer={{ value: 183, optionId: null, confidence: 'pretty sure' }} truth={computeTruth(item)} signals={{}} />)
    expect(screen.getByLabelText(/reaches 50% at 23/)).toBeTruthy()
    expect(screen.getByText('your guess: 183 →')).toBeTruthy()
    expect(screen.getByText('Way off')).toBeTruthy()
  })
})
