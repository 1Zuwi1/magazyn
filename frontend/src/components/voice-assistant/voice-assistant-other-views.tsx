import { AlertCircleIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Button } from "@/components/ui/button"
import { useAppTranslations } from "@/i18n/use-translations"
export function VoiceAssistantProcessingView() {
  const t = useAppTranslations()

  return (
    <div
      className="relative flex h-full flex-col items-center justify-center p-6 text-center"
      data-slot="voice-assistant-processing"
    >
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-primary/5 via-transparent to-transparent opacity-50" />

      <div className="relative flex flex-col items-center gap-5">
        <div className="relative">
          <span className="pointer-events-none absolute -inset-3 animate-pulse rounded-full bg-primary/8 blur-xl" />
          <div className="size-16 animate-spin rounded-full border-[3px] border-muted border-t-primary" />
        </div>

        <div className="max-w-xs space-y-1.5">
          <h2 className="font-semibold text-foreground text-lg tracking-tight">
            {t("generated.voiceAssistant.imProcessing")}
          </h2>
          <p className="text-muted-foreground text-sm">
            {t("generated.voiceAssistant.amAnalyzingCommand")}
          </p>
        </div>
      </div>
    </div>
  )
}

interface VoiceAssistantErrorViewProps {
  message: string
  onReset: () => void
}

export function VoiceAssistantErrorView({
  message,
  onReset,
}: VoiceAssistantErrorViewProps) {
  const t = useAppTranslations()

  return (
    <div
      className="relative flex h-full flex-col items-center justify-center gap-5 p-6 text-center"
      data-slot="voice-assistant-error"
    >
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-destructive/5 via-transparent to-transparent opacity-50" />

      <div className="relative">
        <span className="pointer-events-none absolute -inset-3 rounded-full bg-destructive/8 blur-xl" />
        <div className="relative flex size-16 items-center justify-center rounded-full bg-destructive/10">
          <HugeiconsIcon
            className="size-7 text-destructive"
            icon={AlertCircleIcon}
            strokeWidth={1.75}
          />
        </div>
      </div>

      <div className="max-w-xs space-y-1.5">
        <h2 className="font-semibold text-foreground text-lg tracking-tight">
          {t("generated.voiceAssistant.didntWork")}
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {message}
        </p>
      </div>

      <Button className="rounded-full px-6" onClick={onReset} type="button">
        {t("generated.shared.again")}
      </Button>
    </div>
  )
}
