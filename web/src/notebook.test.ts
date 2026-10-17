// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { KEY, entries, notebook, record, reset, type Entry } from './notebook'

const e = (at: string, misconception: string | null, rematch: Entry['rematch'] = null, session = 'birthday'): Entry => ({
  session,
  at: `2026-10-${at}T12:00:00.000Z`,
  guess: 100,
  misconception,
  rematch,
})

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

describe('notebook store', () => {
  it('records and reads back entries', () => {
    expect(entries()).toEqual([])
    record(e('15', 'half-of-365', 'wrong'))
    record(e('16', null, 'right'))
    expect(entries()).toHaveLength(2)
    expect(entries()[0].misconception).toBe('half-of-365')
  })

  it('reads the entries birthday wrote under mm.sessions before the notebook existed', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify([
        { session: 'birthday', at: '2026-10-16T09:00:00.000Z', guess: 180, confidence: 'pretty sure', misconception: 'its-about-my-birthday', rematch: 'wrong' },
        { junk: true },
      ]),
    )
    const cards = notebook()
    expect(cards).toHaveLength(1)
    expect(cards[0]).toMatchObject({ id: 'its-about-my-birthday', label: "It's about MY birthday", status: 'caught', caught: 1 })
    record(e('17', null))
    expect(entries()).toHaveLength(2)
  })

  it('caught → busted after two later right answers', () => {
    record(e('15', 'its-about-my-birthday', 'wrong'))
    expect(notebook()[0]).toMatchObject({ status: 'caught', wins: 0 })
    record(e('16', null, 'wrong')) // right guess: 1
    expect(notebook()[0]).toMatchObject({ status: 'caught', wins: 1 })
    record(e('16', null, null, 'coin-streak')) // another session doesn't count
    expect(notebook()[0].wins).toBe(1)
    record(e('17', 'half-of-365', 'right')) // rematch right: 2
    const [mine, half] = notebook()
    expect(mine).toMatchObject({ status: 'busted', wins: 2 })
    // the rematch in the same session counts once for the mistake it caught
    expect(half).toMatchObject({ status: 'caught', wins: 1, label: 'You need about half of 365' })
  })

  it('getting caught again puts a busted mistake back in pencil', () => {
    record(e('10', 'too-few', 'right'))
    record(e('11', null, 'right'))
    expect(notebook()[0]).toMatchObject({ status: 'busted', label: 'A handful of people is enough' })
    record(e('12', 'too-few', 'wrong'))
    expect(notebook()[0]).toMatchObject({ status: 'caught', caught: 2, wins: 0 })
  })

  it('reset clears the notebook and other mm. answers, and nothing else', () => {
    record(e('15', 'half-of-365'))
    localStorage.setItem('mm.other', '1')
    localStorage.setItem('theme', 'dark')
    reset()
    expect(entries()).toEqual([])
    expect(notebook()).toEqual([])
    expect(localStorage.getItem('mm.other')).toBeNull()
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('blocked storage never throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    expect(() => record(e('15', 'half-of-365'))).not.toThrow()
    expect(entries()).toEqual([])
    expect(notebook()).toEqual([])
    expect(() => reset()).not.toThrow()
  })

  it('survives garbage in the key and a missing localStorage', () => {
    localStorage.setItem(KEY, '{not json')
    expect(entries()).toEqual([])
    localStorage.setItem(KEY, '{"a":1}')
    expect(entries()).toEqual([])
    vi.spyOn(globalThis, 'localStorage', 'get').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(entries()).toEqual([])
    expect(() => record(e('15', null))).not.toThrow()
    expect(() => reset()).not.toThrow()
  })
})
