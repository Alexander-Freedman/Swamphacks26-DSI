// What you can practice in calculus, grouped by course (Calc 1, 2, 3) and chapter, so you pick on
// purpose instead of a fixed path. A topic is a list of steps from the session. Topics that aren't
// built yet stay on the menu as "coming next" so the whole map of the subject is visible.

export type CalcStep = 'draw' | 'tangent' | 'area' | 'card' | 'compare' | 'surface' | 'gradient' | 'volume' | 'usub' | 'enclosed' | 'revolution'

export type CalcTopic = {
  id: string
  title: string
  blurb: string
  steps: CalcStep[]
  /** false = on the menu, not playable yet */
  ready: boolean
}

export type CalcSection = { id: string; title: string; blurb: string; topics: CalcTopic[] }
export type CalcCourse = { id: string; title: string; blurb: string; sections: CalcSection[] }

const soon = (id: string, title: string, blurb: string): CalcTopic => ({ id, title, blurb, steps: [], ready: false })

export const COURSES: CalcCourse[] = [
  {
    id: 'calc1',
    title: 'Calc 1',
    blurb: 'Limits, derivatives and the first integrals: one variable, one curve.',
    sections: [
      {
        id: 'limits',
        title: 'Limits',
        blurb: 'Zoom in on a point until the curve stops surprising you.',
        topics: [soon('limit', 'What a limit is', 'Slide toward a point from both sides and watch where the height settles.')],
      },
      {
        id: 'derivatives',
        title: 'Derivatives',
        blurb: 'How steep a curve is at each point: its rate of change.',
        topics: [
          { id: 'slope', title: 'The slope of a curve', blurb: 'Sketch how steep the curve is, then check it with a sliding tangent line.', steps: ['draw', 'tangent', 'card'], ready: true },
          soon('chain', 'Chain rule', 'A function inside a function: watch the two rates multiply.'),
          soon('optimize', 'Maximums and minimums', 'Find where the slope hits 0 and decide which is the max.'),
          soon('related', 'Related rates', 'A ladder slides down a wall: two speeds tied together.'),
        ],
      },
      {
        id: 'integrals',
        title: 'Integrals',
        blurb: 'How much a curve adds up to: the area underneath it.',
        topics: [
          { id: 'area', title: 'Area under a curve', blurb: 'Guess the area, then fill it with thinner and thinner rectangles.', steps: ['area', 'card'], ready: true },
          { id: 'ftc', title: 'Slope and area undo each other', blurb: 'The fundamental theorem: drag time on position and velocity and watch the numbers match.', steps: ['compare'], ready: true },
        ],
      },
    ],
  },
  {
    id: 'calc2',
    title: 'Calc 2',
    blurb: 'Harder integrals, shapes you spin into solids, and infinite sums.',
    sections: [
      {
        id: 'techniques',
        title: 'Integrals, harder',
        blurb: 'Reshape the problem until it’s one you already know.',
        topics: [
          { id: 'usub', title: 'u-substitution', blurb: 'Stretch the x-axis so a messy area becomes a simple one.', steps: ['usub'], ready: true },
          { id: 'enclosed', title: 'Area enclosed by two curves', blurb: 'Top curve minus bottom curve, one thin strip at a time.', steps: ['enclosed'], ready: true },
          { id: 'revolution', title: 'Volumes of revolution', blurb: 'Spin a curve around an axis and stack the discs into a solid.', steps: ['revolution'], ready: true },
        ],
      },
      {
        id: 'series',
        title: 'Series',
        blurb: 'Adding up infinitely many pieces, and when that gives a number.',
        topics: [
          soon('taylor', 'Taylor polynomials', 'Add terms one at a time and watch the polynomial hug the curve.'),
          soon('converge', 'Does it add up?', 'Stack the terms as bars and see whether the total levels off.'),
        ],
      },
      {
        id: 'polar',
        title: 'Parametric and polar',
        blurb: 'Curves drawn by a moving point instead of y = f(x).',
        topics: [soon('polar', 'Polar curves', 'Sweep an angle around and watch r trace a rose.')],
      },
    ],
  },
  {
    id: 'calc3',
    title: 'Calc 3',
    blurb: 'Two inputs, so the graph is a surface in 3D. Turn it around to see it.',
    sections: [
      {
        id: 'surfaces',
        title: 'Surfaces',
        blurb: 'z = f(x, y): a height above every spot on the floor.',
        topics: [
          { id: 'surface', title: 'Slices of a surface', blurb: 'Turn a 3D surface around, slice it, and read the partial derivatives off the cuts.', steps: ['surface'], ready: true },
          { id: 'gradient', title: 'The gradient', blurb: 'The arrow on the floor that points straight uphill. Follow it to the top.', steps: ['gradient'], ready: true },
          soon('contour', 'Contour maps', 'Flatten the hills into a topographic map and read it back.'),
        ],
      },
      {
        id: 'multiple',
        title: 'Multiple integrals',
        blurb: 'Volume under a surface, built from columns.',
        topics: [{ id: 'double', title: 'Volume under a surface', blurb: 'Fill the space under a surface with thinner and thinner columns.', steps: ['volume'], ready: true }],
      },
      {
        id: 'vector',
        title: 'Vector calculus',
        blurb: 'Arrows everywhere: flow, spin and work.',
        topics: [soon('field', 'Vector fields', 'Drop a leaf in a flow and watch where the arrows carry it.')],
      },
    ],
  },
  {
    id: 'path',
    title: 'Guided path',
    blurb: 'Calc 1 in order, with your mistakes named at the end.',
    sections: [
      {
        id: 'path',
        title: 'Start to finish',
        blurb: 'Slope, tangent, area, what your pencil got wrong, then slope and area side by side.',
        topics: [{ id: 'full', title: 'Start to finish', blurb: 'All five screens, about five minutes.', steps: ['draw', 'tangent', 'area', 'card', 'compare'], ready: true }],
      },
    ],
  },
]

export const SECTIONS: CalcSection[] = COURSES.flatMap((c) => c.sections)
export const TOPICS: CalcTopic[] = SECTIONS.flatMap((s) => s.topics)
