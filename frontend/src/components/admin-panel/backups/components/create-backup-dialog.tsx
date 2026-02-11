"use client"

import { AlertDiamondIcon, DatabaseIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { useAppTranslations } from "@/i18n/use-translations"
import { WarehouseSelector } from "./warehouse-selector"

interface CreateBackupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isSubmitting?: boolean
  onConfirm: (warehouseId: number | null, warehouseName: string | null) => void
}

export function CreateBackupDialog({
  open,
  onOpenChange,
  isSubmitting = false,
  onConfirm,
}: CreateBackupDialogProps) {
  const t = useAppTranslations()
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(
    null
  )
  const [selectedWarehouseName, setSelectedWarehouseName] = useState<
    string | null
  >(null)

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedWarehouseId(null)
      setSelectedWarehouseName(null)
    }
    onOpenChange(isOpen)
  }

  const handleConfirm = () => {
    onConfirm(selectedWarehouseId, selectedWarehouseName)
    handleOpenChange(false)
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex-row items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
            <HugeiconsIcon
              className="size-5 text-primary"
              icon={DatabaseIcon}
            />
          </div>
          <div className="space-y-1.5">
            <DialogTitle>
              {t("generated.admin.backups.createBackupTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("generated.admin.backups.createBackupDescription")}
            </DialogDescription>
          </div>
        </DialogHeader>

        <Separator />

        <div className="space-y-3 py-2">
          <div className="space-y-2">
            <label className="font-medium text-sm" htmlFor="warehouse-select">
              {t("generated.shared.warehouse")}
            </label>
            <WarehouseSelector
              allOptionLabel={t("generated.admin.backups.allWarehouses")}
              id="warehouse-select"
              includeAllOption
              onValueChange={(warehouseId, warehouseName) => {
                setSelectedWarehouseId(warehouseId)
                setSelectedWarehouseName(warehouseName)
              }}
              placeholder={t("generated.shared.searchWarehouse")}
              value={selectedWarehouseId}
            />
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-orange-500/30 border-l-[3px] border-l-orange-500 bg-orange-500/5 p-3">
            <HugeiconsIcon
              className="mt-0.5 size-4 shrink-0 text-orange-500"
              icon={AlertDiamondIcon}
            />
            <p className="text-orange-600 text-sm dark:text-orange-400">
              {selectedWarehouseId == null
                ? t("generated.admin.backups.createAllWarning")
                : t("generated.admin.backups.createWarehouseWarning", {
                    value0:
                      selectedWarehouseName ?? t("generated.shared.warehouse"),
                  })}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-1">
          <Button
            disabled={isSubmitting}
            onClick={() => handleOpenChange(false)}
            variant="outline"
          >
            {t("generated.shared.cancel")}
          </Button>
          <Button disabled={isSubmitting} onClick={handleConfirm}>
            {t("generated.admin.backups.createBackupAction")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
