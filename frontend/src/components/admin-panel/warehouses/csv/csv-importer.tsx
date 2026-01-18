"use client"

import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type React from "react"
import { useCallback, useState } from "react"
import { toast } from "sonner"
import type z from "zod"
import { pluralize } from "@/components/dashboard/utils/helpers"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type {
  CsvItemRowSchema,
  CsvRackRowSchema,
} from "@/lib/schemas/admin-schemas"
import { cn } from "@/lib/utils"
import { parseCsvData } from "../../lib/csv-parse"
import { FileUploader } from "./file-uploader"

type CsvRackRow = z.infer<typeof CsvRackRowSchema>
type CsvItemRow = z.infer<typeof CsvItemRowSchema>

type CsvImporterType = "rack" | "item"

type CsvRowType<T extends CsvImporterType> = T extends "rack"
  ? CsvRackRow
  : CsvItemRow

interface CsvImporterProps<T extends CsvImporterType> {
  children: React.ReactNode
  type: T
  onImport: (data: CsvRowType<T>[]) => void
  className?: string
}

interface ParsedState<T extends CsvImporterType> {
  headers: string[]
  rows: CsvRowType<T>[]
  rawRows: Record<string, string>[]
  errors: { row: number; message: string }[]
}

const RACK_COLUMNS = [
  { key: "symbol", label: "Symbol" },
  { key: "name", label: "Nazwa" },
  { key: "rows", label: "Wiersze" },
  { key: "cols", label: "Kolumny" },
  { key: "minTemp", label: "Min. temp." },
  { key: "maxTemp", label: "Max. temp." },
  { key: "maxWeight", label: "Max. waga" },
] as const

const ITEM_COLUMNS = [
  { key: "id", label: "ID" },
  { key: "name", label: "Nazwa" },
  { key: "minTemp", label: "Min. temp." },
  { key: "maxTemp", label: "Max. temp." },
  { key: "weight", label: "Waga" },
  { key: "daysToExpiry", label: "Dni do wygaśnięcia" },
] as const

const MAX_PREVIEW_ROWS = 10

export function CsvImporter<T extends CsvImporterType>({
  children,
  type,
  onImport,
  className,
}: CsvImporterProps<T>) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<"upload" | "preview">("upload")
  const [files, setFiles] = useState<File[]>([])
  const [parsed, setParsed] = useState<ParsedState<T> | null>(null)

  const columns = type === "rack" ? RACK_COLUMNS : ITEM_COLUMNS

  const handleClose = useCallback(() => {
    setOpen(false)
    setStep("upload")
    setFiles([])
    setParsed(null)
  }, [])

  const handleUpload = useCallback(
    async (uploadedFiles: File[]) => {
      const file = uploadedFiles[0]
      if (!file) {
        return
      }

      try {
        const text = await file.text()
        const result = parseCsvData<CsvRowType<T>>(text, { type })

        if (result.errors.length > 0 && result.rows.length === 0) {
          const errorMessages = result.errors
            .slice(0, 3)
            .map(
              (e: { row: number; message: string }) =>
                `Wiersz ${e.row}: ${e.message}`
            )
            .join("\n")
          toast.error(`Błędy parsowania CSV:\n${errorMessages}`)
          return
        }

        if (result.rows.length === 0) {
          toast.error("Plik CSV nie zawiera prawidłowych danych")
          return
        }

        setParsed(result)
        setStep("preview")

        if (result.errors.length > 0) {
          toast.warning(`Pominięto ${result.errors.length} wierszy z błędami`)
        }
      } catch {
        toast.error("Nie udało się przetworzyć pliku CSV")
      }
    },
    [type]
  )

  const handleImport = useCallback(() => {
    if (!parsed || parsed.rows.length === 0) {
      toast.error("Brak danych do zaimportowania")
      return
    }

    onImport(parsed.rows)
    handleClose()
    toast.success(`Zaimportowano ${parsed.rows.length} wierszy`)
  }, [parsed, onImport, handleClose])

  const handleBack = useCallback(() => {
    setStep("upload")
    setFiles([])
    setParsed(null)
  }, [])

  const displayRows = parsed?.rows.slice(0, MAX_PREVIEW_ROWS) ?? []
  const totalRows = parsed?.rows.length ?? 0

  return (
    <Dialog
      onOpenChange={(isOpen) => {
        if (isOpen) {
          setOpen(true)
        } else {
          handleClose()
        }
      }}
      open={open}
    >
      <DialogTrigger
        className={cn("w-fit", className)}
        render={children as React.ReactElement}
      />

      {step === "upload" ? (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importuj CSV</DialogTitle>
            <DialogDescription>
              Wybierz i upuść plik CSV lub kliknij aby wybrać plik z dysku.
            </DialogDescription>
          </DialogHeader>
          <FileUploader
            onUpload={handleUpload}
            onValueChange={setFiles}
            value={files}
          />
        </DialogContent>
      ) : (
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Podgląd danych</DialogTitle>
            <DialogDescription>
              Sprawdź dane przed importem. Znaleziono {totalRows}{" "}
              {pluralize(totalRows, "wiersz", "wiersze", "wierszy")}.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="w-full">
            <div className="max-h-80">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((col) => (
                      <TableHead className="whitespace-nowrap" key={col.key}>
                        {col.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayRows.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {columns.map((col) => (
                        <TableCell className="max-w-40 truncate" key={col.key}>
                          {String(row[col.key as keyof typeof row])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {totalRows > MAX_PREVIEW_ROWS && (
            <p className="text-center text-muted-foreground text-sm">
              Wyświetlono {MAX_PREVIEW_ROWS} z {totalRows} wierszy
            </p>
          )}

          <DialogFooter className="flex-row justify-between sm:justify-between">
            <Button onClick={handleBack} variant="outline">
              <HugeiconsIcon className="mr-2 size-4" icon={ArrowLeft01Icon} />
              Wróć
            </Button>
            <Button onClick={handleImport}>
              Importuj
              <HugeiconsIcon className="ml-2 size-4" icon={ArrowRight01Icon} />
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  )
}
