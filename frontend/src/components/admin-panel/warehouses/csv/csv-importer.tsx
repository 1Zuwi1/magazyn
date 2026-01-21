"use client"

import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  type CsvImporterType,
  type CsvRow,
  useCsvImporter,
} from "../../hooks/use-csv-importer"
import { FileUploader } from "./file-uploader"
import { PreviewTable } from "./preview-table"
import { ITEM_COLUMNS, RACK_COLUMNS } from "./utils/constants"

interface WarehouseOption {
  id: string
  name: string
}

interface CsvImporterProps {
  type: CsvImporterType
  onImport: (data: CsvRow[], warehouseId?: string) => void
  warehouses?: WarehouseOption[]
  triggerLabel?: string
  triggerClassName?: string
}

export function CsvImporter({ type, onImport, warehouses }: CsvImporterProps) {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("")

  const handleImport = (data: CsvRow[]) => {
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
  } = useCsvImporter({ type, onImport: handleImport })

  const columns = type === "rack" ? RACK_COLUMNS : ITEM_COLUMNS

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
      <DialogContent className="max-w-[95vw]">
        <DialogHeader>
          <DialogTitle>
            {type === "rack"
              ? "Importuj regały z CSV"
              : "Importuj przedmioty z CSV"}
          </DialogTitle>
          {needsWarehouseSelection && (
            <DialogDescription>
              Wybierz magazyn docelowy, do którego zostaną dodane regały
            </DialogDescription>
          )}
        </DialogHeader>

        {needsWarehouseSelection && !isPreviewing && (
          <div className="space-y-2">
            <label className="font-medium text-sm" htmlFor="warehouse-select">
              Magazyn docelowy
            </label>
            <Select
              onValueChange={(value) => {
                if (value) {
                  setSelectedWarehouseId(value)
                }
              }}
              value={selectedWarehouseId}
            >
              <SelectTrigger className="mt-2 w-full" id="warehouse-select">
                <SelectValue>
                  {selectedWarehouseId
                    ? warehouses.find((w) => w.id === selectedWarehouseId)?.name
                    : "Wybierz magazyn..."}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

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
              <Button onClick={resetFile} variant="destructive">
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
