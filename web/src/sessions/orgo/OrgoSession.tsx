import { useCallback, useEffect, useRef, useState } from 'react'
import { record } from '../../notebook'
import { EndBar, Frame, SessionHead, Title } from '../../components/session/Shell'
import { BuildStep } from './BuildStep'
import { MISTAKES } from './chem'
import { CompareStep } from './CompareStep'
import { MechStep } from './MechStep'
import { MECHS } from './mechs'
import { PushStep } from './PushStep'
import { SECTIONS, type OrgoStep, type OrgoTopic } from './topics'
import './orgo.css'

export const SLUG = 'orgo'
const LABEL: Record<OrgoStep, string> = { build: 'Build', push: 'Push', compare: 'Compare' }
// Short captions only: the pictures do the explaining.
const TITLES: Record<OrgoStep, [string, string]> = {
  build: ['Build ethanol', 'Drag atoms onto the paper and bond them until every slot is full.'],
  push: ['Push the electrons', 'Draw the curved arrows for HO⁻ + CH₃Br. Then watch it happen.'],
  compare: ['Same pattern', 'A new reaction. Find the same three parts.'],
}
const REMIX: Record<string, string> = {
  'build-ethanol': 'Next: push the electrons in a real mechanism.',
  sn2: 'Next time: a new nucleophile, a new leaving group.',
  full: 'Next time: a new molecule, a new nucleophile.',
  sn1: 'Next: E1. Same carbocation, a different ending.',
  e1: 'Next: E2. A strong base skips the carbocation.',
  e2: 'Next: SN1. Weak nucleophile, same crowded carbon.',
}
type M = keyof typeof MISTAKES

/** Orgo opens on a menu: pick a section and a topic, so practice is on purpose, not a fixed path. */
export function OrgoSession({ onDone }: { onDone: () => void }) {
  const [topic, setTopic] = useState<OrgoTopic | null>(null)
  // a new key per pick remounts the steps, so every topic starts clean
  const [play, setPlay] = useState(0)
  const start = (t: OrgoTopic) => {
    setTopic(t)
    setPlay((p) => p + 1)
  }
  if (!topic) return <OrgoMenu onPick={start} />
  return <OrgoTopicRun key={play} topic={topic} onTopics={() => setTopic(null)} onDone={onDone} />
}

function OrgoMenu({ onPick }: { onPick: (t: OrgoTopic) => void }) {
  const title = useRef<HTMLHeadingElement>(null)
  return (
    <Frame className="orgo">
      <div className="ss-head">
        <span className="ss-chip">Orgo</span>
      </div>
      <Title h="What do you want to practice?" sub="Pick a section, then a topic." headingRef={title} />
      <div className="og-menu">
        {SECTIONS.map((s) => (
          <section key={s.id} className="og-section" aria-labelledby={`og-sec-${s.id}`}>
            <h3 id={`og-sec-${s.id}`} className="og-sec-title">{s.title}</h3>
            <p className="og-sec-blurb">{s.blurb}</p>
            <div className="og-topics">
              {s.topics.map((t) => (
                <button key={t.id} className="og-topic" disabled={!t.ready} onClick={() => onPick(t)} aria-describedby={`og-t-${t.id}`}>
                  <span className="og-topic-title">{t.title}</span>
                  <span id={`og-t-${t.id}`} className="og-topic-blurb">{t.blurb}</span>
                  {!t.ready && <span className="og-soon">coming next</span>}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Frame>
  )
}

function OrgoTopicRun({ topic, onTopics, onDone }: { topic: OrgoTopic; onTopics: () => void; onDone: () => void }) {
  const steps = topic.steps
  const [step, setStep] = useState(1)
  const [reached, setReached] = useState(1)
  const [mistakes, setMistakes] = useState<M[]>([])
  const [finished, setFinished] = useState(false)
  const mech = topic.mech ? MECHS[topic.mech] : null
  const [mechStage, setMechStage] = useState(0)
  const saved = useRef(false)
  const go = (n: number) => {
    setStep(n)
    setReached((r) => Math.max(r, n))
  }
  const at = (s: OrgoStep) => steps.indexOf(s) + 1 // 0 when this topic skips the step
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
    record({ session: SLUG, at: new Date().toISOString(), guess: '', misconception: mistakes[0] ?? null, rematch: null, mistakes, orgoTopic: topic.id })
  }, [finished, mistakes, topic.id])

  // after a step: the next one in this topic, or the end bar if it was the last
  const after = (s: OrgoStep) => () => (at(s) < steps.length ? go(at(s) + 1) : finish())
  const nextLabel = (s: OrgoStep) => (at(s) < steps.length ? `${TITLES[steps[at(s)]][0]} →` : 'Finish ✓')
  const [h, sub] = mech && steps[step - 1] === 'push' ? [mech.stages[mechStage].title, mech.stages[mechStage].sub] : TITLES[steps[step - 1]]
  const last = step === steps.length

  return (
    <Frame className="orgo">
      <SessionHead chip={`Orgo · ${topic.title}`} step={step} total={steps.length} labels={steps.map((s) => LABEL[s])} canGo={(i) => i < reached} onGo={(i) => go(i + 1)} />
      <button className="og-btn og-ghost og-back" onClick={onTopics}>← All orgo topics</button>
      <Title h={h} sub={sub} headingRef={title} />
      {/* steps stay mounted so going back keeps your molecule and your arrows */}
      {at('build') > 0 && reached >= at('build') && (
        <div hidden={step !== at('build')}>
          <BuildStep onCheck={caught} onNext={after('build')} nextLabel={nextLabel('build')} />
        </div>
      )}
      {at('push') > 0 && reached >= at('push') && (
        <div hidden={step !== at('push')}>
          {mech ? (
            <MechStep mech={mech} onGrade={caught} onNext={after('push')} nextLabel={nextLabel('push')} onStage={setMechStage} />
          ) : (
            <PushStep onGrade={caught} onNext={after('push')} />
          )}
        </div>
      )}
      {at('compare') > 0 && reached >= at('compare') && (
        <div hidden={step !== at('compare')}>
          <CompareStep onMistake={(m) => caught([m])} onDone={finish} />
        </div>
      )}
      {finished && last && (
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
          remix={REMIX[topic.id] ?? ''}
          onDone={onDone}
        />
      )}
    </Frame>
  )
}
