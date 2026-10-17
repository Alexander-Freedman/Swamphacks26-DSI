import { useEffect, useRef, useState } from 'react'
import { record } from '../../notebook'
import { EndBar, Frame, SessionHead, Title } from '../../components/session/Shell'
import { AreaStep } from './AreaStep'
import { CompareStep } from './CompareStep'
import { classifyArea, MISTAKES, type AreaMistake } from './math'
import { SketchStep, type SketchResult } from './SketchStep'
import { SlopeStep } from './SlopeStep'
import './calculus.css'

export const SLUG = 'calculus'
const STEPS = ['Slope', 'Sketch', 'Area', 'Same idea'] as const
// Short captions only: the visuals do the explaining.
const TITLES: [string, string][] = [
  ['Slope you can feel', 'Drag the dot. Shrink h until the two lines meet.'],
  ['Sketch the slope', 'Draw how steep the top curve is at each x.'],
  ['Fill the area', 'Guess the area first. Then fill it with rectangles.'],
  ['Same idea, a moving car', 'Drive it. Then tap what’s the same.'],
]

export function CalculusSession({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(1)
  const [reached, setReached] = useState(1)
  const [sketch, setSketch] = useState<SketchResult | null>(null)
  const [guess, setGuess] = useState<number | null>(null)
  const [area, setArea] = useState<AreaMistake | undefined>(undefined)
  const [shapeMistake, setShapeMistake] = useState<boolean | null>(null)
  const saved = useRef(false)
  const go = (n: number) => {
    setStep(n)
    setReached((r) => Math.max(r, n))
  }

  const title = useRef<HTMLHeadingElement>(null)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) return void (first.current = false)
    window.scrollTo?.({ top: 0 })
    title.current?.focus({ preventScroll: true })
  }, [step])

  const mistakes = [sketch?.mistake ?? null, area ?? null, shapeMistake ? 'same-shape' : null].filter((m): m is keyof typeof MISTAKES => !!m)
  const finish = (wrongFirst: boolean) => {
    setShapeMistake(wrongFirst)
    if (saved.current) return
    saved.current = true
    const all = [sketch?.mistake ?? null, area ?? null, wrongFirst ? 'same-shape' : null].filter(Boolean) as string[]
    record({
      session: SLUG,
      at: new Date().toISOString(),
      guess: guess ?? '',
      misconception: all[0] ?? null,
      rematch: null,
      mistakes: all,
      sketchMistake: sketch?.mistake ?? null,
      areaGuess: guess,
      areaMistake: area ?? null,
    })
  }

  const [h, sub] = TITLES[step - 1]
  return (
    <Frame className="calc">
      <SessionHead chip="Calculus" step={step} total={STEPS.length} labels={STEPS} canGo={(i) => i < reached} onGo={(i) => go(i + 1)} />
      <Title h={h} sub={sub} headingRef={title} />

      {step === 1 && <SlopeStep onNext={() => go(2)} />}
      {step === 2 && <SketchStep result={sketch} onReveal={setSketch} onNext={() => go(3)} />}
      {step === 3 && (
        <AreaStep
          guess={guess}
          setGuess={setGuess}
          mistake={area}
          onFill={() => setArea(classifyArea(guess ?? 0))}
          onNext={() => go(4)}
        />
      )}
      {step === 4 && (
        <>
          <CompareStep done={shapeMistake !== null} onPicked={finish} />
          {shapeMistake !== null && (
            <EndBar
              caught={null}
              rematch="right"
              line={
                mistakes.length ? (
                  <>Caught: {mistakes.map((m) => `“${MISTAKES[m].label}”`).join(', ')}.</>
                ) : (
                  <span className="calc-mastered" aria-label="mastered">✓ mastered</span>
                )
              }
              remix="Come back tomorrow: a new curve, same two ideas."
              onDone={onDone}
            />
          )}
        </>
      )}
    </Frame>
  )
}
