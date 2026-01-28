import { useEffect, useState } from "react"

export function useCountdown(initialSeconds: number) {
  const [seconds, setSeconds] = useState<number>(initialSeconds)

  useEffect(() => {
    if (seconds <= 0) {
      return
    }

    const timer = setInterval(() => {
      setSeconds((current) => Math.max(0, current - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [seconds])

  useEffect(() => {
    setSeconds(initialSeconds)
  }, [initialSeconds])

  const startTimer = (seconds?: number) => {
    setSeconds(seconds ?? 0)
  }

  return [seconds, startTimer] as const
}
