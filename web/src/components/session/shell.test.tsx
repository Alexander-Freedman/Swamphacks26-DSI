// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cardGuide, endLine, lockLabel } from './copy'
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
  it('button copy: slider first, then "Show me" (no how-sure step, #194)', () => {
    expect(lockLabel(false)).toBe('Move the slider first')
    expect(lockLabel(true)).toBe('Show me')
  })

  it('called-it card has its own guidance line (#150)', () => {
    expect(cardGuide(true)).toBe("You were right. Here's the idea that makes it work, so you can do it again.")
    expect(cardGuide(false)).toBe('This is the mistake your guess points to, and the one idea that fixes it.')
  })

  it('end line covers the first guess and the rematch (#148)', () => {
    expect(endLine(null, 'wrong')).toBe('Your first guess was right. Rematch missed; it stays in your notebook to try again.')
    expect(endLine(null, 'right')).toBe('Your first guess was right. Rematch: right.')
    expect(endLine('X', 'right')).toBe('Caught: “X”. Rematch: right.')
    expect(endLine('X', 'close')).toBe('Caught: “X”. Rematch: close.')
    expect(endLine(null, 'right')).not.toMatch(/^Called it/)
  })
})

describe('session shell parts', () => {
  it('end bar: saved, the line, the remix, open notebook, done', () => {
    const done = vi.fn()
    const { container } = render(<EndBar caught={null} rematch="wrong" remix="Come back tomorrow." onDone={done} />)
    expect(container.textContent).toContain('Saved to your notebook. Your first guess was right. Rematch missed; it stays in your notebook to try again. Come back tomorrow.')
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
