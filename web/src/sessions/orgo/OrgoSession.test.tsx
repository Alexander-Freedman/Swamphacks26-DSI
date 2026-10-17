// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { entries, labelFor } from '../../notebook'
import { MISTAKES } from './chem'
import { session } from './index'

beforeEach(() => {
  localStorage.clear()
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const add = (name: string) => fireEvent.click(screen.getByRole('button', { name: `add ${name}` }))
const pick = (re: RegExp) => fireEvent.focus(screen.getByRole('button', { name: re }))
const choose = (label: string, text: string) => {
  const sel = screen.getByLabelText(label) as HTMLSelectElement
  const i = [...sel.options].findIndex((o) => o.text === text)
  expect(i).toBeGreaterThanOrEqual(0)
  fireEvent.change(sel, { target: { value: String(i) } })
}

/** Orgo opens on the topic menu; most tests take the guided path through all three steps. */
const pickTopic = (title: RegExp) => fireEvent.click(screen.getByRole('button', { name: title }))
const guidedPath = () => pickTopic(/^Build → Push → Compare/)

/** Ethanol with the keyboard-friendly path: pick an atom, press an element to add it bonded. */
function buildEthanol() {
  add('carbon') // a0, picked
  add('carbon') // a1 bonded to a0, picked
  add('oxygen') // a2 bonded to a1, picked
  add('hydrogen') // O–H
  pick(/^carbon C0, /)
  for (let i = 0; i < 3; i++) add('hydrogen')
  pick(/^carbon C1, /)
  for (let i = 0; i < 2; i++) add('hydrogen')
}

describe('orgo session', () => {
  it('build → push → compare, saved to the notebook with the mistakes caught', () => {
    vi.useFakeTimers()
    const C = session.Component
    render(<C onDone={() => {}} />)
    guidedPath()
    expect(screen.getByText('Build ethanol')).toBeTruthy()

    // a carbon with 5 bonds is named live and on check
    add('carbon')
    for (let i = 0; i < 5; i++) add('hydrogen') // the 5th has no room, so it lands loose
    fireEvent.keyDown(screen.getByRole('button', { name: /^hydrogen H5, / }), { key: 'Enter' })
    fireEvent.keyDown(screen.getByRole('button', { name: /^carbon C0, / }), { key: 'Enter' })
    expect(screen.getByText(MISTAKES['carbon-five-bonds'].label)).toBeTruthy()
    fireEvent.click(screen.getByText('Check it'))
    expect(screen.getByText(MISTAKES['carbon-five-bonds'].line)).toBeTruthy()
    fireEvent.click(screen.getByText('Clear'))

    buildEthanol()
    expect(document.querySelector('.og-formula')!.textContent).toBe('C₂H₆O')
    fireEvent.click(screen.getByText('Check it'))
    expect(screen.getByText('CH₃–CH₂–OH')).toBeTruthy()
    fireEvent.click(screen.getByText('Push the electrons →'))

    // step 2: the two real arrows from the lists
    expect(screen.getByText('Push the electrons')).toBeTruthy()
    choose('from', 'lone pair on O (right)')
    choose('to', 'O atom')
    choose('to', 'C atom')
    fireEvent.click(screen.getByText('Add arrow'))
    choose('from', 'C–Br bond')
    choose('to', 'Br atom')
    fireEvent.click(screen.getByText('Add arrow'))
    expect(screen.getByText('lone pair on O → C, from the back')).toBeTruthy()
    fireEvent.click(screen.getByText('Show me'))
    expect(screen.getByText('your arrows match')).toBeTruthy()
    act(() => vi.advanceTimersByTime(1800))
    act(() => vi.advanceTimersByTime(4000))
    expect(screen.getByText('CH₃OH + Br⁻')).toBeTruthy()
    fireEvent.click(screen.getByText('Same pattern →'))

    // step 3: tap the same parts; nitrogen as cyanide's attacker is named
    expect(screen.getByText('Same pattern')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'O of hydroxide' }))
    fireEvent.click(screen.getByRole('button', { name: 'N of cyanide' }))
    expect(screen.getByText(MISTAKES['cyanide-nitrogen'].label)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'C of cyanide' }))
    fireEvent.click(screen.getByRole('button', { name: 'carbon of CH₃Br' }))
    fireEvent.click(screen.getByRole('button', { name: 'carbon of CH₃I' }))
    fireEvent.click(screen.getByRole('button', { name: 'Br' }))
    fireEvent.click(screen.getByRole('button', { name: 'I' }))
    expect(screen.getByText(/Electrons flow from the electron-rich atom/)).toBeTruthy()
    expect(screen.getByText('Saved to your notebook.')).toBeTruthy()
    expect(screen.getByText(/Caught: “Nitrogen as cyanide’s attacker”, “A carbon with 5 bonds”|Caught: “A carbon with 5 bonds”, “Nitrogen as cyanide’s attacker”/)).toBeTruthy()

    const saved = entries()
    expect(saved).toHaveLength(1)
    expect(saved[0]).toMatchObject({ session: 'orgo', misconception: 'carbon-five-bonds', rematch: null })
    fireEvent.click(screen.getByText('Run both'))
    act(() => vi.advanceTimersByTime(4000))
    expect(screen.getByText('CH₃CN + I⁻')).toBeTruthy()
    expect(entries()).toHaveLength(1)
  }, 60000)

  it('names dimethyl ether: same formula, different molecule', () => {
    render(<session.Component onDone={() => {}} />)
    guidedPath()
    add('carbon')
    add('oxygen')
    add('carbon')
    for (let i = 0; i < 3; i++) add('hydrogen')
    pick(/^carbon C0, /)
    for (let i = 0; i < 3; i++) add('hydrogen')
    expect(document.querySelector('.og-formula')!.textContent).toBe('C₂H₆O')
    fireEvent.click(screen.getByText('Check it'))
    expect(screen.getByText('Same formula, different molecule')).toBeTruthy()
    expect(screen.getByRole('img', { name: /dimethyl ether/ })).toBeTruthy()
  }, 60000)

  it('names the wrong arrows, and a clean run ends mastered', () => {
    vi.useFakeTimers()
    render(<session.Component onDone={() => {}} />)
    guidedPath()
    buildEthanol()
    fireEvent.click(screen.getByText('Check it'))
    fireEvent.click(screen.getByText('Push the electrons →'))
    choose('from', 'the C atom')
    choose('to', 'O atom')
    fireEvent.click(screen.getByText('Add arrow'))
    fireEvent.click(screen.getByText('Show me'))
    expect(screen.getByText(MISTAKES['arrow-from-electrophile'].label)).toBeTruthy()
    fireEvent.click(screen.getByText('Draw again'))
    choose('from', 'lone pair on Br (right)')
    choose('to', 'C atom')
    fireEvent.click(screen.getByText('Add arrow'))
    fireEvent.click(screen.getByText('Show me'))
    expect(screen.getByText(MISTAKES['arrow-backwards'].label)).toBeTruthy()
  }, 60000)

  it('a session with no mistakes ends with a quiet mastered check', () => {
    vi.useFakeTimers()
    render(<session.Component onDone={() => {}} />)
    guidedPath()
    buildEthanol()
    fireEvent.click(screen.getByText('Check it'))
    fireEvent.click(screen.getByText('Push the electrons →'))
    choose('from', 'lone pair on O (right)')
    choose('to', 'C atom')
    fireEvent.click(screen.getByText('Add arrow'))
    choose('from', 'C–Br bond')
    choose('to', 'Br atom')
    fireEvent.click(screen.getByText('Add arrow'))
    fireEvent.click(screen.getByText('Show me'))
    fireEvent.click(screen.getByText('Same pattern →'))
    for (const n of ['O of hydroxide', 'C of cyanide', 'carbon of CH₃Br', 'carbon of CH₃I', 'Br', 'I']) fireEvent.click(screen.getByRole('button', { name: n }))
    expect(screen.getByText('✓ mastered')).toBeTruthy()
    expect(entries()[0]).toMatchObject({ session: 'orgo', misconception: null })
    expect(document.body.textContent).not.toMatch(/lock it in|called it|\bbet\b|how sure|points/i)
  }, 60000)

  it('Undo steps back one change at a time (button and Ctrl+Z), and a right build shows a big check', () => {
    render(<session.Component onDone={() => {}} />)
    guidedPath()
    const undo = screen.getByRole('button', { name: /Undo/ }) as HTMLButtonElement
    expect(undo.disabled).toBe(true)
    add('carbon')
    add('carbon') // bonded to the first
    const formula = () => document.querySelector('.og-formula')!.textContent
    expect(formula()).toBe('C₂')
    // tap the bond: single → double; Undo brings the single back
    const bond = () => screen.getByRole('button', { name: /bond\. Press to change\.$/ })
    fireEvent.click(bond())
    expect(bond().getAttribute('aria-label')).toMatch(/double bond/)
    fireEvent.click(undo)
    expect(bond().getAttribute('aria-label')).toMatch(/single bond/)
    // Ctrl+Z takes the second carbon (and its bond) back off
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true })
    expect(formula()).toBe('C')
    expect(screen.queryByRole('button', { name: /bond\. Press to change\.$/ })).toBeNull()
    // Clear is undoable too
    fireEvent.click(screen.getByText('Clear'))
    expect(formula()).toBe('—')
    fireEvent.click(undo)
    expect(formula()).toBe('C')
    fireEvent.click(undo)
    expect(undo.disabled).toBe(true)

    buildEthanol()
    expect(document.querySelector('.og-correct')).toBeNull()
    fireEvent.click(screen.getByText('Check it'))
    expect(document.querySelector('.og-correct')!.textContent).toBe('Correct!')
    // changing the molecule again takes the check away until the next Check it
    fireEvent.click(undo)
    expect(document.querySelector('.og-correct')).toBeNull()
  })

  it('opens on a topic menu: sections and every mechanism playable', () => {
    render(<session.Component onDone={() => {}} />)
    expect(screen.getByText('What do you want to practice?')).toBeTruthy()
    for (const sec of ['Molecules', 'Mechanisms', 'Guided path']) expect(screen.getByRole('heading', { name: sec })).toBeTruthy()
    for (const t of [/^SN2 One/, /^SN1/, /^E2 One/, /^E1/, /^SN2 vs E2/]) expect((screen.getByRole('button', { name: t }) as HTMLButtonElement).disabled).toBe(false)
    expect(screen.queryByText('coming next')).toBeNull()
  })

  const arrow = (from: string, to: string) => {
    choose('from', from)
    choose('to', to)
    fireEvent.click(screen.getByText('Add arrow'))
  }
  const watch = () => {
    fireEvent.click(screen.getByText('Show me'))
    act(() => void vi.advanceTimersByTime(1800)) // ink arrows
    act(() => void vi.advanceTimersByTime(3400)) // atoms move
  }

  it('Mechanisms > SN1: attacking first is named, then step 2 is drawn on the carbocation', () => {
    vi.useFakeTimers()
    render(<session.Component onDone={() => {}} />)
    pickTopic(/^SN1/)
    expect(screen.getByText('SN1, step 1: the slow step')).toBeTruthy()
    arrow('lone pair on O of water (lower left)', 'central C')
    arrow('central C–Br bond', 'Br')
    watch()
    expect(screen.getByText(MISTAKES['sn1-attack-first'].label)).toBeTruthy()
    expect(screen.getByText('(CH₃)₃C⁺ + Br⁻')).toBeTruthy()
    fireEvent.click(screen.getByText('Step 2 →'))
    expect(screen.getByText('SN1, step 2: fill the C⁺')).toBeTruthy()
    arrow('lone pair on O of water (lower left)', 'central C')
    watch()
    expect(screen.getByText('your arrows match')).toBeTruthy()
    fireEvent.click(screen.getByText('Finish ✓'))
    expect(entries()[0]).toMatchObject({ session: 'orgo', orgoTopic: 'sn1', misconception: 'sn1-attack-first' })
  })

  it('Mechanisms > E2: the base on the carbon is named as SN2; three right arrows match', () => {
    vi.useFakeTimers()
    render(<session.Component onDone={() => {}} />)
    pickTopic(/^E2/)
    arrow('lone pair on O of hydroxide (right)', 'central C')
    watch()
    expect(screen.getByText(MISTAKES['e2-base-hits-carbon'].label)).toBeTruthy()
    fireEvent.click(screen.getByText('Draw again'))
    arrow('lone pair on O of hydroxide (right)', 'H straight across from Br')
    arrow('left C–H straight across from Br bond', 'left C–central C bond')
    arrow('central C–Br bond', 'Br')
    watch()
    expect(screen.getByText('your arrows match')).toBeTruthy()
    expect(screen.getByText('H₂O + (CH₃)₂C=CH₂ + Br⁻')).toBeTruthy()
  })

  it('Mechanisms > SN2 vs E2: predict each path, both run, the wrong pick is named', () => {
    vi.useFakeTimers()
    render(<session.Component onDone={() => {}} />)
    pickTopic(/^SN2 vs E2/)
    const run = screen.getByText('Run both') as HTMLButtonElement
    expect(run.disabled).toBe(true)
    const paths = screen.getAllByRole('group', { name: /pick a path/ })
    fireEvent.click(within(paths[0]).getByText('swaps in (SN2)'))
    fireEvent.click(within(paths[1]).getByText('swaps in (SN2)'))
    fireEvent.click(run)
    act(() => void vi.advanceTimersByTime(3400))
    expect(screen.getByText(MISTAKES['crowding-ignored'].label)).toBeTruthy()
    expect(screen.queryByText(MISTAKES['no-neighbor-h'].label)).toBeNull()
    expect(screen.getByText('CH₃OH + Br⁻')).toBeTruthy()
    expect(screen.getByText('H₂O + (CH₃)₂C=CH₂ + Br⁻')).toBeTruthy()
    expect(entries()[0]).toMatchObject({ session: 'orgo', orgoTopic: 'sn2-vs-e2', misconception: 'crowding-ignored' })
  })

  it('Mechanisms > E1: two steps, the H comes off the carbon next to C⁺', () => {
    vi.useFakeTimers()
    render(<session.Component onDone={() => {}} />)
    pickTopic(/^E1/)
    arrow('central C–Br bond', 'Br')
    watch()
    fireEvent.click(screen.getByText('Step 2 →'))
    arrow('lone pair on O of water (upper right)', 'H on the left C (top)')
    arrow('left C–H on the left C (top) bond', 'central C–left C bond')
    watch()
    expect(screen.getByText('your arrows match')).toBeTruthy()
    fireEvent.click(screen.getByText('Finish ✓'))
    expect(screen.getByText('✓ mastered')).toBeTruthy()
  })

  it('Molecules > Build ethanol is just the build, then Finish', () => {
    render(<session.Component onDone={() => {}} />)
    pickTopic(/^Build ethanol/)
    expect(screen.getByText('Orgo · Build ethanol')).toBeTruthy()
    expect(screen.getByText('1 of 1')).toBeTruthy()
    buildEthanol()
    fireEvent.click(screen.getByText('Check it'))
    fireEvent.click(screen.getByText('Finish ✓'))
    expect(screen.getByText('✓ mastered')).toBeTruthy()
    expect(entries()[0]).toMatchObject({ session: 'orgo', orgoTopic: 'build-ethanol', misconception: null })
  })

  it('Mechanisms > SN2 starts at the arrows, and the topics link goes back to the menu', () => {
    render(<session.Component onDone={() => {}} />)
    pickTopic(/^SN2 One/)
    expect(screen.getByText('Push the electrons')).toBeTruthy()
    expect(screen.getByText('1 of 2')).toBeTruthy()
    expect(screen.queryByText('Build ethanol')).toBeNull()
    fireEvent.click(screen.getByText('← All orgo topics'))
    expect(screen.getByText('What do you want to practice?')).toBeTruthy()
  })

  it('the notebook shows the same names as the session', () => {
    for (const [id, m] of Object.entries(MISTAKES)) expect(labelFor('orgo', id)).toBe(m.label)
  }, 60000)
})
