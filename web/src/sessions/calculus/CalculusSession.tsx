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
import { ContourStep } from './Contour'
import { FieldStep } from './Field'
import { GradientStep } from './Gradient'
import { SurfaceStep } from './Surface'
import { COURSES, type CalcStep, type CalcTopic } from './topics'
import { VolumeStep } from './Volume'
import './calculus.css'

const LABEL: Record<CalcStep, string> = { draw: 'Draw the slope', tangent: 'Drag the tangent', area: 'Fill the area', card: 'Your mistake', compare: 'Same idea twice', surface: 'Slices', gradient: 'The gradient', volume: 'Volume', contour: 'Contour maps', field: 'Vector fields' }

// One plain-language guidance line per screen.
const TITLES: Record<CalcStep, [string, string]> = {
  draw: ['Draw the slope.', 'This curve climbs, dips, then climbs again. In the bottom box, draw how steep it is along the way: above 0 is uphill, below 0 is downhill.'],
  tangent: ['Drag the tangent.', 'Drag the dot along the curve. The real slope draws itself over your pencil.'],
  area: ['Fill the area.', 'One rectangle says 7.5 squares. Drag your pencil to where you think the real area under the curve is.'],
  card: ['What your pencil says.', 'The idea your sketch and your guess point to, and the one-line fix.'],
  compare: ['Same idea, twice.', 'Drag time on either graph. Watch which numbers match, then pick what the two have in common.'],
  surface: ['Slices of a surface.', 'With two inputs, x and y, the graph is a surface: a height above every point of the floor. Drag it to turn it around. Slicing it straight along x or y gives an ordinary curve, and that curve’s slope is a partial derivative.'],
  gradient: ['The gradient.', 'On a hill, one direction climbs fastest. The gradient is the arrow on the floor that points that way, and its length is how steep the climb is. Turn the hill around, then pick the arrow you think is steepest.'],
  contour: ['Contour maps.', 'Flood two hills and lower the water: the shoreline at each height is a contour line. Each one is stamped onto a flat map, which is all a hiker ever gets. Then read the hills back off the map alone.'],
  field: ['Vector fields.', 'A vector field hands every point of the floor an arrow: which way the water flows there, and how fast. Predict where a leaf goes first, then drop leaves and watch the arrows carry them.'],
  volume: ['Volume under a surface.', 'Stand columns on the floor under a curved roof and add up their volumes, like rectangles under a curve but in 3D. Guess the real volume first, then make the columns thinner and watch the total close in.'],
}
const REMIX: Record<string, string> = {
  slope: 'Next: the area under the same curve.',
  area: 'Next: see how slope and area undo each other.',
  ftc: 'Next: the guided path, start to finish.',
}

const slopeWord = (s: number) => (Math.abs(s) < 0.05 ? 'flat' : s > 0 ? 'uphill' : 'downhill')

/** Calculus opens on a chapter menu, so practice is on purpose, not a fixed path. */
export function CalculusSession({ onDone }: { onDone: () => void }) {
  const [topic, setTopic] = useState<CalcTopic | null>(null)
  // a new key per pick remounts the steps, so every chapter starts clean
  const [play, setPlay] = useState(0)
  const start = (t: CalcTopic) => {
    setTopic(t)
    setPlay((p) => p + 1)
  }
  if (!topic) return <CalcMenu onPick={start} />
  return <CalcRun key={play} topic={topic} onTopics={() => setTopic(null)} onDone={onDone} />
}

function CalcMenu({ onPick }: { onPick: (t: CalcTopic) => void }) {
  const title = useRef<HTMLHeadingElement>(null)
  return (
    <Frame className="calc">
      <div className="ss-head">
        <span className="ss-chip">Calculus</span>
      </div>
      <Title h="What do you want to practice?" sub="Pick a course and a chapter, then a topic." headingRef={title} />
      <div className="calc-menu">
        {COURSES.map((c) => (
          <section key={c.id} className="calc-course" aria-labelledby={`calc-c-${c.id}`}>
            <h2 id={`calc-c-${c.id}`} className="calc-course-title">{c.title}</h2>
            <p className="calc-sec-blurb">{c.blurb}</p>
            {c.sections.map((s) => (
              <div key={s.id} className="calc-section">
                {c.sections.length > 1 && <h3 className="calc-sec-title">{s.title}</h3>}
                {c.sections.length > 1 && <p className="calc-sec-blurb">{s.blurb}</p>}
                <div className="calc-topics">
                  {s.topics.map((t) => (
                    <button key={t.id} className="calc-topic" disabled={!t.ready} onClick={() => onPick(t)} aria-describedby={`calc-t-${t.id}`}>
                      <span className="calc-topic-title">{t.title}</span>
                      <span id={`calc-t-${t.id}`} className="calc-topic-blurb">{t.blurb}</span>
                      {!t.ready && <span className="calc-soon">coming next</span>}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </section>
        ))}
      </div>
    </Frame>
  )
}

function CalcRun({ topic, onTopics, onDone }: { topic: CalcTopic; onTopics: () => void; onDone: () => void }) {
  const steps = topic.steps
  const [step, setStep] = useState(1)
  const [reached, setReached] = useState(1)
  const go = (n: number) => {
    setStep(n)
    setReached((r) => Math.max(r, n))
  }
  const cur = steps[step - 1]
  const at = (s: CalcStep) => steps.indexOf(s) + 1
  const next = (s: CalcStep) => go(at(s) + 1)
  const isLast = (s: CalcStep) => at(s) === steps.length
  const nextLabel = (s: CalcStep, fallback: string) => (isLast(s) ? 'Finish ✓' : steps[at(s)] === 'card' ? 'What did my pencil get wrong? →' : fallback)
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
    if (cur !== 'card' || saved.current || (!slope && !area)) return
    saved.current = true
    record({
      session: 'calculus',
      at: new Date().toISOString(),
      guess: guess ?? '',
      misconception: slope?.mistake ?? area?.mistake ?? null,
      rematch: null,
      slopeMistake: slope?.mistake ?? null,
      areaMistake: area?.mistake ?? null,
      mastered: (!slope || slope.mistake === null) && (!area || area.close),
      calcTopic: topic.id,
    })
  }, [cur, slope, area, guess, topic.id])
  // the fundamental-theorem chapter has no card: it's saved when you pick what's the same
  const savePick = (right: boolean) => {
    if (saved.current) return
    saved.current = true
    record({ session: 'calculus', at: new Date().toISOString(), guess: '', misconception: null, rematch: null, mastered: right, calcTopic: topic.id })
  }

  const [h, sub] = TITLES[cur]
  // you can step back to anything you've reached, but not back into the sketch once it's been checked
  const canGo = (i: number) => i < reached && (steps[i] !== 'draw' || reached === 1)

  return (
    <Frame className="calc">
      <SessionHead chip={`Calculus · ${topic.title}`} step={step} total={steps.length} labels={steps.map((s) => LABEL[s])} canGo={canGo} onGo={(i) => go(i + 1)} />
      <button className="calc-btn calc-ghost calc-sm calc-back" onClick={onTopics}>← All calculus topics</button>
      <Title h={h} sub={sub} headingRef={title} />
      {cur === 'draw' && (
        <DrawStep
          stroke={stroke}
          setStroke={setStroke}
          onNext={() => {
            setSketch(resample(stroke))
            next('draw')
          }}
        />
      )}
      {cur === 'tangent' && sketch && <TangentStep sketch={sketch} onNext={() => next('tangent')} nextLabel={nextLabel('tangent', 'Now the area →')} />}
      {cur === 'area' && <AreaStep guess={guess} setGuess={setGuess} onNext={() => next('area')} nextLabel={nextLabel('area', 'What did my pencil get wrong? →')} />}
      {cur === 'card' && (slope || area) && (
        <CardStep slope={slope} area={area} guess={guess} sketch={sketch} onNext={() => next('card')} end={isLast('card') ? { remix: REMIX[topic.id] ?? '', onDone } : null} />
      )}
      {cur === 'compare' && <CompareStep slope={slope} area={area} onDone={onDone} onPick={savePick} />}
      {cur === 'surface' && <SurfaceStep onDone={onDone} topic={topic.id} />}
      {cur === 'gradient' && <GradientStep onDone={onDone} topic={topic.id} />}
      {cur === 'volume' && <VolumeStep onDone={onDone} topic={topic.id} />}
      {cur === 'contour' && <ContourStep onDone={onDone} topic={topic.id} />}
      {cur === 'field' && <FieldStep onDone={onDone} topic={topic.id} />}
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

function TangentStep({ sketch, onNext, nextLabel }: { sketch: number[]; onNext: () => void; nextLabel: string }) {
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
          <button className="calc-btn calc-go" disabled={!all} onClick={onNext}>{nextLabel}</button>
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

function AreaStep({ guess, setGuess, onNext, nextLabel }: { guess: number | null; setGuess: (v: number) => void; onNext: () => void; nextLabel: string }) {
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
          {rule === 'left' ? (
            <><span className="calc-hl">More rectangles, less overshoot.</span> The sum shrinks toward {exact.toFixed(3)} and never drops below it.</>
          ) : (
            <><span className="calc-hl">Midpoints land just under.</span> The sum climbs toward {exact.toFixed(3)} and never goes past it.</>
          )}
        </p>
      )}
      <div className="calc-row">
        {filling ? (
          <button className="calc-btn calc-go" disabled={maxN < 50} onClick={onNext}>{maxN < 50 ? 'Add more rectangles first' : nextLabel}</button>
        ) : (
          <button className="calc-btn calc-go" disabled={guess == null} onClick={() => setFilling(true)}>{guess == null ? 'Drag the pencil on the bar first' : 'Fill it with rectangles →'}</button>
        )}
      </div>
    </section>
  )
}

/* ---------- 4: the mistake, named ---------- */

type End = { remix: string; onDone: () => void }

function CardStep(p: { slope: SlopeRead | null; area: AreaRead | null; guess: number | null; sketch: number[] | null; onNext: () => void; end: End | null }) {
  const { slope, area, guess, sketch, onNext, end } = p
  const exact = exactArea()
  const caught = [slope?.mistake, area?.mistake].filter((m): m is NonNullable<typeof m> => m != null).map((m) => `“${LABELS[m]}”`)
  return (
    <section>
      <div className={slope && sketch && area && guess != null ? 'calc-two' : 'calc-one'}>
        {slope && sketch && (
        <div className="calc-card calc-verdict">
          <div className={'calc-k' + (slope.mistake ? ' calc-red' : '')}>slope · {slope.mistake ? 'the mistake' : 'the right model'}</div>
          <h3 className="calc-named">{slope.mistake ? <>“<span className="calc-hl">{LABELS[slope.mistake]}</span>”</> : <>Your slope had the <span className="calc-hl">right shape</span>.</>}</h3>
          <p>{slopeLine(slope, pencilAt(sketch, 1))}</p>
          <p className="calc-fix"><b>{slope.mistake ? 'Fix:' : 'The rule:'}</b> {slopeFix(slope)}</p>
          <MiniTangent at={slope.mistake === 'slope-sign-flipped' || slope.mistake === 'slope-never-negative' ? 2 : 1} note={slope.mistake === 'slope-sign-flipped' || slope.mistake === 'slope-never-negative' ? 'going downhill: slope −1.5' : 'highest point, slope 0'} />
        </div>
        )}
        {area && guess != null && (
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
          <p className="calc-fix"><b>{area.mistake || !area.close ? 'Fix:' : 'The rule:'}</b> rectangles only estimate the area; as they get thinner the sum closes in on one exact number.</p>
          <MiniRects />
        </div>
        )}
      </div>
      {end ? (
        <CalcEnd caught={caught} mastered={(!slope || slope.mistake === null) && (!area || area.close)} remix={end.remix} onDone={end.onDone} />
      ) : (
        <button className="calc-btn calc-go" onClick={onNext}>One more picture →</button>
      )}
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

function CompareStep({ slope, area, onDone, onPick }: { slope: SlopeRead | null; area: AreaRead | null; onDone: () => void; onPick?: (firstTry: boolean) => void }) {
  const [refL, wl] = useWidth<HTMLDivElement>(320, 480)
  const [refR, wr] = useWidth<HTMLDivElement>(320, 480)
  const [t, setT] = useState(1.2)
  const [wrong, setWrong] = useState<string[]>([])
  const [right, setRight] = useState(false)
  const [last, setLast] = useState<string | null>(null)
  const missed = PICKS.find((p) => p.id === last && !p.right)
  const choose = (p: (typeof PICKS)[number]) => {
    if (right) return
    setLast(p.id)
    if (p.right) {
      setRight(true)
      onPick?.(wrong.length === 0)
    } else setWrong((w) => (w.includes(p.id) ? w : [...w, p.id]))
  }
  const caught = [slope?.mistake, area?.mistake].filter((m): m is NonNullable<typeof m> => m != null).map((m) => `“${LABELS[m]}”`)
  // alone (its own chapter) it's mastered on a first-try right pick; on the guided path, by the sketch and the guess
  const done = slope && area ? mastered(slope, area) : wrong.length === 0
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
          {PICKS.map((p) => {
            const isWrong = wrong.includes(p.id)
            const isRight = right && p.right
            return (
              <button key={p.id} className={'calc-pick' + (isRight ? ' right' : '') + (isWrong ? ' wrong' : '')} aria-pressed={isRight} disabled={right || isWrong} onClick={() => choose(p)}>
                {isRight && <span className="calc-mark" aria-hidden="true">✓</span>}
                {isWrong && <span className="calc-mark" aria-hidden="true">✗</span>}
                {p.text}
              </button>
            )
          })}
        </div>
        {missed && !right && (
          <p className="calc-wrong" role="status">
            <b>✗ Not quite.</b> {'why' in missed ? missed.why : ''} Try another one.
          </p>
        )}
        {right && (
          <div className="calc-principle" role="status">
            <p className="calc-correct">
              <span className="calc-check" aria-hidden="true">✓</span>
              <span><b>Correct!</b> The slope of the position graph at any moment is the height of the velocity graph, and the area under velocity so far is the height of position.</span>
            </p>
            <p className="calc-rule">
              <span><span className="calc-hl">Slope</span> = rate of change.</span>
              <span><span className="calc-box">Area</span> = accumulated change.</span>
              <span>One undoes the other.</span>
            </p>
          </div>
        )}
      </div>
      {right && <CalcEnd caught={caught} mastered={done} remix="" onDone={onDone} />}
    </section>
  )
}

/** The yellow end bar: saved, what was caught, Open notebook, Done. */
function CalcEnd({ caught, mastered: ok, remix, onDone }: { caught: string[]; mastered: boolean; remix: string; onDone: () => void }) {
  return (
    <div className="calc-end" role="status">
      <p>
        <b>Saved to your notebook.</b> {caught.length ? `Caught: ${caught.join(' and ')}.` : 'No mistake caught this time.'}{' '}
        {ok && <span className="calc-mastered" aria-label="mastered">✓ mastered</span>} {remix}
      </p>
      <div className="calc-endact">
        <a className="calc-nblink" href={NOTEBOOK_HREF}>Open notebook</a>
        <button className="calc-btn" onClick={onDone}>Done</button>
      </div>
    </div>
  )
}
