// On the static site the AI server is retired. A demo topic (one with a script) plays its example
// answers and the AI's real recorded replies to them; any other topic falls back to the built-in check.
import { fillStep, hasScript, isStatic } from './demo'
import './demo.css'

const DEMOS: [string, string][] = [
  ['derivative', 'Calculus'],
  ['sn2-reaction', 'Organic chemistry'],
  ['base-rates-and-false-positives', 'Base rates'],
]

export function DemoBar({ slug }: { slug: string }) {
  if (!isStatic()) return null
  if (!hasScript(slug))
    return (
      <p className="demo-note sheet">
        <strong>No AI on this lesson.</strong> Our AI grader is retired, so your answers get a quick keyword check against our answer key, not
        real feedback. For the AI's real feedback, try a recorded demo:{' '}
        {DEMOS.map(([slug, label], i) => (
          <span key={slug}>
            {i ? (i === DEMOS.length - 1 ? ' or ' : ', ') : ''}
            <a href={`${import.meta.env.BASE_URL}?learn=${slug}`}>{label}</a>
          </span>
        ))}
        .
      </p>
    )
  return (
    <>
      <p className="demo-note sheet">
        <strong>Recorded AI demo.</strong> On each step, press <b>Use the example answer</b> (bottom right) to see the real feedback our AI gave
        it. If you write your own answer instead, you get a quick keyword check, not AI feedback.
      </p>
      <button
        className="demo-fill"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => fillStep()}
        title="Shift+W also works"
      >
        ✎ Use the example answer
      </button>
    </>
  )
}
