// The learner's rule as a short frame: "When ___, then ___, because ___."
// Contrast writes it; Stress tests it and grows it piece by piece.

/** The topic's pieces as short chips: the name before any explanation. */
export const shortPiece = (entity: string) => {
  const head = entity.split(/[:;(]| - |, which|, the /)[0].trim().replace(/[.,]$/, '')
  return head.length > 40 ? `${head.slice(0, 39).replace(/\s+\S*$/, '')}…` : head
}

export const composeRule = ([when, then, because]: [string, string, string]) => {
  const w = when.trim()
  const t = then.trim()
  const b = because.trim()
  if (!w && !t && !b) return ''
  return `When ${w || '…'}, ${t || '…'}${b ? `, because ${b}` : ''}.`
}

/** Back from the composed sentence into the three blanks (a hand-written rule lands in the first). */
export function splitRule(rule: string): [string, string, string] {
  const m = rule.match(/^When (.*?), (.*?)(?:, because (.*?))?\.?$/)
  if (!m) return [rule, '', '']
  const clean = (x?: string) => (x && x !== '…' ? x : '')
  return [clean(m[1]), clean(m[2]), clean(m[3])]
}
