import { useEffect, useRef, useState } from 'react'
import { answerUnit, gapText, num, withUnit } from '../format'
import type { Computed } from '../truth'
import { leftSum, shareAtLeast } from '../truth'
import type { CurveTruth, Item, Round } from '../types'
import { fmt, misconceptionFor, verdictFor, verdictText } from '../verdict'
import { Curve } from './Curve'
import { Distribution } from './Distribution'
import { IconArray } from './IconArray'
import { MisconceptionCard } from './MisconceptionCard'
import type { Answer } from './Predict'
import './Reveal.css'

type Props = { item: Item; round: Round; answer: Answer; truth: Computed; signals: Record<string, number> }

function TruthLine({ item, truth }: { item: Item; truth: Computed }) {
  const t = item.truth
  if (truth.kind === 'distribution') {
    const trials = truth.hist.trials.toLocaleString('en-US')
    if (t.widget === 'distribution' && t.sampler === 'coin_longest_run') {
      return (
        <p className="truth-line">
          Average: <strong>{truth.hist.mean.toFixed(1)}</strong>. 5 or more showed up in{' '}
          <strong>{Math.round(shareAtLeast(truth.hist, 5) * 100)}%</strong> of {trials} simulated tries.
        </p>
      )
    }
    return (
      <p className="truth-line">
        The bars are <strong>{trials}</strong> simulated tries{t.widget === 'distribution' && t.x_label ? ` (${t.x_label})` : ''}. Average: <strong>{truth.hist.mean.toFixed(1)}</strong>.
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
  if (truth.kind === 'curve' && t.widget === 'curve' && t.preset && truth.value != null) {
    return (
      <p className="truth-line">
        With just <strong>{truth.value}</strong> people it's already past 50% ({(truth.f(truth.value) * 100).toFixed(1)}%).
      </p>
    )
  }
  return null
}

const STEPS = [1, 2, 4, 8, 16, 32, 64, 128, 200]

/** Area reveal: fill the region with thinner and thinner rectangles and watch the sum close in. */
function RiemannPicture({ t, f, from, to, guess, exact }: { t: CurveTruth; f: (x: number) => number; from: number; to: number; guess: number | null; exact: number | null }) {
  const [k, setK] = useState(0)
  const n = STEPS[k]
  const sum = leftSum(f, from, to, n)
  return (
    <figure className="riemann">
      <Curve t={t} f={f} area={{ from, to, n, guess }} />
      <label className="riemann-n">
        <span>
          {n} {n === 1 ? 'rectangle' : 'rectangles'}: <strong>{num(sum)}</strong>
          {exact != null && <> · exact area <strong>{num(exact)}</strong></>}
        </span>
        <input type="range" min={0} max={STEPS.length - 1} value={k} onChange={(e) => setK(+e.target.value)} aria-label="number of rectangles" />
      </label>
    </figure>
  )
}

// Pencil (the guess) over ink (the truth) on the slider's own scale, the gap between them in marker.
export function GuessBar({ guess, truth, min = 0, max = 100, unit = '%' }: { guess: number; truth: number; min?: number; max?: number; unit?: string }) {
  const pos = (v: number) => Math.min(100, Math.max(0, ((v - min) / (max - min)) * 100))
  const g = pos(guess)
  const t = pos(truth)
  const lo = Math.min(g, t)
  const hi = Math.max(g, t)
  const apart = gapText(guess, truth, unit)
  const same = Math.abs(guess - truth) < 1e-9 || num(Math.abs(guess - truth)) === '0'
  return (
    <figure className="gbar" role="img" aria-label={`your guess ${withUnit(guess, unit)} vs reality ${withUnit(truth, unit)}, ${apart} apart`}>
      <div className="gbar-row">
        <span className="gbar-label hand">you</span>
        <div className="gbar-track">
          <div className="gbar-guess" style={{ width: `${g}%` }} />
          <span className="gbar-val hand" style={{ left: `${g}%` }}>{withUnit(guess, unit)}</span>
        </div>
      </div>
      <div className="gbar-row">
        <span className="gbar-label">reality</span>
        <div className="gbar-track">
          {!same && <div className="gbar-gap" style={{ left: `${lo}%`, width: `${hi - lo}%` }} />}
          <div className="gbar-ink" style={{ width: `${t}%` }} />
          <span className="gbar-val" style={{ left: `${t}%` }}>{withUnit(truth, unit)}</span>
        </div>
      </div>
      {!same && (
        <figcaption className="gbar-caption">
          <span className="gbar-swatch" /> the gap: <strong>{apart}</strong>
        </figcaption>
      )}
    </figure>
  )
}

// Reality in ink as the biggest thing on the card, the pencil guess next to it, the gap in marker.
function Reality({ item, answer, truth }: { item: Item; answer: Answer; truth: Computed }) {
  const { unit, label } = answerUnit(item, truth)
  const value = truth.value
  if (item.input_type === 'choice') {
    const right = item.options?.find((o) => o.misconception_id === null)
    const picked = item.options?.find((o) => o.id === answer.optionId)
    if (!right) return null
    // A number only when it can carry its unit; a bare "2" next to "Eleven" explains nothing.
    // Nor when the option already says it ("About $110.41").
    const numText = value != null ? withUnit(value, unit) : ''
    const showNum =
      value != null && item.truth.widget !== 'distribution' && item.truth.widget !== 'stepper' && (unit !== '' || label) && !right.text.includes(num(value, unit.startsWith('$') ? 'money' : null))
    return (
      <div className="reality">
        <p className="reality-main">
          <span className="reality-label">Reality:</span> <strong className="reality-value reality-text">{right.text}</strong>
        </p>
        {showNum && (
          <p className="reality-num">
            {label ? `${label}: ` : 'The number: '}
            <strong>{numText}</strong>
          </p>
        )}
        {picked && (
          <p className="reality-you">
            <span className="hand">you picked: {picked.text}</span>
            {picked.id === right.id && <span className="reality-match"> ✓ same</span>}
          </p>
        )}
      </div>
    )
  }
  if (value == null) return null
  const guess = answer.value
  return (
    <div className="reality">
      <p className="reality-main">
        <span className="reality-label">Reality:</span> <strong className="reality-value">{withUnit(value, unit)}</strong>
      </p>
      {guess != null && (
        <p className="reality-you">
          <span className="hand">you: {withUnit(guess, unit)}</span>
          <span className="reality-gap">off by <strong>{gapText(guess, value, unit)}</strong></span>
        </p>
      )}
    </div>
  )
}

export function Reveal({ item, round, answer, truth, signals }: Props) {
  const v = verdictFor(item, answer, truth.value)
  const mid = misconceptionFor(item, answer)
  const m = round.misconceptions.find((x) => x.id === mid)
  const t = item.truth
  const guess = item.input_type === 'slider' ? answer.value : null
  const { unit } = answerUnit(item, truth)
  const verdictRef = useRef<HTMLDivElement>(null)
  // Focus lands on the verdict after lock-in instead of falling back to <body>.
  useEffect(() => verdictRef.current?.focus({ preventScroll: true }), [])
  const pointLabel =
    truth.kind === 'curve' && truth.point && truth.value != null && t.widget === 'curve' && !t.preset ? withUnit(truth.value, unit) : undefined

  return (
    <div className="reveal">
      {truth.kind === 'distribution' && t.widget === 'distribution' && (
        <Distribution hist={truth.hist} xLabel={t.x_label} guess={guess} range={item.slider ? { min: item.slider.min, max: item.slider.max } : undefined} />
      )}
      {truth.kind === 'icons' && <IconArray counts={truth.counts} />}
      {truth.kind === 'curve' && t.widget === 'curve' && truth.show === 'tangent' && t.ask_x != null && (
        <Curve t={t} f={truth.f} tangent={{ x: t.ask_x, slope: truth.value }} guessSlope={guess} point={truth.point} pointLabel={truth.value != null ? `slope ${num(truth.value)}` : ''} />
      )}
      {truth.kind === 'curve' && t.widget === 'curve' && truth.show === 'riemann' && t.area_from != null && t.area_to != null && (
        <RiemannPicture t={t} f={truth.f} from={t.area_from} to={t.area_to} guess={guess} exact={truth.value} />
      )}
      {truth.kind === 'curve' && t.widget === 'curve' && truth.show === 'limit' && (
        <Curve t={t} f={truth.f} mark={t.ask_x} point={truth.point} pointLabel={truth.value != null ? `limit ${num(truth.value)}` : ''} hole />
      )}
      {truth.kind === 'curve' && t.widget === 'curve' && !truth.show && <Curve t={t} f={truth.f} guess={guess} point={truth.point} pointLabel={pointLabel} />}
      {item.approximate && <p className="approx-tag hand">approximate picture, not a full model</p>}

      <div className="verdict-row" ref={verdictRef} tabIndex={-1}>
        <span className={`stamp ${v}`}>{verdictText(v, answer.confidence)}</span>
      </div>
      <Reality item={item} answer={answer} truth={truth} />
      {(truth.kind === 'icons' || truth.kind === 'estimate') && guess != null && truth.value != null && item.slider && (
        <GuessBar guess={guess} truth={truth.value} min={item.slider.min} max={item.slider.max} unit={item.slider.unit} />
      )}
      {v === 'off' && (
        <p className="sure-wrong">A big miss is the one you're most likely to fix. Keep this one.</p>
      )}
      {t.widget === 'stepper' && t.steps.length > 0 && (
        <div className="steps">
          <p className="steps-title">Worked through:</p>
          <ol>
            {t.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </div>
      )}
      <TruthLine item={item} truth={truth} />
      {m && <MisconceptionCard m={m} signals={signals[m.id] ?? 1} />}
    </div>
  )
}
