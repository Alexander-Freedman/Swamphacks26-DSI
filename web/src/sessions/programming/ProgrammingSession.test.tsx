// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { entries, labelFor } from '../../notebook'
import { session } from './index'
import { STACK_MISTAKES } from './stack'

beforeEach(() => localStorage.clear())
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }))

describe('programming session', () => {
  it('opens on a chapter menu that lists only the built topics', () => {
    render(<session.Component onDone={() => {}} />)
    expect(screen.getByText('What do you want to practice?')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Recursion' })).toBeTruthy()
    expect((screen.getByRole('button', { name: /^Watch the call stack/ }) as HTMLButtonElement).disabled).toBe(false)
    expect(screen.queryByRole('button', { name: /^Binary search/ })).toBeNull()
    expect(screen.queryByText(/coming next/i)).toBeNull()
  })

  it('call stack: predict the depth, step up and back down, then crash it without a base case', () => {
    vi.useFakeTimers()
    render(<session.Component onDone={() => {}} />)
    click(/^Watch the call stack/)
    const frames = () => screen.getByRole('list', { name: /call stack/ }).querySelectorAll('li').length

    // 1: how tall does it get? "1" is a named mistake, then 4 is right
    click(/^1: each call replaces/)
    expect(screen.getByText(STACK_MISTAKES['stack-depth-off'].label)).toBeTruthy()
    click(/^4$/)
    expect(screen.getByText('Correct!')).toBeTruthy()
    expect(frames()).toBe(1)
    for (let k = 0; k < 4; k++) click(/Run the next line/)
    expect(frames()).toBe(4)

    // 2: fact(1) returned; fact(4) finishing next is the named mistake
    click(/^fact\(4\), because/)
    expect(screen.getByText(STACK_MISTAKES['returns-before-calls'].label)).toBeTruthy()
    click(/^fact\(2\)/)
    for (let k = 0; k < 3; k++) click(/Run the next line/)
    expect(frames()).toBe(1)
    expect(screen.getByText('returns 24')).toBeTruthy()

    // 3: no base case → stack overflow
    click(/^It keeps calling itself/)
    act(() => vi.advanceTimersByTime(3000))
    expect(screen.getByText('Stack overflow')).toBeTruthy()
    expect(screen.getByText(/Saved to your notebook/)).toBeTruthy()
    expect(entries()[0]).toMatchObject({ session: 'programming', misconception: 'stack-depth-off', mistakes: ['stack-depth-off', 'returns-before-calls'] })
  })

  it('the notebook shows the same names as the session', () => {
    for (const [id, m] of Object.entries(STACK_MISTAKES)) expect(labelFor('programming', id)).toBe(m.label)
  })

  it('never uses betting words or scores', () => {
    const { container } = render(<session.Component onDone={() => {}} />)
    const text = container.textContent!.toLowerCase()
    for (const w of [/\bbet(s|ting)?\b/, /\bxp\b/, /\d+\s*(pts|points?)\b/, /\bscore\b/]) expect(text).not.toMatch(w)
  })
})
