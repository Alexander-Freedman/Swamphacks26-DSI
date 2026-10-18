// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AskHelp } from './components/AskHelp'
import { BUSY_LINE, helpBody, MAX_QUESTION, OFFLINE_LINE } from './components/askHelpApi'
import { HINTS } from './components/helpHints'
import { SessionHead } from './components/session/Shell'

const API = 'http://api.test'
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

let fetchMock: ReturnType<typeof vi.fn>
const helpCalls = () => fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/api/help'))
const sent = (i = 0) => JSON.parse((helpCalls()[i][1] as RequestInit).body as string)

beforeEach(() => {
  vi.stubEnv('VITE_API_BASE', API)
  fetchMock = vi.fn(async () => json({ answer: 'Watch the pairs counter as you add people.', hint_only: true }))
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

// A session that uses the shell's SessionHead, like coin and positive do.
function Fake({ step, locked, guess }: { step: number; locked: boolean; guess?: number }) {
  return <SessionHead chip="Positive test" step={step} total={6} labels={['a', 'b', 'c', 'd', 'e', 'f']} onGo={() => {}} help={{ screen: `P${step}`, locked, guess }} />
}

const open = () => fireEvent.click(screen.getByRole('button', { name: /^Ask Onion/ }))
const ask = (q: string) => {
  fireEvent.change(screen.getByLabelText('Your question'), { target: { value: q } })
  fireEvent.click(screen.getByRole('button', { name: 'Send' }))
}

describe('Ask panel (#186)', () => {
  it('is hidden in the round player without a backend', () => {
    vi.unstubAllEnvs()
    vi.stubEnv('VITE_API_BASE', undefined as unknown as string)
    render(<AskHelp slug="positive-test" kind="round" spot={{ locked: false }} />)
    expect(screen.queryByRole('button', { name: /^Ask Onion/ })).toBeNull()
    fireEvent.keyDown(window, { key: '?' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('is hidden for a topic the help API does not know', () => {
    render(<AskHelp slug="monty-hall" kind="round" spot={{ locked: false }} />)
    expect(screen.queryByRole('button', { name: /^Ask Onion/ })).toBeNull()
  })

  it('sends the session, screen, locked flag and guess from the shell', async () => {
    const { rerender } = render(<><Fake step={1} locked={false} guess={80} /><AskHelp slug="positive-test" kind="session" /></>)
    open()
    expect(screen.getByText(/hints, not the answer/)).toBeTruthy()
    ask("  what's the answer?  ")
    expect(await screen.findByText('Watch the pairs counter as you add people.')).toBeTruthy()
    expect(helpCalls()[0][0]).toBe(`${API}/api/help`)
    expect(sent()).toEqual({ session_slug: 'positive-test', screen_id: 'P1', question: "what's the answer?", locked: false, context: { guess: 80 } })

    rerender(<><Fake step={3} locked={true} guess={80} /><AskHelp slug="positive-test" kind="session" /></>)
    expect(screen.getByText(/Your guess is in/)).toBeTruthy()
    ask('why?')
    await waitFor(() => expect(helpCalls()).toHaveLength(2))
    expect(sent(1)).toMatchObject({ screen_id: 'P3', locked: true })
  })

  it('without a reported step it asks about the guess screen, as not locked', async () => {
    render(<AskHelp slug="birthday" kind="session" />)
    open()
    fireEvent.click(screen.getByRole('button', { name: 'What am I looking at?' }))
    await waitFor(() => expect(helpCalls()).toHaveLength(1))
    expect(sent()).toEqual({ session_slug: 'birthday', screen_id: 'B1', question: 'What am I looking at?', locked: false, context: {} })
  })

  it('the round player sends round_slug and its own locked flag', () => {
    expect(helpBody({ slug: 'coin-streak', kind: 'round', screen: 'C7', locked: true, guess: 'a', question: 'hm' })).toEqual({
      round_slug: 'coin-streak', screen_id: 'C7', question: 'hm', locked: true, context: { guess: 'a' },
    })
  })

  it.each([
    ['429', () => json({ detail: 'slow' }, 429), BUSY_LINE],
    ['404', () => json({ detail: 'unknown' }, 404), OFFLINE_LINE],
    ['500', () => json({}, 500), OFFLINE_LINE],
    ['network', () => Promise.reject(new TypeError('Failed to fetch')), OFFLINE_LINE],
  ])('%s → the static hint for the screen, with a friendly line', async (_, res, line) => {
    fetchMock.mockImplementation(res)
    render(<><Fake step={2} locked={true} /><AskHelp slug="positive-test" kind="session" /></>)
    open()
    ask('huh?')
    expect(await screen.findByText(line + HINTS.P2)).toBeTruthy()
  })

  it('shows the server fallback text (daily cap) as is', async () => {
    fetchMock.mockImplementation(async () => json({ answer: 'Help is resting for today; the screen has everything you need: x', hint_only: true }))
    render(<AskHelp slug="coin-streak" kind="session" />)
    open()
    ask('hi')
    expect(await screen.findByText(/Help is resting for today/)).toBeTruthy()
  })

  it('one request in flight, with a typing state', async () => {
    let finish: (r: Response) => void = () => {}
    fetchMock.mockImplementation(() => new Promise<Response>((r) => (finish = r)))
    render(<AskHelp slug="coin-streak" kind="session" />)
    open()
    ask('first')
    expect(screen.getByText('thinking…')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Onion is thinking…' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.change(screen.getByLabelText('Your question'), { target: { value: 'second' } })
    fireEvent.keyDown(screen.getByLabelText('Your question'), { key: 'Enter' })
    expect(helpCalls()).toHaveLength(1)
    await act(async () => finish(json({ answer: 'done', hint_only: false })))
    expect(await screen.findByText('done')).toBeTruthy()
    expect(screen.queryByText('thinking…')).toBeNull()
  })

  it('caps the question at 300 characters; the counter only shows near the limit', () => {
    render(<AskHelp slug="coin-streak" kind="session" />)
    open()
    const box = screen.getByLabelText('Your question') as HTMLTextAreaElement
    expect(screen.queryByText(/characters left|\/300/)).toBeNull()
    fireEvent.change(box, { target: { value: 'x'.repeat(260) } })
    expect(screen.getByText('40 characters left')).toBeTruthy()
    fireEvent.change(box, { target: { value: 'x'.repeat(350) } })
    expect(box.value).toHaveLength(MAX_QUESTION)
    expect(screen.getByText('0 characters left')).toBeTruthy()
    expect(helpBody({ slug: 'coin-streak', kind: 'session', screen: 'C1', locked: false, question: 'y'.repeat(400) }).question).toHaveLength(MAX_QUESTION)
  })

  it('? opens it (not while typing), Esc closes it and focus goes back to Ask', async () => {
    render(<><input aria-label="other" /><AskHelp slug="coin-streak" kind="session" /></>)
    const other = screen.getByLabelText('other')
    other.focus()
    fireEvent.keyDown(other, { key: '?' })
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.keyDown(document.body, { key: '?' })
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(document.activeElement).toBe(screen.getByLabelText('Your question'))
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: /^Ask Onion/ })))
  })
})
