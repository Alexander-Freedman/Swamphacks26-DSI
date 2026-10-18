// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { entries, labelFor } from '../../notebook'
import { session } from './index'
import { PROJ_MISTAKES } from './projectile'

// reduced motion: every flight lands at once
beforeEach(() => {
  localStorage.clear()
  window.matchMedia = ((q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia
})
afterEach(cleanup)

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }))

describe('physics session', () => {
  it('opens on a chapter menu', () => {
    render(<session.Component onDone={() => {}} />)
    expect(screen.getByRole('heading', { name: 'Motion' })).toBeTruthy()
    expect((screen.getByRole('button', { name: /^Projectile motion/ }) as HTMLButtonElement).disabled).toBe(false)
    expect(screen.queryByRole('button', { name: /^Orbits/ })).toBeNull()
    expect(screen.queryByText(/coming next/i)).toBeNull()
  })

  it('projectile: drop vs fired, hit the target, speed at the top, best angle', () => {
    render(<session.Component onDone={() => {}} />)
    click(/^Projectile motion/)
    click(/^The dropped one/)
    expect(screen.getByText(PROJ_MISTAKES['sideways-falls-slower'].label)).toBeTruthy()
    click(/^They land together/)
    expect(screen.getByText('Correct!')).toBeTruthy()
    click('Now aim for a target →')

    // a short shot first, then 45° at 20 m/s lands at 40.8 m
    click('Launch')
    expect(screen.getByText(/m short\./)).toBeTruthy()
    fireEvent.change(screen.getByLabelText('launch angle'), { target: { value: '45' } })
    fireEvent.change(screen.getByLabelText('launch speed'), { target: { value: '20' } })
    click('Launch')
    expect(screen.getByText(/^Hit!/)).toBeTruthy()
    click('Next question →')

    click(/^Not at all/)
    expect(screen.getByText(PROJ_MISTAKES['zero-speed-at-top'].label)).toBeTruthy()
    click(/^Just its sideways speed/)
    click(/^60°/)
    expect(screen.getByText(PROJ_MISTAKES['steeper-goes-farther'].label)).toBeTruthy()
    click(/^45°/)
    expect(screen.getByRole('img', { name: /30, 45 and 60 degree launches/ })).toBeTruthy()
    click('Finish ✓')
    expect(screen.getByText(/Saved to your notebook/)).toBeTruthy()
    expect(entries()[0]).toMatchObject({ session: 'physics', misconception: 'sideways-falls-slower', mistakes: ['sideways-falls-slower', 'zero-speed-at-top', 'steeper-goes-farther'] })
  })

  it('the notebook shows the same names as the session', () => {
    for (const [id, m] of Object.entries(PROJ_MISTAKES)) expect(labelFor('physics', id)).toBe(m.label)
  })
})
