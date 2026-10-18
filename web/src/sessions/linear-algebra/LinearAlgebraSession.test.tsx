// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { entries, labelFor } from '../../notebook'
import { session } from './index'
import { LIN_MISTAKES } from './linalg'

beforeEach(() => {
  localStorage.clear()
  window.matchMedia = ((q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia
})
afterEach(cleanup)

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }))
const keys = (arrow: 'î' | 'ĵ', ...ks: string[]) => {
  for (const key of ks) fireEvent.keyDown(screen.getByRole('slider', { name: new RegExp(`^${arrow} tip`) }), { key })
}

describe('linear algebra session', () => {
  it('opens on a chapter menu', () => {
    render(<session.Component onDone={() => {}} />)
    for (const h of ['Vectors', 'Matrices', 'Eigenvectors', 'Systems of equations']) expect(screen.getByRole('heading', { name: h })).toBeTruthy()
    expect((screen.getByRole('button', { name: /^A matrix moves the whole grid/ }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('predict the stretch, build a quarter turn, squash the plane, and know it can’t be undone', () => {
    render(<session.Component onDone={() => {}} />)
    click(/^A matrix moves the whole grid/)
    click(/^Stretch it up ×2/)
    expect(screen.getByText(LIN_MISTAKES['rows-vs-columns'].label)).toBeTruthy()
    click(/^Stretch it sideways ×2/)
    expect(screen.getByRole('img', { name: /i lands at \(2, 0\)/ })).toBeTruthy()
    click('Now build one yourself →')

    // î: (1, 0) → (0, 1); ĵ: (0, 1) → (−1, 0)
    keys('î', 'ArrowLeft', 'ArrowLeft', 'ArrowUp', 'ArrowUp')
    expect(screen.queryByText('Last one →')).toBeNull()
    keys('ĵ', 'ArrowLeft', 'ArrowLeft', 'ArrowDown', 'ArrowDown')
    expect(screen.getByRole('img', { name: /determinant 1/ })).toBeTruthy()
    click('Last one →')

    // put ĵ on î's line: (−1, 0) → (0, 2)
    keys('ĵ', 'ArrowRight', 'ArrowRight', 'ArrowUp', 'ArrowUp', 'ArrowUp', 'ArrowUp')
    expect(screen.getByRole('img', { name: /determinant 0/ })).toBeTruthy()
    click('One question →')
    click(/^Yes/)
    expect(screen.getByText(LIN_MISTAKES['squash-undoable'].label)).toBeTruthy()
    click(/^No/)
    expect(screen.getByText(/Saved to your notebook/)).toBeTruthy()
    expect(entries()[0]).toMatchObject({ session: 'linear-algebra', mistakes: ['rows-vs-columns', 'squash-undoable'] })
  })

  it('the notebook shows the same names as the session', () => {
    for (const [id, m] of Object.entries(LIN_MISTAKES)) expect(labelFor('linear-algebra', id)).toBe(m.label)
  })
})
