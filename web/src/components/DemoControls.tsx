import { useEffect, useState } from 'react'
import { isTyping, resetLocal, useCurrent } from '../demo'
import { HowItWorks } from './HowItWorks'
import { StatusDot } from './StatusDot'
import './DemoControls.css'

// Table-demo controls: D opens "How it works", Shift+R (or ?reset=1) wipes this browser's state.
export function DemoControls({ onReset }: { onReset: () => void }) {
  const [open, setOpen] = useState(false)
  const current = useCurrent()

  useEffect(() => {
    const reset = () => {
      resetLocal()
      setOpen(false)
      onReset()
    }
    if (new URLSearchParams(location.search).has('reset')) reset()
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e) || e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === 'd' || e.key === 'D') setOpen((o) => !o)
      else if (e.key === 'R' && e.shiftKey) reset()
      else if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onReset])

  return (
    <div className="demo-controls">
      <button className="hiw-open" onClick={() => setOpen(true)} aria-keyshortcuts="D" title="How it works (D)">
        How it works
      </button>
      <StatusDot />
      {open && <HowItWorks current={current} onClose={() => setOpen(false)} />}
    </div>
  )
}
