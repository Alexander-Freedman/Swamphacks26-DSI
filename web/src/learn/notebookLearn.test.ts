import { describe, expect, it } from 'vitest'
import { notebook, type Entry } from '../notebook'

const e = (slug: string, at: string, misconception: string | null, label?: string): Entry => ({
  session: 'learn', slug, at, guess: 'g', misconception, rematch: null, label, topic: slug.replace(/-/g, ' '), fix: label ? `fix for ${label}` : undefined,
})

describe('notebook: Learn topics', () => {
  it('each topic is its own card, links back to that topic, and carries the fix', () => {
    const cards = notebook([e('why-we-have-seasons', '2026-10-18T01:00:00Z', 'closer-means-summer', 'Summer is when Earth is closer')])
    expect(cards).toHaveLength(1)
    expect(cards[0].href).toContain('?learn=why-we-have-seasons')
    expect(cards[0].fix).toBe('fix for Summer is when Earth is closer')
    expect(cards[0].session).toBe('learn:why-we-have-seasons')
  })

  it("finishing a different topic doesn't count toward busting this one", () => {
    const cards = notebook([
      e('why-we-have-seasons', '2026-10-18T01:00:00Z', 'closer-means-summer', 'Summer is when Earth is closer'),
      e('ohm-s-law', '2026-10-18T01:10:00Z', null),
      e('recursion', '2026-10-18T01:20:00Z', null),
    ])
    expect(cards[0].wins).toBe(0)
    expect(cards[0].status).toBe('caught')
  })

  it('getting the same topic right twice later busts it', () => {
    const cards = notebook([
      e('why-we-have-seasons', '2026-10-18T01:00:00Z', 'closer-means-summer', 'Summer is when Earth is closer'),
      e('why-we-have-seasons', '2026-10-18T01:10:00Z', null),
      e('why-we-have-seasons', '2026-10-18T01:20:00Z', null),
    ])
    expect(cards[0].status).toBe('busted')
  })
})
