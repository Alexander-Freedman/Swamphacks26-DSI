// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { AnyTopic } from './components/AnyTopic'
import { GENERATE_TIMEOUT_MS, generateRound, normalizeTopic, resetExtrasCache } from './extras'
import dice from '../../data/rounds/extra/dice-sums.json'
import monty from '../../data/rounds/extra/monty-hall.json'

const BASE = import.meta.env.BASE_URL
const here = () => location.pathname + location.search
const files: Record<string, unknown> = {
  [`${BASE}rounds/extra/index.json`]: [dice, monty].map((d) => ({ slug: d.slug, topic: d.topic, aliases: d.aliases })),
  [`${BASE}rounds/extra/dice-sums.json`]: dice,
  [`${BASE}rounds/extra/monty-hall.json`]: monty,
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

// Static files like Pages serves them; anything else (incl. /api) is a 404.
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

const posts = () => fetchMock.mock.calls.filter(([, init]) => (init as RequestInit | undefined)?.method === 'POST')

describe('Try any topic', () => {
  it('matches a typed topic the way the backend does', () => {
    expect(normalizeTopic('  The Monty-Hall   problem! ')).toBe('the monty hall problem')
    expect(normalizeTopic('C++')).toBe('c++')
  })

  it('a chip opens the reviewed round in the player, with its label', async () => {
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'Sums of dice' }))
    expect(here()).toBe(`${BASE}?round=dice-sums`)
    expect(await screen.findByText(/Sums of dice · 1 of 3/)).toBeTruthy()
    expect(screen.getByText('reviewed')).toBeTruthy()
  })

  it('a refresh on an extra round reopens it', async () => {
    history.replaceState(null, '', `${BASE}?round=monty-hall`)
    render(<App />)
    expect(await screen.findByText(/The Monty Hall problem · 1 of 3/)).toBeTruthy()
  })

  it('typed text matching a cached topic or alias opens that round', async () => {
    render(<App />)
    await screen.findByRole('button', { name: 'Sums of dice' })
    fireEvent.change(screen.getByLabelText(/topic you want/), { target: { value: 'Goats and a car' } })
    fireEvent.click(screen.getByRole('button', { name: 'Go' }))
    expect(await screen.findByText(/The Monty Hall problem · 1 of 3/)).toBeTruthy()
    expect(posts()).toHaveLength(0)
  })

  it('with no backend, an unknown topic gets a friendly line and the chips, no POST', async () => {
    render(<App />)
    await screen.findByRole('button', { name: 'Sums of dice' })
    fireEvent.change(screen.getByLabelText(/topic you want/), { target: { value: 'quantum tunnelling' } })
    fireEvent.click(screen.getByRole('button', { name: 'Go' }))
    expect(await screen.findByText(/No round on “quantum tunnelling” yet/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Sums of dice' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'The Monty Hall problem' })).toBeTruthy()
    expect(posts()).toHaveLength(0)
  })

  it('a slow build times out to the chips', async () => {
    vi.stubEnv('VITE_API_BASE', 'http://api.test')
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (init?.method === 'POST')
        return new Promise<Response>((_, reject) => init.signal!.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError'))))
      return url in files ? json(files[url]) : json({}, 404)
    })
    const onOpen = vi.fn()
    render(<AnyTopic onOpen={onOpen} timeoutMs={50} />)
    await screen.findByRole('button', { name: 'Sums of dice' })
    fireEvent.change(screen.getByLabelText(/topic you want/), { target: { value: 'tides' } })
    fireEvent.click(screen.getByRole('button', { name: 'Go' }))
    expect(screen.getByText(/Building your round on “tides”/)).toBeTruthy()
    // the chips stay playable while it builds
    expect(screen.getByRole('button', { name: 'Sums of dice' })).toBeTruthy()
    expect(await screen.findByText(/Couldn't build “tides” right now/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Sums of dice' })).toBeTruthy()
    expect(posts()[0][0]).toBe('http://api.test/api/rounds')
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('a backend fallback puts its suggestions first', async () => {
    vi.stubEnv('VITE_API_BASE', 'http://api.test')
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) =>
      init?.method === 'POST' ? json({ status: 'fallback', suggestions: ['monty-hall'] }) : url in files ? json(files[url]) : json({}, 404),
    )
    render(<AnyTopic onOpen={() => {}} />)
    await screen.findByRole('button', { name: 'Sums of dice' })
    fireEvent.change(screen.getByLabelText(/topic you want/), { target: { value: 'tides' } })
    fireEvent.click(screen.getByRole('button', { name: 'Go' }))
    await screen.findByText(/Couldn't build/)
    const chips = screen.getAllByRole('button').filter((b) => b.className.includes('anytopic-chip'))
    expect(chips[0].textContent).toBe('The Monty Hall problem')
  })

  it('a built round opens labelled auto-checked', async () => {
    vi.stubEnv('VITE_API_BASE', 'http://api.test')
    const built = { ...dice, slug: 'tides', topic: 'Tides', reviewed: false }
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) =>
      init?.method === 'POST' ? json({ status: 'ok', source: 'model', seconds: 3, round: built, checks: null }) : url in files ? json(files[url]) : json({}, 404),
    )
    render(<App />)
    await screen.findByRole('button', { name: 'Sums of dice' })
    fireEvent.change(screen.getByLabelText(/topic you want/), { target: { value: 'tides' } })
    fireEvent.click(screen.getByRole('button', { name: 'Go' }))
    await waitFor(() => expect(here()).toBe(`${BASE}?round=tides`))
    expect(await screen.findByText(/Tides · 1 of 3/)).toBeTruthy()
    expect(screen.getAllByText('auto-checked').some((el) => el.className.includes('chip'))).toBe(true)
  })

  it('waits 45 s for a build before falling back', async () => {
    expect(GENERATE_TIMEOUT_MS).toBe(45_000)
    vi.useFakeTimers()
    try {
      vi.stubEnv('VITE_API_BASE', 'http://api.test')
      fetchMock.mockImplementation(
        (_url: string, init?: RequestInit) =>
          new Promise<Response>((_, reject) => init!.signal!.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))),
      )
      let done = false
      const p = generateRound('tides').then((r) => ((done = true), r))
      await vi.advanceTimersByTimeAsync(44_000)
      expect(done).toBe(false)
      await vi.advanceTimersByTimeAsync(1_000)
      expect(await p).toEqual({ status: 'fallback', suggestions: [] })
    } finally {
      vi.useRealTimers()
    }
  })

  it('playing a chip while it builds: the finished topic is offered, not forced', async () => {
    vi.stubEnv('VITE_API_BASE', 'http://api.test')
    const built = { ...dice, slug: 'tides', topic: 'Tides', reviewed: false }
    let finish: () => void = () => {}
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (init?.method === 'POST') {
        await new Promise<void>((r) => (finish = r))
        return json({ status: 'ok', source: 'model', seconds: 30, round: built, checks: null })
      }
      return url in files ? json(files[url]) : json({}, 404)
    })
    render(<App />)
    await screen.findByRole('button', { name: 'Sums of dice' })
    fireEvent.change(screen.getByLabelText(/topic you want/), { target: { value: 'tides' } })
    fireEvent.click(screen.getByRole('button', { name: 'Go' }))
    await screen.findByText(/Building your round on “tides”/)
    fireEvent.click(screen.getByRole('button', { name: 'Sums of dice' }))
    expect(await screen.findByText(/Sums of dice · 1 of 3/)).toBeTruthy()

    finish()
    expect(await screen.findByText(/Your topic's ready/)).toBeTruthy()
    expect(here()).toBe(`${BASE}?round=dice-sums`)
    expect(screen.getByText(/Sums of dice · 1 of 3/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(await screen.findByText(/Tides · 1 of 3/)).toBeTruthy()
    expect(here()).toBe(`${BASE}?round=tides`)
    expect(screen.queryByText(/Your topic's ready/)).toBeNull()
  })
})
