import { useEffect, useMemo, useRef, useState } from 'react'
import { record as save } from '../../notebook'
import { showcaseRound } from '../../rounds'
import { misconceptionFor } from '../../verdict'
import { EndBar, Frame, LockButton, SessionHead, StampRow, Title } from '../../components/session/Shell'
import { Compare, type CompareAnswer, type CompareOption } from '../../components/session/Compare'
import { cardGuide, lockLabel } from '../../components/session/copy'
import { rematchVerdict, shellVerdict } from '../../components/session/verdict'
import { AlarmArray, CrowdCurve, GuessBar, MiniPile, PileCompare } from './Charts'
import { DotCanvas, PaintGrid, type Kind } from './Crowd'
import { BAG_DAY, BAGS, baseToSlider, breakEven, CARD, exact, pct, piles, POP, ppv, REMATCH, seededOrder, sliderToBase, type Test } from './math'
import './positive.css'

const ORDER = seededOrder()
const STEPS = ['Your guess', 'Test all 1,000', 'Your pile vs real', 'Change the crowd', 'Your mistake', 'Same idea, new case', 'Rematch'] as const
const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** The verdict's "close" window: 15% of the 0-100 slider, in points. */
const WINDOW = 15

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

  const [step, setStep] = useState(1)
  const [reached, setReached] = useState(1)
  const go = (n: number) => {
    setStep(n)
    setReached((r) => Math.max(r, n))
  }
  const [guess, setGuess] = useState(50)
  const [touched, setTouched] = useState(false)
  const [cmp, setCmp] = useState<CompareAnswer | null>(null)
  const [sketch, setSketch] = useState<Brush[]>(() => Array(POP).fill(0))
  const painted = useMemo(() => ({ sick: sketch.filter((v) => v === 1).length, healthy: sketch.filter((v) => v === 2).length }), [sketch])

  const title = useRef<HTMLHeadingElement>(null)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) return void (first.current = false)
    window.scrollTo?.({ top: 0 })
    title.current?.focus({ preventScroll: true })
  }, [step])

  // Guidance lines: exact wording from the P1-P6 table in docs/experience.md.
  const TITLES: [string, string][] = [
    ['You tested positive.', "Guess first: you tested positive. What's the chance you actually have it? Your guess stays on screen."],
    ['Test all 1,000.', 'Here are 1,000 people; 10 are sick. Test everyone and watch who comes up positive.'],
    ['Your pile vs the real pile.', 'These are all the positives. Tap a few: how many are actually sick?'],
    ['Same test. Change the crowd.', 'Drag how common the condition is. Watch what a positive result really means change.'],
    ['What happened in your head', cardGuide(misconceptionId(item, guess) === null)],
    ['One more case: airport bags', "A bag scanner next to your test. Look at both: what's the same about how they work?"],
    ['Rematch', 'Same test, new numbers: does the idea stick?'],
  ]
  const [h, sub] = TITLES[step - 1]

  return (
    <Frame className="pt">
      {/* step dots navigate like coin's: any step you've reached, never back to the locked guess */}
      <SessionHead chip="Positive test" step={step} total={TITLES.length} labels={STEPS} canGo={(i) => i > 0 && i < reached} onGo={(i) => go(i + 1)}
        // Ask panel: P1 is before lock-in; the rematch (P6) has its own guess, so it stays hint-only.
        help={{ screen: `P${step}`, locked: step > 1 && step < 6, guess: step < 6 && touched ? guess : null }}
      >
        {step > 1 && (
          <span className="pt-pencil-chip">
            your guess: <b>{guess}%</b>
            {painted.sick + painted.healthy > 0 && <> · sketch: {painted.sick} sick of {painted.sick + painted.healthy}</>}
          </span>
        )}
      </SessionHead>
      <Title h={h} sub={sub} headingRef={title} />

      {step === 1 && (
        <GuessStep
          test={test}
          guess={guess}
          touched={touched}
          setGuess={(v) => (setGuess(v), setTouched(true))}
          sketch={sketch}
          setSketch={setSketch}
          painted={painted}
          onLock={() => go(2)}
        />
      )}
      {step === 2 && <RunStep test={test} guess={guess} onNext={() => go(3)} />}
      {step === 3 && <CompareStep guess={guess} truth={truth} painted={painted} test={test} onNext={() => go(4)} />}
      {step === 4 && <CrowdStep card={test} guess={guess} onNext={() => go(5)} />}
      {step === 5 && <CardStep guess={guess} truth={truth} test={test} round={round} item={item} onNext={() => go(6)} />}
      {step === 6 && <BagsCompare test={test} onAnswer={setCmp} onNext={() => go(7)} />}
      {step === 7 && (
        <RematchStep
          onReveal={(g2) =>
            save({
              session: 'positive-test',
              at: new Date().toISOString(),
              guess,
              misconception: misconceptionId(item, guess),
              rematch: rematchOf(g2) === 'off' ? 'wrong' : 'right',
              rematchGuess: g2,
              rematchTruth: Math.round(ppv(REMATCH) * 1000) / 10,
              ...(cmp ? { comparePick: cmp.pick, compareRight: cmp.right, ...(cmp.text ? { compareText: cmp.text } : {}) } : {}),
            })
          }
          caught={round.misconceptions.find((x) => x.id === misconceptionId(item, guess))?.label ?? null}
          onDone={onDone}
        />
      )}
    </Frame>
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
  const kinds = useMemo(() => sketch.map((v): Kind => (v === 1 ? 'sk' : v === 2 ? 'hp' : '')), [sketch])
  const total = painted.sick + painted.healthy
  const brushes: [Brush, string][] = [[1, 'sick +'], [2, 'healthy +'], [0, 'erase']]

  return (
    <section className="pt-guessgrid">
      <div className="pt-card pt-guess">
        <p className="pt-lede">
          {pct(test.baseRate)} of people have it. The test catches <b>{pct(test.sensitivity)}</b> of real cases and wrongly says yes to <b>{pct(test.falseAlarm)}</b> of healthy people.
        </p>
        <label className="pt-lab" htmlFor="pt-guess">Chance you're actually sick?</label>
        <div className="pt-row">
          <span className="pt-guessval" aria-live="polite">{touched ? `${guess}%` : '?'}</span>
          <span className="pt-note">your guess, in pencil</span>
        </div>
        <input id="pt-guess" type="range" min={0} max={100} step={1} value={guess} onChange={(e) => setGuess(+e.target.value)} />
        <div className="pt-ends"><span>0%</span><span>50%</span><span>100%</span></div>
        <LockButton ready={touched} onLock={onLock}>{lockLabel(touched)}</LockButton>
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
    <section className="pt-split pt-run">
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
                positives are actually sick. That's <b className="pt-truthnum">{exact(ppv(test))}</b> <span className="pt-tag">exact</span>
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
      <div className="pt-after">
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
              positives are sick · <b className="pt-truthnum">{exact(p)}</b> <span className="pt-tag">exact</span>
              <br />
              <span className={`pt-badge ${p >= 0.5 ? 'ok' : ''}`}>{p >= 0.5 ? 'positive = probably sick' : "don't trust it yet"}</span>
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

type ItemT = NonNullable<ReturnType<typeof showcaseRound>>['items'][number]
// The band lookup only reads the value; confidence never changes which mistake a guess names.
const misconceptionId = (item: ItemT, guess: number) => misconceptionFor(item, { value: guess, optionId: null, confidence: 'pretty sure' })

type CardProps = {
  guess: number
  truth: number
  test: Test
  round: NonNullable<ReturnType<typeof showcaseRound>>
  item: ItemT
  onNext: () => void
}

function CardStep({ guess, truth, test, round, item, onNext }: CardProps) {
  const mid = misconceptionId(item, guess)
  const v = shellVerdict(mid, guess, truth * 100, WINDOW) // truth in the slider's units (%)
  const m = round.misconceptions.find((x) => x.id === mid)
  const c = piles(test)
  const ratio = Math.round(c.falsePos / Math.max(1, c.truePos))
  return (
    <section>
      <StampRow v={v}>
        <p>
          You said <b className="pt-pencil-c pt-num">{guess}%</b>. It's
        </p>
        <span className="pt-reality pt-num">{exact(truth)}</span>
      </StampRow>
      <div className="pt-card pt-verdict">
        <div className={`pt-k ${m ? 'pt-red' : ''}`}>{m ? 'the mistake' : 'the right model'}</div>
        <h3 className="pt-named">{m ? <>“<span className="pt-hl">{m.label}</span>”</> : <>You counted the <span className="pt-hl">whole crowd</span>.</>}</h3>
        {!m && (
          <p>
            You said {guess}%: you weighed the <b>{c.falsePos}</b> false alarms against the <b>{c.truePos}</b> real hits.
          </p>
        )}
        {m?.id === 'positive-barely-matters' && (
          <p>
            You said {guess}%: you read the positive as almost meaningless. But <b>{c.truePos}</b> of the <b>{c.positives}</b> positives really are sick:
            a positive takes you from {pct(test.baseRate)} to {exact(truth)}, about {Math.round(truth / test.baseRate)} times more likely.
          </p>
        )}
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
            <p><b>Why it's tempting:</b> {m.why_tempting}</p>
            <p><b>The right model:</b> {m.refutation}</p>
            <p className="pt-src">
              {m.source_url ? <>Source: <a href={m.source_url} target="_blank" rel="noreferrer">{m.source_note}</a></> : m.source_note}
            </p>
          </>
        )}
      </div>
      <button className="pt-btn pt-go" onClick={onNext}>One more case →</button>
    </section>
  )
}

/** Stamp for the rematch: "called it" within 5 points, then the same close rule as the first guess (#151). */
const rematchOf = (g: number) => rematchVerdict(g, ppv(REMATCH) * 100, 5, WINDOW)

function RematchStep({ onReveal, caught, onDone }: { onReveal: (g: number) => void; caught: string | null; onDone: () => void }) {
  const t = REMATCH
  const truth = ppv(t)
  const c = piles(t)
  const [g, setG] = useState(50)
  const [moved, setMoved] = useState(false)
  const [shown, setShown] = useState(false)
  const v = rematchOf(g)
  return (
    <section>
      <div className="pt-card pt-guess">
        <p className="pt-lede">
          New numbers. <b>{pct(t.baseRate)}</b> of people have it. The test catches <b>{pct(t.sensitivity)}</b> of real cases and wrongly says yes to <b>{pct(t.falseAlarm)}</b> of healthy people. You test positive.
        </p>
        <label className="pt-lab" htmlFor="pt-g2">Chance you're actually sick?</label>
        <div className="pt-row">
          <span className="pt-guessval" aria-live="polite">{moved ? `${g}%` : '?'}</span>
          <span className="pt-note">in pencil</span>
        </div>
        <input id="pt-g2" type="range" min={0} max={100} step={1} value={g} disabled={shown} onChange={(e) => (setG(+e.target.value), setMoved(true))} />
        <div className="pt-ends"><span>0%</span><span>50%</span><span>100%</span></div>
        {!shown && (
          <LockButton
            ready={moved}
            onLock={() => {
              setShown(true)
              onReveal(g)
            }}
          >
            {lockLabel(moved)}
          </LockButton>
        )}
      </div>
      {shown && (
        <>
          <StampRow v={v} className="pt-mt">
            <p>You said <b className="pt-pencil-c pt-num">{g}%</b>. It's</p>
            <span className="pt-reality pt-num">{exact(truth)}</span>
          </StampRow>
          <div className="pt-two">
            <div className="pt-card">
              <GuessBar guess={g} truth={truth} />
            </div>
            <div className="pt-card">
              <p className="pt-small pt-top0">Of 1,000 people, {c.positives} test positive: {c.truePos} sick, {c.falsePos} false alarms.</p>
              <MiniPile truePos={c.truePos} positives={c.positives} />
            </div>
          </div>
          <EndBar caught={caught} rematch={v === 'called' ? 'right' : v === 'close' ? 'close' : 'wrong'} remix="Come back tomorrow for a remix: same idea, a different crowd." onDone={onDone} />
        </>
      )}
    </section>
  )
}

const bagDay = piles(BAGS, BAG_DAY)
const BAG_OPTIONS: CompareOption[] = [
  {
    id: 'accuracy',
    text: '99% accurate, so an alarm is 99% real',
    why: `99% is how many bags with something it catches. Of all ${bagDay.positives.toLocaleString('en-US')} alarms, only ${exact(ppv(BAGS))} are real.`,
  },
  {
    id: 'too-rare',
    text: 'False alarms are too rare to matter',
    why: `2% of ${bagDay.healthy.toLocaleString('en-US')} clean bags is ${bagDay.falsePos.toLocaleString('en-US')} false alarms, about ${Math.round(bagDay.falsePos / bagDay.truePos)} times the ${bagDay.truePos} real ones.`,
  },
  { id: 'rare-swamps', text: 'Rare thing + small false-alarm rate = mostly false alarms', right: true },
  {
    id: 'bad-test',
    text: 'Both tests are just bad',
    why: 'Both catch nearly every real case. Make the thing common and the same test works fine (step 4).',
  },
]

function BagsCompare({ test, onAnswer, onNext }: { test: Test; onAnswer: (a: CompareAnswer) => void; onNext: () => void }) {
  const c = piles(test)
  const b = bagDay
  const n = (x: number) => x.toLocaleString('en-US')
  return (
    <section>
      <Compare
        cases={[
          {
            tag: 'case 1: your test',
            title: `${n(POP)} people, ${pct(test.baseRate)} sick`,
            body: (
              <>
                <MiniPile truePos={c.truePos} positives={c.positives} />
                <p>
                  <span className="pt-big pt-num">{c.truePos} / {c.positives}</span>{' '}
                  <span className="pt-note">positives are sick: {exact(ppv(test))}</span>
                </p>
                <p className="pt-small">{pct(test.falseAlarm)} false alarms on {n(c.healthy)} healthy people = <b>{c.falsePos}</b>.</p>
              </>
            ),
          },
          {
            tag: 'case 2: an airport bag scanner',
            title: `${n(BAG_DAY)} bags, 1 in ${n(Math.round(1 / BAGS.baseRate))} has something`,
            body: (
              <>
                <AlarmArray real={b.truePos} falseAlarms={b.falsePos} />
                <div className="pt-legend pt-top0">
                  <span><i className="pt-sw tp" />alarm, something there</span>
                  <span><i className="pt-sw fp" />false alarm</span>
                </div>
                <p>
                  <span className="pt-big pt-num">{b.truePos} / {n(b.positives)}</span>{' '}
                  <span className="pt-note">alarms are real: {exact(ppv(BAGS))}</span>
                </p>
                <p className="pt-small">
                  It flags {pct(BAGS.sensitivity)} of bags with something; {pct(BAGS.falseAlarm)} of {n(b.healthy)} clean bags = <b>{n(b.falsePos)}</b> false alarms.
                </p>
                <p className="cmp-fine">Every dot is one alarm. Illustrative numbers, not real airport data; counts and % computed exactly.</p>
              </>
            ),
          },
        ]}
        options={BAG_OPTIONS}
        principle="When the thing is rare, even a small false-alarm rate makes most alarms false."
        detail={
          <>
            Your test: {c.falsePos} false alarms next to {c.truePos} real cases. The scanner: {n(b.falsePos)} next to {b.truePos}. A rare thing means a huge
            crowd of the clean or healthy, and a small slice of a huge crowd outnumbers the real hits.
          </>
        }
        onAnswer={onAnswer}
      >
        <button className="pt-btn pt-go" onClick={onNext}>Rematch: new numbers →</button>
      </Compare>
    </section>
  )
}
