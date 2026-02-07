"use client"

import { useState } from "react"
import { toast } from "sonner"
import { MAX_TOAST_ROWS } from "../lib/constants"
import { parseCsvFile } from "../warehouses/csv/utils/csv-utils"
import type {
  CsvImporterType,
  CsvParseError,
  CsvRowType,
} from "../warehouses/csv/utils/types"

interface UseCsvImporterProps<T extends CsvImporterType> {
  type: T
  onImport: (payload: {
    file: File
    rows: CsvRowType<T>[]
  }) => Promise<void> | void
}

export function useCsvImporter<T extends CsvImporterType>({
  type,
  onImport,
}: UseCsvImporterProps<T>) {
  const [open, setOpen] = useState(false)
  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [rawPreviewData, setRawPreviewData] = useState<
    Record<string, string>[]
  >([])
  const [validatedData, setValidatedData] = useState<CsvRowType<T>[]>([])
  const [parseErrors, setParseErrors] = useState<CsvParseError[]>([])
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([])

  async function processFile(files: File[]) {
    const [file] = files
    if (!file) {
      return
    }

    resetFile()
    setSourceFile(file)

    try {
      const result = await parseCsvFile(file, type)
      setRawPreviewData(result.rawRows)
      setValidatedData(result.rows)
      setParseErrors(result.errors)
      setPreviewHeaders(result.headers)

      if (result.errors.length > 0) {
        const displayedErrors = result.errors
          .slice(0, MAX_TOAST_ROWS)
          .map((e) => `Wiersz ${e.row}: ${e.message}`)
          .join("\n")

        const remaining = result.errors.length - MAX_TOAST_ROWS
        const suffix = remaining > 0 ? `\n...i ${remaining} więcej` : ""

        toast.error(`Błędy parsowania CSV (${result.errors.length})`, {
          description: displayedErrors + suffix,
        })
      }
    } catch {
      toast.error("Nie udało się przetworzyć pliku CSV")
      resetFile()
    }
  }

  function resetFile() {
    setSourceFile(null)
    setRawPreviewData([])
    setValidatedData([])
    setParseErrors([])
    setPreviewHeaders([])
  }

  async function confirmImport() {
    if (!sourceFile) {
      toast.error("Najpierw wybierz plik CSV")
      return
    }

    await onImport({
      file: sourceFile,
      rows: validatedData,
    })

    setOpen(false)
    resetFile()
  }

  return {
    open,
    setOpen,
    isPreviewing: rawPreviewData.length > 0,
    processFile,
    confirmImport,
    previewRows: rawPreviewData,
    previewHeaders,
    resetFile,
    errorCount: parseErrors.length,
    validRowCount: validatedData.length,
  }
}
