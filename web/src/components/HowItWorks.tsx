import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { checksFor } from '../extras'
import { answerUnit, prettyFormula, withUnit } from '../format'
import { answerValue, computeTruth, type Computed } from '../truth'
import type { ChecksReport, Item, Round, Sampler } from '../types'
import './HowItWorks.css'

// "How it works" (docs/demo-script.md, judge Q: "how do you know it's right?"): for the item on
// screen, the spec the round states next to what our code computes from it, plus how the round
// was checked. Reads only what the page already has; never calls the API.

const SAMPLERS: Record<Sampler, string> = {
  coin_longest_run: 'longest run of the same side in n coin flips',
  base_rate_test: 'screening test on a population (icon array)',
  birthday_match: 'rooms of people with random birthdays: any shared?',
  binomial_count: 'heads count in n coin flips',
  dice_sum: 'sum of fair six-sided dice',
}

const PARAM_NAMES: Record<string, string> = {
  n: 'n (flips)',
  p: 'p (chance of heads)',
  population: 'population',
  base_rate: 'base rate',
  sensitivity: 'sensitivity',
  false_positive_rate: 'false positive rate',
  group_size: 'group size',
  dice: 'dice',
  trials: 'simulated tries',
}

const n = (v: number) => (Number.isInteger(v) ? v.toLocaleString('en-US') : String(Number(v.toPrecision(6))))

function Row({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="hiw-row">
      <dt>{k}</dt>
      <dd>{children}</dd>
    </div>
  )
}

/** `show` false (guess not locked, no peek): the answer formula and the round's claim stay hidden (#171). */
function SpecSide({ item, show }: { item: Item; show: boolean }) {
  const t = item.truth
  return (
    <dl className="hiw-spec">
      {t.widget === 'distribution' && (
        <>
          <Row k="Simulation">
            <code>{t.sampler}</code>: {SAMPLERS[t.sampler]}
          </Row>
          {Object.entries(t.params)
            .filter(([, v]) => v != null)
            .map(([key, v]) => (
              <Row key={key} k={PARAM_NAMES[key] ?? key}>
                <span className="hiw-mono">{n(v as number)}</span>
              </Row>
            ))}
          {t.x_label && <Row k="Counts">{t.x_label}</Row>}
        </>
      )}
      {t.widget === 'curve' && (
        <>
          <Row k="Curve">
            {t.preset === 'birthday_match_probability' ? (
              <span className="hiw-mono">P(match) = 1 − ∏ (365 − i) ÷ 365, i = 0 … x − 1</span>
            ) : (
              <span className="hiw-mono">y = {prettyFormula(t.expr ?? '')}</span>
            )}
          </Row>
          <Row k="x">
            {t.x_label} <span className="hiw-mono">({n(t.x_min)} to {n(t.x_max)})</span>
          </Row>
          <Row k="y">{t.y_label}</Row>
          {item.explore && (
            <Row k={`knob ${item.explore.param}`}>
              {item.explore.label}: <span className="hiw-mono">{item.explore.default != null ? n(item.explore.default) : 'n/a'}</span> as asked (slider {n(item.explore.min)} to {n(item.explore.max)})
            </Row>
          )}
          {t.ask_x != null && (
            <Row k="Asks">
              y at <span className="hiw-mono">x = {n(t.ask_x)}</span>
            </Row>
          )}
          {t.ask_y != null && (
            <Row k="Asks">
              first x where <span className="hiw-mono">y = {n(t.ask_y)}</span>
            </Row>
          )}
        </>
      )}
      {t.widget === 'estimate' && <Row k="Shown as">one number on a number line{t.unit ? ` (${t.unit})` : ''}</Row>}
      {t.widget === 'stepper' && <Row k="Shown as">a worked example in {t.steps.length} steps</Row>}
      {!show && (item.answer_expr || item.answer_claimed != null) && (
        <Row k="Answer">
          <span className="hiw-held" data-testid="hiw-held-spec">held back until you make your guess</span>
        </Row>
      )}
      {show && item.answer_expr && (
        <Row k="Answer formula">
          <span className="hiw-mono">{prettyFormula(item.answer_expr)}</span>
        </Row>
      )}
      {show && item.answer_claimed != null && (
        <Row k="Round claims">
          <span className="hiw-mono">{n(item.answer_claimed)}</span>
        </Row>
      )}
      {item.slider && (
        <Row k="Guess on">
          a slider, <span className="hiw-mono">{withUnit(item.slider.min, item.slider.unit)}</span> to <span className="hiw-mono">{withUnit(item.slider.max, item.slider.unit)}</span>
        </Row>
      )}
      {item.input_type === 'choice' && <Row k="Guess on">{item.options?.length ?? 0} choices</Row>}
    </dl>
  )
}

const near = (a: number, b: number) => Math.abs(a - b) <= Math.max(0.01 * Math.abs(b), 0.051)

function ComputedSide({ item, round, truth }: { item: Item; round: Round; truth: Computed }) {
  const { unit, label } = answerUnit(item, truth)
  const value = truth.value
  const label_ = (mid: string | null) => (mid === null ? 'correct' : round.misconceptions.find((m) => m.id === mid)?.label ?? mid)
  // Same rule as the reveal: bands sorted by min, the first one holding the value wins.
  const bands = [...(item.bands ?? [])].sort((a, b) => a.min - b.min)
  const hit = value == null ? -1 : bands.findIndex((b) => value >= b.min && value <= b.max)
  const stated = answerValue(item)
  const right = item.input_type === 'choice' ? item.options?.find((o) => o.misconception_id === null) : undefined
  return (
    <div className="hiw-computed">
      <p className="hiw-value">
        {value == null ? (
          <span>No single number: this one is a worked example.</span>
        ) : truth.kind === 'distribution' && truth.stat === 'average' ? (
          // Nothing says which statistic answers it, so no number is headlined as the answer.
          <span data-testid="hiw-no-headline">
            No single number answers this one{right ? <>: the right choice is <strong>{right.text}</strong></> : ''}. The simulation is below
            (<span className="hiw-mono">average {n(Number(truth.hist.mean.toFixed(2)))}</span>).
          </span>
        ) : (
          <>
            <strong data-testid="hiw-value">{withUnit(value, unit)}</strong>
            {label && <span className="hiw-unit"> {label}</span>}
            {truth.kind === 'distribution' && truth.stat === 'mode' && <span className="hiw-unit"> most common (the tallest bar)</span>}
            {truth.kind === 'distribution' && truth.stat === 'mean' && <span className="hiw-unit"> average</span>}
          </>
        )}
      </p>
      {truth.kind === 'distribution' && (
        <p className="hiw-note">
          From {truth.hist.trials.toLocaleString('en-US')} simulated tries (seeded, so it's the same every time). Average {n(Number(truth.hist.mean.toFixed(3)))}, range {truth.hist.min} to {truth.hist.max}.
        </p>
      )}
      {truth.kind === 'icons' && (
        <p className="hiw-note">
          {truth.counts.sick} sick of {truth.counts.population.toLocaleString('en-US')}; true positives {n(truth.counts.truePos)}, false positives {n(Number(truth.counts.falsePos.toFixed(2)))}; TP ÷ (TP + FP).
        </p>
      )}
      {truth.kind === 'curve' && truth.point && (
        <p className="hiw-note">
          The curve's point: x = {n(Number(truth.point.x.toFixed(3)))}, y = {n(Number(truth.point.y.toFixed(3)))}.
        </p>
      )}
      {item.answer_claimed != null && value != null && (
        <p className="hiw-note">
          {near(value, item.answer_claimed) ? 'Matches' : 'Differs from'} the round's stated {n(item.answer_claimed)}
          {stated != null && item.answer_expr ? ' (the formula is evaluated here, the claim is only a cross-check)' : ''}.
        </p>
      )}
      {bands.length > 0 && (
        <table className="hiw-bands">
          <caption>Answer bands</caption>
          <thead>
            <tr>
              <th scope="col">Range</th>
              <th scope="col">Means</th>
            </tr>
          </thead>
          <tbody>
            {bands.map((b, i) => (
              <tr key={i} className={`${b.misconception_id === null ? 'correct' : ''} ${i === hit ? 'hit' : ''}`}>
                <td className="hiw-mono">
                  {withUnit(b.min, item.slider?.unit ?? '')} to {withUnit(b.max, item.slider?.unit ?? '')}
                </td>
                <td>
                  {label_(b.misconception_id)}
                  {i === hit && <span className="hiw-hit"> ← computed answer lands here</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {item.input_type === 'choice' && item.options && (
        <ul className="hiw-options">
          {item.options.map((o) => (
            <li key={o.id} className={o.misconception_id === null ? 'correct' : ''}>
              {o.text} <span className="hiw-means">({label_(o.misconception_id)})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// Is this item's answer something our code computes (vs. only a stated number)?
const computedByCode = (item: Item) => item.truth.widget === 'distribution' || item.truth.widget === 'curve' || !!item.answer_expr

function GeneratedChecks({ item, report }: { item: Item; report: ChecksReport | null | undefined }) {
  if (!report) {
    return (
      <p>
        Built automatically. No check report came with this round (it was cached before reports were stored, or it was opened from a link), so we can't show what was checked. Our code still evaluates each stated formula (or runs the simulation) on this page.
      </p>
    )
  }
  const mine = computedByCode(item)
    ? 'this answer is computed by our code from the spec, so it was not sent to a second model'
    : report.unchecked.includes(item.id)
      ? 'this answer is NOT checked: no formula to compute and no blind answer came back'
      : 'a second model answered this one blind and agreed'
  return (
    <>
      <p>
        Built by <span className="hiw-mono">{report.model}</span> in {report.seconds.toFixed(1)} s. The model only writes the spec; our code computes the answers.
      </p>
      <ul className="hiw-checks">
        <li>
          Kept <strong>{report.kept}</strong> question{report.kept === 1 ? '' : 's'}
          {report.dropped.length > 0 ? `, dropped ${report.dropped.length}:` : ', dropped none.'}
          {report.dropped.length > 0 && (
            <ul>
              {report.dropped.map((d) => (
                <li key={d.item_id}>
                  <span className="hiw-mono">{d.item_id}</span>: {d.reason}
                </li>
              ))}
            </ul>
          )}
        </li>
        <li>
          {report.blind_checked
            ? `Blind check: ${report.blind_ok} agreed, ${report.blind_failed} failed (errored or timed out).`
            : `Blind check: not run for any question${report.blind_failed ? ` (${report.blind_failed} tried and failed: errored or timed out)` : ''}.`}
        </li>
        <li>
          {report.unchecked.length
            ? `Unchecked: ${report.unchecked.length} (${report.unchecked.join(', ')}), shown without a check.`
            : 'Unchecked: none.'}
        </li>
        <li>This question: {mine}.</li>
      </ul>
    </>
  )
}

/** `show` false: the source titles name the wrong ideas, so they wait for lock-in like the answer (#171). */
function HandChecked({ item, round, show }: { item: Item; round: Round; show: boolean }) {
  const ids = new Set<string>([
    ...(item.targets ?? []),
    ...(item.bands ?? []).map((b) => b.misconception_id ?? ''),
    ...(item.options ?? []).map((o) => o.misconception_id ?? ''),
  ])
  const linked = round.misconceptions.filter((m) => ids.has(m.id))
  const shown = linked.length ? linked : round.misconceptions
  const t = item.truth
  const truthSource = (t.widget === 'estimate' || t.widget === 'stepper') && t.source_url ? t.source_url : null
  return (
    <>
      <p>
        <strong>Hand-checked:</strong> our code evaluates the stated formula (or runs the simulation), and a person checked the numbers and sources.
        {show ? ' Sources:' : ''}
      </p>
      {!show && (
        <p className="hiw-held" data-testid="hiw-held-sources">
          The sources are listed after you make your guess: their titles name the wrong ideas.
        </p>
      )}
      {show && <ul className="hiw-sources">
        {truthSource && (
          <li>
            Answer: <a href={truthSource} target="_blank" rel="noreferrer">{truthSource}</a>
          </li>
        )}
        {shown.map((m) => (
          <li key={m.id}>
            <strong>{m.label}</strong>
            {m.source_url && (
              <>
                {' '}
                <a href={m.source_url} target="_blank" rel="noreferrer">
                  {m.source_url.replace(/^https?:\/\/(www\.)?/, '')}
                </a>
              </>
            )}
            {m.source_note && <span className="hiw-means"> {m.source_note}</span>}
          </li>
        ))}
      </ul>}
    </>
  )
}

const FOCUSABLE = 'a[href], button:not([disabled]), summary, input, [tabindex]:not([tabindex="-1"])'

/** The drawer frame: scrim, focus trap, Esc, page scroll locked while it's open. */
export function DrawerShell({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const back = document.activeElement as HTMLElement | null
    panel.current?.querySelector<HTMLElement>('.hiw-close')?.focus()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab' || !panel.current) return
      const all = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)]
      if (!all.length) return
      const first = all[0]
      const last = all[all.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (document.activeElement === last || !panel.current.contains(document.activeElement))) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      back?.focus?.()
    }
  }, [onClose])

  return (
    <div className="hiw-scrim" onClick={onClose}>
      <div className="hiw-panel" role="dialog" aria-modal="true" aria-labelledby="hiw-title" ref={panel} onClick={(e) => e.stopPropagation()}>
        <header className="hiw-head">
          <h2 id="hiw-title">How it works</h2>
          <button className="hiw-close" onClick={onClose} aria-label="Close how it works">
            Close <kbd>Esc</kbd>
          </button>
        </header>
        {children}
      </div>
    </div>
  )
}

/** Shown in place of the answer until the guess is locked; the reader can still peek. */
export function Wait({ text, onPeek }: { text: string; onPeek: () => void }) {
  return (
    <div className="hiw-wait">
      <p>{text}</p>
      <button className="hiw-peek" onClick={onPeek}>
        Show it anyway (spoils this one)
      </button>
    </div>
  )
}

/** The drawer itself. `locked` false = the guess isn't in yet, so the answer side waits. */
export function HowItWorks({ round, item, locked, onClose }: { round: Round; item: Item; locked: boolean; onClose: () => void }) {
  const [peek, setPeek] = useState(false)
  const show = locked || peek
  const truth = useMemo(() => (show ? computeTruth(item) : null), [item, show])

  return (
    <DrawerShell onClose={onClose}>
        <p className="hiw-q">{item.prompt}</p>
        <div className="hiw-cols">
          <section aria-labelledby="hiw-spec-h">
            <h3 id="hiw-spec-h">What the round says</h3>
            <SpecSide item={item} show={show} />
            {/* The raw JSON holds the bands, options' mistakes and the claimed answer: same gate (#171). */}
            {show && (
              <details className="hiw-raw">
                <summary>Raw JSON for this question</summary>
                <pre>{JSON.stringify(item, null, 2)}</pre>
              </details>
            )}
          </section>
          <section aria-labelledby="hiw-comp-h">
            <h3 id="hiw-comp-h">What our code computed</h3>
            {truth ? (
              <ComputedSide item={item} round={round} truth={truth} />
            ) : (
              <Wait text="Make your guess first: the answer is only computed after that." onPeek={() => setPeek(true)} />
            )}
          </section>
        </div>
        <section className="hiw-checks-box" aria-labelledby="hiw-checks-h">
          <h3 id="hiw-checks-h">Checks</h3>
          {round.reviewed ? <HandChecked item={item} round={round} show={show} /> : <GeneratedChecks item={item} report={checksFor(round.slug)} />}
        </section>
    </DrawerShell>
  )
}
