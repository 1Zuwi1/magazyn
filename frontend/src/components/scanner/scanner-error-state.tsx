import { AlertCircleIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "../ui/button"

interface ScannerErrorStateProps {
  error: string
  onRetry: () => void
}

export function ScannerErrorState({ error, onRetry }: ScannerErrorStateProps) {
  return (
    <div className="relative flex h-full flex-col items-center justify-center p-6 text-center">
      {/* Decorative background gradient */}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-destructive/5 via-transparent to-transparent opacity-50" />

      {/* Decorative blur circle */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 size-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-destructive/10 opacity-30 blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center gap-4">
        {/* Icon */}
        <div className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10 ring-1 ring-destructive/20">
          <HugeiconsIcon
            className="size-8 text-destructive"
            icon={AlertCircleIcon}
          />
        </div>

        {/* Text content */}
        <div className="max-w-sm space-y-2">
          <h2 className="font-semibold text-foreground text-xl">
            Wystąpił błąd
          </h2>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>

        {/* Action button */}
        <div className="pt-2">
          <Button onClick={onRetry} type="button" variant="outline">
            Spróbuj ponownie
          </Button>
        </div>
      </div>
    </div>
  )
}
