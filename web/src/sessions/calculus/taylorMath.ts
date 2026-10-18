// Calc 2, Taylor polynomials (Taylor.tsx draws it).
//
// The curve: sin x, around the centre x = 0. Its Taylor polynomial with n (nonzero) terms:
//   P_n(x) = x − x³/3! + x⁵/5! − … ± x^(2n−1)/(2n−1)!
// Near 0 the polynomial hugs the curve; far out it peels away, however many terms you add.

export const X_MAX = 7
export const MAX_TERMS = 8
/** "Close" means within this of sin x. */
export const TOL = 0.1

export const target = (x: number) => Math.sin(x)

const factorial = (k: number) => {
  let f = 1
  for (let i = 2; i <= k; i++) f *= i
  return f
}

/** The k-th term (k = 0, 1, 2, …) of the series: (−1)^k x^(2k+1) / (2k+1)!. */
export const term = (x: number, k: number) => ((k % 2 ? -1 : 1) * Math.pow(x, 2 * k + 1)) / factorial(2 * k + 1)

/** The Taylor polynomial with n terms (degree 2n − 1). */
export function taylor(x: number, n: number): number {
  let s = 0
  for (let k = 0; k < n; k++) s += term(x, k)
  return s
}

export const gap = (x: number, n: number) => Math.abs(target(x) - taylor(x, n))

/**
 * How far from 0 the n-term polynomial stays within `tol` of sin x: the largest x such that
 * the gap is at most `tol` all the way from 0 to x. X_MAX if it never leaves.
 */
export function goodRadius(n: number, tol = TOL, step = 0.01): number {
  for (let x = 0; x <= X_MAX + 1e-9; x += step) if (gap(x, n) > tol) return Math.max(0, x - step)
  return X_MAX
}

const SUP = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹']
const sup = (p: number) => String(p).split('').map((c) => SUP[+c]).join('')

/** The terms as text, with signs: ['x', '− x³/6', '+ x⁵/120', '− x⁷/5040', '+ x⁹/9!', …]. */
export function termText(n: number): string[] {
  const out: string[] = []
  for (let k = 0; k < n; k++) {
    const p = 2 * k + 1
    const denom = p <= 7 ? String(factorial(p)) : `${p}!`
    out.push(k === 0 ? 'x' : `${k % 2 ? '−' : '+'} x${sup(p)}/${denom}`)
  }
  return out
}

export type TaylorMistake = 'taylor-good-everywhere'
export const TAYLOR_LABELS: Record<TaylorMistake, string> = { 'taylor-good-everywhere': 'More terms = close everywhere' }
