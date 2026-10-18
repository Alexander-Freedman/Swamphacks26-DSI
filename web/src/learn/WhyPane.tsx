import { useState, type ReactNode } from 'react'
import why from './why.json'
import './WhyPane.css'

// The why rail: every Learn step down the left, so you always see where you are and why.
// The current step is open (what you're doing, why it works, one source). Past steps keep their
// reason, folded, one tap to reopen. Future steps are just their names.
// Phone: one line ("Step 3 of 8 · Compare two cases") that opens the whole list on tap.
// Copy lives in why.json (see docs/why-pane.md); this file only lays it out.

export type WhyStage = keyof typeof why

const ORDER = Object.keys(why) as WhyStage[]

export const STEP_NAME: Record<WhyStage, string> = {
  guess: 'Guess first',
  anchor: 'One true fact',
  contrast: 'Compare two cases',
  stress: 'Stress test',
  draw: 'Draw it',
  neighbor: 'Tell it apart',
  transfer: 'Carry it over',
  done: 'What you caught',
}

function Reason({ stage }: { stage: WhyStage }) {
  const w = why[stage]
  return (
    <div className="why-body">
      <p className="why-k">what you’re doing</p>
      <p className="why-doing">{w.doing}</p>
      <p className="why-k">why it works</p>
      <p className="why-why">{w.why}</p>
      <p className="why-source">{w.source}</p>
    </div>
  )
}

export function WhyPane({ stage }: { stage: WhyStage }) {
  const [open, setOpen] = useState(false)
  const now = ORDER.indexOf(stage)
  return (
    <aside className={'why-rail' + (open ? ' open' : '')} aria-label="why this step">
      <button className="why-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span>
          Step {now + 1} of {ORDER.length} · {STEP_NAME[stage]}
        </span>
        <span aria-hidden="true">{open ? '▴' : '▾'}</span>
      </button>
      <ol className="why-steps">
        {ORDER.map((s, i) =>
          i === now ? (
            <li key={s} className="why-step is-now" aria-current="step">
              <p className="why-name">
                <span className="why-num">{i + 1}</span> {STEP_NAME[s]}
              </p>
              <Reason stage={s} />
            </li>
          ) : i < now ? (
            <li key={s} className="why-step is-past">
              <details>
                <summary className="why-name">
                  <span className="why-num" aria-label="done">
                    ✓
                  </span>{' '}
                  {STEP_NAME[s]}
                </summary>
                <Reason stage={s} />
              </details>
            </li>
          ) : (
            <li key={s} className="why-step is-next">
              <p className="why-name">
                <span className="why-num">{i + 1}</span> {STEP_NAME[s]}
              </p>
            </li>
          ),
        )}
      </ol>
    </aside>
  )
}

/** A Learn screen with its why rail on the left (for screens that lay themselves out). */
export function WithWhy({ stage, children }: { stage: WhyStage; children: ReactNode }) {
  return (
    <div className="why-layout">
      <WhyPane stage={stage} />
      <div className="why-main">{children}</div>
    </div>
  )
}
