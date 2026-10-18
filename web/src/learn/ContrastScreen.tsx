// Stage 3, Contrast: two pre-authored cases side by side, the one difference highlighted.
// The learner writes a one-line "fix" for why they turn out differently. No model call.
import { useRef, useState } from 'react'
import { CaseCurve } from './contrast-visual/CaseCurve'
import { composeRule, shortPiece, splitRule } from './rule'
import type { StageProps } from './types'
import './learn-contrast.css'

/** A case's long text as short lines: one sentence each. */
export const lines = (text: string): string[] =>
  text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9$“"])/)
    .map((l) => l.trim())
    .filter(Boolean)

/** Numbers (with $, %, units glued on) in bold, so a skim finds them. */
function boldNumbers(line: string) {
  return line.split(/(\$?\d[\d,.]*%?)/).map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part))
}

const FRAME = [
  { word: 'When', hint: 'what changes?' },
  { word: 'then', hint: 'what happens?' },
  { word: 'because', hint: 'why does it happen?' },
] as const

export function ContrastScreen({ topic, state, update, next }: StageProps) {
  const cases = topic.rubric.contrastingCases.slice(0, 2)
  const [parts, setParts] = useState<[string, string, string]>(() => splitRule(state.fix))
  const [focus, setFocus] = useState(0)
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  const chips = [...new Set(topic.rubric.entities.map(shortPiece))].filter(Boolean).slice(0, 8)
  const set = (k: number, v: string) => {
    const p = [...parts] as [string, string, string]
    p[k] = v
    setParts(p)
    update({ fix: composeRule(p) })
  }
  return (
    <section className="learn-step lcs" aria-label="contrast">
      <p className="learn-instruction">Two cases, one difference. Why do they turn out differently?</p>
      <div className="lcs-pair">
        {cases.map((c, i) => (
          <article key={i} className="lcs-card" aria-label={`case ${i + 1}: ${c.label}`}>
            <h3 className="lcs-card-label">{c.label}</h3>
            <p className="lcs-diff">
              <mark>{c.oneLine}</mark>
            </p>
            <CaseCurve topic={topic} index={i} />
            <details className="lcs-more">
              <summary>Show the numbers</summary>
              <ul className="lcs-detail">
                {lines(c.detail).map((l, j) => (
                  <li key={j}>{boldNumbers(l)}</li>
                ))}
              </ul>
            </details>
          </article>
        ))}
      </div>
      <p className="lcs-label">Your rule: what makes them turn out differently?</p>
      <div className="lcs-frame">
        {FRAME.map((f, k) => (
          <label key={f.word} className="lcs-slot">
            <span className="lcs-word">{f.word}</span>
            <input
              type="text"
              aria-label={`rule ${f.word}`}
              placeholder={f.hint}
              value={parts[k]}
              ref={(el) => {
                inputs.current[k] = el
              }}
              onFocus={() => setFocus(k)}
              onChange={(e) => set(k, e.target.value)}
            />
          </label>
        ))}
      </div>
      <div className="lcs-chips" role="group" aria-label="pieces you can use">
        {chips.map((c) => (
          <button
            key={c}
            type="button"
            className="lcs-chip"
            onClick={() => {
              set(focus, parts[focus] ? `${parts[focus]} ${c}` : c)
              // back into the blank, so typing (even a space) carries on there instead of pressing the chip again
              const el = inputs.current[focus]
              el?.focus()
              requestAnimationFrame(() => el?.setSelectionRange(el.value.length, el.value.length))
            }}
          >
            {c}
          </button>
        ))}
      </div>
      {state.fix && <p className="lcs-preview">“{state.fix}”</p>}
      <button onClick={next}>Next</button>
    </section>
  )
}
