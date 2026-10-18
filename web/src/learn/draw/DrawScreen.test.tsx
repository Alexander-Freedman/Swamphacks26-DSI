// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMockLearnApi } from '../../learnApi'
import topicJson from '../../../../data/learn/compound-interest.json'
import { initialState } from '../state'
import type { LearnState, Topic } from '../types'
import { DrawScreen } from './DrawScreen'

afterEach(cleanup)
// jsdom has no canvas; the pad must cope with a missing 2d context
HTMLCanvasElement.prototype.getContext = (() => null) as unknown as HTMLCanvasElement['getContext']

const topic = topicJson as unknown as Topic

function setup(partial: Partial<LearnState> = {}) {
  const state = { ...initialState(), stage: 'draw' as const, ...partial }
  const update = vi.fn((p: Partial<LearnState>) => Object.assign(state, p))
  const next = vi.fn()
  const view = render(<DrawScreen topic={topic} state={state} update={update} next={next} api={createMockLearnApi()} />)
  return { state, update, next, view }
}

describe('Draw it', () => {
  it('starts blank: pad, rule line, Check it waits for a rule, Next always there', () => {
    const { next } = setup()
    expect(screen.getByRole('heading', { name: 'Draw it from memory.' })).toBeTruthy()
    expect(screen.getByLabelText(/drawing pad/)).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Check it' }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getAllByRole('button', { name: 'Next' })).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(next).toHaveBeenCalled()
  })

  it('grades the four parts as stamped rows, saves them, and asks the follow-up', async () => {
    const { update } = setup({ drawRule: 'money grows' })
    // drawing in jsdom: no 2d context, so this just must not throw
    const pad = screen.getByLabelText(/drawing pad/)
    fireEvent.pointerDown(pad, { clientX: 10, clientY: 10, pointerId: 1 })
    fireEvent.pointerMove(pad, { clientX: 40, clientY: 40, pointerId: 1 })
    fireEvent.pointerUp(pad, { pointerId: 1 })
    fireEvent.click(screen.getByRole('button', { name: 'Check it' }))
    const rows = await screen.findByRole('list', { name: 'how your drawing did' })
    const items = within(rows).getAllByRole('listitem')
    expect(items.map((li) => li.querySelector('.dr-label')!.textContent)).toEqual(['The parts', 'How they connect', 'The rule', 'Why it holds'])
    expect(rows.textContent).toMatch(/missing/)
    const saved = update.mock.calls.map((c) => c[0]).find((p) => p.drawVerdicts)!
    expect(saved.drawVerdicts!.map((c) => c.id)).toEqual(['entities', 'links', 'rule', 'why-rule'])
    expect(screen.getByText(topic.rubric.whyRuleQuestion)).toBeTruthy()
    expect(screen.getByText(/Checked against the topic's notes/)).toBeTruthy()
  })

  it('a rule that says it gets the rule stamped "got it"', async () => {
    setup({ drawRule: topic.rubric.coreRule, drawNotes: `${topic.rubric.entities.join(', ')}. ${topic.rubric.causalLinks.join('. ')}. ${topic.rubric.whyRuleMatters}` })
    fireEvent.click(screen.getByRole('button', { name: 'Check it' }))
    const rows = await screen.findByRole('list', { name: 'how your drawing did' })
    expect(within(rows).getAllByText('✓ got it').length).toBe(4)
    expect(screen.queryByText(topic.rubric.whyRuleQuestion)).toBeNull()
  })

  it('a rate limit (429) gets a friendly line, not the server-down line', async () => {
    const state = { ...initialState(), stage: 'draw' as const, drawRule: 'it grows on itself' }
    const api = { ...createMockLearnApi(), draw: async () => ({ offline: true as const, reason: 'network' as const, detail: 'slow down: too many answers this hour' }) }
    render(<DrawScreen topic={topic} state={state} update={vi.fn()} next={vi.fn()} api={api} />)
    fireEvent.click(screen.getByRole('button', { name: 'Check it' }))
    expect(await screen.findByText(/Lots of people are trying this right now/)).toBeTruthy()
    expect(screen.queryByText(/can't reach the server/)).toBeNull()
  })

  it('sends the rule, the notes and the sketch (or null without a canvas) to /draw', async () => {
    const sent: unknown[] = []
    const base = createMockLearnApi()
    const api = { ...base, draw: async (slug: string, b: Parameters<typeof base.draw>[1]) => (sent.push(b), base.draw(slug, b)) }
    const state = { ...initialState(), stage: 'draw' as const, drawRule: 'it grows on itself', drawNotes: 'arrows from balance to interest' }
    render(<DrawScreen topic={topic} state={state} update={vi.fn()} next={vi.fn()} api={api} />)
    fireEvent.click(screen.getByRole('button', { name: 'Check it' }))
    await screen.findByRole('list', { name: 'how your drawing did' })
    expect(sent).toEqual([{ rule: 'it grows on itself', notes: 'arrows from balance to interest', image: null }])
  })
})

