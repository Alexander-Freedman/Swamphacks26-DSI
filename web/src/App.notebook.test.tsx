// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { KEY, entries, record } from './notebook'
import { consumeResetParam } from './reset'

const BASE = import.meta.env.BASE_URL
// The notebook shows Learn topics (Sat 1:30 AM); older demo-session entries stay saved but hidden.
const SEASONS = { session: 'learn', slug: 'why-we-have-seasons', topic: 'why we have seasons', label: 'Summer is when Earth is closer', fix: 'Tilt, not distance, makes seasons.' }
const caught = (at = new Date().toISOString()) => record({ ...SEASONS, at, guess: 'closer in summer', misconception: 'closer-means-summer', rematch: null })

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

  it('empty state invites you to try any topic', () => {
    history.replaceState(null, '', `${BASE}?notebook=1`)
    render(<App />)
    expect(screen.getByText('Your notebook')).toBeTruthy()
    expect(screen.getByText('Nothing caught yet.')).toBeTruthy()
    expect(screen.getByText('Try any topic').closest('a')?.getAttribute('href')).toBe(BASE)
  })

  it('empty state counts topics played and points at Try any topic (#162)', () => {
    record({ ...SEASONS, at: new Date().toISOString(), guess: 'tilt', misconception: null, rematch: null })
    record({ session: 'birthday', at: new Date().toISOString(), guess: 23, misconception: 'half-of-365', rematch: 'wrong' }) // hidden
    history.replaceState(null, '', `${BASE}?notebook=1`)
    render(<App />)
    expect(screen.getByText(/You've played 1 session and your first guess called it/)).toBeTruthy()
    expect(screen.getByText('Try any topic').closest('a')?.getAttribute('href')).toBe(BASE)
  })

  it('shows a caught mistake in pencil', () => {
    caught()
    history.replaceState(null, '', `${BASE}?notebook=1`)
    render(<App />)
    expect(screen.getByText('“Summer is when Earth is closer”').closest('li')?.className).toContain('caught')
    expect(screen.getByText('Tilt, not distance, makes seasons.')).toBeTruthy()
    expect(screen.getByText('Learn it again →').getAttribute('href')).toBe(`${BASE}?learn=why-we-have-seasons`)
    expect(screen.getByText(/Get it right 2 times to bust it/)).toBeTruthy()
  })

  const open = () => {
    history.replaceState(null, '', `${BASE}?notebook=1`)
    render(<App />)
    return screen.getByText('“Summer is when Earth is closer”').closest('li') as HTMLElement
  }
  const at = (d: string) => `2026-10-${d}T12:00:00.000Z`
  const pips = (li: HTMLElement) => [...li.querySelectorAll('.nb-pips i')].map((i) => i.className)

  // Learn sessions have no rematch; retired with the Learn-only notebook (Sat 1:30 AM).
  it.skip('a right rematch gets a nod, not a pip (#176)', () => {
    record({ session: 'birthday', at: at('10'), guess: 180, misconception: 'half-of-365', rematch: 'right' })
    const li = open()
    expect(li.textContent).toContain('Last time: rematch right. It counts from your next session.')
    expect(li.querySelector('.nb-last')?.className).toContain('rematch-right')
    expect(pips(li)).toEqual(['', ''])
    expect(li.textContent).toContain('Get it right 2 times to bust it.')
  })

  // Learn sessions have no rematch; retired with the Learn-only notebook (Sat 1:30 AM).
  it.skip('a missed rematch gets a pencil x and no credit (#176)', () => {
    record({ session: 'birthday', at: at('10'), guess: 180, misconception: 'half-of-365', rematch: 'wrong' })
    const li = open()
    expect(li.textContent).toContain('Last time: rematch missed. No credit yet.')
    expect(li.querySelector('.nb-last')?.className).toContain('rematch-missed')
    expect(pips(li)).toEqual(['x', ''])
    expect(li.textContent).not.toContain('rematch right')
  })

  it('a later right answer fills a pip and counts down (#176)', () => {
    caught(at('10'))
    record({ ...SEASONS, at: at('11'), guess: 'tilt', misconception: null, rematch: null })
    const li = open()
    expect(li.textContent).toContain('Last time: right. That one counts.')
    expect(pips(li)).toEqual(['on', ''])
    expect(li.textContent).toContain('1 more right answer to bust it.')
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
    expect(screen.getByText('The wrong ideas your guesses showed, with the fix')).toBeTruthy()
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
