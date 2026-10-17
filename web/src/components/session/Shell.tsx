import type { ReactNode, Ref } from 'react'
import { NOTEBOOK_HREF } from '../../notebook'
import { CONFS, endLine, STAMP, type Confidence, type RematchResult } from './copy'
import { useReportSpot, type HelpSpot } from './helpSpot'
import type { Verdict } from '../../verdict'
import './shell.css'

// The session shell: the parts every session shares so they read as one app (#149).
// Modeled on the birthday session: chip + step dots + "n of N", big title, one guidance
// line, required "how sure?", yellow lock, verdict stamp, and the "Saved to your notebook." bar.

/** The full-width session frame, same width and left edge as the birthday session. */
export function Frame({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`ss-frame ${className}`}>{children}</div>
}

/** Chip, step dots and "n of N". With `labels` + `onGo` the dots are buttons named after the steps. */
export function SessionHead(p: {
  chip: string
  step: number
  total: number
  labels?: readonly string[]
  canGo?: (i: number) => boolean
  onGo?: (i: number) => void
  /** Optional: the storyboard screen, lock state and guess, for the Ask panel (#186). */
  help?: Pick<HelpSpot, 'screen' | 'locked' | 'guess'>
  children?: ReactNode
}) {
  const { chip, step, total, labels, canGo, onGo, children } = p
  useReportSpot({ ...p.help, step, total, label: labels?.[step - 1] })
  return (
    <div className="ss-head">
      <span className="ss-chip">{chip}</span>
      {labels && onGo ? (
        <nav className="ss-dots" aria-label="session steps">
          {labels.map((l, i) => (
            <button
              key={l}
              className={'ss-dot' + (i < step ? ' on' : '')}
              aria-label={`${i + 1} ${l}`}
              title={l}
              aria-current={i === step - 1 ? 'step' : undefined}
              disabled={!(canGo?.(i) ?? true)}
              onClick={() => onGo(i)}
            />
          ))}
        </nav>
      ) : (
        <span className="ss-dots" aria-label={`step ${step} of ${total}`}>
          {Array.from({ length: total }, (_, i) => (
            <i key={i} className={'ss-dot' + (i < step ? ' on' : '')} />
          ))}
        </span>
      )}
      <span className="ss-count">{step} of {total}</span>
      {children}
    </div>
  )
}

export function Title({ h, sub, id, headingRef }: { h: ReactNode; sub: ReactNode; id?: string; headingRef?: Ref<HTMLHeadingElement> }) {
  return (
    <>
      <h2 className="ss-title" id={id} ref={headingRef} tabIndex={-1}>{h}</h2>
      <p className="ss-subtitle">{sub}</p>
    </>
  )
}

export function ConfidencePicker({ value, onPick, disabled }: { value: Confidence | null; onPick: (c: Confidence) => void; disabled?: boolean }) {
  return (
    <>
      <div className="ss-tag ss-mt">how sure?</div>
      <div className="ss-choices" role="group" aria-label="how sure are you">
        {CONFS.map((c) => (
          <button key={c} className="ss-choice" aria-pressed={value === c} disabled={disabled} onClick={() => onPick(c)}>{c}</button>
        ))}
      </div>
    </>
  )
}

export function LockButton({ ready, onLock, children }: { ready: boolean; onLock: () => void; children: ReactNode }) {
  return (
    <button className="ss-btn ss-lock" disabled={!ready} onClick={() => ready && onLock()}>
      {children}
    </button>
  )
}

/** The verdict word, big, with "You said ..." next to it. The mistake's name goes on the card under it. */
export function StampRow({ v, children, className = '' }: { v: Verdict; children: ReactNode; className?: string }) {
  return (
    <div className={`ss-stamprow ${className}`}>
      <span className={`ss-stamp ss-stamp-${v}`}>{STAMP[v]}</span>
      <div className="ss-said">{children}</div>
    </div>
  )
}

/**
 * The yellow end bar: saved, what happened, the remix, Open notebook, Done.
 * `rematchCaught`: the mistake a missed rematch points to, when the first guess called it (#162).
 * `line` replaces the caught/rematch sentence for sessions without a rematch.
 */
export function EndBar(p: { caught: string | null; rematch: RematchResult; rematchCaught?: string | null; remix: string; onDone: () => void; line?: ReactNode }) {
  return (
    <div className="ss-end" role="status">
      <p>
        <b>Saved to your notebook.</b> {p.line ?? endLine(p.caught, p.rematch, p.rematchCaught ?? null)} {p.remix}
      </p>
      <div className="ss-endact">
        <a className="ss-nblink" href={NOTEBOOK_HREF}>Open notebook</a>
        <button className="ss-btn" onClick={p.onDone}>Done</button>
      </div>
    </div>
  )
}
