// The Learn session shell: loads the topic, holds session state, walks the eight stages.
// Each stage is its own file (StageProps from ./types), so screens can be built in parallel.
import { useEffect, useRef, useState, type ComponentType } from 'react'
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
import { summaryFor } from './summary'
import { learnHelp } from './learnHelp'
import { useReportSpot } from '../components/session/helpSpot'
import { STEP_NAME } from './WhyPane'
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
  const [opened, setOpened] = useState<Partial<Record<Stage, boolean>>>({})
  // Ask Onion (in the top bar) answers about this topic and this step.
  useReportSpot(
    topic
      ? { step: STAGES.indexOf(state.stage) + 1, total: STAGES.length, label: STEP_NAME[state.stage], chip: `Learn · ${topic.topic}`, layer: learnHelp(topic, state) }
      : {},
  )
  const nowCard = useRef<HTMLLIElement>(null)
  const firstStage = useRef(state.stage)
  // A new step lands below the last one: bring it into view (not on first load).
  useEffect(() => {
    if (state.stage === firstStage.current) return
    nowCard.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
  }, [state.stage])

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
  const noop = () => {}
  // Steps you've reached stay on the page, stacked down; only the newest one is live.
  const reached = STAGES.slice(0, idx + 1)

  return (
    <div className="learn" data-stage={state.stage}>
      <aside className="learn-why" aria-label="Why this step">
        {WhyPaneComponent ? <WhyPaneComponent stage={state.stage} /> : <WhyFallback stage={state.stage} />}
      </aside>
      <div className="learn-main">
        <div className="learn-bar sheet">
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
        <ol className="learn-stack">
          {reached.map((st, i) => {
            const Screen = customScreen(slug, st) ?? SCREENS[st]
            const past = i < idx
            const open = past && !!opened[st]
            return (
              <li key={st} className={`learn-card sheet ${past ? 'is-past' : 'is-now'}${open ? ' is-open' : ''}`} ref={past ? undefined : nowCard}>
                {past && (
                  <button className="learn-card-head" aria-expanded={open} onClick={() => setOpened((o) => ({ ...o, [st]: !o[st] }))}>
                    <span className="learn-card-num" aria-hidden="true">✓</span>
                    <span className="learn-card-name">{STEP_NAME[st]}</span>
                    <span className="learn-card-sum">{summaryFor(st, state, topic)}</span>
                    <span className="learn-card-caret" aria-hidden="true">{open ? '▴' : '▾'}</span>
                  </button>
                )}
                <div className="learn-card-body" hidden={past && !open} inert={past || undefined}>
                  <Screen topic={topic} state={state} update={past ? noop : update} next={past ? noop : next} api={api} />
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
