"use client"

import { DatabaseIcon } from "@hugeicons/core-free-icons"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import type { AvailableWarehouse } from "../types"

const ALL_WAREHOUSES_ID = "__all__"

interface CreateBackupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableWarehouses: AvailableWarehouse[]
  onConfirm: (warehouseId: string | null, warehouseName: string | null) => void
}

export function CreateBackupDialog({
  open,
  onOpenChange,
  availableWarehouses,
  onConfirm,
}: CreateBackupDialogProps) {
  const [selectedWarehouse, setSelectedWarehouse] =
    useState<string>(ALL_WAREHOUSES_ID)

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedWarehouse(ALL_WAREHOUSES_ID)
    }
    onOpenChange(isOpen)
  }

  const handleConfirm = () => {
    if (selectedWarehouse === ALL_WAREHOUSES_ID) {
      onConfirm(null, null)
    } else {
      const warehouse = availableWarehouses.find(
        (w) => w.id === selectedWarehouse
      )
      if (warehouse) {
        onConfirm(warehouse.id, warehouse.name)
      }
    }
    handleOpenChange(false)
  }

  const selectedLabel =
    selectedWarehouse === ALL_WAREHOUSES_ID
      ? "Wszystkie magazyny"
      : (availableWarehouses.find((w) => w.id === selectedWarehouse)?.name ??
        "Wybierz magazyn")

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex-row items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <HugeiconsIcon
              className="size-5 text-primary"
              icon={DatabaseIcon}
            />
          </div>
          <div className="space-y-1.5">
            <DialogTitle>Utwórz kopię zapasową</DialogTitle>
            <DialogDescription>
              Wybierz magazyn, dla którego chcesz utworzyć ręczną kopię
              zapasową.
            </DialogDescription>
          </div>
        </DialogHeader>

        <Separator />

        <div className="space-y-3 py-2">
          <div className="space-y-2">
            <label className="font-medium text-sm" htmlFor="warehouse-select">
              Magazyn
            </label>
            <Select
              onValueChange={(value) => {
                if (value) {
                  setSelectedWarehouse(value)
                }
              }}
              value={selectedWarehouse}
            >
              <SelectTrigger id="warehouse-select">
                <SelectValue>{selectedLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_WAREHOUSES_ID}>
                  Wszystkie magazyny
                </SelectItem>
                {availableWarehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border border-orange-500/30 bg-orange-500/5 p-3">
            <p className="text-orange-600 text-sm dark:text-orange-400">
              {selectedWarehouse === ALL_WAREHOUSES_ID
                ? "Zostanie utworzona kopia zapasowa dla wszystkich magazynów. Może to potrwać dłużej."
                : `Zostanie utworzona kopia zapasowa dla magazynu "${selectedLabel}".`}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-1">
          <Button onClick={() => handleOpenChange(false)} variant="outline">
            Anuluj
          </Button>
          <Button onClick={handleConfirm}>Utwórz kopię</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
