import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { labelFor } from '../../notebook'
import { showcaseRound } from '../../rounds'
import { misconceptionFor } from '../../verdict'
import { ConfidencePicker, EndBar, Frame, LockButton, SessionHead, StampRow, Title } from '../../components/session/Shell'
import { cardGuide, lockLabel, type Confidence } from '../../components/session/copy'
import { shellVerdict } from '../../components/session/verdict'
import { useNotebookEntry } from '../../components/session/entry'
import { ExtremeChart, KMAX, RunHistogram } from './Charts'
import { CoinGrid, Track } from './CoinGrid'
import { fmt, pct, reducedMotion, sampleLabel } from './hooks'
import {
  expectedLongest,
  flipSeq,
  longestOfFlips,
  longestRun,
  pLongestAtLeast,
  pLongestAtMost,
  repeatRateLike,
  rng,
  runs,
  switchRate,
  toSides,
  type Side,
} from './math'
import './coin.css'

const N = 100
const MIN_TAPS = 20
const E100 = expectedLongest(N)
const P5 = pLongestAtLeast(N, 5)
const STEPS = ['Be a coin', 'Flip it', 'Yours vs real', 'Extremes', 'Your mistake'] as const
/** The verdict's "close" window: 15% of the 1-20 slider. */
const WINDOW = 0.15 * 19

export function CoinSession({ onDone }: { onDone: () => void }) {
  const round = showcaseRound('coin-streak')!
  const item = round.items.find((i) => i.id === 'longest-run-100')!
  const [step, setStep] = useState(0)
  const [len, setLen] = useState(20) // the demo row is 20 flips; 100 is the long version
  const [mine, setMine] = useState<Side[]>([])
  const dealRand = useRef(rng(10))
  const [deal, setDeal] = useState<Side[]>([]) // real flips dealt under your row, same length
  const [dealKey, setDealKey] = useState(0)
  const [guessSet, setGuessSet] = useState<number | null>(null) // unset until you move the slider: no anchor
  const guess = guessSet ?? 0
  const [conf, setConf] = useState<Confidence | null>(null)
  const [locked, setLocked] = useState(false)
  const rand = useRef(rng(25)) // seed: the first real 100 tops out at 8, a typical row (avg 6.98)
  const [real, setReal] = useState<Side[]>([])
  const [flipKey, setFlipKey] = useState(0)
  const [hist, setHist] = useState<number[]>(() => new Array(KMAX + 1).fill(0))
  const [sim, setSim] = useState(0) // runs from "Run 1,000 times"
  const [flipped, setFlipped] = useState(0) // strips flipped one at a time
  const total = sim + flipped
  const [newest, setNewest] = useState(0)
  const [running, setRunning] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const entry = useNotebookEntry('coin-streak')
  const model = mine // you can only lock (and leave step 1) with 20+ taps of your own

  const dealRow = useCallback((n: number) => {
    setDeal(flipSeq(n, dealRand.current))
    setDealKey((k) => k + 1)
  }, [])

  // Functional update: taps faster than a render never drop a flip or overshoot the row.
  const tap = useCallback(
    (c: Side) => {
      if (locked) return
      setMine((m) => (m.length >= len ? m : [...m, c]))
    },
    [locked, len],
  )

  // Any edit takes the real row away; a full row gets a fresh one dealt (below).
  const editMine = useCallback((m: Side[]) => {
    setMine(m)
    setDeal([])
  }, [])
  useEffect(() => {
    if (mine.length === len && deal.length !== len) dealRow(len)
  }, [mine.length, len, deal.length, dealRow])

  // Switching length keeps your taps (cut to 20 going down), so a mid-row toggle never wipes them.
  const pickLen = (n: number) => {
    if (n === len) return
    setLen(n)
    editMine(mine.slice(0, n))
  }

  useEffect(() => {
    if (step !== 0 || locked) return
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat || (e.target as HTMLElement).tagName === 'INPUT') return
      const k = e.key.toUpperCase()
      if (k === 'H' || k === 'T') tap(k)
      if (e.key === 'Backspace' && mine.length) editMine(mine.slice(0, -1))
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [step, locked, tap, mine, editMine])

  const addTrials = (ls: number[]) => {
    setHist((h) => {
      const next = h.slice()
      for (const l of ls) next[Math.min(l, KMAX)]++
      return next
    })
    setNewest(ls[ls.length - 1])
  }

  const flip = () => {
    const s = flipSeq(N, rand.current)
    setReal(s)
    setFlipKey((k) => k + 1)
    addTrials([longestRun(s)])
    setFlipped((f) => f + 1)
  }

  // A fresh sample of exactly 1,000: the label reads "1,000 runs", and strips flipped after it are counted apart.
  const run1k = () => {
    setHist(new Array(KMAX + 1).fill(0))
    setFlipped(0)
    setSim(0)
    if (reducedMotion()) {
      addTrials(Array.from({ length: 1000 }, () => longestOfFlips(N, rand.current)))
      setSim(1000)
      return
    }
    setRunning(true)
    let left = 1000
    const tick = () => {
      const b = Math.min(left, 12)
      addTrials(Array.from({ length: b }, () => longestOfFlips(N, rand.current)))
      setSim((x) => x + b)
      left -= b
      if (left > 0) requestAnimationFrame(tick)
      else setRunning(false)
    }
    tick()
  }

  const go = (s: number) => {
    setStep(s)
    requestAnimationFrame(() => {
      heading.current?.focus()
      heading.current?.scrollIntoView?.({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' })
    })
  }

  const lock = () => {
    setLocked(true)
    if (real.length === 0) flip()
    go(1)
  }

  const restart = () => {
    entry.reset()
    setMine([])
    setDeal([])
    setLocked(false)
    go(0)
  }

  const sw = switchRate(model)
  // The verdict only reads the value; confidence never changes which mistake a guess names.
  const misId = misconceptionFor(item, { value: guess, optionId: null, confidence: 'pretty sure' })
  const full = mine.length >= len && deal.length === len
  const TITLES: [string, string][] = [
    [
      `Be a coin. Tap out ${len} flips.`,
      full ? 'Your row on top, real flips below. Flip again a few times: which one clumps?' : `Make up ${len} coin flips the way you think a fair coin looks. We'll compare yours with real ones.`,
    ],
    ['Now a real coin. Flip it.', 'Each dot is one real round of 100 flips. See where most of them land compared with your guess.'],
    ['Your coin vs the real coin', 'Your row next to a real 100, runs of 5 or more marked. Which one clumps?'],
    ['More flips, longer streaks?', 'Drag to flip more or fewer coins. Watch how slowly, but surely, streaks grow.'],
    ['What happened in your head', cardGuide(misId === null)],
  ]
  const [title, sub] = TITLES[step]
  return (
    <Frame className="coin-session">
      <SessionHead chip="Coin streak" step={step + 1} total={STEPS.length} labels={STEPS} canGo={(i) => i === 0 || locked} onGo={go} />
      <Title h={title} sub={sub} id="coin-h" headingRef={heading} />
      {locked && (
        <p className="pencil-strip" aria-label="your model">
          <span>you guessed <b>{guess}</b> in a row{conf ? ` (${conf})` : ''}</span>
          <span>you switch <b>{pct(sw)}</b></span>
          <span>your longest <b>{longestRun(model)}</b></span>
        </p>
      )}
      <section className={step === 4 ? 'coin-step' : 'coin-step card'} aria-labelledby="coin-h">
        {step === 0 && (
          <TapStep len={len} pickLen={pickLen} deal={deal} dealKey={dealKey} onDeal={() => dealRow(len)} mine={mine} setMine={editMine} tap={tap} guess={guessSet} setGuess={setGuessSet} conf={conf} setConf={setConf} locked={locked} onLock={lock} onNext={() => go(1)} />
        )}
        {step === 1 && (
          <>
            <div className="readout">
              <div><div className="big num">{longestRun(real)}</div><div className="lbl">longest run this time</div></div>
              <div><div className="big num">{pct(switchRate(real))}</div><div className="lbl">side switches</div></div>
              <div><div className="big num ink">{E100.toFixed(2)}</div><div className="lbl">average longest run (exact)</div></div>
            </div>
            <CoinGrid key={flipKey} seq={real} fresh={!reducedMotion()} hiLongest label={`100 real flips, longest run ${longestRun(real)} highlighted`} />
            <div className="row">
              <button className="btn" onClick={flip} disabled={running}>Flip 100 again</button>
              <button className="btn ghost" onClick={run1k} disabled={running}>{running ? 'Running…' : 'Run 1,000 times'}</button>
            </div>
            <RunHistogram hist={hist} total={total} newest={newest} guess={guess} mean={E100} />
            <Legend items={[['truth', 'real coin'], ['you', 'your guess'], ['gap', 'the gap']]} />
            <p className="simnote" aria-live="polite">
              {sampleLabel(sim, flipped)}, <b className="num">{pct(hist.reduce((s, c, k) => s + (k > guess ? c : 0), 0) / Math.max(1, total))}</b> beat your guess of {guess}.
              Exact: a run of 5+ shows up <b className="num">{pct(P5, 1)}</b> of the time.
            </p>
            <Next onClick={() => go(2)}>Next: your coin vs the real one</Next>
          </>
        )}
        {step === 2 && <CompareStep model={model} real={real} onNext={() => go(3)} />}
        {step === 3 && <ExtremeStep model={model} guess={guess} onNext={() => go(4)} />}
        {step === 4 && (
          <CardStep model={model} guess={guess} round={round} conf={conf ?? 'pretty sure'} verdict={shellVerdict(misId, guess, E100, WINDOW)} misId={misId} entry={entry} onRestart={restart} onDone={onDone} />
        )}
      </section>
    </Frame>
  )
}

function Legend({ items }: { items: [string, string][] }) {
  return (
    <div className="legend">
      {items.map(([k, t]) => (
        <span key={k}><i className={`l-${k}`} />{t}</span>
      ))}
    </div>
  )
}

function Next({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <div className="next-row">
      <button className="btn" onClick={onClick}>{children} →</button>
    </div>
  )
}

function TapStep(p: { len: number; pickLen: (n: number) => void; deal: Side[]; dealKey: number; onDeal: () => void; mine: Side[]; setMine: (m: Side[]) => void; tap: (c: Side) => void; guess: number | null; setGuess: (g: number) => void; conf: Confidence | null; setConf: (c: Confidence) => void; locked: boolean; onLock: () => void; onNext: () => void }) {
  const { mine, locked, setMine, tap, guess, setGuess, conf, setConf, onLock, onNext, len, pickLen, deal, dealKey, onDeal } = p
  const full = mine.length >= len && deal.length === len
  const ready = mine.length >= MIN_TAPS && guess != null && conf != null
  // When the real row deals in (tap 20, Flip again), bring it on screen: on a 360x640 phone it lands below the fold.
  const realRef = useRef<HTMLParagraphElement>(null)
  const seenDeal = useRef(dealKey)
  useEffect(() => {
    if (!full || seenDeal.current === dealKey) return
    seenDeal.current = dealKey
    realRef.current?.scrollIntoView?.({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' })
  }, [full, dealKey])
  // Same lock copy as the other sessions once your 20 taps are in; before that the note under the button says why it waits.
  const lockText = mine.length < MIN_TAPS ? 'Lock it in' : lockLabel(guess != null, conf)
  return (
    <>
      <div className="lenpick" role="radiogroup" aria-label="row length">
        {[20, 100].map((n) => (
          <button key={n} role="radio" aria-checked={len === n} className={len === n ? 'on' : ''} disabled={locked} onClick={() => pickLen(n)}>
            {n} flips
          </button>
        ))}
      </div>
      <div className="tapper">
        <button className="tap" aria-label="Heads (key H)" disabled={locked || mine.length >= len} onClick={() => tap('H')}>H</button>
        <button className="tap" aria-label="Tails (key T)" disabled={locked || mine.length >= len} onClick={() => tap('T')}>T</button>
      </div>
      <div className="row">
        <button className="btn ghost small" disabled={locked || !mine.length} onClick={() => setMine(mine.slice(0, -1))}>Undo</button>
        <button className="btn ghost small" disabled={locked || !mine.length} onClick={() => setMine([])}>Clear</button>
      </div>
      <h3 className="rowname"><i className="l-you" />yours</h3>
      <CoinGrid seq={mine} size={len} mine hiLongest={full} cols={len === 20 ? 10 : undefined} label={`your ${mine.length} taps`} />
      {full && (
        <>
          <h3 className="rowname"><i className="l-truth" />a real coin, {len} flips</h3>
          <CoinGrid key={dealKey} seq={deal} hiLongest fresh={!reducedMotion()} cols={len === 20 ? 10 : undefined} label={`${len} real flips, longest run ${longestRun(deal)}`} />
          <p className="tally" aria-live="polite" ref={realRef}>
            your longest: <b className="you">{longestRun(mine)}</b> · real: <b className="ink">{longestRun(deal)}</b>
            <button className="btn ghost small" onClick={onDeal}>Flip again</button>
          </p>
          <p className="note">
            In {len} real flips the longest run averages {expectedLongest(len).toFixed(2)} (exact). You switched {pct(switchRate(mine))} of the time; a coin switches 50%.
          </p>
        </>
      )}
      <div className="stats" aria-live="polite">
        <span>flips <b>{mine.length}</b>/{len}</span>
        <span>side switches <b>{mine.length > 1 ? pct(switchRate(mine)) : '-'}</b></span>
        <span>your longest run <b>{longestRun(mine)}</b></span>
      </div>
      <p className="note">Keys H and T work too. Your taps are your model of randomness: they stay in pencil the whole session.</p>
      <div className={`card guessbox ${locked ? 'is-locked' : ''}`}>
        <p className="guide">Guess first: in 100 flips, what's the longest run of the same side? Your guess stays on screen.</p>
        <label htmlFor="coin-guess" className="q">Longest run in 100 real flips?</label>
        <div className="guessnum">
          <span className="big">{guess ?? '?'}</span><span>in a row</span>
          {locked && <span className="stamp locked">locked</span>}
        </div>
        <input
          id="coin-guess"
          type="range"
          className={guess == null ? 'unset' : ''}
          min={1}
          max={20}
          step={1}
          value={guess ?? 10}
          aria-valuetext={guess == null ? 'not set yet' : `${guess} in a row`}
          disabled={locked}
          onChange={(e) => setGuess(+e.target.value)}
          // a click right on the resting thumb doesn't fire change; it still counts as a pick
          onPointerUp={(e) => guess == null && setGuess(+e.currentTarget.value)}
        />
        <div className="ticks"><span>1</span><span>5</span><span>10</span><span>15</span><span>20</span></div>
        <ConfidencePicker value={conf} onPick={setConf} disabled={locked} />
        {locked ? (
          <div className="row">
            <button className="btn" onClick={onNext}>Back to the real coin →</button>
          </div>
        ) : (
          <>
            <LockButton ready={ready} onLock={onLock}>{lockText}</LockButton>
            {mine.length < MIN_TAPS && <p className="note">tap at least {MIN_TAPS} flips first ({mine.length} so far)</p>}
          </>
        )}
      </div>
    </>
  )
}

function CompareStep({ model, real, onNext }: { model: Side[]; real: Side[]; onNext: () => void }) {
  const nReal = runs(real).filter((r) => r.len >= 5).length
  const nMine = runs(model).filter((r) => r.len >= 5).length
  const sw = switchRate(model)
  const scaled = model.length === N ? '' : ` (${model.length} taps)`
  return (
    <>
      <div className="pair">
        <div>
          <h3><i className="l-you" />yours{scaled}</h3>
          <CoinGrid seq={model} size={Math.max(model.length, 10)} mine mini cols={10} hiAtLeast={5} label={`your row, ${nMine} runs of 5 or more`} />
        </div>
        <div>
          <h3><i className="l-truth" />real</h3>
          <CoinGrid seq={real} mini cols={10} hiAtLeast={5} label={`real row, ${nReal} runs of 5 or more`} />
        </div>
      </div>
      <p className="anno">
        marker = runs of 5+. <span className="hl">the real 100 has {nReal}; your {model.length} {nMine === 1 ? 'has' : 'have'} {nMine}.</span>
      </p>
      <div className="meter">
        <div className="name">How often you switch sides</div>
        <Track you={sw * 100} truth={50} max={100} show={(v) => `${Math.round(v)}%`} truthLabel="coin" />
      </div>
      <div className="meter">
        <div className="name">Longest run in {model.length} flips</div>
        <Track you={longestRun(model)} truth={expectedLongest(model.length)} max={15} show={(v) => (Number.isInteger(v) ? `${v}` : v.toFixed(2))} youLabel="you wrote" truthLabel={`real avg (${model.length})`} />
      </div>
      <Legend items={[['truth', 'real coin'], ['you', 'you'], ['gap', 'the gap']]} />
      <p className="anno big">
        {sw > 0.58
          ? `You switched ${pct(sw)} of the time; a coin switches 50%. Every extra switch breaks a streak before it gets going.`
          : sw < 0.42
            ? `You switched only ${pct(sw)} of the time; a coin switches 50%. Your streaks run longer than a coin's.`
            : `${pct(sw)} switches is close to a coin's 50%. Pretty coin-like.`}
      </p>
      <Next onClick={onNext}>Next: push it to 10,000 flips</Next>
    </>
  )
}

const TICKS: [number, string][] = [[10, '10'], [100, '100'], [1000, '1,000'], [10000, '10,000']]

function ExtremeStep({ model, guess, onNext }: { model: Side[]; guess: number; onNext: () => void }) {
  const [v, setV] = useState(2)
  const n = Math.round(10 ** v)
  const rYou = Math.round(repeatRateLike(model) * 100) / 100
  const truthNow = useMemo(() => expectedLongest(n), [n])
  const youNow = useMemo(() => expectedLongest(n, rYou), [n, rYou])
  const pBeat = 1 - pLongestAtMost(n, guess)
  const note =
    n < 30
      ? `${fmt(n)} flips: even here a run of 3+ is normal (average ${truthNow.toFixed(1)}).`
      : n < 300
        ? `${fmt(n)} flips: a run longer than your ${guess} happens ${pct(pBeat, 1)} of the time.`
        : n < 3000
          ? `${fmt(n)} flips: about 10 in a row is the normal case. That's the streak people call rigged.`
          : `${fmt(n)} flips: ${truthNow.toFixed(1)} in a row expected. 100x the flips of 100, only +${(truthNow - E100).toFixed(1)}: it grows like log₂N, one more per doubling.`
  return (
    <>
      <div className="ext-head">
        <div><div className="n num">{fmt(n)}</div><small>flips</small></div>
        <div><div className="v truth num">{truthNow.toFixed(2)}</div><small>expected longest run, real coin (exact)</small></div>
        <div><div className="v you">{youNow.toFixed(1)}</div><small>a coin that switches like you (exact)</small></div>
      </div>
      <label htmlFor="coin-n" className="q">Number of flips</label>
      <input id="coin-n" type="range" min={1} max={4} step={0.01} value={v} aria-valuetext={`${fmt(n)} flips`} onChange={(e) => setV(+e.target.value)} />
      <div className="ticks hand-ticks">
        {TICKS.map(([t, l]) => (
          <button key={t} className={n === t ? 'on' : ''} onClick={() => setV(Math.log10(t))}>{l}</button>
        ))}
      </div>
      <ExtremeChart v={v} rYou={rYou} guess={guess} truthNow={truthNow} youNow={youNow} />
      <Legend items={[['truth', 'real coin (exact)'], ['you', 'switches like you; short dash = your guess'], ['log2', 'log₂ N']]} />
      <p className="breaknote" aria-live="polite"><span className="hl">{note}</span></p>
      <Next onClick={onNext}>Next: what your taps say</Next>
    </>
  )
}

function CardStep(p: {
  model: Side[]
  guess: number
  conf: Confidence
  round: NonNullable<ReturnType<typeof showcaseRound>>
  verdict: 'called' | 'close' | 'off'
  misId: string | null
  entry: ReturnType<typeof useNotebookEntry>
  onRestart: () => void
  onDone: () => void
}) {
  const { model, guess, conf, round, verdict, misId, entry, onRestart, onDone } = p
  const m = round.misconceptions.find((x) => x.id === misId)
  const [picked, setPicked] = useState<{ right: boolean; misId: string | null } | null>(null)
  // Saved when the card shows (#159); the rematch below updates this same entry.
  useEffect(() => {
    entry.atCard({ guess, confidence: conf, switchRate: Math.round(switchRate(model) * 100) / 100, misconception: misId })
  }, [entry, guess, conf, model, misId])
  const sw = switchRate(model)
  const pPast = 1 - pLongestAtMost(N, guess)
  const pReach = pLongestAtLeast(N, guess)
  const p59 = pLongestAtMost(N, 9) - pLongestAtMost(N, 4)
  const line =
    misId === 'random-means-evenly-mixed'
      ? `You guessed ${guess}. A real coin goes past ${guess} in ${pct(pPast, 1)} of 100-flip runs.`
      : misId === 'streak-means-not-random'
        ? `You guessed ${guess}. Only ${pct(pReach, 1)} of real 100-flip runs get a streak that long.`
        : `Your ${guess} sits where real coins land: ${pct(p59, 1)} of 100-flip runs top out between 5 and 9.`
  const hand = sw > 0.58 ? ` But your hand still switched ${pct(sw)} of the time, where a coin switches 50%.` : ''
  return (
    <>
      <StampRow v={verdict}>
        <p className="said">
          You said <b className="you">{guess}</b> ({conf}). A real 100 averages <span className="hl"><b className="num">{E100.toFixed(2)}</b></span>.
        </p>
      </StampRow>
      <div className="card verdict-card">
        <div className={`tag ${m ? 'red' : ''}`}>{m ? 'the mistake' : 'the right model'}</div>
        <h3 className="mname">{m ? <>“<span className="hl">{m.label}</span>”</> : <>Streaky, <span className="hl">like a real coin</span>.</>}</h3>
        <p className="line">{line}{hand}</p>
        <ul className="evid">
          <li><span>switches per flip</span><span className="y">you {pct(sw)}</span><span className="t">coin 50%</span></li>
          <li><span>longest run in your {model.length}</span><span className="y">you {longestRun(model)}</span><span className="t">{expectedLongest(model.length).toFixed(2)} avg</span></li>
          <li><span>your guess vs a real 100</span><span className="y">you {guess}</span><span className="t">{pct(pPast, 1)} go past it</span></li>
        </ul>
        {m && <p className="why">{m.refutation}</p>}
        <p className="src">
          {m?.source_url ? <><a href={m.source_url} target="_blank" rel="noreferrer">Source</a>: {m.source_note}. </> : null}
          Numbers here are exact (dynamic programming over run length) unless marked simulated.
        </p>
        <WhichIsReal
          round={round}
          onPick={(right, pickedMis) => {
            setPicked({ right, misId: pickedMis })
            entry.rematch(right ? 'right' : 'wrong', pickedMis)
          }}
        />
      </div>
      {picked != null ? (
        <EndBar
          caught={m?.label ?? null}
          rematch={picked.right ? 'right' : 'wrong'}
          rematchCaught={!picked.right && picked.misId ? labelFor('coin-streak', picked.misId) : null}
          remix="Come back tomorrow for a remix with new rows."
          onDone={onDone}
        />
      ) : (
        <div className="row">
          <button className="btn ghost small" onClick={onRestart}>Tap a new row</button>
          <button className="btn small" onClick={onDone}>
            Done
          </button>
        </div>
      )}
    </>
  )
}

function WhichIsReal({ round, onPick }: { round: NonNullable<ReturnType<typeof showcaseRound>>; onPick: (right: boolean, misId: string | null) => void }) {
  const item = round.items.find((i) => i.id === 'which-is-real')
  const [pick, setPick] = useState<string | null>(null)
  const seqs = item?.prompt.match(/A:\s*([HT]+)\s+B:\s*([HT]+)/)
  if (!item || !seqs || !item.options) return null
  const real = item.options.find((o) => o.misconception_id === null)!.id
  const pair: [string, Side[]][] = [['a', toSides(seqs[1])], ['b', toSides(seqs[2])]]
  const n = pair[0][1].length
  const realSeq = pair.find(([id]) => id === real)![1]
  const fakeSeq = pair.find(([id]) => id !== real)![1]
  const L = longestRun(realSeq)
  const up = (s: string) => s.toUpperCase()
  return (
    <div className="tryit">
      <div className="tag">try it on</div>
      <p className="guide">One more: spot the real coin. Does the idea stick?</p>
      <p className="q">One of these {n}-flip rows was flipped, one was made up by a person. Which is the real coin?</p>
      <div className="choice">
        {pair.map(([id, s]) => (
          <button
            key={id}
            className={pick ? (id === real ? 'right' : id === pick ? 'wrong' : '') : ''}
            aria-pressed={pick === id}
            aria-label={`${up(id)}: ${s.join('')}`}
            disabled={pick != null}
            onClick={() => {
              setPick(id)
              onPick(id === real, item.options!.find((o) => o.id === id)?.misconception_id ?? null)
            }}
          >
            <b>{up(id)}</b>
            <CoinGrid seq={s} cols={10} hiLongest={!!pick} label={`${up(id)}: ${s.join('')}`} />
            {pick && <span className="tile-note">{id === real ? 'real coin' : 'made up'}, longest run {longestRun(s)}</span>}
          </button>
        ))}
      </div>
      <p className="tryres" aria-live="polite">
        {pick && (
          <>
            <span className={pick === real ? 'ok' : 'hl'}>{pick === real ? 'Called it.' : "That's the made-up one."}</span>{' '}
            {up(real)} was the real coin. {up(real === 'a' ? 'b' : 'a')} was made up and never goes past {longestRun(fakeSeq)} in a row. In {n} real flips the
            longest run averages {expectedLongest(n).toFixed(2)}, and a run of {L}+ shows up {pct(pLongestAtLeast(n, L), 1)} of the time (exact).
          </>
        )}
      </p>
    </div>
  )
}
