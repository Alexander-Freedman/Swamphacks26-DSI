// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import App from '../../App'
import { session } from './index'

// jsdom has no canvas; the crowd is described by its aria-label instead.
beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => null) as unknown as typeof HTMLCanvasElement.prototype.getContext
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const Session = session.Component
const guessAndLock = (v: number) => {
  fireEvent.change(screen.getByLabelText("Chance you're actually sick?"), { target: { value: String(v) } })
  fireEvent.click(screen.getByText(`Lock in ${v}%`))
}
const testEveryone = async () => {
  fireEvent.click(screen.getByText('Test everyone'))
  await act(async () => vi.advanceTimersByTime(5000))
}

describe('positive test session', () => {
  it('guess → test everyone → you vs real → change the crowd → card → saved', async () => {
    vi.useFakeTimers()
    localStorage.clear()
    const { container } = render(<App />)
    fireEvent.click(screen.getByText('You tested positive. Are you sick?'))

    const lock = screen.getByText('Move the slider to guess') as HTMLButtonElement
    expect(lock.disabled).toBe(true)
    fireEvent.change(screen.getByLabelText("Chance you're actually sick?"), { target: { value: '21' } })
    fireEvent.click(screen.getByText('certain'))
    fireEvent.click(screen.getByLabelText('ten more healthy positives'))
    fireEvent.click(screen.getByLabelText('one more sick positive'))
    expect(container.textContent).toContain('9.1% of positives are sick (1 of 11)')
    fireEvent.click(screen.getByText('Lock in 21%'))

    expect(screen.getByText('Test all 1,000.')).toBeTruthy()
    // the step title takes focus so keyboard and screen reader users land on the new step
    expect(document.activeElement?.textContent).toBe('Test all 1,000.')
    fireEvent.click(screen.getByText('Test everyone'))
    expect((screen.getByText('Testing…') as HTMLButtonElement).disabled).toBe(true)
    await act(async () => vi.advanceTimersByTime(5000))
    expect(screen.getByText('9 / 98')).toBeTruthy()
    expect(screen.getByText('9.2%')).toBeTruthy()
    expect(container.innerHTML).not.toContain('NaN')

    fireEvent.click(screen.getByText('Compare with my guess →'))
    expect(screen.getByText('real 9.2%')).toBeTruthy()
    expect(screen.getByText('these 89 were never sick')).toBeTruthy()

    fireEvent.click(screen.getByText('Now change the crowd →'))
    fireEvent.click(screen.getByText('common (50%)'))
    expect(screen.getByText('91%')).toBeTruthy()
    expect(screen.getByText('positive = probably sick')).toBeTruthy()
    expect(container.innerHTML).not.toContain('NaN')

    fireEvent.click(screen.getByText('What did I get wrong? →'))
    // 21% is 11.8 points from 9.2%: inside the 15-point "close" window, band → ignores-false-alarms.
    expect(screen.getByText('Close')).toBeTruthy()
    expect(container.textContent).toContain('You said 21% (certain).')
    expect(screen.getByText('False alarms are too rare to matter')).toBeTruthy()
    expect((screen.getByText('Move the slider first') as HTMLButtonElement).disabled).toBe(true)
    fireEvent.change(screen.getByLabelText(/Your guess/), { target: { value: '60' } })
    fireEvent.click(screen.getByText('Lock in 60% and show me'))
    expect(screen.getByText('50%', { selector: 'b' })).toBeTruthy()
    expect(screen.getByText('Saved.')).toBeTruthy()
    const saved = JSON.parse(localStorage.getItem('mm.sessions') ?? '[]')
    expect(saved.at(-1)).toMatchObject({ session: 'positive-test', guess: 21, confidence: 'certain', misconception: 'ignores-false-alarms' })
    fireEvent.click(screen.getByText('Done'))
    expect(screen.getByText('You tested positive. Are you sick?')).toBeTruthy()
  }, 30000)

  it('reduced motion jumps straight to the piles', () => {
    window.matchMedia = ((q: string) => ({ matches: q.includes('reduce') })) as unknown as typeof window.matchMedia
    render(<Session onDone={() => {}} />)
    guessAndLock(30)
    fireEvent.click(screen.getByText('Test everyone'))
    expect(screen.getByText('9 / 98')).toBeTruthy()
    // @ts-expect-error jsdom has no matchMedia; put it back the way it was
    delete window.matchMedia
  })

  it.each([0, 100])('guess %i%% runs end to end with no NaN', async (g) => {
    vi.useFakeTimers()
    const { container } = render(<Session onDone={() => {}} />)
    guessAndLock(g)
    await testEveryone()
    fireEvent.click(screen.getByText('Compare with my guess →'))
    expect(screen.getByText(`you ${g}%`)).toBeTruthy()
    fireEvent.click(screen.getByText('Now change the crowd →'))
    fireEvent.click(screen.getByText('What did I get wrong? →'))
    expect(screen.getByText(g === 0 ? 'Called it' : 'Way off')).toBeTruthy()
    if (g === 0) expect(container.textContent).toContain('Not zero, though: 9 of the 98 positives really are sick')
    expect(container.innerHTML).not.toContain('NaN')
  })

  it('slider extremes: 0.1% and 50% sick, 1% and 30% false alarms', async () => {
    vi.useFakeTimers()
    const { container } = render(<Session onDone={() => {}} />)
    guessAndLock(40)
    await testEveryone()
    fireEvent.click(screen.getByText('Compare with my guess →'))
    fireEvent.click(screen.getByText('Now change the crowd →'))
    const base = screen.getByLabelText(/How common it is/)
    const fa = screen.getByLabelText(/False alarm rate/)
    const read = () => container.querySelector('.pt-crowd .pt-readout')!.textContent!
    // 1 sick in 1,000 → 1 hit (0.9 rounds up); 1% of 999 healthy → 10 false alarms
    fireEvent.change(base, { target: { value: '0' } })
    fireEvent.change(fa, { target: { value: '1' } })
    expect(read()).toContain('1 / 11')
    expect(read()).toContain('8.3%')
    fireEvent.change(fa, { target: { value: '30' } })
    expect(read()).toContain('1 / 301')
    expect(read()).toContain('0.3%')
    // 500 sick → 450 hits; 30% of 500 healthy → 150 false alarms
    fireEvent.change(base, { target: { value: '1000' } })
    expect(read()).toContain('450 / 600')
    expect(read()).toContain('75%')
    fireEvent.change(fa, { target: { value: '1' } })
    expect(read()).toContain('450 / 455')
    expect(read()).toContain('99%')
    expect(container.innerHTML).not.toContain('NaN')
    // the coin-flip label sits above the plot, inside the chart, at both false alarm extremes
    for (const v of ['1', '30']) {
      fireEvent.change(fa, { target: { value: v } })
      const x = Number(container.querySelector('.pt-coin-label')!.getAttribute('x'))
      expect(x).toBeGreaterThanOrEqual(120)
      expect(x).toBeLessThanOrEqual(330)
    }
  })
})
