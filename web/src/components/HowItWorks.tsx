import { type KeyboardEvent, useEffect, useMemo, useRef } from 'react'
import { checksFor, type Current } from '../demo'
import { computeTruth, type Computed } from '../truth'
import type { Round } from '../types'
import { fmt } from '../verdict'
import './HowItWorks.css'

const MARK = '"__mm_truth__"'

// Pretty round JSON, split around the current item's truth spec so it can be highlighted.
function splitJson(round: Round, idx: number): [string, string, string] {
  const items = round.items.map((it, i) => (i === idx ? { ...it, truth: MARK.slice(1, -1) } : it))
  const text = JSON.stringify({ ...round, items }, null, 2)
  const at = text.indexOf(MARK)
  if (at < 0) return [text, '', '']
  const indent = text.slice(text.lastIndexOf('\n', at) + 1).match(/^ */)![0]
  const spec = JSON.stringify(round.items[idx].truth, null, 2).replace(/\n/g, `\n${indent}`)
  return [text.slice(0, at), spec, text.slice(at + MARK.length)]
}

function describe(t: Computed): string {
  if (t.kind === 'distribution') return `mean ${t.hist.mean.toFixed(2)} over ${t.hist.trials.toLocaleString()} simulated runs`
  if (t.kind === 'icons') return `${fmt(Math.round(t.value * 10) / 10)}% (${Math.round(t.counts.truePos)} sick of ${Math.round(t.counts.truePos + t.counts.falsePos)} positive)`
  if (t.kind === 'curve') return t.value != null ? `crosses 50% at x = ${t.value}` : 'curve f(x), drawn live'
  return 'no number to compute'
}

const ICON = { pass: '✓', fail: '✗', na: 'n/a' }

export function HowItWorks({ current, onClose }: { current: Current; onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)
  const markRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    closeBtn.current?.focus()
    markRef.current?.scrollIntoView?.({ block: 'center' })
    return () => prev?.focus?.()
  }, [])

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onClose()
    }
    if (e.key !== 'Tab' || !panel.current) return
    const f = panel.current.querySelectorAll<HTMLElement>('button, a[href], [tabindex]:not([tabindex="-1"])')
    const first = f[0]
    const last = f[f.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  const view = useMemo(() => {
    if (!current) return null
    const item = current.round.items[current.idx]
    const truth = computeTruth(item)
    return { item, truth, json: splitJson(current.round, current.idx), checks: checksFor(current.round, item, truth, current.meta) }
  }, [current])

  return (
    <div className="hiw-backdrop" onClick={onClose}>
      <div
        ref={panel}
        className="hiw"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hiw-title"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKey}
      >
        <header className="hiw-head">
          <div>
            <h2 id="hiw-title">How it works</h2>
            <p className="hiw-caption">The model writes the question and the truth spec. Code computes the answer.</p>
          </div>
          <button ref={closeBtn} className="hiw-close" onClick={onClose} aria-label="Close how it works">
            ✕
          </button>
        </header>
        {!view ? (
          <p className="hiw-empty">Open a round to see its JSON, the computed truth and the checks.</p>
        ) : (
          <div className="hiw-cols">
            <section className="hiw-json" aria-label="Round JSON">
              <h3>Round JSON</h3>
              <pre tabIndex={0}>
                {view.json[0]}
                <mark ref={markRef}>{view.json[1]}</mark>
                {view.json[2]}
              </pre>
            </section>
            <section className="hiw-side">
              <h3>Item {current!.idx + 1}: truth spec</h3>
              <pre className="hiw-spec">{JSON.stringify(view.item.truth, null, 2)}</pre>
              <h3>Computed by code</h3>
              <p className="hiw-value" data-testid="hiw-value">{describe(view.truth)}</p>
              <h3>Checks</h3>
              <ul className="hiw-checks">
                {view.checks.map((c) => (
                  <li key={c.name} className={c.state}>
                    <span className="hiw-icon" aria-label={c.state === 'na' ? 'not applicable' : c.state === 'pass' ? 'passed' : 'failed'}>
                      {ICON[c.state]}
                    </span>
                    <span>
                      <strong>{c.name}</strong> <small>{c.note}</small>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="hiw-meta">
                {current!.meta?.source
                  ? `model: ${current!.meta.source}${current!.meta.seconds != null ? ` · built in ${current!.meta.seconds}s` : ''}`
                  : current!.round.reviewed
                    ? 'model: n/a — hand-checked showcase'
                    : 'model: not reported'}
              </p>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
