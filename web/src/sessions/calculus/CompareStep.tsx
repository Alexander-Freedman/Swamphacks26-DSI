import { useEffect, useRef, useState } from 'react'
import { fix, position, speed, T1 } from './math'
import { Chart, Paper } from './Plot'
import { box, fnPath, reducedMotion, sx, sy, useWidth } from './frame'

type Choice = 'slope' | 'area' | 'shape'
const CHOICES: { id: Choice; text: string; right: boolean }[] = [
  { id: 'slope', text: 'Slope of the top graph = height of the bottom one', right: true },
  { id: 'shape', text: 'The two graphs have the same shape', right: false },
  { id: 'area', text: 'Area under the bottom graph = height of the top one', right: true },
]

export function CompareStep({ onPicked, done }: { onPicked: (firstWrong: boolean) => void; done: boolean }) {
  const [ref, w] = useWidth<HTMLDivElement>(900)
  const twoUp = w >= 640
  const pw = twoUp ? Math.floor((w - 14) / 2) : w
  const ph = Math.round(Math.min(250, Math.max(190, pw * 0.55)))
  const top = box(pw, ph, [0, T1], [0, 8.6], { l: 30 })
  const bot = box(pw, ph, [0, T1], [0, 3.4], { l: 30 })
  const [t, setT] = useState(1.5)
  const [picked, setPicked] = useState<Choice[]>([])
  const wrongFirst = useRef<boolean | null>(null)
  const raf = useRef(0)
  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const play = () => {
    cancelAnimationFrame(raf.current)
    if (reducedMotion()) return setT(T1)
    const start = performance.now()
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / 3000)
      setT(Math.round(k * T1 * 100) / 100)
      if (k < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
  }

  const pick = (c: Choice) => {
    if (picked.includes(c) || done) return
    const next = [...picked, c]
    setPicked(next)
    if (wrongFirst.current === null) wrongFirst.current = !CHOICES.find((x) => x.id === c)!.right
    if (next.includes('slope') && next.includes('area')) onPicked(wrongFirst.current)
  }

  const v = speed(t)
  const p = position(t)
  const tanLen = 0.7
  const area = `${fnPath(bot, speed, 0, Math.max(0.001, t), 80)}L${sx(bot, t)} ${sy(bot, 0)}L${sx(bot, 0)} ${sy(bot, 0)}Z`

  return (
    <section className="calc-step">
      <div className="calc-card calc-track" aria-hidden="true">
        <div className="calc-road">
          {Array.from({ length: 9 }, (_, i) => <span key={i} style={{ left: `${(i / 8) * 100}%` }}>{i}</span>)}
          <svg className="calc-car" style={{ left: `${(p / 8) * 100}%` }} width="34" height="20" viewBox="0 0 34 20">
            <path d="M3 13 L5 7 L11 6 L15 2 L25 2 L29 7 L32 9 L32 14 Z" />
            <circle cx="10" cy="15" r="3.5" />
            <circle cx="25" cy="15" r="3.5" />
          </svg>
        </div>
      </div>
      <div className="calc-row calc-timebar">
        <button className="calc-mini wide" onClick={play}>▶ drive</button>
        <label className="calc-lab calc-grow" htmlFor="calc-t">
          time <span className="calc-num">t = {fix(t, 1)} s</span>
          <input id="calc-t" type="range" min={0} max={T1} step={0.05} value={t} onChange={(e) => setT(+e.target.value)} />
        </label>
      </div>

      <div ref={ref} className={'calc-pair' + (twoUp ? ' two' : '')}>
        <div className="calc-card calc-tight">
          <p className="calc-k calc-paneltitle">position (m)</p>
          <Chart f={top} label={`position over time; at t = ${fix(t, 1)} s the slope is ${fix(v)} m/s`}>
            {(clip) => (
              <>
                <Paper f={top} yStep={2} xLabel="t" />
                <g clipPath={clip}>
                  <path d={fnPath(top, position)} className="calc-ink calc-curve" />
                  <line x1={sx(top, t - tanLen)} y1={sy(top, p - tanLen * v)} x2={sx(top, t + tanLen)} y2={sy(top, p + tanLen * v)} className="calc-tangent calc-tangent-marker" />
                  <line x1={sx(top, 0)} x2={sx(top, t)} y1={sy(top, p)} y2={sy(top, p)} className="calc-leg" />
                </g>
                <circle cx={sx(top, t)} cy={sy(top, p)} r={6} className="calc-dot" />
              </>
            )}
          </Chart>
          <p className="calc-panelread">slope <b className="calc-num calc-hl">{fix(v)}</b> · height <b className="calc-num calc-hl2">{fix(p)}</b></p>
        </div>
        <div className="calc-card calc-tight">
          <p className="calc-k calc-paneltitle">speed (m/s)</p>
          <Chart f={bot} label={`speed over time; the area up to t = ${fix(t, 1)} s is ${fix(p)} m`}>
            {(clip) => (
              <>
                <Paper f={bot} xLabel="t" />
                <g clipPath={clip}>
                  <path d={area} className="calc-areafill calc-areafill-2" />
                  <path d={fnPath(bot, speed)} className="calc-ink calc-curve" />
                  <line x1={sx(bot, t)} x2={sx(bot, t)} y1={sy(bot, 0)} y2={sy(bot, v)} className="calc-heightbar" />
                </g>
                <circle cx={sx(bot, t)} cy={sy(bot, v)} r={6} className="calc-dot" />
              </>
            )}
          </Chart>
          <p className="calc-panelread">height <b className="calc-num calc-hl">{fix(v)}</b> · area <b className="calc-num calc-hl2">{fix(p)}</b></p>
        </div>
      </div>

      <p className="calc-k calc-mt">tap what’s the same</p>
      <div className="calc-choices" role="group" aria-label="what's the same">
        {CHOICES.map((c) => {
          const on = picked.includes(c.id)
          return (
            <button key={c.id} className={'calc-choice' + (on ? (c.right ? ' right' : ' wrong') : '')} aria-pressed={on} onClick={() => pick(c.id)}>
              <span className="calc-mark" aria-hidden="true">{on ? (c.right ? '✓' : '✗') : ''}</span>
              {c.text}
            </button>
          )
        })}
      </div>
      {picked.includes('shape') && !done && <p className="calc-hand">not quite: speed peaks at t = 2, position keeps climbing</p>}
      {done && (
        <div className="calc-card calc-principle" role="status">
          <div className="calc-k">the idea, in ink</div>
          <p className="calc-rule">
            <span>slope</span> takes you <b>down</b> a graph. <span>area</span> brings you back <b>up</b>.
          </p>
          <svg className="calc-ladder" viewBox="0 0 300 80" aria-label="position, slope down to speed, area back up to position">
            <text x={40} y={45} textAnchor="middle" className="calc-ladder-t">position</text>
            <text x={260} y={45} textAnchor="middle" className="calc-ladder-t">speed</text>
            <path d="M95 30 C140 6 160 6 205 30" className="calc-ladder-a" markerEnd="url(#calc-arr)" />
            <path d="M205 52 C160 76 140 76 95 52" className="calc-ladder-a" markerEnd="url(#calc-arr)" />
            <text x={150} y={14} textAnchor="middle" className="calc-ladder-s">slope</text>
            <text x={150} y={78} textAnchor="middle" className="calc-ladder-s">area</text>
            <defs>
              <marker id="calc-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0 0L10 5L0 10z" fill="currentColor" />
              </marker>
            </defs>
          </svg>
          <p className="calc-small">Same as before: the slope of x³/3 − x is x² − 1, and the area under x² builds x³/3.</p>
        </div>
      )}
    </section>
  )
}
