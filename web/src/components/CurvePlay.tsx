import { useMemo, useState } from 'react'
import { num, withUnit } from '../format'
import { computeTruth, curveFn, knobsFor, leftSum, simulate, type Computed } from '../truth'
import type { CurveTruth, Item } from '../types'
import { Curve } from './Curve'
import { instruction, type PlayMode } from './curveMode'
import { Distribution } from './Distribution'
import './CurvePlay.css'

// Engine v4 curves played on the picture (#184): the guess is something you do to the graph (tilt a
// tangent, raise an area level, drop a dot), the reveal draws the truth in ink over your pencil, and
// the explore knob + "try this" settings move the curve live.

const snap = (v: number, s: { min: number; max: number; step: number }) => {
  const k = Math.round((v - s.min) / s.step) * s.step + s.min
  return Math.min(s.max, Math.max(s.min, Number(k.toFixed(10))))
}

function samples(t: CurveTruth, f: (x: number) => number): number[] {
  return Array.from({ length: 121 }, (_, i) => f(t.x_min + ((t.x_max - t.x_min) * i) / 120)).filter(Number.isFinite)
}

function padded(lo: number, hi: number): [number, number] {
  if (!(hi > lo)) return [lo - 1, lo + 1]
  const p = (hi - lo) * 0.08
  return [lo === 0 ? 0 : lo - p, hi + p]
}

/** Predict for a v4 curve: the graph is the input. */
export function CurvePredict({ item, mode, guess, onGuess }: { item: Item; mode: PlayMode; guess: number | null; onGuess: (v: number) => void }) {
  const t = item.truth as CurveTruth
  const s = item.slider!
  const f = useMemo(() => curveFn(t, knobsFor(item)), [t, item])
  const ys = useMemo(() => samples(t, f), [t, f])
  const span = t.x_max - t.x_min
  const yRange = useMemo((): [number, number] => {
    const lo = Math.min(0, ...ys)
    const hi = Math.max(...ys, lo + 1e-9)
    if (mode === 'value-y') return padded(Math.min(lo, s.min), Math.max(f(t.x_min), s.max))
    if (mode === 'value-x') return padded(lo, Math.max(hi, t.ask_y ?? hi))
    if (mode === 'riemann') return padded(lo, Math.max(hi, Math.min(s.max, hi * 3) / (t.area_to! - t.area_from!)))
    return padded(lo, hi)
  }, [mode, ys, s, f, t])

  const pick = ({ x, y }: { x: number; y: number }) => {
    let v: number
    if (mode === 'tangent') {
      const x0 = t.ask_x!
      if (Math.abs(x - x0) < span * 0.01) return
      v = (y - f(x0)) / (x - x0)
    } else if (mode === 'riemann') v = Math.max(0, y) * (t.area_to! - t.area_from!)
    else if (mode === 'value-x') v = Math.min(t.x_max, Math.max(t.x_min, x))
    else v = y
    onGuess(snap(v, s))
  }
  const key = (dir: number, big: boolean) => {
    const start = guess ?? snap((s.min + s.max) / 2, s)
    onGuess(snap(start + dir * s.step * (big ? 10 : 1), s))
  }
  const gap = mode === 'limit' ? ([t.ask_x! - span * 0.06, t.ask_x! + span * 0.06] as [number, number]) : null
  const start = mode === 'value-y' || mode === 'value-x' ? { x: t.x_min, y: f(t.x_min) } : null

  return (
    <figure className="cplay">
      <Curve
        t={t}
        f={f}
        yRange={yRange}
        hideInk={mode === 'value-y' || mode === 'value-x'}
        skip={gap}
        known={mode === 'tangent' ? { x: t.ask_x!, y: f(t.ask_x!) } : start}
        mark={mode === 'tangent' || mode === 'limit' || mode === 'value-y' ? t.ask_x : null}
        hguide={mode === 'value-x' ? t.ask_y : null}
        tangent={mode === 'tangent' ? { x: t.ask_x!, slope: null } : null}
        guessSlope={mode === 'tangent' ? guess : null}
        area={mode === 'riemann' ? { from: t.area_from!, to: t.area_to!, n: null, guess } : null}
        pencil={guess == null ? null : mode === 'value-x' ? { x: guess, y: t.ask_y! } : mode === 'value-y' || mode === 'limit' ? { x: t.ask_x!, y: guess } : null}
        onPick={pick}
        slider={{ label: 'your guess', valueText: guess == null ? 'not set' : withUnit(guess, s.unit), onKey: key }}
      />
      <figcaption className="cplay-cap">
        {guess == null ? (
          <span className="cplay-do">{instruction(mode, t)}</span>
        ) : (
          <span className="hand cplay-you" aria-live="polite">
            {readout(mode)}: <strong>{withUnit(guess, s.unit)}</strong>
          </span>
        )}
      </figcaption>
    </figure>
  )
}

function readout(mode: PlayMode): string {
  return mode === 'tangent' ? 'your slope' : mode === 'riemann' ? 'your area' : mode === 'limit' ? 'your limit' : 'your guess'
}

/** Whether the explore knob is the number of rectangles (riemann) rather than a parameter in the curve. */
function knobIsRects(item: Item): boolean {
  const t = item.truth as CurveTruth
  const ex = item.explore
  return !!ex && t.show === 'riemann' && !new RegExp(`\\b${ex.param}\\b`).test(t.expr ?? '')
}

/** Reveal for a v4 curve: the truth in ink over your pencil, then a knob and a few settings to try. */
export function CurveReveal({ item, guess, truth }: { item: Item; guess: number | null; truth: Computed }) {
  const t = item.truth as CurveTruth
  const ex = item.explore
  const rects = knobIsRects(item)
  const start = ex ? (ex.default ?? ex.min) : null
  const [k, setK] = useState<number | null>(start)
  const [watch, setWatch] = useState<string | null>(null)
  const moved = ex != null && k != null && k !== start && !rects
  // The curve (and its answer) at the knob's setting; the rectangles knob only changes the sum.
  const here = useMemo(() => (moved ? computeTruth({ ...item, explore: { ...ex!, default: k } }) : truth), [moved, item, ex, k, truth])
  const f = here.kind === 'curve' ? here.f : null
  if (!f || here.kind !== 'curve') return null
  const v = here.value
  const span = t.x_max - t.x_min
  const n = rects ? Math.max(1, Math.round(k ?? 4)) : t.show === 'riemann' ? 4 : null

  let picture
  if (t.show === 'tangent' && t.ask_x != null) {
    picture = <Curve t={t} f={f} tangent={{ x: t.ask_x, slope: v }} guessSlope={moved ? null : guess} point={here.point} pointLabel={v != null ? `slope ${num(v)}` : ''} />
  } else if (t.show === 'riemann' && t.area_from != null && t.area_to != null) {
    picture = <Curve t={t} f={f} area={{ from: t.area_from, to: t.area_to, n, guess: moved ? null : guess }} />
  } else if (t.show === 'limit' && t.ask_x != null) {
    picture = <Curve t={t} f={f} skip={[t.ask_x - span * 0.004, t.ask_x + span * 0.004]} mark={t.ask_x} point={here.point} guess={moved ? null : guess} pointLabel={v != null ? `limit ${num(v)}` : ''} hole />
  } else {
    const label = v != null ? withUnit(v, item.slider?.unit ?? '') : undefined
    picture = <Curve t={t} f={f} guess={moved ? null : guess} point={here.point} pointLabel={label} />
  }
  const sum = rects && n != null && t.area_from != null && t.area_to != null ? leftSum(f, t.area_from, t.area_to, n) : null
  const unit = item.slider?.unit ?? ''
  const extremes = (item.extremes ?? []).filter((e) => ex && e.param === ex.param)
  const other = (item.extremes ?? []).filter((e) => !ex || e.param !== ex.param)

  return (
    <div className="cplay-reveal">
      {picture}
      <p className="cplay-key">
        {guess != null && !moved && <span className="hand cplay-you">pencil: you, {withUnit(guess, unit)}</span>}
        {v != null && (
          <span className="cplay-ink">
            ink: {t.show === 'riemann' ? 'exact area' : t.show === 'tangent' ? 'slope' : t.show === 'limit' ? 'limit' : 'reality'} {withUnit(v, unit)}
          </span>
        )}
        {sum != null && (
          <span className="cplay-ink">
            {n} {n === 1 ? 'rectangle' : 'rectangles'}: {num(sum)}
          </span>
        )}
      </p>
      {ex && k != null && (
        <div className="cplay-explore">
          <label className="cplay-knob">
            <span>
              {ex.label}: <strong>{num(k)}</strong>
            </span>
            <input
              type="range"
              min={ex.min}
              max={ex.max}
              step={ex.step}
              value={k}
              aria-label={ex.label}
              onChange={(e) => {
                setK(Number(e.target.value))
                setWatch(null)
              }}
            />
          </label>
          {extremes.length > 0 && (
            <div className="cplay-try" role="group" aria-label="Settings to try">
              <span className="cplay-try-h">Try:</span>
              {extremes.map((e) => (
                <button
                  key={`${e.param}-${e.value}`}
                  type="button"
                  aria-pressed={k === e.value}
                  onClick={() => {
                    setK(Math.min(ex.max, Math.max(ex.min, e.value)))
                    setWatch(e.watch)
                  }}
                >
                  {ex.param} = {num(e.value)}
                </button>
              ))}
              {start != null && k !== start && (
                <button type="button" onClick={() => (setK(start), setWatch(null))}>
                  back to {num(start)}
                </button>
              )}
            </div>
          )}
          {watch && <p className="cplay-watch">{watch}</p>}
        </div>
      )}
      {other.length > 0 && (
        <ul className="cplay-notes">
          {other.map((e) => (
            <li key={`${e.param}-${e.value}`}>
              At {e.param} = {num(e.value)}: {e.watch}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Sampler items: the histogram with your guess in pencil, plus the settings to try (re-simulated here). */
export function SamplerExplore({ item, guess }: { item: Item; guess: number | null }) {
  const t = item.truth
  const [pick, setPick] = useState<number | null>(null)
  const list = useMemo(() => (item.extremes ?? []).filter((e) => t.widget === 'distribution' && e.param in t.params), [item.extremes, t])
  const hist = useMemo(() => {
    if (pick == null || t.widget !== 'distribution') return null
    const e = list[pick]
    return simulate({ ...t, params: { ...t.params, [e.param]: e.value, trials: Math.min(t.params.trials ?? 10000, 10000) } })
  }, [pick, t, list])
  if (t.widget !== 'distribution' || list.length === 0) return null
  return (
    <div className="cplay-explore">
      <div className="cplay-try" role="group" aria-label="Settings to try">
        <span className="cplay-try-h">Try:</span>
        {list.map((e, i) => (
          <button key={`${e.param}-${e.value}`} type="button" aria-pressed={pick === i} onClick={() => setPick(i)}>
            {e.param.replace(/_/g, ' ')} = {num(e.value)}
          </button>
        ))}
        {pick != null && (
          <button type="button" onClick={() => setPick(null)}>
            back
          </button>
        )}
      </div>
      {hist && pick != null && (
        <>
          <Distribution hist={hist} xLabel={t.x_label} guess={guess} />
          <p className="cplay-watch">{list[pick].watch}</p>
        </>
      )}
    </div>
  )
}
