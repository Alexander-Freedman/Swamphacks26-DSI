// Axis labels that fit: see FitText in Curve.tsx.

/** Shorter and shorter versions of an axis label: whole, without its "(unit)", then fewer words with "…". */
export function labelFits(label: string): string[] {
  const out = [label]
  const bare = label.replace(/\s*\([^)]*\)\s*$/, '').trim()
  if (bare && bare !== label) out.push(bare)
  const words = bare.split(/\s+/)
  for (let n = words.length - 1; n >= 1; n--) out.push(`${words.slice(0, n).join(' ')}…`)
  return out
}
