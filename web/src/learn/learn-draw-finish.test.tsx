// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockLearnApi } from '../learnApi'
import bundled from '../../../data/learn/compound-interest.json'
import { entries, KEY } from '../notebook'
import { initialState } from './state'
import type { LearnApi, LearnState, Offline, StageProps, Topic } from './types'
import { NeighborScreen } from './NeighborScreen'
import { TransferScreen } from './TransferScreen'
import { DoneScreen } from './DoneScreen'
import { BUSY_LINE } from './offlineLine'
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

describe('Neighbor', () => {
  it('shows both cards, grades, and gives one follow-up with the prior answer', async () => {
    const calls: unknown[] = []
    const base = createMockLearnApi()
    const api = { ...base, neighbor: (s: string, b: Parameters<LearnApi['neighbor']>[1]) => (calls.push(b), base.neighbor(s, b)) }
    const { ref } = mount(NeighborScreen, api)
    expect(screen.getByText('Simple interest')).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Your answer, one line'), { target: { value: 'no idea' } })
    fireEvent.click(screen.getByRole('button', { name: 'Check' }))
    await screen.findByText(/Not quite/)
    expect(ref.state.neighborResult?.verdict).toBe('incorrect')
    fireEvent.change(screen.getByLabelText('Your answer, one line'), { target: { value: 'simple pays on the original principal' } })
    fireEvent.click(screen.getByRole('button', { name: 'Check' }))
    await vi.waitFor(() => expect(screen.queryByRole('button', { name: 'Check' })).toBeNull())
    expect(calls[1]).toMatchObject({ key: 'simple-interest', priorAnswer: 'no idea' })
  })

  it('offline: shows the offline text and lets the learner continue', async () => {
    const api = { ...createMockLearnApi(), neighbor: async () => OFF }
    const { next } = mount(NeighborScreen, api)
    fireEvent.change(screen.getByLabelText('Your answer, one line'), { target: { value: 'x' } })
    fireEvent.click(screen.getByRole('button', { name: 'Check' }))
    await screen.findByText('thinking is offline, prebuilt topics still work')
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(next).toHaveBeenCalled()
  })
})

describe('Transfer', () => {
  it('pushes once with the missing piece, then retries with wasPushed', async () => {
    const calls: unknown[] = []
    const base = createMockLearnApi()
    const api = { ...base, transfer: (s: string, b: Parameters<LearnApi['transfer']>[1]) => (calls.push(b), base.transfer(s, b)) }
    const { ref } = mount(TransferScreen, api)
    fireEvent.change(screen.getByLabelText('Your example'), { target: { value: 'plants grow' } })
    fireEvent.click(screen.getByRole('button', { name: 'Check' }))
    await screen.findByText(/missing:/)
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await vi.waitFor(() => expect(calls).toHaveLength(2))
    expect(calls[1]).toMatchObject({ wasPushed: true })
    await vi.waitFor(() => expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull())
    expect(ref.state.transferResult).not.toBeNull()
  })

  it('shows thinking while busy', async () => {
    const g = gate<Offline>()
    const api = { ...createMockLearnApi(), transfer: () => g.p }
    mount(TransferScreen, api)
    fireEvent.change(screen.getByLabelText('Your example'), { target: { value: 'x' } })
    fireEvent.click(screen.getByRole('button', { name: 'Check' }))
    expect(await screen.findByText('thinking…')).toBeTruthy()
    await act(async () => g.open({ offline: true, reason: 'network' }))
    expect(screen.getByText("can't reach the server right now")).toBeTruthy()
  })
})

describe('Done', () => {
  it('shows the mistake card and saves the notebook entry', () => {
    const m = topic.misconceptions[0]
    const { next } = mount(DoneScreen, createMockLearnApi(), {
      guess: 'same each year',
      misconceptionId: m.id,
      stressHistory: [{ caseIndex: 0, fix: 'f', verdict: 'breaks' }],
      drawVerdicts: [{ id: 'rule', verdict: 'demonstrated', note: '' }],
      transferResult: { verdict: 'maps', critique: '', missingPiece: null },
    })
    expect(screen.getByRole('heading', { name: m.label })).toBeTruthy()
    expect(screen.getByText('Sketch: 1 of 1 parts shown')).toBeTruthy()
    const saved = entries().filter((e) => e.session === 'learn')
    expect(saved).toHaveLength(1)
    expect(saved[0]).toMatchObject({ slug: topic.slug, guess: 'same each year', misconception: m.id, transferVerdict: 'maps' })
    expect(screen.getByRole('link', { name: 'Open notebook' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Try another topic' }))
    expect(next).toHaveBeenCalled()
  })

  it('no misconception: says so', () => {
    mount(DoneScreen, createMockLearnApi())
    expect(screen.getByText('No wrong model caught')).toBeTruthy()
  })
})

describe('rate limit', () => {
  it('a 429 shows the friendly line, not an error', async () => {
    const api = { ...createMockLearnApi(), transfer: async (): Promise<Offline> => ({ offline: true, reason: 'network', detail: 'HTTP 429' }) }
    mount(TransferScreen, api)
    fireEvent.change(screen.getByLabelText('Your example'), { target: { value: 'x' } })
    fireEvent.click(screen.getByRole('button', { name: 'Check' }))
    expect(await screen.findByText(BUSY_LINE)).toBeTruthy()
  })
})
