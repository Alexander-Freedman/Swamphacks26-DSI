// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import App from '../../App'
import { shellVerdict } from '../../components/session/verdict'
import { showcaseRound } from '../../rounds'
import { misconceptionFor } from '../../verdict'
import { session } from './index'
import { CARD, ppv } from './math'

// 1,000-person screens are slow-ish under jsdom on a busy machine
vi.setConfig({ testTimeout: 30000 })

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
  fireEvent.click(screen.getByText('Show me'))
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

    // same button as the other sessions: slider, then "Show me" (no how-sure step, #194)
    const lock = screen.getByText('Move the slider first') as HTMLButtonElement
    expect(lock.disabled).toBe(true)
    expect(lock.className).toContain('ss-lock')
    expect(container.textContent).not.toContain('optional')
    fireEvent.change(screen.getByLabelText("Chance you're actually sick?"), { target: { value: '21' } })
    expect(lock.textContent).toBe('Show me')
    expect(lock.disabled).toBe(false)
    fireEvent.click(screen.getByLabelText('ten more healthy positives'))
    fireEvent.click(screen.getByLabelText('one more sick positive'))
    expect(container.textContent).toContain('9.1% of positives are sick (1 of 11)')
    fireEvent.click(screen.getByText('Show me'))

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
    // the guidance line from docs/experience.md, and tapping into the real pile
    expect(screen.getByText('These are all the positives. Tap a few: how many are actually sick?')).toBeTruthy()
    fireEvent.click(screen.getByText('pick one for me'))
    expect(container.textContent).toMatch(/sick, caught|healthy, false alarm/)
    expect(screen.getByText('these 89 were never sick')).toBeTruthy()

    fireEvent.click(screen.getByText('Now change the crowd →'))
    fireEvent.click(screen.getByText('common (50%)'))
    expect(screen.getByText('90.9%')).toBeTruthy()
    expect(screen.getByText('positive = probably sick')).toBeTruthy()
    expect(container.innerHTML).not.toContain('NaN')

    fireEvent.click(screen.getByText('What did I get wrong? →'))
    // 21% is 11.8 points from 9.2% but more than twice it: way off (#151), band → ignores-false-alarms.
    expect(screen.getByText('Way off')).toBeTruthy()
    expect(screen.getByText(/^This is the mistake your guess points to/)).toBeTruthy()
    expect(container.textContent).toContain('You said 21%.')
    expect(screen.getByText('False alarms are too rare to matter')).toBeTruthy()
    expect(screen.getByText('9.2%', { selector: '.pt-reality' })).toBeTruthy()

    // compare (#183): a bag scanner next to your test, then name what's the same
    fireEvent.click(screen.getByText('One more case →'))
    expect(screen.getByText('One more case: airport bags')).toBeTruthy()
    expect(screen.getByText("A bag scanner next to your test. Look at both: what's the same about how they work?")).toBeTruthy()
    expect(screen.getByRole('button', { name: '6 Same idea, new case' }).getAttribute('aria-current')).toBe('step')
    expect(container.textContent).toContain('99 / 2,097')
    expect(container.textContent).toContain('4.7%')
    expect(container.textContent).toContain('Illustrative numbers, not real airport data')
    expect(screen.getByRole('img', { name: '2097 alarms: 99 real, 1998 false' })).toBeTruthy()
    // the principle stays hidden until you answer, and so does the way on
    expect(container.textContent).not.toContain('the shared idea')
    expect(screen.queryByText('Rematch: new numbers →')).toBeNull()
    fireEvent.change(screen.getByLabelText(/In your own words/), { target: { value: 'too many false alarms' } })
    fireEvent.click(screen.getByRole('button', { name: /99% accurate, so an alarm is 99% real/ }))
    expect(screen.getByText('Not quite.')).toBeTruthy()
    expect(container.textContent).toContain('only 4.7% are real')
    expect(screen.getByText('When the thing is rare, even a small false-alarm rate makes most alarms false.')).toBeTruthy()
    expect(screen.getByText('You wrote: “too many false alarms”')).toBeTruthy()
    // the right option is marked, the options are done
    expect(screen.getByRole('button', { name: /Rare thing \+ small false-alarm rate/ }).className).toContain('right')
    expect((screen.getByRole('button', { name: /Both tests are just bad/ }) as HTMLButtonElement).disabled).toBe(true)

    // P6: new numbers, nothing given away before you move the slider
    fireEvent.click(screen.getByText('Rematch: new numbers →'))
    expect(screen.getByText('Same test, new numbers: does the idea stick?')).toBeTruthy()
    expect((screen.getByText('Move the slider first') as HTMLButtonElement).disabled).toBe(true)
    expect(container.textContent).not.toContain('27.9%')
    fireEvent.change(screen.getByLabelText("Chance you're actually sick?"), { target: { value: '60' } })
    fireEvent.click(screen.getByText('Show me'))
    expect(screen.getByText('27.9%', { selector: '.pt-reality' })).toBeTruthy()
    expect(screen.getByText('real 27.9%')).toBeTruthy()
    expect(screen.getByText('Way off')).toBeTruthy()
    expect(container.textContent).toContain('68 test positive: 19 sick, 49 false alarms')
    // end bar like birthday's: saved, first guess + rematch, open notebook, done (#148)
    expect(screen.getByText('Saved to your notebook.')).toBeTruthy()
    expect(container.querySelector('.ss-end')!.textContent).toContain('Caught: “False alarms are too rare to matter”. Rematch missed; it stays in your notebook to try again.')
    expect(screen.getByText('Open notebook').getAttribute('href')).toContain('?notebook=1')
    const saved = JSON.parse(localStorage.getItem('mm.sessions') ?? '[]')
    expect(saved.at(-1)).toMatchObject({ session: 'positive-test', guess: 21, misconception: 'ignores-false-alarms', rematch: 'wrong', rematchGuess: 60, rematchTruth: 27.9, comparePick: 'accuracy', compareRight: false, compareText: 'too many false alarms' })
    fireEvent.click(screen.getByText('Done'))
    expect(screen.getByText('You tested positive. Are you sick?')).toBeTruthy()
  })

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
    // 0% is 9.2 points off but nowhere near 9.2% in proportion: way off, next to the caught mistake (#151)
    expect(screen.getByText('Way off')).toBeTruthy()
    expect(container.textContent).toContain('the mistake')
    expect(container.textContent).toContain(`You said ${g}%:`)
    if (g === 0) expect(container.textContent).toContain('a positive takes you from 1% to 9.2%, about 9 times more likely')
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
    expect(read()).toContain('75.0%')
    fireEvent.change(fa, { target: { value: '1' } })
    expect(read()).toContain('450 / 455')
    expect(read()).toContain('98.9%')
    expect(container.innerHTML).not.toContain('NaN')
    // the coin-flip label sits above the plot, inside the chart, at both false alarm extremes
    for (const v of ['1', '30']) {
      fireEvent.change(fa, { target: { value: v } })
      const x = Number(container.querySelector('.pt-coin-label')!.getAttribute('x'))
      expect(x).toBeGreaterThanOrEqual(100)
      expect(x).toBeLessThanOrEqual(300)
    }
  })
})

const toCard = async (g: number) => {
  guessAndLock(g)
  await testEveryone()
  fireEvent.click(screen.getByText('Compare with my guess →'))
  fireEvent.click(screen.getByText('Now change the crowd →'))
  fireEvent.click(screen.getByText('What did I get wrong? →'))
}

describe('positive card and end bar (same shell as birthday)', () => {
  it('no how-sure step: the slider alone enables "Show me" (#194)', () => {
    render(<Session onDone={() => {}} />)
    expect(screen.queryByText('how sure?')).toBeNull()
    fireEvent.change(screen.getByLabelText("Chance you're actually sick?"), { target: { value: '40' } })
    const lock = screen.getByText('Show me') as HTMLButtonElement
    expect(lock.disabled).toBe(false)
  })

  it('called-it guess, missed rematch: called-it line on the card, both parts on the bar (#150, #148)', async () => {
    vi.useFakeTimers()
    const { container } = render(<Session onDone={() => {}} />)
    await toCard(9)
    expect(screen.getByText('Spot on')).toBeTruthy()
    expect(screen.getByText("You were right. Here's the idea that makes it work, so you can do it again.")).toBeTruthy()
    throughCompare()
    fireEvent.change(screen.getByLabelText("Chance you're actually sick?"), { target: { value: '100' } })
    fireEvent.click(screen.getByText('Show me'))
    expect(screen.getByText('Way off')).toBeTruthy()
    expect(container.querySelector('.ss-end')!.textContent).toContain('Saved to your notebook. Your first guess was right. Rematch missed; it stays in your notebook to try again.')
  })

  it('stamp and caught mistake agree for every guess; close only within 15 points and 2x (#151)', () => {
    const item = showcaseRound('positive-test')!.items[0]
    const truth = ppv(CARD) * 100
    for (let g = 0; g <= 100; g++) {
      const m = misconceptionFor(item, { value: g, optionId: null, confidence: 'pretty sure' })
      const v = shellVerdict(m, g, truth, 15)
      expect(v === 'called').toBe(m === null)
      if (v === 'close') expect(g >= truth / 2 && g <= truth * 2 && Math.abs(g - truth) <= 15).toBe(true)
      if (g <= 4) expect(v).toBe('off') // the low end never reads "close" next to a caught mistake
    }
  })

  it('step dots go back to any reached step, never to the locked guess (no "back" link)', async () => {
    vi.useFakeTimers()
    render(<Session onDone={() => {}} />)
    await toCard(30)
    expect(screen.queryByText('← back')).toBeNull()
    expect((screen.getByRole('button', { name: '1 Your guess' }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: '7 Rematch' }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByRole('button', { name: '5 Your mistake' }).getAttribute('aria-current')).toBe('step')
    fireEvent.click(screen.getByRole('button', { name: '3 Your pile vs real' }))
    expect(screen.getByText('Your pile vs the real pile.')).toBeTruthy()
    // forward again to where you were
    fireEvent.click(screen.getByRole('button', { name: '5 Your mistake' }))
    expect(screen.getByText('What happened in your head')).toBeTruthy()
  })

  it('rematch at the low end is way off, not close', async () => {
    vi.useFakeTimers()
    render(<Session onDone={() => {}} />)
    await toCard(9)
    throughCompare()
    fireEvent.change(screen.getByLabelText("Chance you're actually sick?"), { target: { value: '13' } })
    fireEvent.click(screen.getByText('Show me'))
    // 13% is 14.9 points from 27.9%, inside the old window, but under half of it
    expect(screen.getByText('Way off')).toBeTruthy()
  })
})

// card → compare (pick the right option with key 3) → rematch
function throughCompare() {
  fireEvent.click(screen.getByText('One more case →'))
  fireEvent.keyDown(window, { key: '3' })
  expect(screen.getByText("That's it.")).toBeTruthy()
  fireEvent.click(screen.getByText('Rematch: new numbers →'))
}
