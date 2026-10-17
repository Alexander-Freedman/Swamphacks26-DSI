import { useId, useState } from 'react'
import type { Provenance, Sourced } from '../types'
import './Source.css'

function when(at?: string) {
  return at ? new Date(at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : null
}

export function SourceNote({ prov }: { prov: Provenance }) {
  return (
    <span className="source-note">
      {prov.source}
      {prov.id && <code> {prov.id}</code>}
      {prov.at && <> · {when(prov.at)}</>}
      {prov.url && (
        <>
          {' '}
          ·{' '}
          <a href={prov.url} target="_blank" rel="noreferrer">
            open
          </a>
        </>
      )}
    </span>
  )
}

// A value with a tap/hover popover naming its source.
export function Source<T extends string | number>({
  data,
  format = String,
}: {
  data: Sourced<T>
  format?: (v: T) => string
}) {
  const [open, setOpen] = useState(false)
  const id = useId()
  return (
    <span
      className="source"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="source-value num"
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {format(data.value)}
      </button>
      {open && (
        <span role="tooltip" id={id} className="source-pop">
          <SourceNote prov={data.prov} />
        </span>
      )}
    </span>
  )
}
