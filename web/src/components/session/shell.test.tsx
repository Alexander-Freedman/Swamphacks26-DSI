// @vitest-environment jsdom
import { cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { KEY, notebook } from '../../notebook'
import { cardGuide, endLine, lockLabel } from './copy'
import { useNotebookEntry } from './entry'
import { percent } from './percent'
import { EndBar, SessionHead } from './Shell'
import { isClose, rematchVerdict, shellVerdict } from './verdict'

afterEach(cleanup)

describe('session shell verdict (#151)', () => {
  it('close needs both: within the window and within a factor of 2', () => {
    expect(isClose(0, 9.2, 15)).toBe(false) // 9.2 points, but 0 is nowhere near 9.2% in proportion
    expect(isClose(4, 9.2, 15)).toBe(false)
    expect(isClose(5, 9.2, 15)).toBe(true)
    expect(isClose(18, 9.2, 15)).toBe(true)
    expect(isClose(19, 9.2, 15)).toBe(false) // more than double
    expect(isClose(50, 40, 15)).toBe(true)
    expect(isClose(56, 40, 15)).toBe(false) // inside 2x, outside 15 points
  })

  it('called it exactly when no mistake is named', () => {
    expect(shellVerdict(null, 0, 9.2, 15)).toBe('called')
    expect(shellVerdict('m', 0, 9.2, 15)).toBe('off')
    expect(shellVerdict('m', 17, 9.2, 15)).toBe('close')
  })

  it('rematch: called within its own margin, then the same close rule', () => {
    expect(rematchVerdict(30, 27.9, 5, 15)).toBe('called')
    expect(rematchVerdict(14, 27.9, 5, 15)).toBe('close')
    expect(rematchVerdict(13, 27.9, 5, 15)).toBe('off')
    expect(rematchVerdict(0, 27.9, 5, 15)).toBe('off')
    expect(rematchVerdict(100, 27.9, 5, 15)).toBe('off')
  })
})

describe('session shell copy', () => {
  it('lock copy matches birthday', () => {
    expect(lockLabel(false, null)).toBe('Move the slider first')
    expect(lockLabel(false, 'certain')).toBe('Move the slider first')
    expect(lockLabel(true, null)).toBe('Pick how sure you are')
    expect(lockLabel(true, 'unsure')).toBe('Lock it in')
  })

  it('called-it card has its own guidance line (#150)', () => {
    expect(cardGuide(true)).toBe("You called it. Here's the idea that makes it work, so you can do it again.")
    expect(cardGuide(false)).toBe('This is the mistake your guess points to, and the one idea that fixes it.')
  })

  it('end line covers the first guess and the rematch (#148)', () => {
    // only promises the notebook when something is in it (#162)
    expect(endLine(null, 'wrong')).toBe('Your first guess called it. Rematch missed; try it again tomorrow.')
    expect(endLine(null, 'wrong', 'Y')).toBe('Your first guess called it. Rematch missed: “Y” is in your notebook to try again.')
    expect(endLine('X', 'wrong')).toBe('Caught: “X”. Rematch missed; it stays in your notebook to try again.')
    expect(endLine('X', 'wrong', 'Y')).toBe('Caught: “X”. Rematch missed; it stays in your notebook to try again.')
    expect(endLine(null, 'right')).toBe('Your first guess called it. Rematch: right.')
    expect(endLine('X', 'right')).toBe('Caught: “X”. Rematch: right.')
    expect(endLine('X', 'close')).toBe('Caught: “X”. Rematch: close.')
    expect(endLine(null, 'right')).not.toMatch(/^Called it/)
  })
})

describe('percent (#161)', () => {
  it('never rounds a chance below 1 up to 100%, or one above 0 down to 0%', () => {
    expect(percent(0.99972)).toBe('>99.9%')
    expect(percent(0.9994)).toBe('99.9%')
    expect(percent(0.996, 0)).toBe('>99%')
    expect(percent(0.972)).toBe('97.2%')
    expect(percent(0.5, 0)).toBe('50%')
    expect(percent(0.00004)).toBe('<0.1%')
    expect(percent(0.004, 0)).toBe('<1%')
    expect(percent(1)).toBe('100%')
    expect(percent(0)).toBe('0%')
    expect(percent(Number.NaN)).toBe('-')
  })
})

describe('session shell parts', () => {
  it('end bar: saved, the line, the remix, open notebook, done', () => {
    const done = vi.fn()
    const { container } = render(<EndBar caught={null} rematch="wrong" remix="Come back tomorrow." onDone={done} />)
    expect(container.textContent).toContain('Saved to your notebook. Your first guess called it. Rematch missed; try it again tomorrow. Come back tomorrow.')
    expect(screen.getByText('Open notebook').getAttribute('href')).toContain('?notebook=1')
    fireEvent.click(screen.getByText('Done'))
    expect(done).toHaveBeenCalled()
  })

  it('head: dots + "n of N"; named step dots stay accessible buttons', () => {
    const go = vi.fn()
    const { container, rerender } = render(<SessionHead chip="Coin streak" step={2} total={5} />)
    expect(container.querySelectorAll('.ss-dot.on').length).toBe(2)
    expect(screen.getByText('2 of 5')).toBeTruthy()
    rerender(<SessionHead chip="Coin streak" step={2} total={3} labels={['Be a coin', 'Flip it', 'Your mistake']} canGo={(i) => i < 2} onGo={go} />)
    const flip = screen.getByRole('button', { name: '2 Flip it' })
    expect(flip.getAttribute('aria-current')).toBe('step')
    expect((screen.getByRole('button', { name: '3 Your mistake' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: '1 Be a coin' }))
    expect(go).toHaveBeenCalledWith(0)
  })
})

describe('useNotebookEntry extend (compare answer on the same entry)', () => {
  it('adds extra fields to the card entry, never the core fields, and the rematch keeps them', () => {
    localStorage.clear()
    const { result } = renderHook(() => useNotebookEntry('coin-streak'))
    result.current.extend({ comparePick: 'x' }) // nothing saved yet: no-op
    expect(localStorage.getItem(KEY)).toBeNull()
    result.current.atCard({ guess: 3, confidence: 'certain', misconception: 'random-means-evenly-mixed' })
    result.current.extend({ comparePick: 'due', compareRight: false, misconception: null, rematch: 'right', guess: 7 })
    result.current.rematch('right', null)
    const all = JSON.parse(localStorage.getItem(KEY)!)
    expect(all).toHaveLength(1)
    expect(all[0]).toMatchObject({ guess: 3, misconception: 'random-means-evenly-mixed', rematch: 'right', comparePick: 'due', compareRight: false })
    expect(notebook().map((c) => c.id)).toEqual(['random-means-evenly-mixed'])
  })
})
