import { useCallback, useEffect, useRef, useState } from 'react'
import { record } from '../../notebook'
import { EndBar, Frame, SessionHead, Title } from '../../components/session/Shell'
import { BuildStep } from './BuildStep'
import { MISTAKES } from './chem'
import { CompareStep } from './CompareStep'
import { PushStep } from './PushStep'
import './orgo.css'

export const SLUG = 'orgo'
const STEPS = ['Build', 'Push', 'Compare'] as const
// Short captions only: the pictures do the explaining.
const TITLES: [string, string][] = [
  ['Build ethanol', 'Drag atoms onto the paper and bond them until every slot is full.'],
  ['Push the electrons', 'Draw the curved arrows for HO⁻ + CH₃Br. Then watch it happen.'],
  ['Same pattern', 'A new reaction. Find the same three parts.'],
]
type M = keyof typeof MISTAKES

export function OrgoSession({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(1)
  const [reached, setReached] = useState(1)
  const [mistakes, setMistakes] = useState<M[]>([])
  const [finished, setFinished] = useState(false)
  const saved = useRef(false)
  const go = (n: number) => {
    setStep(n)
    setReached((r) => Math.max(r, n))
  }
  // every named mistake counts once, the first time it shows up
  const caught = useCallback((ms: M[]) => setMistakes((all) => [...all, ...ms.filter((m) => !all.includes(m))]), [])

  const title = useRef<HTMLHeadingElement>(null)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) return void (first.current = false)
    window.scrollTo?.({ top: 0 })
    title.current?.focus({ preventScroll: true })
  }, [step])

  const finish = useCallback(() => setFinished(true), [])
  useEffect(() => {
    if (!finished || saved.current) return
    saved.current = true
    record({ session: SLUG, at: new Date().toISOString(), guess: '', misconception: mistakes[0] ?? null, rematch: null, mistakes })
  }, [finished, mistakes])

  const [h, sub] = TITLES[step - 1]
  return (
    <Frame className="orgo">
      <SessionHead chip="Orgo" step={step} total={STEPS.length} labels={STEPS} canGo={(i) => i < reached} onGo={(i) => go(i + 1)} />
      <Title h={h} sub={sub} headingRef={title} />
      {/* steps stay mounted so going back keeps your molecule and your arrows */}
      <div hidden={step !== 1}>
        <BuildStep onCheck={caught} onNext={() => go(2)} />
      </div>
      {reached >= 2 && (
        <div hidden={step !== 2}>
          <PushStep onGrade={caught} onNext={() => go(3)} />
        </div>
      )}
      {reached >= 3 && (
        <div hidden={step !== 3}>
          <CompareStep onMistake={(m) => caught([m])} onDone={finish} />
          {finished && (
            <EndBar
              caught={null}
              rematch="right"
              line={
                mistakes.length ? (
                  <>Caught: {mistakes.map((m) => `“${MISTAKES[m].label}”`).join(', ')}.</>
                ) : (
                  <span className="og-mastered">✓ mastered</span>
                )
              }
              remix="Next time: a new molecule, a new nucleophile."
              onDone={onDone}
            />
          )}
        </div>
      )}
    </Frame>
  )
}
