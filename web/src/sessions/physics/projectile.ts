// Projectile motion without air: sideways speed never changes, the fall is the same as a dropped
// ball. Units are meters and seconds; g = 9.8 m/s².

export const G = 9.8

const rad = (deg: number) => (deg * Math.PI) / 180

/** Position at time t for a launch from (0, h0) at speed v and angle deg above the ground. */
export function at(v: number, deg: number, t: number, h0 = 0) {
  return { x: v * Math.cos(rad(deg)) * t, y: h0 + v * Math.sin(rad(deg)) * t - (G * t * t) / 2 }
}

/** Time in the air from height h0 until it lands (y = 0). */
export function flightTime(v: number, deg: number, h0 = 0) {
  const vy = v * Math.sin(rad(deg))
  return (vy + Math.sqrt(vy * vy + 2 * G * h0)) / G
}

/** Where it lands. From the ground this is v² sin 2θ / g, farthest at 45°. */
export const range = (v: number, deg: number, h0 = 0) => v * Math.cos(rad(deg)) * flightTime(v, deg, h0)

/** Speed at the top of the arc: the vertical part is 0, the sideways part never changed. */
export const topSpeed = (v: number, deg: number) => v * Math.cos(rad(deg))

/** Time to fall h meters from rest: the same for a dropped ball and one fired sideways. */
export const fallTime = (h: number) => Math.sqrt((2 * h) / G)

export type ProjMistake = 'sideways-falls-slower' | 'zero-speed-at-top' | 'steeper-goes-farther'

export const PROJ_MISTAKES: Record<ProjMistake, { label: string; line: string }> = {
  'sideways-falls-slower': { label: 'Moving sideways slows the fall', line: 'Gravity pulls both balls down the same way. Sideways speed only carries the fired ball farther; it lands at the same moment.' },
  'zero-speed-at-top': { label: 'A ball stops at the top of its arc', line: 'Only the up-and-down part of the speed is 0 at the top. The sideways part never changes, so it’s still moving.' },
  'steeper-goes-farther': { label: 'Aiming higher always goes farther', line: 'Higher angles stay up longer but move sideways slower. 45° balls the two out; 30° and 60° land in the same spot.' },
}
