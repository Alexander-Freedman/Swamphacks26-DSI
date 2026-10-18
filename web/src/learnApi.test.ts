// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createLearnApi, createMockLearnApi, mockGraders } from './learnApi'
import { isOffline, type Topic } from './learn/types'
import staticTopic from '../public/learn/compound-interest.json'
import fixture from './learn/fixtures/compound-interest.json'

const topic = fixture as Topic
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('static topic file', () => {
  it('matches the bundled fixture and follows the Topic shape', () => {
    expect(staticTopic).toEqual(fixture)
    expect(topic.misconceptions.length).toBeGreaterThanOrEqual(2)
    expect(topic.extremeCases).toHaveLength(3)
    expect(topic.rubric.contrastingCases).toHaveLength(2)
    expect(topic.rubric.anchorDescription).toContain('$110.41')
  })
})

describe('client fallbacks', () => {
  it('uses the backend when it answers', async () => {
    vi.stubEnv('VITE_API_BASE', 'http://api')
    const fetch = vi.fn(async () => json({ ...topic, topic: 'from api' }))
    vi.stubGlobal('fetch', fetch)
    const t = await createLearnApi().getTopic('compound-interest')
    expect(t?.topic).toBe('from api')
    expect(fetch).toHaveBeenCalledWith('http://api/api/learn/topics/compound-interest', expect.anything())
  })

  it('backend offline -> static JSON', async () => {
    vi.stubEnv('VITE_API_BASE', 'http://api')
    const fetch = vi.fn(async (url: string) => {
      if (url.startsWith('http://api')) throw new TypeError('Failed to fetch')
      if (url.endsWith('learn/index.json')) return json([{ slug: 'x', topic: 'static x', checked: true }])
      if (url.endsWith('learn/x.json')) return json({ ...topic, slug: 'x', topic: 'static x' })
      return json({}, 404)
    })
    vi.stubGlobal('fetch', fetch)
    const api = createLearnApi()
    expect(await api.listTopics()).toEqual([{ slug: 'x', topic: 'static x', checked: true }])
    expect((await api.getTopic('x'))?.topic).toBe('static x')
    // graded calls now fall back to the offline check for that topic
    const g = await api.guess('x', { text: 'it adds the same amount each year' })
    expect(isOffline(g)).toBe(false)
    expect(g).toMatchObject({ offline: true, misconceptionId: 'linear-growth' })
  })

  it('no backend and no static file -> mock', async () => {
    vi.stubEnv('VITE_API_BASE', undefined as unknown as string)
    vi.stubGlobal('fetch', vi.fn(async () => json({}, 404)))
    const api = createLearnApi()
    expect((await api.getTopic('compound-interest'))?.topic).toBe('compound interest')
    expect(await api.getTopic('nope')).toBeNull()
    expect((await api.listTopics()).map((t) => t.slug)).toEqual(['compound-interest'])
  })

  it('maps 503 codex_unavailable to Offline', async () => {
    vi.stubEnv('VITE_API_BASE', 'http://api')
    vi.stubGlobal('fetch', vi.fn(async () => json({ detail: 'codex_unavailable' }, 503)))
    const r = await createLearnApi().createTopic('tides')
    expect(r).toEqual({ offline: true, reason: 'codex_unavailable', detail: 'codex_unavailable' })
    const s = await createLearnApi().guess('unknown-topic', { text: 'x' })
    expect(isOffline(s) && s.reason).toBe('codex_unavailable')
  })

  it('VITE_LEARN_MOCK=1 never touches the network', async () => {
    vi.stubEnv('VITE_API_BASE', 'http://api')
    vi.stubEnv('VITE_LEARN_MOCK', '1')
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    const api = createLearnApi()
    expect((await api.getTopic('compound-interest'))?.slug).toBe('compound-interest')
    expect(await api.stress('compound-interest', { fix: 'x', caseIndex: 0, history: [] })).toMatchObject({ offline: true })
    expect(fetch).not.toHaveBeenCalled()
  })
})

describe('mock graders', () => {
  const g = mockGraders(topic)
  it('guess matches a misconception by keyword', () => {
    expect(g.guess({ text: 'just multiply the rate by the years' }).misconceptionId).toBe('rate-times-years')
    expect(g.guess({ text: 'compound every second and you get infinite money' }).misconceptionId).toBe('infinite-compounding')
    expect(g.guess({ text: 'hmm' })).toMatchObject({ classification: 'vague', misconceptionId: null, offline: true })
  })
  it('stress returns the pre-authored correct behavior with a keyword verdict', () => {
    const r = g.stress({ fix: 'the balance stays $100 because 1 to any power is 1', caseIndex: 0, history: [] })
    expect(r).toEqual({ offline: true, verdict: 'survives', critique: topic.extremeCases[0].correctBehavior })
    expect(g.stress({ fix: 'more money', caseIndex: 2, history: [] }).verdict).toBe('breaks')
  })
  it('draw grades all four criteria', () => {
    const r = g.draw({ rule: 'balance multiplied by (1 + rate) each period, power n', notes: 'principal, rate, periods', image: null })
    expect(r.criteria.map((c) => c.id)).toEqual(['entities', 'links', 'rule', 'why-rule'])
    expect(r.criteria[2].verdict).toBe('demonstrated')
  })
  it('neighbor and transfer give verdicts', () => {
    expect(g.neighbor({ key: 'simple-interest', answer: 'no idea', priorAnswer: null }).verdict).toBe('incorrect')
    expect(g.transfer({ analogy: 'growth', wasPushed: false }).verdict).toBe('too-abstract')
  })
  it('mock api with an unknown slug is Offline', async () => {
    expect(isOffline(await createMockLearnApi().guess('nope', { text: 'x' }))).toBe(true)
  })
})
