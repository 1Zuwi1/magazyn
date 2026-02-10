"use client"

import { useState } from "react"
import { toast } from "sonner"
import { translateMessage } from "@/i18n/translate-message"
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

  async function processFile(files: File[]): Promise<boolean> {
    const [file] = files
    if (!file) {
      return false
    }

    resetFile()

    try {
      const result = await parseCsvFile(file, type)
      setParseErrors(result.errors)

      if (result.errors.length > 0) {
        setSourceFile(null)

        const displayedErrors = result.errors
          .slice(0, MAX_TOAST_ROWS)
          .map((e) => `Wiersz ${e.row}: ${e.message}`)
          .join("\n")

        const remaining = result.errors.length - MAX_TOAST_ROWS
        const suffix =
          remaining > 0
            ? translateMessage("generated.m0197", { value0: remaining })
            : ""

        toast.error(
          translateMessage("generated.m0198", { value0: result.errors.length }),
          {
            description: displayedErrors + suffix,
          }
        )
        return false
      }

      setSourceFile(file)
      setRawPreviewData(result.rawRows)
      setValidatedData(result.rows)
      setPreviewHeaders(result.headers)
      return true
    } catch {
      toast.error(translateMessage("generated.m0199"))
      resetFile()
      return false
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
    if (parseErrors.length > 0) {
      toast.error(translateMessage("generated.m0200"))
      return
    }

    if (!sourceFile) {
      toast.error(translateMessage("generated.m0201"))
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
