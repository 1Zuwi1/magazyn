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
