// Stress test, predict then check: each extreme case asks "what happens here?" with three choices.
// After the truth shows, the checker says whether the learner's rule already covered that case;
// if not, it names the one missing piece, and a tap adds it to the rule. The rule grows card by card.
// Cards open in order; after all three, the learner says why the rule works.
import { useCallback, useMemo, useState } from 'react'
import { Curve } from '../../components/Curve'
import type { StageProps, StressRequest, WhyRequest } from '../types'
import { recordLearnEvent, roomLine, type Room } from '../learnEvents'
import { useGraded } from '../useGraded'
import { extremeCurve } from './extremes'
import { latestByCase, offlineLine, withPiece } from './stress'
import './stress.css'

export function StressScreen({ topic, state, update, next, api }: StageProps) {
  const cases = topic.extremeCases.slice(0, 3)
  // a curve topic: each card gets its curve pushed to that card's extreme (computed in code)
  const pictures = useMemo(() => topic.extremeCases.slice(0, 3).map((_, i) => extremeCurve(topic, i)), [topic])
  const stressCall = useCallback((b: StressRequest) => api.stress(topic.slug, b), [api, topic.slug])
  const whyCall = useCallback((b: WhyRequest) => api.why(topic.slug, b), [api, topic.slug])
  const stress = useGraded(stressCall)
  const whyQ = useGraded(whyCall)
  const [checking, setChecking] = useState<number | null>(null)
  const [editing, setEditing] = useState(!state.fix.trim())
  const [whyAnswer, setWhyAnswer] = useState('')

  const latest = latestByCase(state.stressHistory)
  const fix = state.fix.trim()
  const allChecked = cases.every((_, i) => latest.has(i))
  const offlineGraded = state.stressCritiques.some((c) => c.offline) || state.whyResult?.offline

  const check = async (i: number) => {
    if (!fix || checking !== null) return
    setChecking(i)
    setEditing(false)
    const r = await stress.run({ fix, caseIndex: i, history: state.stressHistory })
    setChecking(null)
    if (!r) return
    update({
      stressHistory: [...state.stressHistory, { caseIndex: i, fix, verdict: r.verdict }],
      stressCritiques: [...state.stressCritiques, r],
    })
  }

  // how everyone else predicted each card (Tiger Data continuous aggregate), once this learner has picked
  const [rooms, setRooms] = useState<Record<number, Room | null>>({})
  const pick = (i: number, k: number) => {
    if (state.stressChoices[i] != null) return
    update({ stressChoices: { ...state.stressChoices, [i]: k } })
    void recordLearnEvent({ slug: topic.slug, step: 'stress', caseIndex: i, choice: k }).then((room) =>
      setRooms((r) => ({ ...r, [i]: room })),
    )
    void check(i)
  }

  const added = (piece: string) => state.fix.includes(piece)
  const addPiece = (piece: string) => !added(piece) && update({ fix: withPiece(state.fix, piece) })

  const askWhy = async () => {
    const r = whyAnswer.trim() ? await whyQ.run({ answer: whyAnswer.trim() }) : null
    if (r) update({ whyResult: r })
  }

  const offline = stress.offline ?? whyQ.offline

  return (
    <section className="learn-step st" aria-label="stress">
      <h2 className="st-title">Push your rule to the extremes.</h2>
      <p className="learn-instruction">Three extreme cases. Predict what happens, then see if your rule saw it coming.</p>

      <div className="st-fix">
        <span className="st-fix-k">your rule</span>
        {editing ? (
          <>
            <textarea
              aria-label="your fix"
              rows={3}
              value={state.fix}
              placeholder="When ___ changes, ___ happens, because ___."
              onChange={(e) => update({ fix: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && fix) {
                  e.preventDefault()
                  setEditing(false)
                }
              }}
            />
            <button className="st-small" disabled={!fix} onClick={() => setEditing(false)}>
              Use it
            </button>
          </>
        ) : (
          <>
            <span className="st-fix-text">“{state.fix}”</span>
            <button className="st-small" onClick={() => setEditing(true)} disabled={checking !== null}>
              Edit
            </button>
          </>
        )}
      </div>

      <ol className="st-cases">
        {cases.map((c, i) => {
          const open = i === 0 || latest.has(i - 1)
          const h = latest.get(i)
          const result = h ? state.stressCritiques[state.stressHistory.lastIndexOf(h)] : null
          const choice = state.stressChoices[i]
          const picked = choice != null && c.predict ? c.predict.choices[choice] : null
          return (
            <li key={i} className={'st-card' + (h ? ` st-${h.verdict}` : '') + (open ? '' : ' is-locked')} aria-label={`case ${i + 1}`}>
              <p className="st-num">Extreme {i + 1} of {cases.length}</p>
              <p className="st-scenario">{c.scenario}</p>
              {pictures[i] && (
                <figure className="st-pic">
                  <Curve small t={pictures[i]!.spec.curve} f={pictures[i]!.f} />
                  <figcaption>
                    <span className="st-pic-at">{pictures[i]!.at}</span>
                    {pictures[i]!.watch && <span className="st-pic-watch">{pictures[i]!.watch}</span>}
                  </figcaption>
                </figure>
              )}
              {open && c.predict && (
                <>
                  <p className="st-q">{c.predict.question}</p>
                  <div className="st-choices" role="group" aria-label={`case ${i + 1} choices`}>
                    {c.predict.choices.map((ch, k) => (
                      <button
                        key={k}
                        className={
                          'st-choice' +
                          (choice === k ? (ch.correct ? ' is-right' : ' is-wrong') : '') +
                          (choice != null && ch.correct ? ' is-answer' : '')
                        }
                        disabled={choice != null || !fix}
                        onClick={() => pick(i, k)}
                      >
                        {ch.text}
                      </button>
                    ))}
                  </div>
                  {picked && (
                    <p className={'st-truth' + (picked.correct ? ' ok' : ' no')}>
                      <strong>{picked.correct ? 'Right.' : 'Not quite.'}</strong> {c.correctBehavior}
                    </p>
                  )}
                  {picked && roomLine(rooms[i]) && <p className="st-room">{roomLine(rooms[i])}</p>}
                </>
              )}
              {open && !c.predict && !h && checking !== i && (
                <button className="st-go" disabled={!fix || checking !== null || editing} onClick={() => check(i)}>
                  Test my rule
                </button>
              )}
              {checking === i && (
                <p className="learn-thinking" role="status">
                  checking your rule…
                </p>
              )}
              {h && checking !== i && (
                <div className={'st-check st-check-' + h.verdict}>
                  {h.verdict === 'survives' ? (
                    <p>
                      <strong>✓ Your rule covered this.</strong>
                    </p>
                  ) : (
                    <>
                      <p>
                        <strong>Your rule didn't cover this.</strong> {result?.critique}
                      </p>
                      {result?.piece && (
                        <button className="st-piece" disabled={added(result.piece)} onClick={() => addPiece(result.piece!)}>
                          {added(result.piece) ? '✓ added to your rule: ' : '+ add to your rule: '}
                          {result.piece}
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ol>

      {allChecked && (
        <div className="st-after">
          <p className="st-after-k">Your rule now</p>
          <p className="st-rule">“{state.fix}”</p>
          <p className="st-q">{topic.rubric.whyRuleQuestion}</p>
          <textarea aria-label="why answer" rows={2} value={whyAnswer} onChange={(e) => setWhyAnswer(e.target.value)} />
          <button className="st-small" disabled={!whyAnswer.trim() || whyQ.busy} onClick={askWhy}>
            Check it
          </button>
          {whyQ.busy && (
            <p className="learn-thinking" role="status">
              thinking…
            </p>
          )}
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

      {offline && (
        <p className="learn-offline" role="status">
          {offlineLine(offline)}
        </p>
      )}
      {!offline && offlineGraded && <p className="learn-offline">Checked against the topic's notes (the live checker is busy or offline).</p>}
      <button className="st-next" onClick={next}>
        Next
      </button>
    </section>
  )
}
