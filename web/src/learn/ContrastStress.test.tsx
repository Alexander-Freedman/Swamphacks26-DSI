// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import topicJson from '../../../data/learn/compound-interest.json'
import { createMockLearnApi } from '../learnApi'
import { ContrastScreen } from './ContrastScreen'
import { StressScreen } from './StressScreen'
import { initialState } from './state'
import type { LearnApi, LearnState, StageProps, StressResponse, Topic } from './types'

afterEach(cleanup)
const topic = topicJson as unknown as Topic

function Harness({
  Screen,
  api,
  start,
  onState,
}: {
  Screen: (p: StageProps) => React.ReactNode
  api: LearnApi
  start?: Partial<LearnState>
  onState?: (s: LearnState) => void
}) {
  const [state, setState] = useState<LearnState>({ ...initialState(), ...start })
  onState?.(state)
  return <Screen topic={topic} state={state} update={(p) => setState((s) => ({ ...s, ...p }))} next={() => {}} api={api} />
}

function deferred<T>() {
  let resolve!: (v: T) => void
  const promise = new Promise<T>((r) => (resolve = r))
  return { promise, resolve }
}

describe('ContrastScreen', () => {
  it('shows two cases with the difference highlighted and saves the fix', () => {
    let last: LearnState | null = null
    render(<Harness Screen={ContrastScreen} api={createMockLearnApi()} onState={(s) => (last = s)} />)
    const c = topic.rubric.contrastingCases
    expect(screen.getByText(c[0].oneLine).tagName).toBe('MARK')
    expect(screen.getByText(c[1].oneLine).tagName).toBe('MARK')
    expect(screen.queryByText(c[2].oneLine)).toBeNull()
    fireEvent.change(screen.getByLabelText('contrast answer'), { target: { value: 'interest earns interest' } })
    expect(last!.fix).toBe('interest earns interest')
  })
})

describe('StressScreen', () => {
  const verdicts = (seq: StressResponse['verdict'][]) => {
    const api = createMockLearnApi()
    let i = 0
    api.stress = vi.fn(async (_s, b) => ({ verdict: seq[i++], critique: `Critique of "${b.fix}"` }))
    return api
  }

  it('two survives unlock the why question, and the rule is never shown', async () => {
    const api = verdicts(['survives', 'survives'])
    api.why = vi.fn(async () => ({ verdict: 'demonstrated' as const, feedback: 'Each year multiplies.', followUpQuestion: null }))
    let last: LearnState | null = null
    render(<Harness Screen={StressScreen} api={api} start={{ fix: 'growth feeds on itself' }} onState={(s) => (last = s)} />)
    fireEvent.click(screen.getByRole('button', { name: 'Test on case 1' }))
    expect(await screen.findByText('SURVIVES')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Test on case 2' }))
    expect(await screen.findByText(topic.rubric.whyRuleQuestion)).toBeTruthy()
    expect(screen.queryByText(topic.rubric.coreRule)).toBeNull()
    expect(last!.stressHistory.map((h) => h.caseIndex)).toEqual([0, 1])
    fireEvent.change(screen.getByLabelText('why answer'), { target: { value: 'because it compounds' } })
    fireEvent.click(screen.getByRole('button', { name: 'Check' }))
    expect(await screen.findByText('Each year multiplies.')).toBeTruthy()
    expect(last!.whyResult?.verdict).toBe('demonstrated')
  })

  it('a break lets the learner fix the rule and retry that case; three breaks reveal', async () => {
    const api = verdicts(['breaks', 'breaks', 'breaks'])
    api.reveal = vi.fn(async () => ({ explanation: 'Because…', revealedRule: 'THE RULE', confirmCase: 'See case 2.' }))
    let last: LearnState | null = null
    render(<Harness Screen={StressScreen} api={api} start={{ fix: 'it just adds up' }} onState={(s) => (last = s)} />)
    fireEvent.click(screen.getByRole('button', { name: 'Test on case 1' }))
    expect(await screen.findByText('BREAKS')).toBeTruthy()
    expect(screen.getByText('Critique of "it just adds up"')).toBeTruthy()
    expect(screen.queryByText('THE RULE')).toBeNull()
    fireEvent.change(screen.getByLabelText('Fix your rule'), { target: { value: 'v2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Try case 1 again' }))
    await screen.findByText('Critique of "v2"')
    fireEvent.click(screen.getByRole('button', { name: 'Try case 1 again' }))
    expect(await screen.findByText('THE RULE')).toBeTruthy()
    expect(api.reveal).toHaveBeenCalledWith('compound-interest', { history: last!.stressHistory })
    expect(last!.stressHistory).toHaveLength(3)
    expect(last!.stressCritiques).toHaveLength(3)
    expect(last!.revealResult?.revealedRule).toBe('THE RULE')
    expect(last!.fix).toBe('v2')
  })

  it('shows thinking while the call runs', async () => {
    const api = createMockLearnApi()
    const d = deferred<StressResponse>()
    api.stress = vi.fn(() => d.promise)
    render(<Harness Screen={StressScreen} api={api} start={{ fix: 'x y z' }} />)
    fireEvent.click(screen.getByRole('button', { name: 'Test on case 1' }))
    expect(await screen.findByText('thinking…')).toBeTruthy()
    await act(async () => d.resolve({ verdict: 'survives', critique: 'ok', offline: true }))
    await waitFor(() => expect(screen.queryByText('thinking…')).toBeNull())
    expect(screen.getByText('offline check')).toBeTruthy()
  })

  it('when the server is unreachable it says so and Next still works', async () => {
    const api = createMockLearnApi()
    api.stress = vi.fn(async () => ({ offline: true as const, reason: 'network' as const }))
    render(<Harness Screen={StressScreen} api={api} start={{ fix: 'x y z' }} />)
    fireEvent.click(screen.getByRole('button', { name: 'Test on case 1' }))
    expect(await screen.findByText(/can't reach the server right now/)).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('works end to end on the offline graders', async () => {
    render(<Harness Screen={StressScreen} api={createMockLearnApi()} start={{ fix: 'nothing' }} />)
    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByRole('button', { name: /case 1/ }))
      await act(async () => new Promise((r) => setTimeout(r, 0)))
    }
    expect(await screen.findByText(topic.rubric.coreRule)).toBeTruthy()
  })
})
