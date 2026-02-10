import Image from "next/image"

import { SCANNER_ITEM_MAX_QUANTITY } from "@/config/constants"
import { useAppTranslations } from "@/i18n/use-translations"
import { Badge } from "../../ui/badge"
import { Button } from "../../ui/button"
import { Input } from "../../ui/input"
import { CancelButton } from "../cancel-button"
import { ScannerBody } from "../scanner-body"
import type { ScanItem } from "../scanner-types"

interface OutboundSelectQuantityProps {
  item: ScanItem
  quantity: number
  isSubmitting: boolean
  onCancel: () => void
  onDecrease: () => void
  onIncrease: () => void
  onQuantityChange: (value: number) => void
  onSubmit: () => void
}

export function OutboundSelectQuantity({
  item,
  quantity,
  isSubmitting,
  onCancel,
  onDecrease,
  onIncrease,
  onQuantityChange,
  onSubmit,
}: OutboundSelectQuantityProps) {
  const t = useAppTranslations()

  return (
    <ScannerBody>
      <div className="relative flex h-full flex-col">
        <CancelButton onClick={onCancel} />

        <div className="mb-6">
          <h2 className="font-semibold text-xl tracking-tight">
            {t("generated.scanner.outbound.howManyUnitsWantRemove")}
          </h2>
          <p className="mt-1 text-muted-foreground text-sm">
            {t("generated.scanner.outbound.enterQuantityRemoveWarehouse")}
          </p>
        </div>

        <div className="mb-6 flex-1">
          <div className="overflow-hidden rounded-xl border bg-card/50">
            <div className="flex gap-4 p-4">
              {item.photoUrl ? (
                <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <Image
                    alt={item.name}
                    className="object-cover"
                    fill
                    src={item.photoUrl}
                  />
                </div>
              ) : null}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="truncate font-medium">{item.name}</h3>
                  {item.dangerous ? (
                    <Badge>{t("generated.shared.dangerous")}</Badge>
                  ) : null}
                </div>
                <p className="mt-1 font-mono text-muted-foreground text-xs">
                  {t("generated.scanner.shared.code", {
                    value0: item.code,
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label
              className="mb-2 block font-medium text-sm"
              htmlFor="outbound-quantity"
            >
              {t("generated.scanner.outbound.quantityRemove")}
            </label>
            <div className="flex items-center gap-3">
              <Button
                className="size-12 rounded-xl text-xl"
                disabled={quantity <= 1}
                onClick={onDecrease}
                type="button"
                variant="outline"
              >
                −
              </Button>
              <Input
                className="no-spinners h-12 flex-1 rounded-xl text-center font-mono text-lg"
                id="outbound-quantity"
                max={SCANNER_ITEM_MAX_QUANTITY}
                min="1"
                onChange={(event) => {
                  const stringValue = event.target.value.trim()
                  if (stringValue === "") {
                    onQuantityChange(1)
                    return
                  }
                  const value = Number.parseInt(stringValue, 10)
                  if (!Number.isNaN(value)) {
                    const clampedValue = Math.min(
                      SCANNER_ITEM_MAX_QUANTITY,
                      Math.max(1, value)
                    )
                    onQuantityChange(clampedValue)
                  }
                }}
                type="number"
                value={quantity}
              />
              <Button
                className="size-12 rounded-xl text-xl"
                disabled={quantity >= SCANNER_ITEM_MAX_QUANTITY}
                onClick={onIncrease}
                type="button"
                variant="outline"
              >
                +
              </Button>
            </div>
          </div>

          <Button
            className="h-12 w-full rounded-xl"
            isLoading={isSubmitting}
            onClick={onSubmit}
            type="button"
          >
            {t("generated.scanner.outbound.generatePickLocations")}
          </Button>
        </div>
      </div>
    </ScannerBody>
  )
}
