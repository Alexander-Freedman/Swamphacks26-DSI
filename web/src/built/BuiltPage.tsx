// How we built it: a visual page. Screenshots of the live product (taken before the AI server was
// retired), the build numbers from the repo, and two small diagrams. Short captions, no walls of text.
import './built.css'

const img = (name: string) => `${import.meta.env.BASE_URL}built/${name}.jpg`

const STATS: [string, string][] = [
  ['36', 'hours'],
  ['199', 'pull requests merged'],
  ['685', 'commits'],
  ['600+', 'automated tests'],
  ['24', 'research sources'],
  ['10', 'reviewed topics'],
]

const STEPS = ['Guess first', 'One true fact', 'Compare two cases', 'Stress test', 'Draw it', 'Tell it apart', 'Carry it over', 'What you caught']

const DEMOS: [string, string][] = [
  ['derivative', 'Calculus'],
  ['sn2-reaction', 'Organic chemistry'],
  ['base-rates-and-false-positives', 'Base rates'],
]

// screenshots are cropped to the app: 1120x860 (Ask Onion's panel is 760x880)
function Shot({ name, alt, w = 1120, h = 860 }: { name: string; alt: string; w?: number; h?: number }) {
  return <img className="bt-shot" src={img(name)} alt={alt} width={w} height={h} loading="lazy" decoding="async" />
}

function Row({ shot, alt, title, children, flip }: { shot: string; alt: string; title: string; children: React.ReactNode; flip?: boolean }) {
  return (
    <section className={`bt-row${flip ? ' is-flip' : ''}`}>
      <Shot name={shot} alt={alt} />
      <div className="bt-text">
        <h2>{title}</h2>
        {children}
      </div>
    </section>
  )
}

export function BuiltPage({ onHome, onLearn }: { onHome: () => void; onLearn: (slug: string) => void }) {
  return (
    <div className="bt-page">
      <header className="bt-hero sheet">
        <p className="bt-kicker">SwampHacks XII · Entertainment &amp; Creative Technology</p>
        <h1>How we built Onionskin</h1>
        <p className="bt-lede">Two students, two AI coding agents and 24 research papers, in one weekend.</p>
        <div className="bt-go-row">
          <button className="bt-go" onClick={onHome}>
            Try the app →
          </button>
          <span>Pick a lesson and play with it. Three of them replay our AI's real feedback.</span>
        </div>
        <ul className="bt-stats">
          {STATS.map(([n, label]) => (
            <li key={label}>
              <b>{n}</b>
              <span>{label}</span>
            </li>
          ))}
        </ul>
      </header>

      <Row shot="tangent" alt="Calculus: a pencil sketch of the slope with the real slope drawn over it in ink, the gap shaded yellow" title="The idea: onion skin">
        <p>Animators draw on onion skin: the last frame stays faintly visible under the new one.</p>
        <p>Your guess stays in pencil. Reality draws over it in ink. <mark>The gap is the lesson.</mark></p>
      </Row>

      <Row flip shot="reveal" alt="A lesson step: the guess as a dashed line, the real curve in ink, and the why rail on the left" title="Eight steps, each from a study">
        <ol className="bt-steps">
          {STEPS.map((s, i) => (
            <li key={s}>
              <span>{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
        <p>The rail on the left says why each step works and cites the paper behind it.</p>
      </Row>

      <Row shot="stress" alt="Stress test cards with a graph, three predictions and the check" title="Push your rule to the extremes">
        <p>Three extreme cases, each with its own graph. Predict, check, and add the missing piece to your rule.</p>
      </Row>

      <section className="bt-pair">
        <h2>Tools you can touch</h2>
        <div className="bt-two">
          <figure>
            <Shot name="area" alt="Calculus: rectangles filling the area under a curve, closing in on 4.570" />
            <figcaption>Fill the area with rectangles and watch the sum close in.</figcaption>
          </figure>
          <figure>
            <Shot name="orgo" alt="Organic chemistry: build ethanol atom by atom" />
            <figcaption>Build ethanol atom by atom. Give carbon a fifth bond and the mistake is named.</figcaption>
          </figure>
        </div>
      </section>

      <section className="bt-pair">
        <h2>Draw it, then see what you caught</h2>
        <div className="bt-two">
          <figure>
            <Shot name="draw" alt="Draw it from memory: boxes and arrows, each part checked" />
            <figcaption>Sketch the model from memory. Each part gets checked.</figcaption>
          </figure>
          <figure>
            <Shot name="done" alt="The last step names the wrong idea you started with and its fix" />
            <figcaption>The end names the wrong idea you started with, and saves its fix.</figcaption>
          </figure>
        </div>
      </section>

      <section className="bt-diagram sheet">
        <h2>The AI never makes up a number</h2>
        <div className="bt-flow" aria-label="AI proposes, code recomputes, ship or drop">
          <div className="bt-box">AI proposes a lesson and a graph</div>
          <div className="bt-arrow" aria-hidden="true">→</div>
          <div className="bt-box is-ink">Our code recomputes every number</div>
          <div className="bt-arrow" aria-hidden="true">→</div>
          <div className="bt-split">
            <div className="bt-box is-ok">Match: it ships</div>
            <div className="bt-box is-no">Mismatch: dropped</div>
          </div>
        </div>
        <p>Every graph is a formula the app evaluates itself. A bad graph never ships; a missing one is fine.</p>
      </section>

      <section className="bt-arch sheet">
        <h2>Under the hood</h2>
        <div className="bt-stack">
          <div className="bt-layer">
            <b>Web</b>
            <span>React + TypeScript + Vite on GitHub Pages. Graphs computed in the browser with mathjs.</span>
          </div>
          <div className="bt-layer">
            <b>API</b>
            <span>FastAPI on a Vultr server behind Caddy, with per-IP rate limits.</span>
          </div>
          <div className="bt-layer">
            <b>AI</b>
            <span>OpenAI Codex wrote new lessons and graded answers under a fixed contract: never hand over the answer, quote the learner, one follow-up. Gemini backed up Ask Onion.</span>
          </div>
        </div>
        <figure className="bt-onion">
          <Shot name="onion" w={760} h={880} alt="Ask Onion: a hint that points back to the screen instead of giving the answer" />
          <figcaption>Ask Onion gave hints, not answers.</figcaption>
        </figure>
        <p className="bt-now">
          <strong>Today the site is fully static.</strong> The AI server is retired, and the demos replay the AI's real, recorded replies to their example answers.
        </p>
      </section>

      <section className="bt-team sheet">
        <h2>Two humans, two AI agents</h2>
        <div className="bt-flow">
          <div className="bt-box">Alex + his agent</div>
          <div className="bt-arrow" aria-hidden="true">⇄</div>
          <div className="bt-box is-ink">One GitHub repo: issues, pull requests, tests on every change</div>
          <div className="bt-arrow" aria-hidden="true">⇄</div>
          <div className="bt-box">Luana + her agent</div>
        </div>
        <p>Each of us ran a Claude Code agent, and the agents wrote most of the code. We made the decisions: the eight-step design from the research, what to build and cut, the look, and every reviewed topic.</p>
      </section>

      <section className="bt-cta sheet">
        <h2>Try it yourself</h2>
        <div className="bt-demos">
          <button className="bt-go" onClick={onHome}>
            Open the app →
          </button>
          {DEMOS.map(([slug, label]) => (
            <button key={slug} onClick={() => onLearn(slug)}>
              ★ {label} demo
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
