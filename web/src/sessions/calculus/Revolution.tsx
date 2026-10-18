import { useEffect, useMemo, useRef, useState } from 'react'
import { record } from '../../notebook'
import { reducedMotion } from './plot'
import { ASK, ASK_PROFILE, curveProfile, discProfile, discSum, DISCS, discVolume, EXACT, ONE_DISC, readDisc, REV_LABELS, RX, STAGE, type DiscPick, type RevMistake } from './revolutionMath'
import { Scene3D, type Project, type View } from './Surface'

// Calc 2, volumes of revolution, on the Calc 3 stage: the curve y = √x lies on the floor, and a slider
// spins it around the x-axis, sweeping out a solid wedge by wedge. Then one disc is the question
// (π · r² · thickness), and a second slider stacks more, thinner discs whose total closes in on 8π.

const FIT = { cx: RX / 2, cy: 0, scale: 64, lift: 8 }
/** light from up-front-left, so the top of the solid is bright and the underside dark */
const LIGHT = { x: -0.25, y: 0.35, z: 0.9 }
const FULL = 360

type Poly = { d: string; depth: number; shade: number; cls: string }

const pts = (ps: { x: number; y: number }[]) => ps.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
/** a point on the solid: x along the axis, radius rad, angle th (0 = on the floor toward +y, π/2 = straight up) */
const onSolid = (P: Project, x: number, rad: number, th: number) => P(x, rad * Math.cos(th), rad * Math.sin(th))
/** the direction looking into the screen, in scene units: a face with normal N is turned toward us if N·D < 0 */
const lookDir = ({ yaw, pitch }: View) => ({ x: Math.sin(yaw) * Math.cos(pitch), y: Math.cos(yaw) * Math.cos(pitch), z: -Math.sin(pitch) })
const dot = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => a.x * b.x + a.y * b.y + a.z * b.z
const shadeOf = (n: { x: number; y: number; z: number }) => {
  const l = Math.hypot(n.x, n.y, n.z) || 1
  return 0.3 + 0.55 * Math.max(0, dot(n, LIGHT) / l)
}

/**
 * Spin an outline (x, radius) around the x-axis through `sweep` radians, as quads. Faces turned away
 * from the viewer are dropped, the rest drawn back to front. `cls` can vary per outline segment.
 */
function revolve(P: Project, view: View, prof: [number, number][], sweep: number, segs: number, cls: (seg: number) => string): Poly[] {
  const D = lookDir(view)
  const out: Poly[] = []
  for (let k = 0; k < segs; k++) {
    const th0 = (sweep * k) / segs
    const th1 = (sweep * (k + 1)) / segs
    const thm = (th0 + th1) / 2
    for (let j = 0; j + 1 < prof.length; j++) {
      const [xa, ra] = prof[j]
      const [xb, rb] = prof[j + 1]
      if (ra === 0 && rb === 0) continue
      // outward normal: turn the outline's tangent (dx, dr) by 90°, then swing it to angle thm
      const n = { x: -(rb - ra), y: (xb - xa) * Math.cos(thm), z: (xb - xa) * Math.sin(thm) }
      if (dot(n, D) >= 0) continue
      const c = [onSolid(P, xa, ra, th0), onSolid(P, xb, rb, th0), onSolid(P, xb, rb, th1), onSolid(P, xa, ra, th1)]
      out.push({ d: pts(c), depth: c.reduce((s, p) => s + p.depth, 0) / 4, shade: shadeOf(n), cls: cls(j) })
    }
  }
  return out
}

/** The flat face of the wedge at angle th: the region under the curve, swung up to th. */
function face(P: Project, view: View, prof: [number, number][], th: number, outward: 1 | -1): Poly | null {
  const n = { x: 0, y: -Math.sin(th) * outward, z: Math.cos(th) * outward }
  if (dot(n, lookDir(view)) >= 0) return null
  const c = prof.map(([x, rad]) => onSolid(P, x, rad, th))
  return { d: pts(c), depth: c.reduce((s, p) => s + p.depth, 0) / c.length, shade: shadeOf(n), cls: 'calc-rev-face' }
}

/** The solid being swept out: `deg` of a full turn so far, or the finished solid. */
function Sweep({ P, view, deg }: { P: Project; view: View; deg: number }) {
  const prof = useMemo(() => curveProfile(), [])
  const sweep = (deg / FULL) * 2 * Math.PI
  const segs = Math.max(1, Math.round((36 * deg) / FULL))
  const polys = revolve(P, view, prof, sweep, segs, () => 'calc-rev-skin')
  if (deg < FULL) {
    const a = face(P, view, prof, 0, -1)
    const b = face(P, view, prof, sweep, 1)
    if (a) polys.push(a)
    if (b) polys.push(b)
  }
  polys.sort((a, b) => b.depth - a.depth)
  return (
    <g className="calc-rev">
      {polys.map((p, i) => <polygon key={i} className={p.cls} points={p.d} style={{ fillOpacity: p.shade }} />)}
    </g>
  )
}

/** n discs, each as wide as the curve at its right edge, alternating two tints so they read as separate slabs. */
function Discs({ P, view, n }: { P: Project; view: View; n: number }) {
  // outline segment j (left face, then rim, for each disc in turn) belongs to disc floor(j / 2)
  const discOf = (j: number) => Math.min(n - 1, Math.floor(j / 2))
  const polys = revolve(P, view, discProfile(n), 2 * Math.PI, n > 16 ? 16 : 24, (j) => 'calc-rev-disc' + (discOf(j) % 2 ? ' alt' : ''))
  polys.sort((a, b) => b.depth - a.depth)
  return (
    <g className={'calc-rev' + (n > 16 ? ' fine' : '')}>
      {polys.map((p, i) => <polygon key={i} className={p.cls} points={p.d} style={{ fillOpacity: p.shade }} />)}
    </g>
  )
}

/** The one disc the question is about, drawn over the solid. */
function AskDisc({ P, view }: { P: Project; view: View }) {
  const polys = revolve(P, view, ASK_PROFILE, 2 * Math.PI, 24, () => 'calc-rev-disc ask')
  polys.sort((a, b) => b.depth - a.depth)
  return (
    <g className="calc-rev">
      {polys.map((p, i) => <polygon key={i} className={p.cls} points={p.d} style={{ fillOpacity: p.shade }} />)}
    </g>
  )
}

/** The curve and its three mirror images (floor and vertical), dashed: where the real solid's surface is. */
function Outline({ P }: { P: Project }) {
  const prof = curveProfile().slice(0, -1)
  const at = (th: number) => pts(prof.map(([x, rad]) => onSolid(P, x, rad, th)))
  return (
    <g className="calc-rev-outline">
      {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((th) => <polyline key={th} points={at(th)} />)}
    </g>
  )
}

const PICKS: { id: DiscPick; text: string; why: string }[] = [
  { id: 'linear', text: 'π · 2 · 1 ≈ 6.28', why: 'A disc is a circle, a little thick. Its face has area π · r² = π · 2² = 4π, so the volume is π · 2² · 1 ≈ 12.57. The radius gets squared.' },
  { id: 'squared', text: 'π · 2² · 1 ≈ 12.57', why: '' },
  { id: 'strip', text: '2 · 1 = 2, the strip’s area', why: 'That is the flat strip before it spins. Spinning sweeps it around a whole circle of radius 2, area π · 2², and that circle is what gets multiplied by the thickness.' },
]

export function RevolutionStep({ onDone, topic }: { onDone: () => void; topic: string }) {
  const [view, setView] = useState<View>({ yaw: -0.35, pitch: 0.5 })
  const [phase, setPhase] = useState<'spin' | 'disc' | 'stack'>('spin')
  const [deg, setDeg] = useState(0)
  const [spun, setSpun] = useState(false)
  const [wrong, setWrong] = useState<DiscPick[]>([])
  const [note, setNote] = useState<string | null>(null)
  const [missed, setMissed] = useState(0)
  const [caught, setCaught] = useState<RevMistake[]>([])
  const [di, setDi] = useState(0) // which count in DISCS
  const [tried, setTried] = useState<number[]>([0])
  const n = DISCS[di]
  const sum = discSum(n)
  const timer = useRef<number | null>(null)
  useEffect(() => () => void (timer.current && cancelAnimationFrame(timer.current)), [])
  const turn = (d: number) => {
    setDeg(d)
    if (d >= FULL) setSpun(true)
  }
  const spinIt = () => {
    if (timer.current) cancelAnimationFrame(timer.current)
    if (reducedMotion()) return turn(FULL)
    const t0 = performance.now()
    const from = deg
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / 2400)
      turn(Math.round(from + (FULL - from) * p))
      if (p < 1) timer.current = requestAnimationFrame(tick)
    }
    timer.current = requestAnimationFrame(tick)
  }
  const pick = (c: (typeof PICKS)[number]) => {
    const m = readDisc(c.id)
    if (c.id === 'squared') {
      setPhase('stack')
      setNote(null)
      return
    }
    setWrong((ws) => [...ws, c.id])
    setMissed((k) => k + 1)
    if (m) setCaught((cs) => (cs.includes(m) ? cs : [...cs, m]))
    setNote(c.why)
  }
  const goDiscs = (i: number) => {
    setDi(i)
    setTried((t) => (t.includes(i) ? t : [...t, i]))
  }
  const done = phase === 'stack' && tried.includes(DISCS.length - 1)
  const mastered = done && missed === 0
  const saved = useRef(false)
  useEffect(() => {
    if (!done || saved.current) return
    saved.current = true
    record({ session: 'calculus', at: new Date().toISOString(), guess: '', misconception: caught[0] ?? null, rematch: null, mastered, calcTopic: topic })
  }, [done, caught, mastered, topic])

  const label =
    phase === 'spin'
      ? `The curve y = √x from 0 to 4 on the floor, spun ${deg} degrees around the x-axis${spun ? ', a full solid' : ''}. Drag or use the arrow keys to turn the view.`
      : phase === 'disc'
        ? 'The solid, with the last disc, from x = 3 to 4, picked out. Drag or use the arrow keys to turn the view.'
        : `The solid built from ${n} discs adding up to ${sum.toFixed(2)}, with the true outline dashed. Drag or use the arrow keys to turn the view.`
  return (
    <section className="calc-surface">
      <div className="calc-split calc-volsplit">
        <div className="calc-card calc-tight calc-main">
          <div className="calc-k calc-pad">y = √x spun around the x-axis · drag to turn it</div>
          <Scene3D view={view} setView={setView} surf={STAGE} fit={FIT} label={label}>
            {(P) => (
              <>
                {phase === 'spin' && <polygon className="calc-rev-plane" points={pts(curveProfile().map(([x, rad]) => P(x, rad, 0)))} />}
                {phase === 'spin' && deg > 0 && <Sweep P={P} view={view} deg={deg} />}
                {phase === 'disc' && (
                  <>
                    <Sweep P={P} view={view} deg={FULL} />
                    <AskDisc P={P} view={view} />
                  </>
                )}
                {phase === 'stack' && (
                  <>
                    <Discs P={P} view={view} n={n} />
                    <Outline P={P} />
                  </>
                )}
                {phase === 'spin' && <polyline className="calc-rev-curve" points={pts(curveProfile().slice(0, -1).map(([x, rad]) => P(x, rad, 0)))} />}
              </>
            )}
          </Scene3D>
          <div className="calc-legend">
            {phase === 'spin' && <span><i className="calc-l ink" />y = √x, lying on the floor</span>}
            {phase === 'spin' && <span><i className="calc-l col" />what it has swept out</span>}
            {phase === 'disc' && <span><i className="calc-l rev-ask" />the disc in the question: x from 3 to 4</span>}
            {phase === 'stack' && <span><i className="calc-l col" />discs</span>}
            {phase === 'stack' && <span><i className="calc-l dash" />the real solid's outline</span>}
          </div>
        </div>
        <div className="calc-side">
          <div className="calc-card calc-readout" aria-live="polite">
            {phase === 'spin' ? (
              <>
                <div className="calc-tag">spun so far</div>
                <div className="calc-big">{deg}°</div>
                <div className="calc-sub">a full turn is {FULL}°</div>
              </>
            ) : (
              <>
                <div className="calc-tag">{phase === 'disc' ? 'one disc, 1 thick, radius 2' : `${n} ${n === 1 ? 'disc' : 'discs'}`}</div>
                <div className="calc-big">{phase === 'disc' ? '?' : sum.toFixed(2)}</div>
                <div className="calc-sub">
                  {done ? (
                    <>the exact volume is <b className="calc-truthnum">8π ≈ {EXACT.toFixed(2)}</b> <span className="calc-chip">exact</span></>
                  ) : phase === 'disc' ? (
                    <>its volume is the question below</>
                  ) : (
                    <>one disc, radius 2, 4 long: <b className="calc-truthnum">{ONE_DISC.toFixed(2)}</b></>
                  )}
                </div>
              </>
            )}
          </div>
          {phase === 'spin' && (
            <div className="calc-card calc-controls">
              <label className="calc-lab" htmlFor="calc-rev-spin">
                Spin: <span className="calc-num">{deg}°</span>
              </label>
              <input id="calc-rev-spin" type="range" min={0} max={FULL} step={5} value={deg} onChange={(e) => turn(+e.target.value)} />
              <div className="calc-ends"><span>flat</span><span>a full turn</span></div>
              {!spun && (
                <div className="calc-row calc-start">
                  <button className="calc-btn calc-ghost calc-sm" onClick={spinIt}>spin it for me</button>
                </div>
              )}
            </div>
          )}
          {phase === 'stack' && (
            <div className="calc-card calc-controls">
              <label className="calc-lab" htmlFor="calc-rev-n">
                Discs: <span className="calc-num">{n}</span>
              </label>
              <input id="calc-rev-n" type="range" min={0} max={DISCS.length - 1} step={1} value={di} onChange={(e) => goDiscs(+e.target.value)} />
              <div className="calc-ends"><span>1</span><span>{DISCS[DISCS.length - 1]}</span></div>
              <table className="calc-sums">
                <caption className="calc-tag">every stack you’ve tried</caption>
                <tbody>
                  {DISCS.map((k, i) => (
                    <tr key={k} className={i === di ? 'on' : undefined}>
                      <th scope="row">{k} {k === 1 ? 'disc' : 'discs'}</th>
                      <td className="calc-num">{tried.includes(i) ? discSum(k).toFixed(2) : '?'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {phase === 'spin' && (
        <div className="calc-card">
          <p className="calc-ask">{spun ? 'A full turn: the curve has swept out a solid, like a bowl lying on its side.' : 'Spin the curve all the way around the x-axis and watch what it sweeps out.'}</p>
          <div className="calc-row">
            <button className="calc-btn calc-go" disabled={!spun} onClick={() => setPhase('disc')}>{spun ? 'Slice it into discs →' : 'Spin it a full turn first'}</button>
          </div>
        </div>
      )}

      {phase === 'disc' && (
        <div className="calc-card">
          <div className="calc-k">predict</div>
          <p className="calc-ask">
            Cut the solid into 4 slabs and take the last one, from x = {ASK.x0} to {RX}: it is {ASK.dx} thick, and the curve there reaches √4 = {ASK.radius}, so the disc has radius {ASK.radius}. What is its volume?
          </p>
          <div className="calc-picks" role="group" aria-label="the disc's volume">
            {PICKS.map((c) => (
              <button key={c.id} className={'calc-pick calc-num' + (wrong.includes(c.id) ? ' wrong' : '')} disabled={wrong.includes(c.id)} onClick={() => pick(c)}>
                {wrong.includes(c.id) && <span className="calc-mark" aria-hidden="true">✗</span>}
                {c.text}
              </button>
            ))}
          </div>
          {note && <p className="calc-wrong" role="status"><b>✗ Not quite.</b> {note} Try again.</p>}
        </div>
      )}

      {phase === 'stack' && (
        <div className="calc-card">
          {!done ? (
            <>
              <p className="calc-correct" role="status">
                <span className="calc-check" aria-hidden="true">✓</span>
                <span><b>Correct!</b> A disc is π · radius² · thickness, and here the radius is the curve's height, √x: π · 2² · 1 = {discVolume(ASK.radius, ASK.dx).toFixed(2)}. The radius always gets squared, because a circle's area is πr².</span>
              </p>
              <p className="calc-ask">Now stack them. Each disc is as wide as the curve at its right edge, so it pokes out past the real solid. Slide to more, thinner discs, all the way to {DISCS[DISCS.length - 1]}, and watch where the total settles.</p>
            </>
          ) : (
            <>
              <p className="calc-correct" role="status">
                <span className="calc-check" aria-hidden="true">✓</span>
                <span><b>8π ≈ {EXACT.toFixed(2)}.</b> Thinner discs poke out less, and their total settles on the volume of the real solid.</span>
              </p>
              <p className="calc-rule">
                <span>Each disc: <span className="calc-hl">π · f(x)² · Δx</span>. Add them all up.</span>
                <span className="calc-num">V = π ∫₀⁴ (√x)² dx = π ∫₀⁴ x dx = 8π</span>
                <span>Spin a curve, and the strips under it become discs: the integral picks up a π and a square.</span>
              </p>
            </>
          )}
        </div>
      )}

      {done && (
        <div className="calc-end" role="status">
          <p>
            <b>Saved to your notebook.</b> {caught.length ? `Caught: ${caught.map((m) => `“${REV_LABELS[m]}”`).join(' and ')}.` : null}{' '}
            {mastered && <span className="calc-mastered" aria-label="mastered">✓ mastered</span>}
          </p>
          <div className="calc-endact">
            <button className="calc-btn" onClick={onDone}>Done</button>
          </div>
        </div>
      )}
    </section>
  )
}
