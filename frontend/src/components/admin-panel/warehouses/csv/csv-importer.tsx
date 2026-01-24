"use client"

import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useCsvImporter } from "../../hooks/use-csv-importer"
import { FileUploader } from "./file-uploader"
import { PreviewTable } from "./preview-table"
import { ITEM_COLUMNS, RACK_COLUMNS } from "./utils/constants"
import type { CsvImporterType, CsvRowType } from "./utils/types"

interface WarehouseOption {
  id: string
  name: string
}

interface CsvImporterProps<T extends CsvImporterType> {
  type: T
  onImport: (data: CsvRowType<T>[], warehouseId?: string) => void
  warehouses?: WarehouseOption[]
}

export function CsvImporter<T extends CsvImporterType>({
  type,
  onImport,
  warehouses,
}: CsvImporterProps<T>) {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("")
  const [itemName, setItemName] = useState<string>("")

  const handleImport = (data: CsvRowType<T>[]): void => {
    onImport(data, selectedWarehouseId || undefined)
  }

  const {
    open,
    setOpen,
    isPreviewing,
    processFile,
    confirmImport,
    previewRows,
    resetFile,
  } = useCsvImporter<T>({ type, onImport: handleImport })

  const columns = type === "rack" ? RACK_COLUMNS : ITEM_COLUMNS

  const needsWarehouseSelection =
    type === "rack" && warehouses && warehouses.length > 0
  const canProceed = !needsWarehouseSelection || selectedWarehouseId

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setSelectedWarehouseId("")
      setItemName("")
    }
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger
        className={cn(buttonVariants({ variant: "default" }), "w-fit gap-2")}
      >
        Importuj CSV
      </DialogTrigger>
      <DialogContent className="flex max-h-[90vh] max-w-[95vw] flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {type === "rack"
              ? "Importuj regały z CSV"
              : "Importuj przedmioty z CSV"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="item-name">
            {type === "rack" ? "Nazwa regału" : "Nazwa asortymentu"}
          </Label>
          <Input
            id="item-name"
            onChange={(e) => setItemName(e.target.value)}
            placeholder={
              type === "rack"
                ? "Wprowadź nazwę regału..."
                : "Wprowadź nazwę asortymentu..."
            }
            value={itemName}
          />
        </div>

        {isPreviewing ? (
          <PreviewTable
            columns={[...columns]}
            rows={previewRows as Record<string, string>[]}
          />
        ) : (
          <div className={cn(!canProceed && "pointer-events-none opacity-50")}>
            <FileUploader onUpload={processFile} />
          </div>
        )}

        <DialogFooter className="flex-row justify-between sm:justify-between">
          {isPreviewing ? (
            <>
              <Button
                onClick={() => {
                  resetFile()
                }}
                variant="outline"
              >
                <HugeiconsIcon className="mr-2 size-4" icon={ArrowLeft01Icon} />
                Wróć
              </Button>
              <Button
                onClick={() => {
                  resetFile()
                  setItemName("")
                }}
                variant="destructive"
              >
                Usuń
              </Button>
              <Button onClick={confirmImport}>
                Importuj
                <HugeiconsIcon
                  className="ml-2 size-4"
                  icon={ArrowRight01Icon}
                />
              </Button>
            </>
          ) : (
            <Button
              className="ml-auto"
              onClick={() => handleOpenChange(false)}
              variant="outline"
            >
              Anuluj
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
