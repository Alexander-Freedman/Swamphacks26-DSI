// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { entries, labelFor } from '../../notebook'
import { session } from './index'
import { SHAPE_MISTAKES } from './vsepr'

beforeEach(() => {
  localStorage.clear()
  window.matchMedia = ((q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia
})
afterEach(cleanup)

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }))

describe('general chemistry session', () => {
  it('opens on a chapter menu', () => {
    render(<session.Component onDone={() => {}} />)
    expect(screen.getByRole('heading', { name: 'Bonding' })).toBeTruthy()
    expect((screen.getByRole('button', { name: /^Molecule shapes in 3D/ }) as HTMLButtonElement).disabled).toBe(false)
    expect(screen.queryByText(/coming next/i)).toBeNull()
  })

  it('shapes: flat drawing first, then the 3D model; lone pairs change the shape', () => {
    render(<session.Component onDone={() => {}} />)
    click(/^Molecule shapes in 3D/)
    expect(screen.getByRole('img', { name: /Lewis structure of CH₄/ })).toBeTruthy()
    click(/^Flat square/)
    expect(screen.getByText(SHAPE_MISTAKES['flat-drawing-is-shape'].label)).toBeTruthy()
    click(/^Tetrahedral/)
    expect(screen.getByRole('img', { name: /3D model of CH₄: tetrahedral, H–C–H 109.5°/ })).toBeTruthy()
    click('Next molecule →')
    click(/^Flat triangle/)
    expect(screen.getByText(SHAPE_MISTAKES['lone-pairs-ignored'].label)).toBeTruthy()
    click(/^Pyramid/)
    expect(screen.getByRole('img', { name: /NH₃: pyramid, H–N–H 107°/ })).toBeTruthy()
    click('Next molecule →')
    click(/^Bent/)
    expect(screen.getByRole('img', { name: /H₂O: bent, H–O–H 104.5°/ })).toBeTruthy()
    click('Finish ✓')
    expect(screen.getByText(/Saved to your notebook/)).toBeTruthy()
    expect(entries()[0]).toMatchObject({ session: 'chemistry', mistakes: ['flat-drawing-is-shape', 'lone-pairs-ignored'] })
  })

  it('the notebook shows the same names as the session', () => {
    for (const [id, m] of Object.entries(SHAPE_MISTAKES)) expect(labelFor('chemistry', id)).toBe(m.label)
  })
})
