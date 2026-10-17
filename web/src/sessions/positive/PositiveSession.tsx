import { useEffect, useMemo, useRef, useState } from 'react'
import { showcaseRound } from '../../rounds'
import { misconceptionFor, verdictFor } from '../../verdict'
import { CrowdCurve, GuessBar, PileCompare } from './Charts'
import { Dots, PaintGrid } from './Crowd'
import { baseToSlider, breakEven, CARD, pct, piles, POP, ppv, secondTest, seededOrder, sliderToBase, type Test } from './math'
import './positive.css'

const STEPS = ['Guess', 'Test everyone', 'You vs real', 'Change the crowd', 'Your mistake'] as const
const ORDER = seededOrder()
const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

// Sketch values: 0 = not painted, 1 = you think: positive and sick, 2 = you think: positive but healthy.
type Brush = 0 | 1 | 2

function cardTest(): Test {
  const p = showcaseRound('positive-test')?.items[0]?.truth
  const params = p && p.widget === 'distribution' ? p.params : {}
  return {
    baseRate: params.base_rate ?? CARD.baseRate,
    sensitivity: params.sensitivity ?? CARD.sensitivity,
    falseAlarm: params.false_positive_rate ?? CARD.falseAlarm,
  }
}

export function PositiveSession({ onDone }: { onDone: () => void }) {
  const round = showcaseRound('positive-test')!
  const item = round.items[0]
  const test = useMemo(() => cardTest(), [])
  const truth = ppv(test)

  const [step, setStep] = useState(0)
  const [guess, setGuess] = useState(50)
  const [touched, setTouched] = useState(false)
  const [sketch, setSketch] = useState<Brush[]>(() => Array(POP).fill(0))
  const painted = { sick: sketch.filter((v) => v === 1).length, healthy: sketch.filter((v) => v === 2).length }

  return (
    <div className="pt">
      <nav className="pt-steps" aria-label="session steps">
        {STEPS.map((s, i) => (
          <span key={s} className={i === step ? 'on' : i < step ? 'done' : ''} aria-current={i === step ? 'step' : undefined}>
            {i + 1}. {s}
          </span>
        ))}
      </nav>
      {step > 0 && (
        <p className="pt-pencil-chip">
          your guess: <b>{guess}%</b>
          {painted.sick + painted.healthy > 0 && <> · your sketch: {painted.sick} sick of {painted.sick + painted.healthy}</>}
        </p>
      )}

      {step === 0 && (
        <GuessStep
          test={test}
          guess={guess}
          touched={touched}
          setGuess={(v) => (setGuess(v), setTouched(true))}
          sketch={sketch}
          setSketch={setSketch}
          painted={painted}
          onLock={() => setStep(1)}
        />
      )}
      {step === 1 && <RunStep test={test} guess={guess} onNext={() => setStep(2)} />}
      {step === 2 && <CompareStep guess={guess} truth={truth} painted={painted} test={test} onNext={() => setStep(3)} />}
      {step === 3 && <CrowdStep card={test} guess={guess} onNext={() => setStep(4)} />}
      {step === 4 && (
        <CardStep guess={guess} truth={truth} test={test} round={round} item={item} onDone={onDone} />
      )}

      {step > 1 && (
        <button className="pt-back" onClick={() => setStep(step - 1)}>
          ← back
        </button>
      )}
    </div>
  )
}

function GuessStep(props: {
  test: Test
  guess: number
  touched: boolean
  setGuess: (v: number) => void
  sketch: Brush[]
  setSketch: (f: (s: Brush[]) => Brush[]) => void
  painted: { sick: number; healthy: number }
  onLock: () => void
}) {
  const { test, guess, touched, setGuess, sketch, setSketch, painted, onLock } = props
  const [brush, setBrush] = useState<Brush>(1)
  const paint = (i: number) => setSketch((s) => (s[i] === brush ? s : s.map((v, k) => (k === i ? brush : v))))
  const add = (kind: 1 | 2, n: number) =>
    setSketch((s) => {
      const out = s.slice()
      let left = n
      for (const i of ORDER) {
        if (left > 0 && out[i] === 0) {
          out[i] = kind
          left--
        } else if (left < 0 && out[i] === kind) {
          out[i] = 0
          left++
        }
        if (!left) break
      }
      return out
    })
  const classes = useMemo(() => sketch.map((v) => (v === 1 ? 'sk' : v === 2 ? 'hp' : '')), [sketch])
  const total = painted.sick + painted.healthy
  const brushes: [Brush, string][] = [[1, 'sick +'], [2, 'healthy +'], [0, 'erase']]

  return (
    <section>
      <h1 className="pt-h">You tested positive.</h1>
      <p className="pt-lede">
        {pct(test.baseRate)} of people have it. The test catches <b>{pct(test.sensitivity)}</b> of real cases, and wrongly says
        yes to <b>{pct(test.falseAlarm)}</b> of healthy people.
      </p>

      <div className="pt-card">
        <label className="pt-lab" htmlFor="pt-guess">Chance you're actually sick?</label>
        <div className="pt-row">
          <span className="pt-guessval">{touched ? `${guess}%` : '?'}</span>
          <span className="pt-note">gut call, in pencil</span>
        </div>
        <input id="pt-guess" type="range" min={0} max={100} step={1} value={guess} onChange={(e) => setGuess(+e.target.value)} />
        <div className="pt-ends"><span>0%</span><span>50%</span><span>100%</span></div>
      </div>

      <div className="pt-card">
        <div className="pt-row">
          <b>Optional: paint who lights up positive</b>
          <span className="pt-seg" role="group" aria-label="brush">
            {brushes.map(([b, l]) => (
              <button key={b} aria-pressed={brush === b} onClick={() => setBrush(b)}>{l}</button>
            ))}
          </span>
        </div>
        <p className="pt-note">drag across the 1,000 people, or use the buttons</p>
        <PaintGrid classes={classes} onPaint={paint} label={`your sketch of 1,000 people: ${painted.sick} sick positives, ${painted.healthy} healthy positives`} />
        <div className="pt-adders">
          <span><i className="pt-sw sk" />positive &amp; sick <b className="pt-num">{painted.sick}</b></span>
          <span className="pt-ctl">
            <button className="pt-mini" aria-label="one fewer sick positive" onClick={() => add(1, -1)}>−1</button>
            <button className="pt-mini" aria-label="one more sick positive" onClick={() => add(1, 1)}>+1</button>
            <button className="pt-mini" aria-label="ten more sick positives" onClick={() => add(1, 10)}>+10</button>
          </span>
          <span><i className="pt-sw hp" />positive &amp; healthy <b className="pt-num">{painted.healthy}</b></span>
          <span className="pt-ctl">
            <button className="pt-mini" aria-label="one fewer healthy positive" onClick={() => add(2, -1)}>−1</button>
            <button className="pt-mini" aria-label="one more healthy positive" onClick={() => add(2, 1)}>+1</button>
            <button className="pt-mini" aria-label="ten more healthy positives" onClick={() => add(2, 10)}>+10</button>
          </span>
        </div>
        {total > 0 && (
          <p className="pt-small">
            Your sketch says <b className="pt-hl">{pct(painted.sick / total)}</b> of positives are sick ({painted.sick} of {total}).
          </p>
        )}
      </div>

      <button className="pt-btn pt-lock" disabled={!touched} onClick={onLock}>
        {touched ? `Lock in ${guess}%` : 'Move the slider to guess'}
      </button>
    </section>
  )
}

/** Who is sick / positive in a crowd of 1,000, from the fixed order. */
function crowdSets(t: Test) {
  const c = piles(t)
  const sick = ORDER.slice(0, c.sick)
  return { c, sick, tp: sick.slice(0, c.truePos), fp: ORDER.slice(c.sick, c.sick + c.falsePos) }
}

function RunStep({ test, guess, onNext }: { test: Test; guess: number; onNext: () => void }) {
  const { c, sick, tp, fp } = useMemo(() => crowdSets(test), [test])
  const [phase, setPhase] = useState(0)
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const run = () => {
    timers.current.forEach(clearTimeout)
    if (reducedMotion()) return setPhase(5)
    setPhase(1)
    timers.current = [900, 1900, 3400, 4500].map((ms, k) => window.setTimeout(() => setPhase(k + 2), ms))
  }

  const classes = useMemo(() => {
    const out = Array<string>(POP).fill(phase >= 4 ? 'fade' : '')
    if (phase >= 1) sick.forEach((i) => (out[i] = 'miss'))
    if (phase >= 2) tp.forEach((i) => (out[i] = 'tp'))
    if (phase >= 3) fp.forEach((i) => (out[i] = phase === 3 ? 'fp flash' : 'fp'))
    return out
  }, [phase, sick, tp, fp])

  const moves = useMemo(() => {
    const m = new Map<number, [number, number]>()
    if (phase < 4) return m
    tp.forEach((i, k) => m.set(i, [24 + (k % 3) * 12, 300 + Math.floor(k / 3) * 12]))
    fp.forEach((i, k) => m.set(i, [140 + (k % 10) * 12, 300 + Math.floor(k / 10) * 12]))
    return m
  }, [phase, tp, fp])

  const fpRows = Math.ceil(c.falsePos / 10)
  const sub =
    phase === 0 ? 'press the button'
    : phase === 1 ? `${c.sick} of ${POP.toLocaleString()} people are sick`
    : phase === 2 ? `${c.truePos} of the ${c.sick} sick test positive`
    : phase === 3 ? `…and ${c.falsePos} healthy people get a false alarm`
    : phase === 4 ? 'the positives fall into two piles'
    : null

  return (
    <section>
      <h2 className="pt-h">Test all 1,000.</h2>
      <div className="pt-row">
        <button className="pt-btn" onClick={run}>{phase === 0 ? 'Test everyone' : 'Test again'}</button>
      </div>
      <div className="pt-legend">
        <span><i className="pt-sw tp" />sick, positive</span>
        <span><i className="pt-sw miss" />sick, missed</span>
        <span><i className="pt-sw fp" />healthy, but positive</span>
        <span><i className="pt-sw plain" />healthy, negative</span>
      </div>
      <div className="pt-card pt-tight">
        <svg className="pt-grid" viewBox={`0 0 400 ${300 + fpRows * 12 + 10}`} role="img" aria-label="1,000 people tested; the positives move into two piles">
          <line className="pt-divider" x1={0} x2={400} y1={262} y2={262} />
          {phase >= 4 && (
            <>
              <text className="pt-pile-label" x={10} y={288}>{c.truePos} sick</text>
              <text className="pt-pile-label" x={134} y={288}>{c.falsePos} healthy</text>
              <text className="pt-hand-svg" x={392} y={318} textAnchor="end">false alarms,</text>
              <text className="pt-hand-svg" x={392} y={338} textAnchor="end">never sick</text>
            </>
          )}
          <Dots classes={classes} moves={moves} />
        </svg>
      </div>
      <div className="pt-readout" aria-live="polite">
        {phase === 5 ? (
          <>
            <span className="pt-big">{c.truePos} / {c.positives}</span>
            <span className="pt-sub">
              positives are actually sick. That's <b className="pt-hl">{pct(ppv(test))}</b> <span className="pt-tag">exact</span>
              <br />
              <span className="pt-pencil-text">you guessed {guess}%</span>
            </span>
          </>
        ) : (
          <>
            <span className="pt-big pt-dim">? / ?</span>
            <span className="pt-sub">{sub}</span>
          </>
        )}
      </div>
      {phase === 5 && <button className="pt-btn pt-go" onClick={onNext}>Compare with my guess →</button>}
    </section>
  )
}

function CompareStep(props: { guess: number; truth: number; painted: { sick: number; healthy: number }; test: Test; onNext: () => void }) {
  const { guess, truth, painted, test, onNext } = props
  const c = piles(test)
  const total = painted.sick + painted.healthy
  const share = total ? painted.sick / total : guess / 100
  const yourSick = Math.round(c.positives * share)
  const gapPts = Math.abs(guess - truth * 100)
  return (
    <section>
      <h2 className="pt-h">Your pile vs the real pile.</h2>
      <div className="pt-legend">
        <span><i className="pt-l you" />your guess</span>
        <span><i className="pt-l truth" />reality</span>
        <span><i className="pt-l gap" />the gap</span>
      </div>
      <div className="pt-card">
        <GuessBar guess={guess} truth={truth} />
        <p className="pt-hand">{gapPts < 1 ? 'right on it' : `${gapPts.toFixed(1)} points of gap`}</p>
      </div>
      <div className="pt-card">
        <p className="pt-small">The {c.positives} people who tested positive, split {total ? 'the way you painted them' : 'the way you guessed'} vs for real:</p>
        <PileCompare yourSick={yourSick} truePos={c.truePos} positives={c.positives} />
        <p className="pt-hand">
          <span className="pt-hl">these {c.falsePos} were never sick</span> <span className="pt-note">false alarms from {c.healthy} healthy people</span>
        </p>
      </div>
      <button className="pt-btn pt-go" onClick={onNext}>Now change the crowd →</button>
    </section>
  )
}

function CrowdStep({ card, guess, onNext }: { card: Test; guess: number; onNext: () => void }) {
  const [slider, setSlider] = useState(() => baseToSlider(card.baseRate))
  const [fa, setFa] = useState(Math.round(card.falseAlarm * 100))
  const t: Test = { ...card, baseRate: sliderToBase(slider), falseAlarm: fa / 100 }
  const p = ppv(t)
  const c = piles(t)
  const classes = useMemo(() => {
    const { sick, tp, fp } = crowdSets({ ...card, baseRate: sliderToBase(slider), falseAlarm: fa / 100 })
    const out = Array<string>(POP).fill('')
    sick.forEach((i) => (out[i] = 'miss'))
    tp.forEach((i) => (out[i] = 'tp'))
    fp.forEach((i) => (out[i] = 'fp'))
    return out
  }, [card, slider, fa])
  const be = breakEven(t)
  const pos = (b: number) => baseToSlider(b) / 1000
  const ticks: [number, string][] = [[0.001, '0.1%'], [card.baseRate, `${pct(card.baseRate)} card`], [0.5, '50%']]
  // The coin-flip tick moves with the false alarm rate; drop it when it would sit on another label.
  if (ticks.every(([b]) => Math.abs(pos(b) - pos(be)) > 0.18)) ticks.splice(2, 0, [be, `${pct(be)} coin flip`])
  return (
    <section>
      <h2 className="pt-h">Same test. Change the crowd.</h2>
      <div className="pt-card">
        <label className="pt-lab" htmlFor="pt-base">How common it is: <span className="pt-num pt-hl">{pct(t.baseRate)}</span></label>
        <input id="pt-base" type="range" min={0} max={1000} step={1} value={slider} onChange={(e) => setSlider(+e.target.value)} aria-valuetext={`${pct(t.baseRate)} of people sick`} />
        <div className="pt-logticks" aria-hidden="true">
          {ticks.map(([b, l]) => (
            <span key={l} style={{ left: `${pos(b) * 100}%` }}>{l}</span>
          ))}
        </div>
        <label className="pt-lab" htmlFor="pt-fa">False alarm rate: <span className="pt-num">{fa}%</span></label>
        <input id="pt-fa" type="range" min={1} max={30} step={1} value={fa} onChange={(e) => setFa(+e.target.value)} />
        <div className="pt-ends"><span>1%</span><span>30%</span></div>
        <div className="pt-presets">
          <button className="pt-mini wide" onClick={() => setSlider(0)}>rare (0.1%)</button>
          <button className="pt-mini wide" onClick={() => (setSlider(baseToSlider(card.baseRate)), setFa(Math.round(card.falseAlarm * 100)))}>the card</button>
          <button className="pt-mini wide" onClick={() => setSlider(1000)}>common (50%)</button>
        </div>
      </div>
      <div className="pt-readout" aria-live="polite">
        <span className="pt-big">{c.truePos} / {c.positives}</span>
        <span className="pt-sub">
          positives are sick · <b className="pt-num">{pct(p)}</b> <span className="pt-tag">exact</span>
          <br />
          <span className={`pt-pill ${p >= 0.5 ? 'ok' : ''}`}>{p >= 0.5 ? 'positive = probably sick' : "don't trust it yet"}</span>
        </span>
      </div>
      <div className="pt-card pt-tight">
        <svg className="pt-grid" viewBox="0 0 400 250" role="img" aria-label={`1,000 people at ${pct(t.baseRate)} sick: ${c.truePos} true and ${c.falsePos} false positives`}>
          <Dots classes={classes} />
        </svg>
      </div>
      <div className="pt-card">
        <p className="pt-small"><b>Chance you're sick if positive</b>, for every crowd</p>
        <CrowdCurve test={t} guess={guess} cardBase={card.baseRate} />
        <p className="pt-small pt-center">how common it is (log scale)</p>
        <p className="pt-hand">
          <span className="pt-hl">the test didn't change, the crowd did.</span>{' '}
          <span className="pt-note">past {pct(be)} sick, a positive means more likely sick than not.</span>
        </p>
      </div>
      <button className="pt-btn pt-go" onClick={onNext}>What did I get wrong? →</button>
    </section>
  )
}

type CardProps = {
  guess: number
  truth: number
  test: Test
  round: NonNullable<ReturnType<typeof showcaseRound>>
  item: NonNullable<ReturnType<typeof showcaseRound>>['items'][number]
  onDone: () => void
}

function CardStep({ guess, truth, test, round, item, onDone }: CardProps) {
  const answer = { value: guess, optionId: null, confidence: 'guessing' as const }
  const v = verdictFor(item, answer, truth * 100) // truth in the slider's units (%)
  const mid = misconceptionFor(item, answer)
  const m = round.misconceptions.find((x) => x.id === mid)
  const c = piles(test)
  const ratio = Math.round(c.falsePos / Math.max(1, c.truePos))
  const stamp = v === 'called' ? 'called it' : v === 'close' ? 'close' : 'way off'
  const [g2, setG2] = useState(50)
  const [shown, setShown] = useState(false)
  const second = secondTest(test)
  return (
    <section>
      <div className="pt-card pt-verdict">
        <div className="pt-verdict-top">
          <div>
            <div className="pt-k">you said {guess}% · reality {pct(truth)}</div>
            <div className="pt-named"><span className="pt-hl">{m ? m.label : 'You counted the crowd'}</span></div>
          </div>
          <span className={`pt-stamp ${v}`}>{stamp}</span>
        </div>
        {!m && <p>You said {guess}%. You weighed the <b>{c.falsePos}</b> false alarms against the <b>{c.truePos}</b> real hits.</p>}
        {m?.id === 'accuracy-is-my-chance' && (
          <p>
            You said {guess}%: you read the test's accuracy as your chance and skipped the <b>{c.healthy}</b> healthy people.{' '}
            {pct(test.falseAlarm)} of them is <b>{c.falsePos}</b> false alarms, next to only <b>{c.truePos}</b> real cases.
          </p>
        )}
        {m?.id === 'ignores-false-alarms' && (
          <p>
            You said {guess}%: you saw the false alarms but shrank them. {pct(test.falseAlarm)} of {c.healthy} is <b>{c.falsePos}</b> people,
            about {ratio} times the {c.truePos} real cases.
          </p>
        )}
        {m && (
          <>
            <p className="pt-hand">why it felt right: {m.why_tempting}</p>
            <p>{m.refutation}</p>
            <p className="pt-src">
              {m.source_url ? <>Source: <a href={m.source_url} target="_blank" rel="noreferrer">{m.source_note}</a></> : m.source_note}
            </p>
          </>
        )}
      </div>

      <div className="pt-next">
        <div className="pt-k">next challenge</div>
        <p><b>You test positive again, on a second, independent test.</b> Now what's the chance? Guess first.</p>
        <label className="pt-lab" htmlFor="pt-g2">Your guess: <span className="pt-num">{g2}%</span></label>
        <input id="pt-g2" type="range" min={0} max={100} step={1} value={g2} onChange={(e) => (setG2(+e.target.value), setShown(false))} />
        {shown ? (
          <p>
            Reality: <b className="pt-hl">{pct(second)}</b> <span className="pt-tag">exact</span>. After one positive you're in a crowd where {pct(truth)} are
            sick, so the second test starts from that crowd, not from {pct(test.baseRate)}.
          </p>
        ) : (
          <button className="pt-btn" onClick={() => setShown(true)}>Show me</button>
        )}
      </div>
      <button className="pt-btn pt-go" onClick={onDone}>Done</button>
    </section>
  )
}
