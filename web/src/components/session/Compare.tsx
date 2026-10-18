import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import './compare.css'

// "Pull out the structure" (NOTES.md, Sat ~12:15 PM): after the card, a second case that looks
// different but works the same, side by side with the first. Comparing two cases is what makes
// the idea transfer (Gentner, Loewenstein & Thompson 2003). The user names what's shared (a pick,
// plus optional words of their own), then the shared principle shows in ink.
// Shared by every session: coin and positive use it now, birthday can adopt it (#181).

export type CompareCase = {
  /** Small tag over the case, e.g. "case 1: your coin". */
  tag: string
  title: ReactNode
  body: ReactNode
}

export type CompareOption = {
  id: string
  text: string
  /** Exactly one option is right: the shared principle. */
  right?: boolean
  /** One line shown when this option is picked and it's wrong: why it doesn't hold. */
  why?: string
}

export type CompareAnswer = { pick: string; right: boolean; text: string }

export function Compare(p: {
  cases: [CompareCase, CompareCase]
  options: CompareOption[]
  /** The shared principle, shown in ink once answered. */
  principle: ReactNode
  /** A line under the principle tying it back to both cases' numbers. */
  detail?: ReactNode
  question?: string
  onAnswer: (a: CompareAnswer) => void
  /** What comes after answering (a Next button or the end bar). */
  children?: ReactNode
}) {
  const { cases, options, principle, detail, question = "What's the same about how these work?", onAnswer, children } = p
  const [pick, setPick] = useState<string | null>(null)
  const [text, setText] = useState('')
  // No options (a generated round's compare): say it in your own words, then see the shared idea.
  const [shown, setShown] = useState(false)
  const id = useId()
  const shared = useRef<HTMLDivElement>(null)
  const answered = pick != null || shown
  const picked = options.find((o) => o.id === pick)

  const answer = (o: CompareOption) => {
    if (answered) return
    setPick(o.id)
    onAnswer({ pick: o.id, right: !!o.right, text: text.trim() })
  }

  // keys 1-4 pick an option (not while typing in the box)
  useEffect(() => {
    if (answered) return
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      const o = options[Number(e.key) - 1]
      if (o) answer(o)
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  })

  // the principle lands below the options: bring it on screen (it's below the fold on a phone)
  useEffect(() => {
    if (!answered) return
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
    shared.current?.scrollIntoView?.({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' })
  }, [answered])

  return (
    <div className="cmp">
      <div className="cmp-cases">
        {cases.map((c, i) => (
          <div key={i} className={`cmp-case cmp-case-${i + 1}`}>
            <div className="ss-tag">{c.tag}</div>
            <h3 className="cmp-title">{c.title}</h3>
            {c.body}
          </div>
        ))}
      </div>

      <fieldset className="cmp-ask">
        <legend className="cmp-q">{question}</legend>
        <label className="cmp-say" htmlFor={`${id}-say`}>
          In your own words <span>(optional)</span>
        </label>
        <input
          id={`${id}-say`}
          className="cmp-text"
          type="text"
          maxLength={200}
          value={text}
          disabled={answered}
          placeholder="they both…"
          onChange={(e) => setText(e.target.value)}
        />
        {options.length === 0 && (
          <button
            type="button"
            className="cmp-opt cmp-show"
            disabled={answered}
            onClick={() => {
              setShown(true)
              onAnswer({ pick: '', right: true, text: text.trim() })
            }}
          >
            Show the shared idea
          </button>
        )}
        {options.length > 0 && <p className="cmp-then">Then pick the closest:</p>}
        <div className="cmp-opts">
          {options.map((o, i) => {
            const state = !answered ? '' : o.right ? ' right' : o.id === pick ? ' wrong' : ''
            return (
              <button key={o.id} className={'cmp-opt' + state} aria-pressed={pick === o.id} disabled={answered} onClick={() => answer(o)}>
                <span className="cmp-key" aria-hidden="true">{i + 1}</span>
                <span>{o.text}</span>
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className="cmp-shared" ref={shared} aria-live="polite">
        {answered && (
          <>
            {pick != null && <p className="cmp-res">
              {picked?.right ? <span className="cmp-ok">That's it.</span> : <span className="cmp-miss">Not quite.</span>}{' '}
              {!picked?.right && picked?.why}
            </p>}
            {text.trim() && <p className="cmp-yours">You wrote: “{text.trim()}”</p>}
            <div className="cmp-ink">
              <div className="ss-tag">the shared idea</div>
              <p className="cmp-principle">{principle}</p>
              {detail && <p className="cmp-detail">{detail}</p>}
            </div>
            {children}
          </>
        )}
      </div>
    </div>
  )
}
