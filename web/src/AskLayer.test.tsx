// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AskHelp } from './components/AskHelp'
import { DEFAULT_SUGGESTED, PRIVACY_LINE } from './components/askLayer'
import { BUSY_LINE, OFFLINE_LINE } from './components/askHelpApi'
import { SessionHead, Title } from './components/session/Shell'
import type { LayerReport } from './components/session/helpSpot'

const API = 'http://api.test'
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

let fetchMock: ReturnType<typeof vi.fn>
const helpCalls = () => fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/api/help'))
const sent = (i = 0) => JSON.parse((helpCalls()[i][1] as RequestInit).body as string)

beforeEach(() => {
  vi.stubEnv('VITE_API_BASE', API)
  fetchMock = vi.fn(async () => json({ answer: 'The tangent is flat at the top.', hint_only: false, source: 'gemma' }))
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

const LAYER: LayerReport = {
  title: 'Drag the tangent',
  onScreen: 'A dot slides along the curve with its tangent line.',
  facts: ["f'(1) = 0", "f'(2) = −1.5"],
  suggested: ['What is the tangent line?', 'Why is the slope 0 at the top?'],
  hint: 'Drag the dot to the top of the hill.',
  subject: 'Calculus',
  topic: 'The slope of a curve',
  layerN: 2,
  lastAction: 'Their sketch had the right shape',
}

function Calc({ layer }: { layer?: LayerReport }) {
  return (
    <>
      <SessionHead chip="Calculus · The slope of a curve" step={2} total={3} labels={['Draw the slope', 'Drag the tangent', 'Your mistake']} onGo={() => {}} layer={layer} />
      <Title h="Drag the tangent." sub="Drag the dot along the curve. The real slope draws itself over your pencil." />
    </>
  )
}
const button = () => screen.getByRole('button', { name: /^Stuck\? Ask/ })

describe('Ask panel on any layer (#243)', () => {
  it('is collapsed to a small "Stuck? Ask" button by default', () => {
    render(<><Calc layer={LAYER} /><AskHelp slug="calculus" kind="session" subject="Calculus" /></>)
    expect(button().getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.queryByText('What is the tangent line?')).toBeNull()
  })

  it('shows the layer’s suggested questions and the privacy line, and sends nothing until one is tapped', async () => {
    render(<><Calc layer={LAYER} /><AskHelp slug="calculus" kind="session" subject="Calculus" /></>)
    fireEvent.click(button())
    expect(screen.getByRole('button', { name: 'What is the tangent line?' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Why is the slope 0 at the top?' })).toBeTruthy()
    expect(screen.getByText(PRIVACY_LINE)).toBeTruthy()
    expect(helpCalls()).toHaveLength(0)
    fireEvent.click(screen.getByRole('button', { name: 'What is the tangent line?' }))
    await waitFor(() => expect(helpCalls()).toHaveLength(1))
  })

  it('sends the generic body for a screen that reports a LayerHelp, with the last turns as history', async () => {
    render(<><Calc layer={LAYER} /><AskHelp slug="calculus" kind="session" subject="Calculus" /></>)
    fireEvent.click(button())
    fireEvent.click(screen.getByRole('button', { name: 'Why is the slope 0 at the top?' }))
    expect(await screen.findByText('The tangent is flat at the top.')).toBeTruthy()
    expect(sent()).toEqual({
      subject: 'Calculus',
      topic: 'The slope of a curve',
      layer: { n: 2, title: 'Drag the tangent' },
      on_screen: 'A dot slides along the curve with its tangent line.',
      facts: ["f'(1) = 0", "f'(2) = −1.5"],
      last_action: 'Their sketch had the right shape',
      history: [],
      question: 'Why is the slope 0 at the top?',
      hint: 'Drag the dot to the top of the hill.',
    })
    fireEvent.change(screen.getByLabelText('Your question'), { target: { value: 'and at x = 2?' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    await waitFor(() => expect(helpCalls()).toHaveLength(2))
    expect(sent(1).history).toEqual([
      { role: 'user', text: 'Why is the slope 0 at the top?' },
      { role: 'assistant', text: 'The tangent is flat at the top.' },
    ])
    expect(sent(1)).not.toHaveProperty('session_slug')
  })

  it('keeps the old body for the probability sessions', async () => {
    render(<><SessionHead chip="Coin streak" step={3} total={7} help={{ screen: 'C3', locked: false }} /><AskHelp slug="coin-streak" kind="session" subject="Be a coin" /></>)
    fireEvent.click(button())
    fireEvent.click(screen.getByRole('button', { name: 'What am I looking at?' }))
    await waitFor(() => expect(helpCalls()).toHaveLength(1))
    expect(sent()).toEqual({ session_slug: 'coin-streak', screen_id: 'C3', question: 'What am I looking at?', locked: false, context: {} })
  })

  it('derives a layer from the step title and guidance line on a screen without one', async () => {
    render(<><Calc /><AskHelp slug="calculus" kind="session" subject="Calculus" /></>)
    fireEvent.click(button())
    for (const q of DEFAULT_SUGGESTED) expect(screen.getByRole('button', { name: q })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'What should I do next?' }))
    await waitFor(() => expect(helpCalls()).toHaveLength(1))
    expect(sent()).toEqual({
      subject: 'Calculus',
      topic: 'The slope of a curve',
      layer: { n: 2, title: 'Drag the tangent.' },
      on_screen: 'Drag the dot along the curve. The real slope draws itself over your pencil.',
      facts: [],
      last_action: null,
      history: [],
      question: 'What should I do next?',
      hint: 'Drag the dot along the curve. The real slope draws itself over your pencil.',
    })
  })

  it.each([
    ['429', () => json({ detail: 'slow' }, 429), BUSY_LINE],
    ['503', () => json({}, 503), OFFLINE_LINE],
    ['offline', () => Promise.reject(new TypeError('Failed to fetch')), OFFLINE_LINE],
  ])('%s → the layer’s static hint with a friendly line', async (_, res, line) => {
    fetchMock.mockImplementation(res)
    render(<><Calc layer={LAYER} /><AskHelp slug="calculus" kind="session" subject="Calculus" /></>)
    fireEvent.click(button())
    fireEvent.click(screen.getByRole('button', { name: 'What is the tangent line?' }))
    expect(await screen.findByText(line + LAYER.hint)).toBeTruthy()
  })

  it('with no backend it still shows, and answers with the layer’s hint without calling fetch', async () => {
    vi.unstubAllEnvs()
    vi.stubEnv('VITE_API_BASE', undefined as unknown as string)
    render(<><Calc layer={LAYER} /><AskHelp slug="calculus" kind="session" subject="Calculus" /></>)
    fireEvent.click(button())
    fireEvent.click(screen.getByRole('button', { name: 'What is the tangent line?' }))
    expect(await screen.findByText(OFFLINE_LINE + LAYER.hint)).toBeTruthy()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
