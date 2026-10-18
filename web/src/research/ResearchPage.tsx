// "The research": every decision in a Learn session, why it works, and the papers behind it,
// with links so anyone can check. Data in research.json (sources verified one by one).
import data from './research.json'
import './research.css'

type Source = { id: string; authors: string; year: number; title: string; venue: string; url: string; finding: string }
type Decision = { step: string; what: string; why: string; sources: string[] }
type Faq = { q: string; a: string; sources: string[] }

const sources = data.sources as Source[]
const decisions = data.decisions as Decision[]
const faq = data.faq as Faq[]
const number = new Map(sources.map((s, i) => [s.id, i + 1]))
const byId = new Map(sources.map((s) => [s.id, s]))

function Cites({ ids }: { ids: string[] }) {
  const known = ids.filter((id) => byId.has(id))
  if (!known.length) return null
  return (
    <p className="rs-cites">
      {known.map((id) => {
        const s = byId.get(id)!
        return (
          <a key={id} href={`#src-${id}`} className="rs-cite">
            [{number.get(id)}] {s.authors.split(/,| &| and/)[0]} {s.year}
          </a>
        )
      })}
    </p>
  )
}

function HomeLink({ onHome, className }: { onHome?: () => void; className: string }) {
  return (
    <a
      className={className}
      href={import.meta.env.BASE_URL}
      onClick={(e) => {
        if (!onHome) return
        e.preventDefault()
        onHome()
      }}
    >
      ← Home
    </a>
  )
}

export function ResearchPage({ onHome }: { onHome?: () => void }) {
  return (
    <div className="rs-page">
      <HomeLink onHome={onHome} className="rs-home" />

      <header className="sheet rs-summary">
        <h1 className="rs-title">The research behind Onionskin</h1>
        <p className="concept">
          Every step in a lesson comes from published learning-science research. Each decision below says what the step does,
          why it works, and which papers back it, numbered so you can check them yourself at the bottom.
        </p>
        <ul className="rs-short">
          <li>You guess first, because a committed wrong guess makes the real answer stick.</li>
          <li>You build and test your own model, because comparing cases and pushing to extremes beats being told.</li>
          <li>No points, streaks or leaderboards: the reward is understanding, and extra rewards can crowd it out.</li>
        </ul>
      </header>

      <div className="rs-cols">
        <section className="sheet rs-col" aria-labelledby="rs-steps-h">
          <h2 className="rs-h" id="rs-steps-h">
            Every step, and why it works
          </h2>
          <ol className="rs-steps">
            {decisions.map((d) => (
              <li key={d.step} className="rs-step">
                <h3>{d.step}</h3>
                <p className="rs-what">{d.what}</p>
                <p className="rs-why">{d.why}</p>
                <Cites ids={d.sources} />
              </li>
            ))}
          </ol>
        </section>

        <section className="sheet rs-col" aria-labelledby="rs-faq-h">
          <h2 className="rs-h" id="rs-faq-h">
            Questions
          </h2>
          <div className="rs-faq">
            {faq.map((f) => (
              <details key={f.q} className="rs-q">
                <summary>{f.q}</summary>
                <p>{f.a}</p>
                <Cites ids={f.sources} />
              </details>
            ))}
          </div>
        </section>
      </div>

      <section className="sheet rs-bottom" aria-labelledby="rs-src-h">
        <h2 className="rs-h" id="rs-src-h">
          Sources
        </h2>
        <p className="rs-note">Every link below was checked to open the paper or its publisher page.</p>
        <ol className="rs-sources">
          {sources.map((s) => (
            <li key={s.id} id={`src-${s.id}`}>
              <span className="rs-ref">
                {s.authors} ({s.year}).{' '}
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.title}
                </a>
                . <i>{s.venue}</i>.
              </span>
              <span className="rs-finding">{s.finding}</span>
            </li>
          ))}
        </ol>
        <HomeLink onHome={onHome} className="nb-back rs-home-bottom" />
      </section>
    </div>
  )
}

/** Home: one quiet link under the Notebook. */
export function ResearchLink({ onOpen }: { onOpen?: () => void }) {
  return (
    <a
      className="nb-link rs-link"
      href={`${import.meta.env.BASE_URL}?research=1`}
      onClick={(e) => {
        if (!onOpen) return
        e.preventDefault()
        onOpen()
      }}
    >
      <span className="nb-link-title">The research behind it</span>
      <span className="nb-link-sub">Every step, why it works, and {sources.length} papers you can check</span>
    </a>
  )
}
