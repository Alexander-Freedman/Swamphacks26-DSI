import { cancelBuild, STEPS, useBuild } from '../building'
import { showcaseRound } from '../rounds'
import type { Round } from '../types'
import './BuildChip.css'

const WHY = {
  static: "Live topics need the server, and this copy runs offline. Pick the closest:",
  failed: "That one needs a reveal we haven't built yet. Pick the closest:",
  slow: "That one's taking a while. Pick the closest:",
}

export function BuildChip({ onOpen, onPick }: { onOpen: (r: Round) => void; onPick: (slug: string) => void }) {
  const b = useBuild()
  if (b.status === 'idle') return null

  if (b.status === 'ready') {
    return (
      <button className="build-chip ready" onClick={() => { onOpen(b.round); cancelBuild() }}>
        <span className="build-topic hand">“{b.topic}”</span>
        <strong>Your topic's ready →</strong>
      </button>
    )
  }

  return (
    <aside className="build-chip" aria-live="polite">
      <button className="build-x" aria-label="dismiss" onClick={cancelBuild}>×</button>
      <span className="build-topic hand">“{b.topic}”</span>
      {b.status === 'building' ? (
        <>
          <strong>Building your round…</strong>
          <ol className="build-steps">
            {STEPS.map((s, i) => (
              <li key={s} className={i < b.step ? 'done' : i === b.step ? 'now' : ''}>{s}</li>
            ))}
          </ol>
        </>
      ) : (
        <>
          <p className="build-why">{WHY[b.reason]}</p>
          <div className="build-picks">
            {b.suggestions.map((slug) => (
              <button key={slug} className="build-pick" onClick={() => onPick(slug)}>{showcaseRound(slug)?.topic ?? slug}</button>
            ))}
          </div>
        </>
      )}
    </aside>
  )
}
