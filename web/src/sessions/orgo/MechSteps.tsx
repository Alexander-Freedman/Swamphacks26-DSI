import { useState } from 'react'
import { tapVerdict, type Part } from './chem'
import {
  ANALYSIS_MISTAKES, CARBON_SHORT, CHART, CHART_NOTE, MECHS, PART_ASK, PART_TAG, SN2_CASE,
  type AnalysisMistake, type CarbonKind, type Case, type Mech, type Question, type Strength,
} from './analysis'
import { Scene } from './Scene'
import { RX, sceneAt } from './sn2'

// Working out the mechanism before drawing it: find the parts, size them up, read the chart.

const NAMES: Record<string, string> = { back: 'H of hydroxide', nu: 'O of hydroxide', c: 'carbon of CH₃Br', h1: 'H on carbon', h2: 'H on carbon', h3: 'H on carbon', lg: 'Br' }
const PART_NAME: Record<Part, string> = { nucleophile: 'nucleophile', electrophile: 'substrate carbon', leaving: 'leaving group' }

type StepProps = { onNext: () => void; nextLabel: string; c?: Case }

/* ---------- find the parts ---------- */

export function PartsStep({ onNext, nextLabel, c = SN2_CASE }: StepProps) {
  const rx = RX[c.rx]
  const [found, setFound] = useState<Part[]>([])
  const [hint, setHint] = useState<string | null>(null)
  const cur = PART_ASK.find((p) => !found.includes(p.part))
  const marks = Object.fromEntries(found.map((p) => [rx.parts[p], PART_TAG[p]]))
  const tap = (atom: string) => {
    if (!cur) return
    if (tapVerdict(rx.parts, cur.part, atom).ok) {
      setFound((f) => [...f, cur.part])
      setHint(null)
    } else setHint(`Not that one. ${cur.hint}`)
  }
  return (
    <section className="og-step og-analyze">
      <div className="og-size">
      <figure className="og-fig">
        <figcaption>{rx.text.reactants}</figcaption>
        <Scene scene={sceneAt(rx, 0)} label={rx.text.reactants} marks={marks} onAtom={cur ? tap : undefined} atomName={(id) => NAMES[id]} />
      </figure>
      <div className="og-col">
      <p className="og-ask" aria-live="polite">
        {cur ? cur.ask : 'All three found.'}
        {cur && <span className="og-where">{found.length} of 3 found</span>}
      </p>
      {hint && <p className="og-hint" role="status">{hint}</p>}
      <ul className="og-found">
        {PART_ASK.map((p) => (
          <li key={p.part} className={found.includes(p.part) ? 'on' : ''}>
            <span className="og-chip">{PART_TAG[p.part]}</span> {PART_NAME[p.part]}
            {found.includes(p.part) && <b> · {NAMES[rx.parts[p.part]]} ✓</b>}
          </li>
        ))}
      </ul>
      {!cur && (
        <div className="og-row">
          <button className="og-btn og-go" onClick={onNext}>{nextLabel}</button>
        </div>
      )}
      </div>
      </div>
    </section>
  )
}

/* ---------- size them up ---------- */

type AnyQ = Question<string>

export function SizeStep({ onNext, nextLabel, onMistake, c = SN2_CASE }: StepProps & { onMistake: (m: AnalysisMistake) => void }) {
  const rx = RX[c.rx]
  const qs = [c.nu, c.carbon, c.lg] as AnyQ[]
  const [i, setI] = useState(0)
  const [wrong, setWrong] = useState<string[]>([])
  const [note, setNote] = useState<{ label: string; line: string } | null>(null)
  const q = qs[Math.min(i, qs.length - 1)]
  const done = i >= qs.length
  const pick = (v: string) => {
    if (v === q.answer) {
      setI((n) => n + 1)
      setWrong([])
      setNote(null)
      return
    }
    setWrong((w) => [...w, v])
    const m = q.traps[v]
    if (m) {
      onMistake(m)
      setNote(ANALYSIS_MISTAKES[m])
    } else setNote({ label: 'Not quite', line: q.retry || 'Try another one.' })
  }
  const TITLE: Record<AnyQ['id'], string> = { nu: 'Nucleophile', carbon: 'Substrate carbon', lg: 'Leaving group' }
  return (
    <section className="og-step og-analyze">
      <div className="og-size">
        <figure className="og-fig">
          <figcaption>{rx.text.reactants}</figcaption>
          <Scene scene={sceneAt(rx, 0)} label={rx.text.reactants} marks={done ? {} : { [q.atom]: q.tag }} />
        </figure>
        <ol className="og-sheet" aria-label="what you've worked out">
          {qs.map((x, k) => (
            <li key={x.id} className={k < i ? 'on' : k === i ? 'now' : ''}>
              <span className="og-tag">{TITLE[x.id]}</span>
              {k < i ? <><b>{x.choices.find((ch) => ch.value === x.answer)!.label} ✓</b><span className="og-why">{x.why}</span></> : <span className="og-pending">{k === i ? '?' : '…'}</span>}
            </li>
          ))}
        </ol>
      </div>
      {!done && (
        <div className="og-q">
          <p className="og-ask" aria-live="polite">{q.ask}</p>
          <div className="og-choices">
            {q.choices.map((ch) => (
              <button key={ch.value} className="og-choice" disabled={wrong.includes(ch.value)} onClick={() => pick(ch.value)}>
                <b>{ch.label}</b>
                {ch.sub && <span>{ch.sub}</span>}
              </button>
            ))}
          </div>
          {note && (
            <div className="og-note" role="status">
              <div className="og-mname">{note.label}</div>
              <p>{note.line}</p>
            </div>
          )}
        </div>
      )}
      {done && (
        <div className="og-row">
          <button className="og-btn og-go" onClick={onNext}>{nextLabel}</button>
        </div>
      )}
    </section>
  )
}

/* ---------- pick the mechanism ---------- */

const KINDS: CarbonKind[] = ['methyl', 'primary', 'secondary', 'tertiary']
const STRENGTHS: Strength[] = ['strong', 'weak']

export function DecideStep({ onNext, nextLabel, onMistake, c = SN2_CASE }: StepProps & { onMistake: (m: AnalysisMistake) => void }) {
  const [wrong, setWrong] = useState<Mech[]>([])
  const [right, setRight] = useState(false)
  const [note, setNote] = useState<{ label: string; line: string } | null>(null)
  const row = c.carbon.answer
  const col = c.nu.answer
  const pick = (m: Mech) => {
    if (m === c.mech) {
      setRight(true)
      setNote(null)
      return
    }
    setWrong((w) => [...w, m])
    const t = c.mechTraps[m]
    if (t) {
      onMistake(t)
      setNote(ANALYSIS_MISTAKES[t])
    } else setNote({ label: 'Not quite', line: 'Look at where your row and column meet.' })
  }
  return (
    <section className="og-step og-analyze">
      <div className="og-size og-decide">
      <div className="og-col">
      <p className="og-ask">
        Your answers: a <span className="og-hl">{c.nu.answer} nucleophile</span> on a <span className="og-hl">{CARBON_SHORT[row]} carbon</span>, with a {c.lg.answer} leaving group.
        <span className="og-where">Find your row and column on the chart. Which mechanism belongs where they meet?</span>
      </p>
      <div className="og-chart" role="table" aria-label="mechanism chart: carbon type by nucleophile strength">
        <div role="row" className="og-chart-row">
          <span role="columnheader" className="og-chart-corner">carbon ↓ · nucleophile →</span>
          {STRENGTHS.map((s) => (
            <span key={s} role="columnheader" className={'og-chart-h' + (s === col ? ' hl' : '')}>{s}</span>
          ))}
        </div>
        {KINDS.map((k) => (
          <div key={k} role="row" className={'og-chart-row' + (k === row ? ' hl' : '')}>
            <span role="rowheader" className={'og-chart-h' + (k === row ? ' hl' : '')}>{CARBON_SHORT[k]}</span>
            {STRENGTHS.map((s) => {
              const target = k === row && s === col
              const small = CHART_NOTE[k]?.[s]
              return (
                <span key={s} role="cell" className={'og-cell' + (target ? ' target' : '') + (target && right ? ' solved' : '')}>
                  {target && !right ? '?' : CHART[k][s].join(' / ')}
                  {small && !(target && !right) && <small>{small}</small>}
                </span>
              )
            })}
          </div>
        ))}
      </div>
      </div>
      <div className="og-col">
      <div className="og-choices og-mechs">
        {MECHS.map((m) => (
          <button key={m.id} className={'og-choice' + (right && m.id === c.mech ? ' right' : '')} disabled={right || wrong.includes(m.id)} onClick={() => pick(m.id)} aria-pressed={right && m.id === c.mech}>
            <b>{m.id}</b>
            <span className="og-steps">{m.steps}</span>
            <span>{m.what}</span>
          </button>
        ))}
      </div>
      {note && (
        <div className="og-note" role="status">
          <div className="og-mname">{note.label}</div>
          <p>{note.line}</p>
        </div>
      )}
      {right && (
        <div className="og-principle" role="status">
          <p className="og-why-big">{c.why}</p>
          <div className="og-row">
            <button className="og-btn og-go" onClick={onNext}>{nextLabel}</button>
          </div>
        </div>
      )}
      </div>
      </div>
    </section>
  )
}
