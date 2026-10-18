// Client for the Learn API (docs/learn-api.md). Backend first; prebuilt topics fall back to the static
// files on Pages; model-graded calls fall back to the pre-authored offline check (labelled offline: true).
import { demoReply } from './demo/demo'
import { apiBase } from './extras'
// One real prebuilt topic is bundled so the mock works with no backend and no static file.
import bundledTopic from '../../data/learn/compound-interest.json'
import type {
  AnchorRequest,
  AnchorResponse,
  DrawCriterion,
  DrawRequest,
  DrawResponse,
  GuessRequest,
  GuessResponse,
  LearnApi,
  LearnStatus,
  NeighborRequest,
  NeighborResponse,
  Offline,
  Result,
  RevealRequest,
  RevealResponse,
  StressRequest,
  StressResponse,
  Topic,
  TopicSummary,
  TransferRequest,
  TransferResponse,
  WhyRequest,
  WhyResponse,
} from './learn/types'
import { isOffline } from './learn/types'

export const AUTHOR_TIMEOUT_MS = 150_000
export const CALL_TIMEOUT_MS = 20_000

const staticUrl = (file: string) => `${import.meta.env.BASE_URL}learn/${file}`

// ---------- offline graders (keyword checks against the pre-authored topic) ----------

const STOP = new Set(
  'the a an and or of to in on at is are was were be it its this that with for as by from but not no so if then than they them their you your i we he she his her into out up down more less very just also can will would should does do did have has had when what which who why how there here about over under same each any all some'.split(
    ' ',
  ),
)

export function keywords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^\p{L}\p{N}%$.]+/u)
      .map((w) => w.replace(/^\.+|\.+$/g, ''))
      .filter((w) => w.length > 2 && !STOP.has(w)),
  )
}

/** How many keywords of `target` show up in `text` (a word matches on a shared 4-letter stem). */
export function overlap(text: string, target: string): number {
  const have = [...keywords(text)]
  let n = 0
  for (const w of keywords(target)) {
    const stem = w.slice(0, 4)
    if (have.some((h) => h === w || (stem.length >= 4 && h.startsWith(stem)))) n++
  }
  return n
}

const words = (text: string) => text.trim().split(/\s+/).filter(Boolean).length

export function mockGraders(topic: Topic) {
  const r = topic.rubric
  return {
    guess({ text }: GuessRequest): GuessResponse {
      let best: { id: string; n: number } | null = null
      for (const m of topic.misconceptions) {
        const n = overlap(text, m.tell)
        if (n > 0 && (!best || n > best.n)) best = { id: m.id, n }
      }
      const classification = words(text) < 4 ? 'vague' : 'concrete'
      const hit = best ? topic.misconceptions.find((m) => m.id === best!.id)! : null
      return {
        offline: true,
        classification,
        misconceptionId: hit?.id ?? null,
        message: hit
          ? `Your guess sounds like a common idea: ${hit.label}. Keep it in mind as you go.`
          : classification === 'vague'
            ? 'Try saying a bit more: what changes, and what does it change?'
            : 'Got it. Hold on to that guess.',
      }
    },
    anchor({ answer }: AnchorRequest): AnchorResponse {
      const ok = overlap(answer, `${r.coreRule} ${r.causalLinks.join(' ')}`) >= 2
      return {
        offline: true,
        verdict: ok ? 'demonstrated' : 'unresolved',
        feedback: ok ? 'That lines up with the fact you were given.' : `Look again at the fact: ${r.anchorDescription}`,
        followUpQuestion: ok ? null : r.anchorPrompt,
      }
    },
    stress({ fix, caseIndex }: StressRequest): StressResponse {
      const c = topic.extremeCases[caseIndex]
      const survives = !!c && overlap(fix, c.correctBehavior) >= 2
      return {
        offline: true,
        verdict: survives ? 'survives' : 'breaks',
        critique: c?.correctBehavior ?? '',
        piece: survives ? null : (c?.predict?.piece ?? null),
      }
    },
    why({ answer }: WhyRequest): WhyResponse {
      const ok = overlap(answer, r.whyRuleMatters) >= 2
      return {
        offline: true,
        verdict: ok ? 'demonstrated' : 'unresolved',
        feedback: ok ? 'Yes, that is why the rule holds.' : r.whyRuleMatters,
        followUpQuestion: ok ? null : r.whyRuleQuestion,
      }
    },
    reveal({ history }: RevealRequest): RevealResponse {
      // Tie the reveal to the first case the learner's fix broke on.
      const broke = history.find((h) => h.verdict === 'breaks')
      return {
        offline: true,
        explanation: r.whyRuleMatters,
        revealedRule: r.coreRule,
        confirmCase: topic.extremeCases[broke?.caseIndex ?? 0]?.correctBehavior ?? '',
      }
    },
    draw({ rule, notes }: DrawRequest): DrawResponse {
      const all = `${rule} ${notes}`
      const ent = r.entities.filter((e) => overlap(all, e) > 0).length
      const crit = (id: DrawCriterion['id'], ok: boolean, note: string): DrawCriterion => ({
        id,
        verdict: ok ? 'demonstrated' : 'unresolved',
        note,
      })
      const criteria = [
        crit('entities', ent >= Math.min(2, r.entities.length), `Parts named: ${ent} of ${r.entities.length}.`),
        crit('links', overlap(all, r.causalLinks.join(' ')) >= 2, 'How one part drives another.'),
        crit('rule', overlap(rule, r.coreRule) >= 2, 'The rule in one line.'),
        crit('why-rule', overlap(all, r.whyRuleMatters) >= 2, 'Why the rule holds.'),
      ]
      return { offline: true, criteria, followUpQuestion: criteria.every((c) => c.verdict === 'demonstrated') ? null : r.whyRuleQuestion }
    },
    neighbor({ key, answer }: NeighborRequest): NeighborResponse {
      const n = r.confusableNeighbors.find((x) => x.key === key) ?? r.confusableNeighbors[0]
      const hits = n ? overlap(answer, n.correctDistinction) : 0
      const verdict = hits >= 3 ? 'correct' : hits >= 1 ? 'partial' : 'incorrect'
      return {
        offline: true,
        verdict,
        feedback: n?.correctDistinction ?? '',
        followUpQuestion: verdict === 'correct' ? null : (n?.question ?? null),
      }
    },
    transfer({ analogy }: TransferRequest): TransferResponse {
      const hits = r.transferStructuralRequirements.filter((q) => overlap(analogy, q) > 0).length
      const verdict = words(analogy) < 6 ? 'too-abstract' : hits >= r.transferStructuralRequirements.length ? 'maps' : 'partial'
      return {
        offline: true,
        verdict,
        critique: `One that works: ${r.referenceTransferExample}`,
        missingPiece: verdict === 'maps' ? null : (r.transferStructuralRequirements.find((q) => overlap(analogy, q) === 0) ?? null),
      }
    },
  }
}

// ---------- mock API (deterministic, no network) ----------

export function createMockLearnApi(seed: Topic[] = [bundledTopic as unknown as Topic]): LearnApi & { add(t: Topic): void } {
  const topics = new Map(seed.map((t) => [t.slug, t]))
  const noTopic = (): Offline => ({ offline: true, reason: 'no_backend', detail: 'unknown topic' })
  const graded =
    <K extends keyof ReturnType<typeof mockGraders>>(k: K) =>
    async (slug: string, body: Parameters<ReturnType<typeof mockGraders>[K]>[0]) => {
      const t = topics.get(slug)
      if (!t) return noTopic()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (mockGraders(t)[k] as (b: any) => any)(body) as ReturnType<ReturnType<typeof mockGraders>[K]>
    }
  return {
    add: (t) => void topics.set(t.slug, t),
    listTopics: async () => [...topics.values()].map(({ slug, topic, checked }) => ({ slug, topic, checked })),
    getTopic: async (slug) => topics.get(slug) ?? null,
    createTopic: async () => ({ offline: true, reason: 'no_backend', detail: 'thinking is offline, prebuilt topics still work' }),
    guess: graded('guess'),
    anchor: graded('anchor'),
    stress: graded('stress'),
    why: graded('why'),
    reveal: graded('reveal'),
    draw: graded('draw'),
    neighbor: graded('neighbor'),
    transfer: graded('transfer'),
    status: async () => ({ offline: true, reason: 'no_backend' }),
  }
}

export const mockLearnApi = createMockLearnApi()

// ---------- real client ----------

async function call<T>(method: 'GET' | 'POST', path: string, body?: unknown, timeoutMs = CALL_TIMEOUT_MS): Promise<Result<T>> {
  const base = apiBase()
  if (base === null) return { offline: true, reason: 'no_backend' }
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(`${base}${path}`, {
      method,
      signal: ctrl.signal,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    if (res.ok) return (await res.json()) as T
    let detail = `HTTP ${res.status}`
    try {
      detail = ((await res.json()) as { detail?: string }).detail ?? detail
    } catch {
      /* no JSON body */
    }
    if (res.status === 503) return { offline: true, reason: 'codex_unavailable', detail }
    return { offline: true, reason: 'network', detail }
  } catch (e) {
    return { offline: true, reason: 'network', detail: e instanceof Error ? e.message : String(e) }
  } finally {
    clearTimeout(timer)
  }
}

async function staticJson<T>(file: string): Promise<T | null> {
  try {
    const res = await fetch(staticUrl(file))
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

const mockMode = () => import.meta.env.VITE_LEARN_MOCK === '1'

export function createLearnApi(mock = createMockLearnApi()): LearnApi {
  const enc = encodeURIComponent
  // Backend first; if it's offline, the pre-authored offline check (needs the topic loaded once).
  const graded =
    <Req, Res>(name: string, offline: (slug: string, body: Req) => Promise<Result<Res>>) =>
    async (slug: string, body: Req): Promise<Result<Res>> => {
      if (mockMode()) return offline(slug, body)
      const demo = demoReply<Res>(slug, name, body)
      if (demo) return demo
      const r = await call<Res>('POST', `/api/learn/${enc(slug)}/${name}`, body)
      return isOffline(r) ? (await mock.getTopic(slug)) ? offline(slug, body) : r : r
    }
  return {
    async listTopics() {
      if (mockMode()) return mock.listTopics()
      const r = await call<TopicSummary[]>('GET', '/api/learn/topics')
      if (!isOffline(r)) return r
      return (await staticJson<TopicSummary[]>('index.json')) ?? mock.listTopics()
    },
    async getTopic(slug) {
      if (mockMode()) return mock.getTopic(slug)
      const r = await call<Topic>('GET', `/api/learn/topics/${enc(slug)}`)
      const t = !isOffline(r) ? r : ((await staticJson<Topic>(`${enc(slug)}.json`)) ?? (await mock.getTopic(slug)))
      if (t) mock.add(t)
      return t
    },
    async createTopic(topic) {
      if (mockMode()) return mock.createTopic(topic)
      const r = await call<Topic>('POST', '/api/learn/topics', { topic }, AUTHOR_TIMEOUT_MS)
      if (!isOffline(r)) mock.add(r)
      return r
    },
    guess: graded<GuessRequest, GuessResponse>('guess', mock.guess),
    anchor: graded<AnchorRequest, AnchorResponse>('anchor', mock.anchor),
    stress: graded<StressRequest, StressResponse>('stress', mock.stress),
    why: graded<WhyRequest, WhyResponse>('why', mock.why),
    reveal: graded<RevealRequest, RevealResponse>('reveal', mock.reveal),
    draw: graded<DrawRequest, DrawResponse>('draw', mock.draw),
    neighbor: graded<NeighborRequest, NeighborResponse>('neighbor', mock.neighbor),
    transfer: graded<TransferRequest, TransferResponse>('transfer', mock.transfer),
    status: () => call<LearnStatus>('GET', '/api/learn/status'),
  }
}

export const learnApi = createLearnApi()
