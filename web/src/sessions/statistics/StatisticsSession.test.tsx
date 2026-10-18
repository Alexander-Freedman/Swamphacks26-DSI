// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { entries, labelFor } from '../../notebook'
import { CLT_MISTAKES } from './clt'
import { session } from './index'

// jsdom: no animation, the pile lands at once
beforeEach(() => {
  localStorage.clear()
  window.matchMedia = ((q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia
})
afterEach(cleanup)

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }))

describe('statistics session', () => {
  it('opens on a chapter menu of statistics topics', () => {
    render(<session.Component onDone={() => {}} />)
    expect(screen.getByRole('heading', { name: 'Sampling' })).toBeTruthy()
    expect((screen.getByRole('button', { name: /^Averages pile into a bell curve/ }) as HTMLButtonElement).disabled).toBe(false)
    expect(screen.queryByRole('button', { name: /^A p-value is an area/ })).toBeNull()
    expect(screen.queryByText(/coming next/i)).toBeNull()
    expect(screen.queryByText(/birthday/i)).toBeNull()
  })

  it('CLT: predict the shape (a wrong guess is named), see the pile, then bigger samples narrow it', () => {
    render(<session.Component onDone={() => {}} />)
    click(/^Averages pile into a bell curve/)
    expect(screen.getByRole('img', { name: /empty pile/ })).toBeTruthy()
    click(/^Lopsided, like the waits/)
    expect(screen.getByText(CLT_MISTAKES['averages-keep-shape'].label)).toBeTruthy()
    click(/^A hump in the middle/)
    expect(screen.getByText('Correct!')).toBeTruthy()
    expect(screen.getByRole('img', { name: /pile of 300 averages/ })).toBeTruthy()
    click('Next question →')
    click(/^It gets wider/)
    expect(screen.getByText(CLT_MISTAKES['bigger-sample-wider'].label)).toBeTruthy()
    click(/^It gets narrower/)
    expect(screen.getByText(/averages of 40 people/)).toBeTruthy()
    fireEvent.change(screen.getByLabelText('people per average'), { target: { value: '1' } })
    expect(screen.getByText(/averages of 1 people/)).toBeTruthy()
    click('Finish ✓')
    expect(screen.getByText(/Saved to your notebook/)).toBeTruthy()
    expect(entries()[0]).toMatchObject({ session: 'statistics', misconception: 'averages-keep-shape', mistakes: ['averages-keep-shape', 'bigger-sample-wider'] })
  })

  it('the notebook shows the same names as the session', () => {
    for (const [id, m] of Object.entries(CLT_MISTAKES)) expect(labelFor('statistics', id)).toBe(m.label)
  })
})
