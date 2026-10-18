// What you can practice in physics, grouped by chapter so you pick on purpose. Topics not built
// yet stay on the menu as "coming next" so the whole map of the subject is visible.

export type PhysTopic = { id: string; title: string; blurb: string; ready: boolean; step?: 'projectile' }
export type PhysSection = { id: string; title: string; blurb: string; topics: PhysTopic[] }

const soon = (id: string, title: string, blurb: string): PhysTopic => ({ id, title, blurb, ready: false })

export const SECTIONS: PhysSection[] = [
  {
    id: 'motion',
    title: 'Motion',
    blurb: 'Where things go, and how fast, drawn as they move.',
    topics: [
      { id: 'projectile', title: 'Projectile motion', blurb: 'Fire a ball sideways next to a dropped one, then aim for a target.', ready: true, step: 'projectile' },
      soon('graphs', 'Position, velocity, acceleration', 'Drive a car and watch all three graphs draw themselves.'),
      soon('relative', 'Relative motion', 'Walk on a moving train: who sees what speed?'),
    ],
  },
  {
    id: 'forces',
    title: 'Forces',
    blurb: 'Pushes and pulls, and why things speed up or don’t.',
    topics: [
      soon('fbd', 'Free-body diagrams', 'Drag force arrows onto a box and predict which way it moves.'),
      soon('incline', 'Friction on a ramp', 'Tilt the ramp until the block starts to slide.'),
      soon('circular', 'Circular motion', 'Cut the string: which way does the ball fly?'),
    ],
  },
  {
    id: 'energy',
    title: 'Energy and momentum',
    blurb: 'What gets traded, and what’s always conserved.',
    topics: [
      soon('coaster', 'Roller coaster energy', 'Watch height energy pour into speed energy and back.'),
      soon('collisions', 'Collisions', 'Crash carts together and track the momentum arrows.'),
    ],
  },
  {
    id: 'waves',
    title: 'Waves',
    blurb: 'Ripples that pass through each other.',
    topics: [
      soon('interference', 'Interference', 'Two sources rippling: find the bright and dark lines.'),
      soon('standing', 'Standing waves', 'Shake a string until it locks into a pattern.'),
    ],
  },
  {
    id: 'electricity',
    title: 'Electricity',
    blurb: 'Charge in motion, drawn as flow.',
    topics: [
      soon('circuits', 'Circuits as water flow', 'Predict which bulb shines brightest, then watch the current.'),
      soon('fields', 'Electric field lines', 'Drop charges and watch the lines bend between them.'),
    ],
  },
  {
    id: 'gravity',
    title: 'Gravity and orbits',
    blurb: 'Falling, but missing the ground.',
    topics: [soon('orbits', 'Orbits', 'Fling a moon and watch gravity bend its path into an orbit.')],
  },
]
