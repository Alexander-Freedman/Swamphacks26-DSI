import { MECHS, mechScene } from './mechs'
import { Scene } from './Scene'
import { RX, sceneAt, VH, type Scene as S } from './sn2'

// The starting picture of each orgo topic, small, on its menu card. Decorative: the title says it.

const ETHANOL: S = {
  atoms: [
    { id: 'c1', el: 'C', x: 150, y: 85, lp: [], charge: 0, partial: false, opacity: 1 },
    { id: 'c2', el: 'C', x: 212, y: 85, lp: [], charge: 0, partial: false, opacity: 1 },
    { id: 'o', el: 'O', x: 274, y: 85, lp: [90, 270], charge: 0, partial: false, opacity: 1 },
    { id: 'ho', el: 'H', x: 320, y: 85, lp: [], charge: 0, partial: false, opacity: 1 },
    ...[
      [104, 85],
      [150, 39],
      [150, 131],
      [212, 39],
      [212, 131],
    ].map(([x, y], i) => ({ id: `h${i}`, el: 'H' as const, x, y, lp: [], charge: 0, partial: false, opacity: 1 })),
  ],
  bonds: [
    ['c1', 'c2'],
    ['c2', 'o'],
    ['o', 'ho'],
    ['c1', 'h0'],
    ['c1', 'h1'],
    ['c1', 'h2'],
    ['c2', 'h3'],
    ['c2', 'h4'],
  ].map(([a, b]) => ({ id: `${a}-${b}`, a, b, order: 1, dashed: false, opacity: 1 })),
  pair: null,
}

const PICTURE: Record<string, () => { scene: S; vh: number }> = {
  'build-ethanol': () => ({ scene: ETHANOL, vh: VH }),
  full: () => ({ scene: ETHANOL, vh: VH }),
  sn2: () => ({ scene: sceneAt(RX['oh-mebr'], 0), vh: VH }),
  sn1: () => ({ scene: mechScene(MECHS.sn1, 0), vh: MECHS.sn1.vh }),
  e2: () => ({ scene: mechScene(MECHS.e2, 0), vh: MECHS.e2.vh }),
  e1: () => ({ scene: mechScene(MECHS.e1, 0), vh: MECHS.e1.vh }),
  'sn2-vs-e2': () => ({ scene: mechScene(MECHS.e2, 0.5), vh: MECHS.e2.vh }),
}

export function Thumb({ topic }: { topic: string }) {
  const p = PICTURE[topic]?.()
  if (!p) return null
  return (
    <span className="og-thumb" aria-hidden="true">
      <Scene scene={p.scene} vh={p.vh} label="" />
    </span>
  )
}
