import { StopIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAppTranslations } from "@/i18n/use-translations"

interface VoiceAssistantListeningViewProps {
  onStopListening: () => void
  transcript?: string
  detectedCommandLabel?: string | null
  isCommandDetected?: boolean
}

const bars = [
  { height: 20, delay: 0, duration: 0.6 },
  { height: 36, delay: 0.08, duration: 0.7 },
  { height: 26, delay: 0.16, duration: 0.55 },
  { height: 44, delay: 0.24, duration: 0.8 },
  { height: 30, delay: 0.32, duration: 0.65 },
  { height: 40, delay: 0.4, duration: 0.75 },
  { height: 24, delay: 0.48, duration: 0.6 },
  { height: 38, delay: 0.56, duration: 0.7 },
  { height: 28, delay: 0.64, duration: 0.55 },
  { height: 42, delay: 0.72, duration: 0.8 },
  { height: 26, delay: 0.8, duration: 0.65 },
  { height: 34, delay: 0.88, duration: 0.75 },
]

export function VoiceAssistantListeningView({
  onStopListening,
  transcript,
  detectedCommandLabel,
  isCommandDetected = false,
}: VoiceAssistantListeningViewProps) {
  const t = useAppTranslations()

  return (
    <div
      className="relative flex h-full flex-col items-center justify-center p-6 text-center"
      data-slot="voice-assistant-listening"
    >
      <style>
        {
          "@keyframes voice-waveform{0%{transform:scaleY(.4)}100%{transform:scaleY(1)}}"
        }
      </style>
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-destructive/5 via-transparent to-transparent opacity-50" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 size-56 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-destructive/8 opacity-40 blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center gap-5">
        <div className="relative">
          <span className="absolute inset-0 animate-ping rounded-full bg-destructive/20" />
          <span className="pointer-events-none absolute -inset-4 animate-pulse rounded-full bg-destructive/8 blur-lg" />

          <Button
            aria-label={t("generated.voiceAssistant.stopListening")}
            className="relative size-22 rounded-full shadow-destructive/25 shadow-lg transition-all duration-200 hover:shadow-xl active:scale-95"
            onClick={onStopListening}
            size="icon"
            variant="destructive"
          >
            <HugeiconsIcon className="size-8" icon={StopIcon} strokeWidth={2} />
          </Button>
        </div>

        <div className="max-w-xs space-y-1.5">
          <h2 className="flex items-center justify-center gap-2 font-semibold text-foreground text-lg tracking-tight">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
            </span>
            {t("generated.voiceAssistant.imListening")}
          </h2>
          <p className="text-muted-foreground text-sm">
            {t("generated.voiceAssistant.sayCommandThenPressStop")}
          </p>
        </div>

        <div
          aria-live="polite"
          className="mt-1 flex max-w-xs flex-col items-center gap-2 text-center"
        >
          {transcript ? (
            <p className="rounded-lg bg-muted/50 px-4 py-2 text-foreground/80 text-sm leading-relaxed">
              &bdquo;
              {transcript}
              &rdquo;
            </p>
          ) : (
            <p className="text-muted-foreground/60 text-xs italic">
              {t("generated.voiceAssistant.amListeningCommand")}
            </p>
          )}
          {detectedCommandLabel && (
            <Badge
              className="gap-1.5"
              variant={isCommandDetected ? "success" : "secondary"}
            >
              <span
                aria-hidden="true"
                className="inline-flex size-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px] shadow-emerald-400/60"
              />
              {t("generated.voiceAssistant.detected", {
                value0: detectedCommandLabel,
              })}
            </Badge>
          )}
        </div>

        <div
          aria-hidden="true"
          className="flex h-12 items-center justify-center gap-0.75"
        >
          {bars.map((bar) => (
            <div
              className="w-0.75 rounded-full bg-primary/50"
              key={bar.delay}
              style={{
                height: `${bar.height}px`,
                animation: `voice-waveform ${bar.duration}s ease-in-out ${bar.delay}s infinite alternate`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
