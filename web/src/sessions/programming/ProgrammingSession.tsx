import { useEffect, useMemo, useRef, useState } from 'react'
import { NOTEBOOK_HREF, record } from '../../notebook'
import { Frame, SessionHead, Title } from '../../components/session/Shell'
import { STACK_MISTAKES as MISTAKES, trace, type StackMistake } from './stack'
import { SECTIONS, type ProgStep, type ProgTopic } from './topics'
import './programming.css'

const SLUG = 'programming'


const TITLES: Record<ProgStep, [string, string]> = {
  stack: [
    'Watch the call stack.',
    'A recursive function calls itself. Each call gets a frame on the stack and waits there until the call it made comes back. Step through fact(4) one line at a time.',
  ],
}

/** Programming opens on a chapter menu, so practice is on purpose, not a fixed path. */
export function ProgrammingSession({ onDone }: { onDone: () => void }) {
  const [topic, setTopic] = useState<ProgTopic | null>(null)
  const [play, setPlay] = useState(0)
  const start = (t: ProgTopic) => {
    setTopic(t)
    setPlay((p) => p + 1)
  }
  if (!topic) return <ProgMenu onPick={start} />
  return <ProgRun key={play} topic={topic} onTopics={() => setTopic(null)} onDone={onDone} />
}

function ProgMenu({ onPick }: { onPick: (t: ProgTopic) => void }) {
  const title = useRef<HTMLHeadingElement>(null)
  return (
    <Frame className="prog">
      <div className="ss-head">
        <span className="ss-chip">Programming</span>
      </div>
      <Title h="What do you want to practice?" sub="Pick a chapter, then a topic." headingRef={title} />
      <div className="pg-menu">
        {SECTIONS.map((s) => (
          <section key={s.id} aria-labelledby={`pg-sec-${s.id}`}>
            <h3 id={`pg-sec-${s.id}`} className="pg-sec-title">{s.title}</h3>
            <p className="pg-sec-blurb">{s.blurb}</p>
            <div className="pg-topics">
              {s.topics.map((t) => (
                <button key={t.id} className="pg-topic" disabled={!t.ready} onClick={() => onPick(t)} aria-describedby={`pg-t-${t.id}`}>
                  <span className="pg-topic-title">{t.title}</span>
                  <span id={`pg-t-${t.id}`} className="pg-topic-blurb">{t.blurb}</span>
                  {!t.ready && <span className="pg-soon">coming next</span>}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Frame>
  )
}

function ProgRun({ topic, onTopics, onDone }: { topic: ProgTopic; onTopics: () => void; onDone: () => void }) {
  const title = useRef<HTMLHeadingElement>(null)
  const [h, sub] = TITLES[topic.steps[0]]
  return (
    <Frame className="prog">
      <SessionHead chip={`Programming · ${topic.title}`} step={1} total={topic.steps.length} />
      <button className="pg-btn pg-ghost pg-back" onClick={onTopics}>← All programming topics</button>
      <Title h={h} sub={sub} headingRef={title} />
      <CallStackStep topic={topic.id} onDone={onDone} />
    </Frame>
  )
}

/* ---------- recursion: the call stack ---------- */

const START = 4
const CODE = ['function fact(n) {', '  if (n <= 1) return 1', '  return n * fact(n - 1)', '}']
const OVERFLOW = 5 // extra frames drawn past fact(1) when the base case is gone

type Phase = 'depth' | 'run' | 'which' | 'run2' | 'overflow' | 'crash' | 'done'
type Q = { ask: string; choices: { id: string; text: string }[]; answer: string; traps: Partial<Record<string, StackMistake>>; why: string }

const QS: Record<'depth' | 'which' | 'overflow', Q> = {
  depth: {
    ask: 'Before you run it: when fact(4) is at its busiest, how many frames are on the stack at the same time?',
    choices: [
      { id: '1', text: '1: each call replaces the last one' },
      { id: '3', text: '3' },
      { id: '4', text: '4' },
      { id: '24', text: '24: one per step of the multiplication' },
    ],
    answer: '4',
    traps: { '1': 'stack-depth-off', '3': 'stack-depth-off', '24': 'stack-depth-off' },
    why: 'fact(4) calls fact(3), which calls fact(2), which calls fact(1), and none of them can finish until the one above returns. Step through and watch them stack up.',
  },
  which: {
    ask: 'fact(1) just returned 1. Which call gets to finish next?',
    choices: [
      { id: 'f4', text: 'fact(4), because it was called first' },
      { id: 'f2', text: 'fact(2), the frame right below' },
      { id: 'all', text: 'All of them at once' },
    ],
    answer: 'f2',
    traps: { f4: 'returns-before-calls', all: 'returns-before-calls' },
    why: 'Last in, first out: the value goes to the frame directly below, fact(2), which was waiting for exactly that. Step on and watch the stack shrink from the top.',
  },
  overflow: {
    ask: 'Last one: what happens if you delete line 2, the base case?',
    choices: [
      { id: 'zero', text: 'fact(4) returns 0' },
      { id: 'one', text: 'It still returns 24' },
      { id: 'crash', text: 'It keeps calling itself until the stack runs out of room' },
    ],
    answer: 'crash',
    traps: { zero: 'base-case-optional', one: 'base-case-optional' },
    why: 'Nothing tells it to stop: fact(1) calls fact(0), which calls fact(−1), and so on. Watch.',
  },
}

function CallStackStep({ topic, onDone }: { topic: string; onDone: () => void }) {
  const moments = useMemo(() => trace(START), [])
  const [phase, setPhase] = useState<Phase>('depth')
  const [i, setI] = useState(0)
  const [wrong, setWrong] = useState<string[]>([])
  const [note, setNote] = useState<{ label: string; line: string } | null>(null)
  const [right, setRight] = useState<string | null>(null)
  const [mistakes, setMistakes] = useState<StackMistake[]>([])
  const [extra, setExtra] = useState(0)
  const m = moments[i]
  const base = START // the moment fact(1) returns
  const q = phase === 'depth' || phase === 'which' || phase === 'overflow' ? QS[phase] : null

  const answer = (id: string) => {
    if (!q) return
    if (id === q.answer) {
      setRight(q.why)
      setNote(null)
      setWrong([])
      setPhase(phase === 'depth' ? 'run' : phase === 'which' ? 'run2' : 'crash')
      return
    }
    setWrong((w) => [...w, id])
    const t = q.traps[id]
    if (t) {
      setMistakes((all) => (all.includes(t) ? all : [...all, t]))
      setNote(MISTAKES[t])
    } else setNote({ label: 'Not quite', line: 'Try another one.' })
  }

  const step = () => {
    const n = i + 1
    setI(n)
    setRight(null)
    if (phase === 'run' && n === base) setPhase('which')
    if (phase === 'run2' && n === moments.length - 1) setPhase('overflow')
  }

  // the crash: frames keep piling on past fact(1), one at a time
  useEffect(() => {
    if (phase !== 'crash') return
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setExtra(OVERFLOW)
      setPhase('done')
      return
    }
    const id = setInterval(() => {
      setExtra((e) => {
        if (e + 1 >= OVERFLOW) {
          clearInterval(id)
          setPhase('done')
        }
        return e + 1
      })
    }, 380)
    return () => clearInterval(id)
  }, [phase])

  const saved = useRef(false)
  useEffect(() => {
    if (phase !== 'done' || saved.current) return
    saved.current = true
    record({ session: SLUG, at: new Date().toISOString(), guess: '', misconception: mistakes[0] ?? null, rematch: null, mistakes, progTopic: topic })
  }, [phase, mistakes, topic])

  // what the stack shows: the trace, or during the crash the frames from fact(4) down past fact(1)
  const crashing = phase === 'crash' || phase === 'done'
  const frames = crashing
    ? [...Array.from({ length: START }, (_, k) => ({ n: START - k, value: null as number | null })), ...Array.from({ length: extra }, (_, k) => ({ n: -k, value: null as number | null }))]
    : m.frames
  const line = crashing ? 3 : m.line
  const running = phase === 'run' || phase === 'run2'

  return (
    <section className="pg-stack-step">
      <div className="pg-two">
        <div className="pg-card">
          <div className="pg-k">the code</div>
          <pre className="pg-code" aria-label="the factorial function">
            {CODE.map((c, k) => {
              const gone = crashing && k === 1
              return (
                <span key={k} className={'pg-line' + (k + 1 === line && phase !== 'depth' ? ' on' : '') + (gone ? ' gone' : '')}>
                  <i aria-hidden="true">{k + 1}</i>
                  {c}
                  {'\n'}
                </span>
              )
            })}
          </pre>
          <p className="pg-say" aria-live="polite">
            {phase === 'depth' ? 'Nothing has run yet. The stack is empty.' : crashing ? (phase === 'done' ? 'Stack overflow: the program crashes.' : 'No base case, so the calls never stop…') : m.say}
          </p>
          {running && (
            <button className="pg-btn pg-go" onClick={step}>
              Run the next line ▶
            </button>
          )}
        </div>
        <div className="pg-card pg-stackcard">
          <div className="pg-k">the call stack · newest on top</div>
          <ol className={'pg-stack' + (crashing ? ' crash' : '')} aria-label={`call stack, ${phase === 'depth' ? 0 : frames.length} frames`}>
            {phase !== 'depth' &&
              frames.map((f, k) => {
                const top = k === frames.length - 1
                return (
                  <li key={`${f.n}-${k}`} className={'pg-frame' + (top ? ' top' : '') + (f.value != null ? ' done' : '') + (crashing && f.n <= 0 ? ' bad' : '')}>
                    <b>fact({f.n})</b>
                    <span>{f.value != null ? `returns ${f.value}` : top && !crashing ? (f.n <= 1 ? 'base case' : 'running') : `waiting for fact(${f.n - 1})`}</span>
                  </li>
                )
              })}
          </ol>
          {phase === 'done' && <div className="pg-overflow" role="status">Stack overflow</div>}
          {!crashing && m.handing != null && phase !== 'depth' && <p className="pg-hand">↓ hands back <b>{m.handing}</b></p>}
        </div>
      </div>

      {q && (
        <div className="pg-card pg-q">
          <p className="pg-ask">{q.ask}</p>
          <div className="pg-choices" role="group" aria-label="your answer">
            {q.choices.map((c) => (
              <button key={c.id} className={'pg-choice' + (wrong.includes(c.id) ? ' wrong' : '')} disabled={wrong.includes(c.id)} onClick={() => answer(c.id)}>
                {wrong.includes(c.id) && <span className="pg-mark" aria-hidden="true">✗</span>}
                {c.text}
              </button>
            ))}
          </div>
          {note && (
            <p className="pg-wrong" role="status">
              <b>✗ Not quite.</b> <span className="pg-mname">{note.label}</span> {note.line}
            </p>
          )}
        </div>
      )}
      {right && (
        <p className="pg-correct" role="status">
          <span className="pg-check" aria-hidden="true">✓</span>
          <span><b>Correct!</b> {right}</span>
        </p>
      )}
      {phase === 'done' && (
        <>
          <p className="pg-rule">
            <span>Each call gets a <span className="pg-hl">frame</span> on the stack.</span>
            <span>The newest frame finishes first: <span className="pg-hl">last in, first out</span>.</span>
            <span>The <span className="pg-hl">base case</span> is what makes it stop.</span>
          </p>
          <div className="pg-end" role="status">
            <p>
              <b>Saved to your notebook.</b>{' '}
              {mistakes.length ? `Caught: ${mistakes.map((k) => `“${MISTAKES[k].label}”`).join(', ')}.` : <span className="pg-mastered">✓ mastered</span>} Next: why fib(n) is slow.
            </p>
            <div className="pg-endact">
              <a className="pg-nblink" href={NOTEBOOK_HREF}>Open notebook</a>
              <button className="pg-btn" onClick={onDone}>Done</button>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
