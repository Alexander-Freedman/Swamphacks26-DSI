import { describe, expect, it } from 'vitest'
import bundled from 'virtual:extra-index'
import { extraIndex } from './extraIndex'

describe('extra topic index', () => {
  it('a round with no aliases (or junk aliases) still gets in, with []', () => {
    expect(
      extraIndex([
        { slug: 'tides', topic: 'Tides', reviewed: true },
        { slug: 'waves', topic: 'Waves', reviewed: true, aliases: 'not a list' },
        { slug: 'orbits', topic: 'Orbits', reviewed: true, aliases: ['orbit', 3] },
      ]),
    ).toEqual([
      { slug: 'tides', topic: 'Tides', aliases: [] },
      { slug: 'waves', topic: 'Waves', aliases: [] },
      { slug: 'orbits', topic: 'Orbits', aliases: ['orbit'] },
    ])
  })

  it('skips unreviewed rounds and anything without a slug and topic', () => {
    expect(extraIndex([{ slug: 'a', topic: 'A', reviewed: false }, { topic: 'B', reviewed: true }, null, 'x'])).toEqual([])
  })

  it('the bundle carries every hand-checked extra, names only', () => {
    expect(bundled.map((t) => t.slug)).toContain('monty-hall')
    expect(bundled.find((t) => t.slug === 'monty-hall')!.aliases).toContain('goats and a car')
    for (const t of bundled) expect(Object.keys(t).sort()).toEqual(['aliases', 'slug', 'topic'])
  })
})
