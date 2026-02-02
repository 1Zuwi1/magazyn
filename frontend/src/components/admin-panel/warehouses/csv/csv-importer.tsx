"use client"

import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useMemo } from "react"
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

interface CsvImporterProps<T extends CsvImporterType> {
  type: T
  onImport: (data: CsvRowType<T>[]) => void
}

export function CsvImporter<T extends CsvImporterType>({
  type,
  onImport,
}: CsvImporterProps<T>) {
  const handleImport = (data: CsvRowType<T>[]): void => {
    onImport(data)
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

  const labels = useMemo(() => {
    const map: Record<string, string> = {}
    for (const column of columns) {
      map[column.key.toLowerCase()] = column.label
    }
    return map
  }, [columns])

  const previewColumns = useMemo(() => {
    return previewHeaders.map((header) => ({
      key: header,
      label: labels[header.toLowerCase()] || header,
    }))
  }, [previewHeaders, labels])

  return (
    <Dialog
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) {
          resetFile()
        }
      }}
      open={open}
    >
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
          <div>
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
            <Button onClick={() => setOpen(false)} variant="outline">
              Anuluj
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
