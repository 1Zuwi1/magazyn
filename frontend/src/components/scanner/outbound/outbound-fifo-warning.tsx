import { AlertCircleIcon, Location04Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useLocale, useTranslations } from "next-intl"
import { formatDateTime } from "@/components/dashboard/utils/helpers"
import type { OutboundCheckResult } from "@/lib/schemas"
import { Badge } from "../../ui/badge"
import { Button } from "../../ui/button"
import { CancelButton } from "../cancel-button"
import { ScannerBody } from "../scanner-body"

interface OutboundFifoWarningProps {
  checkResult: OutboundCheckResult
  isSubmitting: boolean
  onSkipFifo: () => void
  onTakeFifoCompliant: () => void
  onCancel: () => void
}

export function OutboundFifoWarning({
  checkResult,
  isSubmitting,
  onSkipFifo,
  onTakeFifoCompliant,
  onCancel,
}: OutboundFifoWarningProps) {
  const t = useTranslations()

  const locale = useLocale()
  const { requestedAssortment, olderAssortments, warning } = checkResult

  return (
    <ScannerBody>
      <div className="relative flex h-full flex-col">
        <CancelButton onClick={onCancel} />

        <div className="mb-4 flex items-start gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 ring-1 ring-amber-500/20">
            <HugeiconsIcon
              className="size-6 text-amber-500"
              icon={AlertCircleIcon}
            />
          </div>
          <div>
            <h2 className="font-semibold text-xl tracking-tight">
              {t("generated.scanner.outbound.fifoViolation")}
            </h2>
            <p className="mt-1 text-muted-foreground text-sm">
              {t("generated.scanner.outbound.selectedAssortmentFifoCompliant")}
              {warning
                ? ` ${t("generated.scanner.outbound.olderItems", { value0: warning })}`
                : ""}
            </p>
          </div>
        </div>

        <div className="mb-4 overflow-hidden rounded-xl border bg-card/50">
          <div className="border-b bg-muted/30 px-4 py-2.5">
            <p className="font-medium text-sm">
              {t("generated.scanner.outbound.scannedAssortment")}
            </p>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm">
                {t("generated.shared.rack2", {
                  value0: requestedAssortment.rackMarker,
                })}
              </p>
              <Badge variant="outline">
                {t("generated.scanner.outbound.xY", {
                  value0: requestedAssortment.positionX,
                  value1: requestedAssortment.positionY,
                })}
              </Badge>
            </div>
            <p className="mt-1 font-mono text-muted-foreground text-xs">
              {requestedAssortment.assortmentCode}
            </p>
            <p className="mt-1 text-muted-foreground text-xs">
              {t("generated.scanner.outbound.received", {
                value0: formatDateTime(requestedAssortment.createdAt, locale),
              })}
            </p>
          </div>
        </div>

        {olderAssortments.length > 0 ? (
          <div className="relative -mx-2 mb-4 flex-1 overflow-hidden">
            <div className="absolute inset-x-0 top-0 z-10 h-4 bg-linear-to-b from-background to-transparent" />
            <div className="h-full space-y-2 overflow-y-auto px-2 py-2">
              <p className="px-1 font-medium text-sm">
                {t("generated.scanner.outbound.olderEntriesFifoCompliant")}
              </p>
              {olderAssortments.map((slot) => (
                <div
                  className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4"
                  key={slot.assortmentId}
                >
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon
                      className="size-4 text-emerald-500"
                      icon={Location04Icon}
                    />
                    <p className="font-medium text-sm">
                      {t("generated.shared.rack2", {
                        value0: slot.rackMarker,
                      })}
                    </p>
                    <Badge variant="outline">
                      {t("generated.scanner.outbound.xY", {
                        value0: slot.positionX,
                        value1: slot.positionY,
                      })}
                    </Badge>
                  </div>
                  <p className="mt-1 font-mono text-muted-foreground text-xs">
                    {slot.assortmentCode}
                  </p>
                  <div className="mt-1 flex gap-3 text-muted-foreground text-xs">
                    <span>
                      {t("generated.scanner.outbound.received", {
                        value0: formatDateTime(slot.createdAt, locale),
                      })}
                    </span>
                    <span>
                      {t("generated.scanner.outbound.expires", {
                        value0: formatDateTime(slot.expiresAt, locale),
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute inset-x-0 bottom-0 z-10 h-4 bg-linear-to-t from-background to-transparent" />
          </div>
        ) : null}

        <div className="space-y-3">
          <Button
            className="h-12 w-full rounded-xl"
            onClick={onTakeFifoCompliant}
            type="button"
          >
            {t("generated.scanner.outbound.pickFifoCompliant")}
          </Button>
          <Button
            className="h-12 w-full rounded-xl"
            isLoading={isSubmitting}
            onClick={onSkipFifo}
            type="button"
            variant="outline"
          >
            {t("generated.scanner.outbound.continueAnywaySkipFifo")}
          </Button>
        </div>
      </div>
    </ScannerBody>
  )
}
