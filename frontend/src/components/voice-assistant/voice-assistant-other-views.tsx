import { Mic01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"

export function VoiceAssistantProcessingView() {
  return (
    <div className="relative flex h-full flex-col items-center justify-center p-6 text-center">
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-primary/5 via-transparent to-transparent opacity-50" />

      <div className="relative flex flex-col items-center gap-6">
        <div className="relative">
          <div className="size-20 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>

        <div className="max-w-sm space-y-2">
          <h2 className="font-semibold text-foreground text-xl">
            Przetwarzam...
          </h2>
          <p className="text-muted-foreground text-sm">
            Analizuję Twoje polecenie
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
  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-destructive/5 via-transparent to-transparent opacity-50" />
      <div className="max-w-sm space-y-2">
        <h2 className="font-semibold text-foreground text-xl">Nie udało się</h2>
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>
      <Button onClick={onReset} type="button">
        Spróbuj ponownie
      </Button>
    </div>
  )
}

interface VoiceAssistantSuccessViewProps {
  onReset: () => void
}

export function VoiceAssistantSuccessView({
  onReset,
}: VoiceAssistantSuccessViewProps) {
  return (
    <div className="relative flex h-full flex-col items-center justify-center p-6 text-center">
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-emerald-500/5 via-transparent to-transparent opacity-50" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 size-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 opacity-30 blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-2xl bg-emerald-500/20" />
          <div className="relative flex size-16 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
            <HugeiconsIcon
              className="size-8 text-emerald-500"
              icon={Mic01Icon}
            />
          </div>
        </div>

        <div className="max-w-sm space-y-2">
          <h2 className="font-semibold text-foreground text-xl">
            Polecenie wykonane
          </h2>
          <p className="text-muted-foreground text-sm">
            Twoje polecenie zostało przetworzone
          </p>
        </div>

        <div className="pt-2">
          <Button onClick={onReset} type="button">
            Nowe polecenie
          </Button>
        </div>
      </div>
    </div>
  )
}
