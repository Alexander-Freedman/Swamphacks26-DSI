// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockLearnApi } from '../learnApi'
import bundled from '../../../data/learn/compound-interest.json'
import { KEY } from '../notebook'
import { initialState } from './state'
import type { LearnApi, LearnState, Offline, StageProps, Topic } from './types'
import { DrawScreen } from './DrawScreen'
import type { ComponentType } from 'react'

const topic = bundled as unknown as Topic
const OFF: Offline = { offline: true, reason: 'codex_unavailable' }

afterEach(cleanup)
beforeEach(() => localStorage.removeItem(KEY))

/** Renders a screen with real state updates, so later renders see what the screen saved. */
function mount(Screen: ComponentType<StageProps>, api: LearnApi, start: Partial<LearnState> = {}) {
  const ref = { state: { ...initialState(), ...start } as LearnState }
  const next = vi.fn()
  const view = render(<Screen topic={topic} state={ref.state} update={() => {}} next={next} api={api} />)
  const update = (p: Partial<LearnState>) => {
    ref.state = { ...ref.state, ...p }
    view.rerender(<Screen topic={topic} state={ref.state} update={update} next={next} api={api} />)
  }
  view.rerender(<Screen topic={topic} state={ref.state} update={update} next={next} api={api} />)
  return { ref, next }
}

/** A promise you resolve by hand, to see the "thinking…" state. */
function gate<T>() {
  let open!: (v: T) => void
  const p = new Promise<T>((r) => (open = r))
  return { p, open }
}

describe('Draw', () => {
  it('grades the rule per criterion, then asks one follow-up', async () => {
    const api = createMockLearnApi()
    const { ref, next } = mount(DrawScreen, api)
    expect(screen.getByText(/Sketch how it works from memory/)).toBeTruthy()
    fireEvent.change(screen.getByLabelText('The rule, in one line'), { target: { value: 'it grows' } })
    fireEvent.click(screen.getByRole('button', { name: 'Check my sketch' }))
    await screen.findByRole('list', { name: 'how your sketch did' })
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
    expect(ref.state.drawVerdicts).toHaveLength(4)
    expect(screen.getByText('offline check')).toBeTruthy()
    const follow = screen.getByLabelText(topic.rubric.whyRuleQuestion)
    fireEvent.change(follow, { target: { value: 'interest on the current balance which includes past interest' } })
    fireEvent.click(screen.getByRole('button', { name: 'Answer' }))
    await vi.waitFor(() => expect(screen.queryByRole('button', { name: 'Answer' })).toBeNull())
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(next).toHaveBeenCalled()
  })

  it('shows thinking while busy and the offline text when the server is down', async () => {
    const g = gate<Offline>()
    const api = { ...createMockLearnApi(), draw: () => g.p }
    mount(DrawScreen, api)
    fireEvent.change(screen.getByLabelText('The rule, in one line'), { target: { value: 'x' } })
    fireEvent.click(screen.getByRole('button', { name: 'Check my sketch' }))
    expect(await screen.findByText('thinking…')).toBeTruthy()
    await act(async () => g.open(OFF))
    expect(screen.getByText('thinking is offline, prebuilt topics still work')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement).disabled).toBe(false)
  })
})

