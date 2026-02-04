import { StopIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"

interface VoiceAssistantListeningStepProps {
  onStopListening: () => void
}

export function VoiceAssistantListeningStep({
  onStopListening,
}: VoiceAssistantListeningStepProps) {
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

        <div className="flex h-16 items-center justify-center gap-1">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              className="w-1 animate-pulse rounded-full bg-primary/60"
              key={i}
              style={{
                height: `${Math.random() * 40 + 20}px`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: `${0.5 + Math.random() * 0.5}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
