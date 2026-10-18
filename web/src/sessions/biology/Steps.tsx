import { useEffect, useState } from 'react'
import { AMINO, anticodon, BY_HAND, codonToAmino, effectOf, MRNA, MUTATIONS, PAIR, readingFrame, startIndex, TEMPLATE, translate, type DnaBase, type Effect, type Mutation } from './genetics'
import { reducedMotion, TILE, tileX, widthFor, type Said } from './layout'
import type { BioMistake } from './mistakes'
import { Base, Predict, Verdict } from './parts'

type StepProps = { onMistake: (m: BioMistake) => void; onNext: () => void; nextLabel: string }

const N = MRNA.length
const W = widthFor(N)
const CODING = [...MRNA].map((b) => (b === 'U' ? 'T' : b)).join('')
const FRAME = readingFrame(MRNA)
const START = startIndex(MRNA)
const three = (one: string) => AMINO[one].three

function Next({ show, label, onNext }: { show: boolean; label: string; onNext: () => void }) {
  if (!show) return null
  return (
    <div className="bio-row">
      <button className="bio-btn bio-go" onClick={onNext}>{label}</button>
    </div>
  )
}

/* ---------- 1. transcription: pair RNA bases against the template strand ---------- */

export function TranscribeStep({ onMistake, onNext, nextLabel }: StepProps) {
  const [ready, setReady] = useState(false)
  const [placed, setPlaced] = useState(0)
  const [said, setSaid] = useState<Said | null>(null)
  const [auto, setAuto] = useState(false)
  const done = placed >= N

  useEffect(() => {
    if (!auto || done) return
    const id = setInterval(() => setPlaced((p) => Math.min(N, p + 1)), 110)
    return () => clearInterval(id)
  }, [auto, done])

  const pick = (b: string) => {
    if (placed >= BY_HAND) return
    const t = TEMPLATE[placed] as DnaBase
    const want = PAIR[t]
    if (b === want) {
      setPlaced(placed + 1)
      setSaid({ ok: true, line: `${t} in DNA pairs with ${want} in RNA.` })
      return
    }
    const m: BioMistake = b === 'T' ? 'rna-has-thymine' : b === t || (t === 'T' && b === 'U') ? 'copied-not-paired' : 'mispaired-base'
    onMistake(m)
    setSaid({ ok: false, mistake: m, line: '' })
  }

  const pol = Math.min(placed, N - 1)
  return (
    <section className="bio-step">
      <Predict
        ask="First, a prediction. RNA pairs with DNA almost the way DNA pairs with itself. What does RNA put opposite an A in DNA?"
        choices={[
          { value: 'T', label: 'T', sub: 'thymine' },
          { value: 'U', label: 'U', sub: 'uracil' },
          { value: 'A', label: 'A', sub: 'adenine' },
          { value: 'G', label: 'G', sub: 'guanine' },
        ]}
        answer="U"
        why="RNA uses U (uracil) where DNA uses T, so A pairs with U. Now build the mRNA yourself."
        trap={(v) => (v === 'T' ? 'rna-has-thymine' : v === 'A' ? 'copied-not-paired' : 'mispaired-base')}
        retry=""
        onMistake={onMistake}
        onRight={() => setReady(true)}
      />
      <figure className="bio-fig">
        <svg className="bio-svg" viewBox={`0 0 ${W} 196`} role="img" aria-label={`DNA template ${TEMPLATE}; mRNA so far ${MRNA.slice(0, placed) || 'empty'}`}>
          <text className="bio-lab" x={tileX(0)} y={16}>DNA, coding strand</text>
          {[...CODING].map((b, i) => <Base key={'c' + i} b={b} x={tileX(i)} y={22} faint />)}
          <text className="bio-lab" x={tileX(0)} y={70}>DNA, template strand: the one being read</text>
          {/* the RNA polymerase, drawn behind the tiles, over the base being paired */}
          {!done && <rect className="bio-pol" x={0} y={72} width={TILE + 12} height={104} rx={10} style={{ transform: `translateX(${tileX(pol) - 6}px)` }} />}
          {[...TEMPLATE].map((b, i) => <Base key={'t' + i} b={b} x={tileX(i)} y={76} />)}
          <text className="bio-lab" x={tileX(0)} y={134}>mRNA, being built</text>
          {[...MRNA.slice(0, placed)].map((b, i) => <Base key={'m' + i} b={b} x={tileX(i)} y={140} className="bio-pop" />)}
          {!done && <rect className="bio-slot" x={tileX(placed)} y={140} width={TILE} height={TILE} rx={4} />}
        </svg>
        {done && <figcaption className="bio-cap">mRNA: <span className="bio-seq">{MRNA}</span>. Same letters as the coding strand, with U for T.</figcaption>}
      </figure>
      {ready && !done && (
        <div className="bio-q">
          {placed < BY_HAND ? (
            <>
              <p className="bio-ask">
                Base {placed + 1} of {BY_HAND} by hand: the template has <b>{TEMPLATE[placed]}</b>. Which RNA base pairs with it?
              </p>
              <div className="bio-palette" role="group" aria-label="RNA bases">
                {['A', 'U', 'G', 'C', 'T'].map((b) => (
                  <button key={b} className={`bio-key bio-b-${b}`} onClick={() => pick(b)} aria-label={`add ${b}`}>{b}</button>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="bio-ask">You’ve got the pattern. The polymerase does the rest of the gene the same way.</p>
              <div className="bio-row">
                <button className="bio-btn bio-go" disabled={auto} onClick={() => (reducedMotion() ? setPlaced(N) : setAuto(true))}>Let the polymerase finish</button>
              </div>
            </>
          )}
          <Verdict said={said} />
        </div>
      )}
      <Next show={done} label={nextLabel} onNext={onNext} />
    </section>
  )
}

/* ---------- 2. read it in threes: codon size, then the start codon ---------- */

export function CodonsStep({ onMistake, onNext, nextLabel }: StepProps) {
  const [size, setSize] = useState(false)
  const [started, setStarted] = useState(false)
  const [said, setSaid] = useState<Said | null>(null)

  const tap = (i: number) => {
    if (started) return
    if (i >= START && i < START + 3) {
      setStarted(true)
      setSaid({ ok: true, line: 'AUG is the start codon. From here the ribosome reads three bases at a time.' })
      return
    }
    if (i < START) {
      onMistake('starts-at-first-base')
      return setSaid({ ok: false, mistake: 'starts-at-first-base', line: '' })
    }
    const isAug = MRNA.slice(i - 2, i + 1) === 'AUG' || MRNA.slice(i - 1, i + 2) === 'AUG' || MRNA.slice(i, i + 3) === 'AUG'
    setSaid({ ok: false, mistake: null, line: isAug ? 'That’s an AUG, but not the first one. The ribosome starts at the first AUG it meets.' : 'Look for A, U, G in a row.' })
  }

  return (
    <section className="bio-step">
      <Predict
        ask="A ribosome reads mRNA in small groups called codons. Each codon picks one of 20 amino acids. How many bases make one codon?"
        choices={[
          { value: '1', label: '1 base', sub: '4 possible codons' },
          { value: '2', label: '2 bases', sub: '16 possible codons' },
          { value: '3', label: '3 bases', sub: '64 possible codons' },
          { value: '4', label: '4 bases', sub: '256 possible codons' },
        ]}
        answer="3"
        why="Three bases give 64 codons: enough for 20 amino acids plus stop signals, with spares."
        trap={(v) => (v === '1' || v === '2' ? 'too-few-bases-per-codon' : null)}
        retry="Four would work, but three is already enough: 64 codons for 20 amino acids. Cells use three."
        onMistake={onMistake}
        onRight={() => setSize(true)}
      />
      {size && (
        <div className="bio-q">
          <p className="bio-ask">{started ? 'Now the mRNA splits into codons, starting at AUG.' : 'Where does the ribosome start reading? Tap that spot on the mRNA.'}</p>
        </div>
      )}
      <figure className="bio-fig">
        <svg className="bio-svg" viewBox={`0 0 ${W} 120`} role="group" aria-label="the mRNA">
          {[...MRNA].map((b, i) => (
            <g
              key={i}
              role={size && !started ? 'button' : undefined}
              tabIndex={size && !started ? 0 : undefined}
              aria-label={size && !started ? `base ${i + 1}, ${b}` : undefined}
              className={size && !started ? 'bio-tap' : ''}
              onClick={() => size && tap(i)}
              onKeyDown={(e) => {
                if (size && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  tap(i)
                }
              }}
            >
              <Base b={b} x={tileX(i)} y={30} faint={started && i < START} />
            </g>
          ))}
          {started &&
            FRAME.map((c, k) => {
              const x = tileX(START + 3 * k)
              const w = 3 * TILE + 4
              return (
                <g key={k} className="bio-codon" style={{ animationDelay: `${k * 0.18}s` }}>
                  <path d={`M${x} 64 v8 h${w} v-8`} />
                  <text x={x + w / 2} y={90} textAnchor="middle">{c}</text>
                </g>
              )
            })}
          {started && <text className="bio-lab" x={tileX(0)} y={20}>not read</text>}
        </svg>
      </figure>
      {size && <Verdict said={said} />}
      <Next show={started} label={nextLabel} onNext={onNext} />
    </section>
  )
}

/* ---------- 3. translation: one codon at a time, pick the amino acid ---------- */

const DECOYS = ['L', 'S', 'G', 'V', 'A', 'R']
function options(codon: string): string[] {
  const right = codonToAmino(codon)
  const anti = codonToAmino(anticodon(codon))
  const out = [right]
  if (!out.includes(anti)) out.push(anti)
  if (!out.includes('*')) out.push('*')
  for (const d of DECOYS) if (out.length < 4 && !out.includes(d)) out.push(d)
  return out.sort((a, b) => three(a).localeCompare(three(b)))
}

export function TranslateStep({ onMistake, onNext, nextLabel }: StepProps) {
  const [k, setK] = useState(0)
  const [said, setSaid] = useState<Said | null>(null)
  const [wrong, setWrong] = useState<string[]>([])
  const done = k >= FRAME.length
  const codon = FRAME[Math.min(k, FRAME.length - 1)]
  const protein = FRAME.slice(0, k).map(codonToAmino).filter((a) => a !== '*')

  const pick = (a: string) => {
    const right = codonToAmino(codon)
    if (a === right) {
      setK(k + 1)
      setWrong([])
      setSaid({ ok: true, line: right === '*' ? `${codon} is a stop codon. The protein is finished and let go.` : `${codon} codes for ${three(right)} (${AMINO[right].name}).` })
      return
    }
    setWrong((w) => [...w, a])
    const m: BioMistake | null = right === '*' ? 'stop-has-amino-acid' : a === codonToAmino(anticodon(codon)) ? 'read-anticodon' : null
    if (m) onMistake(m)
    setSaid({ ok: false, mistake: m, line: 'Find the first base on the left of the table, the second across the top, then the third inside the box.' })
  }

  const rx = tileX(START + 3 * Math.min(k, FRAME.length - 1)) - 8
  return (
    <section className="bio-step">
      <figure className="bio-fig">
        <svg className="bio-svg" viewBox={`0 0 ${W} 210`} role="img" aria-label={`ribosome on codon ${k + 1}; protein so far ${protein.map(three).join('-') || 'empty'}`}>
          {/* the protein chain grows above the ribosome, one bead per amino acid */}
          {protein.map((a, i) => (
            <g key={i} className="bio-pop" transform={`translate(${tileX(START) + 16 + i * 46} 26)`}>
              {i > 0 && <line x1={-46 + 18} y1={0} x2={-18} y2={0} className="bio-peptide" />}
              <circle r={18} className={`bio-aa bio-aa-${i % 4}`} />
              <text dy="0.35em" textAnchor="middle" className="bio-aa-t">{three(a)}</text>
            </g>
          ))}
          {!done && (
            <g className="bio-ribo" style={{ transform: `translateX(${rx}px)` }}>
              <rect x={0} y={96} width={3 * TILE + 20} height={92} rx={22} />
              {/* the tRNA: its anticodon pairs with the codon under the ribosome */}
              <g className="bio-trna">
                <path d={`M${10} 104 h${3 * TILE} v-26 h-${3 * TILE} z`} />
                <text x={10 + (3 * TILE) / 2} y={96} textAnchor="middle">{codonToAmino(codon) === '*' ? 'no tRNA' : anticodon(codon)}</text>
              </g>
            </g>
          )}
          {[...MRNA].map((b, i) => (
            <Base key={i} b={b} x={tileX(i)} y={148} faint={i < START || i >= START + 3 * FRAME.length} mark={!done && i >= START + 3 * k && i < START + 3 * k + 3} />
          ))}
          <text className="bio-lab" x={tileX(0)} y={200}>mRNA</text>
        </svg>
      </figure>
      {!done && (
        <div className="bio-q">
          <p className="bio-ask">
            Codon {k + 1}: <span className="bio-seq">{codon}</span>. Which amino acid does it code for? Use the table.
          </p>
          <div className="bio-choices">
            {options(codon).map((a) => (
              <button key={a} className={'bio-choice' + (wrong.includes(a) ? ' wrong' : '')} disabled={wrong.includes(a)} onClick={() => pick(a)}>
                <b>{a === '*' ? 'Stop' : three(a)}</b>
                <span>{a === '*' ? 'let the protein go' : AMINO[a].name}</span>
              </button>
            ))}
          </div>
          <CodonTable codon={codon} />
        </div>
      )}
      <Verdict said={said} />
      {done && <p className="bio-cap">Protein: <span className="bio-seq">{translate(MRNA).split('').map(three).join('-')}</span>. Five amino acids from one gene, read three bases at a time.</p>}
      <Next show={done} label={nextLabel} onNext={onNext} />
    </section>
  )
}

const UCAG = ['U', 'C', 'A', 'G']
/** The standard codon table: first base down the side, second across the top, third inside each box. */
function CodonTable({ codon }: { codon: string }) {
  return (
    <table className="bio-table" aria-label="codon table">
      <thead>
        <tr>
          <th scope="col">1st ↓ · 2nd →</th>
          {UCAG.map((b) => (
            <th key={b} scope="col" className={b === codon[1] ? 'hl' : ''}>{b}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {UCAG.map((a) => (
          <tr key={a}>
            <th scope="row" className={a === codon[0] ? 'hl' : ''}>{a}</th>
            {UCAG.map((b) => (
              <td key={b} className={a === codon[0] && b === codon[1] ? 'hl' : ''}>
                {UCAG.map((c) => {
                  const one = codonToAmino(a + b + c)
                  return (
                    <div key={c}>
                      {a + b + c} <b>{one === '*' ? 'Stop' : three(one)}</b>
                    </div>
                  )
                })}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/* ---------- 4. change one letter: predict the effect, then see both proteins ---------- */

const EFFECTS: { value: Effect; label: string; sub: string }[] = [
  { value: 'none', label: 'Nothing changes', sub: 'same protein' },
  { value: 'early-stop', label: 'It stops early', sub: 'a shorter protein' },
  { value: 'everything-after', label: 'Everything after it changes', sub: 'new amino acids from there on' },
]
const TRAP: Record<Mutation['id'], BioMistake> = { silent: 'every-change-breaks-protein', nonsense: 'new-stop-missed', frameshift: 'frameshift-one-change' }

function Beads({ protein, y, ghost, against }: { protein: string; y: number; ghost?: boolean; against?: string }) {
  return (
    <g>
      {[...protein].map((a, i) => (
        <g key={i} transform={`translate(${tileX(0) + 18 + i * 46} ${y})`} className={ghost ? 'bio-ghost' : 'bio-pop'}>
          {i > 0 && <line x1={-28} y1={0} x2={-18} y2={0} className="bio-peptide" />}
          <circle r={18} className={ghost ? 'bio-aa-ghost' : 'bio-aa bio-aa-' + (i % 4) + (against !== undefined && against[i] !== a ? ' bio-aa-diff' : '')} />
          <text dy="0.35em" textAnchor="middle" className="bio-aa-t">{three(a)}</text>
        </g>
      ))}
    </g>
  )
}

export function MutateStep({ onMistake, onNext, nextLabel }: StepProps) {
  const [i, setI] = useState(0)
  const [seen, setSeen] = useState(false)
  const m = MUTATIONS[Math.min(i, MUTATIONS.length - 1)]
  const truth = effectOf(MRNA, m.mrna)
  const before = translate(MRNA)
  const after = translate(m.mrna)
  const last = i === MUTATIONS.length - 1
  const mw = widthFor(m.mrna.length)
  const reveal: Record<Effect, string> = {
    none: `Same protein: ${[...after].map(three).join('-')}.`,
    'early-stop': `The protein stops after ${after.length} amino acids instead of ${before.length}.`,
    'everything-after': `From the change on, every amino acid is new${after.length >= before.length ? ', and this frame never meets a stop codon' : ''}.`,
  }
  return (
    <section className="bio-step">
      <p className="bio-ask">
        Change {i + 1} of {MUTATIONS.length}: {m.label} (<span className="bio-seq">{m.what}</span>).
      </p>
      <figure className="bio-fig">
        <svg className="bio-svg" viewBox={`0 0 ${Math.max(W, mw)} ${seen ? 200 : 76}`} role="img" aria-label={`changed mRNA ${m.mrna}`}>
          <text className="bio-lab" x={tileX(0)} y={14}>changed mRNA</text>
          {[...m.mrna].map((b, k) => <Base key={k} b={b} x={tileX(k)} y={22} mark={k === m.at} />)}
          {seen && (
            <>
              <text className="bio-lab" x={tileX(0)} y={84}>before (pencil) and after (ink)</text>
              <Beads protein={before} y={112} ghost />
              <Beads protein={after} y={164} against={before} />
            </>
          )}
        </svg>
      </figure>
      <Predict
      key={i}
      ask="Predict first: what happens to the protein?"
      choices={EFFECTS}
      answer={truth}
      why={reveal[truth]}
      trap={() => TRAP[m.id]}
      retry=""
      onMistake={onMistake}
      onRight={() => setSeen(true)}
      />
      {seen && (
        <div className="bio-row">
          <button
            className="bio-btn bio-go"
            onClick={() => {
              if (last) return onNext()
              setI(i + 1)
              setSeen(false)
            }}
          >
            {last ? nextLabel : 'Next change →'}
          </button>
        </div>
      )}
    </section>
  )
}
