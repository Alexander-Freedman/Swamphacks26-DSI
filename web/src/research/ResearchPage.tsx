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

export function ResearchPage({ onHome }: { onHome?: () => void }) {
  return (
    <div className="sheet rs">
      <h1 className="rs-title">The research behind Onionskin</h1>
      <p className="concept">
        Every step in a lesson comes from published learning-science research. Here is each decision, why it works, and the papers
        it rests on, linked so you can check them yourself.
      </p>

      <h2 className="rs-h">Every step, and why</h2>
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

      <h2 className="rs-h">Questions</h2>
      <div className="rs-faq">
        {faq.map((f) => (
          <details key={f.q} className="rs-q">
            <summary>{f.q}</summary>
            <p>{f.a}</p>
            <Cites ids={f.sources} />
          </details>
        ))}
      </div>

      <h2 className="rs-h">Sources</h2>
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

      <a
        className="nb-back"
        href={import.meta.env.BASE_URL}
        onClick={(e) => {
          if (!onHome) return
          e.preventDefault()
          onHome()
        }}
      >
        ← Home
      </a>
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
