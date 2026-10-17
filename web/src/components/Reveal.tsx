import { useEffect, useRef } from 'react'
import type { Computed } from '../truth'
import { shareAtLeast } from '../truth'
import type { Item, Round } from '../types'
import { fmt, misconceptionFor, verdictFor, verdictText } from '../verdict'
import { Curve } from './Curve'
import { Distribution } from './Distribution'
import { IconArray } from './IconArray'
import { MisconceptionCard } from './MisconceptionCard'
import type { Answer } from './Predict'
import './Reveal.css'

type Props = { item: Item; round: Round; answer: Answer; truth: Computed; signals: Record<string, number> }

function TruthLine({ truth }: { truth: Computed }) {
  if (truth.kind === 'distribution') {
    return (
      <p className="truth-line">
        Average: <strong>{truth.hist.mean.toFixed(1)}</strong>. 5 or more showed up in{' '}
        <strong>{Math.round(shareAtLeast(truth.hist, 5) * 100)}%</strong> of {truth.hist.trials.toLocaleString()} simulated tries.
      </p>
    )
  }
  if (truth.kind === 'icons') {
    const { truePos, falsePos, population } = truth.counts
    const pos = Math.round(truePos + falsePos)
    return (
      <p className="truth-line">
        Of {population.toLocaleString()} people, <strong>{pos}</strong> test positive, and only <strong>{Math.round(truePos)}</strong> of them are sick. That's{' '}
        <strong>{fmt(Math.round(truth.value * 10) / 10)}%</strong>.
      </p>
    )
  }
  if (truth.kind === 'curve' && truth.value != null) {
    return (
      <p className="truth-line">
        With just <strong>{truth.value}</strong> people it's already past 50% ({(truth.f(truth.value) * 100).toFixed(1)}%).
      </p>
    )
  }
  return null
}

// Pencil (the guess) over ink (the truth) on one 0-100% scale, the gap between them in marker.
function GuessBar({ guess, truth }: { guess: number; truth: number }) {
  const t = Math.round(truth * 10) / 10
  const lo = Math.min(guess, t)
  const hi = Math.max(guess, t)
  const gap = Math.round((hi - lo) * 10) / 10
  return (
    <figure className="gbar" role="img" aria-label={`your guess ${guess}% vs reality ${fmt(t)}%, ${fmt(gap)} points apart`}>
      <div className="gbar-row">
        <span className="gbar-label hand">you</span>
        <div className="gbar-track">
          <div className="gbar-guess" style={{ width: `${guess}%` }} />
          <span className="gbar-val hand" style={{ left: `${guess}%` }}>{guess}%</span>
        </div>
      </div>
      <div className="gbar-row">
        <span className="gbar-label">reality</span>
        <div className="gbar-track">
          {gap > 0 && <div className="gbar-gap" style={{ left: `${lo}%`, width: `${hi - lo}%` }} />}
          <div className="gbar-ink" style={{ width: `${t}%` }} />
          <span className="gbar-val" style={{ left: `${t}%` }}>{fmt(t)}%</span>
        </div>
      </div>
      {gap > 0 && (
        <figcaption className="gbar-caption">
          <span className="gbar-swatch" /> the gap: <strong>{fmt(gap)} points</strong>
        </figcaption>
      )}
    </figure>
  )
}

export function Reveal({ item, round, answer, truth, signals }: Props) {
  const v = verdictFor(item, answer, truth.value)
  const mid = misconceptionFor(item, answer)
  const m = round.misconceptions.find((x) => x.id === mid)
  const t = item.truth
  const guess = item.input_type === 'slider' ? answer.value : null
  const unit = item.slider?.unit ?? ''
  const verdictRef = useRef<HTMLDivElement>(null)
  // Focus lands on the verdict after lock-in instead of falling back to <body>.
  useEffect(() => verdictRef.current?.focus({ preventScroll: true }), [])

  return (
    <div className="reveal">
      {truth.kind === 'distribution' && t.widget === 'distribution' && (
        <Distribution hist={truth.hist} xLabel={t.x_label} guess={guess} range={item.slider ? { min: item.slider.min, max: item.slider.max } : undefined} />
      )}
      {truth.kind === 'icons' && <IconArray counts={truth.counts} />}
      {truth.kind === 'icons' && guess != null && <GuessBar guess={guess} truth={truth.value} />}
      {truth.kind === 'curve' && t.widget === 'curve' && <Curve t={t} f={truth.f} guess={guess} target={truth.value} />}

      <div className="verdict-row" ref={verdictRef} tabIndex={-1}>
        <span className={`stamp ${v}`}>{verdictText(v, answer.confidence)}</span>
        {guess != null && truth.value != null && (
          <span className="callout hand">
            you: {guess}{unit === '%' ? '%' : ''} · reality: {fmt(Math.round(truth.value * 10) / 10)}{unit === '%' ? '%' : ''}
          </span>
        )}
      </div>
      {v === 'off' && answer.confidence === 'certain' && (
        <p className="sure-wrong">A confident miss is the one you're most likely to fix. Keep this one.</p>
      )}
      <TruthLine truth={truth} />
      {m && <MisconceptionCard m={m} signals={signals[m.id] ?? 1} />}
    </div>
  )
}
