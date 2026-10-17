import { useMemo, useState } from 'react'
import { Distribution } from './components/Distribution'
import { Predict, type Answer } from './components/Predict'
import { showcaseRound, showcaseSlugs } from './rounds'
import { simulate, shareAtLeast, type Histogram } from './truth'
import type { Item, Round } from './types'
import { misconceptionFor, verdictFor, verdictText } from './verdict'
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

type Phase = { kind: 'predict' } | { kind: 'locked'; answer: Answer } | { kind: 'revealed'; answer: Answer; hist: Histogram | null }

function Reveal({ item, round, answer, hist }: { item: Item; round: Round; answer: Answer; hist: Histogram | null }) {
  const truth = hist?.mean ?? null
  const v = verdictFor(item, answer, truth)
  const mid = misconceptionFor(item, answer)
  const m = round.misconceptions.find((x) => x.id === mid)
  const t = item.truth
  return (
    <div>
      <h2 className="prompt">{item.prompt}</h2>
      {hist && t.widget === 'distribution' && (
        <Distribution
          hist={hist}
          xLabel={t.x_label}
          guess={item.input_type === 'slider' ? answer.value : null}
          range={item.slider ? { min: item.slider.min, max: item.slider.max } : undefined}
        />
      )}
      <p className={`verdict ${v}`}>{verdictText[v]}</p>
      {hist && t.widget === 'distribution' && t.sampler === 'coin_longest_run' && (
        <p className="truth-line">
          Average longest run: <strong>{hist.mean.toFixed(1)}</strong>. A run of 5+ showed up in{' '}
          <strong>{Math.round(shareAtLeast(hist, 5) * 100)}%</strong> of {hist.trials.toLocaleString()} simulated tries.
        </p>
      )}
      {m && (
        <p className="truth-line">
          This looks like <strong>“{m.label}”</strong>. {m.refutation}
        </p>
      )}
    </div>
  )
}

function Player({ round, onDone }: { round: Round; onDone: () => void }) {
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState<Phase>({ kind: 'predict' })
  const item = round.items[idx]
  const last = idx === round.items.length - 1

  const lock = (answer: Answer) => {
    setPhase({ kind: 'locked', answer })
    // The truth is only computed after lock-in. The beat hides the simulation time.
    setTimeout(() => {
      const hist = item.truth.widget === 'distribution' ? simulate(item.truth) : null
      setPhase({ kind: 'revealed', answer, hist })
    }, BEAT_MS)
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
          <Reveal item={item} round={round} answer={phase.answer} hist={phase.hist} />
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
