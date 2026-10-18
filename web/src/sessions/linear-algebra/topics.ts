// What you can practice in linear algebra, grouped by chapter so you pick on purpose. Topics not
// built yet are listed here (the map of the subject) but stay off the menu until built.

export type LinTopic = { id: string; title: string; blurb: string; ready: boolean; step?: 'transform' }
export type LinSection = { id: string; title: string; blurb: string; topics: LinTopic[] }

const soon = (id: string, title: string, blurb: string): LinTopic => ({ id, title, blurb, ready: false })

export const SECTIONS: LinSection[] = [
  {
    id: 'vectors',
    title: 'Vectors',
    blurb: 'Arrows you can add, stretch and combine.',
    topics: [
      soon('adding', 'Adding vectors', 'Put arrows tip to tail and see where you end up.'),
      soon('span', 'Span', 'Mix two arrows in every amount: what can you reach?'),
    ],
  },
  {
    id: 'matrices',
    title: 'Matrices',
    blurb: 'A matrix is a move of the whole plane.',
    topics: [
      { id: 'transform', title: 'A matrix moves the whole grid', blurb: 'Drag the two basis arrows and watch every point follow, then squash the plane flat.', ready: true, step: 'transform' },
      soon('multiply', 'Multiplying matrices', 'Do one move, then another: the product is both at once.'),
      soon('inverse', 'Undoing a move', 'Find the matrix that puts the grid back.'),
    ],
  },
  {
    id: 'eigen',
    title: 'Eigenvectors',
    blurb: 'The arrows a matrix only stretches, never turns.',
    topics: [soon('eigenvectors', 'Arrows that stay on their line', 'Spin a test arrow around and catch the ones that don’t turn.')],
  },
  {
    id: 'systems',
    title: 'Systems of equations',
    blurb: 'Lines that cross, or don’t.',
    topics: [soon('two-lines', 'Two equations, two lines', 'Drag the lines and watch the solution point move, or vanish.')],
  },
]
