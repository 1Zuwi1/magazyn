import Image from "next/image"
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
        <div className="mb-6 flex-1">
          <h2 className="mb-2 font-semibold text-xl">
            Podaj ilość przedmiotów
          </h2>
          <p className="text-muted-foreground">
            Ile sztuk chcesz dodać do magazynu?
          </p>
        </div>
        <div className="h-full">
          {scannedItem?.imageUrl && (
            <Image
              alt={scannedItem.name || "Skanowany przedmiot"}
              className="mb-4 max-h-40 w-auto rounded-md object-cover"
              height={160}
              src={scannedItem.imageUrl}
              width={160}
            />
          )}
          <div className="mb-4">
            <h3 className="font-medium text-lg">
              {scannedItem?.name || "Nieznany przedmiot"}
            </h3>
            {scannedItem?.expiresIn !== undefined && (
              <p className="text-muted-foreground text-sm">
                Data przeterminowania za około {scannedItem.expiresIn} dni
              </p>
            )}
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label
              className="mb-2 block font-medium text-sm"
              htmlFor="quantity"
            >
              Ilość przedmiotów
            </label>
            <div className="flex items-center gap-2">
              <Button
                disabled={quantity <= 1}
                onClick={onDecrease}
                size={"icon-lg"}
                type="button"
                variant={"outline"}
              >
                −
              </Button>
              <Input
                className="h-10 w-20 text-center text-lg"
                id="quantity"
                min="1"
                onChange={(event) => {
                  const value = Number.parseInt(event.target.value, 10)
                  if (!Number.isNaN(value)) {
                    onQuantityChange(Math.max(1, value))
                  }
                }}
                value={quantity}
              />
              <Button
                onClick={onIncrease}
                size={"icon-lg"}
                type="button"
                variant={"outline"}
              >
                +
              </Button>
            </div>
          </div>
          <Button
            className="w-full"
            disabled={isSubmitting}
            onClick={onSubmit}
            type="button"
          >
            {isSubmitting ? "Przetwarzanie..." : "Potwierdź"}
          </Button>
        </div>
      </div>
    </ScannerBody>
  )
}
