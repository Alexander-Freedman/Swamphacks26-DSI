import { useEffect, useState } from 'react'

// Charts use a narrower viewBox on phones so their text isn't scaled down to ~6px.
const QUERY = '(max-width: 560px)'
const media = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(QUERY) : null)

export function useNarrow(): boolean {
  const [narrow, setNarrow] = useState(() => media()?.matches ?? false)
  useEffect(() => {
    const mq = media()
    if (!mq) return
    const on = () => setNarrow(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return narrow
}
