import { useState } from 'react'
import type { Confidence, Item } from '../types'

export type Answer = { value: number | null; optionId: string | null; confidence: Confidence }

const LEVELS: Confidence[] = ['guessing', 'pretty sure', 'certain']

export function Predict({ item, onLock }: { item: Item; onLock: (a: Answer) => void }) {
  const s = item.slider
  const [value, setValue] = useState<number | null>(s ? Math.round((s.min + s.max) / 2 / s.step) * s.step : null)
  const [touched, setTouched] = useState(false)
  const [optionId, setOptionId] = useState<string | null>(null)
  const [confidence, setConfidence] = useState<Confidence | null>(null)

  const answered = item.input_type === 'slider' ? touched : optionId !== null
  const ready = answered && confidence !== null

  return (
    <div>
      <h2 className="prompt">{item.prompt}</h2>

      {item.input_type === 'slider' && s && (
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

      <div className="confidence" role="group" aria-label="how sure are you">
        <p className="confidence-label">How sure are you?</p>
        {LEVELS.map((c) => (
          <button key={c} className="conf" aria-pressed={confidence === c} onClick={() => setConfidence(c)}>
            {c}
          </button>
        ))}
      </div>

      <button className="lock" disabled={!ready} onClick={() => ready && onLock({ value, optionId, confidence })}>
        Lock it in
      </button>
    </div>
  )
}
