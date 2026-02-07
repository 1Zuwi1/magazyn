import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type { OutboundExecuteResult } from "@/lib/schemas"
import { Badge } from "../../ui/badge"
import { Button } from "../../ui/button"

interface OutboundSuccessProps {
  result: OutboundExecuteResult
  onReset: () => void
}

const formatDate = (value: string): string => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("pl-PL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function OutboundSuccess({ result, onReset }: OutboundSuccessProps) {
  return (
    <div className="relative flex h-full flex-col items-center justify-center p-6 text-center">
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-emerald-500/5 via-transparent to-transparent opacity-50" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 size-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 opacity-30 blur-3xl" />
      </div>

      <div className="relative flex w-full max-w-sm flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-2xl bg-emerald-500/20" />
          <div className="relative flex size-16 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
            <HugeiconsIcon
              className="size-8 text-emerald-500"
              icon={CheckmarkCircle02Icon}
            />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="font-semibold text-foreground text-xl">
            Towar zdjęty z magazynu
          </h2>
          <p className="text-muted-foreground text-sm">
            Pomyślnie zdjęto {result.issuedCount}{" "}
            {result.issuedCount === 1 ? "pozycję" : "pozycji"} z magazynu.
          </p>
        </div>

        {result.operations.length > 0 ? (
          <div className="w-full space-y-2 text-left">
            {result.operations.map((op) => (
              <div className="rounded-xl border bg-card/50 p-3" key={op.id}>
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-medium text-sm">{op.itemName}</p>
                  <Badge variant={op.fifoCompliant ? "default" : "outline"}>
                    {op.fifoCompliant ? "FIFO" : "Pominięto FIFO"}
                  </Badge>
                </div>
                <p className="mt-1 text-muted-foreground text-xs">
                  Regał {op.rackMarker} — P:{op.positionX} R:{op.positionY}
                </p>
                <p className="text-muted-foreground text-xs">
                  Wydał: {op.issuedByName} o {formatDate(op.operationTimestamp)}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        <div className="w-full pt-2">
          <Button className="w-full" onClick={onReset} type="button">
            Zdejmij kolejny
          </Button>
        </div>
      </div>
    </div>
  )
}
