import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { EndBar, Frame, SessionHead, Title } from '../../components/session/Shell'
import { record } from '../../notebook'
import { BIO_MISTAKES, type BioMistake } from './mistakes'
import { CodonsStep, MutateStep, TranscribeStep, TranslateStep } from './Steps'
import { CHAPTERS, type BioStep, type BioTopic } from './topics'
import './biology.css'

export const SLUG = 'biology'
const LABEL: Record<BioStep, string> = { transcribe: 'Copy', codons: 'Codons', translate: 'Protein', mutate: 'Mutations' }
// Each step's title, and one plain sentence: what you're doing and why.
const TITLES: Record<BioStep, [string, string]> = {
  transcribe: ['Copy the gene into RNA', 'A gene is stored as DNA in the nucleus, but proteins are built outside it. So the cell copies the gene into messenger RNA (mRNA). You’re the RNA polymerase: pair an RNA base with each base of the DNA template strand.'],
  codons: ['Read it in threes', 'A ribosome reads the mRNA in groups of bases called codons, and each codon picks one amino acid. Predict how big a codon is, then find where reading starts.'],
  translate: ['Build the protein', 'The ribosome moves along one codon at a time. A tRNA whose anticodon pairs with that codon brings one amino acid. Look up each codon in the table and pick its amino acid.'],
  mutate: ['Change one letter', 'A mutation is a change in the DNA, so the mRNA changes too. Predict what each change does to the protein, then see the old and new proteins side by side.'],
}
const REMIX: Record<string, string> = { 'dna-protein': 'Next time: a different gene, different changes.' }

/** Biology opens on a menu: pick a chapter and a topic. */
export function BiologySession({ onDone }: { onDone: () => void }) {
  const [topic, setTopic] = useState<BioTopic | null>(null)
  // a new key per pick remounts the steps, so every topic starts clean
  const [play, setPlay] = useState(0)
  const start = (t: BioTopic) => {
    setTopic(t)
    setPlay((p) => p + 1)
  }
  if (!topic) return <BioMenu onPick={start} />
  return <BioRun key={play} topic={topic} onTopics={() => setTopic(null)} onDone={onDone} />
}

function BioMenu({ onPick }: { onPick: (t: BioTopic) => void }) {
  const title = useRef<HTMLHeadingElement>(null)
  return (
    <Frame className="bio">
      <div className="ss-head">
        <span className="ss-chip">Biology</span>
      </div>
      <Title h="What do you want to practice?" sub="Pick a chapter, then a topic." headingRef={title} />
      <div className="bio-menu">
        {CHAPTERS.map((c) => (
          <section key={c.id} aria-labelledby={`bio-ch-${c.id}`}>
            <h3 id={`bio-ch-${c.id}`} className="bio-ch-title">{c.title}</h3>
            <p className="bio-ch-blurb">{c.blurb}</p>
            <div className="bio-topics">
              {c.topics.map((t) => (
                <button key={t.id} className="bio-topic" disabled={!t.ready} onClick={() => onPick(t)} aria-describedby={`bio-t-${t.id}`}>
                  <span className="bio-topic-title">{t.title}</span>
                  <span id={`bio-t-${t.id}`} className="bio-topic-blurb">{t.blurb}</span>
                  {!t.ready && <span className="bio-soon">coming next</span>}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Frame>
  )
}

function BioRun({ topic, onTopics, onDone }: { topic: BioTopic; onTopics: () => void; onDone: () => void }) {
  const steps = topic.steps
  const [step, setStep] = useState(1)
  const [reached, setReached] = useState(1)
  const [mistakes, setMistakes] = useState<BioMistake[]>([])
  const [finished, setFinished] = useState(false)
  const saved = useRef(false)
  const go = (n: number) => {
    setStep(n)
    setReached((r) => Math.max(r, n))
  }
  const at = (s: BioStep) => steps.indexOf(s) + 1
  // every named mistake counts once, the first time it shows up
  const caught = useCallback((m: BioMistake) => setMistakes((all) => (all.includes(m) ? all : [...all, m])), [])

  const title = useRef<HTMLHeadingElement>(null)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) return void (first.current = false)
    window.scrollTo?.({ top: 0 })
    title.current?.focus({ preventScroll: true })
  }, [step])

  const end = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!finished) return
    end.current?.scrollIntoView?.({ block: 'center' })
    if (saved.current) return
    saved.current = true
    record({ session: SLUG, at: new Date().toISOString(), guess: '', misconception: mistakes[0] ?? null, rematch: null, mistakes, bioTopic: topic.id })
  }, [finished, mistakes, topic.id])

  const after = (s: BioStep) => () => (at(s) < steps.length ? go(at(s) + 1) : setFinished(true))
  const nextLabel = (s: BioStep) => (at(s) < steps.length ? `${TITLES[steps[at(s)]][0]} →` : 'Finish ✓')
  const block = (s: BioStep, el: ReactNode) => at(s) > 0 && reached >= at(s) && <div hidden={step !== at(s)}>{el}</div>
  const [h, sub] = TITLES[steps[step - 1]]
  const props = (s: BioStep) => ({ onMistake: caught, onNext: after(s), nextLabel: nextLabel(s) })

  return (
    <Frame className="bio">
      <SessionHead chip={`Biology · ${topic.title}`} step={step} total={steps.length} labels={steps.map((s) => LABEL[s])} canGo={(i) => i < reached} onGo={(i) => go(i + 1)} />
      <button className="bio-btn bio-ghost bio-back" onClick={onTopics}>← All biology topics</button>
      <Title h={h} sub={sub} headingRef={title} />
      {/* steps stay mounted so going back keeps what you built */}
      {block('transcribe', <TranscribeStep {...props('transcribe')} />)}
      {block('codons', <CodonsStep {...props('codons')} />)}
      {block('translate', <TranslateStep {...props('translate')} />)}
      {block('mutate', <MutateStep {...props('mutate')} />)}
      {finished && (
        <div ref={end}>
          <EndBar
            caught={null}
            rematch="right"
            line={mistakes.length ? <>Caught: {mistakes.map((m) => `“${BIO_MISTAKES[m].label}”`).join(', ')}.</> : <span className="bio-mastered">✓ mastered</span>}
            remix={REMIX[topic.id] ?? ''}
            onDone={onDone}
          />
        </div>
      )}
    </Frame>
  )
}
