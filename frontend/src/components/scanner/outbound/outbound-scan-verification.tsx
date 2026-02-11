import {
  BarCode02Icon,
  KeyboardIcon,
  Location04Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useLocale } from "next-intl"
import { type KeyboardEvent, useCallback, useRef, useState } from "react"
import { remToPixels } from "@/components/dashboard/utils/helpers"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useElementSize } from "@/hooks/use-element-size"
import { useAppTranslations } from "@/i18n/use-translations"
import type { OutboundPickSlot } from "@/lib/schemas"
import { Badge } from "../../ui/badge"
import { Button } from "../../ui/button"
import { Input } from "../../ui/input"
import { Label } from "../../ui/label"
import { CancelButton } from "../cancel-button"
import { ScannerBody } from "../scanner-body"
import type { ScannedVerificationEntry } from "../scanner-types"

interface OutboundScanVerificationProps {
  selectedSlots: OutboundPickSlot[]
  scannedEntries: ScannedVerificationEntry[]
  isSubmitting: boolean
  onRequestScan: () => void
  onManualCodeSubmit: (code: string) => void
  onConfirm: () => void
  onCancel: () => void
}

const formatTime = (date: Date, locale: string): string => {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date)
}

export function OutboundScanVerification({
  selectedSlots,
  scannedEntries,
  isSubmitting,
  onRequestScan,
  onManualCodeSubmit,
  onConfirm,
  onCancel,
}: OutboundScanVerificationProps) {
  const t = useAppTranslations()

  const locale = useLocale()
  const scannedCodes = new Set(scannedEntries.map((e) => e.assortmentCode))
  const allScanned = selectedSlots.every((slot) =>
    scannedCodes.has(slot.assortmentCode)
  )
  const remaining = selectedSlots.length - scannedEntries.length
  const [manualCode, setManualCode] = useState("")
  const [manualInputError, setManualInputError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { elementHeight } = useElementSize(containerRef)

  const handleManualCodeSubmit = useCallback(() => {
    const trimmedCode = manualCode.trim()
    if (!trimmedCode || allScanned) {
      return
    }

    const hasMatchingSlot = selectedSlots.some(
      (slot) => slot.assortmentCode === trimmedCode
    )
    if (!hasMatchingSlot) {
      setManualInputError(
        t("generated.scanner.outbound.codeBelongAnySelectedItem")
      )
      return
    }

    if (scannedCodes.has(trimmedCode)) {
      setManualInputError(
        t("generated.scanner.outbound.itemAlreadyBeenVerified")
      )
      return
    }

    setManualInputError(null)
    onManualCodeSubmit(trimmedCode)
    setManualCode("")
  }, [
    allScanned,
    manualCode,
    onManualCodeSubmit,
    scannedCodes,
    selectedSlots,
    t,
  ])

  const handleManualCodeKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== "Enter") {
        return
      }

      event.preventDefault()
      handleManualCodeSubmit()
    },
    [handleManualCodeSubmit]
  )

  return (
    <ScannerBody>
      <div className="relative flex h-full flex-col">
        <CancelButton onClick={onCancel} />

        <div className="mb-4 flex items-start gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <HugeiconsIcon
              className="size-6 text-primary"
              icon={BarCode02Icon}
            />
          </div>
          <div>
            <h2 className="font-semibold text-xl tracking-tight">
              {t("generated.scanner.outbound.scanVerification")}
            </h2>
            <p className="mt-1 text-muted-foreground text-sm">
              {t("generated.scanner.outbound.scanSelectedItemCodesConfirm")}
            </p>
          </div>
        </div>

        <div className="h-full" ref={containerRef}>
          <ScrollArea
            className="pr-4"
            style={{
              height: Math.max(remToPixels(30), elementHeight),
            }}
          >
            <div className="mb-4 grid grid-cols-3 gap-2">
              <div className="rounded-xl border bg-card/40 p-3 text-center">
                <p className="text-muted-foreground text-xs">
                  {t("generated.scanner.outbound.selected")}
                </p>
                <p className="font-semibold text-lg">{selectedSlots.length}</p>
              </div>
              <div className="rounded-xl border bg-card/40 p-3 text-center">
                <p className="text-muted-foreground text-xs">
                  {t("generated.scanner.outbound.scanned")}
                </p>
                <p className="font-semibold text-lg">{scannedEntries.length}</p>
              </div>
              <div className="rounded-xl border bg-card/40 p-3 text-center">
                <p className="text-muted-foreground text-xs">
                  {t("generated.scanner.outbound.remaining")}
                </p>
                <p className="font-semibold text-lg">{remaining}</p>
              </div>
            </div>

            {scannedEntries.length > 0 ? (
              <div className="relative -mx-2 mb-4 flex-1 overflow-hidden">
                <div className="absolute inset-x-0 top-0 z-10 h-4 bg-linear-to-b from-background to-transparent" />
                <div className="h-full space-y-2 overflow-y-auto px-2 py-2">
                  {scannedEntries.map((entry) => (
                    <div
                      className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4"
                      key={entry.assortmentCode}
                    >
                      <div className="flex size-6 shrink-0 items-center justify-center rounded-md border border-emerald-500 bg-emerald-500 text-white">
                        <HugeiconsIcon
                          className="size-3.5"
                          icon={Tick02Icon}
                          strokeWidth={3}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-sm">
                            {entry.assortmentCode}
                          </p>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <HugeiconsIcon
                            className="size-3.5 text-muted-foreground"
                            icon={Location04Icon}
                          />
                          <span className="text-muted-foreground text-xs">
                            {entry.rackMarker}
                          </span>
                          <Badge variant="outline">
                            {t("generated.scanner.outbound.xY", {
                              value0: entry.positionX,
                              value1: entry.positionY,
                            })}
                          </Badge>
                          <span className="ml-auto text-muted-foreground text-xs">
                            {formatTime(entry.scannedAt, locale)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="absolute inset-x-0 bottom-0 z-10 h-4 bg-linear-to-t from-background to-transparent" />
              </div>
            ) : (
              <div className="mb-4 flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-muted-foreground/20 border-dashed p-8">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-muted/50">
                  <HugeiconsIcon
                    className="size-8 text-muted-foreground/50"
                    icon={BarCode02Icon}
                  />
                </div>
                <p className="text-center text-muted-foreground text-sm">
                  {t("generated.scanner.outbound.scannedItemsScanLabelCodes")}
                </p>
              </div>
            )}

            <div className="space-y-3">
              {allScanned ? null : (
                <div className="rounded-xl border bg-card/40 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <HugeiconsIcon
                      className="size-4 text-muted-foreground"
                      icon={KeyboardIcon}
                    />
                    <Label
                      className="font-medium text-sm"
                      htmlFor="manual-outbound-code"
                    >
                      {t("generated.scanner.outbound.enterCodeManually")}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      autoComplete="off"
                      className="h-10 rounded-lg font-mono"
                      id="manual-outbound-code"
                      onChange={(event) => {
                        setManualCode(event.target.value)
                        setManualInputError(null)
                      }}
                      onKeyDown={handleManualCodeKeyDown}
                      placeholder={t("generated.scanner.outbound.eG01")}
                      type="text"
                      value={manualCode}
                    />
                    <Button
                      className="h-10 rounded-lg px-4"
                      disabled={manualCode.trim().length === 0}
                      onClick={handleManualCodeSubmit}
                      type="button"
                      variant="outline"
                    >
                      {t("generated.scanner.outbound.add")}
                    </Button>
                  </div>
                  <p className="mt-2 text-muted-foreground text-xs">
                    {t("generated.scanner.outbound.useCameraCannotReadLabel")}
                  </p>
                  {manualInputError ? (
                    <p className="mt-1 text-destructive text-xs" role="alert">
                      {manualInputError}
                    </p>
                  ) : null}
                </div>
              )}
              {allScanned ? null : (
                <Button
                  className="h-12 w-full rounded-xl"
                  onClick={onRequestScan}
                  type="button"
                >
                  {t("generated.scanner.outbound.scanRemaining", {
                    value0: remaining,
                  })}
                </Button>
              )}
              <Button
                className="h-12 w-full rounded-xl"
                disabled={!allScanned}
                isLoading={isSubmitting}
                onClick={onConfirm}
                type="button"
                variant={allScanned ? "default" : "outline"}
              >
                {allScanned
                  ? t("generated.scanner.outbound.confirmPick2", {
                      value0: selectedSlots.length,
                    })
                  : t("generated.scanner.outbound.scanAllItemsConfirm")}
              </Button>
            </div>
          </ScrollArea>
        </div>
      </div>
    </ScannerBody>
  )
}
