import {
  BarCode02Icon,
  Location04Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type { OutboundPickSlot } from "@/lib/schemas"
import { Badge } from "../../ui/badge"
import { Button } from "../../ui/button"
import { CancelButton } from "../cancel-button"
import { ScannerBody } from "../scanner-body"
import type { ScannedVerificationEntry } from "../scanner-types"

interface OutboundScanVerificationProps {
  selectedSlots: OutboundPickSlot[]
  scannedEntries: ScannedVerificationEntry[]
  isSubmitting: boolean
  onRequestScan: () => void
  onConfirm: () => void
  onCancel: () => void
}

const formatTime = (date: Date): string => {
  return new Intl.DateTimeFormat("pl-PL", {
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
  onConfirm,
  onCancel,
}: OutboundScanVerificationProps) {
  const scannedCodes = new Set(scannedEntries.map((e) => e.assortmentCode))
  const allScanned = selectedSlots.every((slot) =>
    scannedCodes.has(slot.assortmentCode)
  )
  const remaining = selectedSlots.length - scannedEntries.length

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
              Weryfikacja skanowaniem
            </h2>
            <p className="mt-1 text-muted-foreground text-sm">
              Zeskanuj kody wybranych pozycji, aby potwierdzić pobranie.
            </p>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl border bg-card/40 p-3 text-center">
            <p className="text-muted-foreground text-xs">Wybrano</p>
            <p className="font-semibold text-lg">{selectedSlots.length}</p>
          </div>
          <div className="rounded-xl border bg-card/40 p-3 text-center">
            <p className="text-muted-foreground text-xs">Zeskanowano</p>
            <p className="font-semibold text-lg">{scannedEntries.length}</p>
          </div>
          <div className="rounded-xl border bg-card/40 p-3 text-center">
            <p className="text-muted-foreground text-xs">Pozostało</p>
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
                        P:{entry.positionX} R:{entry.positionY}
                      </Badge>
                      <span className="ml-auto text-muted-foreground text-xs">
                        {formatTime(entry.scannedAt)}
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
              Brak zeskanowanych pozycji. Zeskanuj kody z etykiet, aby
              kontynuować.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {allScanned ? null : (
            <Button
              className="h-12 w-full rounded-xl"
              onClick={onRequestScan}
              type="button"
            >
              Skanuj ({remaining} pozostało)
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
              ? `Potwierdź pobranie (${selectedSlots.length})`
              : "Zeskanuj wszystkie pozycje, aby potwierdzić"}
          </Button>
        </div>
      </div>
    </ScannerBody>
  )
}
