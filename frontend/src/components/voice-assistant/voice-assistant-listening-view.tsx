import { StopIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface VoiceAssistantListeningViewProps {
  onStopListening: () => void
  transcript?: string
  detectedCommandLabel?: string | null
  isCommandDetected?: boolean
}

export function VoiceAssistantListeningView({
  onStopListening,
  transcript,
  detectedCommandLabel,
  isCommandDetected = false,
}: VoiceAssistantListeningViewProps) {
  const bars = [
    { height: 24, delay: 0, duration: 0.6 },
    { height: 42, delay: 0.1, duration: 0.7 },
    { height: 30, delay: 0.2, duration: 0.55 },
    { height: 52, delay: 0.3, duration: 0.8 },
    { height: 36, delay: 0.4, duration: 0.65 },
    { height: 48, delay: 0.5, duration: 0.75 },
    { height: 28, delay: 0.6, duration: 0.6 },
    { height: 44, delay: 0.7, duration: 0.7 },
    { height: 34, delay: 0.8, duration: 0.55 },
    { height: 50, delay: 0.9, duration: 0.8 },
    { height: 32, delay: 1, duration: 0.65 },
    { height: 46, delay: 1.1, duration: 0.75 },
  ]

  return (
    <div className="relative flex h-full flex-col items-center justify-center p-6 text-center">
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-primary/5 via-transparent to-transparent opacity-50" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 size-48 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-primary/10 opacity-50 blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center gap-6">
        <div className="relative">
          <span className="absolute inset-0 animate-ping rounded-full bg-destructive/30" />
          <span className="absolute -inset-4 animate-pulse rounded-full bg-destructive/10" />

          <Button
            className="relative size-20 rounded-full bg-destructive text-destructive-foreground transition-all hover:bg-destructive/90"
            onClick={onStopListening}
            size="icon"
            variant="destructive"
          >
            <HugeiconsIcon className="size-9" icon={StopIcon} strokeWidth={2} />
          </Button>
        </div>

        <div className="max-w-sm space-y-2">
          <h2 className="flex items-center justify-center gap-2 font-semibold text-foreground text-xl">
            <span className="relative flex size-3">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-3 rounded-full bg-primary" />
            </span>
            Słucham...
          </h2>
          <p className="text-muted-foreground text-sm">
            Powiedz polecenie, a następnie naciśnij stop
          </p>
        </div>

        <div
          aria-live="polite"
          className="mt-2 flex max-w-sm flex-col items-center gap-2 text-center"
        >
          {transcript ? (
            <p className="text-foreground/80 text-sm">„{transcript}”</p>
          ) : (
            <p className="text-muted-foreground text-xs">
              Nasłuchuję Twojego polecenia...
            </p>
          )}
          {detectedCommandLabel && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Badge
                className="gap-1"
                variant={isCommandDetected ? "default" : "secondary"}
              >
                <span
                  aria-hidden="true"
                  className="inline-flex size-2 rounded-full bg-emerald-400 shadow-[0_0_8px] shadow-emerald-400/60"
                />
                Wykryto: {detectedCommandLabel}
              </Badge>
            </div>
          )}
        </div>

        <div className="flex h-16 items-center justify-center gap-1">
          {bars.map((bar, i) => (
            <div
              className="w-1 animate-pulse rounded-full bg-primary/60"
              key={i}
              style={{
                height: `${bar.height}px`,
                animationDelay: `${bar.delay}s`,
                animationDuration: `${bar.duration}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
