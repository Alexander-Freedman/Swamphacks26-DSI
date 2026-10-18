// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { entries, labelFor } from '../../notebook'
import { BIO_MISTAKES } from './mistakes'
import { session } from './index'

beforeEach(() => {
  localStorage.clear()
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const click = (name: RegExp | string) => fireEvent.click(screen.getByRole('button', { name }))
const label = (m: keyof typeof BIO_MISTAKES) => screen.getByText(BIO_MISTAKES[m].label)

describe('biology session', () => {
  it('opens on a chapter menu that lists only DNA → RNA → protein, the one built topic', () => {
    render(<session.Component onDone={() => {}} />)
    expect(screen.getByRole('heading', { name: 'Genetics' })).toBeTruthy()
    for (const ch of ['Cells', 'Cell division', 'Physiology']) expect(screen.queryByRole('heading', { name: ch })).toBeNull()
    expect((screen.getByRole('button', { name: /^DNA → RNA → protein/ }) as HTMLButtonElement).disabled).toBe(false)
    for (const t of [/^Cell respiration/, /^Punnett squares/, /^Mitosis vs meiosis/, /^Action potential/]) expect(screen.queryByRole('button', { name: t })).toBeNull()
    expect(screen.queryByText(/coming next/i)).toBeNull()
  })

  it('DNA → RNA → protein: predict, pair, read, translate, mutate; wrong answers named and saved', () => {
    vi.useFakeTimers()
    render(<session.Component onDone={() => {}} />)
    click(/^DNA → RNA → protein/)
    expect(screen.getByText('Copy the gene into RNA')).toBeTruthy()

    // 1. predict: T opposite A is the classic mistake
    click(/^T thymine/)
    expect(screen.getByText('✗ Not quite.')).toBeTruthy()
    expect(label('rna-has-thymine')).toBeTruthy()
    click(/^U uracil/)
    expect(screen.getByText('✓ Correct!')).toBeTruthy()
    // pair 6 bases by hand: template CGTACA → mRNA GCAUGU; copying the base is named
    click('add C') // template C: copying it
    expect(label('copied-not-paired')).toBeTruthy()
    for (const b of ['G', 'C', 'A', 'U', 'G', 'U']) click(`add ${b}`)
    click('Let the polymerase finish')
    act(() => void vi.advanceTimersByTime(3000))
    expect(screen.getByText('GCAUGUUUGGCAAAUGGUAA')).toBeTruthy()
    click('Read it in threes →')

    // 2. codon size, then where reading starts
    click(/^2 bases/)
    expect(label('too-few-bases-per-codon')).toBeTruthy()
    click(/^3 bases/)
    click('base 1, G')
    expect(label('starts-at-first-base')).toBeTruthy()
    click('base 3, A')
    expect(screen.getByText(/AUG is the start codon/)).toBeTruthy()
    click('Build the protein →')

    // 3. translate: AUG → Met; reading the anticodon UAC (Tyr) is named; stop has no amino acid
    click(/^Tyr/)
    expect(label('read-anticodon')).toBeTruthy()
    for (const a of [/^Met/, /^Phe/, /^Gly/, /^Lys/, /^Trp/]) click(a)
    click(/^Leu/) // UAA is a stop codon
    expect(label('stop-has-amino-acid')).toBeTruthy()
    click(/^Stop/)
    expect(screen.getByText('Met-Phe-Gly-Lys-Trp')).toBeTruthy()
    click('Change one letter →')

    // 4. mutations: silent, nonsense, frameshift
    click(/^Everything after it changes/)
    expect(label('every-change-breaks-protein')).toBeTruthy()
    click(/^Nothing changes/)
    click('Next change →')
    click(/^It stops early/)
    click('Next change →')
    click(/^Nothing changes/)
    expect(label('frameshift-one-change')).toBeTruthy()
    click(/^Everything after it changes/)
    click('Finish ✓')

    expect(screen.getByText(/Saved to your notebook/)).toBeTruthy()
    const e = entries()[0]
    expect(e).toMatchObject({ session: 'biology', bioTopic: 'dna-protein', misconception: 'rna-has-thymine' })
    expect(e).toMatchObject({ mistakes: ['rna-has-thymine', 'copied-not-paired', 'too-few-bases-per-codon', 'starts-at-first-base', 'read-anticodon', 'stop-has-amino-acid', 'every-change-breaks-protein', 'frameshift-one-change'] })
    expect(document.body.textContent).not.toMatch(/lock it in|called it|\bbet\b|how sure|points|\bXP\b/i)
  }, 60000)

  it('the notebook shows the same names as the session', () => {
    for (const [id, m] of Object.entries(BIO_MISTAKES)) expect(labelFor('biology', id)).toBe(m.label)
  })
})
