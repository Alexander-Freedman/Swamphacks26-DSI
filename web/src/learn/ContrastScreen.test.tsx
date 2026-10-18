// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import topicJson from '../../../data/learn/compound-interest.json'
import { createMockLearnApi } from '../learnApi'
import { ContrastScreen } from './ContrastScreen'
import { initialState } from './state'
import type { LearnApi, LearnState, StageProps, Topic } from './types'

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

describe('contrast case text', () => {
  it('splits a long case into one short line per sentence', async () => {
    const { lines } = await import('./ContrastScreen')
    expect(lines('On dark soil, 100 brown beetles start. Birds eat 60 green ones. In Case B, mud washes off.')).toEqual([
      'On dark soil, 100 brown beetles start.',
      'Birds eat 60 green ones.',
      'In Case B, mud washes off.',
    ])
    expect(lines('Costs $1.50 each. 30% fail.')).toEqual(['Costs $1.50 each.', '30% fail.'])
  })
})
