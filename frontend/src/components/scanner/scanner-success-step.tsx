import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "../ui/button"

interface ScannerSuccessStepProps {
  onReset: () => void
}

export function ScannerSuccessStep({ onReset }: ScannerSuccessStepProps) {
  return (
    <div className="relative flex h-full flex-col items-center justify-center p-6 text-center">
      {/* Decorative background gradient */}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-emerald-500/5 via-transparent to-transparent opacity-50" />

      {/* Decorative blur circle */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 size-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 opacity-30 blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center gap-4">
        {/* Icon with animated pulse effect */}
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-2xl bg-emerald-500/20" />
          <div className="relative flex size-16 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
            <HugeiconsIcon
              className="size-8 text-emerald-500"
              icon={CheckmarkCircle02Icon}
            />
          </div>
        </div>

        {/* Text content */}
        <div className="max-w-sm space-y-2">
          <h2 className="font-semibold text-foreground text-xl">
            Dodano pomyślnie
          </h2>
          <p className="text-muted-foreground text-sm">
            Przedmioty zostały dodane do magazynu
          </p>
        </div>

        {/* Action button */}
        <div className="pt-2">
          <Button onClick={onReset} type="button">
            Zeskanuj kolejny
          </Button>
        </div>
      </div>
    </div>
  )
}
