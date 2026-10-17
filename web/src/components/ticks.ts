// Round tick spacing (1, 2, 5 x 10^k) giving at most `max` ticks.
export function niceTicks(lo: number, hi: number, max: number): number[] {
  const raw = (hi - lo) / max
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag
  const out: number[] = []
  for (let x = Math.ceil(lo / step) * step; x <= hi + 1e-9; x += step) out.push(Math.round(x * 1e6) / 1e6)
  return out
}
