import { birthdays } from '../truth'
import './DotCalendar.css'

const MONTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
const NAMES = 'JFMAMJJASOND'
const C = 18
const L = 22

// One random room: every birthday as a dot on a year grid, shared days in marker.
export function DotCalendar({ n }: { n: number }) {
  const count = new Map<number, number>()
  for (const d of birthdays(n)) count.set(d, (count.get(d) ?? 0) + 1)
  const shared = [...count.values()].filter((c) => c > 1).length
  let day = 0
  const cells = MONTHS.flatMap((len, m) =>
    Array.from({ length: len }, (_, i) => {
      const c = count.get(day++) ?? 0
      return { m, i, k: c > 1 ? 'shared' : c ? 'one' : 'empty' }
    }),
  )
  return (
    <figure className="cal">
      <svg viewBox={`0 0 ${L + 31 * C} ${12 * C}`} role="img" aria-label={`${n} birthdays, ${shared} shared`}>
        {[...NAMES].map((ch, m) => (
          <text key={m} className="cal-month" x={L / 2} y={m * C + C / 2 + 4} textAnchor="middle">{ch}</text>
        ))}
        {cells.map(({ m, i, k }) => (
          <circle key={`${m}-${i}`} className={`cal-${k}`} cx={L + i * C + C / 2} cy={m * C + C / 2} r={k === 'shared' ? 7 : k === 'one' ? 4.5 : 2} />
        ))}
      </svg>
      <figcaption>
        One random room of <strong>{n}</strong>:{' '}
        {shared ? <><strong>{shared}</strong> shared birthday{shared > 1 ? 's' : ''}</> : 'no match this time'}
      </figcaption>
    </figure>
  )
}
