import { useEffect, useState } from 'react'
import { MISTAKES, tapVerdict, type Part, type TapMistake } from './chem'
import { reducedMotion } from './geom'
import { Scene } from './Scene'
import { RX, sceneAt, type RxId } from './sn2'

// Step 3: the same three parts in HO⁻ + CH₃Br and N≡C⁻ + CH₃I. Tap each in both,
// then run both reactions side by side on one slider.

const PARTS: { part: Part; tag: string; ask: string }[] = [
  { part: 'nucleophile', tag: 'Nu', ask: 'Tap the atom that attacks (the nucleophile), in both.' },
  { part: 'electrophile', tag: 'C', ask: 'Tap the carbon it attacks, in both.' },
  { part: 'leaving', tag: 'LG', ask: 'Tap the leaving group, in both.' },
]
const SIDES: RxId[] = ['oh-mebr', 'cn-mei']
const NAMES: Record<RxId, Record<string, string>> = {
  'oh-mebr': { back: 'H of hydroxide', nu: 'O of hydroxide', c: 'carbon of CH₃Br', h1: 'H on carbon', h2: 'H on carbon', h3: 'H on carbon', lg: 'Br' },
  'cn-mei': { back: 'N of cyanide', nu: 'C of cyanide', c: 'carbon of CH₃I', h1: 'H on carbon', h2: 'H on carbon', h3: 'H on carbon', lg: 'I' },
}
const PRINCIPLE = 'Electrons flow from the electron-rich atom to the electron-poor carbon, and the leaving group takes the bond’s electrons with it.'

type Found = Record<RxId, Part[]>

export function CompareStep({ onMistake, onDone }: { onMistake: (m: TapMistake) => void; onDone: () => void }) {
  const [found, setFound] = useState<Found>({ 'oh-mebr': [], 'cn-mei': [] })
  const [note, setNote] = useState<{ side: RxId; text: string; mistake: TapMistake | null } | null>(null)
  const [t, setT] = useState(0)
  const [running, setRunning] = useState(false)

  const cur = PARTS.find((p) => !SIDES.every((s) => found[s].includes(p.part)))
  const all = !cur

  useEffect(() => {
    if (all) onDone()
  }, [all, onDone])

  const tap = (side: RxId) => (atom: string) => {
    if (!cur || found[side].includes(cur.part)) return
    const v = tapVerdict(RX[side].parts, cur.part, atom)
    if (v.ok) {
      setFound((f) => ({ ...f, [side]: [...f[side], cur.part] }))
      setNote(null)
    } else {
      if (v.mistake) onMistake(v.mistake)
      setNote({ side, text: v.mistake ? MISTAKES[v.mistake].line : 'Not that one.', mistake: v.mistake })
    }
  }

  const run = () => {
    if (reducedMotion()) return setT(1)
    setT(0)
    setRunning(true)
  }
  useEffect(() => {
    if (!running) return
    let k = 0
    const id = setInterval(() => {
      k += 1
      setT(Math.min(1, k / 90))
      if (k >= 90) {
        clearInterval(id)
        setRunning(false)
      }
    }, 32)
    return () => clearInterval(id)
  }, [running])

  return (
    <section className="og-step og-compare">
      <p className="og-ask" aria-live="polite">{cur ? cur.ask : 'Same three parts. Run both.'}</p>
      <div className="og-pair-grid">
        {SIDES.map((side) => {
          const marks = Object.fromEntries(found[side].map((p) => [RX[side].parts[p], PARTS.find((q) => q.part === p)!.tag]))
          return (
            <figure key={side} className="og-fig">
              <figcaption>{t < 0.68 ? RX[side].text.reactants : RX[side].text.products}</figcaption>
              <Scene
                scene={sceneAt(RX[side], t)}
                label={RX[side].text.reactants}
                marks={marks}
                onAtom={all ? undefined : tap(side)}
                atomName={(id) => NAMES[side][id]}
              />
              {note?.side === side && (
                <div className="og-note" role="status">
                  {note.mistake && <div className="og-mname">{MISTAKES[note.mistake].label}</div>}
                  <p>{note.text}</p>
                </div>
              )}
            </figure>
          )
        })}
      </div>
      {all && (
        <div className="og-principle">
          <p className="og-ink-big">{PRINCIPLE}</p>
          <div className="og-row">
            <button className="og-btn og-go" onClick={run} disabled={running}>Run both</button>
            <label className="og-scrub">
              <span>before</span>
              <input type="range" min={0} max={100} value={Math.round(t * 100)} disabled={running} onChange={(e) => setT(+e.target.value / 100)} aria-label="scrub both reactions" />
              <span>after</span>
            </label>
          </div>
        </div>
      )}
    </section>
  )
}
