// Stress test: the learner's one-line fix meets three extreme cases. Each card stamps SURVIVES or BREAKS.
// Two survives on different cases unlock the why question; three breaks bring the reveal, tied to their wrong turns.
import { useCallback, useEffect, useRef, useState } from 'react'
import type { RevealRequest, StageProps, StressRequest, WhyRequest } from '../types'
import { useGraded } from '../useGraded'
import { latestByCase, offlineLine } from './stress'
import './stress.css'

const BREAKS_FOR_REVEAL = 3
const SURVIVES_FOR_WHY = 2

export function StressScreen({ topic, state, update, next, api }: StageProps) {
  const cases = topic.extremeCases.slice(0, 3)
  const stressCall = useCallback((b: StressRequest) => api.stress(topic.slug, b), [api, topic.slug])
  const whyCall = useCallback((b: WhyRequest) => api.why(topic.slug, b), [api, topic.slug])
  const revealCall = useCallback((b: RevealRequest) => api.reveal(topic.slug, b), [api, topic.slug])
  const stress = useGraded(stressCall)
  const whyQ = useGraded(whyCall)
  const reveal = useGraded(revealCall)
  const [testing, setTesting] = useState<number | null>(null)
  const [editing, setEditing] = useState(!state.fix.trim())
  const [whyAnswer, setWhyAnswer] = useState('')

  const latest = latestByCase(state.stressHistory)
  const survived = [...latest.values()].filter((h) => h.verdict === 'survives').length
  const breaks = state.stressHistory.filter((h) => h.verdict === 'breaks').length
  const whyOpen = survived >= SURVIVES_FOR_WHY
  const revealDue = !whyOpen && breaks >= BREAKS_FOR_REVEAL
  const fix = state.fix.trim()
  const offlineGraded = state.stressCritiques.some((c) => c.offline) || state.whyResult?.offline || state.revealResult?.offline

  const test = async (i: number) => {
    if (!fix || testing !== null) return
    setTesting(i)
    setEditing(false)
    const r = await stress.run({ fix, caseIndex: i, history: state.stressHistory })
    setTesting(null)
    if (!r) return
    update({
      stressHistory: [...state.stressHistory, { caseIndex: i, fix, verdict: r.verdict }],
      stressCritiques: [...state.stressCritiques, r],
    })
  }

  // Three breaks: show the rule, tied to the cases their fix broke on (once).
  const runReveal = reveal.run
  const asked = useRef(false)
  useEffect(() => {
    if (!revealDue || state.revealResult || asked.current) return
    asked.current = true
    void runReveal({ history: state.stressHistory }).then((r) => r && update({ revealResult: r }))
  }, [revealDue, state.revealResult, state.stressHistory, runReveal, update])

  const askWhy = async () => {
    const r = whyAnswer.trim() ? await whyQ.run({ answer: whyAnswer.trim() }) : null
    if (r) update({ whyResult: r })
  }

  const offline = stress.offline ?? whyQ.offline ?? reveal.offline

  return (
    <section className="learn-step st" aria-label="stress">
      <h2 className="st-title">Stress test your fix.</h2>
      <p className="learn-instruction">Three extreme cases. Run your fix on each one and see if it holds up.</p>

      <div className="st-fix">
        <span className="st-fix-k">your fix</span>
        {editing ? (
          <>
            <input
              type="text"
              aria-label="your fix"
              value={state.fix}
              placeholder="one line: what decides the outcome?"
              onChange={(e) => update({ fix: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && fix && setEditing(false)}
            />
            <button className="st-small" disabled={!fix} onClick={() => setEditing(false)}>Use it</button>
          </>
        ) : (
          <>
            <span className="st-fix-text">“{state.fix}”</span>
            <button className="st-small" onClick={() => setEditing(true)} disabled={testing !== null}>Revise</button>
          </>
        )}
      </div>

      <ol className="st-cases">
        {cases.map((c, i) => {
          const h = latest.get(i)
          const critique = h ? state.stressCritiques[state.stressHistory.lastIndexOf(h)]?.critique : null
          const stale = h && h.fix !== fix // the fix changed since this card was tested
          return (
            <li key={i} className={'st-card' + (h ? ` st-${h.verdict}` : '')} aria-label={`case ${i + 1}`}>
              <p className="st-scenario">{c.scenario}</p>
              {testing === i ? (
                <p className="learn-thinking" role="status">thinking…</p>
              ) : h ? (
                <>
                  <span className={`st-stamp st-stamp-${h.verdict}`}>{h.verdict === 'survives' ? 'survives' : 'breaks'}</span>
                  {critique && <p className="st-critique">{critique}</p>}
                  {h.verdict === 'breaks' && !revealDue && (
                    <button className="st-small" disabled={!fix || testing !== null || !stale} onClick={() => test(i)}>
                      {stale ? 'Retry with the new fix' : 'Revise your fix, then retry'}
                    </button>
                  )}
                </>
              ) : (
                <button className="st-go" disabled={!fix || testing !== null || editing} onClick={() => test(i)}>Test it</button>
              )}
            </li>
          )
        })}
      </ol>

      {whyOpen && (
        <div className="st-after">
          <p className="st-after-k">It held up twice. Now say why.</p>
          <p className="st-q">{topic.rubric.whyRuleQuestion}</p>
          <textarea aria-label="why answer" rows={2} value={whyAnswer} onChange={(e) => setWhyAnswer(e.target.value)} />
          <button className="st-small" disabled={!whyAnswer.trim() || whyQ.busy} onClick={askWhy}>Check it</button>
          {whyQ.busy && <p className="learn-thinking" role="status">thinking…</p>}
          {state.whyResult && (
            <div className={'st-result st-' + state.whyResult.verdict}>
              <span className={`st-stamp st-stamp-${state.whyResult.verdict === 'demonstrated' ? 'survives' : 'open'}`}>
                {state.whyResult.verdict === 'demonstrated' ? 'got it' : 'not yet'}
              </span>
              <p>{state.whyResult.feedback}</p>
              {state.whyResult.followUpQuestion && <p className="st-q">{state.whyResult.followUpQuestion}</p>}
            </div>
          )}
        </div>
      )}

      {revealDue && (
        <div className="st-after st-reveal">
          <p className="st-after-k">Three breaks. Here's what was missing.</p>
          {reveal.busy && <p className="learn-thinking" role="status">thinking…</p>}
          {state.revealResult && (
            <>
              <p className="st-rule">{state.revealResult.revealedRule}</p>
              <p>{state.revealResult.explanation}</p>
              {state.revealResult.confirmCase && (
                <p className="st-confirm">
                  <span className="st-after-k">check it on the case you broke:</span> {state.revealResult.confirmCase}
                </p>
              )}
            </>
          )}
        </div>
      )}

      {offline && <p className="learn-offline" role="status">{offlineLine(offline)}</p>}
      {!offline && offlineGraded && <p className="learn-offline">Checked against the topic's notes (the live checker is busy or offline).</p>}
      <button className="st-next" onClick={next}>Next</button>
    </section>
  )
}
