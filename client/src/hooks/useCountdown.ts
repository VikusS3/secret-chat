import { useEffect, useState } from 'react'

export function useCountdown(expiresAt?: number): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (expiresAt === undefined) return
    const update = () => setNow(Date.now())
    const timeout = setTimeout(update, 0)
    const interval = setInterval(update, 100)
    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [expiresAt])

  if (expiresAt === undefined) return 0
  return Math.max(expiresAt - now, 0)
}
