import { useEffect, useMemo, useRef, useState } from 'react'
import { record } from '../../notebook'
import { EndBar, Frame, SessionHead, Title } from '../../components/session/Shell'
import { BackToTopics, Choices, SubjectMenu, Verdict } from '../../components/subject/SubjectMenu'
import { BIN, BINS, CLT_MISTAKES, histogram, popMean, PROBS, sampleMeans, spread, WAITS, type CltMistake } from './clt'
import { SECTIONS, type StatTopic } from './topics'
import './statistics.css'

/** Statistics opens on a chapter menu, so practice is on purpose, not a fixed path. */
export function StatisticsSession({ onDone }: { onDone: () => void }) {
  const [topic, setTopic] = useState<StatTopic | null>(null)
  const [play, setPlay] = useState(0)
  const pick = (t: StatTopic) => {
    setTopic(t)
    setPlay((p) => p + 1)
  }
  if (!topic) return <SubjectMenu subject="Statistics" className="stats" sections={SECTIONS} onPick={pick} />
  return <CltRun key={play} topic={topic} onTopics={() => setTopic(null)} onDone={onDone} />
}

/* ---------- sampling: averages pile into a bell curve ---------- */

const COUNT = 300
const FIRST_N = 10
const SECOND_N = 40

type Phase = 'shape' | 'pile' | 'grow' | 'explore' | 'done'

const Q1 = {
  ask: `Pick ${FIRST_N} people at random and average their waits. Do that ${COUNT} times and pile up the averages. What shape will the pile make?`,
  choices: [
    { id: 'same' as const, text: 'Lopsided, like the waits', sub: 'tall on the left, long tail' },
    { id: 'bell' as const, text: 'A hump in the middle', sub: 'like a bell' },
    { id: 'flat' as const, text: 'Flat', sub: 'every average equally likely' },
  ],
  answer: 'bell',
  traps: { same: 'averages-keep-shape', flat: 'averages-flat' } as Partial<Record<string, CltMistake>>,
  why: 'The long and short waits cancel out inside each average, so most averages land near the true mean. Watch the pile build.',
}
const Q2 = {
  ask: `Now average ${SECOND_N} people each time instead of ${FIRST_N}. What happens to the pile?`,
  choices: [
    { id: 'narrow' as const, text: 'It gets narrower', sub: 'averages hug the middle' },
    { id: 'wide' as const, text: 'It gets wider', sub: 'more people, more variety' },
    { id: 'same' as const, text: 'Nothing changes', sub: 'same people, same pile' },
  ],
  answer: 'narrow',
  traps: { wide: 'bigger-sample-wider' } as Partial<Record<string, CltMistake>>,
  why: 'More draws per average means more canceling out, so the averages crowd the true mean. Four times the people, half the spread.',
}

function CltRun({ topic, onTopics, onDone }: { topic: StatTopic; onTopics: () => void; onDone: () => void }) {
  const title = useRef<HTMLHeadingElement>(null)
  const [phase, setPhase] = useState<Phase>('shape')
  const [n, setN] = useState(FIRST_N)
  const [shown, setShown] = useState(0)
  const [wrong, setWrong] = useState<string[]>([])
  const [verdict, setVerdict] = useState<{ right: boolean; label?: string; line: string } | null>(null)
  const [mistakes, setMistakes] = useState<CltMistake[]>([])
  const means = useMemo(() => sampleMeans(n, COUNT), [n])
  const q = phase === 'shape' ? Q1 : phase === 'grow' ? Q2 : null

  const reduce = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  // drop the averages onto the pile a few at a time
  const [dropping, setDropping] = useState(false)
  const drop = () => {
    if (reduce()) return setShown(COUNT)
    setShown(0)
    setDropping(true)
  }
  useEffect(() => {
    if (!dropping) return
    const id = setInterval(() => {
      setShown((s) => {
        const next = Math.min(COUNT, s + 10)
        if (next >= COUNT) {
          clearInterval(id)
          setDropping(false)
        }
        return next
      })
    }, 40)
    return () => clearInterval(id)
  }, [dropping])
  // once the first pile is complete, ask about bigger samples
  const settledFirst = phase === 'pile' && shown >= COUNT && !dropping

  const answer = (id: string) => {
    if (!q) return
    if (id === q.answer) {
      setWrong([])
      setVerdict({ right: true, line: q.why })
      if (phase === 'shape') {
        setPhase('pile')
        drop()
      } else {
        setN(SECOND_N)
        setPhase('explore')
        drop()
      }
      return
    }
    setWrong((w) => [...w, id])
    const t = q.traps[id]
    if (t) {
      setMistakes((all) => (all.includes(t) ? all : [...all, t]))
      setVerdict({ right: false, label: CLT_MISTAKES[t].label, line: CLT_MISTAKES[t].line })
    } else setVerdict({ right: false, line: 'Try another one.' })
  }

  const saved = useRef(false)
  const finish = () => {
    setPhase('done')
    if (saved.current) return
    saved.current = true
    record({ session: 'statistics', at: new Date().toISOString(), guess: '', misconception: mistakes[0] ?? null, rematch: null, mistakes, statTopic: topic.id })
  }

  return (
    <Frame className="subject stats">
      <SessionHead chip={`Statistics · ${topic.title}`} step={1} total={1} />
      <BackToTopics subject="Statistics" onClick={onTopics} />
      <Title
        h="Averages pile into a bell curve."
        sub="One bus wait is lopsided: usually short, sometimes long. But what do averages of many waits look like? Guess first, then pile them up."
        headingRef={title}
      />
      <div className="sj-two">
        <div className="sj-col">
          <div className="sj-card">
            <div className="sj-k">one person’s wait, in minutes</div>
            <PopChart />
          </div>
          <div className="sj-card">
            <div className="sj-k">
              averages of {n} people · {Math.min(shown, COUNT)} of {COUNT} piled up
            </div>
            <MeansChart means={means.slice(0, shown)} full={means} hidden={phase === 'shape'} />
            {shown > 0 && (
              <p className="sj-small">
                spread of the averages: <b className="sj-num">±{spread(means.slice(0, Math.max(2, shown))).toFixed(2)}</b> min · true mean <b className="sj-num">{popMean.toFixed(2)}</b> min
              </p>
            )}
          </div>
        </div>
        <div className="sj-col">
          {q && (
            <div className="sj-card">
              <p className="sj-ask">{q.ask}</p>
              <Choices choices={q.choices} wrong={wrong} onPick={answer} label="your answer" />
            </div>
          )}
          {verdict && <Verdict {...verdict} />}
          {settledFirst && (
            <button className="sj-btn sj-go" onClick={() => { setVerdict(null); setPhase('grow') }}>
              Next question →
            </button>
          )}
          {(phase === 'explore' || phase === 'done') && !dropping && (
            <div className="sj-card">
              <div className="sj-k">try any sample size</div>
              <label className="sj-range">
                <span>n = {n}</span>
                <input type="range" min={1} max={50} value={n} onChange={(e) => { setN(+e.target.value); setShown(COUNT) }} aria-label="people per average" />
              </label>
              <p className="sj-small">At n = 1 the “averages” are just single waits, so the pile looks like the waits. Slide right and watch the bell form and tighten.</p>
              <p className="sj-rule">
                <span>Averages pile into a <span className="sj-hl">bell</span>, whatever the original shape.</span>
                <span>Bigger samples, <span className="sj-hl">narrower</span> bell: spread ÷ √n.</span>
              </p>
              {phase === 'explore' && (
                <button className="sj-btn sj-go sj-finish" onClick={finish}>Finish ✓</button>
              )}
            </div>
          )}
        </div>
      </div>
      {phase === 'done' && (
        <EndBar
          caught={null}
          rematch="right"
          line={mistakes.length ? <>Caught: {mistakes.map((m) => `“${CLT_MISTAKES[m].label}”`).join(', ')}.</> : <span className="st-mastered">✓ mastered</span>}
          remix="Next: the law of large numbers."
          onDone={onDone}
        />
      )}
    </Frame>
  )
}

/* ---------- charts ---------- */

const W = 520
const L = 30

function PopChart() {
  const h = 110
  const bw = (W - L - 10) / WAITS.length
  const top = Math.max(...PROBS)
  const y = (p: number) => h - 22 - (p / top) * (h - 34)
  const mx = L + (popMean + 0.5) * bw
  return (
    <svg className="sj-svg st-pop" viewBox={`0 0 ${W} ${h}`} role="img" aria-label={`one wait: most are short, a few are long; mean ${popMean.toFixed(2)} minutes`}>
      {PROBS.map((p, i) => (
        <rect key={i} className="st-bar pop" x={L + i * bw + 2} y={y(p)} width={bw - 4} height={h - 22 - y(p)} />
      ))}
      {WAITS.map((m, i) => (
        <text key={m} className="st-tick" x={L + (i + 0.5) * bw} y={h - 6}>{m}</text>
      ))}
      <line className="st-mean" x1={mx} y1={6} x2={mx} y2={h - 22} />
      <text className="st-mean-lab" x={mx + 4} y={14}>mean</text>
    </svg>
  )
}

function MeansChart({ means, full, hidden }: { means: number[]; full: number[]; hidden: boolean }) {
  const h = 170
  const counts = histogram(means)
  // the y scale comes from the finished pile, so the bars grow up into it
  const top = Math.max(1, ...histogram(full))
  const bw = (W - L - 10) / BINS
  const y = (c: number) => h - 22 - (c / top) * (h - 34)
  const sx = (minutes: number) => L + (minutes / BIN) * bw
  return (
    <svg className="sj-svg st-means" viewBox={`0 0 ${W} ${h}`} role="img" aria-label={hidden ? 'empty pile: answer the question first' : `pile of ${means.length} averages`}>
      <line className="st-axis" x1={L} y1={h - 22} x2={W - 10} y2={h - 22} />
      {!hidden && counts.map((c, i) => c > 0 && <rect key={i} className="st-bar" x={L + i * bw + 1} y={y(c)} width={bw - 2} height={h - 22 - y(c)} />)}
      {WAITS.map((m) => (
        <text key={m} className="st-tick" x={sx(m + 0.5)} y={h - 6}>{m}</text>
      ))}
      <line className="st-mean" x1={sx(popMean)} y1={6} x2={sx(popMean)} y2={h - 22} />
      {hidden && <text className="st-q" x={W / 2} y={h / 2}>?</text>}
    </svg>
  )
}
