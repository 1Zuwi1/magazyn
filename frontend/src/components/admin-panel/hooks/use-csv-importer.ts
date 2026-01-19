"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  type CsvImporterType,
  type CsvParseError,
  type CsvRow,
  parseCsvFile,
} from "../warehouses/csv/utils/csv-utils"

export type { CsvImporterType, CsvRow } from "../warehouses/csv/utils/csv-utils"

interface UseCsvImporterProps {
  type: CsvImporterType
  onImport: (data: CsvRow[]) => void
}

export function useCsvImporter({ type, onImport }: UseCsvImporterProps) {
  const [open, setOpen] = useState(false)
  const [rawPreviewData, setRawPreviewData] = useState<
    Record<string, string>[]
  >([])
  const [validatedData, setValidatedData] = useState<CsvRow[]>([])
  const [parseErrors, setParseErrors] = useState<CsvParseError[]>([])

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
      toast.error("Wystąpił błąd podczas parsowania CSV", {
        description: result.errors
          .map((e) => `Wiersz ${e.row}: ${e.message}`)
          .join("\n"),
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
    toast.success(`Zaimportowano ${validatedData.length} wierszy`, {
      description: validatedData.map((d) => JSON.stringify(d)).join("\n"),
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
    resetFile,
    errorCount: parseErrors.length,
    validRowCount: validatedData.length,
  }
}
