import type { Round } from './types'

// Showcase rounds ship inside the bundle, so the demo plays with no API and no network.
const bundled = import.meta.glob<Round>('../../data/rounds/*.json', { eager: true, import: 'default' })
const showcase: Record<string, Round> = Object.fromEntries(Object.values(bundled).map((r) => [r.slug, r]))

export const showcaseSlugs = ['coin-streak', 'positive-test', 'birthday'].filter((s) => s in showcase)

export function showcaseRound(slug: string): Round | undefined {
  return showcase[slug]
}

export async function loadRound(slug: string): Promise<{ round: Round; from: 'api' | 'bundled' }> {
  const local = showcase[slug]
  if (local) return { round: local, from: 'bundled' }
  const res = await fetch(`/api/rounds/${encodeURIComponent(slug)}`)
  if (!res.ok) throw new Error(`round ${slug}: ${res.status}`)
  return { round: (await res.json()) as Round, from: 'api' }
}
