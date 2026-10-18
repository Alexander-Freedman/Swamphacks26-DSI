// Stage 3, Contrast: two pre-authored cases side by side, the one difference highlighted.
// The learner writes a one-line "fix" for why they turn out differently. No model call.
import { CaseCurve } from './contrast-visual/CaseCurve'
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

export function ContrastScreen({ topic, state, update, next }: StageProps) {
  const cases = topic.rubric.contrastingCases.slice(0, 2)
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
      <label className="lcs-label" htmlFor="lcs-fix">
        Your rule, in one line
      </label>
      <textarea
        id="lcs-fix"
        aria-label="contrast answer"
        rows={2}
        placeholder="They differ because…"
        value={state.fix}
        onChange={(e) => update({ fix: e.target.value })}
      />
      <button onClick={next}>Next</button>
    </section>
  )
}
