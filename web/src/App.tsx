import { useMemo, useState } from 'react'
import { Predict, type Answer } from './components/Predict'
import { Reveal } from './components/Reveal'
import { showcaseRound, showcaseSlugs } from './rounds'
import { computeTruth, type Computed } from './truth'
import type { Round } from './types'
import { misconceptionFor } from './verdict'
import './App.css'

const BEAT_MS = 400

function Home({ onPick }: { onPick: (slug: string) => void }) {
  return (
    <div className="home sheet">
      <h1>Bet on your gut. Then watch reality.</h1>
      <p className="concept">Predict first, lock it in, and see exactly where your intuition breaks.</p>
      <div className="showcases">
        {showcaseSlugs.map((slug) => (
          <button key={slug} className="showcase" onClick={() => onPick(slug)}>
            {showcaseRound(slug)!.topic}
          </button>
        ))}
      </div>
    </div>
  )
}

type Phase = { kind: 'predict' } | { kind: 'locked'; answer: Answer } | { kind: 'revealed'; answer: Answer; truth: Computed }

function Player({ round, onDone }: { round: Round; onDone: () => void }) {
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState<Phase>({ kind: 'predict' })
  // How many answers this round pointed at each misconception (2+ = named on the card).
  const [signals, setSignals] = useState<Record<string, number>>({})
  const item = round.items[idx]
  const last = idx === round.items.length - 1

  const lock = (answer: Answer) => {
    setPhase({ kind: 'locked', answer })
    const mid = misconceptionFor(item, answer)
    if (mid) setSignals((s) => ({ ...s, [mid]: (s[mid] ?? 0) + 1 }))
    // The truth is only computed after lock-in. The beat hides the simulation time.
    setTimeout(() => setPhase({ kind: 'revealed', answer, truth: computeTruth(item) }), BEAT_MS)
  }

  const next = () => {
    if (last) return onDone()
    setIdx(idx + 1)
    setPhase({ kind: 'predict' })
  }

  return (
    <div className="sheet">
      <p className="progress">{round.topic} · {idx + 1} of {round.items.length}</p>
      {phase.kind === 'predict' && <Predict key={item.id} item={item} onLock={lock} />}
      {phase.kind !== 'predict' && (
        <span className="locked-stamp">
          locked: {phase.answer.value ?? item.options?.find((o) => o.id === phase.answer.optionId)?.text} · {phase.answer.confidence}
        </span>
      )}
      {phase.kind === 'revealed' && (
        <>
          <Reveal item={item} round={round} answer={phase.answer} truth={phase.truth} signals={signals} />
          <button className="next" onClick={next}>{last ? 'Done' : 'Next'}</button>
        </>
      )}
    </div>
  )
}

export default function App() {
  const [slug, setSlug] = useState<string | null>(() => new URLSearchParams(location.search).get('round'))
  const round = useMemo(() => (slug ? showcaseRound(slug) : undefined), [slug])
  return (
    <main className="app">
      <header className="topbar">
        <button className="logo" style={{ border: 0, background: 'none', padding: 0 }} onClick={() => setSlug(null)}>mm</button>
        {round && <span className={`chip ${round.reviewed ? 'reviewed' : ''}`}>{round.reviewed ? 'reviewed' : 'auto-checked'}</span>}
      </header>
      {round ? <Player key={round.slug} round={round} onDone={() => setSlug(null)} /> : <Home onPick={setSlug} />}
    </main>
  )
}
