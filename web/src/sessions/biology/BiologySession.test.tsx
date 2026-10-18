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
  it('opens on a chapter menu: DNA → RNA → protein is ready, the rest are coming next', () => {
    render(<session.Component onDone={() => {}} />)
    for (const ch of ['Cells', 'Genetics', 'Cell division', 'Anatomy and physiology']) expect(screen.getByRole('heading', { name: ch })).toBeTruthy()
    expect((screen.getByRole('button', { name: /^DNA → RNA → protein/ }) as HTMLButtonElement).disabled).toBe(false)
    for (const t of [/^Cell respiration/, /^Punnett squares/, /^Mitosis vs meiosis/, /^Action potential/]) expect((screen.getByRole('button', { name: t }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getAllByText('coming next')).toHaveLength(4)
    for (const t of [/^The heart/, /^The kidney/, /^Muscle contraction/]) expect((screen.getByRole('button', { name: t }) as HTMLButtonElement).disabled).toBe(false)
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

  it('the heart: wrong sides named, the drop follows each right answer to the body, saved', () => {
    render(<session.Component onDone={() => {}} />)
    click(/^The heart/)
    click(/^Left atrium/)
    expect(label('heart-sides-swapped')).toBeTruthy()
    const go = (a: RegExp) => {
      click(a)
      expect(screen.getByText('✓ Correct!')).toBeTruthy()
    }
    go(/^Right atrium/)
    for (const [a, next] of [[/^Tricuspid/, 1], [/^To the lungs/, 1], [/^It picks up/, 1], [/^Left atrium/, 1], [/^Mitral/, 1], [/^Thicker/, 0]] as const) {
      click(next || a.source !== '^Tricuspid' ? 'Next question →' : 'Next question →')
      go(a)
    }
    click('Finish ✓')
    expect(entries()[0]).toMatchObject({ session: 'biology', bioTopic: 'heart', misconception: 'heart-sides-swapped' })
  })

  it('kidney and muscle play end to end', () => {
    for (const [topic, answers] of [
      [/^The kidney/, [/^Proteins/, /^Proximal tubule/, /^About 1.5 L/, /^About half/, /^Less, and darker/]],
      [/^Muscle contraction/, [/^Thin and thick filaments slide/, /^The A band/, /^Ca²⁺ binding/, /^Lets the head let go/]],
    ] as const) {
      const { unmount } = render(<session.Component onDone={() => {}} />)
      click(topic)
      answers.forEach((a, i) => {
        if (i) click('Next question →')
        click(a)
      })
      click('Finish ✓')
      expect(screen.getByText(/Saved to your notebook/)).toBeTruthy()
      unmount()
    }
  })

  it('the notebook shows the same names as the session', () => {
    for (const [id, m] of Object.entries(BIO_MISTAKES)) expect(labelFor('biology', id)).toBe(m.label)
  })
})
