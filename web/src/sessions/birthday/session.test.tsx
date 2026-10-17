// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { entries, KEY, notebook } from '../../notebook'
import { session } from './index'
import { verdictOf } from './round'

afterEach(cleanup)
beforeEach(() => localStorage.removeItem(KEY))

/** Plays guess 180 → room → skip the drawing → reveal → the mistake card (B6). */
/** From the card (B6) through the compare screen (B7) to the rematch (B8). */
function cardToRematch() {
  fireEvent.click(screen.getByText(/Got it/))
  fireEvent.click(screen.getByText('23 & 120'))
  fireEvent.click(screen.getByText(/pairs grow much faster than people/))
  fireEvent.click(screen.getByText('Try it on a new one →'))
}

function toCard() {
  vi.useFakeTimers()
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
  const C = session.Component
  render(<C onDone={() => {}} />)
  fireEvent.change(screen.getByLabelText('your guess, people in the room'), { target: { value: '180' } })
  fireEvent.click(screen.getByText('Show me'))
  act(() => vi.advanceTimersByTime(400))
  for (let k = 0; k < 5; k++) fireEvent.click(screen.getByText('+5'))
  fireEvent.click(screen.getByText(/draw your curve/))
  fireEvent.click(screen.getByText(/skip: draw a straight line/))
  act(() => vi.advanceTimersByTime(4000))
  fireEvent.click(screen.getByText(/What did I get wrong/))
  act(() => vi.advanceTimersByTime(400))
  vi.useRealTimers()
}

describe('birthday notebook entry (#159)', () => {
  it('no confidence picker: the guess only needs the slider', () => {
    render(<session.Component onDone={() => {}} />)
    expect(screen.queryByText('how sure?')).toBeNull()
    expect(screen.queryByText('pretty sure')).toBeNull()
    expect((screen.getByText('Move the slider first') as HTMLButtonElement).disabled).toBe(true)
    fireEvent.change(screen.getByLabelText('your guess, people in the room'), { target: { value: '180' } })
    expect((screen.getByText('Show me') as HTMLButtonElement).disabled).toBe(false)
  })

  it('saves the mistake when the card shows, once, even with no rematch', () => {
    toCard()
    expect(screen.getByText('What happened in your head')).toBeTruthy()
    expect(document.querySelector('.bday-stamp')!.textContent).toBe('Way off')
    const saved = entries()
    expect(saved).toHaveLength(1)
    expect(saved[0]).toMatchObject({ session: 'birthday', guess: 180, misconception: 'half-of-365', rematch: null })
    expect(saved[0].confidence).toBeUndefined()
    expect(notebook().map((c) => c.id)).toEqual(['half-of-365'])
    // Show me again → back to the card → Got it: still one entry
    fireEvent.click(screen.getByText('Show me again'))
    fireEvent.click(screen.getByText(/What did I get wrong/))
    fireEvent.click(screen.getByText(/Got it/))
    expect(entries()).toHaveLength(1)
  }, 60000)

  it('the rematch updates the same entry and says spot on', () => {
    toCard()
    const at = entries()[0].at
    cardToRematch()
    fireEvent.click(screen.getByText('More likely than not'))
    const saved = entries()
    expect(saved).toHaveLength(1)
    expect(saved[0]).toMatchObject({ at, misconception: 'half-of-365', rematch: 'right' })
    expect(screen.getByText(/Rematch: right\./)).toBeTruthy()
    expect(screen.getByText('spot on')).toBeTruthy()
    expect(document.body.textContent).not.toMatch(/called it/i)
  }, 60000)

  it('a wrong rematch pick is saved as wrong, still one entry', () => {
    toCard()
    cardToRematch()
    fireEvent.click(screen.getByText('Less likely than not'))
    expect(entries()).toHaveLength(1)
    expect(entries()[0].rematch).toBe('wrong')
  }, 60000)
})

describe('birthday session', () => {
  it('guess → show me → fill the room until the seeded first match at 23', () => {
    vi.useFakeTimers()
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
    const C = session.Component
    render(<C onDone={() => {}} />)
    expect(screen.getByText('How many people?')).toBeTruthy()
    fireEvent.change(screen.getByLabelText('your guess, people in the room'), { target: { value: '180' } })
    fireEvent.click(screen.getByText('Show me'))
    act(() => vi.advanceTimersByTime(400))
    expect(screen.getByText('Fill a room')).toBeTruthy()
    for (let k = 0; k < 5; k++) fireEvent.click(screen.getByText('+5'))
    expect(screen.getByText('The match')).toBeTruthy()
    expect(screen.getByText('first match at 23 people')).toBeTruthy()
    expect(screen.getByText('253')).toBeTruthy()
    // the room keeps going after the match, counter and all
    fireEvent.click(screen.getByLabelText('add 5 people'))
    expect(screen.getByText('28')).toBeTruthy()
    expect(screen.getByText('378')).toBeTruthy()
    expect(screen.getByText('first match at 23 people')).toBeTruthy()
    // keyboard / screen reader activation is a click with no pointer
    fireEvent.click(screen.getByText('+ Add a person'), { detail: 0 })
    expect(screen.getByText('29')).toBeTruthy()
    fireEvent.click(screen.getByText('Empty the room, try again'))
    expect(screen.getByText('An empty room. Add people one by one.')).toBeTruthy()
    vi.useRealTimers()
  }, 60000)

  it('names the mistake from the guess band', () => {
    expect(verdictOf(20).v).toBe('called')
    expect(verdictOf(20).m).toBeNull()
    expect(verdictOf(100).m?.id).toBe('its-about-my-birthday')
    expect(verdictOf(180).m?.id).toBe('half-of-365')
    expect(verdictOf(180).v).toBe('off')
    // 250+ is mixing up a coin flip with a sure thing, not halving 365 (#111)
    expect(verdictOf(249).m?.id).toBe('half-of-365')
    expect(verdictOf(250).m?.id).toBe('fifty-is-not-certain')
    expect(verdictOf(366).m?.id).toBe('fifty-is-not-certain')
    expect(verdictOf(366).v).toBe('off')
    // tiny rooms are well under a coin flip: 2 people (0.3%) is way off, 10-17 is close
    expect(verdictOf(2).v).toBe('off')
    expect(verdictOf(9).v).toBe('off')
    expect(verdictOf(10).v).toBe('close')
    expect(verdictOf(14).m?.id).toBe('a-handful-is-enough')
    expect(verdictOf(57).v).toBe('off')
    expect(verdictOf(56).v).toBe('close')
    // 15 people is a 25% chance: below the tightened 18-30 band (#98), so not "spot on"
    expect(verdictOf(15).v).not.toBe('called')
    expect(verdictOf(23).v).toBe('called')
  })
})
