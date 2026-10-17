// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Compare, type CompareOption } from './Compare'

afterEach(cleanup)

const OPTS: CompareOption[] = [
  { id: 'a', text: 'wrong one', why: 'because a' },
  { id: 'b', text: 'the shared idea text', right: true },
  { id: 'c', text: 'another wrong', why: 'because c' },
]

function setup() {
  const onAnswer = vi.fn()
  render(
    <Compare
      cases={[
        { tag: 'case 1', title: 'first', body: <p>one</p> },
        { tag: 'case 2', title: 'second', body: <p>two</p> },
      ]}
      options={OPTS}
      principle="The principle."
      detail="Both numbers."
      onAnswer={onAnswer}
    >
      <button>Next →</button>
    </Compare>,
  )
  return onAnswer
}

describe('Compare (shared step)', () => {
  it('shows both cases and the question; the principle and the way on wait for an answer', () => {
    setup()
    expect(screen.getByText('first')).toBeTruthy()
    expect(screen.getByText('second')).toBeTruthy()
    expect(screen.getByText("What's the same about how these work?")).toBeTruthy()
    expect(screen.queryByText('The principle.')).toBeNull()
    expect(screen.queryByText('Next →')).toBeNull()
  })

  it('a wrong pick says why, marks the right one, then shows the principle in ink', () => {
    const onAnswer = setup()
    fireEvent.change(screen.getByLabelText(/In your own words/), { target: { value: '  same thing  ' } })
    fireEvent.click(screen.getByRole('button', { name: /wrong one/ }))
    expect(onAnswer).toHaveBeenCalledWith({ pick: 'a', right: false, text: 'same thing' })
    expect(screen.getByText('Not quite.')).toBeTruthy()
    expect(screen.getByText(/because a/)).toBeTruthy()
    expect(screen.getByText('The principle.')).toBeTruthy()
    expect(screen.getByText('Both numbers.')).toBeTruthy()
    expect(screen.getByText('You wrote: “same thing”')).toBeTruthy()
    expect(screen.getByRole('button', { name: /the shared idea text/ }).className).toContain('right')
    expect(screen.getByRole('button', { name: /wrong one/ }).className).toContain('wrong')
    // one answer only
    fireEvent.click(screen.getByRole('button', { name: /another wrong/ }))
    expect(onAnswer).toHaveBeenCalledTimes(1)
    expect((screen.getByLabelText(/In your own words/) as HTMLInputElement).disabled).toBe(true)
    expect(screen.getByText('Next →')).toBeTruthy()
  })

  it('number keys pick, but not while typing in the box', () => {
    const onAnswer = setup()
    const box = screen.getByLabelText(/In your own words/)
    fireEvent.keyDown(box, { key: '1' })
    expect(onAnswer).not.toHaveBeenCalled()
    fireEvent.keyDown(window, { key: '9' })
    expect(onAnswer).not.toHaveBeenCalled()
    fireEvent.keyDown(window, { key: '2' })
    expect(onAnswer).toHaveBeenCalledWith({ pick: 'b', right: true, text: '' })
    expect(screen.getByText("That's it.")).toBeTruthy()
    expect(screen.queryByText(/You wrote/)).toBeNull()
  })
})
