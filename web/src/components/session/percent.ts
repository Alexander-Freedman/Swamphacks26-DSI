// One percent formatter for the session shell (#161): never "100.0%" for a chance below 1,
// never "0.0%" for one above 0. Same cap as the birthday session's ">99.9%".

/** 0.9997 → ">99.9%" (1 decimal), 0.996 → ">99%" (0 decimals), 0.00004 → "<0.1%"; exactly 0 and 1 read "0%" and "100%". */
export function percent(p: number, digits = 1): string {
  if (!Number.isFinite(p)) return '-'
  if (p >= 1) return '100%'
  if (p <= 0) return '0%'
  const step = 10 ** -digits
  const s = (p * 100).toFixed(digits)
  if (Number(s) >= 100) return `>${(100 - step).toFixed(digits)}%`
  if (Number(s) <= 0) return `<${step.toFixed(digits)}%`
  return `${s}%`
}
