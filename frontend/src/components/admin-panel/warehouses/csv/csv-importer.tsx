"use client"

import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useTranslations } from "next-intl"
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
  getItemColumns,
  getRackColumns,
  getWarehouseColumns,
} from "./utils/constants"
import type { CsvImporterType, CsvRowType } from "./utils/types"

interface CsvImporterProps<T extends CsvImporterType> {
  type: T
  isImporting?: boolean
  maxFileSizeInBytes?: number
  onImport: (payload: {
    file: File
    rows: CsvRowType<T>[]
  }) => Promise<void> | void
}

export function CsvImporter<T extends CsvImporterType>({
  isImporting = false,
  maxFileSizeInBytes,
  type,
  onImport,
}: CsvImporterProps<T>) {
  const t = useTranslations()

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
  } = useCsvImporter<T>({
    type,
    maxFileSizeInBytes,
    onImport: handleImport,
  })

  let columns: ReadonlyArray<{ key: string; label: string }> = getItemColumns(t)
  if (type === "warehouse") {
    columns = getWarehouseColumns(t)
  } else if (type === "rack") {
    columns = getRackColumns(t)
  }

  let dialogTitle = "Importuj przedmioty z CSV"
  if (type === "warehouse") {
    dialogTitle = "Importuj magazyny z CSV"
  } else if (type === "rack") {
    dialogTitle = t("generated.admin.warehouses.importRacksCsv")
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
        {t("generated.admin.warehouses.importCsv")}
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
            <FileUploader
              maxFileSizeInBytes={maxFileSizeInBytes}
              onUpload={processFile}
            />
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
                {t("generated.shared.remove")}
              </Button>
              <Button
                disabled={isImporting}
                onClick={async () => {
                  await confirmImport()
                }}
              >
                {t("generated.admin.warehouses.import")}
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
              {t("generated.shared.cancel")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
