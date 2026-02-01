"use client"

import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
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
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("")

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
    previewHeaders,
    resetFile,
  } = useCsvImporter<T>({ type, onImport: handleImport })

  const columns = type === "rack" ? RACK_COLUMNS : ITEM_COLUMNS

  const previewColumns =
    previewHeaders.length > 0
      ? previewHeaders.map((header) => ({ key: header, label: header }))
      : columns

  const needsWarehouseSelection =
    type === "rack" && warehouses && warehouses.length > 0
  const canProceed = !needsWarehouseSelection || selectedWarehouseId

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setSelectedWarehouseId("")
    }
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger
        className={cn(buttonVariants({ variant: "default" }), "w-fit gap-2")}
      >
        Importuj CSV
      </DialogTrigger>
      <DialogContent className="min-w-fit">
        <DialogHeader>
          <DialogTitle>
            {type === "rack"
              ? "Importuj regały z CSV"
              : "Importuj przedmioty z CSV"}
          </DialogTitle>
        </DialogHeader>

        {isPreviewing ? (
          <PreviewTable
            columns={[...previewColumns]}
            rows={previewRows as Record<string, string>[]}
          />
        ) : (
          <div className={cn(!canProceed && "pointer-events-none opacity-50")}>
            <FileUploader onUpload={processFile} />
          </div>
        )}

        <DialogFooter className="w-full flex-row justify-center gap-3 sm:justify-center">
          {isPreviewing ? (
            <>
              <Button
                onClick={() => {
                  resetFile()
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
            <Button onClick={() => handleOpenChange(false)} variant="outline">
              Anuluj
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
