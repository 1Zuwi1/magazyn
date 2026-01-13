"use client"

import Image from "next/image"
import { useTranslations } from "next-intl"
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
  const t = useTranslations("scanner")
  return (
    <ScannerBody>
      <div className="relative flex h-full flex-col">
        <CancelButton onClick={onCancel} />
        <div className="mb-6 flex-1">
          <h2 className="mb-2 font-semibold text-xl">{t("quantity.title")}</h2>
          <p className="text-muted-foreground">{t("quantity.subtitle")}</p>
        </div>
        <div className="h-full">
          {scannedItem?.imageUrl && (
            <Image
              alt={scannedItem.name || t("quantity.imageAlt")}
              className="mb-4 max-h-40 w-auto rounded-md object-cover"
              height={160}
              src={scannedItem.imageUrl}
              width={160}
            />
          )}
          <div className="mb-4">
            <h3 className="font-medium text-lg">
              {scannedItem?.name || t("quantity.unknownItem")}
            </h3>
            {scannedItem?.expiresIn !== undefined && (
              <p className="text-muted-foreground text-sm">
                {t("quantity.expiry", { days: scannedItem.expiresIn })}
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
              {t("quantity.label")}
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
                className="no-spinners h-10 w-20 text-center text-lg"
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
                disabled={quantity >= SCANNER_ITEM_MAX_QUANTITY}
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
            isLoading={isSubmitting}
            onClick={onSubmit}
            type="button"
          >
            {t("actions.confirm")}
          </Button>
        </div>
      </div>
    </ScannerBody>
  )
}
