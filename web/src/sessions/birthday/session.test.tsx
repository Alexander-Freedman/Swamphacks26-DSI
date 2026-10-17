// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { session } from './index'
import { verdictOf } from './round'

afterEach(cleanup)

describe('birthday session', () => {
  it('guess → lock → fill the room until the seeded first match at 23', () => {
    vi.useFakeTimers()
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
    const C = session.Component
    render(<C onDone={() => {}} />)
    expect(screen.getByText('How many people?')).toBeTruthy()
    fireEvent.change(screen.getByLabelText('your guess, people in the room'), { target: { value: '180' } })
    fireEvent.click(screen.getByText('pretty sure'))
    fireEvent.click(screen.getByText('Lock it in'))
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
  }, 30000)

  it('names the mistake from the guess band', () => {
    expect(verdictOf(20).v).toBe('called')
    expect(verdictOf(20).m).toBeNull()
    expect(verdictOf(100).m?.id).toBe('its-about-my-birthday')
    expect(verdictOf(180).m?.id).toBe('half-of-365')
    expect(verdictOf(180).v).toBe('off')
    // tiny rooms are well under a coin flip: not "called it"
    expect(verdictOf(2).v).toBe('close')
    expect(verdictOf(2).m?.refutation).toContain('1 pair: a 0.3% chance')
    expect(verdictOf(14).m?.id).toBe('too-few')
    // 15 people is a 25% chance: below the tightened 18-30 band (#98), so not "called it"
    expect(verdictOf(15).v).not.toBe('called')
    expect(verdictOf(23).v).toBe('called')
  })
})
