// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState, type ComponentType } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMockLearnApi } from '../learnApi'
import bundled from '../../../data/learn/compound-interest.json'
import { AnchorScreen } from './AnchorScreen'
import { GuessScreen } from './GuessScreen'
import { RATE_LIMITED } from './learn-guess-anchor'
import { initialState } from './state'
import type { AnchorResponse, GuessResponse, LearnApi, LearnState, Offline, Result, StageProps, Topic } from './types'

afterEach(cleanup)

const ci = bundled as unknown as Topic
const plain: Topic = { ...ci, slug: 'plain', visual: null }

function deferred<T>() {
  let resolve!: (v: T) => void
  const p = new Promise<T>((r) => (resolve = r))
  return { p, resolve }
}

function Harness({ Screen, topic, api, onNext, onState }: { Screen: ComponentType<StageProps>; topic: Topic; api: LearnApi; onNext: () => void; onState: (s: LearnState) => void }) {
  const [state, setState] = useState<LearnState>(initialState)
  onState(state)
  return <Screen topic={topic} state={state} api={api} next={onNext} update={(p) => setState((s) => ({ ...s, ...p }))} />
}

function setup(Screen: ComponentType<StageProps>, topic: Topic, over: Partial<LearnApi> = {}) {
  const api = { ...createMockLearnApi([ci, plain]), ...over } as LearnApi
  const next = vi.fn()
  let last = initialState()
  render(<Harness Screen={Screen} topic={topic} api={api} onNext={next} onState={(s) => (last = s)} />)
  return { next, state: () => last }
}

describe('GuessScreen', () => {
  it('asks about the topic, grades the guess, tags a known wrong idea, saves it all', async () => {
    const { next, state } = setup(GuessScreen, ci)
    expect(screen.getByText(/What do you think makes compound interest work\?/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Submit' }).hasAttribute('disabled')).toBe(true)
    fireEvent.change(screen.getByLabelText('guess answer'), { target: { value: 'you add 7% a single time and stop at $1,070' } })
    fireEvent.change(screen.getByLabelText('how sure'), { target: { value: '80' } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    expect(await screen.findByText('sounds like: Interest happens once')).toBeTruthy()
    expect(screen.getByText('offline check')).toBeTruthy()
    expect(screen.queryByText(/30 times/)).toBeNull() // the fix waits for the end
    expect(state()).toMatchObject({ guess: 'you add 7% a single time and stop at $1,070', confidence: 80, misconceptionId: 'interest-paid-once' })
    expect(state().guessResult?.classification).toBe('concrete')
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(next).toHaveBeenCalled()
  })

  it('shows thinking… while the call runs', async () => {
    const d = deferred<Result<GuessResponse>>()
    setup(GuessScreen, ci, { guess: () => d.p })
    fireEvent.change(screen.getByLabelText('guess answer'), { target: { value: 'money grows' } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    expect(screen.getByText('thinking…')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Submit' }).hasAttribute('disabled')).toBe(true)
    await act(async () => d.resolve({ classification: 'vague', misconceptionId: null, message: 'Say a bit more.' }))
    expect(screen.queryByText('thinking…')).toBeNull()
    expect(screen.getByText('Say a bit more.')).toBeTruthy()
    expect(screen.queryByText('offline check')).toBeNull()
  })

  it('offline: says so and lets the learner continue', async () => {
    const off: Offline = { offline: true, reason: 'codex_unavailable' }
    const { next } = setup(GuessScreen, ci, { guess: async () => off })
    fireEvent.change(screen.getByLabelText('guess answer'), { target: { value: 'money grows' } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    expect(await screen.findByText(/thinking is offline/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(next).toHaveBeenCalled()
  })

  it('a 429 gets the friendly line, not an error', async () => {
    const off: Offline = { offline: true, reason: 'network', detail: 'HTTP 429' }
    setup(GuessScreen, ci, { guess: async () => off })
    fireEvent.change(screen.getByLabelText('guess answer'), { target: { value: 'money grows' } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    expect(await screen.findByText(RATE_LIMITED)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Next' })).toBeTruthy()
  })
})

describe('AnchorScreen', () => {
  it('text topic: fact card, prediction, SPOT ON, Next', async () => {
    const { next, state } = setup(AnchorScreen, plain)
    expect(screen.getByText(ci.rubric.anchorDescription)).toBeTruthy()
    expect(screen.getByText(ci.rubric.anchorPrompt)).toBeTruthy()
    expect(screen.queryByRole('slider', { name: /your prediction/ })).toBeNull()
    fireEvent.change(screen.getByLabelText('anchor answer'), { target: { value: 'Year 1 is $1,070, year 2 is $1,144.90; the 7% is on a bigger balance that holds past interest' } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    expect(await screen.findByText('SPOT ON')).toBeTruthy()
    expect(state().anchorResult?.verdict).toBe('demonstrated')
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(next).toHaveBeenCalled()
  })

  it('curve topic: predict on the graph, NOT YET, one retry, then the real curve next to the mark', async () => {
    const calls: string[] = []
    const replies: AnchorResponse[] = [
      { verdict: 'unresolved', feedback: 'Year 2 is not the same as year 1.', followUpQuestion: 'What is 7% of $1,070?' },
      { verdict: 'demonstrated', feedback: 'Yes: $74.90, more than $70.', followUpQuestion: null },
    ]
    const d = deferred<void>()
    setup(AnchorScreen, ci, {
      anchor: async (_s, b) => {
        calls.push(b.answer)
        if (calls.length === 2) await d.p
        return replies[calls.length - 1]
      },
    })
    const pad = screen.getByRole('slider', { name: 'your prediction at years 30' })
    fireEvent.change(screen.getByLabelText('anchor answer'), { target: { value: 'same $70 each year' } })
    expect(screen.getByRole('button', { name: 'Submit' }).hasAttribute('disabled')).toBe(true) // mark not placed
    for (let i = 0; i < 21; i++) fireEvent.keyDown(pad, { key: 'ArrowUp' })
    expect(pad.getAttribute('aria-valuetext')).toBe('$3,100')
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    expect(await screen.findByText('NOT YET')).toBeTruthy()
    expect(calls[0]).toContain('$3,100')
    expect(screen.getByText('What is 7% of $1,070?')).toBeTruthy()
    expect(screen.queryByRole('img')).toBeNull() // the real curve waits until the attempt is over
    fireEvent.change(screen.getByLabelText('follow-up answer'), { target: { value: '$74.90' } })
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('thinking…')).toBeTruthy()
    await act(async () => d.resolve())
    expect(await screen.findByText('SPOT ON')).toBeTruthy()
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('$7,612')
    fireEvent.change(screen.getByLabelText(/yearly rate/), { target: { value: '1' } })
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('$1,348')
    expect(screen.getByRole('button', { name: 'Next' })).toBeTruthy()
  })

  it('offline: says so and lets the learner continue', async () => {
    const { next } = setup(AnchorScreen, plain, { anchor: async () => ({ offline: true, reason: 'network', detail: 'Failed to fetch' }) })
    fireEvent.change(screen.getByLabelText('anchor answer'), { target: { value: 'it grows' } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    expect(await screen.findByText(/can't reach the server/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(next).toHaveBeenCalled()
  })

  it('offline check label on a fallback result', async () => {
    setup(AnchorScreen, plain)
    fireEvent.change(screen.getByLabelText('anchor answer'), { target: { value: 'no idea' } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    expect(await screen.findByText('NOT YET')).toBeTruthy()
    expect(screen.getByText('offline check')).toBeTruthy()
  })
})
