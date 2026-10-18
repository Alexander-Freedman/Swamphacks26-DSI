// Draw it: sketch the model from memory, write the rule in one line, get graded per criterion.
import { useCallback, useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import type { DrawCriterion, DrawRequest, StageProps } from './types'
import { useGraded } from './useGraded'
import { offlineLine } from './offlineLine'
import './learn-draw.css'

const NAMES: Record<DrawCriterion['id'], string> = {
  entities: 'The parts',
  links: 'The arrows',
  rule: 'The rule',
  'why-rule': 'Why it holds',
}
const MARK: Record<DrawCriterion['verdict'], string> = { demonstrated: '✓', contradicted: '✗', unresolved: '?' }
const SAY: Record<DrawCriterion['verdict'], string> = { demonstrated: 'shown', contradicted: 'contradicted', unresolved: 'not shown yet' }

/** Pointer + touch drawing on a plain canvas. `empty` is true until the first stroke. */
function SketchPad({ onChange }: { onChange: (canvas: HTMLCanvasElement | null) => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [empty, setEmpty] = useState(true)

  const ctx = () => ref.current?.getContext?.('2d') ?? null
  const pos = (e: RPointerEvent<HTMLCanvasElement>) => {
    const c = e.currentTarget
    const b = c.getBoundingClientRect()
    const sx = b.width ? c.width / b.width : 1
    const sy = b.height ? c.height / b.height : 1
    return { x: (e.clientX - b.left) * sx, y: (e.clientY - b.top) * sy }
  }
  const clear = useCallback(() => {
    const c = ref.current
    const g = ctx()
    if (c && g) g.clearRect(0, 0, c.width, c.height)
    setEmpty(true)
    onChange(null)
  }, [onChange])
  useEffect(() => {
    const g = ctx()
    if (!g) return
    g.lineWidth = 3
    g.lineCap = 'round'
    g.lineJoin = 'round'
    g.strokeStyle = getComputedStyle(ref.current!).color || '#222'
  }, [])

  return (
    <div className="ldf-pad">
      <canvas
        ref={ref}
        width={800}
        height={420}
        className="ldf-canvas"
        role="img"
        aria-label="sketch pad: draw the parts and the arrows between them"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture?.(e.pointerId)
          drawing.current = true
          const g = ctx()
          const p = pos(e)
          g?.beginPath()
          g?.moveTo(p.x, p.y)
          g?.lineTo(p.x + 0.1, p.y + 0.1)
          g?.stroke()
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return
          const g = ctx()
          const p = pos(e)
          g?.lineTo(p.x, p.y)
          g?.stroke()
        }}
        onPointerUp={() => {
          if (!drawing.current) return
          drawing.current = false
          setEmpty(false)
          onChange(ref.current)
        }}
        onPointerCancel={() => {
          drawing.current = false
        }}
      />
      {empty ? (
        <p className="ldf-hint" aria-hidden="true">
          draw here ✎
        </p>
      ) : (
        <button type="button" className="ldf-clear" onClick={clear}>
          Clear
        </button>
      )}
    </div>
  )
}

export function DrawScreen({ topic, state, update, next, api }: StageProps) {
  const call = useCallback((body: DrawRequest) => api.draw(topic.slug, body), [api, topic.slug])
  const { run, busy, offline } = useGraded(call)
  const canvas = useRef<HTMLCanvasElement | null>(null)
  const [followUp, setFollowUp] = useState<string | null>(null)
  const [followAnswer, setFollowAnswer] = useState('')
  const [rounds, setRounds] = useState(0)
  const [wasOffline, setWasOffline] = useState(false)

  const image = () => {
    try {
      return canvas.current ? canvas.current.toDataURL('image/png') : null
    } catch {
      return null
    }
  }
  const submit = async (notes: string) => {
    const r = await run({ rule: state.drawRule, notes, image: image() })
    if (!r) return
    setWasOffline(!!r.offline)
    update({ drawVerdicts: r.criteria, drawNotes: notes })
    setRounds((n) => n + 1)
    setFollowUp(rounds === 0 ? r.followUpQuestion : null)
  }
  const verdicts = state.drawVerdicts

  return (
    <section className="learn-step ldf" aria-label="draw">
      <p className="learn-instruction">Sketch how it works from memory: the parts and the arrows between them.</p>
      <SketchPad onChange={(c) => (canvas.current = c)} />
      <label className="ldf-label" htmlFor="ldf-rule">
        The rule, in one line
      </label>
      <input
        id="ldf-rule"
        type="text"
        value={state.drawRule}
        onChange={(e) => update({ drawRule: e.target.value })}
        disabled={busy}
      />
      {rounds === 0 && (
        <button className="ldf-go" disabled={busy || !state.drawRule.trim()} onClick={() => submit(state.drawNotes)}>
          Check my sketch
        </button>
      )}
      {busy && (
        <p className="learn-thinking" role="status">
          thinking…
        </p>
      )}
      {offline && <p className="learn-offline" role="status">{offlineLine(offline)}</p>}

      {verdicts.length > 0 && (
        <ul className="ldf-rows" aria-label="how your sketch did">
          {verdicts.map((c) => (
            <li key={c.id} className={`ldf-row is-${c.verdict}`}>
              <span className="ldf-mark" aria-label={SAY[c.verdict]}>
                {MARK[c.verdict]}
              </span>
              <span className="ldf-name">{NAMES[c.id] ?? c.id}</span>
              <span className="ldf-note">{c.note}</span>
            </li>
          ))}
        </ul>
      )}
      {wasOffline && verdicts.length > 0 && <p className="learn-offline">offline check</p>}

      {followUp && (
        <div className="ldf-follow">
          <label className="ldf-label" htmlFor="ldf-follow">
            {followUp}
          </label>
          <input id="ldf-follow" type="text" value={followAnswer} onChange={(e) => setFollowAnswer(e.target.value)} disabled={busy} />
          <button disabled={busy || !followAnswer.trim()} onClick={() => submit(followAnswer)}>
            Answer
          </button>
        </div>
      )}

      <div className="ldf-actions">
        <button onClick={next} disabled={busy}>
          Next
        </button>
      </div>
    </section>
  )
}
