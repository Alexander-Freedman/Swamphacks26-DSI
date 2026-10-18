// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { createMockLearnApi } from '../../../learnApi'
import { LearnSession } from '../../LearnSession'
import { customScreen } from '../registry'
import type { Topic } from '../../types'
import topic from '../../../../../data/learn/derivative.json'

afterEach(cleanup)
const api = () => createMockLearnApi([topic as unknown as Topic])

describe('derivative: calculus tools inside the Learn steps', () => {
  it('registers anchor, neighbor and transfer for derivative only', () => {
    expect(customScreen('derivative', 'anchor')).toBeTruthy()
    expect(customScreen('derivative', 'neighbor')).toBeTruthy()
    expect(customScreen('derivative', 'transfer')).toBeTruthy()
    expect(customScreen('derivative', 'guess')).toBeUndefined()
    expect(customScreen('compound-interest', 'anchor')).toBeUndefined()
  })

  it('anchor opens the slope sketch inside the Learn step, with the why-pane', async () => {
    render(<LearnSession slug="derivative" onDone={() => {}} api={api()} initial={{ stage: 'anchor' }} />)
    const step = await screen.findByRole('region', { name: 'anchor' })
    expect(step.querySelector('.ss-frame')).toBeTruthy()
    expect(screen.getByText(/Calculus · The slope of a curve/)).toBeTruthy()
    expect(screen.getByRole('complementary', { name: 'Why this step' })).toBeTruthy()
  })

  it('neighbor is the area tool, transfer is slope-and-area-undo-each-other', async () => {
    const { unmount } = render(<LearnSession slug="derivative" onDone={() => {}} api={api()} initial={{ stage: 'neighbor' }} />)
    await screen.findByRole('region', { name: 'neighbor' })
    expect(screen.getByText(/Calculus · Area under a curve/)).toBeTruthy()
    unmount()
    render(<LearnSession slug="derivative" onDone={() => {}} api={api()} initial={{ stage: 'transfer' }} />)
    await screen.findByRole('region', { name: 'transfer' })
    expect(screen.getByText(/Calculus · Slope and area undo each other/)).toBeTruthy()
  })

  it('other steps stay the generic Learn screens', async () => {
    render(<LearnSession slug="derivative" onDone={() => {}} api={api()} initial={{ stage: 'contrast' }} />)
    const step = await screen.findByRole('region', { name: 'contrast' })
    expect(step.querySelector('.ss-frame')).toBeNull()
  })
})

describe('Home demo card', () => {
  it('the Calculus card opens the derivative Learn topic', async () => {
    const { learnForCard } = await import('../registry')
    expect(learnForCard('calculus')).toBe('derivative')
    expect(learnForCard('birthday')).toBeUndefined()
  })
})
