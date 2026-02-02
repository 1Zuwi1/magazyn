import Image from "next/image"
import { SCANNER_ITEM_MAX_QUANTITY } from "@/config/constants"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
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
  onSubmit,
}: ScannerQuantityStepProps) {
  return (
    <ScannerBody>
      <div className="relative flex h-full flex-col">
        <CancelButton onClick={onCancel} />

        {/* Header */}
        <div className="mb-6">
          <h2 className="font-semibold text-xl tracking-tight">
            Podaj ilość przedmiotów
          </h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Ile sztuk chcesz dodać do magazynu?
          </p>
        </div>

        {/* Item preview card */}
        <div className="mb-6 flex-1">
          <div className="overflow-hidden rounded-xl border bg-card/50">
            <div className="flex gap-4 p-4">
              {scannedItem?.imageUrl && (
                <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <Image
                    alt={scannedItem.name || "Skanowany przedmiot"}
                    className="object-cover"
                    fill
                    src={scannedItem.imageUrl}
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-medium">
                  {scannedItem?.name || "Nieznany przedmiot"}
                </h3>
                {scannedItem?.expiresIn !== undefined && (
                  <p className="mt-1 text-muted-foreground text-sm">
                    Wygasa za{" "}
                    <span className="font-medium text-foreground">
                      {scannedItem.expiresIn}
                    </span>{" "}
                    dni
                  </p>
                )}
                {scannedItem?.weight !== undefined && (
                  <p className="text-muted-foreground text-sm">
                    Waga:{" "}
                    <span className="font-medium text-foreground">
                      {scannedItem.weight} kg
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quantity controls */}
        <div className="space-y-4">
          <div>
            <label
              className="mb-2 block font-medium text-sm"
              htmlFor="quantity"
            >
              Ilość przedmiotów
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
          <Button
            className="h-12 w-full rounded-xl"
            isLoading={isSubmitting}
            onClick={onSubmit}
            type="button"
          >
            Potwierdź
          </Button>
        </div>
      </div>
    </ScannerBody>
  )
}
