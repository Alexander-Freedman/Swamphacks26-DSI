// What you can practice in programming, grouped by chapter so you pick on purpose. A topic is a list
// of steps from the session. Topics that aren't built yet stay on the menu as "coming next" so the
// whole map of the subject is visible.

export type ProgStep = 'stack'

export type ProgTopic = {
  id: string
  title: string
  blurb: string
  steps: ProgStep[]
  /** false = on the menu, not playable yet */
  ready: boolean
}

export type ProgSection = { id: string; title: string; blurb: string; topics: ProgTopic[] }

const soon = (id: string, title: string, blurb: string): ProgTopic => ({ id, title, blurb, steps: [], ready: false })

export const SECTIONS: ProgSection[] = [
  {
    id: 'basics',
    title: 'How code runs',
    blurb: 'What the computer actually does, one line at a time.',
    topics: [
      soon('variables', 'Variables are labeled boxes', 'Watch values move between boxes as each line runs.'),
      soon('loops', 'Loops, step by step', 'Follow a loop around and predict when it stops.'),
    ],
  },
  {
    id: 'recursion',
    title: 'Recursion',
    blurb: 'A function that calls itself, and the stack that keeps track.',
    topics: [
      { id: 'call-stack', title: 'Watch the call stack', blurb: 'Run factorial(4) and see every call wait on the one above it.', steps: ['stack'], ready: true },
      soon('fib-tree', 'Why fib(n) is slow', 'Draw the call tree and count the repeated work.'),
    ],
  },
  {
    id: 'algorithms',
    title: 'Algorithms',
    blurb: 'Recipes for searching and sorting, raced side by side.',
    topics: [
      soon('binary-search', 'Binary search', 'Halve the list each guess and watch how few steps it takes.'),
      soon('sorting', 'Sorting, raced', 'Bubble sort vs merge sort on the same bars.'),
      soon('big-o', 'How fast is fast?', 'Grow the input and watch the step counts pull apart.'),
    ],
  },
  {
    id: 'data',
    title: 'Data structures',
    blurb: 'Ways to arrange data, and what each makes quick or slow.',
    topics: [
      soon('arrays-lists', 'Arrays vs linked lists', 'Insert in the middle of each and count the moves.'),
      soon('stacks-queues', 'Stacks and queues', 'Last in, first out vs first in, first out.'),
      soon('trees', 'Binary search trees', 'Drop numbers in and watch the tree grow.'),
    ],
  },
  {
    id: 'memory',
    title: 'Memory',
    blurb: 'Where values live, and what a reference really points to.',
    topics: [soon('references', 'Copies vs references', 'Change one list and see which other names change too.')],
  },
]

export const TOPICS: ProgTopic[] = SECTIONS.flatMap((s) => s.topics)
