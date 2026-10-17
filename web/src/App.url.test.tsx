// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

// Two stand-in sessions; 'coin-streak' shares its slug with an old showcase round.
vi.mock('./sessions/registry', () => {
  const make = (slug: string, title: string, order: number) => ({
    slug,
    title,
    blurb: `${title} blurb`,
    order,
    Component: ({ onDone }: { onDone: () => void }) => (
      <div>
        <p>inside {slug}</p>
        <button onClick={onDone}>Done</button>
      </div>
    ),
  })
  const sessions = [make('boxes', 'Boxes session', 1), make('coin-streak', 'Coin session', 2)]
  return { sessions, sessionFor: (slug: string | null) => sessions.find((s) => s.slug === slug) }
})

const BASE = import.meta.env.BASE_URL
const here = () => location.pathname + location.search

beforeEach(() => history.replaceState(null, '', BASE))
afterEach(cleanup)

describe('URL state', () => {
  it('open → Back → Home, Forward reopens', async () => {
    render(<App />)
    fireEvent.click(screen.getByText('Boxes session'))
    expect(screen.getByText('inside boxes')).toBeTruthy()
    expect(here()).toBe(`${BASE}?session=boxes`)

    act(() => history.back())
    await waitFor(() => expect(screen.getByText('Bet on your gut. Then watch reality.')).toBeTruthy())
    expect(here()).toBe(BASE)

    act(() => history.forward())
    await waitFor(() => expect(screen.getByText('inside boxes')).toBeTruthy())
  })

  it('refresh mid-session reopens it', () => {
    history.replaceState(null, '', `${BASE}?session=boxes`)
    render(<App />)
    expect(screen.getByText('inside boxes')).toBeTruthy()
  })

  it('clears the param on Done and on the logo', () => {
    render(<App />)
    fireEvent.click(screen.getByText('Boxes session'))
    fireEvent.click(screen.getByText('Done'))
    expect(here()).toBe(BASE)
    expect(screen.getByText('Bet on your gut. Then watch reality.')).toBeTruthy()

    fireEvent.click(screen.getByText('Shared birthdays'))
    expect(here()).toBe(`${BASE}?round=birthday`)
    fireEvent.click(screen.getByText('Onionskin'))
    expect(here()).toBe(BASE)
  })

  it('drops an unknown slug from the URL', () => {
    history.replaceState(null, '', `${BASE}?round=nope`)
    render(<App />)
    expect(screen.getByText('Bet on your gut. Then watch reality.')).toBeTruthy()
    expect(here()).toBe(BASE)
  })

  it('hides a showcase round that has a session, and redirects its old link', () => {
    render(<App />)
    expect(screen.queryByText('Streaks in coin flips')).toBeNull()
    expect(screen.getByText('Shared birthdays')).toBeTruthy()
    cleanup()

    history.replaceState(null, '', `${BASE}?round=coin-streak`)
    render(<App />)
    expect(screen.getByText('inside coin-streak')).toBeTruthy()
    expect(here()).toBe(`${BASE}?session=coin-streak`)
  })
})
