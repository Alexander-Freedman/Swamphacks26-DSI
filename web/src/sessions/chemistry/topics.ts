// What you can practice in general chemistry, grouped by chapter so you pick on purpose. Topics
// not built yet stay on the menu as "coming next" so the whole map of the subject is visible.

export type ChemTopic = { id: string; title: string; blurb: string; ready: boolean; step?: 'shapes' }
export type ChemSection = { id: string; title: string; blurb: string; topics: ChemTopic[] }

const soon = (id: string, title: string, blurb: string): ChemTopic => ({ id, title, blurb, ready: false })

export const SECTIONS: ChemSection[] = [
  {
    id: 'atoms',
    title: 'Atoms',
    blurb: 'Where the electrons are, and why it matters.',
    topics: [
      soon('orbitals', 'Electron orbitals in 3D', 'Turn s, p and d clouds around and see where electrons live.'),
      soon('config', 'Filling the electron boxes', 'Drop electrons into orbitals in order and watch the table appear.'),
      soon('trends', 'Periodic trends', 'Watch atom size shrink across a row and grow down a column.'),
    ],
  },
  {
    id: 'bonding',
    title: 'Bonding',
    blurb: 'How atoms share electrons, and the shapes that makes.',
    topics: [
      { id: 'shapes', title: 'Molecule shapes in 3D', blurb: 'Rotate CH₄, NH₃ and H₂O, predict each shape, and see the lone pairs push.', ready: true, step: 'shapes' },
      soon('polarity', 'Polar or not?', 'Add up the bond arrows and see if they cancel.'),
    ],
  },
  {
    id: 'gases',
    title: 'Gases',
    blurb: 'Particles in a box, bouncing.',
    topics: [soon('gas-laws', 'Gas laws', 'Squeeze the box, heat it, and watch the pressure gauge.')],
  },
  {
    id: 'reactions',
    title: 'Reactions',
    blurb: 'Atoms rearranged, never lost.',
    topics: [
      soon('balancing', 'Balancing equations', 'Count atoms on both sides with blocks until they match.'),
      soon('equilibrium', 'Equilibrium', 'Push a reaction and watch it push back (Le Chatelier).'),
    ],
  },
  {
    id: 'acids',
    title: 'Acids and bases',
    blurb: 'Who gives away H⁺, and what pH really counts.',
    topics: [
      soon('ph', 'The pH scale', 'Each step is ten times more H⁺: see it as stacks of ions.'),
      soon('titration', 'Titration curves', 'Drip in base and watch the pH jump at the equivalence point.'),
    ],
  },
]
