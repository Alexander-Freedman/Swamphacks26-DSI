import { useCallback, useState } from 'react'
import type { SessionDef, SessionProps } from '../registry'
import { Room } from './Room'
import { verdictOf } from './round'
import { Card, Draw, Guess, Rematch, Reveal, type Confidence } from './Screens'
import './birthday.css'

const TITLES: [string, string][] = [
  ['How many people?', "Guess first: how many people until it's a coin flip that two share a birthday? Your guess stays on screen so you can check it later."],
  ['Fill a room', 'Add people one by one and watch the lines: each line is a pair that could share a birthday. Notice how fast pairs pile up.'],
  ['The match', 'A match! Keep adding to watch matches pile up, or empty the room and try again: how many people does it usually take?'],
  ['Draw your curve', "Draw how you think the chance grows as the room fills, from 2 to 80 people. There's no wrong drawing; it's your model."],
  ['Your curve vs the real one', "Here's the real curve over yours. Drag the group size to see where your model and reality part."],
  ['What happened in your head', 'This is the mistake your guess points to, and the one idea that fixes it.'],
  ['Rematch', 'One more, with new numbers: does the idea stick?'],
]

function save(entry: object) {
  try {
    const key = 'mm.sessions'
    const all = JSON.parse(localStorage.getItem(key) ?? '[]') as object[]
    localStorage.setItem(key, JSON.stringify([...all, entry].slice(-50)))
  } catch {
    // private mode or blocked storage: the session still ends fine
  }
}

function Birthday({ onDone }: SessionProps) {
  const [step, setStep] = useState(1)
  const [guess, setGuess] = useState(100)
  const [conf, setConf] = useState<Confidence>('pretty sure')
  const [matched, setMatched] = useState(false)
  const [curve, setCurve] = useState<number[] | null>(null)
  const [skipped, setSkipped] = useState(false)
  const [picked, setPicked] = useState<boolean | null>(null)
  const onMatchState = useCallback((m: boolean) => setMatched(m), [])

  const go = (s: number) => {
    setStep(s)
    window.scrollTo({ top: 0 })
  }
  const shown = step === 2 && matched ? 3 : step
  const [title, sub] = TITLES[shown - 1]

  return (
    <div className="bday">
      <div className="bday-head">
        <span className="bday-chip">Birthday problem</span>
        <span className="bday-dots" aria-label={`step ${shown} of 7`}>
          {TITLES.map((_, i) => (
            <i key={i} className={i < shown ? 'on' : ''} />
          ))}
        </span>
        <span className="bday-count">{shown} of 7</span>
      </div>
      <h2 className="bday-title">{title}</h2>
      <p className="bday-subtitle">{sub}</p>

      {step === 1 && (
        <Guess
          onLock={(g, c) => {
            setGuess(g)
            setConf(c)
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
      {step === 6 && curve && <Card guess={guess} conf={conf} curve={curve} skipped={skipped} onAgain={() => go(5)} onNext={() => go(7)} />}
      {step === 7 && curve && (
        <>
          <Rematch
            curve={curve}
            skipped={skipped}
            picked={picked}
            onPick={(more) => {
              setPicked(more)
              save({ session: 'birthday', at: new Date().toISOString(), guess, confidence: conf, misconception: verdictOf(guess).m?.id ?? null, rematch: more ? 'right' : 'wrong' })
            }}
          />
          {picked != null && (
            <div className="bday-saved">
              <p>
                <b>Saved.</b> {verdictOf(guess).m ? <>Caught: “{verdictOf(guess).m!.label}”.</> : 'Called it.'} Come back tomorrow for a remix: birth months, 12 instead of 365.
              </p>
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
