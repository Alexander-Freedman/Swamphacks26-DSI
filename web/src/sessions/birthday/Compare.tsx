import { useEffect, useRef, useState } from 'react'
import { useWidth } from './chart'
import { CASES, CHOICES, halfAt, pinCrowd, PRINCIPLE, ROOM_HI, ROOM_LO, type Case, type CompareChoice } from './compareData'
import { DAYS, pairs, pAnyMatch, pct, PINS } from './math'

/* ---------- B7 compare: same structure, different situation (Gentner, Loewenstein & Thompson 2003) ---------- */

/** Everyone on a ring, a line for every pair. Canvas, because 314 people make 49,141 lines. */
function Ring({ slots, n, label }: { slots: number; n: number; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current
    let ctx: CanvasRenderingContext2D | null = null
    try {
      ctx = cv?.getContext('2d') ?? null
    } catch {
      ctx = null
    }
    if (!cv || !ctx) return
    const css = getComputedStyle(cv)
    const ink = css.getPropertyValue('--ink').trim() || '#1b1b1b'
    const card = css.getPropertyValue('--card').trim() || '#fff'
    const grid = css.getPropertyValue('--grid').trim() || '#ddd'
    const S = cv.clientWidth || 170
    const dpr = window.devicePixelRatio || 1
    cv.width = Math.round(S * dpr)
    cv.height = Math.round(S * dpr)
    ctx.setTransform((dpr * S) / 200, 0, 0, (dpr * S) / 200, 0, 0)
    ctx.clearRect(0, 0, 200, 200)
    const P = Array.from({ length: slots }, (_, i) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / slots
      return [100 + 84 * Math.cos(a), 100 + 84 * Math.sin(a)]
    })
    const dense = slots > 100
    if (dense) {
      // empty seats are too small to draw one by one: show the ring they sit on
      ctx.strokeStyle = grid
      ctx.lineWidth = 2.6
      ctx.beginPath()
      ctx.arc(100, 100, 84, 0, 2 * Math.PI)
      ctx.stroke()
    }
    ctx.strokeStyle = ink
    ctx.globalAlpha = dense ? 0.035 : 0.2
    ctx.lineWidth = dense ? 0.4 : 0.8
    ctx.beginPath()
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++) {
        ctx.moveTo(P[i][0], P[i][1])
        ctx.lineTo(P[j][0], P[j][1])
      }
    ctx.stroke()
    ctx.globalAlpha = 1
    const r = dense ? 1.3 : 3.6
    P.forEach(([x, y], i) => {
      ctx.beginPath()
      ctx.arc(x, y, r, 0, 2 * Math.PI)
      ctx.fillStyle = i < n ? ink : card
      ctx.fill()
      if (i >= n && !dense) {
        ctx.strokeStyle = grid
        ctx.lineWidth = 1
        ctx.stroke()
      }
    })
  }, [slots, n])
  return <canvas ref={ref} className="bday-cmp-ring" role="img" aria-label={label} />
}

function MiniCurve({ c, n, width }: { c: Case; n: number; width: number }) {
  const W = width
  const H = 150
  const m = { l: 40, r: 12, t: 12, b: 30 }
  const X = (x: number) => m.l + ((x - 2) / (c.xMax - 2)) * (W - m.l - m.r)
  const Y = (y: number) => m.t + (1 - y) * (H - m.t - m.b)
  let d = ''
  const step = Math.max(1, Math.round(c.xMax / 120))
  for (let x = 2; x <= c.xMax; x += step) d += (x === 2 ? 'M' : 'L') + X(x).toFixed(1) + ' ' + Y(pAnyMatch(x, c.options)).toFixed(1)
  const p = pAnyMatch(n, c.options)
  const left = X(n) - m.l > 110
  return (
    <svg className="bday-chart bday-cmp-curve" width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`chance of a match, ${c.title.toLowerCase()}: ${n} ${c.thing} → ${pct(p)}`}>
      <rect x={m.l} y={m.t} width={W - m.l - m.r} height={H - m.t - m.b} fill="var(--card)" />
      {[0, 0.5, 1].map((y) => (
        <g key={y}>
          <line className="bday-gridl" x1={m.l} x2={W - m.r} y1={Y(y)} y2={Y(y)} />
          <text className="bday-tick" x={m.l - 6} y={Y(y) + 4} textAnchor="end">{y * 100}%</text>
        </g>
      ))}
      {c.ticks.map((x) => (
        <text key={x} className="bday-tick" x={X(x)} y={H - m.b + 16} textAnchor="middle">{x}</text>
      ))}
      <line className="bday-axis" x1={m.l} x2={m.l} y1={m.t} y2={H - m.b} />
      <line className="bday-axis" x1={m.l} x2={W - m.r} y1={H - m.b} y2={H - m.b} />
      <line x1={m.l} x2={W - m.r} y1={Y(0.5)} y2={Y(0.5)} stroke="var(--ink-soft)" strokeDasharray="2 4" />
      <path className="bday-ink" d={d} />
      <line x1={X(n)} x2={X(n)} y1={Y(p)} y2={H - m.b} stroke="var(--ink)" strokeDasharray="2 3" />
      <circle cx={X(n)} cy={Y(p)} r={6} fill="var(--marker)" stroke="var(--ink)" strokeWidth={2} />
      <text className="bday-h bday-at" x={left ? X(n) - 10 : X(n) + 10} y={left ? Y(p) - 8 : Y(p) + 18} textAnchor={left ? 'end' : 'start'}>
        {n} → {pct(p)}
      </text>
    </svg>
  )
}

function CaseCard({ c, n }: { c: Case; n: number }) {
  const [ref, w] = useWidth<HTMLDivElement>(420)
  return (
    <div ref={ref} className="bday-card bday-cmp-case">
      <h3 className="bday-cmp-title">{c.title}</h3>
      <p className="bday-sub bday-cmp-what">{c.what}</p>
      <div className="bday-cmp-pic">
        <Ring slots={c.xMax} n={n} label={`${n} ${c.thing} on a ring, a line for each of the ${pairs(n).toLocaleString('en-US')} pairs`} />
        <div className="bday-cmp-stats">
          <div><b className="bday-num bday-cmp-big">{n}</b> <span>{c.thing}</span></div>
          <div><span className="bday-hl bday-num bday-cmp-pairs">{pairs(n).toLocaleString('en-US')} pairs</span></div>
          <div><b className="bday-num bday-cmp-pct">{pct(pAnyMatch(n, c.options))}</b> <span>match</span></div>
        </div>
      </div>
      <MiniCurve c={c} n={n} width={Math.max(240, w - 24)} />
    </div>
  )
}

export function Compare({ onPick, onNext }: { onPick: (c: CompareChoice) => void; onNext: () => void }) {
  const [room, setRoom] = useState(10)
  const [moved, setMoved] = useState(false)
  const [picked, setPicked] = useState<CompareChoice | null>(null)
  const [words, setWords] = useState('')
  const pick = (c: CompareChoice) => {
    if (picked) return
    setPicked(c)
    onPick(c)
  }
  const set = (v: number) => {
    setRoom(v)
    setMoved(true)
  }
  const ns = [room, pinCrowd(room)]
  const ratio = (c: Case) => pairs(halfAt(c)) / c.options
  const chosen = CHOICES.find((x) => x.id === picked)
  return (
    <div>
      <div className="bday-card bday-cmp-dial">
        <div className="bday-tag">crowd size · drag</div>
        <input className="bday-range" type="range" min={ROOM_LO} max={ROOM_HI} value={room} aria-label="crowd size: moves both crowds together" onChange={(e) => set(Number(e.target.value))} />
        <div className="bday-row bday-cmp-jumps">
          {[5, 23, 40].map((v) => (
            <button key={v} className="bday-btn bday-ghost bday-sm bday-cmp-jump" aria-pressed={room === v} onClick={() => set(v)}>
              {v} &amp; {pinCrowd(v)}
            </button>
          ))}
        </div>
      </div>
      <div className="bday-cmp-grid bday-mt">
        {CASES.map((c, i) => (
          <CaseCard key={c.key} c={c} n={ns[i]} />
        ))}
      </div>
      {moved && (
        <div className="bday-card bday-cmp-ask bday-mt">
          <p className="bday-ask">What's the same about how these work?</p>
          <div className="bday-cmp-choices" role="group" aria-label="what's the same">
            {CHOICES.map((x) => (
              <button key={x.id} className="bday-choice bday-cmp-choice" aria-pressed={picked === x.id} disabled={picked != null} onClick={() => pick(x.id)}>
                {x.text}
                {picked === x.id && <span className={'bday-stamp bday-mini ' + (x.id === 'pairs' ? 'bday-stamp-called' : 'bday-stamp-off')}>{x.id === 'pairs' ? 'spot on' : 'not quite'}</span>}
              </button>
            ))}
          </div>
          <form
            className="bday-cmp-own"
            onSubmit={(e) => {
              e.preventDefault()
              if (words.trim()) pick('own')
            }}
          >
            <input className="bday-cmp-input" value={words} maxLength={140} disabled={picked != null} placeholder="or type it…" aria-label="say it in your own words" onChange={(e) => setWords(e.target.value)} />
            <button className="bday-btn bday-ghost bday-sm" type="submit" disabled={picked != null || !words.trim()}>That's it</button>
          </form>
        </div>
      )}
      {picked && (
        <div className="bday-card bday-cmp-principle bday-mt">
          <div className="bday-tag">the shared idea</div>
          {chosen ? <p className="bday-hint bday-cmp-why">{chosen.why}</p> : <p className="bday-hint bday-cmp-why">You said: <span className="bday-pencil-c">“{words.trim()}”</span></p>}
          <h3 className="bday-named">{PRINCIPLE}</h3>
          <p className="bday-sub">
            Coin flip at <b className="bday-num">{halfAt(CASES[0])}</b> people ({pairs(halfAt(CASES[0]))} pairs, {Math.round(ratio(CASES[0]) * 100)}% of {DAYS}) and <b className="bday-num">{halfAt(CASES[1])}</b> people ({pairs(halfAt(CASES[1])).toLocaleString('en-US')} pairs, {Math.round(ratio(CASES[1]) * 100)}% of {PINS.toLocaleString('en-US')}). Exact: 1 − ∏ (N − k)/N.
          </p>
          <div className="bday-row">
            <button className="bday-btn bday-go" onClick={onNext}>Try it on a new one →</button>
          </div>
        </div>
      )}
    </div>
  )
}
