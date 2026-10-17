// The "Try any topic" index: one entry per hand-checked extra round. Shared by the dev server
// (<base>rounds/extra/index.json) and the build (virtual:extra-index), so no Node or DOM here.
// A data file with no aliases (or a non-list) still counts, with aliases [].

export type ExtraTopic = { slug: string; topic: string; aliases: string[] }

export function extraIndex(rounds: unknown[]): ExtraTopic[] {
  return rounds
    .filter((d): d is Record<string, unknown> => typeof d === 'object' && d !== null)
    .filter((d) => d.reviewed === true && typeof d.slug === 'string' && typeof d.topic === 'string')
    .map((d) => ({
      slug: d.slug as string,
      topic: d.topic as string,
      aliases: Array.isArray(d.aliases) ? d.aliases.filter((a): a is string => typeof a === 'string') : [],
    }))
}
