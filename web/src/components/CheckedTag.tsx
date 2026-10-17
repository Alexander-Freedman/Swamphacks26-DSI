// A quiet note on where the round came from, explained on hover/long-press, not a badge.
const CHECKED_TIPS = {
  'hand-checked': 'A person checked every answer and source in this round.',
  'auto-checked': 'Built just now. Our code recomputed every answer, but no person has read it yet.',
} as const

export function CheckedTag({ reviewed }: { reviewed: boolean }) {
  const label = reviewed ? 'hand-checked' : 'auto-checked'
  return (
    <span className="checked-tag" title={CHECKED_TIPS[label]}>
      {label}
    </span>
  )
}
