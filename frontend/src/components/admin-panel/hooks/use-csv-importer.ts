"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useAppTranslations } from "@/i18n/use-translations"
import { MAX_TOAST_ROWS } from "../lib/constants"
import { formatBytes } from "../lib/utils"
import { DEFAULT_CONFIG } from "../warehouses/csv/utils/constants"
import { parseCsvFile } from "../warehouses/csv/utils/csv-utils"
import type {
  CsvImporterType,
  CsvParseError,
  CsvRowType,
} from "../warehouses/csv/utils/types"

interface UseCsvImporterProps<T extends CsvImporterType> {
  type: T
  maxFileSizeInBytes?: number
  onImport: (payload: {
    file: File
    rows: CsvRowType<T>[]
  }) => Promise<void> | void
}

export function useCsvImporter<T extends CsvImporterType>({
  type,
  maxFileSizeInBytes = DEFAULT_CONFIG.maxSizeInBytes,
  onImport,
}: UseCsvImporterProps<T>) {
  const t = useAppTranslations()

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
    if (file.size > maxFileSizeInBytes) {
      toast.error(
        t("generated.admin.warehouses.formattedValue", {
          value0: file.name,
          value1: `File is too large. Maximum size: ${formatBytes(maxFileSizeInBytes)}.`,
        })
      )
      return false
    }

    try {
      const result = await parseCsvFile(file, type, t)
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
            ? t("generated.admin.shared.more", {
                value0: remaining,
              })
            : ""

        toast.error(
          t("generated.admin.shared.csvParsingErrors", {
            value0: result.errors.length,
          }),
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
      toast.error(t("generated.admin.shared.csvFileFailedProcess"))
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
      toast.error(t("generated.admin.shared.csvFileContainsErrorsCorrect"))
      return
    }

    if (!sourceFile) {
      toast.error(t("generated.admin.shared.firstSelectCsvFile"))
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
