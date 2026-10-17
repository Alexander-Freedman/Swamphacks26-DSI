import { useCallback, useState } from 'react'
import { NOTEBOOK_HREF, record } from '../../notebook'
import type { SessionDef, SessionProps } from '../registry'
import { Room } from './Room'
import { pMatch } from './math'
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
              record({ session: 'birthday', at: new Date().toISOString(), guess, confidence: conf, misconception: verdictOf(guess).m?.id ?? null, rematch: more ? 'right' : 'wrong' })
            }}
          />
          {picked != null && (
            <div className="bday-saved">
              <p>
                <b>Saved to your notebook.</b> {verdictOf(guess).m ? <>Caught: “{verdictOf(guess).m!.label}”.</> : 'Your first guess called it.'}{' '}
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
