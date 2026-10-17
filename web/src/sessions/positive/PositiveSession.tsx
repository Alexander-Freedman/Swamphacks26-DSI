import { useEffect, useMemo, useRef, useState } from 'react'
import { showcaseRound } from '../../rounds'
import { misconceptionFor, verdictFor, verdictText } from '../../verdict'
import { CrowdCurve, GuessBar, PileCompare } from './Charts'
import { DotCanvas, PaintGrid, type Kind } from './Crowd'
import { baseToSlider, breakEven, CARD, pct, piles, POP, ppv, secondTest, seededOrder, sliderToBase, type Test } from './math'
import './positive.css'

const ORDER = seededOrder()
const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

export type Confidence = 'unsure' | 'pretty sure' | 'certain'
const CONFS: Confidence[] = ['unsure', 'pretty sure', 'certain']

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

function save(entry: object) {
  try {
    const key = 'mm.sessions'
    const all = JSON.parse(localStorage.getItem(key) ?? '[]') as object[]
    localStorage.setItem(key, JSON.stringify([...all, entry].slice(-50)))
  } catch {
    // private mode or blocked storage: the session still ends fine
  }
}

export function PositiveSession({ onDone }: { onDone: () => void }) {
  const round = showcaseRound('positive-test')!
  const item = round.items[0]
  const test = useMemo(() => cardTest(), [])
  const truth = ppv(test)

  const [step, setStep] = useState(1)
  const [guess, setGuess] = useState(50)
  const [touched, setTouched] = useState(false)
  const [conf, setConf] = useState<Confidence | null>(null)
  const [sketch, setSketch] = useState<Brush[]>(() => Array(POP).fill(0))
  const painted = useMemo(() => ({ sick: sketch.filter((v) => v === 1).length, healthy: sketch.filter((v) => v === 2).length }), [sketch])

  const title = useRef<HTMLHeadingElement>(null)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) return void (first.current = false)
    window.scrollTo?.({ top: 0 })
    title.current?.focus({ preventScroll: true })
  }, [step])

  const TITLES: [string, string][] = [
    ['You tested positive.', `${pct(test.baseRate)} of people have it. The test catches ${pct(test.sensitivity)} of real cases and wrongly says yes to ${pct(test.falseAlarm)} of healthy people. Guess first: your guess stays on screen so you can check it later.`],
    ['Test all 1,000.', 'Run the same test on 1,000 people and watch where the positives come from.'],
    ['Your pile vs the real pile.', 'Your guess in pencil, reality in ink, the gap in marker.'],
    ['Same test. Change the crowd.', 'Drag how common it is. The test stays the same; watch the piles and the chance move.'],
    ['What happened in your head', 'The mistake your guess points to, and the one idea that fixes it.'],
  ]
  const [h, sub] = TITLES[step - 1]

  return (
    <div className="pt">
      <div className="pt-head">
        <span className="pt-chip">Positive test</span>
        <span className="pt-dots-steps" aria-label={`step ${step} of 5`}>
          {TITLES.map((_, i) => (
            <i key={i} className={i < step ? 'on' : ''} />
          ))}
        </span>
        <span className="pt-count">{step} of 5</span>
        {step > 1 && (
          <span className="pt-pencil-chip">
            your guess: <b>{guess}%</b>
            {painted.sick + painted.healthy > 0 && <> · sketch: {painted.sick} sick of {painted.sick + painted.healthy}</>}
          </span>
        )}
      </div>
      <h2 className="pt-title" ref={title} tabIndex={-1}>{h}</h2>
      <p className="pt-subtitle">{sub}</p>

      {step === 1 && (
        <GuessStep
          guess={guess}
          touched={touched}
          setGuess={(v) => (setGuess(v), setTouched(true))}
          conf={conf}
          setConf={setConf}
          sketch={sketch}
          setSketch={setSketch}
          painted={painted}
          onLock={() => setStep(2)}
        />
      )}
      {step === 2 && <RunStep test={test} guess={guess} onNext={() => setStep(3)} />}
      {step === 3 && <CompareStep guess={guess} truth={truth} painted={painted} test={test} onNext={() => setStep(4)} />}
      {step === 4 && <CrowdStep card={test} guess={guess} onNext={() => setStep(5)} />}
      {step === 5 && <CardStep guess={guess} conf={conf} truth={truth} test={test} round={round} item={item} onDone={onDone} />}

      {step > 2 && (
        <button className="pt-back" onClick={() => setStep(step - 1)}>
          ← back
        </button>
      )}
    </div>
  )
}

function GuessStep(props: {
  guess: number
  touched: boolean
  setGuess: (v: number) => void
  conf: Confidence | null
  setConf: (c: Confidence) => void
  sketch: Brush[]
  setSketch: (f: (s: Brush[]) => Brush[]) => void
  painted: { sick: number; healthy: number }
  onLock: () => void
}) {
  const { guess, touched, setGuess, conf, setConf, sketch, setSketch, painted, onLock } = props
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
  const kinds = useMemo(() => sketch.map((v): Kind => (v === 1 ? 'sk' : v === 2 ? 'hp' : '')), [sketch])
  const total = painted.sick + painted.healthy
  const brushes: [Brush, string][] = [[1, 'sick +'], [2, 'healthy +'], [0, 'erase']]

  return (
    <section className="pt-guessgrid">
      <div className="pt-card pt-guess">
        <label className="pt-lab" htmlFor="pt-guess">Chance you're actually sick?</label>
        <div className="pt-row">
          <span className="pt-guessval" aria-live="polite">{touched ? `${guess}%` : '?'}</span>
          <span className="pt-note">gut call, in pencil</span>
        </div>
        <input id="pt-guess" type="range" min={0} max={100} step={1} value={guess} onChange={(e) => setGuess(+e.target.value)} />
        <div className="pt-ends"><span>0%</span><span>50%</span><span>100%</span></div>
        <div className="pt-k pt-mt">how sure? <span className="pt-opt">optional</span></div>
        <div className="pt-choices" role="group" aria-label="how sure are you">
          {CONFS.map((c) => (
            <button key={c} className="pt-choice" aria-pressed={conf === c} onClick={() => setConf(c)}>{c}</button>
          ))}
        </div>
        <button className="pt-btn pt-lock" disabled={!touched} onClick={onLock}>
          {touched ? `Lock in ${guess}%` : 'Move the slider to guess'}
        </button>
      </div>

      <details className="pt-card pt-sketch">
        <summary><b>Optional: paint who lights up positive</b></summary>
        <div className="pt-row pt-mt">
          <span className="pt-seg" role="group" aria-label="brush">
            {brushes.map(([b, l]) => (
              <button key={b} aria-pressed={brush === b} onClick={() => setBrush(b)}>{l}</button>
            ))}
          </span>
        </div>
        <p className="pt-note">drag across the 1,000 people, or use the buttons</p>
        <PaintGrid kinds={kinds} onPaint={paint} label={`your sketch of 1,000 people: ${painted.sick} sick positives, ${painted.healthy} healthy positives`} />
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
      </details>
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

  const kinds = useMemo(() => {
    const out = Array<Kind>(POP).fill(phase >= 4 ? 'fade' : '')
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
  const narr =
    phase === 0 ? 'Same test, 1,000 people.'
    : phase === 1 ? `${c.sick} of ${POP.toLocaleString('en-US')} people are sick`
    : phase === 2 ? `${c.truePos} of the ${c.sick} sick test positive`
    : phase === 3 ? `…and ${c.falsePos} healthy people get a false alarm`
    : 'the positives fall into two piles'
  const running = phase > 0 && phase < 5

  return (
    <section className="pt-split">
      <div className="pt-side">
        {phase !== 5 && (
          <button className="pt-btn pt-go pt-test" onClick={run} disabled={running}>
            {phase === 0 ? 'Test everyone' : 'Testing…'}
          </button>
        )}
        <div className="pt-readout" aria-live="polite">
          {phase === 5 ? (
            <>
              <span className="pt-big">{c.truePos} / {c.positives}</span>
              <span className="pt-sub">
                positives are actually sick. That's <b className="pt-truthnum">{pct(ppv(test))}</b> <span className="pt-tag">exact</span>
                <br />
                <span className="pt-pencil-text">you guessed {guess}%</span>
              </span>
            </>
          ) : (
            <>
              <span className="pt-big pt-dim">? / ?</span>
              <span className="pt-sub">{narr}</span>
            </>
          )}
        </div>
        <div className="pt-legend">
          <span><i className="pt-sw tp" />sick, positive</span>
          <span><i className="pt-sw miss" />sick, missed</span>
          <span><i className="pt-sw fp" />healthy, but positive</span>
          <span><i className="pt-sw plain" />healthy, negative</span>
        </div>
        {phase === 5 && (
          <div className="pt-row pt-start">
            <button className="pt-btn pt-go" onClick={onNext}>Compare with my guess →</button>
            <button className="pt-btn pt-ghost pt-sm" onClick={run}>replay</button>
          </div>
        )}
      </div>
      <div className="pt-card pt-tight pt-gridcard">
        <DotCanvas kinds={kinds} moves={moves} height={300 + fpRows * 12 + 10} label="1,000 people tested; the positives move into two piles">
          <line className="pt-divider" x1={0} x2={400} y1={262} y2={262} />
          {phase >= 4 && (
            <>
              <text className="pt-pile-label" x={10} y={288}>{c.truePos} sick</text>
              <text className="pt-pile-label" x={134} y={288}>{c.falsePos} healthy</text>
              <text className="pt-hand-svg" x={392} y={318} textAnchor="end">false alarms,</text>
              <text className="pt-hand-svg" x={392} y={338} textAnchor="end">never sick</text>
            </>
          )}
        </DotCanvas>
      </div>
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
      <div className="pt-legend">
        <span><i className="pt-l you" />your guess</span>
        <span><i className="pt-l truth" />reality</span>
        <span><i className="pt-l gap" />the gap</span>
      </div>
      <div className="pt-two">
        <div className="pt-card">
          <GuessBar guess={guess} truth={truth} />
          <p className="pt-hand">{gapPts < 1 ? 'right on it' : `${gapPts.toFixed(1)} points of gap`}</p>
        </div>
        <div className="pt-card">
          <p className="pt-small pt-top0">The {c.positives} people who tested positive, split {total ? 'the way you painted them' : 'the way you guessed'} vs for real:</p>
          <PileCompare yourSick={yourSick} truePos={c.truePos} positives={c.positives} />
          <p className="pt-hand">
            <span className="pt-hl">these {c.falsePos} were never sick</span> <span className="pt-note">false alarms from {c.healthy} healthy people</span>
          </p>
        </div>
      </div>
      <button className="pt-btn pt-go" onClick={onNext}>Now change the crowd →</button>
    </section>
  )
}

function CrowdStep({ card, guess, onNext }: { card: Test; guess: number; onNext: () => void }) {
  const [slider, setSlider] = useState(() => baseToSlider(card.baseRate))
  const [fa, setFa] = useState(Math.round(card.falseAlarm * 100))
  const t: Test = useMemo(() => ({ ...card, baseRate: sliderToBase(slider), falseAlarm: fa / 100 }), [card, slider, fa])
  const p = ppv(t)
  const c = piles(t)
  // only rebuild (and redraw) the crowd when a whole person changes pile, not on every slider pixel
  const kinds = useMemo(() => {
    const out = Array<Kind>(POP).fill('')
    const sick = ORDER.slice(0, c.sick)
    sick.forEach((i) => (out[i] = 'miss'))
    sick.slice(0, c.truePos).forEach((i) => (out[i] = 'tp'))
    ORDER.slice(c.sick, c.sick + c.falsePos).forEach((i) => (out[i] = 'fp'))
    return out
  }, [c.sick, c.truePos, c.falsePos])
  const be = breakEven(t)
  const pos = (b: number) => baseToSlider(b) / 1000
  const ticks: [number, string][] = [[0.001, '0.1%'], [card.baseRate, `${pct(card.baseRate)} card`], [0.5, '50%']]
  // The coin-flip tick moves with the false alarm rate; drop it when it would sit on another label.
  if (ticks.every(([b]) => Math.abs(pos(b) - pos(be)) > 0.18)) ticks.splice(2, 0, [be, `${pct(be)} coin flip`])
  return (
    <section>
      <div className="pt-split pt-crowd">
        <div className="pt-side">
          <div className="pt-card pt-controls">
            <label className="pt-lab" htmlFor="pt-base">How common it is: <span className="pt-num pt-hl">{pct(t.baseRate)}</span></label>
            <input id="pt-base" type="range" min={0} max={1000} step={1} value={slider} onChange={(e) => setSlider(+e.target.value)} aria-valuetext={`${pct(t.baseRate)} of people sick`} />
            <div className="pt-logticks" aria-hidden="true">
              {ticks.map(([b, l], k) => (
                <span key={k} style={{ left: `${pos(b) * 100}%` }}>{l}</span>
              ))}
            </div>
            <label className="pt-lab" htmlFor="pt-fa">False alarm rate: <span className="pt-num">{fa}%</span></label>
            <input id="pt-fa" type="range" min={1} max={30} step={1} value={fa} onChange={(e) => setFa(+e.target.value)} aria-valuetext={`${fa}% of healthy people test positive`} />
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
              positives are sick · <b className="pt-truthnum">{pct(p)}</b> <span className="pt-tag">exact</span>
              <br />
              <span className={`pt-pill ${p >= 0.5 ? 'ok' : ''}`}>{p >= 0.5 ? 'positive = probably sick' : "don't trust it yet"}</span>
            </span>
          </div>
        </div>
        <div className="pt-card pt-tight pt-gridcard">
          <DotCanvas kinds={kinds} label={`1,000 people at ${pct(t.baseRate)} sick: ${c.truePos} true and ${c.falsePos} false positives`} />
        </div>
      </div>
      <div className="pt-card">
        <p className="pt-small pt-top0"><b>Chance you're sick if positive</b>, for every crowd</p>
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
  conf: Confidence | null
  truth: number
  test: Test
  round: NonNullable<ReturnType<typeof showcaseRound>>
  item: NonNullable<ReturnType<typeof showcaseRound>>['items'][number]
  onDone: () => void
}

function CardStep({ guess, conf, truth, test, round, item, onDone }: CardProps) {
  const answer = { value: guess, optionId: null, confidence: conf === 'unsure' || !conf ? ('guessing' as const) : conf }
  const v = verdictFor(item, answer, truth * 100) // truth in the slider's units (%)
  const mid = misconceptionFor(item, answer)
  const m = round.misconceptions.find((x) => x.id === mid)
  const c = piles(test)
  const ratio = Math.round(c.falsePos / Math.max(1, c.truePos))
  const [g2, setG2] = useState(50)
  const [moved2, setMoved2] = useState(false)
  const [shown, setShown] = useState(false)
  const second = secondTest(test)
  const reveal = () => {
    if (shown) return
    setShown(true)
    save({ session: 'positive-test', at: new Date().toISOString(), guess, confidence: conf, misconception: m?.id ?? null, second: { guess: g2, truth: Math.round(second * 1000) / 10 } })
  }
  return (
    <section>
      <div className="pt-stamprow">
        <span className={`pt-stamp ${v}`}>{verdictText[v]}</span>
        <p className="pt-said">
          You said <b className="pt-pencil-c pt-num">{guess}%</b>{conf && <> ({conf})</>}. It's <span className="pt-hl pt-num"><b>{pct(truth)}</b></span>.
        </p>
      </div>
      <div className="pt-card pt-verdict">
        <div className={`pt-k ${m ? 'pt-red' : ''}`}>{m ? 'the mistake' : 'the right model'}</div>
        <h3 className="pt-named">{m ? <>“<span className="pt-hl">{m.label}</span>”</> : <>You counted the <span className="pt-hl">whole crowd</span>.</>}</h3>
        {!m && (
          <p>
            You weighed the <b>{c.falsePos}</b> false alarms against the <b>{c.truePos}</b> real hits.
            {guess < 5 && <> Not zero, though: {c.truePos} of the {c.positives} positives really are sick, so a positive still means a {pct(truth)} chance.</>}
          </p>
        )}
        {m?.id === 'accuracy-is-my-chance' && (
          <p>
            You read the test's accuracy as your chance and skipped the <b>{c.healthy}</b> healthy people.{' '}
            {pct(test.falseAlarm)} of them is <b>{c.falsePos}</b> false alarms, next to only <b>{c.truePos}</b> real cases.
          </p>
        )}
        {m?.id === 'ignores-false-alarms' && (
          <p>
            You saw the false alarms but shrank them. {pct(test.falseAlarm)} of {c.healthy} is <b>{c.falsePos}</b> people,
            about {ratio} times the {c.truePos} real cases.
          </p>
        )}
        {m && (
          <>
            <p><b>Why it's tempting:</b> {m.why_tempting}</p>
            <p><b>The right model:</b> {m.refutation}</p>
            <p className="pt-src">
              {m.source_url ? <>Source: <a href={m.source_url} target="_blank" rel="noreferrer">{m.source_note}</a></> : m.source_note}
            </p>
          </>
        )}
      </div>

      <div className="pt-next">
        <div className="pt-k">next challenge</div>
        <p><b>You test positive again, on a second, independent test.</b> Now what's the chance? Guess first.</p>
        <label className="pt-lab" htmlFor="pt-g2">Your guess: <span className="pt-num pt-pencil-c">{moved2 ? `${g2}%` : '?'}</span></label>
        <input id="pt-g2" type="range" min={0} max={100} step={1} value={g2} disabled={shown} onChange={(e) => (setG2(+e.target.value), setMoved2(true))} />
        {shown ? (
          <p>
            Reality: <b className="pt-hl">{pct(second)}</b> <span className="pt-tag">exact</span>. You said <span className="pt-pencil-c">{g2}%</span>. After one positive you're in a crowd where {pct(truth)} are
            sick, so the second test starts from that crowd, not from {pct(test.baseRate)}.
          </p>
        ) : (
          <button className="pt-btn" disabled={!moved2} onClick={reveal}>{moved2 ? `Lock in ${g2}% and show me` : 'Move the slider first'}</button>
        )}
      </div>
      {shown ? (
        <div className="pt-saved">
          <p>
            <b>Saved.</b> {m ? <>Caught: “{m.label}”.</> : 'Called it.'} Come back tomorrow for a remix: same test, a different crowd.
          </p>
          <button className="pt-btn pt-done" onClick={onDone}>Done</button>
        </div>
      ) : (
        <button className="pt-back" onClick={onDone}>skip, I'm done</button>
      )}
    </section>
  )
}
