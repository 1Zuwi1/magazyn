import { useCallback, useEffect, useRef, useState } from "react"

export function useCountdown(initialSeconds: number) {
  const [seconds, setSeconds] = useState<number>(initialSeconds)
  const isActiveRef = useRef(initialSeconds > 0)

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isActiveRef.current) {
        return
      }

      setSeconds((current) => {
        if (current <= 0) {
          isActiveRef.current = false
          return 0
        }
        return Math.max(0, current - 1)
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    setSeconds(initialSeconds)
    isActiveRef.current = initialSeconds > 0
  }, [initialSeconds])

  const startTimer = useCallback((nextSeconds?: number) => {
    const resolvedSeconds = nextSeconds ?? 0
    setSeconds(resolvedSeconds)
    isActiveRef.current = resolvedSeconds > 0
  }, [])

  return [seconds, startTimer] as const
}
