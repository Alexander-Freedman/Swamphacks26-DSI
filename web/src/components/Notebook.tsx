import type { MouseEvent } from 'react'
import { BUST_AFTER, NOTEBOOK_HREF, entries, notebook, type Card } from '../notebook'
import { sessionFor, sessions } from '../sessions/registry'
import './Notebook.css'

const BASE = import.meta.env.BASE_URL

/** In-app navigation for a real link: plain clicks go through `go` (history entry, no reload); modified clicks open normally. */
const via = (fn?: () => void) =>
  fn
    ? (e: MouseEvent<HTMLAnchorElement>) => {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
        e.preventDefault()
        fn()
      }
    : undefined

function when(iso: string, now = new Date()): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const days = Math.floor((now.setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 86_400_000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function MistakeCard({ c }: { c: Card }) {
  const busted = c.status === 'busted'
  const left = Math.max(0, BUST_AFTER - c.wins)
  return (
    <li className={`nb-card ${c.status}`}>
      <span className="nb-stamp" aria-hidden="true">{busted ? 'busted' : 'caught'}</span>
      <p className="nb-topic">{sessionFor(c.session)?.title ?? c.topic}</p>
      <h3 className="nb-label">“{c.label}”</h3>
      <p className="nb-meta">
        <span className="sr-only">{busted ? 'Busted. ' : 'Caught. '}</span>
        Fell for it {c.caught === 1 ? 'once' : `${c.caught} times`} · last seen {when(c.lastSeen)}
      </p>
      <p className="nb-progress">
        {busted ? (
          'Right twice since. This one is busted.'
        ) : (
          <>
            <span className="nb-pips" aria-hidden="true">
              {Array.from({ length: BUST_AFTER }, (_, i) => (
                <i key={i} className={i < c.wins ? 'on' : ''} />
              ))}
            </span>
            {left === BUST_AFTER ? `Get it right ${BUST_AFTER} times to bust it.` : `${left} more right answer to bust it.`}
          </>
        )}
      </p>
    </li>
  )
}

export function NotebookScreen({ onHome }: { onHome?: () => void }) {
  const cards = notebook()
  const all = entries()
  const played = all.length
  // Empty state (#162): count missed rematches honestly and point at a session not played yet.
  const missed = all.filter((e) => e.rematch === 'wrong').length
  const next = sessions.find((s) => !all.some((e) => e.session === s.slug)) ?? sessions[0]
  const caught = cards.filter((c) => c.status === 'caught')
  const busted = cards.filter((c) => c.status === 'busted')
  return (
    <div className="sheet nb">
      <h1 className="nb-title">Your notebook</h1>
      <p className="concept">
        Every wrong idea a session caught lands here in pencil. Get it right twice later and it's inked in: busted.
      </p>
      {cards.length === 0 ? (
        <div className="nb-empty">
          <p className="nb-empty-hand">Nothing caught yet.</p>
          <p>
            {played > 0
              ? `You've played ${played} ${played === 1 ? 'session' : 'sessions'} and your first guess called ${played === 1 ? 'it' : 'every one'}${missed ? ` (${missed} ${missed === 1 ? 'rematch' : 'rematches'} missed)` : ''}. Try another one: the mistakes worth catching are the confident ones.`
              : 'Play a session: guess first, watch reality, and if your guess misses, the idea behind it shows up here.'}
          </p>
          {next && (
            <a className="nb-btn" href={`${BASE}?session=${next.slug}`}>
              {played > 0 ? `Next: ${next.title}` : 'Start with the birthday problem'}
            </a>
          )}
        </div>
      ) : (
        <>
          <p className="nb-tally">
            <strong>{caught.length}</strong> caught · <strong>{busted.length}</strong> busted · {played} {played === 1 ? 'session' : 'sessions'} played
          </p>
          <ul className="nb-cards">
            {[...caught, ...busted].map((c) => (
              <MistakeCard key={`${c.session}/${c.id}`} c={c} />
            ))}
          </ul>
        </>
      )}
      <a className="nb-back" href={BASE} onClick={via(onHome)}>← Home</a>
    </div>
  )
}

/** The Home link, with a count so it's worth tapping. */
export function NotebookLink({ onOpen }: { onOpen?: () => void }) {
  const n = notebook().filter((c) => c.status === 'caught').length
  return (
    <a className="nb-link" href={NOTEBOOK_HREF} onClick={via(onOpen)}>
      <span className="nb-link-title">Notebook</span>
      <span className="nb-link-sub">{n > 0 ? `${n} ${n === 1 ? 'mistake' : 'mistakes'} caught, waiting to be busted` : 'Your caught → busted mistakes'}</span>
    </a>
  )
}
