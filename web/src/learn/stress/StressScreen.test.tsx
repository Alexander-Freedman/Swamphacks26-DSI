// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { useEffect, useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import bundled from '../../../../data/learn/compound-interest.json'
import { createMockLearnApi } from '../../learnApi'
import { initialState } from '../state'
import type { LearnApi, LearnState, StressResponse, Topic } from '../types'
import { latestByCase } from './stress'
import { StressScreen } from './StressScreen'

afterEach(cleanup)

const topic = bundled as unknown as Topic
const seen: { state: LearnState | null } = { state: null }

function Harness({ api, fix = '', next = () => {} }: { api: LearnApi; fix?: string; next?: () => void }) {
  const [state, setState] = useState<LearnState>({ ...initialState(), stage: 'stress', fix })
  useEffect(() => {
    seen.state = state
  }, [state])
  return <StressScreen topic={topic} state={state} update={(p) => setState((s) => ({ ...s, ...p }))} next={next} api={api} />
}

/** A grader that answers each case in order from a script. */
function scripted(verdicts: StressResponse['verdict'][]): LearnApi {
  const base = createMockLearnApi()
  let i = 0
  return { ...base, stress: async () => ({ verdict: verdicts[i++], critique: `critique ${i}` }) }
}

const card = (n: number) => screen.getByRole('listitem', { name: `case ${n}` })
async function testCase(n: number) {
  await act(async () => void fireEvent.click(within(card(n)).getByRole('button')))
}

describe('StressScreen', () => {
  it('shows the fix as a chip and three extreme cards', () => {
    render(<Harness api={createMockLearnApi()} fix="it grows on itself" />)
    expect(screen.getByText('“it grows on itself”')).toBeTruthy()
    for (let n = 1; n <= 3; n++) expect(within(card(n)).getByText(topic.extremeCases[n - 1].scenario)).toBeTruthy()
  })

  it('asks for a fix first when there is none', () => {
    render(<Harness api={createMockLearnApi()} />)
    expect((within(card(1)).getByRole('button', { name: 'Test it' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.change(screen.getByLabelText('your fix'), { target: { value: 'rate and time decide it' } })
    fireEvent.click(screen.getByRole('button', { name: 'Use it' }))
    expect((within(card(1)).getByRole('button', { name: 'Test it' }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('stamps each card and saves the history', async () => {
    render(<Harness api={scripted(['survives', 'breaks'])} fix="my fix" />)
    await testCase(1)
    expect(within(card(1)).getByText('survives')).toBeTruthy()
    expect(within(card(1)).getByText('critique 1')).toBeTruthy()
    await testCase(2)
    expect(within(card(2)).getByText('breaks')).toBeTruthy()
    expect(seen.state!.stressHistory).toEqual([
      { caseIndex: 0, fix: 'my fix', verdict: 'survives' },
      { caseIndex: 1, fix: 'my fix', verdict: 'breaks' },
    ])
    expect(seen.state!.stressCritiques).toHaveLength(2)
  })

  it('a break lets you revise the fix and retry that card', async () => {
    render(<Harness api={scripted(['breaks', 'survives'])} fix="old fix" />)
    await testCase(1)
    const retry = within(card(1)).getByRole('button') as HTMLButtonElement
    expect(retry.disabled).toBe(true) // same fix: revise first
    fireEvent.click(screen.getByRole('button', { name: 'Revise' }))
    fireEvent.change(screen.getByLabelText('your fix'), { target: { value: 'new fix' } })
    fireEvent.click(screen.getByRole('button', { name: 'Use it' }))
    expect(within(card(1)).getByRole('button', { name: 'Retry with the new fix' })).toBeTruthy()
    await testCase(1)
    expect(within(card(1)).getByText('survives')).toBeTruthy()
    expect(latestByCase(seen.state!.stressHistory).get(0)).toEqual({ caseIndex: 0, fix: 'new fix', verdict: 'survives' })
  })

  it('two survives on different cases open the why question', async () => {
    render(<Harness api={scripted(['survives', 'survives'])} fix="my fix" />)
    await testCase(1)
    expect(screen.queryByText(topic.rubric.whyRuleQuestion)).toBeNull()
    await testCase(2)
    expect(screen.getByText(topic.rubric.whyRuleQuestion)).toBeTruthy()
    fireEvent.change(screen.getByLabelText('why answer'), { target: { value: 'each year earns interest on last year interest so it multiplies' } })
    await act(async () => void fireEvent.click(screen.getByRole('button', { name: 'Check it' })))
    expect(seen.state!.whyResult).not.toBeNull()
  })

  it('three breaks bring the reveal, tied to the broken case', async () => {
    const api = scripted(['breaks', 'breaks', 'breaks'])
    render(<Harness api={api} fix="it adds the same amount each year" />)
    await testCase(1)
    await testCase(2)
    await testCase(3)
    expect(await screen.findByText(topic.rubric.coreRule)).toBeTruthy()
    expect(seen.state!.revealResult?.confirmCase).toBe(topic.extremeCases[0].correctBehavior)
    expect(screen.queryByRole('button', { name: /retry/i })).toBeNull()
  })

  it('says when the answer came from the offline check', async () => {
    render(<Harness api={createMockLearnApi()} fix="my fix" />)
    await testCase(1)
    expect(screen.getByText(/Checked against the topic's notes/)).toBeTruthy()
  })

  it('Next always moves on', () => {
    let moved = false
    render(<Harness api={createMockLearnApi()} next={() => (moved = true)} />)
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(moved).toBe(true)
  })

  it('a rate limit (429) gets a friendly line, not the server-down line', async () => {
    const api: LearnApi = { ...createMockLearnApi(), stress: async () => ({ offline: true, reason: 'network', detail: 'slow down: too many answers this hour' }) }
    render(<Harness api={api} fix="it grows on itself" />)
    await testCase(1)
    expect(screen.getByText(/Lots of people are trying this right now/)).toBeTruthy()
    expect(screen.queryByText(/can't reach the server/)).toBeNull()
  })

  it('a curve topic shows each card its curve at that extreme, with the watch line', () => {
    render(<Harness api={createMockLearnApi()} fix="it grows on itself" />)
    for (const n of [1, 2, 3]) expect(within(card(n)).getByRole('img')).toBeTruthy()
    expect(within(card(1)).getByText('yearly rate (%) = 5')).toBeTruthy()
    expect(within(card(1)).getByText(/grows to \$4,322 by year 30/)).toBeTruthy()
    expect(within(card(2)).getByText('yearly rate (%) = 0')).toBeTruthy()
    expect(within(card(3)).getByText('yearly rate (%) = 10')).toBeTruthy()
  })

  it('a topic without a visual keeps plain text cards', () => {
    const plain = { ...topic, visual: null }
    render(<StressScreen topic={plain} state={{ ...initialState(), stage: 'stress', fix: 'x' }} update={() => {}} next={() => {}} api={createMockLearnApi()} />)
    expect(screen.queryAllByRole('img')).toHaveLength(0)
  })
})

