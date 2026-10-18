// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockLearnApi } from '../../../learnApi'
import { LearnSession } from '../../LearnSession'
import { customScreen, learnForCard } from '../registry'
import type { Stage, Topic } from '../../types'
import topic from '../../../../../data/learn/sn2-reaction.json'

beforeEach(() => {
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
})
afterEach(cleanup)
const api = () => createMockLearnApi([topic as unknown as Topic])
const open = (stage: Stage) => render(<LearnSession slug="sn2-reaction" onDone={() => {}} api={api()} initial={{ stage }} />)

describe('sn2-reaction: orgo tools inside the Learn steps', () => {
  it('registers anchor, stress, draw and neighbor for sn2-reaction only', () => {
    for (const s of ['anchor', 'stress', 'draw', 'neighbor'] as Stage[]) expect(customScreen('sn2-reaction', s)).toBeTruthy()
    for (const s of ['guess', 'contrast', 'transfer', 'done'] as Stage[]) expect(customScreen('sn2-reaction', s)).toBeUndefined()
    expect(customScreen('compound-interest', 'draw')).toBeUndefined()
  })

  it('each orgo step opens its tool inside the Learn step', async () => {
    const tools: [Stage, RegExp, string][] = [
      ['anchor', /Orgo · Build ethanol/, 'add carbon'],
      ['stress', /Orgo · Same pattern, new reaction/, 'O of hydroxide'],
      ['draw', /Orgo · SN2 arrows/, 'Show me'],
      ['neighbor', /Orgo · SN2 vs E2/, ''],
    ]
    for (const [stage, chip, control] of tools) {
      const { unmount } = open(stage)
      const step = await screen.findByRole('region', { name: stage })
      expect(step.querySelector('.ss-frame')).toBeTruthy()
      expect(screen.getByText(chip)).toBeTruthy()
      if (control) expect(screen.getAllByRole('button', { name: control }).length).toBeGreaterThan(0)
      unmount()
    }
  })

  it('building ethanol inside the anchor step never scrolls the page (embedded)', async () => {
    open('anchor')
    await screen.findByRole('region', { name: 'anchor' })
    fireEvent.click(screen.getByRole('button', { name: 'add carbon' }))
    expect(window.scrollTo).not.toHaveBeenCalled()
  })

  it('guess, contrast, transfer and done stay the generic Learn screens', async () => {
    for (const stage of ['guess', 'contrast', 'transfer', 'done'] as Stage[]) {
      const { unmount } = open(stage)
      const step = await screen.findByRole('region', { name: stage })
      expect(step.querySelector('.ss-frame')).toBeNull()
      unmount()
    }
  })

  it('the Orgo card on Home opens this Learn topic', () => {
    expect(learnForCard('orgo')).toBe('sn2-reaction')
    expect(learnForCard('calculus')).toBe('derivative')
  })

  it('finishing the anchor tool (build ethanol, Check it, Finish, Done) moves the Learn session on to contrast', async () => {
    open('anchor')
    const step = await screen.findByRole('region', { name: 'anchor' })
    const add = (name: string) => fireEvent.click(within(step).getByRole('button', { name: `add ${name}` }))
    const pick = (re: RegExp) => fireEvent.focus(within(step).getByRole('button', { name: re }))
    add('carbon')
    add('carbon')
    add('oxygen')
    add('hydrogen')
    pick(/^carbon C0, /)
    for (let i = 0; i < 3; i++) add('hydrogen')
    pick(/^carbon C1, /)
    for (let i = 0; i < 2; i++) add('hydrogen')
    fireEvent.click(within(step).getByText('Check it'))
    fireEvent.click(within(step).getByText('Finish ✓'))
    fireEvent.click(within(step).getByRole('button', { name: 'Done' }))
    expect(await screen.findByRole('region', { name: 'contrast' })).toBeTruthy()
  })
})

