import { useEffect, useState } from 'react'
import './StatusDot.css'

const POLL_MS = 15_000
const TIMEOUT_MS = 2_000

async function healthy(base: string): Promise<boolean> {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${base}/api/health`, { signal: ctl.signal, cache: 'no-store' })
    return res.ok && (await res.json())?.status === 'ok'
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

export function StatusDot() {
  const base = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') ?? ''
  const [up, setUp] = useState(false)

  useEffect(() => {
    if (!base) return
    let live = true
    const check = () => healthy(base).then((ok) => live && setUp(ok))
    check()
    const id = setInterval(check, POLL_MS)
    return () => {
      live = false
      clearInterval(id)
    }
  }, [base])

  const on = !!base && up
  const label = on ? 'Backend reachable: live topics on' : base ? 'Backend unreachable: static mode' : 'Static mode: no API configured'
  return <span className={`status-dot ${on ? 'up' : 'down'}`} role="status" aria-label={label} title={label} />
}
