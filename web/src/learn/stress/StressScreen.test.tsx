// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { useEffect, useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import bundled from '../../../../data/learn/compound-interest.json'
import { createMockLearnApi } from '../../learnApi'
import { initialState } from '../state'
import type { LearnApi, LearnState, StressResponse, Topic } from '../types'
import { latestByCase, withPiece } from './stress'
import { StressScreen } from './StressScreen'

afterEach(cleanup)

const base = bundled as unknown as Topic
// Predict data for the three cases (the real files get theirs from the authoring pass).
const topic: Topic = {
  ...base,
  extremeCases: base.extremeCases.slice(0, 3).map((c, i) => ({
    ...c,
    predict: {
      question: `What happens in case ${i + 1}?`,
      choices: [
        { text: `right answer ${i + 1}`, correct: true, misconceptionId: null },
        { text: `wrong answer ${i + 1}`, correct: false, misconceptionId: 'simple-interest' },
        { text: `other wrong ${i + 1}`, correct: false, misconceptionId: null },
      ],
      piece: `piece ${i + 1}`,
    },
  })),
}
const seen: { state: LearnState | null } = { state: null }

function Harness({ api, fix = '', next = () => {}, t = topic }: { api: LearnApi; fix?: string; next?: () => void; t?: Topic }) {
  const [state, setState] = useState<LearnState>({ ...initialState(), stage: 'stress', fix })
  useEffect(() => {
    seen.state = state
  }, [state])
  return <StressScreen topic={t} state={state} update={(p) => setState((s) => ({ ...s, ...p }))} next={next} api={api} />
}

/** A grader that answers each check in order from a script. */
function scripted(results: Pick<StressResponse, 'verdict' | 'piece'>[]): LearnApi {
  const api = createMockLearnApi()
  let i = 0
  return { ...api, stress: async () => ({ ...results[i], critique: `critique ${++i}` }) }
}

const card = (n: number) => screen.getByRole('listitem', { name: `case ${n}` })
async function pick(n: number, text: RegExp) {
  await act(async () => void fireEvent.click(within(card(n)).getByRole('button', { name: text })))
}

describe('StressScreen: predict, then check', () => {
  it('shows the rule and three cards; only the first is open', () => {
    render(<Harness api={createMockLearnApi()} fix="it grows on itself" />)
    expect(screen.getByText('“it grows on itself”')).toBeTruthy()
    expect(card(1).className).not.toContain('is-locked')
    expect(card(2).className).toContain('is-locked')
    expect(within(card(2)).queryByRole('button', { name: /answer/ })).toBeNull()
  })

  it('asks for a rule first when there is none', () => {
    render(<Harness api={createMockLearnApi()} />)
    expect(screen.getByLabelText('your fix')).toBeTruthy()
    expect((within(card(1)).getByRole('button', { name: /right answer 1/ }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('a pick shows the truth, then whether the rule covered it', async () => {
    render(<Harness api={scripted([{ verdict: 'survives', piece: null }])} fix="it grows on itself" />)
    await pick(1, /right answer 1/)
    expect(within(card(1)).getByText('Right.')).toBeTruthy()
    expect(within(card(1)).getByText('✓ Your rule covered this.')).toBeTruthy()
    expect(seen.state!.stressChoices[0]).toBe(0)
    expect(latestByCase(seen.state!.stressHistory).get(0)?.verdict).toBe('survives')
    expect(card(2).className).not.toContain('is-locked')
  })

  it('a miss names the missing piece; one tap adds it to the rule', async () => {
    render(<Harness api={scripted([{ verdict: 'breaks', piece: 'interest is paid on past interest' }])} fix="money grows" />)
    await pick(1, /wrong answer 1/)
    expect(within(card(1)).getByText('Not quite.')).toBeTruthy()
    fireEvent.click(within(card(1)).getByRole('button', { name: /add to your rule: interest is paid on past interest/ }))
    expect(seen.state!.fix).toBe('money grows; and interest is paid on past interest')
    expect(within(card(1)).getByRole('button', { name: /added to your rule/ }).hasAttribute('disabled')).toBe(true)
  })

  it('after all three cards: the grown rule and the why question', async () => {
    render(<Harness api={scripted([{ verdict: 'survives' }, { verdict: 'breaks', piece: 'p2' }, { verdict: 'survives' }])} fix="it grows" />)
    await pick(1, /right answer 1/)
    await pick(2, /wrong answer 2/)
    fireEvent.click(within(card(2)).getByRole('button', { name: /add to your rule: p2/ }))
    await pick(3, /right answer 3/)
    expect(screen.getByText('Your rule now')).toBeTruthy()
    expect(screen.getByText('“it grows; and p2”', { selector: '.st-rule' })).toBeTruthy()
    expect(screen.getByLabelText('why answer')).toBeTruthy()
  })

  it('a case without predict data checks the rule directly', async () => {
    render(<Harness api={scripted([{ verdict: 'survives' }])} fix="it grows" t={base} />)
    await act(async () => void fireEvent.click(within(card(1)).getByRole('button', { name: 'Test my rule' })))
    expect(within(card(1)).getByText('✓ Your rule covered this.')).toBeTruthy()
  })

  it('a rate limit (429) gets a friendly line, not the server-down line', async () => {
    const api: LearnApi = {
      ...createMockLearnApi(),
      stress: async () => ({ offline: true, reason: 'network', detail: 'slow down: too many answers this hour' }),
    }
    render(<Harness api={api} fix="it grows on itself" />)
    await pick(1, /right answer 1/)
    expect(screen.getByText(/Lots of people are trying this right now/)).toBeTruthy()
  })

  it('a curve topic shows each card its curve at that extreme, with the watch line', () => {
    render(<Harness api={createMockLearnApi()} fix="it grows on itself" />)
    expect(within(card(1)).getByRole('img')).toBeTruthy()
  })

  it('a topic without a visual keeps plain text cards', () => {
    render(<Harness api={createMockLearnApi()} fix="x" t={{ ...topic, visual: null }} />)
    expect(screen.queryAllByRole('img')).toHaveLength(0)
  })

  it('Next always moves on', () => {
    let moved = false
    render(<Harness api={createMockLearnApi()} next={() => (moved = true)} />)
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(moved).toBe(true)
  })
})

describe('withPiece', () => {
  it('adds a clause, or starts the rule', () => {
    expect(withPiece('money grows.', 'on past interest')).toBe('money grows; and on past interest')
    expect(withPiece('', 'on past interest')).toBe('on past interest')
  })
})
