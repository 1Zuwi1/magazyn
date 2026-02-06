"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"

interface VoiceAssistantConfirmViewProps {
  transcript: string
  commandLabel: string
  onConfirm: () => void
  onCancel: () => void
  autoExecuteDelay?: number
}

export function VoiceAssistantConfirmView({
  transcript,
  commandLabel,
  onConfirm,
  onCancel,
  autoExecuteDelay = 5000,
}: VoiceAssistantConfirmViewProps) {
  const [timeLeft, setTimeLeft] = useState(autoExecuteDelay)
  const hasConfirmedRef = useRef(false)
  const handleConfirm = useCallback(() => {
    if (hasConfirmedRef.current) {
      return
    }
    hasConfirmedRef.current = true
    onConfirm()
  }, [onConfirm])

  useEffect(() => {
    if (timeLeft <= 0) {
      handleConfirm()
      return
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 100)
    }, 100)

    return () => clearInterval(interval)
  }, [timeLeft, handleConfirm])

  const progress = (timeLeft / autoExecuteDelay) * 100
  const secondsLeft = Math.ceil(timeLeft / 1000)

  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-primary/5 via-transparent to-transparent opacity-50" />

      <div className="relative flex size-24 items-center justify-center">
        <svg
          aria-hidden="true"
          className="size-24 -rotate-90"
          viewBox="0 0 100 100"
        >
          <circle
            className="fill-none stroke-muted"
            cx="50"
            cy="50"
            r="45"
            strokeWidth="6"
          />
          <circle
            className="fill-none stroke-primary transition-all duration-100"
            cx="50"
            cy="50"
            r="45"
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
            strokeLinecap="round"
            strokeWidth="6"
          />
        </svg>
        <span
          aria-label={`Pozostalo ${secondsLeft} sekund`}
          aria-live="assertive"
          className="absolute font-bold text-2xl text-foreground"
          role="timer"
        >
          {secondsLeft}
        </span>
      </div>

      <div className="max-w-sm space-y-2">
        <h2 className="font-semibold text-foreground text-xl">
          Rozpoznano polecenie
        </h2>
        <p className="text-muted-foreground text-sm">{commandLabel}</p>
        <p className="text-muted-foreground text-xs">„{transcript}"</p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={handleConfirm} type="button">
          Wykonaj teraz
        </Button>
        <Button onClick={onCancel} type="button" variant="ghost">
          Anuluj
        </Button>
      </div>
    </div>
  )
}
