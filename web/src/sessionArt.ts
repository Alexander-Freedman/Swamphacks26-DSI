// Card art for Home, keyed by session slug (files in public/art/, see docs/art-manifest.md).
// Built from BASE_URL so it works under /Swamphacks26-DSI/ on Pages too.
const WITH_ART = new Set(['birthday', 'coin-streak', 'positive-test', 'calculus', 'orgo'])

export type CardArt = { src: string; srcSet: string }

export function artFor(slug: string): CardArt | null {
  if (!WITH_ART.has(slug)) return null
  const base = `${import.meta.env.BASE_URL}art/session-${slug}`
  return { src: `${base}-512.webp`, srcSet: `${base}-256.webp 256w, ${base}-512.webp 512w` }
}
