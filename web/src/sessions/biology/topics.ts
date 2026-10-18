// What you can practice in biology, grouped by chapter, so you pick on purpose instead of a
// fixed path. A topic is a list of steps from the session. Topics that aren't built yet stay
// on the menu as "coming next" so the whole map of the subject is visible.

export type BioStep = 'transcribe' | 'codons' | 'translate' | 'mutate' | 'heart' | 'kidney' | 'muscle'

export type BioTopic = {
  id: string
  title: string
  blurb: string
  steps: BioStep[]
  /** false = on the menu, not playable yet */
  ready: boolean
}

export type BioChapter = { id: string; title: string; blurb: string; topics: BioTopic[] }

const soon = (id: string, title: string, blurb: string): BioTopic => ({ id, title, blurb, steps: [], ready: false })

export const CHAPTERS: BioChapter[] = [
  {
    id: 'cells',
    title: 'Cells',
    blurb: 'Where a cell gets its energy, molecule by molecule.',
    topics: [soon('respiration', 'Cell respiration', 'Follow one glucose through the cell until it becomes ATP.')],
  },
  {
    id: 'genetics',
    title: 'Genetics',
    blurb: 'How a gene becomes a working part, and how traits are passed on.',
    topics: [
      { id: 'dna-protein', title: 'DNA → RNA → protein', blurb: 'Copy a gene into RNA, read it in threes, build the protein, then change one letter.', steps: ['transcribe', 'codons', 'translate', 'mutate'], ready: true },
      soon('punnett', 'Punnett squares', 'Cross two parents and predict what fraction of the kids show the trait.'),
    ],
  },
  {
    id: 'division',
    title: 'Cell division',
    blurb: 'One cell becomes two, or four.',
    topics: [soon('mitosis-meiosis', 'Mitosis vs meiosis', 'Drag the chromosomes into place and see why one makes copies and the other makes sex cells.')],
  },
  {
    id: 'anatomy',
    title: 'Anatomy and physiology',
    blurb: 'How the body’s parts actually work.',
    topics: [
      { id: 'heart', title: 'The heart', blurb: 'Follow one drop of blood through the four chambers and valves, to the lungs and back.', steps: ['heart'], ready: true },
      { id: 'kidney', title: 'The kidney', blurb: 'What the nephron filters out, what it takes back, and what leaves as urine.', steps: ['kidney'], ready: true },
      { id: 'muscle', title: 'Muscle contraction', blurb: 'Watch the filaments slide, and find what Ca²⁺ and ATP each do.', steps: ['muscle'], ready: true },
      soon('action-potential', 'Action potential', 'Open the channels and watch ions cross a nerve cell’s membrane.'),
    ],
  },
]

export const TOPICS: BioTopic[] = CHAPTERS.flatMap((c) => c.topics)
