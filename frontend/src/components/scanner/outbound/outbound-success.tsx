import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useLocale } from "next-intl"
import { formatDateTimeLabel } from "@/components/dashboard/utils/helpers"
import { useAppTranslations } from "@/i18n/use-translations"
import type { OutboundExecuteResult } from "@/lib/schemas"
import { Badge } from "../../ui/badge"
import { Button } from "../../ui/button"

interface OutboundSuccessProps {
  result: OutboundExecuteResult
  onReset: () => void
}

export function OutboundSuccess({ result, onReset }: OutboundSuccessProps) {
  const t = useAppTranslations()

  const locale = useLocale()

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
            {t("generated.scanner.outbound.goodsRemovedWarehouse")}
          </h2>
          <p className="text-muted-foreground text-sm">
            {t("generated.scanner.outbound.successfullyRemovedWarehouse", {
              value0: result.issuedCount,
            })}
          </p>
        </div>

        {result.operations.length > 0 ? (
          <div className="w-full space-y-2 text-left">
            {result.operations.map((op) => (
              <div className="rounded-xl border bg-card/50 p-3" key={op.id}>
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-medium text-sm">{op.itemName}</p>
                  <Badge variant={op.fifoCompliant ? "default" : "outline"}>
                    {op.fifoCompliant
                      ? "FIFO"
                      : t("generated.scanner.outbound.fifoSkipped")}
                  </Badge>
                </div>
                <p className="mt-1 text-muted-foreground text-xs">
                  {t("generated.scanner.outbound.rackXY", {
                    value0: op.rackMarker,
                    value1: op.positionX,
                    value2: op.positionY,
                  })}
                </p>
                <p className="text-muted-foreground text-xs">
                  {t("generated.scanner.outbound.issued", {
                    value0: op.issuedByName,
                    value1: formatDateTimeLabel(op.operationTimestamp, locale),
                  })}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        <div className="w-full pt-2">
          <Button className="w-full" onClick={onReset} type="button">
            {t("generated.scanner.outbound.removeAnother")}
          </Button>
        </div>
      </div>
    </div>
  )
}
