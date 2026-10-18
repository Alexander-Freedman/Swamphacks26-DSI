import { useEffect, useMemo, useRef, useState } from 'react'
import { computeTruth } from '../truth'
import type { Confidence, Item } from '../types'
import { Curve } from './Curve'
import { CurvePredict } from './CurvePlay'
import { playMode } from './curveMode'

export type Answer = { value: number | null; optionId: string | null; confidence: Confidence }

// No "how sure are you?" step any more (#194); answers keep a neutral confidence for old notebook entries.
const NEUTRAL: Confidence = 'pretty sure'

// v4: an engine v4 round, whose curve items are guessed on the picture itself (#184).
export function Predict({ item, onLock, v4 = false }: { item: Item; onLock: (a: Answer) => void; v4?: boolean }) {
  const mode = v4 ? playMode(item) : null
  const s = item.slider
  const [value, setValue] = useState<number | null>(s ? Math.round((s.min + s.max) / 2 / s.step) * s.step : null)
  const [touched, setTouched] = useState(false)
  const [optionId, setOptionId] = useState<string | null>(null)

  const promptRef = useRef<HTMLHeadingElement>(null)
  // A new item takes focus (and scroll) back to its question.
  useEffect(() => promptRef.current?.focus(), [])

  const answered = item.input_type === 'slider' ? touched : optionId !== null
  const ready = answered

  return (
    <div>
      <h2 className="prompt" ref={promptRef} tabIndex={-1}>{item.prompt}</h2>

      {mode && (
        <CurvePredict
          item={item}
          mode={mode}
          guess={touched ? value : null}
          onGuess={(v) => {
            setValue(v)
            setTouched(true)
          }}
        />
      )}

      {!mode && item.input_type === 'slider' && s && <GuessPicture item={item} guess={touched ? value : null} />}

      {!mode && item.input_type === 'slider' && s && (
        <div className="slider-row">
          <div className="guess-readout" aria-live="polite">
            {touched ? value : '?'} <small>{s.unit}</small>
          </div>
          <input
            type="range"
            min={s.min}
            max={s.max}
            step={s.step}
            value={value ?? s.min}
            aria-label="your guess"
            onChange={(e) => {
              setValue(Number(e.target.value))
              setTouched(true)
            }}
          />
          <div className="range-ends"><span>{s.min}</span><span>{s.max}</span></div>
        </div>
      )}

      {item.input_type === 'choice' && (
        <div className="options">
          {item.options?.map((o) => (
            <button key={o.id} className="option" aria-pressed={optionId === o.id} onClick={() => setOptionId(o.id)}>
              {o.text}
            </button>
          ))}
        </div>
      )}

      <button className="lock" disabled={!ready} onClick={() => ready && onLock({ value, optionId, confidence: NEUTRAL })}>
        Show me
      </button>
    </div>
  )
}

/**
 * Slope and area items draw your guess while you slide: a pencil tangent that turns with the slope,
 * or your area as one pencil rectangle over the shaded region. Reading the curve is the skill there,
 * so the curve shows; for a value or a limit it would give the answer away, so nothing is drawn.
 */
function GuessPicture({ item, guess }: { item: Item; guess: number | null }) {
  const t = item.truth
  const f = useMemo(() => {
    if (t.widget !== 'curve' || t.preset) return null
    try {
      const c = computeTruth(item)
      return c.kind === 'curve' ? c.f : null
    } catch {
      return null
    }
  }, [item, t])
  if (t.widget !== 'curve' || !f) return null
  if (t.show === 'tangent' && t.ask_x != null)
    return (
      <figure className="guess-picture">
        <Curve t={t} f={f} tangent={{ x: t.ask_x, slope: null }} guessSlope={guess} mark={t.ask_x} />
        <figcaption className="hand">{guess == null ? 'slide to tilt your tangent line' : `your tangent: slope ${guess}`}</figcaption>
      </figure>
    )
  if (t.show === 'riemann' && t.area_from != null && t.area_to != null)
    return (
      <figure className="guess-picture">
        <Curve t={t} f={f} area={{ from: t.area_from, to: t.area_to, n: null, guess }} />
        <figcaption className="hand">{guess == null ? 'slide to size your rectangle' : `your area: ${guess}, drawn as one rectangle over the same base`}</figcaption>
      </figure>
    )
  return null
}
