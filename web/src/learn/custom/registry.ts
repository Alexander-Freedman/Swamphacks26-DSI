// Topic-specific tools for Learn steps. A topic folder (custom/<slug>/index.tsx) exports
// `custom = { slug, stages: { anchor?: Screen, stress?: Screen, ... } }`; any stage it names
// replaces the generic screen for that topic only. Folders are picked up automatically, so
// each subject's tools live in their own folder and never touch another's files.
import type { ComponentType } from 'react'
import type { Stage, StageProps } from '../types'

export type CustomStages = {
  slug: string
  stages: Partial<Record<Stage, ComponentType<StageProps>>>
  /** A Home demo card (session slug) that should open this Learn topic instead. */
  homeCard?: string
}

const modules = import.meta.glob<{ custom: CustomStages }>('./*/index.tsx', { eager: true })

const BY_SLUG: Record<string, CustomStages['stages']> = Object.fromEntries(
  Object.values(modules).map((m) => [m.custom.slug, m.custom.stages]),
)

/** The topic's own screen for this stage, if it has one. */
export const customScreen = (slug: string, stage: Stage): ComponentType<StageProps> | undefined => BY_SLUG[slug]?.[stage]

const BY_CARD: Record<string, string> = Object.fromEntries(
  Object.values(modules)
    .filter((m) => m.custom.homeCard)
    .map((m) => [m.custom.homeCard!, m.custom.slug]),
)

/** The Learn topic a Home demo card opens, if a topic folder claimed that card. */
export const learnForCard = (sessionSlug: string): string | undefined => BY_CARD[sessionSlug]
