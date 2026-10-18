// Calc 1, the chain rule (Chain.tsx draws it).
//
// Three number lines: x, then u = g(x), then y = f(u). A small step in x becomes a step in u
// (stretched by g'), which becomes a step in y (stretched by f'). The two stretches multiply.
//
// Warm-up, straight lines: u = 2x + 1 (every 1 of x is 2 of u), y = 3u − 2 (every 1 of u is 3 of y).
// So 1 of x is 2 · 3 = 6 of y, not 2 + 3.
// The real one: u = x², y = sin u. dy/dx = cos(x²) · 2x.

export const g1 = (x: number) => 2 * x + 1
export const f1 = (u: number) => 3 * u - 2
export const G1 = 2
export const F1 = 3

export const g2 = (x: number) => x * x
export const g2p = (x: number) => 2 * x
export const f2 = (u: number) => Math.sin(u)
export const f2p = (u: number) => Math.cos(u)
/** dy/dx for y = sin(x²). */
export const chain2 = (x: number) => f2p(g2(x)) * g2p(x)

/** x runs over [0, X1] on the real one. */
export const X1 = 2

/** Where y stands still even though x moves: the outer rate cos(x²) is 0 at x² = π/2. */
export const STILL = Math.sqrt(Math.PI / 2)
/** Close enough to a still spot: |dy/dx| small and well away from x = 0 (where the inner rate is 0 instead). */
export const isStill = (x: number) => x > 0.4 && Math.abs(chain2(x)) < 0.25

export type ChainMistake = 'chain-rates-add' | 'chain-outer-only'
export const CHAIN_LABELS: Record<ChainMistake, string> = {
  'chain-rates-add': 'Chain rule: the rates add',
  'chain-outer-only': 'Chain rule: only the outside counts',
}
