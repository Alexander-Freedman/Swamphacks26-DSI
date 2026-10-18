// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { entries } from '../../notebook'
import { session } from './index'
import { LAYER_MISTAKES } from './layers'

beforeEach(() => {
  localStorage.clear()
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
  // reduced motion: the mechanism jumps to the end instead of animating
  window.matchMedia = ((q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia
})
afterEach(cleanup)

const open = () => {
  const C = session.Component
  render(<C onDone={() => {}} />)
  fireEvent.click(screen.getByRole('button', { name: /^Peel SN2/ }))
}
const slider = () => screen.getByRole('slider', { name: 'layer' }) as HTMLInputElement
const heading = () => document.querySelector('.ss-title')!.textContent
const choose = (label: string, text: string) => {
  const sel = screen.getByLabelText(label) as HTMLSelectElement
  const i = [...sel.options].findIndex((o) => o.text === text)
  expect(i).toBeGreaterThanOrEqual(0)
  fireEvent.change(sel, { target: { value: String(i) } })
}

describe('Peel SN2', () => {
  it('is the first SN2 entry on the menu; the step-by-step one is still there', () => {
    const C = session.Component
    render(<C onDone={() => {}} />)
    expect(screen.getByRole('button', { name: /^Peel SN2/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /^SN2 step by step/ })).toBeTruthy()
  })

  it('the slider has five labelled stops, and sliding back keeps what you did', () => {
    open()
    expect(slider().min).toBe('1')
    expect(slider().max).toBe('5')
    for (const l of ['Atoms', 'Electron pairs', 'Curved arrows', 'Energy hill', 'Crowding']) expect(screen.getByRole('button', { name: new RegExp(l) })).toBeTruthy()
    expect(heading()).toBe('1 · Atoms')
    // layer 1: no lone pairs or charges yet
    expect(document.querySelectorAll('.og-scene .og-lp').length).toBe(0)
    fireEvent.click(screen.getByRole('button', { name: 'carbon of CH₃Br' }))
    expect(screen.getByText('Correct')).toBeTruthy()
    fireEvent.change(slider(), { target: { value: '4' } })
    expect(heading()).toBe('4 · Energy hill')
    fireEvent.change(slider(), { target: { value: '1' } })
    expect(screen.getByText('Correct')).toBeTruthy()
    // the stop label works too
    fireEvent.click(screen.getByRole('button', { name: /Electron pairs/ }))
    expect(heading()).toBe('2 · Electron pairs')
    expect(document.querySelectorAll('.og-scene .og-lp').length).toBeGreaterThan(0)
  })

  it('each layer: wrong answers are named, right ones say Correct, and the mistakes reach the notebook', () => {
    open()
    // 1 · atoms
    fireEvent.click(screen.getByRole('button', { name: 'Br' }))
    expect(screen.getByText('✗ Not quite')).toBeTruthy()
    expect(screen.getByText(LAYER_MISTAKES['attack-the-bromine'].label)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'carbon of CH₃Br' }))
    fireEvent.click(screen.getByRole('button', { name: 'Electron pairs →' }))

    // 2 · pairs, with the formal charge worked out
    expect(screen.getByText('FC(O) = 6 − 6 − 1 = −1')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'lone pair on Br (right)' }))
    expect(screen.getByText(LAYER_MISTAKES['bromine-pair-attacks'].label)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'lone pair on O (right)' }))
    expect(screen.getByText('Correct')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Curved arrows →' }))

    // 3 · arrows: a backwards arrow is named, then the right pair animates to the end
    choose('from', 'C–Br bond')
    choose('to', 'C atom')
    fireEvent.click(screen.getByText('Add arrow'))
    fireEvent.click(screen.getByText('Show me'))
    expect(screen.getByText('Arrow from Br toward C (backwards)')).toBeTruthy()
    fireEvent.click(screen.getByText('Draw again'))
    choose('from', 'lone pair on O (right)')
    choose('to', 'C atom')
    fireEvent.click(screen.getByText('Add arrow'))
    choose('from', 'C–Br bond')
    choose('to', 'Br atom')
    fireEvent.click(screen.getByText('Add arrow'))
    fireEvent.click(screen.getByText('Show me'))
    expect(screen.getByText('Correct')).toBeTruthy()
    expect((screen.getByLabelText('scrub the reaction') as HTMLInputElement).value).toBe('100')
    fireEvent.click(screen.getByRole('button', { name: 'Energy hill →' }))

    // 4 · hill: the dot starts at the reactants; the keyboard moves it to the top
    fireEvent.click(screen.getByText('Is this the top?'))
    expect(screen.getByText(LAYER_MISTAKES['ts-not-at-top'].label)).toBeTruthy()
    const dot = screen.getByRole('slider', { name: 'dot on the energy hill' })
    for (let i = 0; i < 21; i++) fireEvent.keyDown(dot, { key: 'ArrowRight' })
    expect(dot.getAttribute('aria-valuenow')).toBe('50')
    // around the top both bonds are dashed (partial)
    expect(document.querySelectorAll('.og-scene line[stroke-dasharray]').length).toBeGreaterThan(0)
    fireEvent.click(screen.getByText('Is this the top?'))
    expect(screen.getByText('Correct')).toBeTruthy()
    expect(screen.getByText('TS ‡')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Crowding →' }))

    // 5 · crowding: the 3° carbon blocks the back side
    fireEvent.click(screen.getByRole('button', { name: /^3°/ }))
    expect(screen.getByText('blocked')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'SN2 works best on 3°' }))
    expect(screen.getByText('SN2 on a 3° carbon')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /^methyl/ }))
    expect(screen.queryByText('blocked')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'SN2 works best on methyl' }))
    expect(screen.getByText('SN2 speed: methyl > 1° > 2° >> 3°')).toBeTruthy()
    fireEvent.click(screen.getByText('Finish ✓'))
    expect(screen.getByText('Saved to your notebook.')).toBeTruthy()
    const e = entries()
    expect(e).toHaveLength(1)
    expect(e[0]).toMatchObject({ session: 'orgo', orgoTopic: 'sn2-layers', misconception: 'attack-the-bromine' })
    expect(e[0]).toMatchObject({ mistakes: ['attack-the-bromine', 'bromine-pair-attacks', 'arrow-backwards', 'ts-not-at-top', 'sn2-on-tertiary'] })
  })
})
