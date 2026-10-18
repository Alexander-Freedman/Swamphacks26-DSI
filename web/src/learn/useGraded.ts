// Every model-graded call takes 5-10 s: screens show "thinking…" while `busy`, and
// "offline check" when the result came from the pre-authored fallback.
import { useCallback, useEffect, useRef, useState } from 'react'
import { isOffline, type Offline, type Result } from './types'

export function useGraded<Req, Res>(call: (body: Req) => Promise<Result<Res>>) {
  const [busy, setBusy] = useState(false)
  const [offline, setOffline] = useState<Offline | null>(null)
  const live = useRef(true)
  useEffect(() => {
    live.current = true
    return () => {
      live.current = false
    }
  }, [])
  const run = useCallback(
    async (body: Req): Promise<Res | null> => {
      setBusy(true)
      setOffline(null)
      try {
        const r = await call(body)
        if (!live.current) return null
        if (isOffline(r)) {
          setOffline(r)
          return null
        }
        return r
      } finally {
        if (live.current) setBusy(false)
      }
    },
    [call],
  )
  return { run, busy, offline }
}

/** Screen copy for an Offline result. */
export const offlineText = (o: Offline) =>
  o.reason === 'codex_unavailable' ? 'thinking is offline, prebuilt topics still work' : "can't reach the server right now"
