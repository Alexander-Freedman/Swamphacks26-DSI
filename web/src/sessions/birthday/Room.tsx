import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useWidth } from './chart'
import { addPeople, dayLabel, FIRST_ROOM_SEED, firstMatchAt, MONTH_LEN, monthDay, pairs, rng, ROOM_MAX, roomUntilMatch, sharedDays, sizeForChance } from './math'

const MONTH_LETTER = 'JFMAMJJASOND'
const BAR_MAX = 300

type Props = { guess: number; onMatchState: (matched: boolean) => void; onNext: () => void }

export function Room({ guess, onMatchState, onNext }: Props) {
  // One seeded stream per mount, so the first room is the same every time (first match at 23).
  const [stream] = useState(() => ({ r: rng(FIRST_ROOM_SEED) }))
  const [days, setDays] = useState<number[]>([])
  const daysRef = useRef<number[]>([])
  const [tries, setTries] = useState<number[]>([])
  const triesRef = useRef<number[]>([])
  const [mine, setMine] = useState(-1)
  const [sims, setSims] = useState(0)
  const hold = useRef<{ t?: number; i?: number }>({})

  const n = days.length
  const first = firstMatchAt(days)
  const matched = first != null
  const firstDay = matched ? days[first - 1] : null
  const firstPair: [number, number] | null = matched ? [days.indexOf(firstDay!), first - 1] : null
  const shared = sharedDays(days)
  const full = n >= ROOM_MAX

  useEffect(() => onMatchState(tries.length > 0), [tries.length, onMatchState])

  const stopHold = () => {
    window.clearTimeout(hold.current.t)
    window.clearInterval(hold.current.i)
    hold.current = {}
  }
  useEffect(() => stopHold, [])

  const add = (k: number) => {
    const cur = daysRef.current
    const had = firstMatchAt(cur) != null
    // +5 and holding stop on the first match so the moment lands; after it, they keep going.
    const next = addPeople(cur, k, stream.r, !had)
    if (next.length === cur.length) return stopHold()
    daysRef.current = next
    setDays(next)
    const f = had ? null : firstMatchAt(next)
    if (f != null) {
      stopHold()
      setMine(triesRef.current.length)
      triesRef.current = [...triesRef.current, f]
      setTries(triesRef.current)
    }
  }

  const startHold = () => {
    stopHold()
    add(1)
    hold.current.t = window.setTimeout(() => {
      hold.current.i = window.setInterval(() => add(1), 130)
    }, 380)
  }

  const again = () => {
    stopHold()
    daysRef.current = []
    setDays([])
  }

  const run20 = () => {
    const more: number[] = []
    for (let k = 0; k < 20; k++) more.push(roomUntilMatch(stream.r).length)
    triesRef.current = [...triesRef.current, ...more]
    setTries(triesRef.current)
    setSims((s) => s + 20)
  }

  const [calRef, cw] = useWidth<HTMLDivElement>(560)
  const [plotRef, pw] = useWidth<HTMLDivElement>(700)
  const p = pairs(n).toLocaleString('en-US')

  return (
    <div className="bday-room">
      <div className="bday-roomgrid">
        <div ref={calRef} className={'bday-card bday-calcard' + (matched && n === first ? ' bday-shake' : '')}>
          <Calendar width={cw - 24} room={days} shared={shared} firstDay={firstDay} pair={firstPair} />
        </div>
        <div className="bday-side">
          {matched ? (
            <div className="bday-stampwrap">
              <span key={tries.length} className="bday-stamp bday-stamp-match">
                {shared.length > 1 ? `${shared.length} matches` : `match · ${dayLabel(firstDay!)}`}
              </span>
            </div>
          ) : null}
          <div className="bday-card bday-dock">
            {matched && <div className="bday-tag">first match at {first} people</div>}
            <div className="bday-countrow" aria-live="polite">
              <div><b className="bday-num">{n}</b> <span>{n === 1 ? 'person' : 'people'}</span></div>
              <div><b className="bday-num"><span className="bday-hl">{p}</span></b> <span>{n === 2 ? 'pair' : 'pairs'}</span></div>
            </div>
            <div className="bday-addrow">
              <button
                className="bday-btn"
                disabled={full}
                onPointerDown={(e) => {
                  if (e.button !== 0) return
                  e.preventDefault()
                  startHold()
                }}
                onPointerUp={stopHold}
                onPointerLeave={stopHold}
                onPointerCancel={stopHold}
                // keyboard and screen readers send a click with no pointer (detail 0)
                onClick={(e) => {
                  if (e.detail === 0) add(1)
                }}
                onContextMenu={(e) => e.preventDefault()}
              >
                + Add a person
              </button>
              <button className="bday-btn bday-ghost" disabled={full} aria-label="add 5 people" onClick={() => add(5)}>+5</button>
            </div>
            {matched ? (
              <button className="bday-btn bday-ghost bday-sm bday-again" onClick={again}>Empty the room, try again</button>
            ) : (
              <p className="bday-hint bday-holdhint">hold to add fast</p>
            )}
          </div>
          <div className="bday-card bday-details">
            <div className="bday-bars" aria-hidden>
              <span>people</span>
              <i className="bday-bar" style={{ width: `${Math.min(100, (n / BAR_MAX) * 100)}%` }} />
              <span>pairs who could match (same scale)</span>
              <i className="bday-bar bday-bar-pairs" style={{ width: `${Math.min(100, (pairs(n) / BAR_MAX) * 100)}%` }} />
            </div>
            <p className="bday-note">{roomNote(n, first, firstDay, firstPair, shared.length)}</p>
          </div>
        </div>
      </div>

      {tries.length > 0 && (
        <div className="bday-card bday-plotcard">
          <div ref={plotRef} className="bday-plotwrap">
            <DotPlot width={pw} tries={tries} guess={guess} mine={mine} />
            <div className="bday-plotkey" aria-hidden>
              <span><i className="bday-k-dot" />one room</span>
              {mine >= 0 && <span><i className="bday-k-mine" />your room</span>}
              <span><i className="bday-k-band" />half of all rooms land here (exact)</span>
            </div>
          </div>
          <div className="bday-plotside">
            <div className="bday-tag">{tries.length} {tries.length === 1 ? 'room' : 'rooms'} so far{sims ? ` · ${sims} simulated fast` : ''}</div>
            <p className="bday-big-hand">
              Middle room: <b>{median(tries)} people</b>.
            </p>
            <p className="bday-note">
              {guess > Math.max(...tries)
                ? `No room needed your ${guess}; the most any room took was ${Math.max(...tries)}.`
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

function roomNote(n: number, first: number | null, firstDay: number | null, pair: [number, number] | null, matches: number) {
  if (n === 0) return 'An empty room. Add people one by one.'
  if (first == null) return 'Every line is one pair who could share a birthday.'
  const at = `Person ${first} walked in on ${dayLabel(firstDay!)}. Person ${pair![0] + 1} was already there.`
  if (n === first) return `${at} ${pairs(n).toLocaleString('en-US')} pairs to check, and one hit.`
  const tail = n >= ROOM_MAX ? ' The room is full.' : ' Keep adding: watch the matches pile up.'
  return `First match at ${first} people. Now ${n} people make ${pairs(n).toLocaleString('en-US')} pairs, and ${matches} ${matches === 1 ? 'day is' : 'days are'} shared.${tail}`
}

function median(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.floor((s.length - 1) / 2)]
}

function Calendar({ width, room, shared, firstDay, pair }: { width: number; room: number[]; shared: number[]; firstDay: number | null; pair: [number, number] | null }) {
  const L = 22
  const T = 22
  const cell = (width - L - 2) / 31
  const rowH = Math.max(15, Math.min(30, cell * 1.05))
  const h = T + rowH * 12 + 4
  const center = (day: number) => {
    const [m, d] = monthDay(day)
    return [L + d * cell + cell / 2, T + m * rowH + rowH / 2] as const
  }
  const r = Math.max(3.2, Math.min(7, cell * 0.36))
  const pts = room.map(center)
  const isShared = new Set(shared)
  const lines: ReactNode[] = []
  for (let i = 0; i < pts.length; i++)
    for (let j = i + 1; j < pts.length; j++) {
      if (room[i] === room[j]) continue
      lines.push(<line key={i + '-' + j} className="bday-pairline" x1={pts[i][0]} y1={pts[i][1]} x2={pts[j][0]} y2={pts[j][1]} />)
    }
  const label = `365-day calendar with ${room.length} ${room.length === 1 ? 'person' : 'people'} on their birthdays` + (shared.length ? `, ${shared.length} shared ${shared.length === 1 ? 'day' : 'days'}` : '')
  return (
    <svg className="bday-cal" width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img" aria-label={label}>
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
      {shared.map((day) => (
        <g key={day} className="bday-ring">
          <circle cx={center(day)[0]} cy={center(day)[1]} r={day === firstDay ? Math.max(13, cell * 1.3) : Math.max(10, cell)} fill="var(--marker-soft)" stroke="var(--marker)" strokeWidth={day === firstDay ? 5 : 3.5} />
        </g>
      ))}
      {pts.map(([x, y], i) => {
        const hit = isShared.has(room[i])
        const inPair = pair != null && (pair[0] === i || pair[1] === i)
        return (
          <g key={i} className="bday-person" style={{ transformOrigin: `${x}px ${y}px` }}>
            <circle cx={x} cy={y} r={inPair ? r + 1.5 : r} fill={hit ? 'var(--off)' : 'var(--ink)'} stroke="var(--card)" strokeWidth={1.2} />
          </g>
        )
      })}
    </svg>
  )
}

/**
 * One dot per room at the size of its first match. On a phone the axis is 0-60 and rooms are grouped
 * in 2s, so dots and text stay big enough to read; rooms past the end sit on the last column.
 */
function DotPlot({ width, tries, guess, mine }: { width: number; tries: number[]; guess: number; mine: number }) {
  const narrow = width < 520
  const max = narrow ? 60 : 70
  const bin = narrow ? 2 : 1
  const l = 16
  const r = 22
  const sx = (v: number) => l + (Math.min(max, v) / max) * (width - l - r)
  const col = (v: number) => Math.min(Math.floor(max / bin) - 1, Math.floor(v / bin))
  const colX = (c: number) => sx((c + 0.5) * bin)
  const dot = narrow ? Math.min(6, ((width - l - r) / (max / bin)) * 0.46) : Math.max(4.5, Math.min(7, width / 110))
  const counts = new Map<number, number>()
  const placed = tries.map((v) => {
    const c = col(v)
    const k = counts.get(c) ?? 0
    counts.set(c, k + 1)
    return { c, k }
  })
  const step = dot * 2.1
  const maxStack = Math.max(1, ...counts.values())
  const top = 52
  const base = top + Math.max(4, maxStack + 1) * step
  const h = base + (narrow ? 46 : 42)
  const q1 = sizeForChance(0.25)
  const q3 = sizeForChance(0.75)
  const yOf = (k: number) => base - dot - 2 - k * step
  const ticks = narrow ? [0, 10, 20, 30, 40, 50, 60] : [0, 10, 20, 30, 40, 50, 60, 70]
  const gx = guess <= max ? sx(guess) : width - r + 6
  const gRight = gx > width * 0.6
  return (
    <svg
      className={'bday-plot' + (narrow ? ' bday-plot-narrow' : '')}
      width={width}
      height={h}
      viewBox={`0 0 ${width} ${h}`}
      role="img"
      aria-label={`${tries.length} ${tries.length === 1 ? 'room' : 'rooms'}: people in the room when the first match happened, one dot per room. Your guess: ${guess}.`}
    >
      <rect x={sx(q1)} y={top - 6} width={sx(q3) - sx(q1)} height={base - top + 6} fill="var(--marker-soft)" />
      <line className="bday-axis" x1={l} x2={width - r} y1={base} y2={base} />
      {ticks.map((v) => (
        <text key={v} className="bday-tick" x={sx(v)} y={base + 17} textAnchor="middle">{v === max ? `${v}+` : v}</text>
      ))}
      <text className="bday-axlabel" x={(l + width - r) / 2} y={base + 36} textAnchor="middle">{narrow ? 'people at the first match' : 'people in the room when the first match happened'}</text>
      <line className="bday-you" x1={gx} x2={gx} y1={10} y2={base} />
      <text className="bday-h bday-pencil-t" x={gx + (gRight ? -6 : 6)} y={24} textAnchor={gRight ? 'end' : 'start'}>
        your guess: {guess}{guess > max ? ' →' : ''}
      </text>
      {placed.map(({ c, k }, i) => (
        <circle key={i} className="bday-dotin" cx={colX(c)} cy={yOf(k)} r={dot} fill={i === mine ? 'var(--off)' : 'var(--ink)'} />
      ))}
      {mine >= 0 && mine < placed.length && (
        <circle cx={colX(placed[mine].c)} cy={yOf(placed[mine].k)} r={dot + 4} fill="none" stroke="var(--marker)" strokeWidth={4} />
      )}
    </svg>
  )
}
