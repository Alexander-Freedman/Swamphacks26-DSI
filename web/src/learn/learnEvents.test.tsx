// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import bundled from '../../../data/learn/compound-interest.json'
import { createMockLearnApi } from '../learnApi'
import { roomLine } from './learnEvents'
import { initialState } from './state'
import { StressScreen } from './stress/StressScreen'
import type { LearnState, Topic } from './types'

afterEach(() => {
  cleanup()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

const base = bundled as unknown as Topic
const topic: Topic = {
  ...base,
  extremeCases: base.extremeCases.slice(0, 3).map((c, i) => ({
    ...c,
    predict: {
      question: `What happens in case ${i + 1}?`,
      choices: [
        { text: `right answer ${i + 1}`, correct: true, misconceptionId: null },
        { text: `wrong answer ${i + 1}`, correct: false, misconceptionId: 'simple-interest' },
      ],
      piece: `piece ${i + 1}`,
    },
  })),
}

function Harness() {
  const [state, setState] = useState<LearnState>({ ...initialState(), stage: 'stress', fix: 'When money grows, it grows faster.' })
  return <StressScreen topic={topic} state={state} update={(p) => setState((s) => ({ ...s, ...p }))} next={() => {}} api={createMockLearnApi([topic])} />
}

describe('how others answered (Tiger Data)', () => {
  it('says it plainly', () => {
    expect(roomLine(null)).toBeNull()
    expect(roomLine({ n: 1, shares: { correct: 1 } })).toMatch(/first learner/)
    expect(roomLine({ n: 13, shares: { correct: 0.615, 'simple-interest': 0.385 } })).toBe('62% of 13 learners predicted this right.')
    expect(roomLine({ n: 4, shares: { 'simple-interest': 1 } })).toBe('0% of 4 learners predicted this right.')
  })

  it('a stress pick is recorded with its case and choice, and the room shows under the card', async () => {
    vi.stubEnv('VITE_API_BASE', 'https://api.test')
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ room: { n: 13, shares: { correct: 0.615 } } }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: 'wrong answer 1' }))
    expect(await screen.findByText('62% of 13 learners predicted this right.')).toBeTruthy()
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://api.test/api/learn-events')
    expect(JSON.parse(init.body as string)).toMatchObject({ slug: topic.slug, step: 'stress', case_index: 0, choice: 1 })
  })

  it('no backend: nothing is sent and no line shows', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: 'right answer 1' }))
    await new Promise((r) => setTimeout(r, 50))
    expect(fetchMock).not.toHaveBeenCalled()
    expect(screen.queryByText(/learners predicted/)).toBeNull()
  })
})
