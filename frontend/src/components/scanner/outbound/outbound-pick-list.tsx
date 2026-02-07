import {
  AlertCircleIcon,
  Location04Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type { OutboundPickSlot, OutboundPlan } from "@/lib/schemas"
import { Badge } from "../../ui/badge"
import { Button } from "../../ui/button"
import { CancelButton } from "../cancel-button"
import { ScannerBody } from "../scanner-body"

interface OutboundPickListProps {
  plan: OutboundPlan
  selectedSlots: OutboundPickSlot[]
  isSubmitting: boolean
  onToggleSlot: (slot: OutboundPickSlot) => void
  onConfirm: () => void
  onCancel: () => void
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

const isExpired = (expiresAt: string): boolean => {
  return new Date(expiresAt) < new Date()
}

export function OutboundPickList({
  plan,
  selectedSlots,
  isSubmitting,
  onToggleSlot,
  onConfirm,
  onCancel,
}: OutboundPickListProps) {
  const selectedIds = new Set(selectedSlots.map((s) => s.assortmentId))

  return (
    <ScannerBody>
      <div className="relative flex h-full flex-col">
        <CancelButton onClick={onCancel} />

        <div className="mb-4 flex items-start gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <HugeiconsIcon
              className="size-6 text-primary"
              icon={Location04Icon}
            />
          </div>
          <div>
            <h2 className="font-semibold text-xl tracking-tight">
              Pozycje do pobrania
            </h2>
            <p className="mt-1 text-muted-foreground text-sm">
              {plan.itemName} — wybierz pozycje do zdjęcia z regałów.
            </p>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl border bg-card/40 p-3 text-center">
            <p className="text-muted-foreground text-xs">Żądano</p>
            <p className="font-semibold text-lg">{plan.requestedQuantity}</p>
          </div>
          <div className="rounded-xl border bg-card/40 p-3 text-center">
            <p className="text-muted-foreground text-xs">Dostępne</p>
            <p className="font-semibold text-lg">{plan.availableQuantity}</p>
          </div>
          <div className="rounded-xl border bg-card/40 p-3 text-center">
            <p className="text-muted-foreground text-xs">Wybrano</p>
            <p className="font-semibold text-lg">{selectedSlots.length}</p>
          </div>
        </div>

        {plan.warning ? (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
            <HugeiconsIcon
              className="size-4 shrink-0 text-amber-500"
              icon={AlertCircleIcon}
            />
            <p className="text-amber-700 text-sm dark:text-amber-400">
              {plan.warning}
            </p>
          </div>
        ) : null}

        {plan.expiredQuantity > 0 ? (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
            <HugeiconsIcon
              className="size-4 shrink-0 text-destructive"
              icon={AlertCircleIcon}
            />
            <p className="text-destructive text-sm">
              {plan.expiredQuantity} pozycji straciło ważność.
            </p>
          </div>
        ) : null}

        <div className="relative -mx-2 mb-4 flex-1 overflow-hidden">
          <div className="absolute inset-x-0 top-0 z-10 h-4 bg-linear-to-b from-background to-transparent" />
          <div className="h-full space-y-2 overflow-y-auto px-2 py-2">
            {plan.pickSlots.map((slot) => {
              const selected = selectedIds.has(slot.assortmentId)
              const expired = isExpired(slot.expiresAt)

              return (
                <button
                  className={`group relative flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                    selected
                      ? "border-primary/40 bg-primary/5 shadow-sm"
                      : "bg-card/50 hover:border-primary/20"
                  }`}
                  key={slot.assortmentId}
                  onClick={() => onToggleSlot(slot)}
                  type="button"
                >
                  <div
                    className={`flex size-6 shrink-0 items-center justify-center rounded-md border transition-colors ${
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/30"
                    }`}
                  >
                    {selected ? (
                      <HugeiconsIcon
                        className="size-3.5"
                        icon={Tick02Icon}
                        strokeWidth={3}
                      />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">
                        Regał {slot.rackMarker}
                      </p>
                      <Badge variant="outline">
                        P:{slot.positionX} R:{slot.positionY}
                      </Badge>
                      {expired ? (
                        <Badge variant="destructive">Wygasło</Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 font-mono text-muted-foreground text-xs">
                      {slot.assortmentCode}
                    </p>
                    <div className="mt-1 flex gap-3 text-muted-foreground text-xs">
                      <span>Przyjęto: {formatDate(slot.createdAt)}</span>
                      <span>Wygasa: {formatDate(slot.expiresAt)}</span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
          <div className="absolute inset-x-0 bottom-0 z-10 h-4 bg-linear-to-t from-background to-transparent" />
        </div>

        <div className="space-y-3">
          <Button
            className="h-12 w-full rounded-xl"
            disabled={selectedSlots.length === 0}
            isLoading={isSubmitting}
            onClick={onConfirm}
            type="button"
          >
            Potwierdź pobranie ({selectedSlots.length})
          </Button>
        </div>
      </div>
    </ScannerBody>
  )
}
