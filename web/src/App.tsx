import { useCallback, useEffect, useRef, useState } from 'react'
import { AnyTopic, BuildReady } from './components/AnyTopic'
import { AskHelp } from './components/AskHelp'
import { ITEM_SCREENS } from './components/helpHints'
import { BackendDot } from './components/BackendDot'
import { CheckedTag } from './components/CheckedTag'
import { HowItWorks } from './components/HowItWorks'
import { useDrawerKey } from './components/drawerKey'
import { SessionHowItWorks } from './components/SessionHowItWorks'
import { sessionHowItWorks } from './components/sessionSpecs'
import { NotebookLink, NotebookScreen } from './components/Notebook'
import { record, upsert } from './notebook'
import { useReset } from './reset'
import { Predict, type Answer } from './components/Predict'
import { Reveal } from './components/Reveal'
import { showcaseRound, showcaseSlugs } from './rounds'
import { homeSessions, sessionFor } from './sessions/registry'
import { artFor } from './sessionArt'
import { withUnit } from './format'
import { computeTruth, type Computed } from './truth'
import type { Round } from './types'
import { useExtraRound } from './extras'
import { misconceptionFor } from './verdict'
import { HOME, onScreenChange, pushScreen, readScreen, replaceScreen, type Screen } from './url'
import './App.css'

const BEAT_MS = 400

function Home({ onPick, onSession, onNotebook }: { onPick: (slug: string) => void; onSession: (slug: string) => void; onNotebook: () => void }) {
  // Showcases with a session open that instead; only ones without one get a plain round button.
  const rounds = showcaseSlugs.filter((slug) => !sessionFor(slug))
  return (
    <div className="home sheet">
      <h1>See your thinking in layers.</h1>
      <p className="concept">Type any topic. Watch it come alive.</p>
      {homeSessions.length > 0 && (
        <div className="showcases sessions">
          {homeSessions.map((s, i) => {
            const art = artFor(s.slug)
            return (
              <button key={s.slug} className={`showcase${art ? ' has-art' : ''}`} onClick={() => onSession(s.slug)}>
                {art && (
                  <img
                    className="card-art"
                    src={art.src}
                    srcSet={art.srcSet}
                    sizes="(max-width: 640px) 120px, 240px"
                    width={512}
                    height={512}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    alt=""
                  />
                )}
                <span className="card-text">
                  <span className="card-title">{s.title}</span>
                  <span className="blurb">{s.blurb}</span>
                </span>
              </button>
            )
          })}
        </div>
      )}
      {rounds.length > 0 && (
        <div className="showcases">
          {rounds.map((slug) => (
            <button key={slug} className="showcase" onClick={() => onPick(slug)}>
              {showcaseRound(slug)!.topic}
            </button>
          ))}
        </div>
      )}
      <AnyTopic onOpen={onPick} onSession={onSession} />
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
  const [drawer, setDrawer] = useState(false)
  const closeDrawer = useCallback(() => setDrawer(false), [])
  useDrawerKey(useCallback(() => setDrawer((o) => !o), []))
  // Notebook (#172): this play's id and the entry time of each mistake it caught (one entry per mistake).
  const [play] = useState(() => `${round.slug}@${new Date().toISOString()}`)
  const caught = useRef<Record<string, string>>({})

  const save = (answer: Answer, mid: string | null) => {
    const base = { session: round.slug, kind: 'round' as const, topic: round.topic, play, rematch: null }
    if (mid === null) return record({ ...base, at: new Date().toISOString(), guess: '', misconception: null })
    // Distinct times per mistake (upsert keys on session + time); the same mistake twice stays one catch.
    const at = (caught.current[mid] ??= new Date(Date.now() + Object.keys(caught.current).length).toISOString())
    upsert({
      ...base,
      at,
      guess: answer.value ?? answer.optionId ?? '',
      confidence: answer.confidence,
      misconception: mid,
      label: round.misconceptions.find((m) => m.id === mid)?.label,
    })
  }

  const lock = (answer: Answer) => {
    setPhase({ kind: 'locked', answer })
    const mid = misconceptionFor(item, answer)
    if (mid) setSignals((s) => ({ ...s, [mid]: (s[mid] ?? 0) + 1 }))
    // A miss lands in the notebook right away, so the reveal's "Keep this one." is true.
    if (mid) save(answer, mid)
    // The truth is only computed after lock-in. The beat hides the simulation time.
    clearTimeout(beat.current)
    beat.current = setTimeout(() => setPhase({ kind: 'revealed', answer, truth: computeTruth(item) }), BEAT_MS)
  }

  const next = () => {
    if (last) {
      // A round with no miss counts as one right answer toward busting its earlier catches.
      if (phase.kind === 'revealed' && !Object.keys(caught.current).length) save(phase.answer, null)
      return onDone()
    }
    setIdx(idx + 1)
    setPhase({ kind: 'predict' })
  }

  return (
    <div className="sheet">
      <div className="player-bar">
        <p className="progress">{round.topic} · {idx + 1} of {round.items.length}</p>
        <div className="topbar-actions">
          <AskHelp
            slug={round.slug}
            kind="round"
            spot={{
              screen: ITEM_SCREENS[item.id],
              locked: phase.kind !== 'predict',
              guess: phase.kind === 'predict' ? null : (phase.answer.value ?? phase.answer.optionId),
              step: idx + 1,
              total: round.items.length,
              label: round.topic,
            }}
          />
          <button className="hiw-btn" onClick={() => setDrawer(true)} aria-haspopup="dialog">
            How it works <kbd aria-hidden="true">D</kbd>
          </button>
        </div>
      </div>
      {drawer && <HowItWorks round={round} item={item} locked={phase.kind !== 'predict'} onClose={closeDrawer} />}
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

// The "How it works" button + D key around a session (the session's own files don't change).
function SessionDrawer({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false)
  // Once shown, the numbers stay shown for this session visit.
  const [shown, setShown] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  useDrawerKey(useCallback(() => setOpen((o) => !o), []))
  return (
    <>
      <button className="hiw-btn" onClick={() => setOpen(true)} aria-haspopup="dialog">
        How it works <kbd aria-hidden="true">D</kbd>
      </button>
      {open && <SessionHowItWorks slug={slug} onClose={close} shown={shown} onShow={() => setShown(true)} />}
    </>
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
          <button className="logo" style={{ border: 0, background: 'none', padding: 0 }} onClick={home}>Onionskin</button>
          <div className="topbar-actions">
            <AskHelp key={session.slug} slug={session.slug} kind="session" subject={session.title} />
            {sessionHowItWorks[session.slug] && <SessionDrawer key={session.slug} slug={session.slug} />}
          </div>
        </header>
        <session.Component key={session.slug} onDone={home} />
        <BuildReady onOpen={(slug) => go({ kind: 'round', slug })} />
      </main>
    )
  }
  return (
    <main className="app">
      <header className="topbar">
        <button className="logo" style={{ border: 0, background: 'none', padding: 0 }} onClick={home}>Onionskin</button>
        {round && <CheckedTag reviewed={round.reviewed} />}
        {screen.kind === 'home' && <BackendDot />}
      </header>
      {cleared && <p className="nb-toast" role="status">Notebook cleared</p>}
      {screen.kind !== 'home' && <BuildReady onOpen={(slug) => go({ kind: 'round', slug })} />}
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
