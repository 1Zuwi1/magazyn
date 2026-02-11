import { useTranslations } from "next-intl"
import { SCANNER_ITEM_MAX_QUANTITY } from "@/config/constants"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { ItemPhoto } from "../ui/item-photo"
import { Label } from "../ui/label"
import { Switch } from "../ui/switch"
import { CancelButton } from "./cancel-button"
import { ScannerBody } from "./scanner-body"
import type { ScanItem } from "./scanner-types"

interface ScannerQuantityStepProps {
  scannedItem: ScanItem
  quantity: number
  isSubmitting: boolean
  onCancel: () => void
  onDecrease: () => void
  onIncrease: () => void
  onQuantityChange: (value: number) => void
  reserve: boolean
  onReserveChange: (value: boolean) => void
  onSubmit: () => void
}

export function ScannerQuantityStep({
  scannedItem,
  quantity,
  isSubmitting,
  onCancel,
  onDecrease,
  onIncrease,
  onQuantityChange,
  reserve,
  onReserveChange,
  onSubmit,
}: ScannerQuantityStepProps) {
  const t = useTranslations()

  return (
    <ScannerBody>
      <div className="relative flex h-full flex-col">
        <CancelButton onClick={onCancel} />

        <div className="mb-6">
          <h2 className="font-semibold text-xl tracking-tight">
            {t("generated.scanner.enterItemQuantity")}
          </h2>
          <p className="mt-1 text-muted-foreground text-sm">
            {t("generated.scanner.howManyUnitsWantAdd")}
          </p>
        </div>

        <div className="mb-6 flex-1">
          <div className="overflow-hidden rounded-xl border bg-card/50">
            <div className="flex gap-4 p-4">
              <ItemPhoto
                alt={scannedItem.name}
                containerClassName="size-20 shrink-0"
                iconClassName="size-6 text-muted-foreground"
                imageClassName="object-cover"
                src={`/api/items/${scannedItem.id}/photo`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="truncate font-medium">{scannedItem.name}</h3>
                  {scannedItem.dangerous ? (
                    <Badge>{t("generated.shared.dangerous")}</Badge>
                  ) : null}
                </div>
                <p className="mt-1 font-mono text-muted-foreground text-xs">
                  {t("generated.scanner.shared.code", {
                    value0: scannedItem.code,
                  })}
                </p>
                <p className="mt-2 text-muted-foreground text-sm">
                  {t("generated.scanner.expires")}{" "}
                  <span className="font-medium text-foreground">
                    {scannedItem.expireAfterDays}
                  </span>{" "}
                  {t("generated.scanner.days")}
                </p>
                <p className="text-muted-foreground text-sm">
                  {t("generated.scanner.temperature")}{" "}
                  <span className="font-medium text-foreground">
                    {t("generated.shared.cC", {
                      value0: scannedItem.minTemp.toString(),
                      value1: scannedItem.maxTemp.toString(),
                    })}
                  </span>
                </p>
                <p className="text-muted-foreground text-sm">
                  {t("generated.scanner.weight")}{" "}
                  <span className="font-medium text-foreground">
                    {scannedItem.weight} {t("generated.shared.kg")}
                  </span>
                </p>
                <p className="text-muted-foreground text-sm">
                  {t("generated.scanner.dimensions")}{" "}
                  <span className="font-medium text-foreground">
                    {scannedItem.sizeX} × {scannedItem.sizeY} ×{" "}
                    {scannedItem.sizeZ}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label
              className="mb-2 block font-medium text-sm"
              htmlFor="quantity"
            >
              {t("generated.scanner.itemQuantity")}
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
                id="quantity"
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

          <div className="flex items-center justify-between rounded-xl border bg-card/30 p-3">
            <div>
              <Label htmlFor="reserve-toggle">
                {t("generated.scanner.reserveLocations")}
              </Label>
              <p className="text-muted-foreground text-xs">
                {t("generated.scanner.lockPositionsUntilPlacementConfirmation")}
              </p>
            </div>
            <Switch
              checked={reserve}
              id="reserve-toggle"
              onCheckedChange={onReserveChange}
            />
          </div>

          <Button
            className="h-12 w-full rounded-xl"
            isLoading={isSubmitting}
            onClick={onSubmit}
            type="button"
          >
            {t("generated.scanner.generateLocations")}
          </Button>
        </div>
      </div>
    </ScannerBody>
  )
}
