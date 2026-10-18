import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { record } from '../../notebook'
import { contour, CONTOUR_LABELS, cz, grad, H_TOP, LEVELS, len, PT_A, PT_B, R, STEP, TWIN, type ContourMistake, type Seg, type Vec } from './contourMath'
import { Scene3D, type Project, type View } from './Surface'

// Calc 3, contour maps: flood two hills and lower the water. The shoreline at each height is a contour
// line, stamped onto a flat map as the water passes it. Then the 3D view goes away and the student
// reads the hills back off the map alone: which point is higher, where it's steep, and finally the
// gradient arrow, which always crosses the lines at right angles.

const FIT = { cx: 0, cy: 0, scale: 50, lift: 46 }
/** The water starts just above the tall top, so its tip shows there's something under the surface. */
const H_START = 2.95
const N = 24 // surface grid cells per side
const MW = 360 // the map's viewBox, square
const mx = (x: number) => ((x + R) / (2 * R)) * MW
const my = (y: number) => MW - ((y + R) / (2 * R)) * MW
const pts = (ps: { x: number; y: number }[]) => ps.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

// The lines on the map never change, so each level's pieces are worked out once.
const cache = new Map<number, Seg[]>()
const lines = (h: number): Seg[] => {
  let s = cache.get(h)
  if (!s) cache.set(h, (s = contour(h)))
  return s
}
const segPath = (segs: Seg[], X: (x: number) => number, Y: (y: number) => number) =>
  segs.map(([x1, y1, x2, y2]) => `M${X(x1).toFixed(1)} ${Y(y1).toFixed(1)}L${X(x2).toFixed(1)} ${Y(y2).toFixed(1)}`).join('')

/** The hills flooded up to height h: quads under water are drawn flat at h, the rest shaded by height; the shoreline on top. */
function Flooded({ P, h }: { P: Project; h: number }) {
  const quads = useMemo(() => {
    const d = (2 * R) / N
    const out: { d: string; depth: number; t: number; wet: boolean }[] = []
    for (let i = 0; i < N; i++)
      for (let j = 0; j < N; j++) {
        const xa = -R + i * d
        const ya = -R + j * d
        const zc = cz(xa + d / 2, ya + d / 2)
        const wet = zc < h
        const c = [
          [xa, ya],
          [xa + d, ya],
          [xa + d, ya + d],
          [xa, ya + d],
        ].map(([x, y]) => P(x, y, wet ? h : cz(x, y)))
        out.push({ d: pts(c), depth: c.reduce((s, q) => s + q.depth, 0) / 4, t: zc / 3, wet })
      }
    return out.sort((a, b) => b.depth - a.depth)
  }, [P, h])
  // the shoreline: the contour at h, lifted onto the surface
  const shore = useMemo(() => {
    const segs = h > 0 && h < H_TOP ? contour(h, 48) : []
    return segs
      .map(([x1, y1, x2, y2]) => {
        const a = P(x1, y1, h)
        const b = P(x2, y2, h)
        return `M${a.x.toFixed(1)} ${a.y.toFixed(1)}L${b.x.toFixed(1)} ${b.y.toFixed(1)}`
      })
      .join('')
  }, [P, h])
  return (
    <>
      {quads.map((q, i) => (
        <polygon key={i} className={q.wet ? 'calc-ctr-water' : 'calc-3d-quad'} points={q.d} style={q.wet ? undefined : { fillOpacity: 0.12 + 0.6 * q.t }} />
      ))}
      {shore && <path className="calc-ctr-shore" d={shore} />}
    </>
  )
}

/** The flat map: the stamped lines, the live shoreline, the two points to compare, and the gradient arrow at the dot. */
function ContourMap(p: { stamped: number[]; live?: number; compare?: boolean; dot?: Vec; onMove?: (q: Vec) => void; label: string }) {
  const { stamped, live, compare, dot, onMove, label } = p
  const toMap = (e: PointerEvent<SVGSVGElement>): Vec => {
    const r = e.currentTarget.getBoundingClientRect()
    const k = r.width ? MW / r.width : 1
    const px = (e.clientX - r.left) * k
    const py = (e.clientY - r.top) * k
    const clampR = (v: number) => Math.min(R - 0.2, Math.max(-R + 0.2, v))
    return { x: clampR((px / MW) * 2 * R - R), y: clampR(R - (py / MW) * 2 * R) }
  }
  const down = (e: PointerEvent<SVGSVGElement>) => {
    if (!onMove) return
    e.preventDefault()
    onMove(toMap(e))
  }
  const key = (e: KeyboardEvent<SVGSVGElement>) => {
    if (!onMove || !dot) return
    const k: Record<string, [number, number]> = { ArrowLeft: [-0.25, 0], ArrowRight: [0.25, 0], ArrowUp: [0, 0.25], ArrowDown: [0, -0.25] }
    const d = k[e.key]
    if (!d) return
    e.preventDefault()
    const c = (v: number) => Math.min(R - 0.2, Math.max(-R + 0.2, v))
    onMove({ x: c(dot.x + d[0]), y: c(dot.y + d[1]) })
  }
  // label every other line at its topmost point, like a hiker's map (the rings are widest apart there)
  const labels = stamped
    .filter((h) => Math.round(h / STEP) % 2 === 0)
    .map((h) => {
      const segs = lines(h)
      if (!segs.length) return null
      const [x, y] = segs.reduce((best, s) => (s[1] > best[1] ? [s[0], s[1]] : best), [0, -Infinity])
      return { h, x, y }
    })
    .filter((l): l is { h: number; x: number; y: number } => !!l)
  const g = dot ? grad(dot) : null
  const K = 0.7 // map units drawn per unit of steepness
  const tangent = g && len(g) > 0.02 ? { x: -g.y / len(g), y: g.x / len(g) } : null
  return (
    <svg
      className={'calc-ctr-map' + (onMove ? ' tap' : '')}
      viewBox={`0 0 ${MW} ${MW}`}
      role="img"
      tabIndex={onMove ? 0 : undefined}
      aria-label={label}
      onPointerDown={down}
      onKeyDown={key}
    >
      <rect className="calc-ctr-paper" x={0} y={0} width={MW} height={MW} />
      <line className="calc-3d-axis" x1={0} y1={my(0)} x2={MW} y2={my(0)} />
      <line className="calc-3d-axis" x1={mx(0)} y1={0} x2={mx(0)} y2={MW} />
      <text className="calc-3d-lab" x={MW - 12} y={my(0) - 5}>x</text>
      <text className="calc-3d-lab" x={mx(0) + 6} y={13}>y</text>
      {stamped.map((h) => (
        <path key={h} className={'calc-ctr-line' + (Math.round(h / STEP) % 4 === 0 ? ' major' : '')} d={segPath(lines(h), mx, my)} />
      ))}
      {labels.map((l) => (
        <text key={l.h} className="calc-ctr-hlab" x={mx(l.x)} y={my(l.y) - 3} textAnchor="middle">{l.h.toFixed(2).replace(/0$/, '')}</text>
      ))}
      {live != null && live > 0 && live < H_TOP && <path className="calc-ctr-live" d={segPath(contour(live, 48), mx, my)} />}
      {compare &&
        [
          { n: 'A', p: PT_A },
          { n: 'B', p: PT_B },
        ].map(({ n, p: q }) => (
          <g key={n} className="calc-ctr-cmp">
            <circle cx={mx(q.x)} cy={my(q.y)} r={9} />
            <text x={mx(q.x)} y={my(q.y) + 5} textAnchor="middle">{n}</text>
          </g>
        ))}
      {dot && g && tangent && (
        <g className="calc-ctr-grad">
          <line className="calc-ctr-tan" x1={mx(dot.x - 0.5 * tangent.x)} y1={my(dot.y - 0.5 * tangent.y)} x2={mx(dot.x + 0.5 * tangent.x)} y2={my(dot.y + 0.5 * tangent.y)} />
          {(() => {
            const L = K * len(g)
            const u = { x: g.x / len(g), y: g.y / len(g) }
            const tip = { x: dot.x + L * u.x, y: dot.y + L * u.y }
            const head = Math.min(0.22, L * 0.5)
            const side = (s: number) => ({ x: mx(tip.x - head * u.x - s * head * 0.55 * u.y), y: my(tip.y - head * u.y + s * head * 0.55 * u.x) })
            const neck = { x: mx(tip.x - head * u.x * 0.8), y: my(tip.y - head * u.y * 0.8) }
            const sq = 0.14 // the little right-angle square
            const c1 = { x: dot.x + sq * u.x, y: dot.y + sq * u.y }
            const c2 = { x: dot.x + sq * u.x + sq * tangent.x, y: dot.y + sq * u.y + sq * tangent.y }
            const c3 = { x: dot.x + sq * tangent.x, y: dot.y + sq * tangent.y }
            return (
              <>
                <polyline className="calc-ctr-right" points={pts([{ x: mx(c1.x), y: my(c1.y) }, { x: mx(c2.x), y: my(c2.y) }, { x: mx(c3.x), y: my(c3.y) }])} />
                <line x1={mx(dot.x)} y1={my(dot.y)} x2={neck.x} y2={neck.y} />
                <polygon points={pts([{ x: mx(tip.x), y: my(tip.y) }, side(1), side(-1)])} />
              </>
            )
          })()}
        </g>
      )}
      {dot && <circle className="calc-3d-pt" cx={mx(dot.x)} cy={my(dot.y)} r={7} />}
    </svg>
  )
}

/* ---------- the activity ---------- */

type Phase = 'slice' | 'q1' | 'q2' | 'grad'
type Higher = 'A' | 'B' | 'same'
const HIGHER: { id: Higher; text: string; why?: string }[] = [
  { id: 'A', text: 'A is higher' },
  { id: 'B', text: 'B is higher', why: 'The tall hill has more rings in total, but B sits inside only its first three (0.25, 0.5, 0.75): it’s low on the tall hill’s side. A is inside seven rings, just under the 2 line, high on the short hill.' },
  { id: 'same', text: 'Same height', why: 'They’d be on the same line. A is just under the 2 line and B is just past the 0.75 line.' },
]
type Steep = 'close' | 'far' | 'cant'
const STEEP: { id: Steep; text: string; why?: string }[] = [
  { id: 'close', text: 'Where the lines are close together' },
  { id: 'far', text: 'Where the lines are far apart', why: 'Every line is one step of 0.25 up. Where the lines are close you climb 0.25 in a few paces: that’s steep. Far apart, the same 0.25 takes a long walk: gentle.' },
  { id: 'cant', text: 'You can’t tell steepness from a flat map', why: 'You can: the lines are 0.25 apart in height, so how far apart they are on the map says how far you walk for each 0.25 of climb.' },
]
const n2 = (v: number) => (Math.abs(v) < 0.005 ? 0 : v).toFixed(2)

export function ContourStep({ onDone, topic }: { onDone: () => void; topic: string }) {
  const [view, setView] = useState<View>({ yaw: -0.5, pitch: 0.6 })
  const [phase, setPhase] = useState<Phase>('slice')
  const [h, setH] = useState(H_START)
  const [lowest, setLowest] = useState(H_START)
  const [wrongHigher, setWrongHigher] = useState<Higher[]>([])
  const [wrongSteep, setWrongSteep] = useState<Steep[]>([])
  const [note, setNote] = useState<string | null>(null)
  const [missed, setMissed] = useState(0)
  const [caught, setCaught] = useState<ContourMistake[]>([])
  const [dot, setDot] = useState<Vec>(PT_B)
  const stamped = LEVELS.filter((l) => l >= lowest - 1e-9)
  const allStamped = stamped.length === LEVELS.length
  const done = phase === 'grad'

  const lower = (v: number) => {
    setH(v)
    setLowest((l) => Math.min(l, v))
  }
  const miss = (m: ContourMistake | null, why: string) => {
    setMissed((k) => k + 1)
    if (m) setCaught((c) => (c.includes(m) ? c : [...c, m]))
    setNote(why)
  }
  const pickHigher = (c: (typeof HIGHER)[number]) => {
    if (c.id === 'A') {
      setPhase('q2')
      setNote(null)
      return
    }
    setWrongHigher((w) => [...w, c.id])
    miss(c.id === 'B' ? 'contour-count-is-height' : null, c.why ?? '')
  }
  const pickSteep = (c: (typeof STEEP)[number]) => {
    if (c.id === 'close') {
      setPhase('grad')
      setNote(null)
      return
    }
    setWrongSteep((w) => [...w, c.id])
    miss(c.id === 'far' ? 'contour-spacing-flat' : null, c.why ?? '')
  }

  const saved = useRef(false)
  useEffect(() => {
    if (!done || saved.current) return
    saved.current = true
    record({ session: 'calculus', at: new Date().toISOString(), guess: '', misconception: caught[0] ?? null, rematch: null, mastered: missed === 0, calcTopic: topic })
  }, [done, caught, missed, topic])

  const g = grad(dot)
  const mapLabel =
    phase === 'slice'
      ? `contour map, ${stamped.length} of ${LEVELS.length} lines stamped, water at ${h.toFixed(2)}`
      : phase === 'grad'
        ? `contour map with the gradient arrow at x = ${dot.x.toFixed(1)}, y = ${dot.y.toFixed(1)}: ∇f = (${n2(g.x)}, ${n2(g.y)}), at right angles to the lines. Tap or use the arrow keys to move the dot.`
        : `contour map with points A at x = ${PT_A.x}, y = ${PT_A.y} and B at x = ${PT_B.x}, y = ${PT_B.y}`

  return (
    <section className="calc-surface calc-ctr">
      <div className="calc-3d-layout">
        {phase === 'slice' ? (
          <div className="calc-card calc-tight calc-3d-main">
            <div className="calc-k calc-pad">two hills, flooded · drag to turn</div>
            <Scene3D view={view} setView={setView} surf={TWIN} fit={FIT} label={`3D view: two hills, one taller, flooded up to height ${h.toFixed(2)}. The shoreline is the contour line at that height. Drag or use the arrow keys to turn it.`}>
              {(P) => <Flooded P={P} h={h} />}
            </Scene3D>
            <label className="calc-range calc-ctr-range">
              <span>h = {h.toFixed(2)}</span>
              <input type="range" min={0} max={H_TOP} step={0.05} value={h} onChange={(e) => lower(+e.target.value)} aria-label="water level h: drag it down to lower the water" />
            </label>
          </div>
        ) : (
          <div className="calc-card calc-tight calc-3d-main">
            <div className="calc-k calc-pad">the map · every line is 0.25 higher than the one outside it</div>
            <ContourMap stamped={LEVELS} compare={phase !== 'grad'} dot={phase === 'grad' ? dot : undefined} onMove={phase === 'grad' ? setDot : undefined} label={mapLabel} />
          </div>
        )}

        <div className="calc-3d-side">
          {phase === 'slice' && (
            <>
              <div className="calc-card calc-tight">
                <div className="calc-k calc-pad">the map so far · {stamped.length} of {LEVELS.length} lines</div>
                <ContourMap stamped={stamped} live={h} label={mapLabel} />
              </div>
              <div className="calc-card">
                <p className="calc-ask">Drag the water level down from the top. Each time it drops another 0.25, the shoreline is stamped onto the map. Take it all the way down.</p>
                {allStamped ? (
                  <>
                    <p className="calc-correct" role="status">
                      <span className="calc-check" aria-hidden="true">✓</span>
                      <span>That flat map is a <b>contour map</b>: one line for every 0.25 of height. The hills are gone, but everything about them is still there.</span>
                    </p>
                    <button className="calc-btn calc-go" onClick={() => setPhase('q1')}>Read the map →</button>
                  </>
                ) : (
                  <p className="calc-small">Rings close up around a top as the water drops below it. The tall hill shows first.</p>
                )}
              </div>
            </>
          )}

          {phase === 'q1' && (
            <div className="calc-card">
              <div className="calc-k">question 1 of 2</div>
              <p className="calc-ask">Just from the map: which point is higher, A or B?</p>
              <div className="calc-picks calc-picks-row" role="group" aria-label="which point is higher">
                {HIGHER.map((c) => (
                  <button key={c.id} className={'calc-pick' + (wrongHigher.includes(c.id) ? ' wrong' : '')} disabled={wrongHigher.includes(c.id)} onClick={() => pickHigher(c)}>
                    {wrongHigher.includes(c.id) && <span className="calc-mark" aria-hidden="true">✗</span>}
                    {c.text}
                  </button>
                ))}
              </div>
              {note && <p className="calc-wrong" role="status"><b>✗ Not quite.</b> {note} Try again.</p>}
            </div>
          )}

          {phase === 'q2' && (
            <div className="calc-card">
              <p className="calc-correct" role="status">
                <span className="calc-check" aria-hidden="true">✓</span>
                <span><b>Correct!</b> A is {cz(PT_A.x, PT_A.y).toFixed(2)} high, inside seven rings on the short hill. B is only {cz(PT_B.x, PT_B.y).toFixed(2)}: three rings up the tall hill’s side. The hill with more rings isn’t where the higher point is. Count the rings around the point, or read the line it’s next to.</span>
              </p>
              <div className="calc-k">question 2 of 2</div>
              <p className="calc-ask">Where is the ground steepest?</p>
              <div className="calc-picks" role="group" aria-label="where is it steepest">
                {STEEP.map((c) => (
                  <button key={c.id} className={'calc-pick' + (wrongSteep.includes(c.id) ? ' wrong' : '')} disabled={wrongSteep.includes(c.id)} onClick={() => pickSteep(c)}>
                    {wrongSteep.includes(c.id) && <span className="calc-mark" aria-hidden="true">✗</span>}
                    {c.text}
                  </button>
                ))}
              </div>
              {note && <p className="calc-wrong" role="status"><b>✗ Not quite.</b> {note} Try again.</p>}
            </div>
          )}

          {phase === 'grad' && (
            <>
              <div className="calc-card">
                <p className="calc-correct" role="status">
                  <span className="calc-check" aria-hidden="true">✓</span>
                  <span><b>Correct!</b> Close lines = you climb 0.25 in a few paces = steep. The tall hill’s sides are its steepest part: the rings crowd together there and spread out again near the top, where it’s nearly flat.</span>
                </p>
                <p className="calc-ask">Last look: the <b>gradient</b> drawn on the map. Tap anywhere to move the dot. The arrow always crosses the lines at right angles, pointing straight uphill, and it’s longer where the lines are close.</p>
              </div>
              <div className="calc-card calc-grad-read" aria-live="polite">
                <div className="calc-k">at the dot</div>
                <p className="calc-grad-eq">
                  ∇f = (<b className="calc-num calc-gx">{n2(g.x)}</b>, <b className="calc-num calc-gy">{n2(g.y)}</b>)
                </p>
                <p className="calc-pair">
                  height <b className="calc-box calc-num">{cz(dot.x, dot.y).toFixed(2)}</b> · steepness <b className="calc-hl calc-num">{n2(len(g))}</b>
                </p>
                <p className="calc-rule">
                  <span>A contour line = all the points at one height.</span>
                  <span>Close lines = steep. Far apart = gentle.</span>
                  <span><span className="calc-hl">∇f</span> crosses the lines at right angles.</span>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
      {done && (
        <div className="calc-end" role="status">
          <p>
            <b>Saved to your notebook.</b> {caught.length ? `Caught: ${caught.map((m) => `“${CONTOUR_LABELS[m]}”`).join(' and ')}.` : missed ? 'No mistake named this time.' : <span className="calc-mastered" aria-label="mastered">✓ mastered</span>} Next: the volume under a surface, built from columns.
          </p>
          <div className="calc-endact">
            <button className="calc-btn" onClick={onDone}>Done</button>
          </div>
        </div>
      )}
    </section>
  )
}
