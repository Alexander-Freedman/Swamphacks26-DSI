import { useState } from 'react'
import { showcaseRound } from '../rounds'
import { DrawerShell, Wait } from './HowItWorks'
import { sessionHowItWorks } from './sessionSpecs'
import './HowItWorks.css'

/** The drawer for a session. The App can't see the session's lock state, so the numbers wait for a click. */
export function SessionHowItWorks({ slug, onClose, shown, onShow }: { slug: string; onClose: () => void; shown?: boolean; onShow?: () => void }) {
  const spec = sessionHowItWorks[slug]
  const [peek, setPeek] = useState(false)
  const show = shown ?? peek
  if (!spec) return null
  const round = showcaseRound(slug)
  return (
    <DrawerShell onClose={onClose}>
      <p className="hiw-q">{spec.question}</p>
      <div className="hiw-cols">
        <section aria-labelledby="hiw-spec-h">
          <h3 id="hiw-spec-h">What's computed</h3>
          <dl className="hiw-spec">
            <div className="hiw-row">
              <dt>Computes</dt>
              <dd>{spec.computes}</dd>
            </div>
            <div className="hiw-row">
              <dt>Formula</dt>
              <dd>
                <span className="hiw-mono">{spec.formula}</span>
              </dd>
            </div>
            <div className="hiw-row">
              <dt>Method</dt>
              <dd>{spec.method}</dd>
            </div>
          </dl>
        </section>
        <section aria-labelledby="hiw-comp-h">
          <h3 id="hiw-comp-h">What our code computed</h3>
          {show ? (
            <dl className="hiw-spec" data-testid="hiw-session-results">
              {spec.results().map((r) => (
                <div className="hiw-row" key={r.label}>
                  <dt>{r.label}</dt>
                  <dd>
                    <strong className="hiw-mono hiw-result">{r.value}</strong>
                    {r.work && <span className="hiw-means"> ({r.work})</span>}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <Wait text="The number shows after you make your guess." onPeek={() => (onShow ? onShow() : setPeek(true))} />
          )}
        </section>
      </div>
      <section className="hiw-checks-box" aria-labelledby="hiw-checks-h">
        <h3 id="hiw-checks-h">Checks</h3>
        <p>
          <strong>Hand-checked:</strong> a person checked the numbers and sources. Sources:
        </p>
        <ul className="hiw-sources">
          {(spec.extraSources ?? []).map((s) => (
            <li key={s.url}>
              <strong>{s.label}</strong>{' '}
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.url.replace(/^https?:\/\/(www\.)?/, '')}
              </a>
            </li>
          ))}
          {(round?.misconceptions ?? []).map((m) => (
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
        </ul>
      </section>
    </DrawerShell>
  )
}
