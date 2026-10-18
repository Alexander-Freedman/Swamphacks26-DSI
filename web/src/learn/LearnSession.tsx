// The Learn session shell: loads the topic, holds session state, walks the eight stages.
// Each stage is its own file (StageProps from ./types), so screens can be built in parallel.
import { useEffect, useState, type ComponentType } from 'react'
import { learnApi } from '../learnApi'
import { initialState } from './state'
import { STAGES, type LearnApi, type LearnState, type Stage, type StageProps, type Topic } from './types'
import why from './why.json'
import { GuessScreen } from './GuessScreen'
import { AnchorScreen } from './AnchorScreen'
import { ContrastScreen } from './ContrastScreen'
import { StressScreen } from './stress/StressScreen'
import { DrawScreen } from './draw/DrawScreen'
import { NeighborScreen } from './NeighborScreen'
import { TransferScreen } from './TransferScreen'
import { DoneScreen } from './DoneScreen'
import { customScreen } from './custom/registry'
import './learn.css'

const SCREENS: Record<Stage, ComponentType<StageProps>> = {
  guess: GuessScreen,
  anchor: AnchorScreen,
  contrast: ContrastScreen,
  stress: StressScreen,
  draw: DrawScreen,
  neighbor: NeighborScreen,
  transfer: TransferScreen,
  done: DoneScreen,
}

// The why-pane is owned by another file; mount it only once it exists.
type WhyPaneModule = { WhyPane?: ComponentType<{ stage: Stage }>; default?: ComponentType<{ stage: Stage }> }
const whyPaneModules = import.meta.glob<WhyPaneModule>('./WhyPane.tsx', { eager: true })
const whyPaneMod = Object.values(whyPaneModules)[0]
const WhyPaneComponent = whyPaneMod?.WhyPane ?? whyPaneMod?.default

function WhyFallback({ stage }: { stage: Stage }) {
  const w = (why as Record<string, { doing: string; why: string; source: string }>)[stage]
  if (!w) return null
  return (
    <details className="learn-why-fallback" open>
      <summary>Why this step</summary>
      <p><strong>{w.doing}</strong></p>
      <p>{w.why}</p>
      <p className="learn-why-source">{w.source}</p>
    </details>
  )
}

export function LearnSession({
  slug,
  onDone,
  api = learnApi,
  initial,
}: {
  slug: string
  onDone: () => void
  api?: LearnApi
  /** Start part-way through (tests, demo links); defaults to a fresh session at Guess. */
  initial?: Partial<LearnState>
}) {
  const [topic, setTopic] = useState<Topic | null | undefined>(undefined)
  const [state, setState] = useState<LearnState>(() => ({ ...initialState(), ...initial }) as LearnState)

  useEffect(() => {
    // The App keys this component by slug, so a new slug is a fresh mount (no reset needed here).
    let live = true
    api.getTopic(slug).then(
      (t) => live && setTopic(t),
      () => live && setTopic(null),
    )
    return () => {
      live = false
    }
  }, [slug, api])

  if (topic === undefined) return <p className="sheet progress" role="status">Opening the topic…</p>
  if (topic === null)
    return (
      <div className="sheet learn-missing">
        <p>That topic isn't ready yet.</p>
        <button onClick={onDone}>Back to Home</button>
      </div>
    )

  const idx = STAGES.indexOf(state.stage)
  const update = (partial: Partial<LearnState>) => setState((s) => ({ ...s, ...partial }))
  const next = () => {
    if (state.stage === 'done') return onDone()
    setState((s) => ({ ...s, stage: STAGES[Math.min(STAGES.indexOf(s.stage) + 1, STAGES.length - 1)] }))
  }
  const back = () => (idx === 0 ? onDone() : setState((s) => ({ ...s, stage: STAGES[STAGES.indexOf(s.stage) - 1] })))
  const Screen = customScreen(slug, state.stage) ?? SCREENS[state.stage]

  return (
    <div className="learn" data-stage={state.stage}>
      <div className="learn-main sheet">
        <div className="learn-bar">
          <button className="learn-back" onClick={back}>Back</button>
          <span className="learn-topic">
            {topic.topic}
            {!topic.checked && <span className="learn-auto"> · auto-checked</span>}
          </span>
          <ol className="learn-dots" aria-label={`Step ${idx + 1} of ${STAGES.length}`}>
            {STAGES.map((s, i) => (
              <li key={s} className={i < idx ? 'is-past' : i === idx ? 'is-now' : ''} aria-current={i === idx ? 'step' : undefined} />
            ))}
          </ol>
        </div>
        <Screen key={state.stage} topic={topic} state={state} update={update} next={next} api={api} />
      </div>
      <aside className="learn-why" aria-label="Why this step">
        {WhyPaneComponent ? <WhyPaneComponent stage={state.stage} /> : <WhyFallback stage={state.stage} />}
      </aside>
    </div>
  )
}
