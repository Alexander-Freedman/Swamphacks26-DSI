// Mirrors shared/schema/round.schema.json (generated from api/app/schema.py).
export type InputType = 'slider' | 'choice' | 'sketch' | 'order'
export type Sampler = 'coin_longest_run' | 'base_rate_test' | 'birthday_match' | 'binomial_count' | 'dice_sum'

export type Misconception = {
  id: string
  label: string
  why_tempting: string
  refutation: string
  source_url: string | null
  source_note: string
}

export type SamplerParams = {
  n?: number | null
  p?: number | null
  population?: number | null
  base_rate?: number | null
  sensitivity?: number | null
  false_positive_rate?: number | null
  group_size?: number | null
  dice?: number | null
  trials?: number | null
}

export type DistributionTruth = { widget: 'distribution'; sampler: Sampler; params: SamplerParams; x_label: string }
export type CurveTruth = {
  widget: 'curve'
  expr?: string | null
  preset?: 'birthday_match_probability' | null
  x_min: number
  x_max: number
  x_label: string
  y_label: string
  // The spot the question asks about: the y at ask_x, or the x where the curve reaches ask_y.
  ask_x?: number | null
  ask_y?: number | null
}
export type EstimateTruth = { widget: 'estimate'; unit?: string; source_url?: string | null }
export type StepperTruth = { widget: 'stepper'; steps: string[]; source_url?: string | null }
export type Truth = DistributionTruth | CurveTruth | EstimateTruth | StepperTruth

export type Band = { min: number; max: number; misconception_id: string | null }
export type Option = { id: string; text: string; misconception_id: string | null }

export type Item = {
  id: string
  prompt: string
  input_type: InputType
  slider?: { min: number; max: number; step: number; unit: string } | null
  options?: Option[]
  bands?: Band[]
  truth: Truth
  // The true value as an expression (numbers only); the reveal shows this, computed here.
  answer_expr?: string | null
  answer_claimed?: number | null
  // default: the knob's value in the question as asked; curve exprs may use param next to x.
  explore?: { param: string; label: string; min: number; max: number; step: number; default?: number | null } | null
  targets?: string[]
}

export type Round = {
  schema_version: number
  slug: string
  topic: string
  concept: string
  reviewed: boolean
  misconceptions: Misconception[]
  items: Item[]
}

export type Confidence = 'guessing' | 'pretty sure' | 'certain'

// POST /api/rounds `checks` (shared/schema/README.md): what the generator's checks did. null for
// hand-checked rounds and for rounds cached before reports were stored.
export type ChecksReport = {
  kept: number
  dropped: { item_id: string; reason: string }[]
  blind_checked: boolean
  blind_ok: number
  blind_failed: number
  unchecked: string[]
  model: string
  seconds: number
}
