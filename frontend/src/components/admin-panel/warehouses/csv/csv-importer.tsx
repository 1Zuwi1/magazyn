"use client"

import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
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
import {
  type CsvImporterType,
  type CsvRow,
  useCsvImporter,
} from "../../hooks/use-csv-importer"
import { FileUploader } from "./file-uploader"
import { PreviewTable } from "./preview-table"
import { ITEM_COLUMNS, RACK_COLUMNS } from "./utils/constants"

interface CsvImporterProps {
  type: CsvImporterType
  onImport: (data: CsvRow[]) => void
}

export function CsvImporter({ type, onImport }: CsvImporterProps) {
  const {
    open,
    setOpen,
    isPreviewing,
    processFile,
    confirmImport,
    previewRows,
    resetFile,
  } = useCsvImporter({ type, onImport })

  const columns = type === "rack" ? RACK_COLUMNS : ITEM_COLUMNS

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger
        className={cn(buttonVariants({ variant: "default" }), "w-fit gap-2")}
      >
        Importuj CSV
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Importuj CSV</DialogTitle>
        </DialogHeader>

        {isPreviewing ? (
          <PreviewTable
            columns={[...columns]}
            rows={previewRows as Record<string, string>[]}
          />
        ) : (
          <FileUploader onUpload={processFile} />
        )}

        <DialogFooter className="flex-row justify-between sm:justify-between">
          {isPreviewing ? (
            <>
              <Button
                onClick={() => {
                  setOpen(false)
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
