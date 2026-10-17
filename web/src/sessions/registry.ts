import type { ComponentType } from 'react'

// A visual session: one concept, ~2-3 min (docs/experience.md).
// Each session lives in its own folder and exports `session` from index.tsx;
// they're picked up here, so adding one never touches another session's files.
export type SessionProps = { onDone: () => void }

export type SessionDef = {
  slug: string
  title: string
  blurb: string
  order: number
  /** false keeps a session off Home (and out of "next" suggestions); its URL still opens it. */
  home?: boolean
  Component: ComponentType<SessionProps>
}

const modules = import.meta.glob<{ session: SessionDef }>('./*/index.tsx', { eager: true })

export const sessions: SessionDef[] = Object.values(modules)
  .map((m) => m.session)
  .sort((a, b) => a.order - b.order)

/** The sessions Home shows, in order: the subject ones lead (orgo, calculus). */
export const homeSessions = sessions.filter((s) => s.home !== false)

export const sessionFor = (slug: string | null) => sessions.find((s) => s.slug === slug)
