// On the static site the AI server is retired. A demo topic (one with a script) plays its example
// answers and the AI's real recorded replies to them; any other topic falls back to the built-in check.
import { fillStep, hasScript, isStatic } from './demo'
import './demo.css'

export function DemoBar({ slug }: { slug: string }) {
  if (!isStatic()) return null
  if (!hasScript(slug))
    return (
      <p className="demo-note sheet">
        The live AI is retired, so answers here get a quick built-in check. For the full experience, try a recorded demo from Home.
      </p>
    )
  return (
    <>
      <p className="demo-note sheet">
        <strong>Recorded demo.</strong> The live AI is retired. Use the example answer on any step to see the AI's real feedback to it.
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
