import { Mic01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"
import { translateMessage } from "@/i18n/translate-message"

interface VoiceAssistantIdleViewProps {
  buttonId?: string
  onStartListening: () => void
  onSuggestionSelect: (suggestion: string) => void
}

export function VoiceAssistantNormalView({
  buttonId,
  onStartListening,
  onSuggestionSelect,
}: VoiceAssistantIdleViewProps) {
  return (
    <div
      className="relative flex h-full flex-col items-center justify-center p-6 text-center"
      data-slot="voice-assistant-idle"
    >
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-primary/5 via-transparent to-transparent opacity-50" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 size-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/8 opacity-40 blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center gap-5">
        <div className="relative">
          <span className="pointer-events-none absolute -inset-3 rounded-full bg-primary/8 blur-xl" />
          <Button
            aria-label={translateMessage("generated.m0822")}
            className="relative size-22 rounded-full shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-105 hover:shadow-primary/30 hover:shadow-xl active:scale-95"
            id={buttonId}
            onClick={onStartListening}
            size="icon"
          >
            <HugeiconsIcon
              className="size-10"
              icon={Mic01Icon}
              strokeWidth={1.75}
            />
          </Button>
        </div>

        <div className="max-w-xs space-y-1.5">
          <h2 className="font-semibold text-foreground text-lg tracking-tight">
            {translateMessage("generated.m0665")}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {translateMessage("generated.m0823")}
          </p>
        </div>

        <div className="w-full pt-3">
          <p className="mb-2.5 font-medium text-muted-foreground/70 text-xs uppercase tracking-wider">
            {translateMessage("generated.m0824")}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              translateMessage("generated.m0825"),
              "Dodaj przedmiot",
              translateMessage("generated.m0826"),
              translateMessage("generated.m0827"),
            ].map((suggestion) => (
              <Button
                className="h-8 rounded-full px-4 text-xs transition-colors duration-200"
                key={suggestion}
                onClick={() => onSuggestionSelect(suggestion)}
                type="button"
                variant="outline"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
