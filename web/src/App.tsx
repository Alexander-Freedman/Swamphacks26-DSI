import { useEffect, useRef, useState } from 'react'
import { CheckedTag } from './components/CheckedTag'
import { NotebookLink, NotebookScreen } from './components/Notebook'
import { useReset } from './reset'
import { Predict, type Answer } from './components/Predict'
import { Reveal } from './components/Reveal'
import { showcaseRound, showcaseSlugs } from './rounds'
import { sessionFor, sessions } from './sessions/registry'
import { withUnit } from './format'
import { computeTruth, type Computed } from './truth'
import type { Round } from './types'
import { misconceptionFor } from './verdict'
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
      <NotebookLink onOpen={onNotebook} />
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
  const beat = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  // Leaving mid-beat (logo, Done) must not fire a reveal into an unmounted round.
  useEffect(() => () => clearTimeout(beat.current), [])

  const lock = (answer: Answer) => {
    setPhase({ kind: 'locked', answer })
    const mid = misconceptionFor(item, answer)
    if (mid) setSignals((s) => ({ ...s, [mid]: (s[mid] ?? 0) + 1 }))
    // The truth is only computed after lock-in. The beat hides the simulation time.
    clearTimeout(beat.current)
    beat.current = setTimeout(() => setPhase({ kind: 'revealed', answer, truth: computeTruth(item) }), BEAT_MS)
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
      {phase.kind !== 'predict' && <h2 className="prompt">{item.prompt}</h2>}
      {phase.kind !== 'predict' && (
        <span className="locked-stamp">
          locked: {phase.answer.value != null ? withUnit(phase.answer.value, item.slider?.unit ?? '') : item.options?.find((o) => o.id === phase.answer.optionId)?.text} · {phase.answer.confidence}
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
  const [urlScreen, setScreen] = useState<Screen>(() => readScreen(location.search))
  // An old ?round= link whose slug now has a session opens the session instead.
  const redirected = urlScreen.kind === 'round' && !!sessionFor(urlScreen.slug)
  const screen: Screen = redirected ? { kind: 'session', slug: urlScreen.slug } : urlScreen
  const round = screen.kind === 'round' ? showcaseRound(screen.slug) : undefined
  const session = screen.kind === 'session' ? sessionFor(screen.slug) : undefined
  const unknown = (screen.kind === 'session' || screen.kind === 'round') && !round && !session

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
          <button className="logo" style={{ border: 0, background: 'none', padding: 0 }} onClick={home}>Onionskin</button>
        </header>
        <session.Component key={session.slug} onDone={home} />
      </main>
    )
  }
  return (
    <main className="app">
      <header className="topbar">
        <button className="logo" style={{ border: 0, background: 'none', padding: 0 }} onClick={home}>Onionskin</button>
        {round && <CheckedTag reviewed={round.reviewed} />}
      </header>
      {cleared && <p className="nb-toast" role="status">Notebook cleared</p>}
      {screen.kind === 'notebook' ? (
        <NotebookScreen onHome={home} />
      ) : round ? (
        <Player key={round.slug} round={round} onDone={home} />
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
