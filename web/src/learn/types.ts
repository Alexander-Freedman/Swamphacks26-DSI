// Learn session types, exactly per docs/learn-api.md.

export type ContrastingCase = { label: string; detail: string; oneLine: string }
export type ExtremeCaseDimension = { key: string; description: string }
export type ConfusableNeighbor = { key: string; label: string; question: string; correctDistinction: string }

export type Rubric = {
  entities: string[]
  causalLinks: string[]
  coreRule: string
  whyRuleMatters: string
  whyRuleQuestion: string
  /** ONE true fact, not the rule. */
  anchorDescription: string
  /** The prediction question. */
  anchorPrompt: string
  contrastingCases: ContrastingCase[]
  extremeCaseDimensions: ExtremeCaseDimension[]
  confusableNeighbors: ConfusableNeighbor[]
  transferStructuralRequirements: string[]
  referenceTransferExample: string
}

export type Misconception = { id: string; label: string; tell: string; fix: string }
export type ExtremeCase = { dimension: string; scenario: string; correctBehavior: string }

export type Visual = { widget: 'curve' | 'distribution' | 'estimate' | 'stepper'; spec: unknown } | null

export type Topic = {
  slug: string
  topic: string
  /** true = hand-reviewed prebuilt; false = authored live ("auto-checked"). */
  checked: boolean
  rubric: Rubric
  misconceptions: Misconception[]
  extremeCases: ExtremeCase[]
  visual: Visual
}

export type TopicSummary = { slug: string; topic: string; checked: boolean }

// Every graded response may carry `offline: true` when it came from the pre-authored fallback.
type Off = { offline?: boolean }

export type GuessRequest = { text: string }
export type GuessResponse = Off & {
  classification: 'concrete' | 'vague' | 'tangled'
  misconceptionId: string | null
  message: string
}

export type AnchorRequest = { answer: string }
export type AnchorResponse = Off & { verdict: 'demonstrated' | 'unresolved'; feedback: string; followUpQuestion: string | null }

export type StressHistoryItem = { caseIndex: number; fix: string; verdict: 'survives' | 'breaks' }
export type StressRequest = { fix: string; caseIndex: number; history: StressHistoryItem[] }
export type StressResponse = Off & { verdict: 'survives' | 'breaks'; critique: string }

export type WhyRequest = { answer: string }
export type WhyResponse = AnchorResponse

export type RevealRequest = { history: StressHistoryItem[] }
export type RevealResponse = Off & { explanation: string; revealedRule: string; confirmCase: string }

export type DrawCriterionId = 'entities' | 'links' | 'rule' | 'why-rule'
export type DrawRequest = { rule: string; notes: string; image: string | null }
export type DrawCriterion = { id: DrawCriterionId; verdict: 'demonstrated' | 'contradicted' | 'unresolved'; note: string }
export type DrawResponse = Off & { criteria: DrawCriterion[]; followUpQuestion: string | null }

export type NeighborRequest = { key: string; answer: string; priorAnswer: string | null }
export type NeighborResponse = Off & { verdict: 'correct' | 'partial' | 'incorrect'; feedback: string; followUpQuestion: string | null }

export type TransferRequest = { analogy: string; wasPushed: boolean }
export type TransferResponse = Off & {
  verdict: 'maps' | 'partial' | 'too-abstract' | 'fails'
  critique: string
  missingPiece: string | null
}

export type LearnStatus = { codex: 'ok' | 'missing' | 'unauthenticated'; inFlight: number; topics: number }

export type Stage = 'guess' | 'anchor' | 'contrast' | 'stress' | 'draw' | 'neighbor' | 'transfer' | 'done'
export const STAGES: Stage[] = ['guess', 'anchor', 'contrast', 'stress', 'draw', 'neighbor', 'transfer', 'done']

/** Notebook entry for a Learn session (docs/learn-api.md, "Frontend state"). */
export type LearnNotebookEntry = {
  session: 'learn'
  slug: string
  at: string
  guess: string
  misconception: string | null
  stressRounds: StressHistoryItem[]
  drawVerdicts: DrawCriterion[]
  transferVerdict: TransferResponse['verdict'] | null
}

/** Offline: the backend is down (503 codex_unavailable) or unreachable. Screens show "thinking is offline". */
export type Offline = { offline: true; reason: 'codex_unavailable' | 'network' | 'no_backend'; detail?: string }
export type Result<T> = T | Offline
export const isOffline = (r: unknown): r is Offline =>
  typeof r === 'object' && r !== null && (r as Offline).offline === true && 'reason' in r

/** Everything a screen needs from the backend. `learnApi` and `mockLearnApi` both implement it. */
export interface LearnApi {
  listTopics(): Promise<TopicSummary[]>
  getTopic(slug: string): Promise<Topic | null>
  createTopic(topic: string): Promise<Result<Topic>>
  guess(slug: string, body: GuessRequest): Promise<Result<GuessResponse>>
  anchor(slug: string, body: AnchorRequest): Promise<Result<AnchorResponse>>
  stress(slug: string, body: StressRequest): Promise<Result<StressResponse>>
  why(slug: string, body: WhyRequest): Promise<Result<WhyResponse>>
  reveal(slug: string, body: RevealRequest): Promise<Result<RevealResponse>>
  draw(slug: string, body: DrawRequest): Promise<Result<DrawResponse>>
  neighbor(slug: string, body: NeighborRequest): Promise<Result<NeighborResponse>>
  transfer(slug: string, body: TransferRequest): Promise<Result<TransferResponse>>
  status(): Promise<Result<LearnStatus>>
}

/** Session state held by LearnSession and passed to every screen. */
export type LearnState = {
  stage: Stage
  guess: string
  confidence: number
  guessResult: GuessResponse | null
  misconceptionId: string | null
  anchorAnswer: string
  anchorResult: AnchorResponse | null
  fix: string
  stressHistory: StressHistoryItem[]
  stressCritiques: StressResponse[]
  whyResult: WhyResponse | null
  revealResult: RevealResponse | null
  drawRule: string
  drawNotes: string
  drawVerdicts: DrawCriterion[]
  neighborAnswer: string
  neighborResult: NeighborResponse | null
  transferAnalogy: string
  transferResult: TransferResponse | null
}

export type StageProps = {
  topic: Topic
  state: LearnState
  update: (partial: Partial<LearnState>) => void
  next: () => void
  api: LearnApi
}
