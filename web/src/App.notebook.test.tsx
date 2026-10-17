// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { KEY, entries, record } from './notebook'
import { consumeResetParam } from './reset'

const BASE = import.meta.env.BASE_URL
const caught = () =>
  record({ session: 'birthday', at: new Date().toISOString(), guess: 180, confidence: 'certain', misconception: 'half-of-365', rematch: 'wrong' })

beforeEach(() => {
  localStorage.clear()
  history.replaceState(null, '', BASE)
})
afterEach(cleanup)

describe('notebook screen', () => {
  it('Home links to the notebook', () => {
    render(<App />)
    // getByRole walks the whole tree and is slow on a cold jsdom; the text is enough here
    expect(screen.getByText('Notebook').closest('a')?.getAttribute('href')).toBe(`${BASE}?notebook=1`)
  }, 20000)

  it('opens in-app with a history entry: Back returns Home, refresh keeps it', async () => {
    render(<App />)
    fireEvent.click(screen.getByText('Notebook'))
    expect(screen.getByText('Your notebook')).toBeTruthy()
    expect(location.search).toBe('?notebook=1')
    act(() => history.back())
    await waitFor(() => expect(screen.getByText('See your thinking in layers.')).toBeTruthy())
    expect(location.search).toBe('')
    cleanup()
    history.replaceState(null, '', `${BASE}?notebook=1`)
    render(<App />)
    fireEvent.click(screen.getByText('← Home'))
    expect(screen.getByText('See your thinking in layers.')).toBeTruthy()
    expect(location.search).toBe('')
  }, 20000)

  it('empty state invites a session', () => {
    history.replaceState(null, '', `${BASE}?notebook=1`)
    render(<App />)
    expect(screen.getByText('Your notebook')).toBeTruthy()
    expect(screen.getByText('Nothing caught yet.')).toBeTruthy()
    expect(screen.getByText('Start with the birthday problem').closest('a')?.getAttribute('href')).toBe(`${BASE}?session=birthday`)
  })

  it('empty state counts missed rematches and points at a session not played yet (#162)', () => {
    record({ session: 'birthday', at: new Date().toISOString(), guess: 23, misconception: null, rematch: 'wrong' })
    history.replaceState(null, '', `${BASE}?notebook=1`)
    render(<App />)
    expect(screen.getByText(/You've played 1 session and your first guess called it \(1 rematch missed\)/)).toBeTruthy()
    expect(screen.getByText('Next: Be a coin').closest('a')?.getAttribute('href')).toBe(`${BASE}?session=coin-streak`)
  })

  it('shows a caught mistake in pencil', () => {
    caught()
    history.replaceState(null, '', `${BASE}?notebook=1`)
    render(<App />)
    expect(screen.getByText('“You need about half of 365”').closest('li')?.className).toContain('caught')
    expect(screen.getByText(/Get it right 2 times to bust it/)).toBeTruthy()
  })
})

describe('reset shortcut', () => {
  it('?reset=1 clears the notebook and drops the param', () => {
    caught()
    history.replaceState(null, '', `${BASE}?reset=1`)
    render(<App />)
    expect(entries()).toEqual([])
    expect(localStorage.getItem(KEY)).toBeNull()
    expect(location.search).toBe('')
    expect(screen.getByRole('status').textContent).toBe('Notebook cleared')
  })

  it('?reset=1 next to an open session still lands on Home', () => {
    caught()
    history.replaceState(null, '', `${BASE}?session=birthday&reset=1`)
    consumeResetParam() // main.tsx does this before the first render
    render(<App />)
    expect(entries()).toEqual([])
    expect(location.search).toBe('')
    expect(screen.getByText('See your thinking in layers.')).toBeTruthy()
  })

  it('Shift+R on Home clears it, but not while typing', () => {
    caught()
    render(<App />)
    expect(screen.getByText(/1 mistake caught/)).toBeTruthy()
    const input = document.createElement('input')
    document.body.appendChild(input)
    fireEvent.keyDown(input, { key: 'R', shiftKey: true })
    expect(entries()).toHaveLength(1)
    input.remove()
    act(() => {
      fireEvent.keyDown(window, { key: 'R', shiftKey: true })
    })
    expect(entries()).toEqual([])
    expect(screen.getByText('Your caught → busted mistakes')).toBeTruthy()
  })

  it('Shift+R on the notebook returns Home', () => {
    caught()
    history.replaceState(null, '', `${BASE}?notebook=1`)
    render(<App />)
    act(() => {
      fireEvent.keyDown(window, { key: 'R', shiftKey: true })
    })
    expect(screen.getByText('See your thinking in layers.')).toBeTruthy()
    expect(location.search).toBe('')
  })
})
