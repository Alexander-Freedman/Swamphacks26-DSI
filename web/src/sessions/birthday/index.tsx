import { useCallback, useEffect, useRef, useState } from 'react'
import { NOTEBOOK_HREF, type Entry } from '../../notebook'
import type { SessionDef, SessionProps } from '../registry'
import { guideFor, TITLES } from './guide'
import { Room } from './Room'
import { pMatch } from './math'
import { verdictOf } from './round'
import { Card, Draw, Guess, Rematch, Reveal } from './Screens'
import { upsert } from './save'
import { Compare } from './Compare'
import type { CompareChoice } from './compareData'
import './birthday.css'

function Birthday({ onDone }: SessionProps) {
  const [step, setStep] = useState(1)
  const [guess, setGuess] = useState(100)
  const [matched, setMatched] = useState(false)
  const [curve, setCurve] = useState<number[] | null>(null)
  const [skipped, setSkipped] = useState(false)
  const [picked, setPicked] = useState<boolean | null>(null)
  const [compare, setCompare] = useState<CompareChoice | null>(null)
  const onMatchState = useCallback((m: boolean) => setMatched(m), [])
  // Saved once when the card first shows (#159); "Show me again" and the rematch reuse it.
  const saved = useRef<(Entry & Record<string, unknown>) | null>(null)
  useEffect(() => {
    if (step !== 6 || saved.current) return
    saved.current = { session: 'birthday', at: new Date().toISOString(), guess, misconception: verdictOf(guess).m?.id ?? null, rematch: null }
    upsert(saved.current)
  }, [step, guess])

  const go = (s: number) => {
    setStep(s)
    window.scrollTo({ top: 0 })
  }
  const shown = step === 2 && matched ? 3 : step
  const [title, sub] = guideFor(shown, guess)

  return (
    <div className="bday">
      <div className="bday-head">
        <span className="bday-chip">Birthday problem</span>
        <span className="bday-dots" aria-label={`step ${shown} of ${TITLES.length}`}>
          {TITLES.map((_, i) => (
            <i key={i} className={i < shown ? 'on' : ''} />
          ))}
        </span>
        <span className="bday-count">{shown} of {TITLES.length}</span>
      </div>
      <h2 className="bday-title">{title}</h2>
      <p className="bday-subtitle">{sub}</p>

      {step === 1 && (
        <Guess
          onLock={(g) => {
            setGuess(g)
            go(2)
          }}
        />
      )}
      {step === 2 && <Room guess={guess} onMatchState={onMatchState} onNext={() => go(4)} />}
      {step === 4 && (
        <Draw
          guess={guess}
          onDone={(c, sk) => {
            setCurve(c)
            setSkipped(sk)
            go(5)
          }}
        />
      )}
      {step === 5 && curve && <Reveal guess={guess} curve={curve} skipped={skipped} onNext={() => go(6)} />}
      {step === 6 && curve && <Card guess={guess} curve={curve} skipped={skipped} onAgain={() => go(5)} onNext={() => go(7)} />}
      {step === 7 && (
        <Compare
          onPick={(c) => {
            setCompare(c)
            if (!saved.current) return
            saved.current = { ...saved.current, compare: c }
            upsert(saved.current)
          }}
          onNext={() => go(8)}
        />
      )}
      {step === 8 && curve && (
        <>
          <Rematch
            curve={curve}
            skipped={skipped}
            picked={picked}
            onPick={(more) => {
              setPicked(more)
              if (!saved.current) return
              saved.current = { ...saved.current, ...(compare ? { compare } : {}), rematch: more === pMatch(30) > 0.5 ? 'right' : 'wrong' }
              upsert(saved.current)
            }}
          />
          {picked != null && (
            <div className="bday-saved">
              <p>
                <b>Saved to your notebook.</b> {verdictOf(guess).m ? <>Caught: “{verdictOf(guess).m!.label}”.</> : 'Your first guess was spot on.'}{' '}
                {picked === pMatch(30) > 0.5 ? 'Rematch: right.' : 'Rematch missed; it stays in your notebook to try again.'} Come back tomorrow for a remix: birth months, 12 instead of 365.
              </p>
              <a className="nb-link-inline" href={NOTEBOOK_HREF}>Open notebook</a>
              <button className="bday-btn" onClick={onDone}>Done</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export const session: SessionDef = {
  slug: 'birthday',
  title: 'The birthday problem',
  blurb: 'How many people until two share a birthday?',
  order: 1,
  Component: Birthday,
}
