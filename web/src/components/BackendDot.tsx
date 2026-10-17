import { useEffect, useState } from 'react'
import { apiBase, backendHealth } from '../extras'
import './HowItWorks.css'

// Corner dot on Home: hidden on a static site with no backend (Pages), green/red = one GET /api/health
// when a backend is configured. Checked once per page load, never polled.
export function BackendDot() {
  const configured = apiBase() !== null
  const [up, setUp] = useState<boolean | null>(null)
  useEffect(() => {
    if (!configured) return
    let live = true
    backendHealth().then((ok) => live && setUp(ok))
    return () => {
      live = false
    }
  }, [configured])
  // No backend (Pages) is the normal public site, not a fault: show nothing (#173).
  if (!configured) return null
  const [cls, text] = up === null ? ['', 'checking backend'] : up ? ['online', 'backend online'] : ['down', 'backend unreachable']
  const tip = up ? 'The round builder is reachable.' : 'Hand-checked rounds still work; new topics fall back to them.'
  return (
    <span className={`backend-dot ${cls}`} title={tip} data-testid="backend-dot">
      {text}
    </span>
  )
}
