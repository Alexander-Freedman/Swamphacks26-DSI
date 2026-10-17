// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { sessionHowItWorks } from './components/sessionSpecs'
import { pMatch, sizeForChance } from './sessions/birthday/math'
import { expectedLongest } from './sessions/coin/math'
import { CARD, ppv } from './sessions/positive/math'

const BASE = import.meta.env.BASE_URL

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 404 })))
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const dialog = () => screen.queryByRole('dialog', { name: 'How it works' })
const results = (d: HTMLElement) => [...within(d).getByTestId('hiw-session-results').querySelectorAll('.hiw-row')].map((r) => [r.querySelector('dt')!.textContent, r.querySelector('strong')!.textContent])

function open(slug: string) {
  history.replaceState(null, '', `${BASE}?session=${slug}`)
  render(<App />)
}

describe('How it works on the sessions', () => {
  for (const slug of ['birthday', 'coin-streak', 'positive-test']) {
    it(`${slug}: D opens it, the number waits for the lock, Esc closes it`, async () => {
      open(slug)
      expect(dialog()).toBeNull()
      fireEvent.keyDown(document.body, { key: 'd' })
      const d = await waitFor(() => dialog()!)
      expect(within(d).getByText(sessionHowItWorks[slug].formula)).toBeTruthy()
      // no spoiler until asked
      expect(within(d).queryByTestId('hiw-session-results')).toBeNull()
      expect(within(d).getByText(/The number shows after you make your guess/)).toBeTruthy()
      expect(within(d).getByText(/a person checked the numbers and sources/)).toBeTruthy()
      expect(within(d).getAllByRole('link').length).toBeGreaterThan(0)
      expect(document.body.style.overflow).toBe('hidden')
      fireEvent.keyDown(document.activeElement!, { key: 'Escape' })
      await waitFor(() => expect(dialog()).toBeNull())
      expect(document.body.style.overflow).toBe('')
    })
  }

  it('the button opens it too, and "Show it anyway" stays shown on reopen', async () => {
    open('birthday')
    fireEvent.click(screen.getByRole('button', { name: /How it works/ }))
    const d = dialog()!
    fireEvent.click(within(d).getByRole('button', { name: /Show it anyway/ }))
    expect(within(d).getByTestId('hiw-session-results')).toBeTruthy()
    fireEvent.click(within(d).getByRole('button', { name: /Close/ }))
    fireEvent.click(screen.getByRole('button', { name: /How it works/ }))
    expect(within(dialog()!).getByTestId('hiw-session-results')).toBeTruthy()
  })
})

describe('session numbers come from the session math', () => {
  it('birthday: 23 people → 50.7%', () => {
    const r = sessionHowItWorks.birthday.results()
    expect(r[0].value).toBe(`${(pMatch(23) * 100).toFixed(1)}%`)
    expect(r[0].value).toBe('50.7%')
    expect(r[1].value).toBe(`${sizeForChance(0.5)} people`)
    expect(r[1].value).toBe('23 people')
  })
  it('coin streak: 4.66 in 20 flips, 6.98 in 100', () => {
    const r = sessionHowItWorks['coin-streak'].results()
    expect(r.map((x) => x.value)).toEqual([expectedLongest(20).toFixed(2), expectedLongest(100).toFixed(2)])
    expect(r.map((x) => x.value)).toEqual(['4.66', '6.98'])
  })
  it('positive test: 9 / (9 + 89.1) = 9.17%', () => {
    const r = sessionHowItWorks['positive-test'].results()
    expect(r.map((x) => x.value)).toEqual(['9', '89.1', `${(ppv(CARD) * 100).toFixed(2)}%`])
    expect(r[2].value).toBe('9.17%')
    expect(r[2].work).toBe('9 ÷ (9 + 89.1)')
  })
  it('the drawer shows those same numbers', async () => {
    open('coin-streak')
    fireEvent.keyDown(document.body, { key: 'd' })
    const d = await waitFor(() => dialog()!)
    fireEvent.click(within(d).getByRole('button', { name: /Show it anyway/ }))
    expect(results(d)).toEqual([
      ['20 flips', '4.66'],
      ['100 flips', '6.98'],
    ])
  })
})
