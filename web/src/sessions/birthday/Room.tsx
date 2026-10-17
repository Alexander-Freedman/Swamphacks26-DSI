import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useWidth } from './chart'
import { dayLabel, FIRST_ROOM_SEED, MONTH_LEN, monthDay, pairs, rng, roomUntilMatch, sizeForChance } from './math'

const MONTH_LETTER = 'JFMAMJJASOND'
const BAR_MAX = 300

type Props = { guess: number; onMatchState: (matched: boolean) => void; onNext: () => void }

export function Room({ guess, onMatchState, onNext }: Props) {
  // A fresh seeded stream per mount, so the first room is the same every time (even if React runs this twice).
  const [stream] = useState(() => {
    const r = rng(FIRST_ROOM_SEED)
    return { r, first: roomUntilMatch(r) }
  })
  const [planned, setPlanned] = useState<number[]>(stream.first)
  const [shown, setShown] = useState(0)
  const [tries, setTries] = useState<number[]>([])
  const [sims, setSims] = useState(0)
  const hold = useRef<{ t?: number; i?: number }>({})

  const room = planned.slice(0, shown)
  const matched = shown === planned.length
  const n = room.length
  const matchDay = matched ? planned[planned.length - 1] : null
  const first = matched ? planned.indexOf(matchDay!) : -1

  useEffect(() => onMatchState(tries.length > 0), [tries.length, onMatchState])

  const stopHold = () => {
    window.clearTimeout(hold.current.t)
    window.clearInterval(hold.current.i)
    hold.current = {}
  }
  useEffect(() => stopHold, [])

  const shownRef = useRef(0)
  const add = (k: number) => {
    const s = shownRef.current
    const next = Math.min(planned.length, s + k)
    if (next === s) return
    shownRef.current = next
    setShown(next)
    if (next === planned.length) {
      stopHold()
      setTries((t) => [...t, planned.length])
    }
  }
  useEffect(() => {
    if (matched) stopHold()
  }, [matched])

  const startHold = () => {
    if (matched) return
    add(1)
    hold.current.t = window.setTimeout(() => {
      hold.current.i = window.setInterval(() => add(1), 130)
    }, 380)
  }

  const again = () => {
    setPlanned(roomUntilMatch(stream.r))
    shownRef.current = 0
    setShown(0)
  }

  const run20 = () => {
    const more: number[] = []
    for (let k = 0; k < 20; k++) more.push(roomUntilMatch(stream.r).length)
    setTries((t) => [...t, ...more])
    setSims((s) => s + 20)
  }

  const [calRef, cw] = useWidth<HTMLDivElement>(560)
  const [plotRef, pw] = useWidth<HTMLDivElement>(700)

  return (
    <div className="bday-room">
      <div className="bday-roomgrid">
        <div ref={calRef} className={'bday-card bday-calcard' + (matched ? ' bday-shake' : '')}>
          <Calendar width={cw - 24} room={room} matchDay={matchDay} pair={matched ? [first, n - 1] : null} />
        </div>
        <div className="bday-side">
          {matched ? (
            <div className="bday-stampwrap">
              <span key={tries.length} className="bday-stamp bday-stamp-match">match · {dayLabel(matchDay!)}</span>
            </div>
          ) : null}
          <div className="bday-card bday-counters" aria-live="polite">
            {matched && <div className="bday-tag">first match at</div>}
            <div className="bday-countrow">
              <div><b className="bday-num">{n}</b> <span>people</span></div>
              <div><b className="bday-num"><span className="bday-hl">{pairs(n).toLocaleString('en-US')}</span></b> <span>pairs</span></div>
            </div>
            <div className="bday-bars" aria-hidden>
              <span>people</span>
              <i className="bday-bar" style={{ width: `${Math.min(100, (n / BAR_MAX) * 100)}%` }} />
              <span>pairs who could match (same scale)</span>
              <i className="bday-bar bday-bar-pairs" style={{ width: `${Math.min(100, (pairs(n) / BAR_MAX) * 100)}%` }} />
            </div>
            {matched ? (
              <p className="bday-note">
                Person {n} walked in on {dayLabel(matchDay!)}. Person {first + 1} was already there. {pairs(n).toLocaleString('en-US')} pairs to check, and one hit.
              </p>
            ) : (
              <p className="bday-note">{n === 0 ? 'An empty room. Add people one by one.' : 'Every line is one pair who could share a birthday.'}</p>
            )}
          </div>
          {matched ? (
            <button className="bday-btn" onClick={again}>Empty the room, try again</button>
          ) : (
            <div className="bday-addrow">
              <button
                className="bday-btn"
                onPointerDown={(e) => {
                  e.preventDefault()
                  startHold()
                }}
                onPointerUp={stopHold}
                onPointerLeave={stopHold}
                onPointerCancel={stopHold}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    add(1)
                  }
                }}
                onContextMenu={(e) => e.preventDefault()}
              >
                + Add a person
              </button>
              <button className="bday-btn bday-ghost" onClick={() => add(5)}>+5</button>
            </div>
          )}
          {!matched && <p className="bday-hint">hold to add fast</p>}
        </div>
      </div>

      {tries.length > 0 && (
        <div className="bday-card bday-plotcard">
          <div ref={plotRef} className="bday-plotwrap">
            <DotPlot width={pw - 4} tries={tries} guess={guess} current={matched ? tries.length - 1 : -1} />
          </div>
          <div className="bday-plotside">
            <div className="bday-tag">{tries.length} {tries.length === 1 ? 'room' : 'rooms'} so far{sims ? ` · ${sims} simulated fast` : ''}</div>
            <p className="bday-big-hand">
              Middle room: <b>{median(tries)} people</b>.
            </p>
            <p className="bday-note">
              {guess > Math.max(...tries)
                ? `Not one room needed anywhere near your ${guess}.`
                : `Your guess was ${guess}.`}
            </p>
            <div className="bday-row">
              <button className="bday-btn bday-ghost bday-sm" onClick={run20}>run 20 more rooms</button>
              <button className="bday-btn bday-go" onClick={onNext}>Next: draw your curve →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function median(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.floor((s.length - 1) / 2)]
}

function Calendar({ width, room, matchDay, pair }: { width: number; room: number[]; matchDay: number | null; pair: [number, number] | null }) {
  const L = 22
  const T = 22
  const cell = (width - L - 2) / 31
  const rowH = Math.max(18, Math.min(30, cell * 1.05))
  const h = T + rowH * 12 + 4
  const center = (day: number) => {
    const [m, d] = monthDay(day)
    return [L + d * cell + cell / 2, T + m * rowH + rowH / 2] as const
  }
  const r = Math.max(3.2, Math.min(7, cell * 0.36))
  const pts = room.map(center)
  const lines: ReactNode[] = []
  for (let i = 0; i < pts.length; i++)
    for (let j = i + 1; j < pts.length; j++) {
      const hit = pair && pair[0] === i && pair[1] === j
      if (!hit) lines.push(<line key={i + '-' + j} className="bday-pairline" x1={pts[i][0]} y1={pts[i][1]} x2={pts[j][0]} y2={pts[j][1]} />)
    }
  return (
    <svg className="bday-cal" width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img" aria-label={`365-day calendar with ${room.length} people on their birthdays`}>
      {[1, 10, 20, 31].map((d) => (
        <text key={d} className="bday-tick" x={L + (d - 1) * cell + cell / 2} y={14} textAnchor="middle">{d}</text>
      ))}
      {MONTH_LEN.map((len, m) => (
        <g key={m}>
          <text className="bday-tick bday-month" x={2} y={T + m * rowH + rowH / 2 + 4}>{MONTH_LETTER[m]}</text>
          {Array.from({ length: len }, (_, d) => (
            <rect key={d} className="bday-day" x={L + d * cell + 0.6} y={T + m * rowH + 1} width={cell - 1.2} height={rowH - 2} rx={2} />
          ))}
        </g>
      ))}
      <g>{lines}</g>
      {matchDay != null && (
        <g className="bday-ring">
          <circle cx={center(matchDay)[0]} cy={center(matchDay)[1]} r={Math.max(13, cell * 1.3)} fill="var(--marker-soft)" stroke="var(--marker)" strokeWidth={5} />
        </g>
      )}
      {pts.map(([x, y], i) => {
        const inPair = pair != null && (pair[0] === i || pair[1] === i)
        return (
          <g key={i} className="bday-person" style={{ transformOrigin: `${x}px ${y}px` }}>
            <circle cx={x} cy={y} r={inPair ? r + 1.5 : r} fill={inPair ? 'var(--off)' : 'var(--ink)'} stroke="var(--card)" strokeWidth={1.2} />
          </g>
        )
      })}
    </svg>
  )
}

const PLOT_MAX = 70

function DotPlot({ width, tries, guess, current }: { width: number; tries: number[]; guess: number; current: number }) {
  const l = 14
  const r = 18
  const sx = (v: number) => l + (Math.min(PLOT_MAX, v) / PLOT_MAX) * (width - l - r)
  const dot = Math.max(4.5, Math.min(7, width / 110))
  const counts = new Map<number, number>()
  const placed = tries.map((v) => {
    const k = counts.get(v) ?? 0
    counts.set(v, k + 1)
    return { v, k }
  })
  const maxStack = Math.max(1, ...counts.values())
  const base = 40 + Math.max(4, maxStack) * dot * 2.1
  const h = base + 42
  const q1 = sizeForChance(0.25)
  const q3 = sizeForChance(0.75)
  const yOf = (k: number) => base - dot - 2 - k * dot * 2.1
  return (
    <svg className="bday-plot" width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img" aria-label="people in the room when the first match happened, one dot per room">
      <rect x={sx(q1)} y={8} width={sx(q3) - sx(q1)} height={base - 8} fill="var(--marker-soft)" />
      <text className="bday-h" x={sx(q1) + 4} y={24}>{width < 480 ? 'half of rooms (exact)' : 'half of all rooms land here (exact)'}</text>
      <line className="bday-axis" x1={l} x2={width - r} y1={base} y2={base} />
      {[0, 10, 20, 30, 40, 50, 60, 70].map((v) => (
        <text key={v} className="bday-tick" x={sx(v)} y={base + 16} textAnchor="middle">{v}</text>
      ))}
      <text className="bday-axlabel" x={(l + width - r) / 2} y={base + 34} textAnchor="middle">{width < 480 ? 'people at the first match' : 'people in the room when the first match happened'}</text>
      {guess <= PLOT_MAX ? (
        <g>
          <line className="bday-you" x1={sx(guess)} x2={sx(guess)} y1={30} y2={base} />
          <text className="bday-h bday-pencil-t" x={sx(guess) + 5} y={44}>your guess: {guess}</text>
        </g>
      ) : (
        <g>
          <line className="bday-you" x1={width - r + 4} x2={width - r + 4} y1={30} y2={base} />
          <text className="bday-h bday-pencil-t" x={width - r - 2} y={44} textAnchor="end">your guess: {guess} →</text>
        </g>
      )}
      {placed.map(({ v, k }, i) => (
        <circle key={i} className="bday-dotin" cx={sx(v)} cy={yOf(k)} r={dot} fill="var(--ink)" />
      ))}
      {current >= 0 && (
        <g>
          <circle cx={sx(placed[current].v)} cy={yOf(placed[current].k)} r={dot + 4} fill="none" stroke="var(--marker)" strokeWidth={4} />
          <text className="bday-h" x={sx(placed[current].v)} y={yOf(placed[current].k) - dot - 10} textAnchor="middle">this room</text>
        </g>
      )}
    </svg>
  )
}
