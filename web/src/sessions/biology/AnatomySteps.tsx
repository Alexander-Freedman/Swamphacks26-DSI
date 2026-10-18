import { useState, type ReactNode } from 'react'
import { HEART, KIDNEY, MUSCLE, type WalkQ } from './anatomy'
import type { BioMistake } from './mistakes'
import { Predict } from './parts'

// Anatomy topics: the picture on one side, one prediction at a time on the other, so each screen
// fits one window. A right answer moves the picture one stage on.

type StepProps = { onMistake: (m: BioMistake) => void; onNext: () => void; nextLabel: string }

function Walkthrough({ qs, picture, onMistake, onNext, nextLabel }: StepProps & { qs: WalkQ[]; picture: (stage: number) => ReactNode }) {
  const [i, setI] = useState(0)
  const [right, setRight] = useState(false)
  const stage = i + (right ? 1 : 0)
  const last = i === qs.length - 1
  const q = qs[i]
  return (
    <section className="bio-walk">
      <figure className="bio-fig bio-walk-pic">{picture(stage)}</figure>
      <div className="bio-walk-q">
        <div className="bio-tag">
          Question {i + 1} of {qs.length}
        </div>
        <Predict
          key={i}
          ask={q.ask}
          choices={q.choices}
          answer={q.answer}
          why={q.why}
          trap={(v) => q.traps[v] ?? null}
          retry={q.retry || 'Try another one.'}
          onMistake={onMistake}
          onRight={() => setRight(true)}
        />
        {right && (
          <div className="bio-row">
            <button
              className="bio-btn bio-go"
              onClick={() => {
                if (last) return onNext()
                setI(i + 1)
                setRight(false)
              }}
            >
              {last ? nextLabel : 'Next question →'}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

/* ---------- the heart: follow one drop of blood ---------- */

// Where the drop is after each answer: body, RA, RV, lungs, lungs (now red), LA, LV, body.
const DROP: [number, number][] = [
  [70, 268],
  [112, 118],
  [112, 198],
  [180, 32],
  [180, 32],
  [248, 118],
  [248, 198],
  [292, 268],
]
const CHAMBERS: { id: string; x: number; y: number; h: number; name: string; thick?: boolean }[] = [
  { id: 'RA', x: 62, y: 88, h: 60, name: 'right atrium' },
  { id: 'RV', x: 62, y: 160, h: 80, name: 'right ventricle' },
  { id: 'LA', x: 198, y: 88, h: 60, name: 'left atrium' },
  { id: 'LV', x: 198, y: 160, h: 80, name: 'left ventricle', thick: true },
]

function HeartPic({ stage }: { stage: number }) {
  const red = stage >= 4
  const [x, y] = DROP[Math.min(stage, DROP.length - 1)]
  // a vessel is colored once the blood has been through it
  const seen = (s: number, cls: string) => (stage >= s ? cls : 'bio-vessel-off')
  return (
    <svg className="bio-svg bio-anat" viewBox="0 0 360 300" role="img" aria-label={`the heart; the blood drop is ${['in the body', 'in the right atrium', 'in the right ventricle', 'in the lungs', 'in the lungs, now oxygen-rich', 'in the left atrium', 'in the left ventricle', 'on its way to the body'][Math.min(stage, 7)]}`}>
      <rect className="bio-organ" x={120} y={8} width={120} height={40} rx={6} />
      <text className="bio-organ-t" x={180} y={33} textAnchor="middle">lungs</text>
      <rect className="bio-organ" x={40} y={252} width={280} height={40} rx={6} />
      <text className="bio-organ-t" x={180} y={277} textAnchor="middle">body</text>
      {/* vessels: venae cavae, pulmonary artery, pulmonary veins, aorta */}
      <path className={`bio-vessel ${seen(1, 'bio-blue')}`} d="M70 252 V118 H62" />
      <path className={`bio-vessel ${seen(3, 'bio-blue')}`} d="M162 200 H180 V48" />
      <path className={`bio-vessel ${seen(5, 'bio-red')}`} d="M240 28 H330 V118 H298" />
      <path className={`bio-vessel ${seen(7, 'bio-red')}`} d="M298 200 H318 V252" />
      {CHAMBERS.map((c) => (
        <g key={c.id}>
          <rect className={'bio-chamber' + (c.thick ? ' bio-thick' : '')} x={c.x} y={c.y} width={100} height={c.h} rx={14} />
          <text className="bio-chamber-t" x={c.x + 50} y={c.y + c.h / 2 + 22} textAnchor="middle">{c.name}</text>
        </g>
      ))}
      {/* valves: two flaps on each doorway */}
      {[
        [112, 154, 'tricuspid'],
        [248, 154, 'mitral'],
      ].map(([vx, vy, n]) => (
        <g key={n as string} className="bio-valve">
          <path d={`M${(vx as number) - 18} ${vy} l12 6 M${(vx as number) + 18} ${vy} l-12 6`} />
          <text x={(vx as number) + 24} y={(vy as number) + 4}>{n}</text>
        </g>
      ))}
      <text className="bio-valve-t" x={184} y={186}>pulmonary valve</text>
      <text className="bio-valve-t" x={322} y={232}>aortic</text>
      <circle className={'bio-drop ' + (red ? 'bio-red-fill' : 'bio-blue-fill')} r={10} style={{ transform: `translate(${x}px, ${y}px)` }} />
    </svg>
  )
}

/* ---------- the kidney: one nephron ---------- */

function NephronPic({ stage }: { stage: number }) {
  const filtered = stage >= 1
  return (
    <svg className="bio-svg bio-anat" viewBox="0 0 360 300" role="img" aria-label="a nephron: the glomerulus in its capsule, the proximal tubule, the loop of Henle, the distal tubule and the collecting duct">
      {/* blood in, through the glomerulus, and the capillary back along the tubule */}
      <path className="bio-vessel bio-red" d="M10 60 H44" />
      <circle className="bio-glom" cx={62} cy={70} r={20} />
      <path className="bio-capsule" d="M44 40 A32 32 0 1 0 92 52" />
      <text className="bio-lab" x={20} y={118}>filter (glomerulus)</text>
      {/* the tubule */}
      <path className="bio-tubule" d="M92 52 C110 30 120 80 140 60 S170 40 180 70 V236 C180 262 220 262 220 236 V90 C230 60 260 90 270 64 S300 40 312 60 V282" />
      <text className="bio-lab" x={112} y={26}>proximal tubule</text>
      <text className="bio-lab" x={150} y={278}>loop of Henle</text>
      <text className="bio-lab" x={242} y={36}>distal tubule</text>
      <text className="bio-lab" x={318} y={180} transform="rotate(90 318 180)">collecting duct</text>
      <text className="bio-lab" x={290} y={298}>urine ↓</text>
      {/* what stays in the blood */}
      <g className={filtered ? 'bio-pop' : ''}>
        <circle className="bio-prot" cx={30} cy={40} r={7} />
        <text className="bio-lab" x={8} y={28}>protein stays</text>
      </g>
      {/* what went into the filtrate: dots in the capsule and tubule */}
      {filtered && (
        <g className="bio-pop">
          <circle className="bio-glu" cx={104} cy={50} r={5} />
          <circle className="bio-h2o" cx={124} cy={62} r={5} />
          <circle className="bio-urea" cx={146} cy={56} r={5} />
        </g>
      )}
      {/* glucose back into the blood at the proximal tubule */}
      {stage >= 2 && (
        <g className="bio-pop">
          <path className="bio-back" d="M130 70 V100" />
          <text className="bio-lab" x={86} y={114}>glucose back ↑ blood</text>
        </g>
      )}
      {/* water back along the loop and the duct */}
      {stage >= 3 && (
        <g className="bio-pop">
          <path className="bio-back" d="M180 150 H150 M220 150 H250 M312 220 H282" />
          <text className="bio-lab" x={232} y={142}>water back</text>
        </g>
      )}
      {stage >= 4 && <circle className="bio-urea bio-pop" cx={312} cy={262} r={6} />}
      {stage >= 5 && <path className="bio-adh bio-pop" d="M296 120 h32 M296 140 h32 M296 160 h32" />}
      <g className="bio-key-legend">
        <circle className="bio-glu" cx={16} cy={170} r={5} />
        <text className="bio-lab" x={26} y={174}>glucose</text>
        <circle className="bio-h2o" cx={16} cy={188} r={5} />
        <text className="bio-lab" x={26} y={192}>water</text>
        <circle className="bio-urea" cx={16} cy={206} r={5} />
        <text className="bio-lab" x={26} y={210}>urea</text>
        <circle className="bio-prot" cx={16} cy={224} r={5} />
        <text className="bio-lab" x={26} y={228}>protein</text>
      </g>
    </svg>
  )
}

/* ---------- muscle: one sarcomere ---------- */

function SarcomerePic({ stage }: { stage: number }) {
  const c = stage >= 1 ? 1 : 0 // contracted after the first answer
  const z = 36 * c // how far each Z line moves in
  const heads = Array.from({ length: 6 }, (_, k) => 130 + k * 20)
  return (
    <svg className="bio-svg bio-anat" viewBox="0 0 360 220" role="img" aria-label={c ? 'contracted sarcomere: the Z lines are closer and the filaments overlap more' : 'relaxed sarcomere'}>
      <g className="bio-slide" style={{ transform: `translateX(${z}px)` }}>
        <line className="bio-zline" x1={30} x2={30} y1={40} y2={160} />
        {[60, 100, 140].map((y) => <line key={y} className="bio-actin" x1={30} x2={150} y1={y} y2={y} />)}
        <text className="bio-lab" x={20} y={32}>Z line</text>
      </g>
      <g className="bio-slide" style={{ transform: `translateX(${-z}px)` }}>
        <line className="bio-zline" x1={330} x2={330} y1={40} y2={160} />
        {[60, 100, 140].map((y) => <line key={y} className="bio-actin" x1={210} x2={330} y1={y} y2={y} />)}
      </g>
      {/* myosin: thick filaments with heads, fixed in the middle */}
      {[80, 120].map((y) => (
        <g key={y}>
          <line className="bio-myosin" x1={110} x2={250} y1={y} y2={y} />
          {heads.map((hx) => <path key={hx} className="bio-head" d={`M${hx} ${y} l6 -10 M${hx} ${y} l6 10`} />)}
        </g>
      ))}
      <text className="bio-lab" x={154} y={28}>myosin (thick)</text>
      <text className="bio-lab bio-actin-t" x={60 + z} y={176}>actin (thin)</text>
      {/* A band = myosin length; it never changes */}
      {stage >= 2 && (
        <g className="bio-pop">
          <path className="bio-band" d="M110 196 v-8 h140 v8" />
          <text className="bio-lab" x={180} y={212} textAnchor="middle">A band: same length</text>
        </g>
      )}
      {stage >= 3 && <text className="bio-lab bio-pop bio-ca" x={6} y={208}>Ca²⁺ → troponin → sites open</text>}
      {stage >= 4 && <text className="bio-lab bio-pop" x={250} y={208}>ATP → head lets go</text>}
    </svg>
  )
}

export const HeartStep = (p: StepProps) => <Walkthrough {...p} qs={HEART} picture={(s) => <HeartPic stage={s} />} />
export const KidneyStep = (p: StepProps) => <Walkthrough {...p} qs={KIDNEY} picture={(s) => <NephronPic stage={s} />} />
export const MuscleStep = (p: StepProps) => <Walkthrough {...p} qs={MUSCLE} picture={(s) => <SarcomerePic stage={s} />} />
