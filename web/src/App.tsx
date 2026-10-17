import { useEffect, useState } from 'react'
import { AnyTopic } from './components/AnyTopic'
import { Distribution } from './components/Distribution'
import { NotebookLink, NotebookScreen } from './components/Notebook'
import { useReset } from './reset'
import { Predict, type Answer } from './components/Predict'
import { showcaseRound, showcaseSlugs } from './rounds'
import { sessionFor, sessions } from './sessions/registry'
import { simulate, shareAtLeast, type Histogram } from './truth'
import type { Item, Round } from './types'
import { useExtraRound } from './extras'
import { misconceptionFor, verdictFor, verdictText } from './verdict'
import { HOME, onScreenChange, pushScreen, readScreen, replaceScreen, type Screen } from './url'
import './App.css'

const BEAT_MS = 400

function Home({ onPick, onSession, onNotebook }: { onPick: (slug: string) => void; onSession: (slug: string) => void; onNotebook: () => void }) {
  return (
    <div className="home sheet">
      <h1>Bet on your gut. Then watch reality.</h1>
      <p className="concept">Predict first, lock it in, and see exactly where your intuition breaks.</p>
      {sessions.length > 0 && (
        <div className="showcases sessions">
          {sessions.map((s) => (
            <button key={s.slug} className="showcase" onClick={() => onSession(s.slug)}>
              {s.title}
              <span className="blurb">{s.blurb}</span>
            </button>
          ))}
        </div>
      )}
      <div className="showcases">
        {showcaseSlugs.filter((slug) => !sessionFor(slug)).map((slug) => (
          <button key={slug} className="showcase" onClick={() => onPick(slug)}>
            {showcaseRound(slug)!.topic}
          </button>
        ))}
      </div>
      <AnyTopic onOpen={onPick} />
      <NotebookLink onOpen={onNotebook} />
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
  const [urlScreen, setScreen] = useState<Screen>(() => readScreen(location.search))
  // An old ?round= link whose slug now has a session opens the session instead.
  const redirected = urlScreen.kind === 'round' && !!sessionFor(urlScreen.slug)
  const screen: Screen = redirected ? { kind: 'session', slug: urlScreen.slug } : urlScreen
  const showcase = screen.kind === 'round' ? showcaseRound(screen.slug) : undefined
  // Not bundled: a reviewed extra or a just-built round, fetched (static file, then the API).
  const extra = useExtraRound(screen.kind === 'round' && !showcase && !redirected ? screen.slug : null)
  const round = showcase ?? extra.round
  const session = screen.kind === 'session' ? sessionFor(screen.slug) : undefined
  const loading = screen.kind === 'round' && !round && !redirected && !extra.missing
  const unknown = (screen.kind === 'session' || screen.kind === 'round') && !round && !session && !loading

  useEffect(() => onScreenChange(setScreen), [])
  // A slug that doesn't exist shows Home, so the URL should say Home too.
  const slug = screen.kind === 'session' || screen.kind === 'round' ? screen.slug : ''
  useEffect(() => {
    if (unknown) replaceScreen(HOME)
    else if (redirected) replaceScreen({ kind: 'session', slug })
  }, [unknown, redirected, slug])

  const go = (s: Screen) => {
    pushScreen(s)
    setScreen(s)
  }
  const home = () => go(HOME)
  // Demo reset (Shift+R / ?reset=1) always lands on a clean Home URL.
  const cleared = useReset(!session && !round, () => {
    replaceScreen(HOME)
    setScreen(HOME)
  })
  if (session) {
    return (
      <main className="app">
        <header className="topbar">
          <button className="logo" style={{ border: 0, background: 'none', padding: 0 }} onClick={home}>mm</button>
        </header>
        <session.Component key={session.slug} onDone={home} />
      </main>
    )
  }
  return (
    <main className="app">
      <header className="topbar">
        <button className="logo" style={{ border: 0, background: 'none', padding: 0 }} onClick={home}>mm</button>
        {round && <span className={`chip ${round.reviewed ? 'reviewed' : ''}`}>{round.reviewed ? 'reviewed' : 'auto-checked'}</span>}
      </header>
      {cleared && <p className="nb-toast" role="status">Notebook cleared</p>}
      {screen.kind === 'notebook' ? (
        <NotebookScreen onHome={home} />
      ) : round ? (
        <Player key={round.slug} round={round} onDone={home} />
      ) : loading ? (
        <p className="sheet progress" role="status">Opening the round…</p>
      ) : (
        <Home
          onPick={(slug) => go({ kind: 'round', slug })}
          onSession={(slug) => go({ kind: 'session', slug })}
          onNotebook={() => go({ kind: 'notebook' })}
        />
      )}
    </main>
  )
}
