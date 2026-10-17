import { useEffect, useState } from 'react'
import { get, usingMock } from './api'
import { Source } from './components/Source'
import type { Sourced } from './types'
import './App.css'

type Sample = { label: string; reading: Sourced<number> }

export default function App() {
  const [health, setHealth] = useState('...')
  const [sample, setSample] = useState<Sample | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    get<{ status: string }>('/api/health')
      .then((h) => setHealth(h.status))
      .catch((e: Error) => setHealth(`down: ${e.message}`))
    if (usingMock) get<Sample>('/api/sample').then(setSample, (e: Error) => setError(e.message))
  }, [])

  return (
    <div className="shell">
      <header className="bar">
        <h1>Swamphacks26-DSI</h1>
        <span className="status">API: {health}</span>
      </header>
      <main className="main">
        {error && <p className="error">{error}</p>}
        {sample && (
          <p>
            {sample.label}: <Source data={sample.reading} format={(v) => v.toFixed(1)} />
          </p>
        )}
      </main>
    </div>
  )
}
