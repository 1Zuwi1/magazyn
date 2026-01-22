"use client"

import { useState } from "react"
import { toast } from "sonner"
import { parseCsvFile } from "../warehouses/csv/utils/csv-utils"
import type { CsvParseError, CsvRowType } from "../warehouses/csv/utils/types"

interface UseCsvImporterProps<T extends "rack" | "item"> {
  type: T
  onImport: (data: CsvRowType<T>[]) => void
}

export function useCsvImporter<T extends "rack" | "item">({
  type,
  onImport,
}: UseCsvImporterProps<T>) {
  const [open, setOpen] = useState(false)
  const [rawPreviewData, setRawPreviewData] = useState<
    Record<string, string>[]
  >([])
  const [validatedData, setValidatedData] = useState<CsvRowType<T>[]>([])
  const [parseErrors, setParseErrors] = useState<CsvParseError[]>([])

  const MAX_TOAST_ROWS = 7

  async function processFile(files: File[]) {
    const file = files[0]
    if (!file) {
      return
    }

    setRawPreviewData([])
    setValidatedData([])
    setParseErrors([])

    const result = await parseCsvFile(file, type)

    setRawPreviewData(result.rawRows)
    setValidatedData(result.rows)
    setParseErrors(result.errors)

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
  }

  function resetFile() {
    setRawPreviewData([])
    setValidatedData([])
    setParseErrors([])
  }

  function confirmImport() {
    if (validatedData.length === 0) {
      toast.error("Brak poprawnych danych do zaimportowania")
      return
    }

    onImport(validatedData)
    toast.success(`Zaimportowano ${validatedData.length} wierszy`)
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
    resetFile,
    errorCount: parseErrors.length,
    validRowCount: validatedData.length,
  }
}
