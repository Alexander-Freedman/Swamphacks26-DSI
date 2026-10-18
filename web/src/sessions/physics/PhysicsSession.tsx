import { useEffect, useRef, useState } from 'react'
import { record } from '../../notebook'
import { EndBar, Frame, SessionHead, Title } from '../../components/session/Shell'
import { BackToTopics, Choices, SubjectMenu, Verdict } from '../../components/subject/SubjectMenu'
import { at, fallTime, flightTime, PROJ_MISTAKES, range, topSpeed, type ProjMistake } from './projectile'
import { SECTIONS, type PhysTopic } from './topics'
import './physics.css'

/** Physics opens on a chapter menu, so practice is on purpose, not a fixed path. */
export function PhysicsSession({ onDone }: { onDone: () => void }) {
  const [topic, setTopic] = useState<PhysTopic | null>(null)
  const [play, setPlay] = useState(0)
  const pick = (t: PhysTopic) => {
    setTopic(t)
    setPlay((p) => p + 1)
  }
  if (!topic) return <SubjectMenu subject="Physics" className="phys" sections={SECTIONS} onPick={pick} />
  return <ProjectileRun key={play} topic={topic} onTopics={() => setTopic(null)} onDone={onDone} />
}

/* ---------- projectile motion ---------- */

const CLIFF = 20 // m, the drop test
const SIDE = 12 // m/s, the sideways ball
const TARGET = 40 // m
const HIT = 2 // m either side counts
const W = 560
const H = 300
const sx = (x: number) => 46 + x * 8.2
const sy = (y: number) => H - 30 - y * 8
const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

type Phase = 'drop' | 'dropping' | 'aim' | 'top' | 'angle' | 'compare' | 'done'
type Shot = { v: number; deg: number }

const QS = {
  drop: {
    ask: `Two balls leave the top of a ${CLIFF} m cliff at the same moment. One is just dropped; the other is fired sideways at ${SIDE} m/s. Which hits the ground first?`,
    choices: [
      { id: 'dropped' as const, text: 'The dropped one', sub: 'it falls straight down' },
      { id: 'fired' as const, text: 'The fired one', sub: 'it’s moving faster' },
      { id: 'same' as const, text: 'They land together', sub: 'at the same moment' },
    ],
    answer: 'same',
    traps: { dropped: 'sideways-falls-slower', fired: 'sideways-falls-slower' } as Partial<Record<string, ProjMistake>>,
    why: 'Gravity pulls both down exactly the same way. The sideways speed only carries the fired ball farther. Watch the dots: same height at every tick.',
  },
  top: {
    ask: 'At the very top of its arc, how fast is the ball moving?',
    choices: [
      { id: 'zero' as const, text: 'Not at all', sub: 'it stops for a moment' },
      { id: 'side' as const, text: 'Just its sideways speed', sub: 'the up/down part is 0' },
      { id: 'max' as const, text: 'Fastest of the whole flight', sub: '' },
    ],
    answer: 'side',
    traps: { zero: 'zero-speed-at-top' } as Partial<Record<string, ProjMistake>>,
    why: '',
  },
  angle: {
    ask: 'Same launch speed. Which angle lands farthest?',
    choices: [
      { id: '30' as const, text: '30°', sub: 'low and fast' },
      { id: '45' as const, text: '45°', sub: 'halfway' },
      { id: '60' as const, text: '60°', sub: 'high and slow' },
      { id: '75' as const, text: '75°', sub: 'almost straight up' },
    ],
    answer: '45',
    traps: { '60': 'steeper-goes-farther', '75': 'steeper-goes-farther' } as Partial<Record<string, ProjMistake>>,
    why: 'Higher angles stay up longer but move sideways slower; 45° balances the two. Notice 30° and 60° land in the same spot.',
  },
}

function ProjectileRun({ topic, onTopics, onDone }: { topic: PhysTopic; onTopics: () => void; onDone: () => void }) {
  const title = useRef<HTMLHeadingElement>(null)
  const [phase, setPhase] = useState<Phase>('drop')
  const [wrong, setWrong] = useState<string[]>([])
  const [verdict, setVerdict] = useState<{ right: boolean; label?: string; line: string } | null>(null)
  const [mistakes, setMistakes] = useState<ProjMistake[]>([])
  const [t, setT] = useState(0) // animation clock, seconds of flight
  const [running, setRunning] = useState<number | null>(null) // end time while animating
  const [deg, setDeg] = useState(30)
  const [v, setV] = useState(16)
  const [shots, setShots] = useState<Shot[]>([])
  const last = shots.at(-1)
  const lastRange = last ? range(last.v, last.deg) : null
  const hit = lastRange != null && Math.abs(lastRange - TARGET) <= HIT && running == null

  // play the flight from 0 to `end` seconds
  const animate = (end: number) => {
    if (reducedMotion()) {
      setT(end)
      return
    }
    setT(0)
    setRunning(end)
  }
  useEffect(() => {
    if (running == null) return
    const start = performance.now()
    const id = setInterval(() => {
      const s = ((performance.now() - start) / 1000) * 1.2
      if (s >= running) {
        setT(running)
        setRunning(null)
        clearInterval(id)
      } else setT(s)
    }, 30)
    return () => clearInterval(id)
  }, [running])
  // the drop test is over once its animation has stopped
  const dropped = phase === 'dropping' && running == null

  const q = phase === 'drop' ? QS.drop : phase === 'top' ? QS.top : phase === 'angle' ? QS.angle : null
  const answer = (id: string) => {
    if (!q) return
    if (id === q.answer) {
      setWrong([])
      if (phase === 'drop') {
        setVerdict({ right: true, line: q.why })
        setPhase('dropping')
        animate(fallTime(CLIFF))
      } else if (phase === 'top') {
        setVerdict({ right: true, line: `Up/down speed is 0 at the top, but the sideways part, ${topSpeed(last!.v, last!.deg).toFixed(1)} m/s, never changed.` })
        setPhase('angle')
      } else {
        setVerdict({ right: true, line: q.why })
        setPhase('compare')
      }
      return
    }
    setWrong((w) => [...w, id])
    const m = q.traps[id]
    if (m) {
      setMistakes((all) => (all.includes(m) ? all : [...all, m]))
      setVerdict({ right: false, label: PROJ_MISTAKES[m].label, line: PROJ_MISTAKES[m].line })
    } else setVerdict({ right: false, line: 'Try another one.' })
  }

  const launch = () => {
    setVerdict(null)
    setShots((s) => [...s, { v, deg }])
    animate(flightTime(v, deg))
  }

  const saved = useRef(false)
  const finish = () => {
    setPhase('done')
    if (saved.current) return
    saved.current = true
    record({ session: 'physics', at: new Date().toISOString(), guess: '', misconception: mistakes[0] ?? null, rematch: null, mistakes, physTopic: topic.id })
  }

  const dropScene = phase === 'drop' || phase === 'dropping'
  return (
    <Frame className="subject phys">
      <SessionHead chip={`Physics · ${topic.title}`} step={dropScene ? 1 : 2} total={2} />
      <BackToTopics subject="Physics" onClick={onTopics} />
      <Title
        h="Projectile motion."
        sub="A thrown ball does two things at once: it moves sideways at a steady speed, and it falls exactly like a dropped ball. Predict, then watch the two motions split apart."
        headingRef={title}
      />
      <div className="sj-two">
        <div className="sj-card">
          <div className="sj-k">{dropScene ? `the cliff · ${CLIFF} m` : `the field · target at ${TARGET} m`}</div>
          {dropScene ? <DropField t={phase === 'drop' ? 0 : t} /> : <AimField shots={shots} t={t} live={running != null} compare={phase === 'compare' || phase === 'done'} v={last?.v ?? v} />}
          {!dropScene && lastRange != null && running == null && phase === 'aim' && (
            <p className="sj-small" role="status">
              Landed at <b className="sj-num">{lastRange.toFixed(1)} m</b>: {hit ? 'right on the target.' : `${Math.abs(lastRange - TARGET).toFixed(1)} m ${lastRange < TARGET ? 'short' : 'long'}.`}
            </p>
          )}
        </div>
        <div className="sj-col">
          {q && (
            <div className="sj-card">
              <p className="sj-ask">{q.ask}</p>
              <Choices choices={q.choices} wrong={wrong} onPick={answer} label="your answer" />
            </div>
          )}
          {verdict && <Verdict {...verdict} />}
          {dropped && (
            <button className="sj-btn sj-go" onClick={() => { setVerdict(null); setT(0); setPhase('aim') }}>
              Now aim for a target →
            </button>
          )}
          {phase === 'aim' && (
            <div className="sj-card">
              <p className="sj-ask">Set the angle and speed, then launch. Land within {HIT} m of the flag at {TARGET} m.</p>
              <label className="sj-range">
                <span>angle {deg}°</span>
                <input type="range" min={10} max={80} value={deg} disabled={running != null} onChange={(e) => setDeg(+e.target.value)} aria-label="launch angle" />
              </label>
              <label className="sj-range">
                <span>speed {v} m/s</span>
                <input type="range" min={8} max={30} value={v} disabled={running != null} onChange={(e) => setV(+e.target.value)} aria-label="launch speed" />
              </label>
              {!hit && <button className="sj-btn sj-go ph-launch" disabled={running != null} onClick={launch}>Launch</button>}
              {hit && (
                <>
                  <Verdict right line={`Hit! ${last!.deg}° at ${last!.v} m/s lands at ${lastRange!.toFixed(1)} m.`} />
                  <button className="sj-btn sj-go ph-launch" onClick={() => { setVerdict(null); setPhase('top') }}>Next question →</button>
                </>
              )}
              {shots.length >= 3 && !hit && <p className="sj-small">Tip: angles near 45° go farthest for a given speed; more speed always helps.</p>}
            </div>
          )}
          {phase === 'compare' && (
            <div className="sj-card">
              <p className="sj-rule">
                <span>Sideways: <span className="sj-hl">steady speed</span>.</span>
                <span>Up and down: <span className="sj-hl">falls like a dropped ball</span>.</span>
                <span>Farthest at <span className="sj-hl">45°</span>.</span>
              </p>
              <button className="sj-btn sj-go ph-launch" onClick={finish}>Finish ✓</button>
            </div>
          )}
          {phase === 'done' && (
            <EndBar
              caught={null}
              rematch="right"
              line={mistakes.length ? <>Caught: {mistakes.map((m) => `“${PROJ_MISTAKES[m].label}”`).join(', ')}.</> : <span className="ph-mastered">✓ mastered</span>}
              remix="Next: position, velocity and acceleration graphs."
              onDone={onDone}
            />
          )}
        </div>
      </div>
    </Frame>
  )
}

/* ---------- drawings ---------- */

const TICK = 0.25 // s between strobe dots

function DropField({ t }: { t: number }) {
  const ticks = Array.from({ length: Math.floor(t / TICK) + 1 }, (_, k) => k * TICK)
  const cliffX = sx(4)
  const drop = (s: number) => ({ x: sx(4), y: sy(CLIFF - (9.8 * s * s) / 2) })
  const fired = (s: number) => ({ x: sx(4 + SIDE * s), y: sy(CLIFF - (9.8 * s * s) / 2) })
  const now = Math.min(t, fallTime(CLIFF))
  return (
    <svg className="sj-svg ph-field" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`two balls falling from a ${CLIFF} m cliff; ${t.toFixed(2)} s in, both at height ${Math.max(0, CLIFF - 4.9 * now * now).toFixed(1)} m`}>
      <rect className="ph-cliff" x={0} y={sy(CLIFF)} width={cliffX} height={sy(0) - sy(CLIFF)} />
      <line className="ph-ground" x1={0} y1={sy(0)} x2={W} y2={sy(0)} />
      {ticks.map((s) => (
        <g key={s}>
          <line className="ph-link" x1={drop(s).x} y1={drop(s).y} x2={fired(s).x} y2={fired(s).y} />
          <circle className="ph-ghost" cx={drop(s).x} cy={drop(s).y} r={4} />
          <circle className="ph-ghost fired" cx={fired(s).x} cy={fired(s).y} r={4} />
        </g>
      ))}
      <circle className="ph-ball" cx={drop(now).x} cy={drop(now).y} r={8} />
      <circle className="ph-ball fired" cx={fired(now).x} cy={fired(now).y} r={8} />
      <text className="ph-lab" x={sx(4) - 6} y={sy(CLIFF) - 10} textAnchor="end">dropped</text>
      <text className="ph-lab" x={sx(4) + 14} y={sy(CLIFF) - 10}>fired →</text>
    </svg>
  )
}

function path(v: number, deg: number) {
  const T = flightTime(v, deg)
  return Array.from({ length: 41 }, (_, k) => at(v, deg, (T * k) / 40)).map((p) => `${sx(p.x).toFixed(1)},${sy(Math.max(0, p.y)).toFixed(1)}`).join(' ')
}

function AimField({ shots, t, live, compare, v }: { shots: Shot[]; t: number; live: boolean; compare: boolean; v: number }) {
  const last = shots.at(-1)
  const ball = last ? at(last.v, last.deg, Math.min(t, flightTime(last.v, last.deg))) : null
  return (
    <svg className="sj-svg ph-field" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={compare ? `30, 45 and 60 degree launches at ${v} m/s` : `the field with a target at ${TARGET} m`}>
      <line className="ph-ground" x1={0} y1={sy(0)} x2={W} y2={sy(0)} />
      {[0, 10, 20, 30, 40, 50, 60].map((m) => (
        <text key={m} className="ph-tick" x={sx(m)} y={sy(0) + 16}>{m}</text>
      ))}
      <rect className="ph-target" x={sx(TARGET - HIT)} y={sy(0) - 5} width={sx(TARGET + HIT) - sx(TARGET - HIT)} height={10} />
      <line className="ph-flag" x1={sx(TARGET)} y1={sy(0)} x2={sx(TARGET)} y2={sy(4)} />
      <polygon className="ph-flagcloth" points={`${sx(TARGET)},${sy(4)} ${sx(TARGET) + 16},${sy(3.4)} ${sx(TARGET)},${sy(2.8)}`} />
      {compare
        ? [30, 45, 60].map((d) => (
            <g key={d}>
              <polyline className={'ph-path' + (d === 45 ? ' best' : '')} points={path(v, d)} />
              <text className="ph-lab" x={sx(at(v, d, flightTime(v, d) / 2).x)} y={sy(at(v, d, flightTime(v, d) / 2).y) - 8}>{d}°</text>
            </g>
          ))
        : shots.map((s, i) => <polyline key={i} className={'ph-path' + (i === shots.length - 1 ? ' last' : ' old')} points={i === shots.length - 1 && live ? path(s.v, s.deg).split(' ').slice(0, Math.max(2, Math.round((t / flightTime(s.v, s.deg)) * 40) + 1)).join(' ') : path(s.v, s.deg)} />)}
      {!compare && ball && <circle className="ph-ball fired" cx={sx(ball.x)} cy={sy(Math.max(0, ball.y))} r={7} />}
      <rect className="ph-launcher" x={sx(0) - 10} y={sy(0) - 10} width={20} height={10} />
    </svg>
  )
}
