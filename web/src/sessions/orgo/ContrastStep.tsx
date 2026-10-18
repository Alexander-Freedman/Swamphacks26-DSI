import { useEffect, useState } from 'react'
import { MISTAKES, type ContrastMistake } from './chem'
import { reducedMotion } from './geom'
import { MECHS, mechScene, mechText } from './mechs'
import { Scene } from './Scene'
import { RX, sceneAt } from './sn2'

// Same HO⁻, two carbons: predict the path for each, then one slider runs both side by side.

type Path = 'sn2' | 'e2'
type Side = 'open' | 'crowded'

const SIDES: { side: Side; title: string; truth: Path; wrong: ContrastMistake }[] = [
  { side: 'open', title: 'HO⁻ + CH₃Br', truth: 'sn2', wrong: 'no-neighbor-h' },
  { side: 'crowded', title: 'HO⁻ + (CH₃)₃C–Br', truth: 'e2', wrong: 'crowding-ignored' },
]
const PATH: Record<Path, string> = { sn2: 'swaps in (SN2)', e2: 'pulls an H off (E2)' }
const WHY: Record<Side, string> = {
  open: 'Nothing blocks the back of this carbon, and there’s no carbon next door to take an H from.',
  crowded: 'Three CH₃ groups block the back side. HO⁻ grabs the H across from Br instead.',
}
const PRINCIPLE = 'Same HO⁻. An open carbon gets attacked from behind; a crowded one makes HO⁻ act as a base.'

export function ContrastStep({ onMistake, onDone }: { onMistake: (m: ContrastMistake) => void; onDone: () => void }) {
  const [pick, setPick] = useState<Record<Side, Path | null>>({ open: null, crowded: null })
  const [t, setT] = useState(0)
  const [phase, setPhase] = useState<'pick' | 'run' | 'done'>('pick')

  const run = () => {
    for (const s of SIDES) if (pick[s.side] !== s.truth) onMistake(s.wrong)
    if (reducedMotion()) {
      setT(1)
      setPhase('done')
    } else setPhase('run')
  }

  useEffect(() => {
    if (phase !== 'run') return
    let k = 0
    const id = setInterval(() => {
      k += 1
      setT(Math.min(1, k / 100))
      if (k >= 100) {
        clearInterval(id)
        setPhase('done')
      }
    }, 32)
    return () => clearInterval(id)
  }, [phase])

  useEffect(() => {
    if (phase === 'done') onDone()
  }, [phase, onDone])

  const scene = (s: Side) => (s === 'open' ? sceneAt(RX['oh-mebr'], t) : mechScene(MECHS.e2, t))
  const text = (s: Side) => (s === 'open' ? (t < 0.68 ? RX['oh-mebr'].text.reactants : RX['oh-mebr'].text.products) : mechText(MECHS.e2, t))

  return (
    <section className="og-step og-compare">
      <p className="og-ask">{phase === 'pick' ? 'Same HO⁻, two carbons. What does HO⁻ do to each?' : 'Both at once. Drag to replay.'}</p>
      <div className="og-pair-grid">
        {SIDES.map((s) => {
          const mine = pick[s.side]
          const right = mine === s.truth
          return (
            <figure key={s.side} className="og-fig">
              <figcaption>{s.title}</figcaption>
              <Scene scene={scene(s.side)} vh={s.side === 'open' ? undefined : MECHS.e2.vh} label={`${text(s.side)}, ${Math.round(t * 100)}% of the way`} />
              <div className="og-legend" aria-hidden="true">
                <span className="og-rx">{text(s.side)}</span>
              </div>
              {phase === 'pick' ? (
                <div className="og-row og-paths" role="group" aria-label={`${s.title}: pick a path`}>
                  {(['sn2', 'e2'] as Path[]).map((p) => (
                    <button key={p} className={'og-btn og-ghost og-path' + (mine === p ? ' og-picked' : '')} aria-pressed={mine === p} onClick={() => setPick({ ...pick, [s.side]: p })}>
                      {PATH[p]}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="og-verdict" role="status">
                  {right ? (
                    <div className="og-okay">
                      <span className="og-check" aria-hidden="true">✓</span> {PATH[s.truth]}
                    </div>
                  ) : (
                    <div className="og-mistake">
                      <div className="og-mname">{MISTAKES[s.wrong].label}</div>
                      <p>
                        You said <span className="og-pencil-text">{PATH[mine!]}</span>. It {PATH[s.truth]}.
                      </p>
                    </div>
                  )}
                  <p className="og-hint">{WHY[s.side]}</p>
                </div>
              )}
            </figure>
          )
        })}
      </div>
      {phase === 'pick' ? (
        <div className="og-row">
          <button className="og-btn og-go" disabled={!pick.open || !pick.crowded} onClick={run}>Run both</button>
        </div>
      ) : (
        <>
          <label className="og-scrub">
            <span>before</span>
            <input type="range" min={0} max={100} value={Math.round(t * 100)} disabled={phase !== 'done'} onChange={(e) => setT(+e.target.value / 100)} aria-label="scrub both reactions" />
            <span>after</span>
          </label>
          {phase === 'done' && (
            <div className="og-principle">
              <p className="og-ink-big">{PRINCIPLE}</p>
            </div>
          )}
        </>
      )}
    </section>
  )
}
