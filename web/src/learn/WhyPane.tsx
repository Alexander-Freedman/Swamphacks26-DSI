import { useState, type ReactNode } from 'react'
import why from './why.json'
import './WhyPane.css'

// The why-pane: beside every Learn screen, three lines (what you're doing, why it works, one source).
// Desktop: a right rail that's always open. Phone: a strip above the screen that opens on tap.
// Copy lives in why.json (see docs/why-pane.md); this file only lays it out.

export type WhyStage = keyof typeof why

export function WhyPane({ stage }: { stage: WhyStage }) {
  const [open, setOpen] = useState(false)
  const w = why[stage]
  return (
    <aside className={'why-pane' + (open ? ' open' : '')} aria-label="why this step">
      <button className="why-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span>Why this step?</span>
        <span aria-hidden="true">{open ? '▴' : '▾'}</span>
      </button>
      <div className="why-body">
        <p className="why-k">what you’re doing</p>
        <p className="why-doing">{w.doing}</p>
        <p className="why-k">why it works</p>
        <p className="why-why">{w.why}</p>
        <p className="why-source">{w.source}</p>
      </div>
    </aside>
  )
}

/** A Learn screen with its why-pane: rail on the right on desktop, strip on top on a phone. */
export function WithWhy({ stage, children }: { stage: WhyStage; children: ReactNode }) {
  return (
    <div className="why-layout">
      <div className="why-main">{children}</div>
      <WhyPane stage={stage} />
    </div>
  )
}
