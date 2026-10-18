// Draw it: sketch the model from memory, write its rule in one line, then see it graded part by part.
import { useCallback, useRef, useState, type PointerEvent, type RefObject } from 'react'
import type { DrawCriterion, DrawCriterionId, DrawRequest, DrawResponse, StageProps } from '../types'
import { useGraded } from '../useGraded'
import { offlineLine } from './draw'
import './draw.css'

const ROWS: { id: DrawCriterionId; label: string }[] = [
  { id: 'entities', label: 'The parts' },
  { id: 'links', label: 'How they connect' },
  { id: 'rule', label: 'The rule' },
  { id: 'why-rule', label: 'Why it holds' },
]
const STAMP: Record<DrawCriterion['verdict'], string> = { demonstrated: '✓ got it', contradicted: 'not quite', unresolved: 'not shown yet' }

/** The canvas's 2d context set up as a pencil, with the bitmap matched to its box so strokes land under the finger. */
function pencil(c: HTMLCanvasElement) {
  const g = c.getContext('2d')
  if (!g) return null
  const r = c.getBoundingClientRect()
  const w = Math.round(r.width * devicePixelRatio)
  if (r.width > 0 && c.width !== w) {
    c.width = w
    c.height = Math.round(r.height * devicePixelRatio)
  }
  g.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
  g.lineCap = 'round'
  g.lineJoin = 'round'
  g.lineWidth = 3
  g.strokeStyle = g.fillStyle = getComputedStyle(c).color
  return { g, r }
}

/** A blank pencil pad: pointer events, so a mouse, a pen and a finger all draw. */
function Pad({ canvas, onInk }: { canvas: RefObject<HTMLCanvasElement | null>; onInk: () => void }) {
  const last = useRef<{ x: number; y: number } | null>(null)
  const ctx = () => (canvas.current ? pencil(canvas.current) : null)
  const at = (e: PointerEvent<HTMLCanvasElement>, r: DOMRect) => ({ x: e.clientX - r.left, y: e.clientY - r.top })
  const down = (e: PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture?.(e.pointerId)
    const c = ctx()
    if (!c) return
    const p = at(e, c.r)
    last.current = p
    c.g.beginPath()
    c.g.arc(p.x, p.y, 1.5, 0, Math.PI * 2)
    c.g.fill()
    onInk()
  }
  const move = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!last.current) return
    const c = ctx()
    if (!c) return
    const p = at(e, c.r)
    c.g.beginPath()
    c.g.moveTo(last.current.x, last.current.y)
    c.g.lineTo(p.x, p.y)
    c.g.stroke()
    last.current = p
  }
  const up = () => void (last.current = null)
  return (
    <canvas
      ref={canvas}
      className="dr-pad"
      aria-label="drawing pad: sketch the parts and arrows between them"
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onPointerLeave={up}
    />
  )
}

export function DrawScreen({ topic, state, update, next, api }: StageProps) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [inked, setInked] = useState(false)
  const [result, setResult] = useState<DrawResponse | null>(null)
  const call = useCallback((b: DrawRequest) => api.draw(topic.slug, b), [api, topic.slug])
  const { run, busy, offline } = useGraded(call)

  const clear = () => {
    const c = canvas.current
    c?.getContext('2d')?.clearRect(0, 0, c.width, c.height)
    setInked(false)
  }
  const check = async () => {
    let image: string | null = null
    try {
      image = inked && canvas.current ? canvas.current.toDataURL('image/png') : null
    } catch {
      image = null // jsdom and locked-down browsers have no canvas export
    }
    const r = await run({ rule: state.drawRule.trim(), notes: state.drawNotes.trim(), image })
    if (r) {
      setResult(r)
      update({ drawVerdicts: r.criteria })
    }
  }
  const verdicts = result?.criteria ?? state.drawVerdicts
  const byId = (id: DrawCriterionId) => verdicts.find((c) => c.id === id)

  return (
    <section className="learn-step dr" aria-label="draw">
      <h2>Draw it from memory.</h2>
      <p className="learn-instruction">Sketch the parts of {topic.topic} and arrows for what drives what. Then say the rule in one line.</p>
      <div className="dr-padwrap">
        <Pad canvas={canvas} onInk={() => setInked(true)} />
        {!inked && <span className="dr-hint" aria-hidden="true">draw here ✎</span>}
        <button className="dr-clear" onClick={clear} disabled={!inked}>Clear</button>
      </div>
      <label className="dr-field">
        <span>the rule is…</span>
        <input type="text" value={state.drawRule} onChange={(e) => update({ drawRule: e.target.value })} placeholder="one line" />
      </label>
      <label className="dr-field">
        <span>notes (optional)</span>
        <input type="text" value={state.drawNotes} onChange={(e) => update({ drawNotes: e.target.value })} placeholder="what your arrows mean" />
      </label>
      <button className="dr-check" onClick={check} disabled={busy || !state.drawRule.trim()}>Check it</button>
      {busy && <p className="learn-thinking" role="status">thinking…</p>}
      {offline && <p className="learn-offline" role="status">{offlineLine(offline)}</p>}

      {verdicts.length > 0 && (
        <ul className="dr-rows" aria-label="how your drawing did">
          {ROWS.map(({ id, label }) => {
            const c = byId(id)
            if (!c) return null
            return (
              <li key={id} className={`dr-row dr-${c.verdict}`}>
                <span className="dr-stamp">{STAMP[c.verdict]}</span>
                <span className="dr-label">{label}</span>
                <span className="dr-note">{c.note}</span>
              </li>
            )
          })}
        </ul>
      )}
      {result?.followUpQuestion && <p className="dr-follow">{result.followUpQuestion}</p>}
      {result?.offline && <p className="learn-offline">Checked against the topic's notes (the live checker is busy or offline).</p>}
      <button className="dr-next" onClick={next} disabled={busy}>Next</button>
    </section>
  )
}
