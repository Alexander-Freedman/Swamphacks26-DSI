// What you can practice in statistics, grouped by chapter so you pick on purpose. Topics not
// built yet stay on the menu as "coming next" so the whole map of the subject is visible.

export type StatTopic = {
  id: string
  title: string
  blurb: string
  ready: boolean
  /** the step from this folder that plays it */
  step?: 'clt'
}

export type StatSection = { id: string; title: string; blurb: string; topics: StatTopic[] }

const soon = (id: string, title: string, blurb: string): StatTopic => ({ id, title, blurb, ready: false })

export const SECTIONS: StatSection[] = [
  {
    id: 'describing',
    title: 'Describing data',
    blurb: 'One number to sum up a pile of numbers, and when it lies.',
    topics: [
      soon('mean-median', 'Mean vs median', 'Drag one value far out and watch which center follows it.'),
      soon('spread', 'What standard deviation measures', 'Squeeze and stretch the dots and read the spread off a ruler.'),
    ],
  },
  {
    id: 'normal',
    title: 'The normal curve',
    blurb: 'The bell shape, and how to read positions and areas on it.',
    topics: [
      soon('z-scores', 'z-scores', 'Line two tests up on one ruler: which score is more impressive?'),
      soon('areas', 'Areas under the curve', 'Shade a slice of the bell and read off the share of people in it.'),
    ],
  },
  {
    id: 'sampling',
    title: 'Sampling',
    blurb: 'What happens when you average many random draws.',
    topics: [
      { id: 'clt', title: 'Averages pile into a bell curve', blurb: 'The central limit theorem: average lopsided bus waits over and over and watch a bell appear.', ready: true, step: 'clt' },
      soon('lln', 'The law of large numbers', 'Keep sampling and watch the running average settle down.'),
    ],
  },
  {
    id: 'relationships',
    title: 'Relationships',
    blurb: 'Two variables at once: do they move together?',
    topics: [
      soon('regression', 'The best-fit line', 'Drag points around and watch the line chase them.'),
      soon('correlation', 'Correlation is not causation', 'Ice cream and sunburns rise together. Find the hidden cause.'),
    ],
  },
  {
    id: 'testing',
    title: 'Testing ideas',
    blurb: 'How surprised should you be by what you saw?',
    topics: [
      soon('pvalue', 'A p-value is an area', 'Shade the tail of the curve beyond your result.'),
      soon('ci', 'Confidence intervals', 'Draw 20 intervals and count how many catch the truth.'),
    ],
  },
]
