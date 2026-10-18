// Stage 4, Stress test: the learner's rule meets three extreme cases, in order.
// Each test stamps SURVIVES or BREAKS with one sentence. Two survives unlock the why question;
// three breaks trigger the reveal, tied to the learner's wrong turns. The rule is never shown before that.
import { useCallback, useState } from 'react'
import { offlineText, useGraded } from './useGraded'
import type {
  RevealRequest,
  StageProps,
  StressHistoryItem,
  StressRequest,
  StressResponse,
  WhyRequest,
} from './types'
import './learn-contrast-stress.css'

const SURVIVES_TO_WHY = 2
const BREAKS_TO_REVEAL = 3

/** Latest verdict per case (history and critiques are parallel arrays). */
function latestByCase(history: StressHistoryItem[], critiques: StressResponse[]) {
  const out = new Map<number, { item: StressHistoryItem; critique: StressResponse | undefined }>()
  history.forEach((item, i) => out.set(item.caseIndex, { item, critique: critiques[i] }))
  return out
}

/** The next case after `from` (wrapping) that hasn't survived yet. */
function nextOpen(from: number, count: number, history: StressHistoryItem[], critiques: StressResponse[]) {
  const latest = latestByCase(history, critiques)
  for (let k = 1; k <= count; k++) {
    const i = (from + k) % count
    if (latest.get(i)?.item.verdict !== 'survives') return i
  }
  return from
}

export function StressScreen({ topic, state, update, next, api }: StageProps) {
  const cases = topic.extremeCases.slice(0, 3)
  const history = state.stressHistory
  const critiques = state.stressCritiques
  const survives = history.filter((h) => h.verdict === 'survives').length
  const breaks = history.filter((h) => h.verdict === 'breaks').length
  const latest = latestByCase(history, critiques)

  const [active, setActive] = useState(() => {
    const last = history[history.length - 1]
    if (!last) return 0
    return last.verdict === 'breaks' ? last.caseIndex : nextOpen(last.caseIndex, cases.length, history, critiques)
  })
  const [draft, setDraft] = useState(state.fix)
  const [whyAnswer, setWhyAnswer] = useState('')
  const [whyTries, setWhyTries] = useState(state.whyResult ? 1 : 0)

  const slug = topic.slug
  const stress = useGraded(useCallback((b: StressRequest) => api.stress(slug, b), [api, slug]))
  const why = useGraded(useCallback((b: WhyRequest) => api.why(slug, b), [api, slug]))
  const reveal = useGraded(useCallback((b: RevealRequest) => api.reveal(slug, b), [api, slug]))
  const busy = stress.busy || why.busy || reveal.busy
  const offline = stress.offline ?? why.offline ?? reveal.offline

  const revealing = breaks >= BREAKS_TO_REVEAL
  const whyOpen = !revealing && survives >= SURVIVES_TO_WHY
  const testing = !revealing && !whyOpen
  const activeBroke = latest.get(active)?.item.verdict === 'breaks'

  async function runReveal(h: StressHistoryItem[]) {
    const r = await reveal.run({ history: h })
    if (r) update({ revealResult: r })
  }

  async function test() {
    const fix = draft.trim()
    if (!fix || busy) return
    const r = await stress.run({ fix, caseIndex: active, history })
    if (!r) return
    const h = [...history, { caseIndex: active, fix, verdict: r.verdict }]
    const c = [...critiques, r]
    update({ fix, stressHistory: h, stressCritiques: c })
    if (r.verdict === 'survives') setActive(nextOpen(active, cases.length, h, c))
    if (h.filter((x) => x.verdict === 'breaks').length >= BREAKS_TO_REVEAL) await runReveal(h)
  }

  async function checkWhy() {
    const answer = whyAnswer.trim()
    if (!answer || busy) return
    const r = await why.run({ answer })
    if (!r) return
    update({ whyResult: r })
    setWhyTries((n) => n + 1)
    setWhyAnswer('')
  }

  const wr = state.whyResult
  const rr = state.revealResult
  const whyFollowUp = wr && wr.verdict !== 'demonstrated' && wr.followUpQuestion && whyTries < 2 ? wr.followUpQuestion : null
  const whyQuestion = whyFollowUp ?? (wr ? null : topic.rubric.whyRuleQuestion)

  return (
    <section className="learn-step lcs" aria-label="stress">
      <p className="learn-instruction">
        {testing ? 'Test your rule on three extreme cases, one at a time.' : whyOpen ? 'Your rule held. Now say why.' : 'Here is where your rule broke.'}
      </p>

      <ol className="lcs-cases">
        {cases.map((c, i) => {
          const l = latest.get(i)
          const isActive = testing && i === active
          return (
            <li key={i} className={`lcs-case${isActive ? ' is-active' : ''}`} aria-current={isActive ? 'step' : undefined}>
              <p className="lcs-case-n">Case {i + 1}</p>
              <p className="lcs-scenario">{c.scenario}</p>
              {l && (
                <div className={`lcs-verdict is-${l.item.verdict}`}>
                  <span className="lcs-stamp">{l.item.verdict === 'survives' ? 'SURVIVES' : 'BREAKS'}</span>
                  <p className="lcs-quote">Your rule: “{l.item.fix}”</p>
                  {l.critique?.critique && <p className="lcs-critique">{l.critique.critique}</p>}
                  {l.critique?.offline && <p className="learn-offline">offline check</p>}
                </div>
              )}
            </li>
          )
        })}
      </ol>

      {testing && (
        <div className="lcs-test">
          <label className="lcs-label" htmlFor="lcs-rule">
            {activeBroke ? 'Fix your rule' : 'Your rule'}
          </label>
          <textarea
            id="lcs-rule"
            aria-label="stress answer"
            rows={2}
            placeholder="My rule is…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="lcs-row">
            <button onClick={test} disabled={busy || !draft.trim()}>
              {activeBroke ? `Try case ${active + 1} again` : `Test on case ${active + 1}`}
            </button>
            {activeBroke && cases.length > 1 && (
              <button className="lcs-quiet" onClick={() => setActive(nextOpen(active, cases.length, history, critiques))} disabled={busy}>
                Skip to another case
              </button>
            )}
          </div>
        </div>
      )}

      {whyOpen && (
        <div className="lcs-panel" aria-label="why question" role="group">
          {wr && (
            <div className={`lcs-why-result is-${wr.verdict}`}>
              <p className="lcs-why-verdict">{wr.verdict === 'demonstrated' ? 'You’ve got the why.' : 'Not quite yet.'}</p>
              <p>{wr.feedback}</p>
              {wr.offline && <p className="learn-offline">offline check</p>}
            </div>
          )}
          {whyQuestion && (
            <>
              <label className="lcs-label" htmlFor="lcs-why">
                {whyQuestion}
              </label>
              <textarea id="lcs-why" aria-label="why answer" rows={2} value={whyAnswer} onChange={(e) => setWhyAnswer(e.target.value)} />
              <button onClick={checkWhy} disabled={busy || !whyAnswer.trim()}>
                Check
              </button>
            </>
          )}
        </div>
      )}

      {revealing && rr && (
        <article className="lcs-panel lcs-reveal" aria-label="reveal">
          <h3>Where it broke</h3>
          <ul className="lcs-turns">
            {history
              .filter((h) => h.verdict === 'breaks')
              .map((h, i) => (
                <li key={i}>
                  <span className="lcs-turn-case">Case {h.caseIndex + 1}:</span> “{h.fix}”
                </li>
              ))}
          </ul>
          <h3>The rule</h3>
          <p className="lcs-rule">
            <mark>{rr.revealedRule}</mark>
          </p>
          <p>{rr.explanation}</p>
          {rr.confirmCase && <p className="lcs-confirm">Check it: {rr.confirmCase}</p>}
          {rr.offline && <p className="learn-offline">offline check</p>}
        </article>
      )}
      {revealing && !rr && !reveal.busy && (
        <button onClick={() => runReveal(history)}>Show me the rule</button>
      )}

      <div aria-live="polite">
        {busy && <p className="learn-thinking" role="status">thinking…</p>}
        {offline && !busy && <p className="learn-offline">{offlineText(offline)}. You can keep going.</p>}
      </div>

      <button onClick={next}>Next</button>
    </section>
  )
}
