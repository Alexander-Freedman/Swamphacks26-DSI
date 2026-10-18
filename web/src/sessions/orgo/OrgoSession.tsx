import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { record } from '../../notebook'
import { EndBar, Frame, SessionHead, Title } from '../../components/session/Shell'
import { BuildStep } from './BuildStep'
import { MISTAKES } from './chem'
import { CompareStep } from './CompareStep'
import { CASES, SN2_CASE } from './analysis'
import { DecideStep, PartsStep, SizeStep } from './MechSteps'
import { ContrastStep } from './ContrastStep'
import { MechStep } from './MechStep'
import { MECHS } from './mechs'
import { PeelRun } from './Peel'
import { PushStep } from './PushStep'
import { Thumb } from './Thumb'
import { SECTIONS, type OrgoStep, type OrgoTopic } from './topics'
import { reducedMotion } from './geom'
import './orgo.css'

export const SLUG = 'orgo'
const LABEL: Record<OrgoStep, string> = { build: 'Build', layers: 'Layers', parts: 'Parts', size: 'Size up', decide: 'Mechanism', push: 'Arrows', compare: 'Compare', contrast: 'Contrast' }
// Short captions only: the pictures do the explaining.
const TITLES: Record<OrgoStep, [string, string]> = {
  layers: ['Peel SN2', 'One picture, five layers.'],
  build: ['Build ethanol', 'Ethanol (C₂H₆O) is the alcohol in drinks. Drag atoms onto the paper and connect them until each one has its full set of bonds: carbon 4, oxygen 2, hydrogen 1.'],
  parts: ['Find the parts', 'Every substitution has three players: the nucleophile brings electrons, the substrate carbon receives them, and the leaving group breaks off with its bond’s electrons. Tap each one in HO⁻ + CH₃Br.'],
  size: ['Size them up', 'Three questions decide the mechanism: how strong is the nucleophile, what kind of carbon is it, and does the leaving group leave easily?'],
  decide: ['Pick the mechanism', 'Your answers point to one spot on the chart. Pick the mechanism that belongs there.'],
  push: ['Show how the electrons move', 'Hydroxide (HO⁻) kicks the bromine off CH₃Br and takes its place in one step (SN2). Chemists draw this with curved arrows: each one starts on a pair of electrons and ends where that pair goes. Draw the arrows, then watch the reaction play out.'],
  compare: ['Find the same pattern', 'A new reaction sits next to the one you just did. In both, tap the atom that attacks, the carbon it hits, and the atom that leaves.'],
  contrast: ['SN2 or E2?', 'The same HO⁻ meets two different carbons. For each one, predict whether HO⁻ swaps in (SN2) or pulls off an H (E2), then run both side by side.'],
}
const REMIX: Record<string, string> = {
  'build-ethanol': 'Next: push the electrons in a real mechanism.',
  sn2: 'Next: SN1, E2 and E1, worked out the same way.',
  full: 'Next time: a new molecule, a new nucleophile.',
  sn1: 'Next: E1. Same carbocation, a different ending.',
  e1: 'Next: E2. A strong base skips the carbocation.',
  e2: 'Next: SN1. Weak nucleophile, same crowded carbon.',
  'sn2-vs-e2': 'Next: draw the E2 arrows yourself.',
}
type M = keyof typeof MISTAKES
const SIZE_SUB = (nu: string) => `Three questions decide the mechanism: how strong is the ${nu}, what kind of carbon holds the leaving group, and does the leaving group leave easily?`

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
  if (topic.steps[0] === 'layers') return <PeelRun key={play} slug={SLUG} onTopics={() => setTopic(null)} onDone={onDone} />
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
                  <Thumb topic={t.id} />
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
  const kase = CASES[topic.id] ?? SN2_CASE
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
  // the end bar lands below the picture, so bring it into view: otherwise Finish looks like it did nothing
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!finished) return
    end.current?.scrollIntoView?.({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'center' })
    end.current?.focus({ preventScroll: true })
  }, [finished])
  useEffect(() => {
    if (!finished || saved.current) return
    saved.current = true
    record({ session: SLUG, at: new Date().toISOString(), guess: '', misconception: mistakes[0] ?? null, rematch: null, mistakes, orgoTopic: topic.id })
  }, [finished, mistakes, topic.id])

  // after a step: the next one in this topic, or the end bar if it was the last
  const after = (s: OrgoStep) => () => (at(s) < steps.length ? go(at(s) + 1) : finish())
  const nextLabel = (s: OrgoStep) => (at(s) < steps.length ? `${TITLES[steps[at(s)]][0]} →` : 'Finish ✓')
  const block = (s: OrgoStep, el: ReactNode) => at(s) > 0 && reached >= at(s) && <div hidden={step !== at(s)}>{el}</div>
  const cur = steps[step - 1]
  const [h, sub] = mech && cur === 'push' ? [mech.stages[mechStage].title, mech.stages[mechStage].sub] : cur === 'parts' ? [TITLES.parts[0], kase.partsSub] : cur === 'size' ? [TITLES.size[0], SIZE_SUB(kase.nuWord)] : TITLES[cur]
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
      {block('parts', <PartsStep c={kase} onNext={after('parts')} nextLabel={nextLabel('parts')} />)}
      {block('size', <SizeStep c={kase} onNext={after('size')} nextLabel={nextLabel('size')} onMistake={(m) => caught([m])} />)}
      {block('decide', <DecideStep c={kase} onNext={after('decide')} nextLabel={nextLabel('decide')} onMistake={(m) => caught([m])} />)}
      {block(
        'push',
        mech ? (
          <MechStep mech={mech} onGrade={caught} onNext={after('push')} nextLabel={nextLabel('push')} onStage={setMechStage} />
        ) : (
          <PushStep onGrade={caught} onNext={after('push')} nextLabel={nextLabel('push')} />
        ),
      )}
      {at('compare') > 0 && reached >= at('compare') && (
        <div hidden={step !== at('compare')}>
          <CompareStep onMistake={(m) => caught([m])} onDone={finish} />
        </div>
      )}
      {at('contrast') > 0 && reached >= at('contrast') && (
        <div hidden={step !== at('contrast')}>
          <ContrastStep onMistake={(m) => caught([m])} onDone={finish} />
        </div>
      )}
      {finished && last && (
        <div ref={end} tabIndex={-1} className="og-endwrap">
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
        </div>
      )}
    </Frame>
  )
}
