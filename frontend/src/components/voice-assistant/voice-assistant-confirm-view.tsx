"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { translateMessage } from "@/i18n/translate-message"

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
      setTimeLeft((prev) => {
        if (prev <= 100) {
          clearInterval(interval)
          handleConfirm()
          return 0
        }
        return prev - 100
      })
    }, 100)

    return () => clearInterval(interval)
  }, [timeLeft, handleConfirm])

  const progress = (timeLeft / autoExecuteDelay) * 100
  const secondsLeft = Math.ceil(timeLeft / 1000)

  return (
    <div
      className="relative flex h-full flex-col items-center justify-center gap-5 p-6 text-center"
      data-slot="voice-assistant-confirm"
    >
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-primary/5 via-transparent to-transparent opacity-50" />

      <div className="relative flex size-20 items-center justify-center">
        <svg
          aria-hidden="true"
          className="size-20 -rotate-90"
          viewBox="0 0 100 100"
        >
          <circle
            className="fill-none stroke-muted"
            cx="50"
            cy="50"
            r="45"
            strokeWidth="5"
          />
          <circle
            className="fill-none stroke-primary transition-all duration-100"
            cx="50"
            cy="50"
            r="45"
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
            strokeLinecap="round"
            strokeWidth="5"
          />
        </svg>
        <span
          aria-label={translateMessage("generated.m0813", {
            value0: secondsLeft,
          })}
          aria-live="assertive"
          className="absolute font-bold text-foreground text-xl tabular-nums"
          role="timer"
        >
          {secondsLeft}
        </span>
      </div>

      <div className="max-w-xs space-y-1.5">
        <h2 className="font-semibold text-foreground text-lg tracking-tight">
          {translateMessage("generated.m0814")}
        </h2>
        <p className="font-medium text-foreground/90 text-sm">{commandLabel}</p>
        <p className="rounded-lg bg-muted/40 px-3 py-1.5 text-muted-foreground text-xs leading-relaxed">
          &bdquo;
          {transcript}
          &rdquo;
        </p>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button
          className="rounded-full px-6"
          onClick={handleConfirm}
          type="button"
        >
          {translateMessage("generated.m0817")}
        </Button>
        <Button
          className="rounded-full"
          onClick={onCancel}
          type="button"
          variant="ghost"
        >
          {translateMessage("generated.m0885")}
        </Button>
      </div>
    </div>
  )
}
