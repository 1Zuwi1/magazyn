import { useCallback, useEffect, useState } from "react"

export function useCountdown(initialSeconds: number) {
  const [seconds, setSeconds] = useState<number>(initialSeconds)
  const isActive = seconds > 0

  useEffect(() => {
    setSeconds(initialSeconds)
  }, [initialSeconds])

  useEffect(() => {
    if (!isActive) {
      return
    }

    const timer = setInterval(() => {
      setSeconds((current) => Math.max(0, current - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [isActive])

  const startTimer = useCallback((nextSeconds?: number) => {
    const resolvedSeconds = nextSeconds ?? 0
    setSeconds(resolvedSeconds)
  }, [])

  return [seconds, startTimer] as const
}
