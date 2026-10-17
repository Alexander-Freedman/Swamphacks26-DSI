// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { BackendDot } from './components/BackendDot'
import { HowItWorks } from './components/HowItWorks'
import { resetExtrasCache } from './extras'
import { prettyFormula, withUnit } from './format'
import { answerValue } from './truth'
import type { ChecksReport, Round } from './types'
import dice from '../../data/rounds/extra/dice-sums.json'
import monty from '../../data/rounds/extra/monty-hall.json'

const BASE = import.meta.env.BASE_URL
const files: Record<string, unknown> = {
  [`${BASE}rounds/extra/index.json`]: [dice, monty].map((d) => ({ slug: d.slug, topic: d.topic, aliases: d.aliases })),
  [`${BASE}rounds/extra/dice-sums.json`]: dice,
  [`${BASE}rounds/extra/monty-hall.json`]: monty,
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

let fetchMock: ReturnType<typeof vi.fn>
beforeEach(() => {
  resetExtrasCache()
  history.replaceState(null, '', BASE)
  fetchMock = vi.fn(async (url: string) => (url in files ? json(files[url]) : json({ detail: 'nope' }, 404)))
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

const dialog = () => screen.queryByRole('dialog', { name: 'How it works' })
const apiCalls = () => fetchMock.mock.calls.map(([u]) => String(u)).filter((u) => u.includes('/api/'))

describe('How it works drawer', () => {
  it('opens from the button on a hand-checked round, shows the computed answer and its sources', async () => {
    history.replaceState(null, '', `${BASE}?round=monty-hall`)
    render(<App />)
    await screen.findByText(/The Monty Hall problem · 1 of 3/)
    fireEvent.click(screen.getByRole('button', { name: /How it works/ }))
    const d = dialog()!
    expect(d).toBeTruthy()
    // spec side: the formula in readable form, not just raw JSON
    expect(within(d).getByText('2 ÷ 3 × 100')).toBeTruthy()
    // no spoiler before the guess is locked
    expect(within(d).getByText(/Lock in your guess first/)).toBeTruthy()
    expect(within(d).queryByTestId('hiw-value')).toBeNull()
    fireEvent.click(within(d).getByRole('button', { name: /Show it anyway/ }))
    const item = (monty as unknown as Round).items[0]
    expect(within(d).getByTestId('hiw-value').textContent).toBe(withUnit(answerValue(item)!, '%'))
    expect(within(d).getByText(/computed answer lands here/).closest('tr')!.className).toContain('correct')
    expect(within(d).getByText(/Hand-checked:/)).toBeTruthy()
    expect(within(d).getAllByRole('link').some((a) => a.getAttribute('href') === 'https://en.wikipedia.org/wiki/Monty_Hall_problem')).toBe(true)
    // read-only: nothing is fetched from the API
    expect(apiCalls()).toEqual([])
  })

  it('D toggles it, Esc closes it and focus goes back', async () => {
    history.replaceState(null, '', `${BASE}?round=monty-hall`)
    render(<App />)
    await screen.findByText(/The Monty Hall problem · 1 of 3/)
    const btn = screen.getByRole('button', { name: /How it works/ })
    btn.focus()
    fireEvent.keyDown(btn, { key: 'd' })
    await waitFor(() => expect(dialog()).toBeTruthy())
    await waitFor(() => expect(document.activeElement?.className).toBe('hiw-close'))
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' })
    await waitFor(() => expect(dialog()).toBeNull())
    expect(document.activeElement).toBe(btn)
    fireEvent.keyDown(document.body, { key: 'D' })
    await waitFor(() => expect(dialog()).toBeTruthy())
    fireEvent.keyDown(document.body, { key: 'd' })
    await waitFor(() => expect(dialog()).toBeNull())
  })

  it('keeps Tab inside the drawer', async () => {
    history.replaceState(null, '', `${BASE}?round=monty-hall`)
    render(<App />)
    await screen.findByText(/The Monty Hall problem · 1 of 3/)
    fireEvent.keyDown(document.body, { key: 'd' })
    const d = dialog()!
    const close = within(d).getByRole('button', { name: /Close/ })
    expect(document.activeElement).toBe(close)
    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true })
    expect(d.contains(document.activeElement)).toBe(true)
    expect(document.activeElement).not.toBe(close)
  })

  it('a generated round shows its check report in plain words, honest about the blind check', async () => {
    vi.stubEnv('VITE_API_BASE', 'http://api.test')
    const built = { ...dice, slug: 'tides', topic: 'Tides', reviewed: false }
    const checks: ChecksReport = {
      kept: 3,
      dropped: [{ item_id: 'spring-tide-height', reason: 'answer_expr disagrees with answer_claimed' }],
      blind_checked: false,
      blind_ok: 0,
      blind_failed: 1,
      unchecked: [],
      model: 'gemini-3.5-flash',
      seconds: 21.4,
    }
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) =>
      init?.method === 'POST'
        ? json({ status: 'ok', source: 'gemini-3.5-flash', seconds: 21.4, round: built, checks })
        : url in files
          ? json(files[url])
          : url.endsWith('/api/health')
            ? json({ status: 'ok' })
            : json({}, 404),
    )
    render(<App />)
    await screen.findByRole('button', { name: 'Sums of dice' })
    fireEvent.change(screen.getByLabelText(/topic you want/), { target: { value: 'tides' } })
    fireEvent.click(screen.getByRole('button', { name: 'Go' }))
    await screen.findByText(/Tides · 1 of 3/)
    const before = fetchMock.mock.calls.length
    fireEvent.keyDown(document.body, { key: 'd' })
    const d = dialog()!
    expect(within(d).queryByText(/Hand-checked/)).toBeNull()
    expect(within(d).getByText(/Kept/).textContent).toMatch(/Kept 3 questions, dropped 1:/)
    expect(within(d).getByText(/answer_expr disagrees/)).toBeTruthy()
    expect(within(d).getByText(/Blind check: not run for any question \(1 tried and failed/)).toBeTruthy()
    expect(within(d).getByText('gemini-3.5-flash')).toBeTruthy()
    expect(within(d).getByText(/This question: this answer is computed by our code/)).toBeTruthy()
    expect(fetchMock.mock.calls.length).toBe(before)
  })

  it('a generated round with no report says so instead of claiming checks', () => {
    const built = { ...(dice as unknown as Round), slug: 'no-report', reviewed: false }
    render(<HowItWorks round={built} item={built.items[0]} locked onClose={() => {}} />)
    expect(screen.getByText(/No check report came with this round/)).toBeTruthy()
    expect(screen.queryByText(/Hand-checked/)).toBeNull()
  })

  it('renders every extra round item without NaN or undefined', () => {
    const all = import.meta.glob<Round>('../../data/rounds/extra/*.json', { eager: true, import: 'default' })
    for (const r of Object.values(all)) {
      for (const item of r.items) {
        const { container, unmount } = render(<HowItWorks round={r} item={item} locked onClose={() => {}} />)
        expect(container.textContent, `${r.slug}/${item.id}`).not.toMatch(/NaN|undefined|Infinity/)
        unmount()
      }
    }
  })

  it('dice sums "most often": headlines the mode 7, not the average', () => {
    const r = dice as unknown as Round
    const q = r.items.find((i) => i.id === 'most-common-total')!
    render(<HowItWorks round={r} item={q} locked onClose={() => {}} />)
    expect(screen.getByTestId('hiw-value').textContent).toBe('7')
    expect(screen.getByText(/most common/)).toBeTruthy()
  })

  it('a distribution with nothing saying which statistic headlines no number, only "average"', () => {
    const all = import.meta.glob<Round>('../../data/rounds/extra/*.json', { eager: true, import: 'default' })
    const r = Object.values(all).find((x) => x.slug === 'small-samples')!
    const q = r.items.find((i) => i.id === 'rural-counties')!
    render(<HowItWorks round={r} item={q} locked onClose={() => {}} />)
    expect(screen.queryByTestId('hiw-value')).toBeNull()
    expect(screen.getByTestId('hiw-no-headline').textContent).toMatch(/the right choice is .*average \d/)
  })

  it('the wording says what is actually computed', () => {
    const r = monty as unknown as Round
    render(<HowItWorks round={r} item={r.items[0]} locked onClose={() => {}} />)
    expect(screen.getByText(/our code evaluates the stated formula \(or runs the simulation\), and a person checked the numbers and sources/)).toBeTruthy()
    expect(screen.queryByText(/every answer recomputed/)).toBeNull()
  })

  it('locks page scroll while open', () => {
    const r = monty as unknown as Round
    const { unmount } = render(<HowItWorks round={r} item={r.items[0]} locked onClose={() => {}} />)
    expect(document.body.style.overflow).toBe('hidden')
    unmount()
    expect(document.body.style.overflow).toBe('')
  })

  it('pretty-prints formulas', () => {
    expect(prettyFormula('100*1.02^x')).toBe('100 × 1.02 ^ x')
    expect(prettyFormula('log(2)/log(1.08)')).toBe('log(2) ÷ log(1.08)')
    expect(prettyFormula('((')).toBe('((')
  })
})

describe('backend status dot', () => {
  it('is grey "offline mode" with no backend, and asks nothing', async () => {
    render(<App />)
    expect(screen.getByTestId('backend-dot').textContent).toBe('offline mode')
    await screen.findByRole('button', { name: 'Sums of dice' })
    expect(apiCalls()).toEqual([])
  })

  it('is green after one health check when the backend answers', async () => {
    vi.stubEnv('VITE_API_BASE', 'http://api.test')
    fetchMock.mockImplementation(async (url: string) => (url === 'http://api.test/api/health' ? json({ status: 'ok' }) : url in files ? json(files[url]) : json({}, 404)))
    const { unmount } = render(<BackendDot />)
    await waitFor(() => expect(screen.getByTestId('backend-dot').className).toContain('online'))
    expect(screen.getByTestId('backend-dot').textContent).toBe('backend online')
    unmount()
    render(<BackendDot />)
    await waitFor(() => expect(screen.getByTestId('backend-dot').className).toContain('online'))
    expect(apiCalls()).toEqual(['http://api.test/api/health'])
  })

  it('is red when the backend is unreachable', async () => {
    vi.stubEnv('VITE_API_BASE', 'http://api.test')
    fetchMock.mockImplementation(async () => {
      throw new TypeError('network down')
    })
    render(<BackendDot />)
    await waitFor(() => expect(screen.getByTestId('backend-dot').className).toContain('down'))
    expect(screen.getByTestId('backend-dot').textContent).toBe('backend unreachable')
  })
})
