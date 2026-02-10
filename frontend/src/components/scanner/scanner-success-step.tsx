import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { translateMessage } from "@/i18n/translate-message"
import { Button } from "../ui/button"

interface ScannerSuccessStepProps {
  onReset: () => void
  itemName: string
  placementsCount: number
}

export function ScannerSuccessStep({
  onReset,
  itemName,
  placementsCount,
}: ScannerSuccessStepProps) {
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
              icon={CheckmarkCircle02Icon}
            />
          </div>
        </div>

        <div className="max-w-sm space-y-2">
          <h2 className="font-semibold text-foreground text-xl">
            {translateMessage("generated.m0765")}
          </h2>
          <p className="text-muted-foreground text-sm">
            {translateMessage("generated.m0766", {
              value0: itemName,
              value1: placementsCount,
            })}
          </p>
        </div>

        <div className="pt-2">
          <Button onClick={onReset} type="button">
            {translateMessage("generated.m0768")}
          </Button>
        </div>
      </div>
    </div>
  )
}
