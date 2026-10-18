import { useState, type ReactNode } from 'react'
import { TILE, type Said } from './layout'
import { BIO_MISTAKES, type BioMistake } from './mistakes'

// Pieces every biology step shares: the base tiles, the right/wrong verdict, a predict question.

/** One base as a lettered tile. A, T/U, G, C each get their own color so pairs are easy to see. */
export function Base({ b, x, y, mark, faint, className = '' }: { b: string; x: number; y: number; mark?: boolean; faint?: boolean; className?: string }) {
  return (
    <g className={`bio-base bio-b-${b}${mark ? ' bio-mark' : ''}${faint ? ' bio-faint' : ''} ${className}`} transform={`translate(${x} ${y})`}>
      <rect width={TILE} height={TILE} rx={4} />
      <text x={TILE / 2} y={TILE / 2} dy="0.36em" textAnchor="middle">{b}</text>
    </g>
  )
}

/** ✓ Correct! or ✗ Not quite, with the named mistake when there is one. */
export function Verdict({ said }: { said: Said | null }) {
  if (!said) return null
  if (said.ok)
    return (
      <div className="bio-verdict bio-ok" role="status">
        <b>✓ Correct!</b> {said.line}
      </div>
    )
  const m = said.mistake ? BIO_MISTAKES[said.mistake] : null
  return (
    <div className="bio-verdict bio-no" role="status">
      <b>✗ Not quite.</b>
      {m && <div className="bio-mname">{m.label}</div>}
      <p>{m ? m.line : said.line}</p>
    </div>
  )
}

type Choice<T extends string> = { value: T; label: ReactNode; sub?: string }

/**
 * Predict before the reveal: pick an answer, see ✓ / ✗ right away. Wrong picks stay crossed out
 * and you try again; `onRight` fires once the right one is picked.
 */
export function Predict<T extends string>(p: {
  ask: ReactNode
  choices: Choice<T>[]
  answer: T
  why: string
  trap: (v: T) => BioMistake | null
  retry: string
  onMistake: (m: BioMistake) => void
  onRight: () => void
}) {
  const [wrong, setWrong] = useState<T[]>([])
  const [said, setSaid] = useState<Said | null>(null)
  const done = said?.ok === true
  const pick = (v: T) => {
    if (done) return
    if (v === p.answer) {
      setSaid({ ok: true, line: p.why })
      p.onRight()
      return
    }
    setWrong((w) => [...w, v])
    const m = p.trap(v)
    if (m) p.onMistake(m)
    setSaid({ ok: false, mistake: m, line: p.retry })
  }
  return (
    <div className="bio-q">
      <p className="bio-ask">{p.ask}</p>
      <div className="bio-choices">
        {p.choices.map((c) => (
          <button
            key={c.value}
            className={'bio-choice' + (done && c.value === p.answer ? ' right' : '') + (wrong.includes(c.value) ? ' wrong' : '')}
            disabled={done || wrong.includes(c.value)}
            aria-pressed={done && c.value === p.answer}
            onClick={() => pick(c.value)}
          >
            <b>{c.label}</b>
            {c.sub && <span>{c.sub}</span>}
          </button>
        ))}
      </div>
      <Verdict said={said} />
    </div>
  )
}
