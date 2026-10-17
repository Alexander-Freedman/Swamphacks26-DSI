import { useEffect, useMemo, useRef, useState } from 'react'
import { NOTEBOOK_HREF, record } from '../../notebook'
import { Frame, SessionHead, Title } from '../../components/session/Shell'
import { AreaChart, GuessBar, MiniRects, MiniTangent, PositionChart, VelocityChart } from './AreaCharts'
import {
  coverage, exactArea, f, F, fmt, fPrime, LABELS, mastered, nToSlider, ONE_RECT, readArea, readSketch, resample,
  riemann, sliderToN, X0, X1, type AreaRead, type Pt, type Rule, type SlopeRead,
} from './math'
import { reducedMotion, useWidth } from './plot'
import { SlopeChart } from './SlopeChart'
import { FINE, fineXs, pencilAt } from './slopeGeo'
import './calculus.css'

const STEPS = ['Draw the slope', 'Drag the tangent', 'Fill the area', 'Your mistake', 'Same idea twice'] as const

// One plain-language guidance line per screen.
const TITLES: [string, string][] = [
  ['Draw the slope.', 'This curve climbs, dips, then climbs again. In the bottom box, draw how steep it is along the way: above 0 is uphill, below 0 is downhill.'],
  ['Drag the tangent.', 'Drag the dot along the curve. The real slope draws itself over your pencil.'],
  ['Fill the area.', 'One rectangle says 7.5 squares. Drag your pencil to where you think the real area under the curve is.'],
  ['What your pencil says.', 'The idea your sketch and your guess point to, and the one-line fix.'],
  ['Same idea, twice.', 'Drag time on either graph. Watch which numbers match, then pick what the two have in common.'],
]

const slopeWord = (s: number) => (Math.abs(s) < 0.05 ? 'flat' : s > 0 ? 'uphill' : 'downhill')

export function CalculusSession({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(1)
  const [reached, setReached] = useState(1)
  const go = (n: number) => {
    setStep(n)
    setReached((r) => Math.max(r, n))
  }
  const [stroke, setStroke] = useState<Pt[]>([])
  const [sketch, setSketch] = useState<number[] | null>(null)
  const [guess, setGuess] = useState<number | null>(null)

  const slope = useMemo(() => (sketch ? readSketch(sketch) : null), [sketch])
  const area = useMemo(() => (guess != null ? readArea(guess) : null), [guess])

  const title = useRef<HTMLHeadingElement>(null)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) return void (first.current = false)
    window.scrollTo?.({ top: 0 })
    title.current?.focus({ preventScroll: true })
  }, [step])

  // Saved when the mistake card is reached, so leaving early still keeps it.
  const saved = useRef(false)
  useEffect(() => {
    if (step !== 4 || saved.current || !slope || !area || guess == null) return
    saved.current = true
    record({
      session: 'calculus',
      at: new Date().toISOString(),
      guess,
      misconception: slope.mistake ?? area.mistake ?? null,
      rematch: null,
      slopeMistake: slope.mistake,
      areaMistake: area.mistake,
      mastered: mastered(slope, area),
    })
  }, [step, slope, area, guess])

  const [h, sub] = TITLES[step - 1]
  // you can step back to anything you've reached, but not back into the sketch once it's been checked
  const canGo = (i: number) => i < reached && (i > 0 || reached === 1)

  return (
    <Frame className="calc">
      <SessionHead chip="Calculus" step={step} total={STEPS.length} labels={STEPS} canGo={canGo} onGo={(i) => go(i + 1)} />
      <Title h={h} sub={sub} headingRef={title} />
      {step === 1 && (
        <DrawStep
          stroke={stroke}
          setStroke={setStroke}
          onNext={() => {
            setSketch(resample(stroke))
            go(2)
          }}
        />
      )}
      {step === 2 && sketch && <TangentStep sketch={sketch} onNext={() => go(3)} />}
      {step === 3 && <AreaStep guess={guess} setGuess={setGuess} onNext={() => go(4)} />}
      {step === 4 && slope && area && guess != null && sketch && <CardStep slope={slope} area={area} guess={guess} sketch={sketch} onNext={() => go(5)} />}
      {step === 5 && slope && area && <CompareStep slope={slope} area={area} onDone={onDone} />}
    </Frame>
  )
}

/* ---------- 1: draw the slope ---------- */

function DrawStep({ stroke, setStroke, onNext }: { stroke: Pt[]; setStroke: (f: (p: Pt[]) => Pt[]) => void; onNext: () => void }) {
  const [ref, w] = useWidth<HTMLDivElement>(640)
  const cov = coverage(stroke)
  const ok = cov >= 0.6
  return (
    <section className="calc-split">
      <div className="calc-side">
        <div className="calc-card calc-readout calc-steady" aria-live="polite">
          <div className="calc-tag">your pencil</div>
          <div className={'calc-big' + (stroke.length ? '' : ' calc-dim')}>{Math.round(cov * 100)}%</div>
          <div className="calc-sub">{!stroke.length ? 'drawn. Nothing is graded.' : ok ? 'drawn. Draw again to redo.' : 'keep going across…'}</div>
        </div>
        <div className="calc-meter" aria-hidden="true">
          <i style={{ width: `${Math.round(cov * 100)}%` }} />
        </div>
      </div>
      <div className="calc-card calc-tight calc-main">
        <div ref={ref}>
          <SlopeChart
            w={w}
            stroke={stroke}
            hint={stroke.length ? undefined : 'draw here, left to right ✎'}
            label="drawing pad: draw the slope of the curve above, from x = 0 to 4"
            onDraw={{
              start: (p) => setStroke(() => [p]),
              move: (p) => setStroke((a) => [...a, p]),
              end: () => {},
            }}
          />
        </div>
      </div>
      <div className="calc-after calc-row">
        <button className="calc-btn calc-go" disabled={!ok} onClick={onNext}>Check it with a tangent →</button>
        {stroke.length > 0 && <button className="calc-btn calc-ghost" onClick={() => setStroke(() => [])}>clear</button>}
      </div>
    </section>
  )
}

/* ---------- 2: drag the tangent ---------- */

const idx = (x: number) => Math.round(((x - X0) / (X1 - X0)) * (FINE - 1))

function TangentStep({ sketch, onNext }: { sketch: number[]; onNext: () => void }) {
  const [ref, w] = useWidth<HTMLDivElement>(640)
  const [at, setAt] = useState(0.2)
  const [revealed, setRevealed] = useState<boolean[]>(() => fineXs.map((_, i) => Math.abs(i - idx(0.2)) <= 1))
  const drag = (x: number) => {
    const a = Math.min(idx(at), idx(x))
    const b = Math.max(idx(at), idx(x))
    setRevealed((r) => (r.slice(a, b + 1).every(Boolean) ? r : r.map((v, i) => v || (i >= a && i <= b))))
    setAt(x)
  }
  const share = revealed.filter(Boolean).length / FINE
  const all = share >= 0.95
  const s = fPrime(at)
  return (
    <section className="calc-split">
      <div className="calc-side">
        <div className="calc-card calc-readout" aria-live="polite">
          <div className="calc-tag">slope at x = {at.toFixed(1)}</div>
          <div className="calc-big">{fmt(s)}</div>
          <div className="calc-word">{slopeWord(s)}</div>
          <div className="calc-sub">
            your pencil said <b className="calc-pencil-c">{fmt(pencilAt(sketch, at), 1)}</b> here
          </div>
        </div>
        <div className="calc-meter" aria-label={`traced ${Math.round(share * 100)}% of the slope`}>
          <i style={{ width: `${Math.round(share * 100)}%` }} />
        </div>
        <p className="calc-small">{all ? 'Whole slope traced.' : `traced ${Math.round(share * 100)}%: drag all the way across`}</p>
      </div>
      <div className="calc-card calc-tight calc-main">
        <div ref={ref}>
          <SlopeChart w={w} sketch={sketch} at={at} revealed={revealed} extremes={all} label="drag the point along the curve" onDrag={drag} />
        </div>
        <Legend />
      </div>
      <div className="calc-after">
        {all && (
          <p className="calc-hand">
            <span className="calc-hl">Top of the hill, bottom of the valley: slope 0.</span> Your pencil said {fmt(pencilAt(sketch, 1), 1)} at the hilltop.
          </p>
        )}
        <div className="calc-row">
          {!all && (
            <button className="calc-btn calc-ghost" onClick={() => setRevealed(fineXs.map(() => true))}>
              trace the whole slope
            </button>
          )}
          <button className="calc-btn calc-go" disabled={!all} onClick={onNext}>Now the area →</button>
        </div>
      </div>
    </section>
  )
}

function Legend({ you = 'your pencil' }: { you?: string }) {
  return (
    <div className="calc-legend">
      <span><i className="calc-l you" />{you}</span>
      <span><i className="calc-l ink" />the real one</span>
      <span><i className="calc-l gap" />the gap</span>
    </div>
  )
}

/* ---------- 3: fill the area ---------- */

function AreaStep({ guess, setGuess, onNext }: { guess: number | null; setGuess: (v: number) => void; onNext: () => void }) {
  const [ref, w] = useWidth<HTMLDivElement>(640)
  const [barRef, bw] = useWidth<HTMLDivElement>(640, 1000)
  const [filling, setFilling] = useState(false)
  const [n, setN] = useState(1)
  const [rule, setRule] = useState<Rule>('left')
  const [maxN, setMaxN] = useState(1)
  const timer = useRef<number | null>(null)
  useEffect(() => () => void (timer.current && cancelAnimationFrame(timer.current)), [])
  const setCount = (k: number) => {
    setN(k)
    setMaxN((m) => Math.max(m, k))
  }
  const watch = () => {
    if (timer.current) cancelAnimationFrame(timer.current)
    if (reducedMotion()) return setCount(200)
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / 2600)
      setCount(sliderToN(p * 100))
      if (p < 1) timer.current = requestAnimationFrame(tick)
    }
    timer.current = requestAnimationFrame(tick)
  }
  const sum = riemann(n, rule)
  const exact = exactArea()
  return (
    <section>
      <div className="calc-split calc-areasplit">
        <div className="calc-side">
          <div className="calc-card calc-readout" aria-live="polite">
            {filling ? (
              <>
                <div className="calc-tag">{n} {n === 1 ? 'rectangle' : 'rectangles'}, {rule === 'left' ? 'left edges' : 'midpoints'}</div>
                <div className="calc-big">{sum.toFixed(3)}</div>
                <div className="calc-sub">
                  the real area is <b className="calc-truthnum">{exact.toFixed(3)}</b> <span className="calc-chip">exact</span>
                </div>
              </>
            ) : (
              <>
                <div className="calc-tag">1 rectangle</div>
                <div className="calc-big calc-dim">{ONE_RECT.toFixed(1)}</div>
                <div className="calc-sub">
                  your guess: <b className="calc-pencil-c">{guess == null ? '?' : guess.toFixed(1)}</b> squares
                </div>
              </>
            )}
          </div>
          {filling && (
            <div className="calc-card calc-controls">
              <label className="calc-lab" htmlFor="calc-n">
                Rectangles: <span className="calc-num">{n}</span>
              </label>
              <input id="calc-n" type="range" min={0} max={100} value={nToSlider(n)} onChange={(e) => setCount(sliderToN(+e.target.value))} />
              <div className="calc-ends"><span>1</span><span>200</span></div>
              <div className="calc-row calc-start">
                <span className="calc-seg" role="group" aria-label="rectangle height from">
                  {(['left', 'mid'] as Rule[]).map((r) => (
                    <button key={r} aria-pressed={rule === r} onClick={() => setRule(r)}>{r === 'left' ? 'left edge' : 'midpoint'}</button>
                  ))}
                </span>
                <button className="calc-btn calc-ghost calc-sm" onClick={watch}>watch it fill</button>
              </div>
            </div>
          )}
        </div>
        <div className="calc-card calc-tight calc-main">
          <div ref={ref}>
            <AreaChart w={w} n={n} rule={rule} label={`area under the curve from 1 to 3.5, filled with ${n} rectangles: ${sum.toFixed(3)} squares`} />
          </div>
          <div className="calc-legend">
            <span><i className="calc-l rect" />rectangles</span>
            <span><i className="calc-l gap" />where they miss the curve</span>
          </div>
        </div>
      </div>
      <div className="calc-card calc-tight">
        <div className="calc-tag calc-pad">{filling ? 'your pencil vs the exact area' : 'drag your pencil to the real area, in squares'}</div>
        <div ref={barRef}>
          <GuessBar w={bw} guess={guess} onGuess={filling ? undefined : setGuess} exact={filling} sum={filling ? sum : undefined} n={filling ? n : undefined} />
        </div>
      </div>
      {filling && maxN >= 100 && (
        <p className="calc-hand">
          <span className="calc-hl">More rectangles, less overshoot.</span> The sum settles on {exact.toFixed(3)}; it never grows past it.
        </p>
      )}
      <div className="calc-row">
        {filling ? (
          <button className="calc-btn calc-go" disabled={maxN < 50} onClick={onNext}>{maxN < 50 ? 'Add more rectangles first' : 'What did my pencil get wrong? →'}</button>
        ) : (
          <button className="calc-btn calc-go" disabled={guess == null} onClick={() => setFilling(true)}>{guess == null ? 'Drag the pencil on the bar first' : 'Fill it with rectangles →'}</button>
        )}
      </div>
    </section>
  )
}

/* ---------- 4: the mistake, named ---------- */

function CardStep({ slope, area, guess, sketch, onNext }: { slope: SlopeRead; area: AreaRead; guess: number; sketch: number[]; onNext: () => void }) {
  const exact = exactArea()
  const hill = pencilAt(sketch, 1)
  return (
    <section>
      <div className="calc-two">
        <div className="calc-card calc-verdict">
          <div className={'calc-k' + (slope.mistake ? ' calc-red' : '')}>slope · {slope.mistake ? 'the mistake' : 'the right model'}</div>
          <h3 className="calc-named">{slope.mistake ? <>“<span className="calc-hl">{LABELS[slope.mistake]}</span>”</> : <>Your slope had the <span className="calc-hl">right shape</span>.</>}</h3>
          <p>{slopeLine(slope, hill)}</p>
          <p className="calc-fix"><b>Fix:</b> {slopeFix(slope)}</p>
          <MiniTangent at={slope.mistake === 'slope-sign-flipped' || slope.mistake === 'slope-never-negative' ? 2 : 1} note={slope.mistake === 'slope-sign-flipped' || slope.mistake === 'slope-never-negative' ? 'going downhill: slope −1.5' : 'highest point, slope 0'} />
        </div>
        <div className="calc-card calc-verdict">
          <div className={'calc-k' + (area.mistake ? ' calc-red' : '')}>area · {area.mistake ? 'the mistake' : area.close ? 'the right model' : 'the gap'}</div>
          <h3 className="calc-named">
            {area.mistake ? <>“<span className="calc-hl">{LABELS[area.mistake]}</span>”</> : area.close ? <>Your area was <span className="calc-hl">within 15%</span>.</> : <>Off by <span className="calc-hl">{Math.abs(area.gap).toFixed(1)} squares</span>.</>}
          </h3>
          <p>
            You said <b className="calc-pencil-c">{guess.toFixed(1)}</b>; it's <b>{exact.toFixed(2)}</b>.{' '}
            {area.mistake
              ? `One rectangle already overshoots at ${ONE_RECT}. Thinner rectangles trim that overshoot, so the sum shrinks toward ${exact.toFixed(2)}.`
              : area.close
                ? 'You counted squares under the curve, not the rectangle above it.'
                : 'Count the whole squares under the curve, then the pieces.'}
          </p>
          <p className="calc-fix"><b>Fix:</b> rectangles only estimate the area; as they get thinner the sum closes in on one exact number.</p>
          <MiniRects />
        </div>
      </div>
      <button className="calc-btn calc-go" onClick={onNext}>One more picture →</button>
    </section>
  )
}

function slopeLine(s: SlopeRead, hill: number): string {
  switch (s.mistake) {
    case 'slope-is-height':
      return `Your pencil copied the curve: high where the curve is high. At the hilltop you drew ${fmt(hill, 1)}, but the tangent there is flat.`
    case 'slope-never-negative':
      return 'Your pencil stayed above 0 the whole way, as if steepness had no direction. Between the hill and the valley the curve goes down, so its slope is negative.'
    case 'slope-sign-flipped':
      return 'Your pencil went down where the curve goes up, and up where it goes down.'
    case 'slope-misses-the-turns':
      return 'Your pencil rises and falls in different places than the curve does. The turns are where the slope crosses 0.'
    default:
      return `Up at both ends, below 0 between the hill and the valley. At the hilltop you drew ${fmt(hill, 1)}; the real slope is 0.`
  }
}

function slopeFix(s: SlopeRead): string {
  switch (s.mistake) {
    case 'slope-is-height':
      return "slope is how steep the curve is, not how high. The top of a hill is flat: slope 0."
    case 'slope-never-negative':
    case 'slope-sign-flipped':
      return 'uphill (left to right) is positive, downhill is negative, flat is 0.'
    default:
      return 'mark where the curve goes flat (top of a hill, bottom of a valley): the slope is 0 there.'
  }
}

/* ---------- 5: compare, then end ---------- */

const PICKS = [
  { id: 'undo', text: 'Each graph is the other one, read a different way', right: true },
  { id: 'shape', text: 'The two curves have the same shape', right: false, why: "They don't: position only climbs, velocity goes up and down." },
  { id: 'none', text: 'Nothing: slopes and areas are different topics', right: false, why: 'Drag time again: the slope on the left is always the height on the right.' },
] as const

function CompareStep({ slope, area, onDone }: { slope: SlopeRead; area: AreaRead; onDone: () => void }) {
  const [refL, wl] = useWidth<HTMLDivElement>(320, 480)
  const [refR, wr] = useWidth<HTMLDivElement>(320, 480)
  const [t, setT] = useState(1.2)
  const [pick, setPick] = useState<string | null>(null)
  const chosen = PICKS.find((p) => p.id === pick)
  const caught = [slope.mistake, area.mistake].filter((m): m is NonNullable<typeof m> => m != null).map((m) => `“${LABELS[m]}”`)
  const done = mastered(slope, area)
  return (
    <section>
      <div className="calc-two">
        <div className="calc-card calc-tight">
          <div className="calc-k calc-pad">position: where the car is</div>
          <div ref={refL}>
            <PositionChart w={wl} t={t} onT={setT} label={`position over time; drag time, now ${t.toFixed(1)}`} />
          </div>
          <p className="calc-pair">
            slope here <b className="calc-hl calc-num">{f(t).toFixed(2)}</b> · height <b className="calc-box calc-num">{F(t).toFixed(2)}</b>
          </p>
        </div>
        <div className="calc-card calc-tight">
          <div className="calc-k calc-pad">velocity: how fast it goes</div>
          <div ref={refR}>
            <VelocityChart w={wr} t={t} onT={setT} label={`velocity over time; drag time, now ${t.toFixed(1)}`} />
          </div>
          <p className="calc-pair">
            height here <b className="calc-hl calc-num">{f(t).toFixed(2)}</b> · area so far <b className="calc-box calc-num">{F(t).toFixed(2)}</b>
          </p>
        </div>
      </div>
      <div className="calc-card">
        <div className="calc-k">What's the same?</div>
        <div className="calc-picks" role="group" aria-label="what's the same">
          {PICKS.map((p) => (
            <button key={p.id} className="calc-pick" aria-pressed={pick === p.id} onClick={() => setPick(p.id)}>{p.text}</button>
          ))}
        </div>
        {chosen && (
          <div className="calc-principle" aria-live="polite">
            {!chosen.right && <p className="calc-small">{'why' in chosen ? chosen.why : ''}</p>}
            <p className="calc-rule">
              <span><span className="calc-hl">Slope</span> = rate of change.</span>
              <span><span className="calc-box">Area</span> = accumulated change.</span>
              <span>One undoes the other.</span>
            </p>
          </div>
        )}
      </div>
      {chosen && (
        <div className="calc-end" role="status">
          <p>
            <b>Saved to your notebook.</b> {caught.length ? `Caught: ${caught.join(' and ')}.` : 'No mistake caught this time.'}{' '}
            {done && <span className="calc-mastered" aria-label="mastered">✓ mastered</span>}
          </p>
          <div className="calc-endact">
            <a className="calc-nblink" href={NOTEBOOK_HREF}>Open notebook</a>
            <button className="calc-btn" onClick={onDone}>Done</button>
          </div>
        </div>
      )}
    </section>
  )
}
