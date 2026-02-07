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
import {
  ITEM_COLUMNS,
  RACK_COLUMNS,
  WAREHOUSE_COLUMNS,
} from "./utils/constants"
import type { CsvImporterType, CsvRowType } from "./utils/types"

interface CsvImporterProps<T extends CsvImporterType> {
  type: T
  isImporting?: boolean
  onImport: (payload: {
    file: File
    rows: CsvRowType<T>[]
  }) => Promise<void> | void
}

export function CsvImporter<T extends CsvImporterType>({
  isImporting = false,
  type,
  onImport,
}: CsvImporterProps<T>) {
  const handleImport = async ({
    file,
    rows,
  }: {
    file: File
    rows: CsvRowType<T>[]
  }): Promise<void> => {
    await onImport({ file, rows })
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

  let columns: ReadonlyArray<{ key: string; label: string }> = ITEM_COLUMNS
  if (type === "warehouse") {
    columns = WAREHOUSE_COLUMNS
  } else if (type === "rack") {
    columns = RACK_COLUMNS
  }

  let dialogTitle = "Importuj przedmioty z CSV"
  if (type === "warehouse") {
    dialogTitle = "Importuj magazyny z CSV"
  } else if (type === "rack") {
    dialogTitle = "Importuj regały z CSV"
  }

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
      <DialogContent className="max-h-[90vh] min-w-fit overflow-auto sm:min-w-125">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
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

        <DialogFooter className="justify-start! w-full flex-row gap-3">
          {isPreviewing ? (
            <>
              <Button
                disabled={isImporting}
                onClick={() => {
                  resetFile()
                }}
                variant="destructive"
              >
                Usuń
              </Button>
              <Button
                disabled={isImporting}
                onClick={async () => {
                  await confirmImport()
                }}
              >
                Importuj
                <HugeiconsIcon
                  className="ml-2 size-4"
                  icon={ArrowRight01Icon}
                />
              </Button>
            </>
          ) : (
            <Button
              disabled={isImporting}
              onClick={() => setOpen(false)}
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
