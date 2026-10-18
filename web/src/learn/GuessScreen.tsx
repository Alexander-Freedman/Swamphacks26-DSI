// Stage 1, guess: a one-line pencil guess before seeing anything, plus how sure you are.
// The check classifies the guess and may spot a known wrong idea; only its label shows here (the fix comes at the end).
import { useCallback, useState } from 'react'
import type { GuessRequest, StageProps } from './types'
import { useGraded } from './useGraded'
import { offlineLine } from './learn-guess-anchor'
import './learn-guess-anchor.css'

export function GuessScreen({ topic, state, update, next, api }: StageProps) {
  const call = useCallback((b: GuessRequest) => api.guess(topic.slug, b), [api, topic.slug])
  const { run, busy, offline } = useGraded(call)
  const [done, setDone] = useState(state.guessResult !== null)
  const r = state.guessResult
  const tag = r?.misconceptionId ? topic.misconceptions.find((m) => m.id === r.misconceptionId) : undefined
  const text = state.guess.trim()

  const submit = async () => {
    if (!text || busy) return
    const res = await run({ text })
    update(res ? { guessResult: res, misconceptionId: res.misconceptionId } : { guessResult: null, misconceptionId: null })
    setDone(true)
  }

  return (
    <section className="learn-step lga" aria-label="guess">
      <p className="learn-instruction">Guess first. No looking anything up.</p>
      <label className="lga-q" htmlFor="lga-guess">What do you think makes {topic.topic} work?</label>
      <textarea
        id="lga-guess"
        className="lga-pencil"
        aria-label="guess answer"
        rows={2}
        maxLength={240}
        placeholder="one line, your own words"
        value={state.guess}
        readOnly={done}
        onChange={(e) => update({ guess: e.target.value })}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            void submit()
          }
        }}
      />
      <div className="lga-sure">
        <label htmlFor="lga-conf">how sure</label>
        <span aria-hidden="true">not at all</span>
        <input
          id="lga-conf"
          type="range"
          min={0}
          max={100}
          step={5}
          value={state.confidence}
          disabled={done}
          aria-valuetext={`${state.confidence} out of 100`}
          onChange={(e) => update({ confidence: Number(e.target.value) })}
        />
        <span aria-hidden="true">very</span>
      </div>

      {busy && <p className="learn-thinking" role="status">thinking…</p>}
      {done && offline && <p className="learn-offline" role="status">{offlineLine(offline, 'Your guess is saved; keep going.')}</p>}
      {done && r && (
        <div className="lga-result" role="status">
          <p className="lga-line">{r.message}</p>
          {tag && <p className="lga-tag">sounds like: {tag.label}</p>}
          {r.offline && <p className="learn-offline">offline check</p>}
        </div>
      )}

      {done ? (
        <button onClick={next}>Next</button>
      ) : (
        <button onClick={submit} disabled={busy || !text}>Submit</button>
      )}
    </section>
  )
}
