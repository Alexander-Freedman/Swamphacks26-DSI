// @vitest-environment jsdom
// QA round 2: topic box finds the sessions (#167), notebook next step (#169), round misses land in
// the notebook (#172). The drawer gate (#171) and the backend dot (#173) are in HowItWorks.test.tsx.
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { SESSION_ALIASES, matchTopic, resetExtrasCache, type ExtraTopic } from './extras'
import { entries, notebook, plays, record } from './notebook'
import bundled from 'virtual:extra-index'
import dice from '../../data/rounds/extra/dice-sums.json'
import monty from '../../data/rounds/extra/monty-hall.json'

const BASE = import.meta.env.BASE_URL
const here = () => location.pathname + location.search
const files: Record<string, unknown> = {
  [`${BASE}rounds/extra/index.json`]: [dice, monty].map((d) => ({ slug: d.slug, topic: d.topic, aliases: d.aliases })),
  [`${BASE}rounds/extra/dice-sums.json`]: dice,
  [`${BASE}rounds/extra/monty-hall.json`]: monty,
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

beforeEach(() => {
  resetExtrasCache()
  localStorage.clear()
  history.replaceState(null, '', BASE)
  vi.stubGlobal('fetch', vi.fn(async (url: string) => (url in files ? json(files[url]) : json({ detail: 'nope' }, 404))))
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

const extras = bundled as ExtraTopic[]

describe('topic matching (#167)', () => {
  it('opens the three sessions by title, slug and common names', () => {
    const cases: Record<string, string> = {
      'birthday problem': 'birthday',
      'The Birthday Problem': 'birthday',
      'birthday paradox': 'birthday',
      'shared birthday': 'birthday',
      'coin flips': 'coin-streak',
      streaks: 'coin-streak',
      "Gambler's fallacy": 'coin-streak',
      'gamblers fallacy': 'coin-streak',
      'hot hand': 'coin-streak',
      randomness: 'coin-streak',
      'be a coin': 'coin-streak',
      'false positives': 'positive-test',
      'base rate': 'positive-test',
      bayes: 'positive-test',
      "bayes' theorem": 'positive-test',
      'Bayes theorem': 'positive-test',
      'medical test': 'positive-test',
      'You tested positive. Are you sick?': 'positive-test',
    }
    for (const [text, slug] of Object.entries(cases)) expect(matchTopic(text, extras), text).toBe(slug)
  })

  it('loosely matches near phrasings of the extras', () => {
    const cases: Record<string, string> = {
      'monty hall paradox': 'monty-hall',
      'dice odds': 'dice-sums',
      interest: 'compound-interest',
      'compound interest': 'compound-interest',
      exponential: 'doubling',
      'the hospital problem!': 'small-samples',
      'Opportunity Costs': 'opportunity-cost',
    }
    for (const [text, slug] of Object.entries(cases)) expect(matchTopic(text, extras), text).toBe(slug)
  })

  it("doesn't guess: filler words, unrelated topics and ties stay misses", () => {
    for (const text of ['probability', 'the problem', 'quantum tunnelling', 'tides', 'growth', 'odds', 'what is'])
      expect(matchTopic(text, extras), text).toBeNull()
  })

  it('every session alias is an exact hit for its own session', () => {
    for (const [slug, names] of Object.entries(SESSION_ALIASES))
      for (const n of names) expect(matchTopic(n, extras), n).toBe(slug)
  })

  // Retired with the Learn plan (Sat 11:45 PM): Home's topic box now opens Learn sessions (learn/LearnTopicBox.test.tsx).
  it.skip('typing the first card\'s title on Home opens the session at ?session=', async () => {
    render(<App />)
    await screen.findByRole('button', { name: 'Sums of dice' })
    fireEvent.change(screen.getByLabelText(/topic you want/), { target: { value: 'birthday problem' } })
    fireEvent.click(screen.getByRole('button', { name: 'Go' }))
    await waitFor(() => expect(here()).toBe(`${BASE}?session=birthday`))
  }, 15000)

  // Retired with the Learn plan (Sat 11:45 PM): Home's topic box now opens Learn sessions (learn/LearnTopicBox.test.tsx).
  it.skip('a miss offers the subject sessions first, and a session chip opens the session', async () => {
    render(<App />)
    await screen.findByRole('button', { name: 'Sums of dice' })
    fireEvent.change(screen.getByLabelText(/topic you want/), { target: { value: 'quantum tunnelling' } })
    fireEvent.click(screen.getByRole('button', { name: 'Go' }))
    await screen.findByText(/No round on “quantum tunnelling” yet/)
    const chips = [...screen.getByRole('group', { name: 'Hand-checked topics' }).querySelectorAll('button')].map((b) => b.textContent)
    expect(chips.slice(0, 2)).toEqual(['Organic chemistry', 'Calculus'])
    expect(chips).toContain('Sums of dice')
    fireEvent.click(screen.getByRole('button', { name: 'Calculus' }))
    await waitFor(() => expect(here()).toBe(`${BASE}?session=calculus`))
  })
})

describe('notebook next step (#169)', () => {
  it('after a called-it birthday with a right rematch, the button points at a session not played yet', () => {
    record({ session: 'birthday', at: new Date().toISOString(), guess: 23, confidence: 'certain', misconception: null, rematch: 'right' })
    history.replaceState(null, '', `${BASE}?notebook=1`)
    render(<App />)
    expect(screen.getByText('Try any topic').closest('a')?.getAttribute('href')).toBe(BASE)
  })
})

describe('round misses in the notebook (#172)', () => {
  const lockSlider = (value: number) => {
    fireEvent.change(screen.getByLabelText('your guess'), { target: { value: String(value) } })
    fireEvent.click(screen.getByRole('button', { name: 'Show me' }))
  }

  // The notebook shows Learn topics only (Sat 1:30 AM); round entries are still saved, just not shown.
  it.skip('a big miss is saved right away and its card links back to the round', async () => {
    history.replaceState(null, '', `${BASE}?round=monty-hall`)
    render(<App />)
    await screen.findByText(/The Monty Hall problem · 1 of 3/)
    lockSlider(46)
    expect(await screen.findByText(/Keep this one\./)).toBeTruthy()
    const saved = entries()
    expect(saved).toHaveLength(1)
    expect(saved[0]).toMatchObject({ session: 'monty-hall', kind: 'round', misconception: 'two-doors-fifty-fifty', rematch: null, guess: 46 })
    const [card] = notebook()
    expect(card).toMatchObject({ session: 'monty-hall', label: 'Two doors left means 50/50', topic: 'The Monty Hall problem', href: `${BASE}?round=monty-hall` })
    cleanup()
    history.replaceState(null, '', `${BASE}?notebook=1`)
    render(<App />)
    expect(screen.getByText('“Two doors left means 50/50”').closest('li')?.className).toContain('caught')
    expect(screen.getByText('The Monty Hall problem')).toBeTruthy()
    expect(screen.getByText('Try it again →').getAttribute('href')).toBe(`${BASE}?round=monty-hall`)
    expect(screen.getByText(/1 session played/)).toBeTruthy()
  })

  it('two mistakes in one play are two cards but one play; a clean play counts as a right answer', () => {
    const play = 'monty-hall@2026-10-17T00:00:00.000Z'
    const base = { session: 'monty-hall', kind: 'round' as const, topic: 'The Monty Hall problem', rematch: null, guess: 'x' }
    record({ ...base, play, at: '2026-10-17T00:00:01.000Z', misconception: 'two-doors-fifty-fifty', label: 'Two doors left means 50/50' })
    record({ ...base, play, at: '2026-10-17T00:00:02.000Z', misconception: 'stick-feels-safer', label: 'My first pick is safer' })
    expect(notebook()).toHaveLength(2)
    expect(plays()).toBe(1)
    record({ ...base, play: 'p2', at: '2026-10-18T00:00:00.000Z', misconception: null })
    record({ ...base, play: 'p3', at: '2026-10-19T00:00:00.000Z', misconception: null })
    expect(notebook().map((c) => c.status)).toEqual(['busted', 'busted'])
    expect(plays()).toBe(3)
  })

  it('session cards still link back to their session', () => {
    record({ session: 'birthday', at: new Date().toISOString(), guess: 180, confidence: 'certain', misconception: 'half-of-365', rematch: 'wrong' })
    expect(notebook()[0].href).toBe(`${BASE}?session=birthday`)
  })
})
