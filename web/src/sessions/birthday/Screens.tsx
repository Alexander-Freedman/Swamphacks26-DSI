import { useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import type { Verdict } from '../../verdict'
import { ITEM, TRUTH_N, verdictOf } from './round'
import { CurveChart } from './CurveChart'
import { frameFor, ix, iy, sx, sy, useWidth } from './chart'
import { coverage, lineFromGuess, needForMe, pairs, pct, pMatch, pMine, resample, X_MAX, X_MIN, type Pt } from './math'


export type Confidence = 'unsure' | 'pretty sure' | 'certain'

/* ---------- B1 guess ---------- */
export function Guess({ onLock }: { onLock: (guess: number, conf: Confidence) => void }) {
  const [g, setG] = useState(100)
  const [touched, setTouched] = useState(false)
  const [conf, setConf] = useState<Confidence | null>(null)
  const [locking, setLocking] = useState(false)
  const ready = touched && conf != null
  return (
    <div className="bday-card bday-guess">
      <p className="bday-ask">{ITEM.prompt}</p>
      <div className="bday-tag">your guess</div>
      <div className="bday-guessnum bday-num" aria-live="polite">
        {touched ? g : '?'} <small>people</small>
      </div>
      <input
        className="bday-range"
        type="range"
        min={2}
        max={366}
        step={1}
        value={g}
        aria-label="your guess, people in the room"
        onChange={(e) => {
          setG(Number(e.target.value))
          setTouched(true)
        }}
      />
      <div className="bday-ends"><span>2</span><span>183 (half the year)</span><span>366</span></div>
      <div className="bday-tag bday-mt">how sure?</div>
      <div className="bday-choices" role="group" aria-label="how sure are you">
        {(['unsure', 'pretty sure', 'certain'] as Confidence[]).map((c) => (
          <button key={c} className="bday-choice" aria-pressed={conf === c} onClick={() => setConf(c)}>{c}</button>
        ))}
      </div>
      <button
        className={'bday-btn bday-lock' + (locking ? ' bday-squash' : '')}
        disabled={!ready}
        onClick={() => {
          if (!ready || locking) return
          setLocking(true)
          window.setTimeout(() => onLock(g, conf!), 260)
        }}
      >
        {touched ? (conf ? 'Lock it in' : 'Pick how sure you are') : 'Drag the slider first'}
      </button>
    </div>
  )
}

/* ---------- B4 draw ---------- */
export function Draw({ guess, onDone }: { guess: number; onDone: (curve: number[], skipped: boolean) => void }) {
  const [ref, w] = useWidth<HTMLDivElement>(700)
  const f = frameFor(w - 24)
  const [pts, setPts] = useState<Pt[]>([])
  const drawing = useRef(false)
  const toPt = (e: RPointerEvent<SVGSVGElement>): Pt => {
    const b = e.currentTarget.getBoundingClientRect()
    return { x: ix(f, e.clientX - b.left), y: iy(f, e.clientY - b.top) }
  }
  const clamp = (p: Pt): Pt => ({ x: Math.min(X_MAX, Math.max(X_MIN, p.x)), y: Math.min(1, Math.max(0, p.y)) })
  const raw = pts.map((p, i) => (i ? 'L' : 'M') + sx(f, clamp(p).x).toFixed(1) + ' ' + sy(f, clamp(p).y).toFixed(1)).join('')
  const cov = coverage(pts)
  const ok = cov >= 0.5
  return (
    <div>
      <div ref={ref} className="bday-card bday-chartcard">
        <CurveChart
          width={w - 24}
          rawPath={raw}
          guess={guess}
          coinFlip
          label="drawing pad: draw how the chance of a shared birthday grows from 2 to 80 people"
          pointer={{
            onPointerDown: (e) => {
              e.currentTarget.setPointerCapture(e.pointerId)
              drawing.current = true
              setPts([toPt(e)])
            },
            onPointerMove: (e) => {
              if (!drawing.current) return
              const p = toPt(e)
              setPts((a) => [...a, p])
            },
            onPointerUp: () => {
              drawing.current = false
            },
          }}
        >
          {!pts.length && (
            <text className="bday-h bday-drawhint" x={(f.l + f.w - f.r) / 2} y={sy(f, 0.78)} textAnchor="middle">
              drag from left to right ✎
            </text>
          )}
        </CurveChart>
      </div>
      <p className="bday-hint" aria-live="polite">
        {!pts.length ? 'Pencil only. Nothing is graded yet: this is the model you will test.' : ok ? 'Got it. Draw again to redo.' : 'keep going across the grid…'}
      </p>
      <div className="bday-row">
        <button className="bday-btn bday-go" disabled={!ok} onClick={() => onDone(resample(pts)!, false)}>Show me the real one</button>
        {pts.length > 0 && <button className="bday-btn bday-ghost bday-sm" onClick={() => setPts([])}>clear</button>}
        <button className="bday-btn bday-ghost bday-sm" onClick={() => onDone(lineFromGuess(guess), true)}>skip: draw a straight line through my guess</button>
      </div>
    </div>
  )
}

/* ---------- B5 reveal + extremes ---------- */
const BREAKS = [23, 57]

export function Reveal({ guess, curve, skipped, onNext }: { guess: number; curve: number[]; skipped: boolean; onNext: () => void }) {
  const [ref, w] = useWidth<HTMLDivElement>(700)
  const [n, setN] = useState(TRUTH_N)
  const [replay, setReplay] = useState(0)
  const p = pMatch(n)
  const note = n >= 57 ? `${n} people: ${pct(p)}. Almost certain.` : n >= 23 ? `Past 23: better than a coin flip.` : n <= 3 ? 'Tiny room: hardly any pairs.' : 'Under a coin flip, for now.'
  return (
    <div className="bday-revealgrid">
      <div ref={ref} className="bday-card bday-chartcard">
        <CurveChart key={replay} width={w - 24} pencil={curve} truth gap animate at={n} guess={guess} />
        <div className="bday-legend">
          <span><i className="bday-l-you" />{skipped ? 'your line (from your guess)' : 'your curve'}</span>
          <span><i className="bday-l-ink" />the exact chance</span>
          <span><i className="bday-l-gap" />the gap</span>
          {guess > X_MAX && <span className="bday-pencil-c bday-handnote">your guess: {guess} → off this grid</span>}
        </div>
      </div>
      <div className="bday-side">
        <div className="bday-card bday-readout" aria-live="polite">
          <div className="bday-tag">group size</div>
          <div className="bday-readrow">
            <b className="bday-num bday-mid">{n}</b> <span>people</span>
            <span className="bday-hl bday-num bday-pairs">{pairs(n).toLocaleString('en-US')} pairs</span>
          </div>
          <div className="bday-truthnum bday-num">{pct(p)}</div>
          <div className="bday-sub">chance at least two share a birthday · <b>exact</b></div>
          <input className="bday-range" type="range" min={2} max={80} value={n} aria-label="people in the room" onChange={(e) => setN(Number(e.target.value))} />
          <div className="bday-breaks">
            <span style={{ left: '0%' }}>2</span>
            {BREAKS.map((b) => (
              <button key={b} className={'bday-break' + (n >= b ? ' bday-passed' : '')} style={{ left: `${((b - 2) / 78) * 100}%` }} onClick={() => setN(b)}>
                {b}
              </button>
            ))}
            <span style={{ left: '100%' }}>80</span>
          </div>
          <p key={note} className="bday-flash">{note}</p>
          <p className="bday-sub">
            Your {skipped ? 'line' : 'curve'} said <b className="bday-pencil-c">{Math.round(curve[n] * 100)}%</b> at {n}.
          </p>
        </div>
        <div className="bday-row">
          <button className="bday-btn bday-ghost bday-sm" onClick={() => setReplay((r) => r + 1)}>replay</button>
          <button className="bday-btn bday-go" onClick={onNext}>What did I get wrong? →</button>
        </div>
      </div>
      <p className="bday-foot">
        Exact: P(match) = 1 − ∏ (365 − k)/365 for k = 0…n−1, with 365 equally likely days (Feb 29 ignored). At 366 people a match is certain: there are only 365 days.
      </p>
    </div>
  )
}

/* ---------- B6 stamp + mistake card ---------- */
const STAMP: Record<Verdict, string> = { called: 'Called it', close: 'Close', off: 'Way off' }

function Web({ full }: { full: boolean }) {
  const n = 23
  const pt = (i: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n
    return [100 + 80 * Math.cos(a), 100 + 80 * Math.sin(a)]
  }
  const lines = []
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      if (!full && i !== 0) continue
      const a = pt(i)
      const b = pt(j)
      lines.push(<line key={i + '-' + j} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="var(--ink)" strokeOpacity={full ? 0.22 : 0.7} strokeWidth={full ? 0.8 : 1.4} />)
    }
  return (
    <svg className="bday-web" viewBox="0 0 200 200" aria-hidden>
      {lines}
      {Array.from({ length: n }, (_, i) => {
        const [x, y] = pt(i)
        const me = !full && i === 0
        return <circle key={i} cx={x} cy={y} r={me ? 8 : 4.5} fill={me ? 'var(--marker)' : 'var(--ink)'} stroke="var(--ink)" strokeWidth={1.5} />
      })}
      {!full && <text x={84} y={14} textAnchor="end" className="bday-webyou">you</text>}
    </svg>
  )
}

export function Card({ guess, curve, skipped, onAgain, onNext }: { guess: number; curve: number[]; skipped: boolean; onAgain: () => void; onNext: () => void }) {
  const { v, m } = verdictOf(guess)
  const drewAt23 = Math.round(curve[TRUTH_N] * 100)
  return (
    <div>
      <div className="bday-stamprow">
        <span className={`bday-stamp bday-stamp-${v}`}>{STAMP[v]}</span>
        <p className="bday-said">
          You said <b className="bday-pencil-c bday-num">{guess}</b>. It's <span className="bday-hl bday-num"><b>{TRUTH_N}</b></span>.
        </p>
      </div>
      <div className="bday-card bday-mistake">
        <div className="bday-tag bday-red">{m ? 'the mistake' : 'the right model'}</div>
        <h3 className="bday-named">
          {m ? <>“<span className="bday-hl">{m.label}</span>”</> : <>You counted <span className="bday-hl">pairs</span>, not people.</>}
        </h3>
        {m ? (
          <>
            <p><b>Why it's tempting:</b> {m.why_tempting}</p>
            <p><b>The right model:</b> {m.refutation}</p>
          </>
        ) : (
          <p>Any two people can match. {guess} people make {pairs(guess).toLocaleString('en-US')} pairs, and every pair is a chance. Real chance at {guess}: {pct(pMatch(guess))}.</p>
        )}
        <p className="bday-sub">
          At 23 people, your {skipped ? 'line' : 'curve'} said <b className="bday-pencil-c">{drewAt23}%</b>. The exact chance is <b>{pct(pMatch(TRUTH_N))}</b>.
        </p>
        <div className="bday-vs">
          <div className="bday-vscard">
            <h4>Someone shares <span className="bday-hl">MY</span> birthday</h4>
            <Web full={false} />
            <div className="bday-vspct bday-num">{pct(pMine(23))}</div>
            <div className="bday-sub">22 lines, all from you · 23 people</div>
          </div>
          <div className="bday-vscard bday-vsbig">
            <h4><span className="bday-hl">Any two</span> people share a birthday</h4>
            <Web full />
            <div className="bday-vspct bday-num">{pct(pMatch(23))}</div>
            <div className="bday-sub">{pairs(23)} lines, every pair · 23 people</div>
          </div>
        </div>
        <p className="bday-twist">Matching YOU takes ~{needForMe()} other people; any two takes {TRUTH_N}.</p>
        {m?.source_url && (
          <p className="bday-source">
            Source: <a href={m.source_url} target="_blank" rel="noreferrer">{new URL(m.source_url).hostname}</a> ({m.source_note}). Numbers: exact formula, computed in code.
          </p>
        )}
      </div>
      <div className="bday-row bday-mt">
        <button className="bday-btn bday-ghost" onClick={onAgain}>Show me again</button>
        <button className="bday-btn bday-go" onClick={onNext}>Got it →</button>
      </div>
    </div>
  )
}

/* ---------- B7 rematch ---------- */
const CLASS = 30

export function Rematch({ curve, onPick, picked }: { curve: number[]; onPick: (more: boolean) => void; picked: boolean | null }) {
  const [ref, w] = useWidth<HTMLDivElement>(700)
  const truthMore = pMatch(CLASS) > 0.5
  return (
    <div>
      <p className="bday-ask">In a class of {CLASS}, is a shared birthday more or less likely than not?</p>
      <div className="bday-choices bday-rematch" role="group" aria-label="your answer">
        {[true, false].map((more) => (
          <button key={String(more)} className="bday-choice bday-bigchoice" aria-pressed={picked === more} disabled={picked != null} onClick={() => onPick(more)}>
            {more ? 'More likely than not' : 'Less likely than not'}
            {picked === more && <span className={'bday-stamp bday-mini ' + (more === truthMore ? 'bday-stamp-called' : 'bday-stamp-off')}>{more === truthMore ? 'called it' : 'not quite'}</span>}
          </button>
        ))}
      </div>
      {picked != null && (
        <div ref={ref} className="bday-card bday-chartcard bday-mt">
          <CurveChart width={w - 24} pencil={curve} truth at={CLASS} />
          <p className="bday-readline">
            <b className="bday-num">{CLASS}</b> people · <span className="bday-hl bday-num">{pairs(CLASS)} pairs</span> · <b className="bday-num bday-truthsmall">{pct(pMatch(CLASS))}</b> <span className="bday-sub">exact</span>
          </p>
          <p className="bday-sub">
            {picked === truthMore ? 'Right: past 23 you are already over a coin flip.' : 'Past 23 people it is already better than a coin flip; 30 people make 435 pairs.'} Your pencil said <b className="bday-pencil-c">{Math.round(curve[CLASS] * 100)}%</b> here.
          </p>
        </div>
      )}
    </div>
  )
}
