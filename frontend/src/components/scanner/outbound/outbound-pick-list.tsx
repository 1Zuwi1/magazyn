import {
  AlertCircleIcon,
  Location04Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useLocale } from "next-intl"
import { formatDateTimeLabel } from "@/components/dashboard/utils/helpers"
import { useAppTranslations } from "@/i18n/use-translations"
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
  const t = useAppTranslations()

  const locale = useLocale()
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
              {t("generated.scanner.outbound.itemsPick")}
            </h2>
            <p className="mt-1 text-muted-foreground text-sm">
              {t("generated.scanner.outbound.selectItemsRemoveRacks", {
                value0: plan.itemName,
              })}
            </p>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl border bg-card/40 p-3 text-center">
            <p className="text-muted-foreground text-xs">
              {t("generated.scanner.outbound.requested")}
            </p>
            <p className="font-semibold text-lg">{plan.requestedQuantity}</p>
          </div>
          <div className="rounded-xl border bg-card/40 p-3 text-center">
            <p className="text-muted-foreground text-xs">
              {t("generated.scanner.outbound.available")}
            </p>
            <p className="font-semibold text-lg">{plan.availableQuantity}</p>
          </div>
          <div className="rounded-xl border bg-card/40 p-3 text-center">
            <p className="text-muted-foreground text-xs">
              {t("generated.scanner.outbound.selected")}
            </p>
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
              {t("generated.scanner.outbound.pluralLabel", {
                value0: plan.expiredQuantity,
              })}
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
                      {expired ? (
                        <Badge variant="destructive">
                          {t("generated.shared.expired")}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 font-mono text-muted-foreground text-xs">
                      {slot.assortmentCode}
                    </p>
                    <div className="mt-1 flex gap-3 text-muted-foreground text-xs">
                      <span>
                        {t("generated.scanner.outbound.received", {
                          value0: formatDateTimeLabel(slot.createdAt, locale),
                        })}
                      </span>
                      <span>
                        {t("generated.scanner.outbound.expires", {
                          value0: formatDateTimeLabel(slot.expiresAt, locale),
                        })}
                      </span>
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
            {t("generated.scanner.outbound.confirmPick", {
              value0: selectedSlots.length,
            })}
          </Button>
        </div>
      </div>
    </ScannerBody>
  )
}
