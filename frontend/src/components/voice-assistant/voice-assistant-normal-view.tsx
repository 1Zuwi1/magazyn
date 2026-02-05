import { Mic01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"

interface VoiceAssistantIdleStepProps {
  onStartListening: () => void
}

export function VoiceAssistantNormalView({
  onStartListening,
}: VoiceAssistantIdleStepProps) {
  return (
    <div className="relative flex h-full flex-col items-center justify-center p-6 text-center">
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-primary/5 via-transparent to-transparent opacity-50" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 size-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 opacity-30 blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center gap-6">
        <div className="relative">
          <Button
            className="relative size-20 rounded-full transition-all hover:scale-105"
            onClick={onStartListening}
            size="icon"
          >
            <HugeiconsIcon
              className="size-10"
              icon={Mic01Icon}
              strokeWidth={2}
            />
          </Button>
        </div>

        <div className="max-w-sm space-y-2">
          <h2 className="font-semibold text-foreground text-xl">
            Asystent głosowy
          </h2>
          <p className="text-muted-foreground text-sm">
            Naciśnij mikrofon i powiedz polecenie
          </p>
        </div>

        <div className="pt-4">
          <p className="mb-3 text-muted-foreground text-xs">
            Przykładowe polecenia:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {["Pokaż magazyn A", "Znajdź produkt", "Dodaj przedmiot"].map(
              (suggestion) => (
                <span
                  className="rounded-full bg-muted px-3 py-1.5 text-xs transition-colors hover:bg-muted/80"
                  key={suggestion}
                >
                  {suggestion}
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
