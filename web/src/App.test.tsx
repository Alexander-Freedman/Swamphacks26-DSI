// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { Reveal } from './components/Reveal'
import { showcaseRound } from './rounds'
import { computeTruth } from './truth'

beforeEach(() => history.replaceState(null, '', import.meta.env.BASE_URL))
afterEach(cleanup)

describe('Home cards', () => {
  it('shows only the subjects; birthday, coin and positive test are off Home', () => {
    render(<App />)
    const titles = [...document.querySelectorAll('.showcases.sessions .card-title')].map((t) => t.textContent)
    expect(titles).toEqual(['Organic chemistry', 'Calculus'])
    expect(screen.queryByText('You tested positive. Are you sick?')).toBeNull()
    expect(screen.queryByText('The birthday problem')).toBeNull()
    expect(screen.queryByText('Be a coin')).toBeNull()
    // the old "Streaks in coin flips" round shares the coin-streak slug, so it stays hidden too
    expect(screen.queryByText('Streaks in coin flips')).toBeNull()
  })

  it('the coin session still opens from its link', () => {
    history.replaceState(null, '', `${import.meta.env.BASE_URL}?session=coin-streak`)
    render(<App />)
    expect(screen.getByText('Be a coin. Tap out 20 flips.')).toBeTruthy()
    expect((screen.getByText('Show me') as HTMLButtonElement).disabled).toBe(true)
  })
})

describe('other showcases', () => {
  // Home opens the positive-test session now; the round's reveal is what icon-array rounds use.
  it('positive test reveals 9.2% with the icon array + card', () => {
    const round = showcaseRound('positive-test')!
    const item = round.items[0]
    render(<Reveal item={item} round={round} answer={{ value: 90, optionId: null, confidence: 'certain' }} truth={computeTruth(item)} signals={{}} />)
    expect(screen.getByLabelText(/of 1000 test positive; 9 of them are sick/)).toBeTruthy()
    expect(document.querySelector('.reality')!.textContent).toMatch(/Reality: 9\.2%/)
    expect(screen.getByLabelText(/your guess 90% vs reality 9\.2%, 80\.8 points apart/)).toBeTruthy()
    expect(document.activeElement?.className).toBe('verdict-row')
    expect(screen.getByText('This looks like…')).toBeTruthy()
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
