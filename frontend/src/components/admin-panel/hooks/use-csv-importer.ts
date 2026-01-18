"use client"

import * as Papa from "papaparse"
import { useState } from "react"
import { toast } from "sonner"
import type z from "zod"
import { CsvItemRowSchema, CsvRackRowSchema } from "@/lib/schemas/admin-schemas"

export type CsvImporterType = "rack" | "item"

type CsvRackRow = z.infer<typeof CsvRackRowSchema>
type CsvItemRow = z.infer<typeof CsvItemRowSchema>

export type CsvRowType<T extends CsvImporterType> = T extends "rack"
  ? CsvRackRow
  : CsvItemRow

interface UseCsvImporterProps<T extends CsvImporterType = CsvImporterType> {
  type: T
  onImport: (data: CsvRowType<T>[]) => void
}

const CONFIG = {
  rack: {
    schema: CsvRackRowSchema,
    headers: {
      symbol: "symbol",
      name: "name",
      rows: "rows",
      cols: "cols",
      mintemp: "minTemp",
      maxtemp: "maxTemp",
      maxweight: "maxWeight",
      maxitemwidth: "maxItemSize.width",
      maxitemheight: "maxItemSize.height",
      maxitemdepth: "maxItemSize.depth",
      comment: "comment",
    },
  },
  item: {
    schema: CsvItemRowSchema,
    headers: {
      name: "name",
      id: "id",
      imageurl: "imageUrl",
      mintemp: "minTemp",
      maxtemp: "maxTemp",
      weight: "weight",
      width: "dimensions.width",
      height: "dimensions.height",
      depth: "dimensions.depth",
      comment: "comment",
      daystoexpiry: "daysToExpiry",
      isdangerous: "isDangerous",
    },
  },
} as const

const BOM_HEADER_REGEX = /^\uFEFF/

function normalizeHeader(header: string): string {
  return header
    .replace(BOM_HEADER_REGEX, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "")
}

function parseCSV(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: ";",
      encoding: "UTF-8",
      transformHeader: normalizeHeader,
      complete: (results) => resolve(results.data),
      error: reject,
    })
  })
}

function mapRow(
  row: Record<string, string>,
  headerMap: Record<string, string>
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [csvKey, value] of Object.entries(row)) {
    const targetPath = headerMap[csvKey]
    if (!(targetPath && value?.trim())) {
      continue
    }

    const path = targetPath.split(".")
    let current: Record<string, unknown> = result

    for (let i = 0; i < path.length - 1; i++) {
      current[path[i]] = current[path[i]] || ({} as Record<string, unknown>)
      current = current[path[i]] as Record<string, unknown>
    }

    current[path.at(-1) as string] = value.trim()
  }

  return result
}

export function useCsvImporter<T extends CsvImporterType>({
  type,
  onImport,
}: UseCsvImporterProps<T>) {
  const [open, setOpen] = useState(false)
  const [rawPreviewData, setRawPreviewData] = useState<
    Record<string, string>[]
  >([])
  const [mappedData, setMappedData] = useState<Record<string, unknown>[]>([])

  const config = CONFIG[type]

  async function processFile(files: File[]) {
    if (!files[0]) {
      return
    }

    setRawPreviewData([])
    setMappedData([])

    const rawData = await parseCSV(files[0])
    const mapped = rawData.map((row) => mapRow(row, config.headers))

    setRawPreviewData(rawData)
    setMappedData(mapped)
  }

  function resetFile() {
    setRawPreviewData([])
    setMappedData([])
  }

  function confirmImport() {
    if (mappedData.length === 0) {
      toast.error("Brak danych do zaimportowania")
      return
    }

    const validatedRows: CsvRowType<T>[] = []

    mappedData.forEach((row, index) => {
      const result = config.schema.safeParse(row)

      if (result.success) {
        validatedRows.push(result.data as CsvRowType<T>)
      } else {
        toast.error(`Wiersz ${index + 2}: ${result.error.message}`)
      }
    })

    onImport(validatedRows)
    toast.success(`Zaimportowano ${validatedRows.length} wierszy`)
    setOpen(false)
    setRawPreviewData([])
    setMappedData([])
  }

  return {
    open,
    setOpen,
    isPreviewing: rawPreviewData.length > 0,
    processFile,
    confirmImport,
    previewRows: rawPreviewData,
    resetFile,
  }
}
