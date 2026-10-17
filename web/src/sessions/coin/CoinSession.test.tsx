// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { shellVerdict } from '../../components/session/verdict'
import { showcaseRound } from '../../rounds'
import { misconceptionFor } from '../../verdict'
import { notebook } from '../../notebook'
import { CoinSession } from './CoinSession'
import { sampleLabel } from './hooks'
import { expectedLongest, pLongestAtMost } from './math'

afterEach(cleanup)

const next = (re: RegExp) => fireEvent.click(screen.getByRole('button', { name: re }))

describe('coin streak session', () => {
  it('plays tap → lock → flip → compare → extremes → card → which is real', async () => {
    vi.useFakeTimers()
    // reduced motion: "run 1,000" lands at once
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), media: q }))
    const done = vi.fn()
    localStorage.clear()
    render(<CoinSession onDone={done} />)
    expect(screen.getByText(/^Make up 20 coin flips/)).toBeTruthy()
    expect(screen.queryByText(/sample human row/)).toBeNull() // no fill-for-me: the point is your own pattern

    // the coin-only first step (your own taps), then the same lock copy as every session
    const lock = screen.getByText('Show me') as HTMLButtonElement
    expect(screen.getByText('tap at least 20 flips first (0 so far)')).toBeTruthy()
    expect(lock.disabled).toBe(true)
    expect(lock.className).toContain('ss-lock')
    // keys H and T tap the coin; alternate every flip (switch rate 100%)
    for (let i = 0; i < 20; i++) fireEvent.keyDown(window, { key: i % 2 ? 'T' : 'H' })
    expect(screen.getByText('20', { selector: '.stats b' })).toBeTruthy()
    // the row is full: 20 real flips deal in under it, with the tally
    expect(screen.getByText('a real coin, 20 flips')).toBeTruthy()
    expect(screen.getByText(/^Your row on top, real flips below. Flip again/)).toBeTruthy() // guidance moves on once the deal lands
    expect(screen.getByText(/your longest:/).textContent).toMatch(/your longest: 1 · real: \d+/)
    expect(screen.getByText(/In 20 real flips the longest run averages 4\.66/)).toBeTruthy()
    fireEvent.click(screen.getByText('Flip again'))
    // the guess starts unset (no anchor): lock waits for the slider to move
    expect(lock.textContent).toBe('Move the slider first')
    expect(screen.getByText('?', { selector: '.guessnum .big' })).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Longest run in 100 real flips?'), { target: { value: '3' } })
    // like the birthday session: the slider is all it needs (no how-sure step, #194)
    expect(screen.queryByText('how sure?')).toBeNull()
    expect(lock.disabled).toBe(false)
    expect(lock.textContent).toBe('Show me')
    fireEvent.click(lock)
    await act(async () => vi.advanceTimersByTime(50))

    expect(screen.getByText('Now a real coin. Flip it.')).toBeTruthy()
    expect(screen.getByText(/^Each dot is one real round of 100 flips/)).toBeTruthy() // guidance line
    expect(screen.getByText('6.98')).toBeTruthy() // exact mean in ink
    // #174: the exact line is about your guess, like the simulated % next to it; never "100.0%"
    expect(document.querySelector('.simnote')!.textContent).toContain('Exact: a run longer than your 3 shows up >99.9% of the time.')
    expect(document.body.textContent).not.toMatch(/100\.0%|run of 5\+ shows up/)
    expect(screen.getByText(/real average 6\.98 \(exact\)/)).toBeTruthy() // truth line is labeled
    expect(screen.getByText(/you guessed/).textContent).toBe('you guessed 3 in a row')
    expect(screen.getByText(/^Flipped here: 1 run of 100 flips/)).toBeTruthy()
    fireEvent.click(screen.getByText('Run 1,000 times'))
    expect(screen.getByText(/^Simulated: 1,000 runs of 100 flips,/)).toBeTruthy() // a fresh sample of exactly 1,000
    // flipping after the batch is counted apart, never "1,001 runs"
    fireEvent.click(screen.getByText('Flip 100 again'))
    expect(screen.getByText(/^Simulated: 1,000 runs \+ 1 you flipped, of 100 flips each,/)).toBeTruthy()
    expect(document.body.textContent).not.toMatch(/NaN|1,001/)

    next(/your coin vs the real one/)
    expect(screen.getByText('Your coin vs the real coin')).toBeTruthy()
    expect(screen.getByText(/^Your row next to a real 100/)).toBeTruthy()
    expect(screen.getByText(/You switched 100% of the time/)).toBeTruthy()

    next(/push it to 10,000 flips/)
    expect(screen.getByText(/^Drag to flip more or fewer coins/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '10,000' }))
    expect(screen.getByText('13.62')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '10' }))
    expect(screen.getByText('3.66')).toBeTruthy()

    next(/what your taps say/)
    expect(screen.getByText(/^This is the mistake your guess points to/)).toBeTruthy()
    // the stamp is the verdict word; the mistake's name is the card title under it (#149)
    expect(document.querySelector('.ss-stamp')!.textContent).toBe('Way off')
    expect(document.querySelector('.mname')!.textContent).toBe('“Random means evenly mixed”')
    expect(screen.getByText(/^One more: spot the real coin/)).toBeTruthy()
    expect(screen.getAllByText('Random means evenly mixed').length).toBeGreaterThan(0)
    expect(screen.getByText(/A real coin goes past 3 in/)).toBeTruthy()
    expect(screen.getByText(/You said/).textContent).toBe('You said 3. A real 100 averages 6.98.')

    // saved when the card shows, before any rematch (#159)
    const atCard = JSON.parse(localStorage.getItem('mm.sessions') ?? '[]')
    expect(atCard).toHaveLength(1)
    expect(atCard[0]).toMatchObject({ session: 'coin-streak', guess: 3, misconception: 'random-means-evenly-mixed', rematch: null })
    fireEvent.click(screen.getByRole('button', { name: /^A: / }))
    expect(screen.getByText(/B was the real coin/)).toBeTruthy()
    expect(screen.getByText(/In 20 real flips/)).toBeTruthy()
    // both rematch rows stay plain ink: pencil only ever means "you"
    expect(document.querySelectorAll('.tryit .mine').length).toBe(0)
    // the pick updates the card's entry; the end bar waits for the compare step
    expect(screen.queryByText('Saved to your notebook.')).toBeNull()
    expect(JSON.parse(localStorage.getItem('mm.sessions') ?? '[]')).toHaveLength(1)

    // compare (#182): a 50% shooter next to the real coin, then name what's the same
    next(/one more case/)
    expect(screen.getByText('One more case: a 50% shooter')).toBeTruthy()
    expect(screen.getByText(/^A made-up shooter who makes exactly half her shots/)).toBeTruthy()
    expect(screen.getByRole('button', { name: '6 Same idea, new case' }).getAttribute('aria-current')).toBe('step')
    expect(screen.getByText('6 of 6')).toBeTruthy()
    // seeded: the first 100 shots have 49 made and a 7-shot streak, marked
    expect(screen.getByRole('img', { name: '100 shots, 49 made, longest streak 7 marked' })).toBeTruthy()
    expect(document.querySelectorAll('.shots .shot').length).toBe(100)
    expect(document.querySelectorAll('.shots .shot-run').length).toBeGreaterThan(0)
    expect(screen.getByText(/illustrative, not data on real players/)).toBeTruthy()
    fireEvent.click(screen.getByText('Shoot 100 again'))
    expect(screen.getByText(/^longest so far: 7, \d+$/)).toBeTruthy()
    expect(screen.queryByText('the shared idea')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /After a run, the other side is due/ }))
    expect(screen.getByText('Not quite.')).toBeTruthy()
    expect(screen.getByText('Each flip or shot ignores the last, so long runs are normal, not a sign of anything.')).toBeTruthy()
    expect(document.querySelector('.cmp-detail')!.textContent).toContain('averages 6.98, and a run of 5+ shows up 97.2% of the time')
    expect(screen.getByRole('button', { name: /Each try ignores the last one/ }).className).toContain('right')

    // the rematch and the compare answer update that same entry: same notebook as the birthday session, once
    expect(screen.getByText('Saved to your notebook.')).toBeTruthy()
    expect(document.querySelector('.ss-end')!.textContent).toContain('Caught: “Random means evenly mixed”. Rematch missed; it stays in your notebook to try again.')
    expect(screen.getByText('Open notebook').getAttribute('href')).toContain('?notebook=1')
    const saved = JSON.parse(localStorage.getItem('mm.sessions') ?? '[]')
    expect(saved).toHaveLength(1)
    expect(saved[0]).toMatchObject({ session: 'coin-streak', guess: 3, misconception: 'random-means-evenly-mixed', rematch: 'wrong', at: atCard[0].at, comparePick: 'due', compareRight: false })
    expect(document.body.textContent).not.toMatch(/NaN/)

    fireEvent.click(screen.getByText('Done'))
    expect(done).toHaveBeenCalled()
    expect(JSON.parse(localStorage.getItem('mm.sessions') ?? '[]')).toHaveLength(1)
    vi.useRealTimers()
    vi.unstubAllGlobals()
  }, 60000)

  it('keeps the 20-flip deal clean: extra taps, undo, clear, length toggles', () => {
    render(<CoinSession onDone={() => {}} />)
    const H = screen.getByRole('button', { name: 'Heads (key H)' })
    const flips = () => screen.getByText(/^flips/).textContent
    const realRow = () => screen.queryByText('a real coin, 20 flips')

    // a burst of taps past the end stops at exactly 20, mouse or keys
    for (let i = 0; i < 30; i++) fireEvent.click(H)
    expect(flips()).toBe('flips 20/20')
    for (let i = 0; i < 5; i++) fireEvent.keyDown(window, { key: 'T' })
    expect(flips()).toBe('flips 20/20')
    expect(realRow()).toBeTruthy()
    // a held key (auto-repeat) doesn't count
    fireEvent.click(screen.getByText('Clear'))
    fireEvent.keyDown(window, { key: 'H', repeat: true })
    expect(flips()).toBe('flips 0/20')

    for (let i = 0; i < 20; i++) fireEvent.click(H)
    expect(realRow()).toBeTruthy()
    // Undo (button or Backspace) takes the real row away; the 20th tap deals a fresh one
    fireEvent.keyDown(window, { key: 'Backspace' })
    expect(flips()).toBe('flips 19/20')
    expect(realRow()).toBeNull()
    fireEvent.keyDown(window, { key: 'T' })
    expect(realRow()).toBeTruthy()
    fireEvent.click(screen.getByText('Undo'))
    expect(realRow()).toBeNull()
    fireEvent.click(H)
    expect(realRow()).toBeTruthy()

    // clicking the length you're already on never wipes your row
    fireEvent.click(screen.getByRole('radio', { name: '20 flips' }))
    expect(flips()).toBe('flips 20/20')
    // 100 mid-row keeps the taps and carries on
    fireEvent.click(screen.getByRole('radio', { name: '100 flips' }))
    expect(flips()).toBe('flips 20/100')
    expect(screen.queryByText(/a real coin, 100 flips/)).toBeNull()
    fireEvent.click(H)
    expect(flips()).toBe('flips 21/100')
    // back to 20 cuts to 20 and deals at once
    fireEvent.click(screen.getByRole('radio', { name: '20 flips' }))
    expect(flips()).toBe('flips 20/20')
    expect(realRow()).toBeTruthy()
    expect(document.body.textContent).not.toMatch(/NaN/)
  }, 60000)
})

describe('sample label', () => {
  it('never adds flipped strips onto the 1,000 batch', () => {
    expect(sampleLabel(0, 1)).toBe('Flipped here: 1 run of 100 flips')
    expect(sampleLabel(0, 3)).toBe('Flipped here: 3 runs of 100 flips')
    expect(sampleLabel(1000, 0)).toBe('Simulated: 1,000 runs of 100 flips')
    expect(sampleLabel(1000, 2)).toBe('Simulated: 1,000 runs + 2 you flipped, of 100 flips each')
  })
})

// tap 20, guess, show me, then jump to the card with the step dots
async function playToCard(guess: number) {
  render(<CoinSession onDone={() => {}} />)
  for (let i = 0; i < 20; i++) fireEvent.keyDown(window, { key: i % 3 ? 'T' : 'H' })
  fireEvent.change(screen.getByLabelText('Longest run in 100 real flips?'), { target: { value: String(guess) } })
  fireEvent.click(screen.getByText('Show me'))
  await act(async () => vi.advanceTimersByTime(50))
  fireEvent.click(screen.getByRole('button', { name: '5 Your mistake' }))
  await act(async () => vi.advanceTimersByTime(50))
}

describe('coin card and end bar (same shell as birthday)', () => {
  it('a called-it guess gets the called-it line and stamp; a missed rematch still shows (#150, #148)', async () => {
    vi.useFakeTimers()
    localStorage.clear()
    await playToCard(7)
    expect(screen.getByText('What happened in your head')).toBeTruthy()
    expect(screen.getByText("You were right. Here's the idea that makes it work, so you can do it again.")).toBeTruthy()
    expect(screen.queryByText(/^This is the mistake your guess points to/)).toBeNull()
    expect(document.querySelector('.ss-stamp')!.textContent).toBe('Spot on')
    expect(screen.getByText('the right model')).toBeTruthy()
    // the made-up row: the bar says both parts, never a bare "Called it."
    fireEvent.click(screen.getByRole('button', { name: /^A: / }))
    throughCompare()
    const bar = document.querySelector('.ss-end')!.textContent!
    // the made-up row maps to a mistake, so the notebook really has it (#162)
    expect(bar).toContain('Saved to your notebook. Your first guess was right. Rematch missed: “Random means evenly mixed” is in your notebook to try again.')
    expect(screen.getByText('Open notebook')).toBeTruthy()
    const saved = JSON.parse(localStorage.getItem('mm.sessions') ?? '[]')
    expect(saved).toHaveLength(1)
    expect(saved[0]).toMatchObject({ misconception: null, rematch: 'wrong', rematchMisconception: 'random-means-evenly-mixed' })
    expect(notebook().map((c) => [c.id, c.status])).toEqual([['random-means-evenly-mixed', 'caught']])
    vi.useRealTimers()
  }, 60000)

  it('saves once at the card: step dots back and forth, then Done, never add a second entry (#159)', async () => {
    vi.useFakeTimers()
    localStorage.clear()
    await playToCard(3)
    fireEvent.click(screen.getByRole('button', { name: '2 Flip it' }))
    await act(async () => vi.advanceTimersByTime(50))
    fireEvent.click(screen.getByRole('button', { name: '5 Your mistake' }))
    await act(async () => vi.advanceTimersByTime(50))
    // no rematch pick: Done waits on the compare step; its answer lands on the same entry
    throughCompare()
    fireEvent.click(screen.getByText('Done'))
    const saved = JSON.parse(localStorage.getItem('mm.sessions') ?? '[]')
    expect(saved).toHaveLength(1)
    expect(saved[0]).toMatchObject({ session: 'coin-streak', guess: 3, misconception: 'random-means-evenly-mixed', rematch: null, comparePick: 'no-memory', compareRight: true })
    expect(notebook().map((c) => c.id)).toEqual(['random-means-evenly-mixed'])
    vi.useRealTimers()
  }, 60000)

  it('never prints 100.0% for a chance below 1 (#161)', async () => {
    vi.useFakeTimers()
    await playToCard(3)
    expect(screen.getByText(/A real coin goes past 3 in/).textContent).toContain('>99.9% of 100-flip runs')
    expect(document.body.textContent).not.toContain('100.0%')
    fireEvent.click(screen.getByRole('button', { name: '4 Extremes' }))
    await act(async () => vi.advanceTimersByTime(50))
    expect(screen.getByText(/a run longer than your 3 happens/).textContent).toContain('>99.9% of the time')
    vi.useRealTimers()
  }, 60000)

  it('right guess and right rematch', async () => {
    vi.useFakeTimers()
    await playToCard(6)
    fireEvent.click(screen.getByRole('button', { name: /^B: / }))
    throughCompare()
    expect(document.querySelector('.ss-end')!.textContent).toContain('Your first guess was right. Rematch: right.')
    vi.useRealTimers()
  }, 60000)

  it('a long-streak guess stamps the verdict word, with the mistake as the title', async () => {
    vi.useFakeTimers()
    await playToCard(15)
    expect(document.querySelector('.ss-stamp')!.textContent).toBe('Way off')
    expect(document.querySelector('.mname')!.textContent).toBe("“A long streak means something's off”")
    expect(screen.getByText('the mistake')).toBeTruthy()
    vi.useRealTimers()
  }, 60000)

  it('stamp and caught mistake never disagree, for every guess (#151)', () => {
    const item = showcaseRound('coin-streak')!.items.find((i) => i.id === 'longest-run-100')!
    const truth = expectedLongest(100)
    for (let g = 1; g <= 20; g++) {
      const m = misconceptionFor(item, { value: g, optionId: null, confidence: 'pretty sure' })
      const v = shellVerdict(m, g, truth, 0.15 * 19)
      expect(v === 'called').toBe(m === null)
      // with the 5-9 band, nothing outside it is within 2.85 of 6.98: the coin never stamps "close"
      expect(v).not.toBe('close')
    }
  })
})

// card → compare: the right option by key 2, then the end bar shows
function throughCompare() {
  fireEvent.click(screen.getByText('Next: one more case →'))
  fireEvent.keyDown(window, { key: '2' })
  expect(screen.getByText("That's it.")).toBeTruthy()
}

describe('coin qa (#174, #175)', () => {
  it("the exact line follows the guess: a run longer than your 7", async () => {
    vi.useFakeTimers()
    await playToCard(7)
    fireEvent.click(screen.getByRole('button', { name: '2 Flip it' }))
    const p = 1 - pLongestAtMost(100, 7)
    expect(document.querySelector('.simnote')!.textContent).toContain(`Exact: a run longer than your 7 shows up ${(p * 100).toFixed(1)}% of the time.`)
    vi.useRealTimers()
  }, 60000)

  it('after 20 taps a cue takes you down to the guess; the keys hint can hide on touch', () => {
    render(<CoinSession onDone={() => {}} />)
    expect(screen.queryByText('Next: guess the big one ↓')).toBeNull()
    for (let i = 0; i < 20; i++) fireEvent.keyDown(window, { key: i % 2 ? 'T' : 'H' })
    const cue = screen.getByText('Next: guess the big one ↓')
    const box = document.querySelector('.guessbox') as HTMLElement
    const into = vi.fn()
    box.scrollIntoView = into
    fireEvent.click(cue)
    expect(into).toHaveBeenCalled()
    expect(document.activeElement?.id).toBe('coin-guess')
    expect(document.querySelector('.keyhint')!.textContent).toBe('Keys H and T work too. ')
  })

  it('no end bar before the compare; a skipped rematch still saves once at Done', async () => {
    vi.useFakeTimers()
    localStorage.clear()
    const done = vi.fn()
    render(<CoinSession onDone={done} />)
    for (let i = 0; i < 20; i++) fireEvent.keyDown(window, { key: i % 3 ? 'T' : 'H' })
    fireEvent.change(screen.getByLabelText('Longest run in 100 real flips?'), { target: { value: '6' } })
    fireEvent.click(screen.getByText('Show me'))
    await act(async () => vi.advanceTimersByTime(50))
    fireEvent.click(screen.getByRole('button', { name: '5 Your mistake' }))
    fireEvent.click(screen.getByText('Next: one more case →'))
    fireEvent.change(screen.getByLabelText(/In your own words/), { target: { value: 'no memory' } })
    fireEvent.keyDown(window, { key: '2' })
    expect(screen.queryByText('Saved to your notebook.')).toBeNull()
    fireEvent.click(screen.getByText('Done'))
    expect(done).toHaveBeenCalled()
    const saved = JSON.parse(localStorage.getItem('mm.sessions') ?? '[]')
    expect(saved).toHaveLength(1)
    expect(saved[0]).toMatchObject({ session: 'coin-streak', guess: 6, misconception: null, rematch: null, comparePick: 'no-memory', compareRight: true, compareText: 'no memory' })
    vi.useRealTimers()
  }, 60000)
})
