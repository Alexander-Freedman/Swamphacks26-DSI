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
    expect(screen.getByText('first match at')).toBeTruthy()
    expect(screen.getByText('253')).toBeTruthy()
    vi.useRealTimers()
  }, 30000)

  it('names the mistake from the guess band', () => {
    expect(verdictOf(20).v).toBe('called')
    expect(verdictOf(20).m).toBeNull()
    expect(verdictOf(100).m?.id).toBe('its-about-my-birthday')
    expect(verdictOf(180).m?.id).toBe('half-of-365')
    expect(verdictOf(180).v).toBe('off')
  })
})
